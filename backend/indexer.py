import os
import asyncio
import threading
import json
import django
from http.server import BaseHTTPRequestHandler, HTTPServer
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.hash.selector import get_selector_from_name
from dotenv import load_dotenv

# --- DJANGO INITIALIZATION ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
try:
    django.setup()
except Exception:
    pass 
from marketplace.models import Job, Bid

load_dotenv()

RPC_URL = os.getenv("STARKNET_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Selectors
JOB_CREATED_SELECTOR = get_selector_from_name("JobCreated")

# --- INDEXER LOGIC ---
async def monitor():
    print(f"📡 INDEXER: Connecting to RPC...")
    client = FullNodeClient(node_url=RPC_URL)
    
    try:
        latest_b = await client.get_block_number()
        # BIG CATCHUP: Look back 10,000 blocks to find every job ever created
        last_block = latest_b - 10000 
        print(f"🚀 INDEXER: Historical Catch-up started from block {last_block}...")
    except Exception as e:
        print(f"❌ INDEXER: RPC Connection Error: {e}")
        return

    while True:
        try:
            current_block = await client.get_block_number()
            if current_block > last_block:
                # Process in chunks of 50 blocks for the catch-up phase
                end_block = min(last_block + 50, current_block)
                print(f"🔍 INDEXER: Scanning {last_block + 1} to {end_block}...")
                
                events_response = await client.get_events(
                    address=CONTRACT_ADDRESS,
                    from_block_number=last_block + 1,
                    to_block_number=end_block,
                    chunk_size=20
                )

                for event in events_response.events:
                    selector = event.keys[0]

                    if selector == JOB_CREATED_SELECTOR:
                        onchain_id = event.data[0]
                        employer_hex = hex(event.data[1])
                        employer_int = int(employer_hex, 16)
                        
                        print(f"✨ INDEXER: Found JobCreated on-chain. ID: {onchain_id} by {employer_hex}")

                        # Match using integer logic
                        unsynced_jobs = Job.objects.filter(onchain_id__isnull=True)
                        for job in unsynced_jobs:
                            # Normalize stored address to int for comparison
                            try:
                                stored_int = int(job.employer_address, 16)
                                if stored_int == employer_int:
                                    job.onchain_id = onchain_id
                                    job.save()
                                    print(f"🔗 INDEXER: LINKED '{job.title}' to ID {onchain_id}")
                                    break
                            except:
                                continue

                last_block = end_block
                
                # If we are catching up, don't sleep much. If we are at the tip, sleep 15s.
                if last_block < current_block:
                    await asyncio.sleep(1) 
                else:
                    await asyncio.sleep(15)
            else:
                await asyncio.sleep(15)
        except Exception as e:
            print(f"⚠️ INDEXER Loop Warning: {e}")
            await asyncio.sleep(10)

# --- HEALTH CHECK SERVER ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Alive")
    def do_HEAD(self):
        self.send_response(200)
        self.end_headers()

def run_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    server.serve_forever()

if __name__ == "__main__":
    threading.Thread(target=run_health_server, daemon=True).start()
    asyncio.run(monitor())
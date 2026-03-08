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
from marketplace.models import Job

load_dotenv()

RPC_URL = os.getenv("STARKNET_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
JOB_CREATED_SELECTOR = get_selector_from_name("JobCreated")

async def monitor():
    client = FullNodeClient(node_url=RPC_URL)
    
    try:
        latest_b = await client.get_block_number()
        # LIVE MODE: Start only 5 blocks back to be instant
        last_block = latest_b - 5 
        print(f"🚀 INDEXER: Live Mode Active. Watching from block {last_block}...")
    except Exception as e:
        print(f"❌ INDEXER: Connection Error: {e}")
        return

    while True:
        try:
            current_block = await client.get_block_number()
            if current_block > last_block:
                print(f"🔍 INDEXER: Scanning {last_block + 1} to {current_block}...")
                
                events_response = await client.get_events(
                    address=CONTRACT_ADDRESS,
                    from_block_number=last_block + 1,
                    to_block_number=current_block,
                    chunk_size=30
                )

                for event in events_response.events:
                    if event.keys[0] == JOB_CREATED_SELECTOR:
                        onchain_id = event.data[0]
                        employer_hex = hex(event.data[1])
                        # Aggressive normalization: remove '0x' and leading zeros, then compare
                        employer_clean = employer_hex.lower().replace("0x", "").lstrip("0")
                        
                        print(f"✨ INDEXER: Job {onchain_id} found from {employer_hex}")

                        # Loop through every unsynced job and compare clean addresses
                        for db_job in Job.objects.filter(onchain_id__isnull=True):
                            db_addr_clean = db_job.employer_address.lower().replace("0x", "").lstrip("0")
                            
                            if db_addr_clean == employer_clean:
                                db_job.onchain_id = onchain_id
                                db_job.save()
                                print(f"🔗 INDEXER: LINKED '{db_job.title}' to ID {onchain_id}")
                                break

                last_block = current_block
            await asyncio.sleep(10)
        except Exception as e:
            print(f"⚠️ INDEXER Loop Warning: {e}")
            await asyncio.sleep(5)

# --- HEALTH CHECK SERVER ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Indexer is running live")

def run_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    server.serve_forever()

if __name__ == "__main__":
    threading.Thread(target=run_health_server, daemon=True).start()
    asyncio.run(monitor())
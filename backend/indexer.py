import os
import asyncio
import threading
import json
import django
from http.server import BaseHTTPRequestHandler, HTTPServer
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.hash.selector import get_selector_from_name
from starknet_py.contract import Contract
from dotenv import load_dotenv

# --- DJANGO INITIALIZATION ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from marketplace.models import Job, Bid

load_dotenv()

RPC_URL = os.getenv("STARKNET_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Selectors
JOB_CREATED_SELECTOR = get_selector_from_name("JobCreated")
BID_REVEALED_SELECTOR = get_selector_from_name("BidRevealed")

def parse_u256(low, high):
    return (high << 128) + low

# --- INDEXER LOGIC ---
async def monitor():
    print(f"📡 INDEXER: Connecting to Starknet RPC...")
    client = FullNodeClient(node_url=RPC_URL)
    
    try:
        latest_b = await client.get_block_number()
        # Look back 20 blocks to sync anything missed during redeploy
        last_block = latest_b - 20 
        print(f"🚀 INDEXER: Monitoring started. Catching up from block {last_block}...")
    except Exception as e:
        print(f"❌ INDEXER: RPC Connection Error: {e}")
        return

    while True:
        try:
            current_block = await client.get_block_number()
            if current_block > last_block:
                print(f"🔍 INDEXER: Scanning blocks {last_block + 1} to {current_block}...")
                
                events_response = await client.get_events(
                    address=CONTRACT_ADDRESS,
                    from_block_number=last_block + 1,
                    to_block_number=current_block,
                    chunk_size=15
                )

                for event in events_response.events:
                    selector = event.keys[0]

                    if selector == JOB_CREATED_SELECTOR:
                        onchain_id = event.data[0]
                        employer_hex = hex(event.data[1])
                        employer_int = int(employer_hex, 16)
                        
                        print(f"✨ INDEXER: JobCreated detected. ID: {onchain_id}")

                        # NORMALIZATION: Match address as integer to ignore leading zeros
                        unsynced_jobs = Job.objects.filter(onchain_id__isnull=True)
                        for job in unsynced_jobs:
                            if int(job.employer_address, 16) == employer_int:
                                job.onchain_id = onchain_id
                                job.save()
                                print(f"🔗 INDEXER: SUCCESSFULLY LINKED '{job.title}' to ID {onchain_id}")
                                break

                    elif selector == BID_REVEALED_SELECTOR:
                        # Add your reveal logic here later
                        pass

                last_block = current_block
            
            await asyncio.sleep(15) # Wait 15 seconds before checking next block
        except Exception as e:
            print(f"⚠️ INDEXER Loop Warning: {e}")
            await asyncio.sleep(10)

# --- HEALTH CHECK SERVER (Required for Render) ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Indexer service is active and polling.")

    def do_HEAD(self):
        self.send_response(200)
        self.end_headers()

def run_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    print(f"✅ Health Check server live on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    # 1. Start the Health Check server in a background thread
    threading.Thread(target=run_health_server, daemon=True).start()
    
    # 2. Run the async indexer in the main thread
    asyncio.run(monitor())
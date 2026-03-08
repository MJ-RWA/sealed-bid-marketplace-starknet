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
# Pre-calculate the selector once
JOB_CREATED_SELECTOR = get_selector_from_name("JobCreated")

async def monitor():
    print(f"📡 INDEXER: Initializing connection to {RPC_URL[:30]}...")
    client = FullNodeClient(node_url=RPC_URL)
    
    try:
        latest_b = await client.get_block_number()
        # Look back 50 blocks to be safe
        last_block = latest_b - 50 
        print(f"🚀 INDEXER: Unbreakable Scanner started. Catching up from {last_block}...")
    except Exception as e:
        print(f"❌ INDEXER: RPC Connection Error: {e}")
        return

    while True:
        try:
            current_block = await client.get_block_number()
            
            if current_block > last_block:
                # Scan blocks one by one
                for b_num in range(last_block + 1, current_block + 1):
                    print(f"🔍 INDEXER: Fetching Block {b_num}...")
                    
                    # We fetch the full block with receipts. This bypasses the broken 'get_events' method.
                    block = await client.get_block_with_receipts(block_number=b_num)
                    
                    for receipt in block.transactions:
                        # Check every event in every transaction in the block
                        for event in receipt.events:
                            # 1. Check if the event came from YOUR contract
                            if hex(event.from_address).lower() == CONTRACT_ADDRESS.lower():
                                selector = event.keys[0]
                                
                                # 2. Check if it is the JobCreated event
                                if selector == JOB_CREATED_SELECTOR:
                                    onchain_id = event.data[0]
                                    employer_hex = hex(event.data[1])
                                    employer_int = int(employer_hex, 16)
                                    
                                    print(f"✨ INDEXER: JobCreated detected! ID: {onchain_id} by {employer_hex}")

                                    # 3. Match and Link to Django
                                    # We use integer matching to ignore leading zeros (0x005... vs 0x5...)
                                    found = False
                                    for db_job in Job.objects.filter(onchain_id__isnull=True):
                                        if int(db_job.employer_address, 16) == employer_int:
                                            db_job.onchain_id = onchain_id
                                            db_job.save()
                                            print(f"🔗 INDEXER: SUCCESSFULLY LINKED Job '{db_job.title}' to ID {onchain_id}")
                                            found = True
                                            break
                                    if not found:
                                        print(f"⚠️ INDEXER: Event found, but no matching unsynced job for {employer_hex} in DB.")

                last_block = current_block
            
            await asyncio.sleep(15) # Standard polling for Render Free Tier
        except Exception as e:
            print(f"⚠️ INDEXER Loop Warning (Recovering): {e}")
            await asyncio.sleep(10)

# --- HEALTH CHECK SERVER ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Indexer is live and scanning blocks.")
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
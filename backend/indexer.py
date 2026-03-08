import os
import asyncio
import threading
import json
import django
from http.server import BaseHTTPRequestHandler, HTTPServer
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.hash.selector import get_selector_from_name
from dotenv import load_dotenv

# --- DJANGO SETUP ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from marketplace.models import Job, Bid

load_dotenv()

RPC_URL = os.getenv("STARKNET_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Selectors
JOB_CREATED_SELECTOR = get_selector_from_name("JobCreated")
BID_REVEALED_SELECTOR = get_selector_from_name("BidRevealed")

# --- INDEXER LOGIC ---
async def monitor():
    client = FullNodeClient(node_url=RPC_URL)
    
    try:
        latest_b = await client.get_block_number()
        last_block = latest_b - 20 # Look back to catch missed events
        print(f"🚀 INDEXER: Monitoring started at block {latest_b}")
    except Exception as e:
        print(f"❌ INDEXER: Failed to connect to RPC: {e}")
        return

    while True:
        try:
            current_block = await client.get_block_number()
            if current_block > last_block:
                print(f"🔍 INDEXER: Scanning {last_block + 1} to {current_block}")
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

                        # Find the unsynced job by comparing integer addresses
                        job = None
                        for candidate in Job.objects.filter(onchain_id__isnull=True):
                            if int(candidate.employer_address, 16) == employer_int:
                                job = candidate
                                break
                        
                        if job:
                            job.onchain_id = onchain_id
                            job.save()
                            print(f"🔗 INDEXER: Linked Job '{job.title}' to On-chain ID {onchain_id}")

                last_block = current_block
            await asyncio.sleep(15)
        except Exception as e:
            print(f"⚠️ INDEXER Loop Warning: {e}")
            await asyncio.sleep(10)

# --- HEALTH CHECK SERVER (To keep Render alive) ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Indexer service is alive")

def run_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    print(f"✅ Health Check server live on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    # Start Health Check in background thread
    threading.Thread(target=run_health_server, daemon=True).start()
    # Run Indexer in main loop
    asyncio.run(monitor())
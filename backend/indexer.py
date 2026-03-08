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
    # TRACE LOG: Confirming config
    print(f"DEBUG: Monitoring Contract: {CONTRACT_ADDRESS}")
    print(f"DEBUG: JobCreated Selector Hash: {hex(JOB_CREATED_SELECTOR)}")
    
    client = FullNodeClient(node_url=RPC_URL)
    
    try:
        latest_b = await client.get_block_number()
        last_block = latest_b - 5 
        print(f"🚀 INDEXER: Live Mode Active. Watching from block {last_block}...")
    except Exception as e:
        print(f"❌ INDEXER: Connection Error: {e}")
        return

    while True:
        try:
            current_block = await client.get_block_number()
            if current_block > last_block:
                # We scan one block at a time for maximum precision in logs
                for block_to_scan in range(last_block + 1, current_block + 1):
                    events_response = await client.get_events(
                        address=CONTRACT_ADDRESS,
                        from_block_number=block_to_scan,
                        to_block_number=block_to_scan,
                        chunk_size=100
                    )
                    
                    event_count = len(events_response.events)
                    if event_count > 0:
                        print(f"📦 Block {block_to_scan}: Found {event_count} total events on contract.")
                    
                    for event in events_response.events:
                        selector = event.keys[0]
                        print(f"  ∟ 🔍 Detected Event Hash: {hex(selector)}")

                        if selector == JOB_CREATED_SELECTOR:
                            onchain_id = event.data[0]
                            employer_hex = hex(event.data[1])
                            print(f"  ✨ MATCH! JobCreated ID: {onchain_id} by {employer_hex}")

                            # Normalize
                            employer_clean = employer_hex.lower().replace("0x", "").lstrip("0")
                            
                            found_in_db = False
                            for db_job in Job.objects.filter(onchain_id__isnull=True):
                                db_addr_clean = db_job.employer_address.lower().replace("0x", "").lstrip("0")
                                if db_addr_clean == employer_clean:
                                    db_job.onchain_id = onchain_id
                                    db_job.save()
                                    print(f"  🔗 LINKED '{db_job.title}' to ID {onchain_id}")
                                    found_in_db = True
                                    break
                            
                            if not found_in_db:
                                print(f"  ⚠️ Warning: Event found but employer {employer_hex} has no unsynced job in DB.")

                last_block = current_block
            await asyncio.sleep(10)
        except Exception as e:
            print(f"⚠️ INDEXER Error: {e}")
            await asyncio.sleep(5)

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Indexer live")
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
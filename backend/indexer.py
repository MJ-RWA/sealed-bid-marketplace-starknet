import os
import asyncio
import threading
import json
import django
import aiohttp
from http.server import BaseHTTPRequestHandler, HTTPServer
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
JOB_CREATED_SELECTOR = hex(get_selector_from_name("JobCreated"))

# --- FIXED RAW RPC LOGIC ---
async def fetch_events_raw(session, from_block, to_block):
    payload = {
        "jsonrpc": "2.0",
        "method": "starknet_getEvents",
        "params": [
            {
                "from_block": {"block_number": from_block},
                "to_block": {"block_number": to_block},
                "address": CONTRACT_ADDRESS,
                "keys": [[JOB_CREATED_SELECTOR]],
                "chunk_size": 100  # THE FIX: Alchemy requires this field
            }
        ],
        "id": 1
    }
    async with session.post(RPC_URL, json=payload) as response:
        result = await response.json()
        if "error" in result:
            # Print the error so we can see it in Render logs
            print(f"DEBUG RPC ERROR: {result['error']}")
            return []
        return result.get("result", {}).get("events", [])

async def get_latest_block_raw(session):
    payload = {
        "jsonrpc": "2.0",
        "method": "starknet_blockNumber",
        "params": [],
        "id": 1
    }
    async with session.post(RPC_URL, json=payload) as response:
        result = await response.json()
        return result["result"]

async def monitor():
    print(f"📡 INDEXER: Connection established. Target: {CONTRACT_ADDRESS}")
    
    async with aiohttp.ClientSession() as session:
        try:
            current_b = await get_latest_block_raw(session)
            # Catch up lookback
            last_block = current_b - 100 
            print(f"🚀 INDEXER: Live Scanner Active. Starting catch-up from block {last_block}...")
        except Exception as e:
            print(f"❌ INDEXER: Connection Failed: {e}")
            return

        while True:
            try:
                current_block = await get_latest_block_raw(session)
                
                if current_block > last_block:
                    # Scan in small batches to be safe
                    end_batch = min(last_block + 100, current_block)
                    print(f"🔍 INDEXER: Scanning {last_block + 1} to {end_batch}...")
                    
                    events = await fetch_events_raw(session, last_block + 1, end_batch)
                    
                    for event in events:
                        try:
                            # Extract data from the Starknet event structure
                            onchain_id = int(event['data'][0], 16)
                            employer_hex = event['data'][1]
                            employer_int = int(employer_hex, 16)
                            
                            print(f"✨ INDEXER: Job {onchain_id} found by {employer_hex}")

                            # Match to Django
                            unsynced_jobs = Job.objects.filter(onchain_id__isnull=True)
                            for db_job in unsynced_jobs:
                                if int(db_job.employer_address, 16) == employer_int:
                                    db_job.onchain_id = onchain_id
                                    db_job.save()
                                    print(f"🔗 INDEXER: LINKED Job '{db_job.title}' to ID {onchain_id}")
                                    break
                        except Exception as parse_err:
                            print(f"❌ INDEXER: Parse Error: {parse_err}")

                    last_block = end_batch
                
                # Sleep less during catch-up, more when synced
                await asyncio.sleep(2 if last_block < current_block else 15) 
            except Exception as e:
                print(f"⚠️ INDEXER Warning: {e}")
                await asyncio.sleep(10)

# --- HEALTH CHECK SERVER ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Indexer is running")
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
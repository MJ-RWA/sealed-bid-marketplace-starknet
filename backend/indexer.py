import os
import asyncio
import threading
import json
import django
import aiohttp
from http.server import BaseHTTPRequestHandler, HTTPServer
from starknet_py.hash.selector import get_selector_from_name
from asgiref.sync import sync_to_async  # REQUIRED FOR DJANGO ASYNC
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

# --- DATABASE HELPERS (Wrapped for Async Safety) ---
@sync_to_async
def get_unsynced_jobs_list():
    # Convert QuerySet to a list of dicts to avoid async errors later
    jobs = Job.objects.filter(onchain_id__isnull=True)
    return list(jobs.values('id', 'title', 'employer_address'))

@sync_to_async
def update_job_onchain_id(db_id, onchain_id):
    job = Job.objects.get(id=db_id)
    job.onchain_id = onchain_id
    job.save()
    return job.title

# --- RAW RPC LOGIC ---
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
                "chunk_size": 100
            }
        ],
        "id": 1
    }
    async with session.post(RPC_URL, json=payload) as response:
        result = await response.json()
        if "error" in result:
            print(f"❌ RPC ERROR: {result['error']}")
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
    print(f"📡 INDEXER: Starting Raw JSON-RPC Scanner...")
    
    async with aiohttp.ClientSession() as session:
        try:
            current_tip = await get_latest_block_raw(session)
            # Look back to block 7,350,000 to catch your Voyager history
            last_block = 7350000 
            print(f"🚀 INDEXER: Connected. Catching up from block {last_block}...")
        except Exception as e:
            print(f"❌ INDEXER: Connection Failed: {e}")
            return

        while True:
            try:
                # 1. Diagnostic Check
                unsynced_list = await get_unsynced_jobs_list()
                if len(unsynced_list) > 0:
                    print(f"📊 DB CHECK: {len(unsynced_list)} unsynced jobs waiting.")

                current_tip = await get_latest_block_raw(session)
                
                if current_tip > last_block:
                    end_batch = min(last_block + 500, current_tip)
                    print(f"🔍 INDEXER: Scanning {last_block + 1} to {end_batch}...")
                    
                    events = await fetch_events_raw(session, last_block + 1, end_batch)
                    
                    for event in events:
                        try:
                            onchain_id = int(event['data'][0], 16)
                            employer_hex = event['data'][1]
                            employer_int = int(employer_hex, 16)
                            
                            print(f"✨ INDEXER: Event found! ID: {onchain_id} by {employer_hex}")

                            # 2. Match with Async Safety
                            for db_job in unsynced_list:
                                if int(db_job['employer_address'], 16) == employer_int:
                                    title = await update_job_onchain_id(db_job['id'], onchain_id)
                                    print(f"🔗 INDEXER: LINKED '{title}' to ID {onchain_id}")
                                    break
                        except Exception as parse_err:
                            print(f"❌ INDEXER: Parse Error: {parse_err}")

                    last_block = end_batch
                
                await asyncio.sleep(1 if last_block < current_tip else 15) 
            except Exception as e:
                print(f"⚠️ INDEXER Error: {e}")
                await asyncio.sleep(10)

# --- HEALTH CHECK SERVER ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.end_headers()
        self.wfile.write(b"Indexer Active")
    def do_HEAD(self):
        self.send_response(200); self.end_headers()

def run_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    server.serve_forever()

if __name__ == "__main__":
    threading.Thread(target=run_health_server, daemon=True).start()
    asyncio.run(monitor())
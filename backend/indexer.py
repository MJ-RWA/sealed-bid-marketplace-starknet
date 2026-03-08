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

# --- RAW RPC LOGIC (Bypasses Library Validation Bugs) ---
async def fetch_events_raw(session, from_block, to_block):
    payload = {
        "jsonrpc": "2.0",
        "method": "starknet_getEvents",
        "params": {
            "filter": {
                "from_block": {"block_number": from_block},
                "to_block": {"block_number": to_block},
                "address": CONTRACT_ADDRESS,
                "keys": [[JOB_CREATED_SELECTOR]]
            }
        },
        "id": 1
    }
    async with session.post(RPC_URL, json=payload) as response:
        result = await response.json()
        if "error" in result:
            raise Exception(result["error"])
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
    print(f"📡 INDEXER: Target Contract: {CONTRACT_ADDRESS}")
    
    async with aiohttp.ClientSession() as session:
        try:
            current_b = await get_latest_block_raw(session)
            # Catch up from the last 100 blocks to find previous tests
            last_block = current_b - 100 
            print(f"🚀 INDEXER: Connected. Catching up from block {last_block}...")
        except Exception as e:
            print(f"❌ INDEXER: Initial Connection Failed: {e}")
            return

        while True:
            try:
                current_block = await get_latest_block_raw(session)
                
                if current_block > last_block:
                    print(f"🔍 INDEXER: Scanning {last_block + 1} to {current_block}...")
                    
                    events = await fetch_events_raw(session, last_block + 1, current_block)
                    
                    for event in events:
                        # Extract data from raw JSON structure
                        # event['data'] is a list of hex strings
                        try:
                            onchain_id = int(event['data'][0], 16)
                            employer_hex = event['data'][1]
                            employer_int = int(employer_hex, 16)
                            
                            print(f"✨ INDEXER: JobCreated detected! ID: {onchain_id} by {employer_hex}")

                            # Matching logic (Integer based to ignore leading zeros)
                            unsynced_jobs = Job.objects.filter(onchain_id__isnull=True)
                            found = False
                            for db_job in unsynced_jobs:
                                if int(db_job.employer_address, 16) == employer_int:
                                    db_job.onchain_id = onchain_id
                                    db_job.save()
                                    print(f"🔗 INDEXER: LINKED '{db_job.title}' to ID {onchain_id}")
                                    found = True
                                    break
                            
                            if not found:
                                print(f"⚠️ INDEXER: No matching unsynced job in DB for {employer_hex}")
                        except Exception as parse_err:
                            print(f"❌ INDEXER: Error parsing event data: {parse_err}")

                    last_block = current_block
                
                await asyncio.sleep(15) 
            except Exception as e:
                print(f"⚠️ INDEXER Loop Error (Recovering...): {e}")
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
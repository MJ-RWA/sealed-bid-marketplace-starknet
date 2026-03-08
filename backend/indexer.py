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

# --- RAW RPC LOGIC (Fixed for Alchemy) ---
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
    print(f"📡 INDEXER STARTING...")
    print(f"🎯 TARGET CONTRACT: {CONTRACT_ADDRESS}")
    
    # DIAGNOSTIC: Print what is currently in the DB
    unsynced = Job.objects.filter(onchain_id__isnull=True)
    print(f"📊 DATABASE CHECK: Found {unsynced.count()} unsynced jobs in database.")
    for j in unsynced:
        print(f"   ∟ Job: '{j.title}' | Address: {j.employer_address}")

    async with aiohttp.ClientSession() as session:
        try:
            current_tip = await get_latest_block_raw(session)
            # FORCE CATCHUP: Start from block 7,000,000 to cover all your Voyager history
            last_block = 7000000 
            print(f"🚀 CATCH-UP ACTIVE: Scanning from block {last_block} to {current_tip}...")
        except Exception as e:
            print(f"❌ Connection Failed: {e}")
            return

        while True:
            try:
                current_tip = await get_latest_block_raw(session)
                
                if current_tip > last_block:
                    # Scan in chunks of 1000 blocks for speed during catch-up
                    end_batch = min(last_block + 1000, current_tip)
                    
                    events = await fetch_events_raw(session, last_block + 1, end_batch)
                    
                    if events:
                        print(f"📦 Block Range [{last_block+1}-{end_batch}]: Found {len(events)} events.")

                    for event in events:
                        try:
                            onchain_id = int(event['data'][0], 16)
                            employer_hex = event['data'][1]
                            # CRITICAL FIX: Convert both to int to guarantee a match
                            employer_int = int(employer_hex, 16)
                            
                            # Scan DB
                            for db_job in Job.objects.filter(onchain_id__isnull=True):
                                if int(db_job.employer_address, 16) == employer_int:
                                    db_job.onchain_id = onchain_id
                                    db_job.save()
                                    print(f"✅ LINKED: '{db_job.title}' -> Onchain ID {onchain_id}")
                                    break
                        except Exception as e:
                            print(f"❌ Event processing error: {e}")

                    last_block = end_batch
                
                # Fast-loop during catchup, slow-loop at the tip
                await asyncio.sleep(1 if last_block < current_tip else 15) 
            except Exception as e:
                print(f"⚠️ Loop Error: {e}")
                await asyncio.sleep(10)

# --- RENDER HEALTH SERVER ---
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
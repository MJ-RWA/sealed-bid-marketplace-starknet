import os
import asyncio
import threading
import json
import django
import aiohttp
from starknet_py.hash.selector import get_selector_from_name
from asgiref.sync import sync_to_async
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

# --- DATABASE HELPERS ---
@sync_to_async
def get_unsynced_jobs():
    # We fetch ALL unsynced jobs to compare in memory
    return list(Job.objects.filter(onchain_id__isnull=True).values('id', 'employer_address', 'title'))

@sync_to_async
def update_job(db_id, onchain_id):
    job = Job.objects.get(id=db_id)
    job.onchain_id = onchain_id
    job.save()
    return job.title

# --- RAW RPC LOGIC ---
async def fetch_events_raw(session, from_block, to_block):
    payload = {
        "jsonrpc": "2.0",
        "method": "starknet_getEvents",
        "params": [{
            "from_block": {"block_number": from_block},
            "to_block": {"block_number": to_block},
            "address": CONTRACT_ADDRESS,
            "keys": [[JOB_CREATED_SELECTOR]],
            "chunk_size": 100
        }],
        "id": 1
    }
    async with session.post(RPC_URL, json=payload) as response:
        return await response.json()

async def get_latest_block_raw(session):
    payload = {"jsonrpc": "2.0", "method": "starknet_blockNumber", "params": [], "id": 1}
    async with session.post(RPC_URL, json=payload) as response:
        res = await response.json()
        return res["result"]

async def monitor():
    print(f"--- INDEXER STARTUP DIAGNOSTICS ---")
    print(f"TARGET CONTRACT: {CONTRACT_ADDRESS}")
    print(f"SELECTOR HASH: {JOB_CREATED_SELECTOR}")
    
    async with aiohttp.ClientSession() as session:
        try:
            current_tip = await get_latest_block_raw(session)
            # LOOK BACK: We look back 500 blocks to find your recent tests
            last_block = current_tip - 500 
            print(f"SCANNING START: Block {last_block}")
        except Exception as e:
            print(f"FATAL: Cannot connect to RPC: {e}")
            return

        while True:
            try:
                # 1. Get the list of jobs currently in Django
                db_jobs = await get_unsynced_jobs()
                print(f"DB STATUS: {len(db_jobs)} jobs waiting for sync.")

                current_tip = await get_latest_block_raw(session)
                if current_tip > last_block:
                    end_batch = min(last_block + 100, current_tip)
                    print(f"SCANNING: Blocks {last_block+1} to {end_batch}")
                    
                    response = await fetch_events_raw(session, last_block+1, end_batch)
                    
                    if "result" in response:
                        events = response["result"]["events"]
                        for event in events:
                            onchain_id = int(event['data'][0], 16)
                            employer_onchain = event['data'][1] # This is the hex from blockchain
                            
                            print(f"FOUND EVENT: Job {onchain_id} created by {employer_onchain}")

                            # 2. Compare the Addresses
                            for dj_job in db_jobs:
                                employer_db = dj_job['employer_address']
                                
                                # LOG THE COMPARISON (This is how we find the fault)
                                print(f"COMPARING: On-chain({employer_onchain}) vs DB({employer_db})")
                                
                                # Final Logic: Convert both to integers to ignore string formatting
                                if int(employer_onchain, 16) == int(employer_db, 16):
                                    title = await update_job(dj_job['id'], onchain_id)
                                    print(f"✅ SUCCESS: Linked Job '{title}' to ID {onchain_id}")
                                    break
                                else:
                                    print(f"❌ NO MATCH: Integer values do not match.")

                    last_block = end_batch
                
                await asyncio.sleep(20) # Avoid rate limits
            except Exception as e:
                print(f"ERROR: {e}")
                await asyncio.sleep(10)

if __name__ == "__main__":
    # Start a dummy server for Render health check
    from http.server import HTTPServer, BaseHTTPRequestHandler
    class H(BaseHTTPRequestHandler):
        def do_GET(self): self.send_response(200); self.end_headers(); self.wfile.write(b"OK")
    threading.Thread(target=lambda: HTTPServer(('0.0.0.0', int(os.getenv("PORT", 10000))), H).serve_forever(), daemon=True).start()
    
    asyncio.run(monitor())
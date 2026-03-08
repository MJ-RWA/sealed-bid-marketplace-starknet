import os
import asyncio
import threading
import json
import django
import aiohttp
from starknet_py.hash.selector import get_selector_from_name
from asgiref.sync import sync_to_async
from django.db import IntegrityError # IMPORT THIS
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

@sync_to_async
def get_unsynced_jobs():
    return list(Job.objects.filter(onchain_id__isnull=True).values('id', 'employer_address', 'title'))

@sync_to_async
def update_job(db_id, onchain_id):
    try:
        job = Job.objects.get(id=db_id)
        job.onchain_id = onchain_id
        job.save()
        return f"SUCCESS: Linked '{job.title}'"
    except IntegrityError:
        return f"SKIP: ID {onchain_id} already exists in database."
    except Exception as e:
        return f"ERROR: {e}"

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
        res = await response.json()
        return res.get("result", {}).get("events", [])

async def get_latest_block_raw(session):
    payload = {"jsonrpc": "2.0", "method": "starknet_blockNumber", "params": [], "id": 1}
    async with session.post(RPC_URL, json=payload) as response:
        res = await response.json()
        return res["result"]

async def monitor():
    print(f"📡 INDEXER: System Online. Matching jobs mathematically...")
    
    async with aiohttp.ClientSession() as session:
        try:
            current_tip = await get_latest_block_raw(session)
            last_block = current_tip - 200 # Catch recent events
        except Exception as e:
            print(f"FATAL: {e}")
            return

        while True:
            try:
                db_jobs = await get_unsynced_jobs()
                current_tip = await get_latest_block_raw(session)

                if current_tip > last_block:
                    end_batch = min(last_block + 100, current_tip)
                    events = await fetch_events_raw(session, last_block + 1, end_batch)
                    
                    for event in events:
                        onchain_id = int(event['data'][0], 16)
                        employer_onchain = int(event['data'][1], 16)

                        for dj_job in db_jobs:
                            if int(dj_job['employer_address'], 16) == employer_onchain:
                                # CALL UPDATE WITH ERROR HANDLING
                                result = await update_job(dj_job['id'], onchain_id)
                                print(f"✨ {result}")
                                break

                    last_block = end_batch # ALWAYS update last_block to move forward
                
                await asyncio.sleep(15)
            except Exception as e:
                print(f"⚠️ INDEXER Error: {e}")
                # Update last_block anyway to prevent infinite loop on a bad block
                last_block += 1 
                await asyncio.sleep(10)

if __name__ == "__main__":
    from http.server import HTTPServer, BaseHTTPRequestHandler
    class H(BaseHTTPRequestHandler):
        def do_GET(self): self.send_response(200); self.end_headers(); self.wfile.write(b"OK")
    threading.Thread(target=lambda: HTTPServer(('0.0.0.0', int(os.getenv("PORT", 10000))), H).serve_forever(), daemon=True).start()
    asyncio.run(monitor())
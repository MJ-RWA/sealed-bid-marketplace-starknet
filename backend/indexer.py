import os
import asyncio
import threading
import json
import django
import aiohttp
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer
from starknet_py.hash.selector import get_selector_from_name
from asgiref.sync import sync_to_async
from django.db import connection
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
DB_URL = os.getenv("DATABASE_URL")
JOB_CREATED_SELECTOR = hex(get_selector_from_name("JobCreated"))

# --- DIAGNOSTIC TEST ---
def test_db_connection():
    print(f"🔍 DIAGNOSTIC: Testing Database Connection...")
    try:
        # Check if the hostname can even be found
        host = DB_URL.split("@")[1].split("/")[0].split(":")[0]
        print(f"🔍 DIAGNOSTIC: Resolving hostname: {host}")
        ip = socket.gethostbyname(host)
        print(f"✅ DIAGNOSTIC: Host resolved to {ip}")
        
        # Test Django connection
        connection.ensure_connection()
        print(f"✅ DIAGNOSTIC: Django Database Connection Successful!")
        return True
    except Exception as e:
        print(f"❌ DIAGNOSTIC: Database Connection Failed: {e}")
        return False

# --- DATABASE HELPERS ---
@sync_to_async
def get_unsynced_jobs_list():
    return list(Job.objects.filter(onchain_id__isnull=True).values('id', 'title', 'employer_address'))

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
        "params": [{"from_block": {"block_number": from_block}, "to_block": {"block_number": to_block}, "address": CONTRACT_ADDRESS, "keys": [[JOB_CREATED_SELECTOR]], "chunk_size": 100}],
        "id": 1
    }
    async with session.post(RPC_URL, json=payload) as response:
        result = await response.json()
        return result.get("result", {}).get("events", [])

async def get_latest_block_raw(session):
    payload = {"jsonrpc": "2.0", "method": "starknet_blockNumber", "params": [], "id": 1}
    async with session.post(RPC_URL, json=payload) as response:
        result = await response.json()
        return result["result"]

async def monitor():
    if not test_db_connection():
        print("🛑 INDEXER: Stopping due to Database connection failure.")
        return

    async with aiohttp.ClientSession() as session:
        try:
            current_tip = await get_latest_block_raw(session)
            last_block = current_tip - 100 
            print(f"🚀 INDEXER: Connected to Starknet. Scanning from {last_block}...")
        except Exception as e:
            print(f"❌ INDEXER: Starknet Connection Failed: {e}")
            return

        while True:
            try:
                unsynced_list = await get_unsynced_jobs_list()
                current_tip = await get_latest_block_raw(session)
                
                if current_tip > last_block:
                    end_batch = min(last_block + 500, current_tip)
                    print(f"🔍 INDEXER: Scanning {last_block + 1} to {end_batch}...")
                    events = await fetch_events_raw(session, last_block + 1, end_batch)
                    
                    for event in events:
                        onchain_id = int(event['data'][0], 16)
                        employer_hex = event['data'][1]
                        employer_int = int(employer_hex, 16)
                        
                        for db_job in unsynced_list:
                            if int(db_job['employer_address'], 16) == employer_int:
                                title = await update_job_onchain_id(db_job['id'], onchain_id)
                                print(f"🔗 INDEXER: LINKED '{title}' to ID {onchain_id}")
                                break
                    last_block = end_batch
                await asyncio.sleep(15) 
            except Exception as e:
                print(f"⚠️ INDEXER Error: {e}")
                await asyncio.sleep(10)

# --- HEALTH CHECK SERVER ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.end_headers(); self.wfile.write(b"Indexer Active")
    def do_HEAD(self):
        self.send_response(200); self.end_headers()

def run_health_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
    server.serve_forever()

if __name__ == "__main__":
    threading.Thread(target=run_health_server, daemon=True).start()
    asyncio.run(monitor())
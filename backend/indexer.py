import os, asyncio, json, django, aiohttp
from starknet_py.hash.selector import get_selector_from_name
from asgiref.sync import sync_to_async
from dotenv import load_dotenv

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
try: django.setup()
except: pass 
from marketplace.models import Job, Bid

load_dotenv()
RPC_URL = os.getenv("STARKNET_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Selectors
JOB_CREATED = hex(get_selector_from_name("JobCreated"))
BID_REVEALED = hex(get_selector_from_name("BidRevealed"))
SHORTLIST_CREATED = hex(get_selector_from_name("ShortlistCreated"))
WINNER_SELECTED = hex(get_selector_from_name("WinnerSelected"))

@sync_to_async
def sync_event_to_db(selector, data):
    try:
        onchain_id = int(data[0], 16)
        job = Job.objects.get(onchain_id=onchain_id)
        
        if selector == BID_REVEALED:
            bidder = int(data[1], 16)
            price = (int(data[3], 16) << 128) + int(data[2], 16)
            # Find bid and update
            for b in job.bids.all():
                if int(b.bidder_address, 16) == bidder:
                    b.price = price
                    b.save()
                    return f"Bid Revealed for Job {onchain_id}"
        
        elif selector == SHORTLIST_CREATED:
            job.status = "SHORTLISTED"
            job.save()
            return f"Job {onchain_id} Shortlisted"

        elif selector == WINNER_SELECTED:
            job.status = "COMPLETED"
            job.save()
            return f"Job {onchain_id} Finalized"
    except Exception as e: return f"Error: {e}"

async def monitor():
    async with aiohttp.ClientSession() as session:
        last_block = (await (await session.post(RPC_URL, json={"jsonrpc":"2.0","method":"starknet_blockNumber","params":[],"id":1})).json())["result"] - 10
        while True:
            try:
                curr = (await (await session.post(RPC_URL, json={"jsonrpc":"2.0","method":"starknet_blockNumber","params":[],"id":1})).json())["result"]
                if curr > last_block:
                    payload = {"jsonrpc":"2.0","method":"starknet_getEvents","params":[{"from_block":{"block_number":last_block+1},"to_block":{"block_number":curr},"address":CONTRACT_ADDRESS,"chunk_size":100}],"id":1}
                    res = await (await session.post(RPC_URL, json=payload)).json()
                    for event in res.get("result", {}).get("events", []):
                        msg = await sync_event_to_db(event['keys'][0], event['data'])
                        if msg: print(f"✨ INDEXER: {msg}")
                    last_block = curr
                await asyncio.sleep(15)
            except: await asyncio.sleep(10)

if __name__ == "__main__":
    asyncio.run(monitor())
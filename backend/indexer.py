import os
import asyncio
import django
import json
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.hash.selector import get_selector_from_name
from starknet_py.contract import Contract

# --- DJANGO INITIALIZATION ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from marketplace.models import Job, Bid

from dotenv import load_dotenv
load_dotenv()

RPC_URL = os.getenv("STARKNET_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")


# Pre-calculate Mathematical Selectors (Hashes of event names)
JOB_CREATED_SELECTOR = get_selector_from_name("JobCreated")
BID_REVEALED_SELECTOR = get_selector_from_name("BidRevealed")
SHORTLIST_CREATED_SELECTOR = get_selector_from_name("ShortlistCreated")

def parse_u256(low, high):
    """Calculates: (high * 2^128) + low"""
    return (high << 128) + low

async def sync_shortlist(client, job_onchain_id, contract_abi):
    """
    THE LAW SYNC: Loops 5 times to fetch the winners from the contract storage
    """
    contract = Contract(address=CONTRACT_ADDRESS, abi=contract_abi, provider=client)
    print(f"🔍 Fetching Top 5 for Job {job_onchain_id}...")
    
    for rank in range(5):
        try:
            # Call the 'getter' from your lib.cairo
            address_int = await contract.functions["get_shortlist_candidate"].call(job_onchain_id, rank)
            winner_address = hex(address_int[0])
            
            if winner_address != "0x0":
                bid = Bid.objects.filter(job__onchain_id=job_onchain_id, bidder_address=winner_address).first()
                if bid:
                    bid.is_shortlisted = True
                    bid.save()
                    print(f"🏆 Winner #{rank+1}: {winner_address}")
        except Exception as e:
            print(f"Rank {rank} empty or error: {e}")

async def monitor():
    client = FullNodeClient(node_url=RPC_URL)
    with open("abi.json", "r") as f:
        abi = json.load(f)["abi"]

    last_block = await client.get_block_number()
    print(f"🚀 Indexer Active. Watching from block {last_block}...")

    while True:
        try:
            current_block = await client.get_block_number()
            if current_block > last_block:
                # Ask for events in the new blocks
                events_response = await client.get_events(
                    address=CONTRACT_ADDRESS,
                    from_block_number=last_block + 1,
                    to_block_number=current_block,
                    chunk_size=10
                )

                for event in events_response.events:
                    selector = event.keys[0]

                    if selector == JOB_CREATED_SELECTOR:
                        onchain_id = event.data[0]
                        employer = hex(event.data[1])
                        # Link the blockchain ID to our Django Job
                        job = Job.objects.filter(employer_address=employer, onchain_id__isnull=True).first()
                        if job:
                            job.onchain_id = onchain_id
                            job.save()

                    elif selector == BID_REVEALED_SELECTOR:
                        onchain_id = event.data[0]
                        bidder = hex(event.data[1])
                        # Price is u256 (2 elements: low, high)
                        price = parse_u256(event.data[2], event.data[3])
                        
                        job = Job.objects.get(onchain_id=onchain_id)
                        bid, _ = Bid.objects.get_or_create(job=job, bidder_address=bidder)
                        bid.price = price
                        bid.status = 'REVEALED'
                        bid.save()

                    elif selector == SHORTLIST_CREATED_SELECTOR:
                        onchain_id = event.data[0]
                        job = Job.objects.get(onchain_id=onchain_id)
                        job.status = 'SHORTLISTED'
                        job.save()
                        # Physically verify the 5 winners from storage
                        await sync_shortlist(client, onchain_id, abi)

                last_block = current_block
            await asyncio.sleep(10)
        except Exception as e:
            print(f"Polling error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(monitor())
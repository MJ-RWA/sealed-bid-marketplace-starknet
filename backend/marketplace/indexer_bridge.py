import asyncio
from indexer import monitor

def start_indexer():
    print("🛰️ Starting Indexer inside Django Process...")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(monitor())
    except Exception as e:
        print(f"Indexer failed: {e}")
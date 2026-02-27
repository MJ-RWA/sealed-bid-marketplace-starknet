import asyncio
import logging
import sys
from indexer import monitor 

# Set up logging to talk to Render's dashboard
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = logging.getLogger(__name__)

def start_indexer():
    logger.info("🛰️ ATTEMPTING TO START INDEXER THREAD...")
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        logger.info("🚀 INDEXER LOOP IS NOW RUNNING")
        loop.run_until_complete(monitor())
    except Exception as e:
        logger.error(f"❌ Indexer background thread failed: {e}")
import os
import threading
import asyncio
from django.apps import AppConfig

class MarketplaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'marketplace'

    def ready(self):
        # Only start the indexer in the main process, not the reloader
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('DEBUG'):
            from .indexer_bridge import start_indexer
            threading.Thread(target=start_indexer, daemon=True).start()
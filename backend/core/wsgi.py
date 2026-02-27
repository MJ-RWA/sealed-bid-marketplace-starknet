import os
import threading
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()

# --- START THE INDEXER HERE ---
try:
    from marketplace.indexer_bridge import start_indexer
    # We use a thread so it doesn't block the web server from starting
    threading.Thread(target=start_indexer, name="IndexerThread", daemon=True).start()
    print("✅ WSGI: Indexer thread spawned successfully")
except Exception as e:
    print(f"❌ WSGI: Failed to spawn indexer thread: {e}")
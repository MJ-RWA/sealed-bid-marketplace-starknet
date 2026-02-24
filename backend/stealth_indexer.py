import os
import asyncio
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from indexer import monitor  # Import all the logic from indexer.py

# --- THE TRIGGER LOGIC ---
class RestartTrigger(BaseHTTPRequestHandler):
    
    def do_GET(self):
        # 1. The "Kill Switch" Route
        if self.path == '/restart-the-system':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            response = "<h1>Indexer Restarting...</h1><p>The system is performing a cold boot for the presentation.</p>"
            self.wfile.write(bytes(response, "utf8"))
            
            print("⚠️ MANUAL RESTART signal received from URL. Shutting down for reboot...")
            os._exit(0) # This kills the process, forcing Render to restart it
            
        # 2. The "Health Check" Route
        else:
            # Render's bots will hit the root '/' and see this. It keeps the server alive.
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(bytes("Indexer is Running smoothly.", "utf8"))

    def do_HEAD(self):
        # Render also sends HEAD requests just to check headers. 
        # This prevents the "501 Unsupported method" error in the logs.
        self.send_response(200)
        self.end_headers()

def run_web_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), RestartTrigger)
    print(f"✅ Trigger URL active on port {port}")
    server.serve_forever()

# --- THE EXECUTION SET ---
async def main():
    # Start the fake web server in a separate thread (Parallel Process)
    web_thread = threading.Thread(target=run_web_server, daemon=True)
    web_thread.start()

    # Start the real Indexer logic from indexer.py
    try:
        await monitor()
    except Exception as e:
        print(f"Indexer loop stopped: {e}")
        os._exit(1)

if __name__ == "__main__":
    asyncio.run(main())
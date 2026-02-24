import os
import asyncio
import threading
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from indexer import monitor

# --- THE TRIGGER LOGIC ---
class RestartTrigger(BaseHTTPRequestHandler):
    def do_GET(self):
        # Respond to the browser
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        response = "<h1>Indexer Restarting...</h1><p>The system is performing a cold boot for the presentation.</p>"
        self.wfile.write(bytes(response, "utf8"))
        
        print("⚠️ Restart signal received from URL. Shutting down for reboot...")
        # Mathematically force the process to exit. 
        # Render will detect the exit and restart the service automatically.
        os._exit(0)

def run_web_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), RestartTrigger)
    print(f"✅ Trigger URL active on port {port}")
    server.serve_forever()

# --- THE EXECUTION SET ---
async def main():
    # Run the web server in a separate thread (Parallel Process)
    web_thread = threading.Thread(target=run_web_server, daemon=True)
    web_thread.start()

    # Start the real Indexer logic
    try:
        await monitor()
    except Exception as e:
        print(f"Indexer loop stopped: {e}")
        os._exit(1)

if __name__ == "__main__":
    asyncio.run(main())
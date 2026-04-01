"""
Minimal reference HTTP server for a PilotGentic HTTP skill.

Run with:
    python3 server.py

Then install examples/http-skill/manifest.json into ~/.pilotgentic/docked/
and restart PilotGentic. The AI agent can now call "my_http_skill".

Requirements: Python 3.6+ (no external dependencies)
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "localhost"
PORT = 8080


class SkillHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default access log noise; remove this line to see requests
        pass

    def _send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path == "/my-skill":
            # Read optional request body (PilotGentic may send tool arguments here)
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b"{}"
            try:
                args = json.loads(body)
            except json.JSONDecodeError:
                args = {}

            # --- Your skill logic goes here ---
            result = {
                "success": True,
                "message": "HTTP skill executed successfully",
                "received_args": args,
            }
            self._send_json(result)
        else:
            self._send_json({"success": False, "error": "Unknown path"}, status=404)

    def do_GET(self):
        if self.path == "/health":
            self._send_json({"status": "ok"})
        else:
            self._send_json({"success": False, "error": "Unknown path"}, status=404)


if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), SkillHandler)
    print(f"PilotGentic skill server running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

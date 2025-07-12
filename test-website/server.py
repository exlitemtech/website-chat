#!/usr/bin/env python3
"""
Simple HTTP server to serve the test website with chat widget
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def serve_test_website(port=3001):
    """Serve the test website on the specified port"""
    
    # Change to the project root directory so relative paths work
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    
    with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
        print(f"🌐 Test website running at: http://localhost:{port}/test-website/")
        print(f"📁 Serving from: {project_root}")
        print("\n🚀 How to test:")
        print("1. Make sure FastAPI backend is running on http://localhost:8000")
        print("2. Make sure admin interface is running on http://localhost:3000") 
        print(f"3. Open http://localhost:{port}/test-website/ to see the test site")
        print("4. Click the chat widget to start chatting")
        print("5. Open admin interface to respond as an agent")
        print("\n⏹️  Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == "__main__":
    serve_test_website()
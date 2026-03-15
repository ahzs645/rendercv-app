#!/usr/bin/env python3
"""
Local server for rendercv.com with proper MIME types and CORS headers.
Run: python3 serve.py
Then open: http://localhost:8000
"""

import http.server
import os
import sys

PORT = 8000

class RenderCVHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.wasm': 'application/wasm',
        '.whl': 'application/zip',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
        '.otf': 'font/otf',
        '.ttf': 'font/ttf',
    }

    def end_headers(self):
        # No COOP/COEP needed — app doesn't use SharedArrayBuffer
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress noisy request logs; only show errors
        if '404' in str(args) or '500' in str(args):
            super().log_message(format, *args)

    def do_GET(self):
        # SvelteKit-style fallback: if no file extension, try .html
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not os.path.splitext(self.path)[1]:
            # Try adding .html
            html_path = path + '.html'
            if os.path.exists(html_path):
                self.path = self.path + '.html'
        super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.HTTPServer(('', PORT), RenderCVHandler) as httpd:
        print(f'Serving rendercv.com locally at http://localhost:{PORT}')
        print('Press Ctrl+C to stop')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopping server...')
            sys.exit(0)

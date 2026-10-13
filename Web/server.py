import sys
import os
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NullWriter:
    def write(self, s):
        pass
    def flush(self):
        pass

# When launched via pythonw, sys.stdout and sys.stderr are None
if sys.stdout is None:
    sys.stdout = NullWriter()
if sys.stderr is None:
    sys.stderr = NullWriter()

class RobustHandler(SimpleHTTPRequestHandler):
    extensions_map = SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.wasm': 'application/wasm',
        '.svg': 'image/svg+xml',
    })

    def log_message(self, format, *args):
        # Silently drop request logs to avoid NoneType write crashes in pythonw
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def free_port(port):
    try:
        out = subprocess.check_output(
            f'netstat -ano 2>nul | findstr ":{port} " | findstr "LISTENING"',
            shell=True
        ).decode(errors='ignore')
        current_pid = str(os.getpid())
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5:
                pid = parts[-1]
                if pid != current_pid and pid.isdigit() and int(pid) > 4:
                    subprocess.call(f'taskkill /F /PID {pid} >nul 2>&1', shell=True)
    except Exception:
        pass

def run(port=8080):
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    free_port(port)
    ThreadingHTTPServer.allow_reuse_address = True
    server_address = ('127.0.0.1', port)
    try:
        httpd = ThreadingHTTPServer(server_address, RobustHandler)
    except OSError:
        import time
        time.sleep(1)
        free_port(port)
        httpd = ThreadingHTTPServer(server_address, RobustHandler)
        
    try:
        httpd.serve_forever()
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run(port)

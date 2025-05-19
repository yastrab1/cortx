import signal
import time
import os
from subprocess import Popen, run, PIPE
import sys
import shutil

mcp = None
app = None

def check_node_installation():
    # Check if npm is installed
    npm_path = shutil.which('npm')
    if not npm_path:
        print("Error: npm is not installed or not in PATH")
        print("Please install Node.js from https://nodejs.org/")
        sys.exit(1)
    
    # Check if npx is installed
    npx_path = shutil.which('npx')
    if not npx_path:
        print("Error: npx is not installed or not in PATH")
        print("Please install Node.js from https://nodejs.org/")
        sys.exit(1)
    
    return npm_path, npx_path

try:
    npm_path, npx_path = check_node_installation()
    
    # Use full paths to npm and npx
    mcp = Popen([npx_path, "tsx", "index.ts", "-y"], cwd="./cortx-compute")
    time.sleep(1)
    app = Popen([npm_path, "run", "dev"], cwd="./cortx")
    
    # Keep the script running until Ctrl+C
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass

except KeyboardInterrupt:
    if mcp:
        mcp.terminate()
    if app:
        app.terminate()
    print("terminated")
except Exception as e:
    print(f"Error: {str(e)}")
    if mcp:
        mcp.terminate()
    if app:
        app.terminate()
    sys.exit(1) 
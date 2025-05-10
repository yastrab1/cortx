import signal
import time
from subprocess import Popen
mcp = None
app = None
try:
    mcp = Popen(["npx", "tsx", "index.ts","-y"],cwd="./cortx-compute")
    time.sleep(1)
    app = Popen(["npm","run", "dev"],cwd="./cortx")
    signal.pause()
except KeyboardInterrupt:
    mcp.terminate()
    app.terminate()
    print("terminated")
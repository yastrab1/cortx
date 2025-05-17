import signal
import time
import os
from subprocess import Popen
import subprocess
mcp = None
app = None
import os
import grp

def set_docker_group():
    docker_gid = grp.getgrnam('docker').gr_gid
    os.setgid(docker_gid)
set_docker_group()
try:
    mcp = Popen(["npx", "tsx", "index.ts","-y"],cwd="./cortx-compute",preexec_fn=set_docker_group)
    time.sleep(1)
    app = Popen(["npm","run", "dev"],cwd="./cortx",preexec_fn=set_docker_group)
    signal.pause()
except KeyboardInterrupt:
    mcp.terminate()
    app.terminate()
    print("terminated")
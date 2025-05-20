#!/bin/sh

# Start Docker daemon in the background
dockerd-entrypoint.sh &

# Wait until Docker daemon is ready
echo "Waiting for Docker to start..."
while ! docker info > /dev/null 2>&1; do
  sleep 1
  echo "Still waiting"
done


echo "Docker is ready."
docker pull yastrab1/cortx:latest
# Start your Node.js app
npx --yes tsx index.js

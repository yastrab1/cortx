# Start from the official Docker-in-Docker image
FROM docker:latest
# Install Node.js (via Alpine package or NodeSource)
# Here we use node v20 from Alpine community repo
ENV DOCKER_TLS_CERTDIR=""
ENV DOCKER_HOST=tcp://0.0.0.0:2375

RUN apk add --no-cache nodejs npm
RUN apk add sudo


# Set a working directory
WORKDIR /app

 COPY . /app
 COPY ./entrypoint.sh /entrypoint.sh

RUN ["chmod", "+x", "/entrypoint.sh"]
ENV CONTAINER_IMAGE=yastrab1/cortx:latest
EXPOSE 3001
ENTRYPOINT ["/usr/local/bin/dockerd-entrypoint.sh"]
CMD ["/entrypoint.sh"]
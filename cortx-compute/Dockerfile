FROM python:latest

# Install necessary packages
RUN apt-get update && \
    apt-get install -y sudo bash strace tzdata && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get install -y tzdata && \
        ln -fs /usr/share/zoneinfo/Europe/Bratislava /etc/localtime && \
        dpkg-reconfigure -f noninteractive tzdata

# Create a new user 'runner' with a home directory and bash shell
RUN useradd -m -s /bin/bash runner

# Add 'runner' to the 'sudo' group
RUN usermod -aG sudo runner

# Configure passwordless sudo for the 'sudo' group
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/nopasswd && \
    chmod 0440 /etc/sudoers.d/nopasswd

# Switch to the 'runner' user
USER runner

# Set the working directory
WORKDIR /home/runner

# Start bash shell
CMD ["bash"]

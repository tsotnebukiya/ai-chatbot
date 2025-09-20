#!/bin/bash

# Source local .env file if it exists (for copying secrets to production)
if [ -f "$(dirname "$0")/../.env" ]; then
  echo "Loading environment variables from local .env file..."
  source "$(dirname "$0")/../.env"
  echo "Loaded variables"
fi

# Env Vars (with fallbacks if not loaded from .env)
POSTGRES_USER="myuser"
POSTGRES_PASSWORD=$(openssl rand -base64 12)  # Generate a random 12-character password
POSTGRES_DB="mydatabase"

# Use values from .env or fallback to defaults
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-$(openssl rand -base64 32)}

# Auto-detect public IP for BETTER_AUTH_URL
echo "Auto-detecting public IP address..."
PUBLIC_IP=$(curl -s https://ipinfo.io/ip 2>/dev/null || curl -s https://api.ipify.org 2>/dev/null || echo "localhost")
BETTER_AUTH_URL="http://${PUBLIC_IP}:3000"
echo "Using BETTER_AUTH_URL: $BETTER_AUTH_URL"

BLOB_READ_WRITE_TOKEN=${BLOB_READ_WRITE_TOKEN:-""}
MISTRAL_API_KEY=${MISTRAL_API_KEY:-"your-mistral-key-here"}

# Script Vars
REPO_URL="https://github.com/tsotnebukiya/ai-chatbot"
APP_DIR=~/myapp
SWAP_SIZE="1G"  # Swap size of 1GB

# Update package list and upgrade existing packages
sudo apt update && sudo apt upgrade -y

# Add Swap Space
echo "Adding swap space..."
sudo fallocate -l $SWAP_SIZE /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Install Docker
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
sudo apt update
sudo apt install docker-ce -y

# Install Docker Compose
sudo rm -f /usr/local/bin/docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Wait for the file to be fully downloaded before proceeding
if [ ! -f /usr/local/bin/docker-compose ]; then
  echo "Docker Compose download failed. Exiting."
  exit 1
fi

sudo chmod +x /usr/local/bin/docker-compose

# Ensure Docker Compose is executable and in path
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify Docker Compose installation
docker-compose --version
if [ $? -ne 0 ]; then
  echo "Docker Compose installation failed. Exiting."
  exit 1
fi

# Ensure Docker starts on boot and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Clone the Git repository
if [ -d "$APP_DIR" ]; then
  echo "Directory $APP_DIR already exists. Pulling latest changes..."
  cd $APP_DIR && git pull
else
  echo "Cloning repository from $REPO_URL..."
  git clone $REPO_URL $APP_DIR
  cd $APP_DIR
fi

# For Docker internal communication ("db" is the name of Postgres container)
POSTGRES_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@db:5432/$POSTGRES_DB"

# For external tools (like Drizzle Studio)
POSTGRES_URL_EXTERNAL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"

# For Docker internal communication ("redis" is the name of Redis container)
REDIS_URL="redis://redis:6379"

# Export build variables so Docker can access them
export POSTGRES_URL_BUILD="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"
echo "DEBUG: POSTGRES_URL_BUILD = $POSTGRES_URL_BUILD"

# Create the .env file inside the app directory (~/myapp/.env)
echo "POSTGRES_USER=$POSTGRES_USER" > "$APP_DIR/.env"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> "$APP_DIR/.env"
echo "POSTGRES_DB=$POSTGRES_DB" >> "$APP_DIR/.env"
echo "POSTGRES_URL=$POSTGRES_URL" >> "$APP_DIR/.env"
echo "POSTGRES_URL_EXTERNAL=$POSTGRES_URL_EXTERNAL" >> "$APP_DIR/.env"
echo "REDIS_URL=$REDIS_URL" >> "$APP_DIR/.env"
echo "BLOB_READ_WRITE_TOKEN=$BLOB_READ_WRITE_TOKEN" >> "$APP_DIR/.env"
echo "MISTRAL_API_KEY=$MISTRAL_API_KEY" >> "$APP_DIR/.env"
echo "BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET" >> "$APP_DIR/.env"
echo "BETTER_AUTH_URL=$BETTER_AUTH_URL" >> "$APP_DIR/.env"
echo "POSTGRES_URL_BUILD=$POSTGRES_URL_BUILD" >> "$APP_DIR/.env"

# Build and run the Docker containers from the app directory (~/myapp)
cd $APP_DIR
sudo docker-compose up --build -d

# Check if Docker Compose started correctly
if ! sudo docker-compose ps | grep "Up"; then
  echo "Docker containers failed to start. Check logs with 'docker-compose logs'."
  exit 1
fi

# Output final message
echo "Deployment complete. Your Next.js app, Redis service, and PostgreSQL database are now running."
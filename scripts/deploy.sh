#!/bin/bash


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

# Assumes curl is already installed and you are in the repo dir
echo "Creating .env ..."

PUBLIC_IP=$(curl -s https://ipinfo.io/ip || curl -s https://api.ipify.org || echo "localhost")

POSTGRES_USER="myuser"
POSTGRES_PASSWORD="$(openssl rand -hex 16)"
POSTGRES_DB="mydatabase"

# Prompt for external secrets (silent input for safety)
read -s -p "Enter Vercel Blob Token: " BLOB_READ_WRITE_TOKEN; echo
read -s -p "Enter Mistral API Key: " MISTRAL_API_KEY; echo

BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="http://${PUBLIC_IP}:3000"

cat > .env <<EOF
# --- Docker Compose environment (auto-loaded) ---
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}

REDIS_URL=redis://redis:6379

BLOB_READ_WRITE_TOKEN=${BLOB_READ_WRITE_TOKEN}
MISTRAL_API_KEY=${MISTRAL_API_KEY}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=${BETTER_AUTH_URL}

NODE_ENV=production
EOF

echo ".env created."

# Build and run the Docker containers from the app directory (~/myapp)
sudo docker-compose up --build -d

# Output final message
echo "Deployment complete. Your Next.js app, Redis service, and PostgreSQL database are now running."
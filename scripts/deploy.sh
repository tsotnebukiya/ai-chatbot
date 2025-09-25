#!/bin/bash

########################################
# PROMPTS (no validation; no silent input)
########################################
read -r -p "Enter domain name (apex): " DOMAIN_NAME
read -r -p "Enter email for Let's Encrypt: " EMAIL

# Optional tokens (press Enter to skip)
read -r -p "Enter Vercel Blob Token (optional): " BLOB_READ_WRITE_TOKEN
read -r -p "Enter Google Client ID (optional): " GOOGLE_CLIENT_ID
read -r -p "Enter Google Client Secret (optional): " GOOGLE_CLIENT_SECRET
read -r -p "Enter Tavily API Key (optional): " TAVILY_API_KEY

# Mandatory API key
read -r -p "Enter Mistral API Key: " MISTRAL_API_KEY

########################################
# Script Vars (original flow preserved)
########################################
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

POSTGRES_USER="myuser"
POSTGRES_PASSWORD="$(openssl rand -hex 16)"
POSTGRES_DB="mydatabase"

BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="https://${DOMAIN_NAME}"

# Write mandatory env first
cat > .env <<EOF
# --- Docker Compose environment (auto-loaded) ---
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}

REDIS_URL=redis://redis:6379

MISTRAL_API_KEY=${MISTRAL_API_KEY}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=${BETTER_AUTH_URL}

NODE_ENV=production
EOF

# Append optional env only if provided (non-empty)
[ -n "${BLOB_READ_WRITE_TOKEN}" ] && echo "BLOB_READ_WRITE_TOKEN=${BLOB_READ_WRITE_TOKEN}" >> .env
[ -n "${GOOGLE_CLIENT_ID}" ] && echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" >> .env
[ -n "${GOOGLE_CLIENT_SECRET}" ] && echo "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" >> .env
[ -n "${TAVILY_API_KEY}" ] && echo "TAVILY_API_KEY=${TAVILY_API_KEY}" >> .env

echo ".env created."

# === BEGIN DOMAIN & TLS SETUP (VARIABLE-DRIVEN) ===

# Install Nginx + Certbot
sudo apt install -y nginx certbot

# (Optional) open firewall; harmless if ufw is disabled
sudo ufw allow OpenSSH || true
sudo ufw allow 80 || true
sudo ufw allow 443 || true

# Stop Nginx so Certbot can bind :80
sudo systemctl stop nginx || true

# Obtain a single certificate covering apex + www
sudo certbot certonly --standalone \
  -d "${DOMAIN_NAME}" -d "www.${DOMAIN_NAME}" \
  --non-interactive --agree-tos -m "${EMAIL}"

# Ensure TLS helper files exist
[ -f /etc/letsencrypt/options-ssl-nginx.conf ] || \
  sudo wget https://raw.githubusercontent.com/certbot/certbot/refs/heads/main/certbot-nginx/src/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf -P /etc/letsencrypt/
[ -f /etc/letsencrypt/ssl-dhparams.pem ] || \
  sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048

# Nginx site: HTTP→HTTPS and www→apex; reverse proxy to app on :3000
sudo tee /etc/nginx/sites-available/myapp >/dev/null <<EOL
limit_req_zone \$binary_remote_addr zone=mylimit:10m rate=10r/s;

# 80 → 443 for both hosts
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    return 301 https://${DOMAIN_NAME}\$request_uri;
}

# HTTPS apex: serves the app
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_NAME};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Optional rate limit
    limit_req zone=mylimit burst=20 nodelay;

    # Reverse proxy to Next.js on the host (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;

        # streaming-friendly
        proxy_buffering off;
        proxy_set_header X-Accel-Buffering no;
    }
}

# HTTPS www: present valid cert and redirect to apex
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.${DOMAIN_NAME};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://${DOMAIN_NAME}\$request_uri;
}
EOL

# Enable the site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp
sudo systemctl restart nginx
sudo systemctl enable nginx

# Auto-renew certificates daily at 03:00; reload Nginx if renewed
( crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx" ) | crontab -

# === END DOMAIN & TLS SETUP (VARIABLE-DRIVEN) ===

# Build and run the Docker containers from the app directory (~/myapp)
sudo docker-compose up --build -d

# Output final message
echo "Deployment complete. Your Next.js app, Redis service, and PostgreSQL database are now running."

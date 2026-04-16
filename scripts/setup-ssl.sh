#!/usr/bin/env bash
# run.sh — Bootstrap Certbot, get SSL cert, start all services
set -e

CERTBOT_DIR="./certbot/conf"
WWW_DIR="./certbot/www"

echo "=== Duadata Docker Setup ==="

# 1. Create certbot directories
mkdir -p "$CERTBOT_DIR/live/duadata.net"
mkdir -p "$WWW_DIR/.well-known/acme-challenge"

# 2. Stop any existing containers so port 80 is free
docker compose down 2>/dev/null || true

# 3. Start nginx on port 80 for ACME challenge
echo "Starting nginx for ACME challenge..."
docker compose up -d nginx

# 4. Request Let's Encrypt certificate
echo "Requesting SSL certificate for duadata.net..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email admin@duadata.net \
  --agree-tos \
  --no-eff-email \
  -d duadata.net \
  -d www.duadata.net

# 5. Reload nginx with SSL config
echo "Reloading nginx with SSL..."
docker compose restart nginx

# 6. Start app
echo "Starting all services..."
docker compose up -d

echo ""
echo "=== Done! ==="
echo "App available at: https://duadata.net"
echo "To stop:   docker compose down"
echo "To logs:    docker compose logs -f"
echo "To restart: docker compose restart"
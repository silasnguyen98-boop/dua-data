# Dứa Data — Duadata.net

## Dev

```bash
npm run dev   # http://localhost:3000
npm run build && npm start
```

## Docker Production (Production với domain duadata.net)

```bash
# 1. Chạy setup SSL + khởi động toàn bộ service
bash scripts/setup-ssl.sh

# 2. Kiểm tra trạng thái
docker compose ps

# 3. Xem logs
docker compose logs -f

# 4. Khởi động lại
docker compose restart

# 5. Dừng
docker compose down
```

## Docker Stack

| Container       | Image            | Ports       | Mục đích                          |
|----------------|-----------------|-------------|-----------------------------------|
| `app`          | custom (build)  | 3000 (expose)| Next.js standalone server        |
| `nginx`        | nginx:alpine    | 80, 443     | Reverse proxy + SSL termination   |
| `certbot`      | certbot/certbot | —           | Auto-renew SSL certificates       |

## SSL

- Certificate path: `certbot/conf/live/duadata.net/`
- Auto-renewal: certbot renew mỗi 12h
- Challenge method: webroot (`/.well-known/acme-challenge/`)

## API Proxy

- Nginx proxies all requests → `http://app:3000`
- WebSocket/SSE upgrade headers passed through
- Static assets (`/_next/static/`) cached 60m

## Cấu trúc

```
Duadata/
├── Dockerfile           # Multi-stage build
├── docker-compose.yml   # app + nginx + certbot
├── nginx.conf           # Reverse proxy config
├── scripts/
│   └── setup-ssl.sh     # Bootstrap SSL + start all services
└── src/                 # Next.js app
```
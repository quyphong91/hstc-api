# Deployment Guide

This guide covers multiple deployment options for the HSTC API, from simple cloud platforms to self-hosted solutions.

## Table of Contents

- [Quick Deploy (Recommended)](#quick-deploy-recommended)
  - [Vercel](#vercel)
  - [Railway](#railway)
- [Docker Deployment](#docker-deployment)
- [VPS / Self-Hosted](#vps--self-hosted)
- [Environment Variables](#environment-variables)
- [Production Checklist](#production-checklist)

---

## Quick Deploy (Recommended)

### Vercel

**Best for:** Serverless deployment with automatic scaling

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd hstc-api
   vercel deploy
   ```

3. **Configure**
   - Domain: Set custom domain in Vercel dashboard
   - Environment variables: Add `PORT=3000` if needed
   - Build command: `npm run build`
   - Start command: `npm start`

4. **Production**
   ```bash
   vercel --prod
   ```

**Pros:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy rollbacks
- ✅ Zero-downtime deployments

**Cons:**
- ⚠️ Serverless functions have 10s timeout (this API is fast enough)
- ⚠️ Cold starts possible

---

### Railway

**Best for:** Full Node.js runtime with persistent containers

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd hstc-api
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Add Domain**
   ```bash
   railway domain
   ```

**Pros:**
- ✅ Always-on containers (no cold starts)
- ✅ Built-in PostgreSQL/Redis if needed
- ✅ Automatic HTTPS
- ✅ GitHub auto-deploy
- ✅ Simple pricing

**Cons:**
- ⚠️ No free tier (starts at $5/month)

**Railway Configuration (`railway.json`):**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Docker Deployment

### Build Image

Create `Dockerfile`:

```dockerfile
# Use official Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t hstc-api .

# Run container
docker run -d \
  --name hstc-api \
  -p 3000:3000 \
  -e PORT=3000 \
  --restart unless-stopped \
  hstc-api
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: hstc-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Run:**
```bash
docker-compose up -d
```

**Logs:**
```bash
docker-compose logs -f api
```

---

## VPS / Self-Hosted

Deploy on any VPS (DigitalOcean, Linode, AWS EC2, etc.)

### Prerequisites

- Ubuntu 22.04 LTS (or similar)
- Node.js 20+ installed
- Nginx (optional, for reverse proxy)
- PM2 (for process management)

### Setup

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/quyphong91/hstc-api.git
   cd hstc-api
   ```

4. **Install Dependencies**
   ```bash
   npm ci --only=production
   ```

5. **Build**
   ```bash
   npm run build
   ```

6. **Start with PM2**
   ```bash
   pm2 start dist/index.js --name hstc-api
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx (Optional)**

   Create `/etc/nginx/sites-available/hstc-api`:

   ```nginx
   server {
       listen 80;
       server_name api.tracuuhs.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/hstc-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **Setup SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.tracuuhs.com
   ```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'hstc-api',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

**Start with ecosystem:**
```bash
pm2 start ecosystem.config.js
```

---

## Environment Variables

### Required

None (API works out of the box)

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (development/production) |

### Example `.env` File

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Custom configuration
# (Add more as needed)
```

---

## Production Checklist

Before deploying to production, ensure:

### Security

- ✅ HTTPS enabled (use Certbot, Cloudflare, or platform SSL)
- ✅ Rate limiting configured (already built-in)
- ✅ Helmet middleware enabled (already built-in)
- ✅ CORS properly configured (default: allow all origins)
- ✅ No sensitive data in environment variables

### Performance

- ✅ Data preloaded at startup (already implemented)
- ✅ Caching enabled (in-memory caching already implemented)
- ✅ Compression enabled (consider adding gzip)
- ✅ PM2 cluster mode for multi-core CPUs (if using PM2)

### Monitoring

- ✅ Health check endpoint working (`/api/v1/health`)
- ✅ Logging configured (PM2 logs or platform logs)
- ✅ Uptime monitoring (UptimeRobot, Pingdom, etc.)
- ✅ Error tracking (optional: Sentry, Rollbar)

### Backup

- ✅ Code in version control (Git)
- ✅ Deployment automation (CI/CD with GitHub Actions)
- ✅ Database backups (N/A - no database, data is static JSON)

### Testing

- ✅ Test all endpoints in production
  ```bash
  # Health check
  curl https://api.tracuuhs.com/v1/health

  # Search
  curl -X POST https://api.tracuuhs.com/v1/search \
    -H "Content-Type: application/json" \
    -d '{"keyword":"milk","maxResults":3}'

  # Chapters
  curl https://api.tracuuhs.com/v1/chapters

  # Specific chapter
  curl https://api.tracuuhs.com/v1/chapters/4

  # Heading
  curl https://api.tracuuhs.com/v1/headings/0401
  ```

- ✅ Test rate limiting
  ```bash
  # Check rate limit headers
  curl -I https://api.tracuuhs.com/v1/health
  ```

- ✅ Test authentication
  ```bash
  # With API key
  curl -X POST https://api.tracuuhs.com/v1/search \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer your-api-key" \
    -d '{"keyword":"coffee"}'
  ```

---

## Scaling Considerations

### Horizontal Scaling

If you need to handle more traffic:

1. **Load Balancer**
   - Use Nginx, HAProxy, or cloud load balancer
   - Distribute traffic across multiple API instances

2. **Multiple Instances**
   ```bash
   # PM2 cluster mode (automatic)
   pm2 start ecosystem.config.js -i max

   # Or Docker with multiple containers
   docker-compose up -d --scale api=4
   ```

3. **CDN**
   - Put Cloudflare in front of your API
   - Cache static responses (chapters list, health check)
   - DDoS protection included

### Vertical Scaling

If you need more power:

1. **Increase Memory**
   - Data is loaded into memory (~15MB)
   - More memory = more concurrent requests

2. **More CPU Cores**
   - Use PM2 cluster mode to utilize all cores
   - Search is CPU-intensive (text matching)

3. **SSD Storage**
   - Faster file reads on startup
   - Not critical (data is preloaded)

---

## Monitoring & Alerts

### Simple Uptime Monitoring

**UptimeRobot (Free):**
1. Visit https://uptimerobot.com
2. Add monitor: `https://api.tracuuhs.com/v1/health`
3. Set alert email/SMS

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Logs
pm2 logs hstc-api

# CPU/Memory usage
pm2 list
```

### Custom Health Checks

The API includes a health endpoint that returns uptime and version:

```bash
curl https://api.tracuuhs.com/v1/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-02-14T10:30:00Z",
  "dataVersion": "2024",
  "uptime": 3600.5
}
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>
```

### Memory Issues

```bash
# Check memory usage
free -h

# PM2 memory monitoring
pm2 monit

# Restart if needed
pm2 restart hstc-api
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### CORS Issues

If you need to restrict CORS:

Edit `src/server.ts`:
```typescript
app.use(cors({
  origin: ['https://tracuuhs.com', 'https://yourapp.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/hstc-api
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart hstc-api
```

---

## Support

Need help with deployment?

- **Documentation**: [https://tracuuhs.com/api/docs](https://tracuuhs.com/api/docs)
- **GitHub Issues**: [https://github.com/quyphong91/hstc-api/issues](https://github.com/quyphong91/hstc-api/issues)
- **Community**: Join our discussions on GitHub

---

**Deployed successfully?** Share your experience and help others! Open a PR to add your deployment story to this guide.

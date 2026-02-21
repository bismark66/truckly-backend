# GitHub Actions Setup Guide

## Required GitHub Secrets

Add these secrets to your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

### Deployment Secrets (Required)

1. **TAILSCALE_AUTHKEY**
   - Your Tailscale authentication key for secure VPN connection
   - Get it from: https://login.tailscale.com/admin/settings/keys

2. **SERVER_HOST**
   - Your server's hostname or IP address
   - Example: `100.64.0.1` (Tailscale IP) or `server.example.com`

3. **SERVER_USER**
   - SSH username for your server
   - Example: `ubuntu` or `root`

4. **SSH_PRIVATE_KEY**
   - Private SSH key for authentication
   - Generate with: `ssh-keygen -t ed25519 -C "github-actions"`
   - Copy private key: `cat ~/.ssh/id_ed25519`
   - Add public key to server: `ssh-copy-id user@server`

### Optional Secrets

5. **SLACK_WEBHOOK_URL** (Optional)
   - Slack webhook URL for deployment notifications
   - Create at: https://api.slack.com/messaging/webhooks
   - Example: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

## Workflow Overview

### On Push to `main` or `master`:

1. ✅ **Test & Lint** - Runs tests and linting with PostgreSQL & Redis
2. 🐳 **Build Docker Image** - Builds and pushes to GitHub Container Registry
3. 🚀 **Deploy to Server** - Deploys via SSH with Tailscale VPN
4. 💾 **Automatic Backup** - Creates database backup before deployment
5. ❤️ **Health Check** - Verifies deployment success
6. 🔄 **Auto Rollback** - Reverts changes if deployment fails
7. 📢 **Notify Team** - Sends Slack notification (if configured)

### On Pull Request:

- ✅ Runs tests and linting
- 🔍 Checks code formatting
- 📝 Posts PR comment with results

## Server Requirements

### Prerequisites on your Ubuntu server:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Setup project directory
mkdir ~/truckly-backend
cd ~/truckly-backend
git clone <your-repo-url> .

# Create .env file
cp .env.example .env
# Edit .env with your production values

# Initial deployment
docker compose up -d
```

### Required Files on Server:

- `~/truckly-backend/` - Project directory
- `~/truckly-backend/.env` - Environment variables
- `~/truckly-backend/docker-compose.yml` - Docker configuration
- `~/truckly-backend/docker-compose.prod.yml` - Production overrides

## Manual Deployment

If you need to deploy manually:

```bash
# Connect to server
ssh user@server

# Navigate to project
cd ~/truckly-backend

# Pull latest changes
git pull origin main

# Deploy
docker compose down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose run --rm app-prod pnpm run migration:run

# Check logs
docker compose logs -f app-prod
```

## Troubleshooting

### Deployment fails on migrations:

```bash
# SSH into server
ssh user@server

# Check migration status
cd ~/truckly-backend
docker compose run --rm app-prod pnpm run migration:show

# Run migrations manually
docker compose run --rm app-prod pnpm run migration:run
```

### Health check fails:

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f app-prod

# Test health endpoint
curl http://localhost:3000/health
```

### Rollback to previous version:

```bash
# SSH into server
ssh user@server
cd ~/truckly-backend

# Stop current deployment
docker compose down

# Checkout previous commit
git log --oneline -5  # Find commit hash
git checkout <previous-commit-hash>

# Deploy previous version
docker compose up -d --build
```

### View deployment history:

```bash
# On GitHub
# Go to Actions tab → Deploy Truckly Backend

# On server
cd ~/truckly-backend
git log --oneline -10
```

## Environment Variables

Ensure these are set in your server's `.env` file:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<secure-password>
DB_NAME=truckly

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>

# JWT
JWT_SECRET=<secure-secret>
JWT_REFRESH_SECRET=<secure-refresh-secret>

# Firebase
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_PRIVATE_KEY=<your-private-key>
FIREBASE_CLIENT_EMAIL=<your-client-email>

# Application
NODE_ENV=production
PORT=3000
```

## Monitoring

### View live logs:

```bash
docker compose logs -f app-prod
```

### Check resource usage:

```bash
docker stats
```

### Database backup:

```bash
# Backups are created automatically before each deployment
# Located at: ~/truckly-backend/backup_YYYYMMDD_HHMMSS.sql

# Manual backup
docker compose exec -T postgres pg_dump -U postgres truckly > backup_manual.sql
```

## Support

For issues with the deployment pipeline:

1. Check GitHub Actions logs
2. Review server logs: `docker compose logs -f`
3. Verify secrets are correctly set in GitHub
4. Ensure Tailscale is properly configured
5. Check server disk space and resources

# Deployment Guide

## Overview

Resume Dashboard can be deployed in several environments: local development, Podman/Docker containers, or production servers.

---

## Development Deployment

### Prerequisites
- Node.js 20+
- Ollama running locally
- Pandoc + XeLaTeX (for PDF generation)
- Git

### Steps

```bash
# 1. Clone repository
git clone https://github.com/yourusername/resume-dashboard.git
cd resume-dashboard

# 2. Install dependencies
cd frontend && npm install
cd ../backend && npm install

# 3. Pull LLM model
ollama pull qwen2.5:1.5b

# 4. Start servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd ../frontend && npm run dev

# 5. Access at http://localhost:5173
```

---

## Container Deployment

### Option A: Podman Compose (Local Ollama)

Best for development with local Ollama instance.

```bash
# From project root
podman compose -f podman-compose.yml up
```

**Ports:**
- Frontend: 4445 → 5173
- Backend: 4446 → 3000

**Configuration:**
- Backend connects to `host.containers.internal:11434` (host's Ollama)
- Data persists in `./data/` directory

---

### Option B: Podman Full Stack

Complete standalone deployment including Ollama.

```bash
# Start full stack
podman compose -f podman-compose-full.yml up

# Pull model (optional - can be done inside container)
podman exec -it resume-dashboard-ollama ollama pull qwen2.5:1.5b
```

**Ports:**
- Frontend: 4445 → 5173
- Backend: 4446 → 3000
- Ollama: 11434 → 11434

---

### Option C: Docker Compose

```bash
# Start stack
docker compose up -d

# View logs
docker compose logs -f

# Check health
curl http://localhost:4446/health

# Stop stack
docker compose down
```

---

## Production Deployment

### Using Docker

**1. Build Images**

```bash
# Build backend
docker build -t resume-dashboard-backend -f Dockerfile.backend .

# Build frontend (requires separate build)
# Frontend uses Vite dev server in dev, build for production
cd frontend
npm run build
```

**2. Create Production Dockerfile**

```dockerfile
# Frontend production
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## Kubernetes Deployment

Generate manifests:

```bash
# Convert Podman compose to Kubernetes
podman compose -f podman-compose.yml convert > k8s-manifests.yaml
```

Or create manually:

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resume-dashboard-backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: resume-dashboard-backend
  template:
    metadata:
      labels:
        app: resume-dashboard-backend
    spec:
      containers:
      - name: backend
        image: resume-dashboard-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATA_DIR
          value: /data
        - name: LLM_ENDPOINT
          value: http://ollama:11434
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: resume-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: resume-dashboard-backend
spec:
  selector:
    app: resume-dashboard-backend
  ports:
  - port: 3000
    targetPort: 3000
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Backend server port |
| `DATA_DIR` | `/app/data` | Data storage directory |
| `LLM_ENDPOINT` | `http://localhost:11434` | Ollama API endpoint |
| `LLM_MODEL` | `qwen2.5:1.5b` | Default model |
| `NODE_ENV` | `development` | Node environment |

---

## Data Persistence

### Local/Podman
Data stored in `./data/` directory:
- Applications metadata and content
- PDF files
- Settings
- Archive

### Docker Volume
```yaml
volumes:
  - type: bind
    source: ./data
    target: /app/data
```

---

## Health Checks

### Backend Health
```bash
curl http://localhost:4446/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "dataDir": "/app/data"
}
```

### Frontend Health
Access `http://localhost:4445` and verify React app loads.

### LLM Health
```bash
curl http://localhost:11434/api/version
```

---

## Reverse Proxy (Nginx)

Example configuration:

```nginx
server {
    listen 80;
    server_name resume.example.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## SSL/TLS

For production, add SSL:

```nginx
server {
    listen 443 ssl;
    server_name resume.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... same location blocks as above
}
```

---

## Monitoring

### Logs
```bash
# Podman
podman logs resume-dashboard-backend-1 -f

# Docker
docker logs -f resume-dashboard-backend

# Backend health check every 30 seconds
```

### Build Information
Check build success:
```bash
# Verify containers are running
podman ps
# or
docker ps
```

---

## Backup Strategy

```bash
# Backup data directory
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restore
tar -xzf backup-20240115.tar.gz -C /path/to/restore
```

---

## Scaling

### Multiple Instances
The app is designed to run with a single backend instance due to file-based storage. For horizontal scaling:

1. **Use shared storage**: NFS, cloud storage bucket
2. **Consider database**: PostgreSQL for metadata, S3 for files
3. **Sticky sessions**: For SSE connections

---

## Troubleshooting

### Port Conflicts
```bash
# Find process using port
lsof -i :5173  # Frontend
lsof -i :3000  # Backend
lsof -i :4445  # Podman exposed

# Kill process
kill -9 <PID>
```

### Container Network Issues
```bash
# Check Podman network
podman network ls

# Inspect container
podman inspect resume-dashboard-backend
```

### PDF Generation Fails
1. Verify pandoc is installed
2. Check XeLaTeX is available
3. Check container has proper permissions
4. Review container logs for errors
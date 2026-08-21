# Quick Start Guide

## Prerequisites

Before getting started, ensure you have:

1. **Node.js 20+** installed
2. **Ollama** running locally (for LLM features)
3. **Podman** or Docker (for container deployment)
4. **Pandoc + XeLaTeX** (for PDF generation)

---

## Option 1: Local Development

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/resume-dashboard.git
cd resume-dashboard

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Set Environment Variables

```bash
# Create .env file (optional - defaults are provided)
echo "LLM_ENDPOINT=http://localhost:11434" > backend/.env
echo "LLM_MODEL=qwen2.5:1.5b" >> backend/.env
```

### 3. Pull an LLM Model

```bash
# Pull a model in Ollama
ollama pull qwen2.5:1.5b
# Or for smaller models
ollama pull llama2
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd ../frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

The frontend proxies `/api/*` requests to the backend automatically.

---

## Option 2: Podman Compose

### Using Local Ollama

```bash
# From project root
podman compose -f podman-compose.yml up
```

### Using Bundled Ollama

```bash
# Full stack with Ollama container
podman compose -f podman-compose-full.yml up
```

### Access

- **Dashboard**: http://localhost:4445
- **Backend API**: http://localhost:4446/api

---

## Option 3: Docker Compose

```bash
docker compose up
```

---

## Getting Started Tasks

### 1. Create Your First Application

1. Click **Applications** tab
2. Click **+ New Application**
3. Fill in:
   - Company name
   - Position title
   - Job description (paste from job posting)
   - Notes (optional)

### 2. Generate a Tailored Resume

1. Select your application
2. Go to **Tryouts** tab
3. Click **+ Generate New Tryout**
4. Wait for LLM to generate (10-30 seconds)
5. Review in Monaco editor

### 3. Run Gap Analysis

1. Select a tryout
2. Click **Run Gap Analysis**
3. Review coverage percentage and gaps
4. Edit resume to address critical gaps
5. Re-run analysis as needed

### 4. Generate PDF

1. Go to **Finalize** tab
2. Select application and tryout version
3. Click **Generate PDF**
4. Click **Download PDF** to save

---

## Common Commands

### Podman
```bash
# View running containers
podman ps

# View logs
podman logs resume-dashboard-backend-1 -f

# Stop stack
podman compose -f podman-compose.yml down

# Rebuild after code changes
podman compose -f podman-compose.yml up --build
```

### Docker
```bash
docker compose up
docker compose down
```

### Development
```bash
# Frontend hot reload
cd frontend && npm run dev

# Backend with nodemon
cd backend && npm run dev

# Run linting
cd frontend && npm run lint
cd backend && npx eslint .
```

---

## Troubleshooting

### Ollama Connection Failed
```bash
# Check if Ollama is running
ollama list

# If not running, start it
ollama serve

# Or check local endpoint
curl http://localhost:11434/api/version
```

### PDF Generation Fails
```bash
# Check Pandoc installation
pandoc --version

# Install XeLaTeX (Ubuntu/Debian)
sudo apt-get install texlive-xetex

# Install Pandoc
sudo apt-get install pandoc
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5173  # Frontend
lsof -i :3000  # Backend

# Kill process or change port
```

### "Cannot find module" Errors
```bash
# Reinstall dependencies
cd frontend && rm -rf node_modules && npm install
cd ../backend && rm -rf node_modules && npm install
```
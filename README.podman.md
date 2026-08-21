# Podman Deployment

This document covers running Resume Dashboard using Podman instead of Docker.

## Why Podman?

- **Rootless containers** - No root/sudo required
- **Docker-compatible** - Uses same compose syntax
- **Kubernetes integration** - Can generate KEDA YAML

## Quick Start with Podman

### Prerequisites

```bash
# Check Podman installation
podman --version

# Ensure podman-compose plugin is installed (or use podman compose)
podman-compose --version  # or podman compose version
```

### Option 1: Connect to Local Ollama

If you have Ollama running on your host machine:

```bash
# Start the stack (connects to host's Ollama)
podman-compose -f podman-compose.yml up

# Or with podman compose (Podman 4.0+)
podman compose -f podman-compose.yml up
```

Access the dashboard at: http://localhost:4445

### Option 2: Full Stack (with Ollama container)

For a complete standalone deployment:

```bash
# Start with bundled Ollama
podman-compose -f podman-compose-full.yml up
```

**Note:** First run will be slow as it downloads the Ollama model. You can pre-pull:

```bash
# Pre-pull models (optional, run before starting stack)
podman run --rm -it -v ollama-data:/root/.ollama ollama/ollama ollama pull llama2
```

Or download using Ollama directly:
```bash
# If Ollama is already running locally
ollama pull llama2
```

## Port Mapping

| Port | Service | Description |
|------|---------|-------------|
| 4445 | Frontend | React Vite dev server |
| 4446 | Backend | Express API server |
| 11434 | Ollama | LLM API (full stack only) |

## Data Persistence

Data is stored in `./data/` directory and persisted via volume mounts:
- `data/applications/` — Job applications
- `data/tryouts/` — Resume iterations  
- `data/primers/` — Interview prep materials
- `data/pdfs/` — Generated PDFs
- `data/archive/` — Resume library

## Networking Notes

Podman uses `host.containers.internal` as the hostname to reach the host machine from within containers. This is configured in `podman-compose.yml`:

**Note:** If you have existing data from Docker (stored in `./data/settings.json`), the LLM endpoint may still be set to `localhost:11434`. If connections fail, you can:
1. Delete `./data/settings.json` to reset to defaults, or
2. Update the endpoint in the Settings tab of the application

```yaml
environment:
  - LLM_ENDPOINT=http://host.containers.internal:11434
```

For the full stack (`podman-compose-full.yml`), the backend connects to the internal `ollama` service:

```yaml
environment:
  - LLM_ENDPOINT=http://ollama:11434
```

## Useful Commands

```bash
# View running containers/contents
podman ps

# View logs (all services)
podman-compose -f podman-compose.yml logs -f

# View logs for specific service
podman-compose -f podman-compose.yml logs -f backend

# Stop the stack
podman-compose -f podman-compose.yml down

# Rebuild containers after code changes
podman-compose -f podman-compose.yml up --build

# Generate Kubernetes manifests
podman compose -f podman-compose.yml convert
```

## Podman vs Docker Differences

| Aspect | Docker | Podman |
|--------|--------|--------|
| Command | `docker compose` | `podman compose` |
| Root required | No (Docker Desktop) | Never |
| Container runtime | dockerd | containerd/podman |
| Host networking | `host.docker.internal` | `host.containers.internal` |

## Health Checks

Both services include health checks:
- Frontend: Checks Vite dev server responds
- Backend: Checks `/health` endpoint returns 200

Check health status:
```bash
podman-compose -f podman-compose.yml ps
```
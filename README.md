# Resume Dashboard

AI-powered resume generation and interview preparation dashboard. Tailor resumes to job descriptions, analyze gaps, fact-check claims, generate PDFs, and prepare for interviews using local LLM (Ollama).

## Features

✅ **Application Management** — Track job applications with company, position, job description, and notes  
✅ **Resume Generation** — LLM-powered resume tailoring based on job requirements  
✅ **Gap Analysis** — Compare resume against job description to identify missing qualifications  
✅ **Fact Checking** — Verify resume claims for credibility and accuracy  
✅ **PDF Export** — Convert markdown resumes to PDF using Pandoc + XeLaTeX  
✅ **Interview Prep** — Generate likely interview questions with suggested answers and "truthful outs"  
✅ **Prompt Templates** — Manage and customize LLM prompts for requirement extraction, resume generation, gap analysis, and fact checking  
✅ **Resume Archive** — Library of past resumes for reference and reuse  
✅ **Settings** — Configure theme (dark/light/auto), LLM endpoint, and data folders  
✅ **Real-time Updates** — Server-Sent Events (SSE) for live progress during LLM operations

## Tech Stack

**Frontend:**
- React 18 with Vite dev server
- Tailwind CSS with DockHand design tokens
- Monaco Editor for markdown editing
- Server-Sent Events (SSE) for real-time updates

**Backend:**
- Node.js 20 with Express
- File-based storage (JSON metadata + Markdown content)
- Ollama LLM integration (local, offline-capable)
- Pandoc + XeLaTeX for PDF generation

**Deployment:**
- Docker Compose with frontend (port 4445) + backend (port 4446)
- Volume-mounted data persistence
- Health checks and non-root user (nodejs:1001)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Ollama running locally: `http://localhost:11434` ([Install Ollama](https://ollama.ai/download))
- Pull an LLM model: `ollama pull llama2`

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/resume-dashboard.git
cd resume-dashboard

# Start the stack
docker compose up

# Access the dashboard
open http://localhost:4445
```

Backend API: `http://localhost:4446`  
Backend Health: `http://localhost:4446/health`

### Data Persistence

All application data is stored in `./data/` (volume-mounted):
- `data/applications/` — Job applications (JSON + MD)
- `data/tryouts/` — Resume iterations
- `data/primers/` — Interview prep materials
- `data/pdfs/` — Generated PDF files
- `data/archive/` — Resume library

## Usage

### 1. Create an Application

1. Go to **Applications** tab
2. Click **+ New Application**
3. Enter company, position, job description (markdown), notes
4. Click **Create**

### 2. Generate Tailored Resume

1. Select an application
2. Go to **Tryouts** tab
3. Click **Generate New Tryout**
4. Wait for LLM to create tailored resume (10-30 seconds)
5. Review generated resume in Monaco editor

### 3. Analyze Gaps

1. Select a tryout
2. Click **Run Gap Analysis**
3. Review coverage percentage, gaps, and strengths
4. Edit resume to address critical gaps
5. Re-run gap analysis until satisfied

### 4. Fact Check

1. Click **Fact Check** on a tryout
2. Review credibility rating and flagged claims
3. Adjust or remove problematic statements
4. Regenerate if needed

### 5. Generate PDF

1. Go to **Finalize** tab
2. Select application and tryout version
3. Click **Generate PDF**
4. Click **Download PDF** to save file

### 6. Interview Prep

1. Go to **Interview Primers** tab
2. Select application and resume version
3. Click **Generate Interview Primer**
4. Review likely questions, suggested answers, and truthful outs
5. Prepare responses and practice delivery

## Architecture

```
Frontend (Vite:5173 → Docker:4445)
  ├── React 18 + Tailwind CSS
  ├── Monaco Editor (markdown)
  ├── SSE client (real-time updates)
  └── 7 tabs: Applications, Tryouts, Prompts, Finalize, Primers, Archive, Settings

Backend (Express:3000 → Docker:4446)
  ├── REST API (applications, tryouts, primers, pdfs, archive, settings)
  ├── SSE event stream (/api/events)
  ├── File-based storage (JSON + Markdown)
  ├── Ollama LLM client (requirement extraction, resume generation, gap analysis, fact check)
  └── Pandoc service (MD → PDF via xelatex)

Docker Compose
  ├── Frontend container (Node 20 Alpine, Vite dev server)
  ├── Backend container (Node 20 Alpine, Pandoc + texlive-xetex installed)
  └── Volume mounts: ./data (persistent storage)
```

## API Reference

**Applications:**
- `GET /api/applications` — List all applications
- `POST /api/applications` — Create application
- `GET /api/applications/:id` — Get application details
- `PUT /api/applications/:id` — Update application
- `DELETE /api/applications/:id` — Delete application

**Tryouts:**
- `GET /api/applications/:id/tryouts` — List tryouts for application
- `POST /api/applications/:id/tryouts` — Generate new tryout (LLM)
- `GET /api/tryouts/:id` — Get tryout details
- `PUT /api/tryouts/:id` — Update tryout
- `POST /api/tryouts/:id/gap-analysis` — Run gap analysis (LLM)
- `POST /api/tryouts/:id/fact-check` — Run fact check (LLM)

**PDF Generation:**
- `POST /api/tryouts/:id/pdf` — Generate PDF from markdown
- `GET /api/tryouts/:id/pdf/download` — Download PDF file

**Interview Primers:**
- `GET /api/applications/:id/primer` — Get existing primer
- `POST /api/applications/:id/primer/generate` — Generate primer (LLM)

**Archive:**
- `GET /api/archive/resumes` — List archived resumes
- `POST /api/archive/resumes` — Upload resume to archive
- `DELETE /api/archive/resumes/:id` — Delete archived resume

**Settings:**
- `GET /api/settings` — Get current settings
- `PUT /api/settings` — Update settings (theme, LLM endpoint, folders)

**Events (SSE):**
- `GET /api/events` — Subscribe to real-time updates (tryout generation, gap analysis, fact check progress)

## Configuration

**Environment Variables** (backend):
```bash
PORT=3000                           # Backend server port
DATA_DIR=./data                     # Data storage directory
LLM_ENDPOINT=http://localhost:11434 # Ollama endpoint
LLM_MODEL=llama2                    # Default LLM model
```

**Settings UI** (Settings tab):
- Theme: light / dark / auto
- LLM Provider: ollama (OpenAI future support)
- LLM Endpoint: URL to Ollama server
- LLM Model: Model name (llama2, mistral, etc.)
- Folder Paths: Applications and archive directories

## Development

```bash
# Backend (port 3000)
cd backend
npm install
npm run dev

# Frontend (port 5173)
cd frontend
npm install
npm run dev
```

## Troubleshooting

**Issue: PDF generation fails**
- **Cause:** Pandoc or XeLaTeX not installed  
- **Solution:** Rebuild Docker image: `docker compose up --build`  
- **Verification:** `docker exec -it resume-dashboard-backend-1 pandoc --version`

**Issue: LLM generation slow/fails**
- **Cause:** Ollama not running or wrong model  
- **Solution:** Start Ollama, pull model: `ollama pull llama2`  
- **Verification:** `curl http://localhost:11434/api/version` should return JSON

**Issue: Frontend shows CORS error**
- **Cause:** Backend not accessible  
- **Solution:** Check backend logs: `docker logs resume-dashboard-backend-1`  
- **Verification:** `curl http://localhost:4446/health` should return `{"status":"healthy"}`

**Issue: Changes not reflected in Docker**
- **Cause:** Cached image  
- **Solution:** Rebuild: `docker compose up --build`

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Run tests and verify Docker build
4. Submit pull request with description

## Roadmap

- [ ] Add OAuth integration for LinkedIn job scraping
- [ ] Export interview primers to PDF
- [ ] Multi-threaded Ollama requests for faster batch generation
- [ ] Prompt version history and A/B testing
- [ ] Browser extension to scrape job descriptions automatically
- [ ] Mobile-responsive design

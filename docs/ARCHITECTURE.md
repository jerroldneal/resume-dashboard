# Resume Dashboard Architecture

## Overview

Resume Dashboard is an AI-powered job application tracking system that helps users:
- Track job applications
- Generate tailored resumes using LLMs
- Analyze resume-job matching gaps
- Validate resume claims
- Generate interview preparation materials
- Export resumes as PDFs

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    App.jsx + Routes                       │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │  │
│  │  │ Applications  │  │ Tryouts       │  │ Finalize      │ │  │
│  │  │ Tab           │  │ Tab           │  │ Tab           │ │  │
│  │  ├───────────────┤  ├───────────────┤  ├───────────────┤ │  │
│  │  │ Primers Tab   │  │ Prompts Tab   │  │ Archive Tab   │ │  │
│  │  │ Settings Tab  │  │ Events (SSE)  │  │               │ │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘ │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │  REST API + SSE                   │
│                            ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Backend (Express)                       │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │  │
│  │  │ Application   │  │ Tryout        │  │ Primer        │ │  │
│  │  │ Routes        │  │ Routes        │  │ Routes        │ │  │
│  │  ├───────────────┤  ├───────────────┤  ├───────────────┤ │  │
│  │  │ Events Routes │  │ Prompt Routes │  │ PDF Routes    │ │  │
│  │  │ Settings      │  │               │  │ Archive       │ │  │
│  │  │ Routes        │  │               │  │ Routes        │ │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘ │  │
│  └─────────────────┬───────────────────────────────────────┘  │
│                    │  File-based Storage                     │
│                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Storage Service                         │  │
│  │  • JSON metadata files                                   │  │
│  │  • Markdown content files                                │  │
│  │  • Settings (JSON)                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                    External Services                           │
  │  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
  │  │   Ollama LLM     │  │  Pandoc + XeLaTeX (PDF Generation)  │  │
  │  │   (local)        │  │                                     │  │
  │  │ • qwen2.5:1.5b   │  │ • Converts Markdown → PDF         │  │
│  │  │ • llama2, etc.   │  │ • XeLaTeX for formatting          │  │
│  │  └──────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Components

| Component | Purpose | Files |
|-----------|---------|-------|
| `App.jsx` | Main app with routing | `frontend/src/App.jsx` |
| `ApplicationsTab` | Create/mange job applications | `frontend/src/components/ApplicationsTab.jsx` |
| `TryoutsTab` | Generate and edit tailored resumes | `frontend/src/components/TryoutsTab.jsx` |
| `FinalizeTab` | PDF generation and download | `frontend/src/components/FinalizeTab.jsx` |
| `PrimersTab` | Interview prep materials | `frontend/src/components/PrimersTab.jsx` |
| `PromptsTab` | Prompt template management | `frontend/src/components/PromptsTab.jsx` |
| `ArchiveTab` | Resume library | `frontend/src/components/ArchiveTab.jsx` |
| `SettingsTab` | Configuration | `frontend/src/components/SettingsTab.jsx` |
| `useSSE` hook | Server-Sent Events client | `frontend/src/hooks/useSSE.js` |

### Backend Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/applications` | GET, POST | List/create applications |
| `/api/applications/:id` | GET, PUT, DELETE | Application details |
| `/api/applications/:appId/tryouts` | GET, POST | List/create tryouts |
| `/api/tryouts/:tryoutId` | GET, PUT | Tryout details |
| `/api/tryouts/:tryoutId/gap-analysis` | POST | Run gap analysis |
| `/api/tryouts/:tryoutId/fact-check` | POST | Run fact check |
| `/api/tryouts/:id/pdf` | POST | Generate PDF |
| `/api/tryouts/:id/pdf/download` | GET | Download PDF |
| `/api/events` | GET | SSE event stream |
| `/api/prompts/:id/test` | POST | Test prompt templates |

### Backend Services

| Service | Purpose |
|---------|---------|
| `storageService.js` | File-based data persistence (JSON + Markdown) |
| `llmClient.js` | Ollama API client for LLM operations |
| `pandocService.js` | PDF generation via Pandoc/XeLaTeX |
| `primerService.js` | Interview primer generation |

## Data Flow

### Resume Generation Flow
1. **Create Application** → Store application metadata + job description
2. **Generate Tryout** → Call LLM with prompt + inputs → Store as Markdown
3. **Gap Analysis** → Call LLM with resume + job description → Store results
4. **Fact Check** → Call LLM with resume → Store credibility results
5. **Generate PDF** → Convert Markdown → Pandoc/XeLaTeX → PDF file

### Real-time Updates
- Backend uses Server-Sent Events (SSE) at `/api/events`
- Frontend `useSSE()` hook manages connections
- Events: `tryout_generated`, `gap_analysis_completed`, `fact_check_completed`

## Technology Stack

### Frontend
- **React 18** - Component library
- **Vite 5** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Monaco Editor** - Markdown editing
- **React Router** - Client-side routing

### Backend
- **Node.js 20** - Runtime
- **Express** - Web framework
- **ES Modules** - Modern module syntax
- **CORS** - Cross-origin handling

### Storage
- **File-based** - JSON metadata + Markdown content
- **Directory structure**: `./data/applications/`, `./data/archive/`, etc.

### External Services
- **Ollama** - Local LLM inference (qwen2.5:1.5b, llama2, etc.)
- **Pandoc + XeLaTeX** - PDF generation

## Configuration

### Environment Variables (Backend)
```bash
PORT=3000                    # Server port
DATA_DIR=./data              # Data storage directory
LLM_ENDPOINT=http://localhost:11434  # Ollama API
LLM_MODEL=qwen2.5:1.5b       # Default model
```

### Settings (Stored in data/settings.json)
```json
{
  "theme": "auto",           // light, dark, auto
  "folders": {
    "applications": "./data/applications",
    "archive": "./data/archive"
  },
  "llm": {
    "provider": "ollama",
    "endpoint": "http://localhost:11434",
    "model": "qwen2.5:1.5b"
  }
}
```
# Data Model

## Overview

Resume Dashboard uses a simple file-based storage system with JSON metadata and Markdown content files. This document describes the data structures and storage layout.

---

## Directory Structure

```
data/
├── applications/              # Job applications directory
│   ├── {applicationId}/     # Each application is a folder
│   │   ├── metadata.json    # Application metadata
│   │   ├── jd.md           # Job description
│   │   ├── notes.md        # Additional notes
│   │   ├── tryouts/        # Resume variations
│   │   │   └── {tryoutId}/
│   │   │       ├── metadata.json
│   │   │   └── resume.md
│   │   ├── primer.json     # Interview primer data
│   │   └── archive/        # Archived resumes
├── archive/                  # Global resume archive
│   ├── {filename}.md
├── pdfs/                     # Generated PDFs
│   ├── resume-{tryoutId}.pdf
├── settings.json            # Global settings
```

---

## Data Types

### Application metadata.json
```typescript
interface Application {
  id: string;           // UUID v4
  company: string;      // Company name
  position: string;     // Job title
  status: 'active' | 'archived';
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  notes?: string;       // User notes
}
```

---

### Tryout metadata.json
```typescript
interface Tryout {
  id: string;           // UUID v4
  applicationId: string; // Reference to application
  version: number;      // Tryout version number
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
  gapAnalysis: GapAnalysis | null;
  factCheck: FactCheck | null;
  pdfGenerated: boolean;
}
```

---

### Gap Analysis Result
```typescript
interface GapAnalysis {
  coverage: number;     // 0-100 percentage
  gaps: Gap[];
  strengths: string[];
  overallAssessment: string;
}

interface Gap {
  requirement: string;
  severity: 'critical' | 'moderate' | 'minor';
  suggestion: string;
}
```

---

### Fact Check Result
```typescript
interface FactCheck {
  overallCredibility: 'high' | 'medium' | 'low';
  claims: Claim[];
  recommendations: string[];
}

interface Claim {
  statement: string;
  category: 'dates' | 'metrics' | 'technology' | 'responsibility' | 'other';
  concern: 'none' | 'unverifiable' | 'implausible';
  suggestion?: string;
}
```

---

### Interview Primer
```typescript
interface Primer {
  applicationId: string;
  tryoutId: string;
  title: string;
  questions: Question[];
  answers: Answer[];
  truthfulOuts: string[];
}

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Answer {
  id: string;
  questionId: string;
  answer: string;
  talkingPoint: string;
}
```

---

### Settings
```typescript
interface Settings {
  theme: 'light' | 'dark' | 'auto';
  folders: {
    applications: string;    // Path to applications directory
    archive: string;         // Path to archive directory
  };
  llm: {
    provider: 'ollama';      // Future: 'openai'
    endpoint: string;        // Ollama API URL
    model: string;           // Default model name
  };
  updatedAt?: string;
}
```

---

## Resume Template Structure

### Markdown Resume Format
```markdown
# John Doe

## Summary
Experienced software engineer with 5+ years building scalable systems.

## Experience

### Senior Engineer | TechCorp | 2020-Present
- Led development of microservice architecture serving 1M+ users
- Reduced latency by 40% through cache optimization
- Mentored 3 junior engineers

### Software Engineer | StartupXYZ | 2018-2020
- Built React applications for enterprise clients
- Contributed to open-source projects

## Skills
- **Languages**: JavaScript, TypeScript, Python
- **Frameworks**: React, Node.js, Express
- **Cloud**: AWS, Docker, Kubernetes

## Education
**BS Computer Science** | State University | 2014-2018
```

---

## Data Flow Examples

### Creating a New Application
1. Frontend POST `/api/applications` with company, position, jobDescription
2. Backend creates directory `data/applications/{id}`
3. Saves `metadata.json` with application info
4. Saves `jd.md` with job description
5. Returns created application ID

### Generating a Tryout
1. Frontend POST `/api/applications/{id}/tryouts`
2. Backend:
   - Creates directory `data/applications/{id}/tryouts/{tryoutId}`
   - Saves `metadata.json`
   - Calls LLM with prompt + job description
   - Saves `resume.md` with generated content
3. SSE broadcasts `tryout_generated` event

### Saving a PDF
1. User clicks "Generate PDF" in Finalize tab
2. Backend:
   - Reads `resume.md`
   - Converts to PDF via Pandoc
   - Saves to `data/pdfs/resume-{tryoutId}.pdf`
3. API returns path to PDF file
# Resume Dashboard API Reference

## Overview

The Resume Dashboard provides a RESTful API for managing job applications, resume tryouts, interview primers, and more. All endpoints return JSON responses.

## Base URL

```
http://localhost:4446/api
```

(Frontend proxies `/api/*` to backend)

---

## Applications Endpoints

### List Applications
```
GET /api/applications
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-string",
      "company": "Company Name",
      "position": "Job Title",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "notes": "Interview scheduled for next week"
    }
  ],
  "count": 1
}
```

---

### Create Application
```
POST /api/applications
```

**Body:**
```json
{
  "company": "Acme Corp",
  "position": "Senior Software Engineer",
  "jobDescription": "# Job Description\n\n## Requirements\n- 5+ years experience\n- JavaScript, React",
  "notes": "Applied via LinkedIn"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid-string",
    "company": "Acme Corp",
    "position": "Senior Software Engineer",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "notes": "Applied via LinkedIn"
  }
}
```

---

### Get Application
```
GET /api/applications/:id
```

**Response:**
```json
{
  "data": {
    "id": "uuid-string",
    "company": "Acme Corp",
    "position": "Senior Software Engineer",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "jobDescription": "# Job Description...",
    "notes": "Applied via LinkedIn"
  }
}
```

---

### Update Application
```
PUT /api/applications/:id
```

**Body:**
```json
{
  "company": "Updated Company",
  "position": "Updated Position",
  "jobDescription": "# New JD...",
  "notes": "New notes"
}
```

---

### Delete Application
```
DELETE /api/applications/:id
```

---

## Tryouts Endpoints

### List Tryouts for Application
```
GET /api/applications/:applicationId/tryouts
```

**Response:**
```json
{
  "data": [
    {
      "id": "tryout-uuid",
      "applicationId": "app-uuid",
      "version": 1,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z",
      "gapAnalysis": null,
      "factCheck": null,
      "pdfGenerated": false
    }
  ],
  "count": 1
}
```

---

### Create Tryout (Generate Resume)
```
POST /api/applications/:applicationId/tryouts
```

**Body:**
```json
{
  "baseResume": "Existing resume content...",
  "version": 1
}
```

**Response:**
```json
{
  "data": {
    "id": "tryout-uuid",
    "applicationId": "app-uuid",
    "version": 1,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

> **Note**: Full resume content is streamed via SSE events. Listen to `/api/events` for `tryout_generated` with `status: 'completed'`.

---

### Get Tryout
```
GET /api/applications/:applicationId/tryouts/:tryoutId
```

**Response:**
```json
{
  "data": {
    "id": "tryout-uuid",
    "applicationId": "app-uuid",
    "version": 1,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z",
    "resumeContent": "# Resume\n\n## Experience\n...",
    "gapAnalysis": {
      "coverage": 85,
      "gaps": [...],
      "strengths": [...],
      "overallAssessment": "..."
    },
    "factCheck": {
      "overallCredibility": "medium",
      "claims": [...]
    }
  }
}
```

---

### Update Tryout
```
PUT /api/applications/:applicationId/tryouts/:tryoutId
```

**Body:**
```json
{
  "resumeContent": "Updated resume content...",
  "version": 2
}
```

---

### Run Gap Analysis
```
POST /api/applications/:applicationId/tryouts/:tryoutId/gap-analysis
```

**Response:**
```json
{
  "data": {
    "coverage": 85,
    "gaps": [
      {
        "requirement": "AWS certification",
        "severity": "moderate",
        "suggestion": "Add AWS certification experience"
      }
    ],
    "strengths": ["React experience"],
    "overallAssessment": "Good fit with some gaps"
  }
}
```

---

### Run Fact Check
```
POST /api/applications/:applicationId/tryouts/:tryoutId/fact-check
```

**Response:**
```json
{
  "data": {
    "overallCredibility": "medium",
    "claims": [
      {
        "statement": "Led team of 10 engineers",
        "category": "dates",
        "concern": "unverifiable",
        "suggestion": "Verify team size claim"
      }
    ],
    "recommendations": ["Add specific metrics"]
  }
}
```

---

## PDF Generation Endpoints

### Generate PDF
```
POST /api/tryouts/:id/pdf
```

**Response:**
```json
{
  "success": true,
  "message": "PDF generated successfully",
  "data": {
    "tryoutId": "uuid",
    "filename": "resume-uuid.pdf",
    "pdfPath": "/app/data/pdfs/resume-uuid.pdf"
  }
}
```

---

### Download PDF
```
GET /api/tryouts/:id/pdf/download
```

**Response:** Binary PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="resume-{id}.pdf"`

---

## Interview Primers Endpoints

### Get Primer
```
GET /api/applications/:id/primer
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationId": "uuid",
    "tryoutId": "uuid",
    "title": "Interview Prep for Senior Engineer Role",
    "questions": [...],
    "answers": [...],
    "truthfulOuts": [...]
  }
}
```

---

### Generate Primer
```
POST /api/applications/:id/primer/generate
```

**Body:**
```json
{
  "tryoutId": "tryout-uuid"
}
```

---

## Prompt Test Endpoint

### Test Prompt Template
```
POST /api/prompts/:id/test
```

**Body:**
```json
{
  "inputVariables": {
    "jobDescription": "Job description text...",
    "baseResume": "Resume content..."
  },
  "prompt": "Template with {variables}"
}
```

**Response:**
```json
{
  "success": true,
  "processedPrompt": "Final prompt ready for LLM",
  "response": "LLM output here...",
  "endpoint": "http://localhost:11434"
}
```

---

## Settings Endpoints

### Get Settings
```
GET /api/settings
```

**Response:**
```json
{
  "data": {
    "theme": "auto",
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
}
```

---

### Update Settings
```
PUT /api/settings
```

**Body:**
```json
{
  "theme": "dark",
  "llm": {
    "endpoint": "http://localhost:11434",
    "model": "llama2"
  }
}
```

---

## SSE Events Endpoint

### Subscribe to Events
```
GET /api/events
```

**Event Types:**
- `tryout_generated` - New resume tryout completed
- `gap_analysis_completed` - Gap analysis finished
- `fact_check_completed` - Fact checking finished
- `error` - Error occurred during operation

**Event Format:**
```
data: {"type": "tryout_generated", "data": {"applicationId": "...", "tryoutId": "...", "status": "completed"}}
```

---

## Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "dataDir": "/app/data"
}
```

---

## Error Responses

All errors return HTTP status code and message:

```json
{
  "error": "Tryout not found",
  "path": "/api/tryouts/nonexistent",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |
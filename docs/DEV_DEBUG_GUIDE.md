# Development & Debug Guide

## Running in Debug Mode

This guide covers how to run and debug the Resume Dashboard frontend and backend during development.

---

## Frontend Development

### Start Vite Dev Server (Debug Mode)

```bash
cd frontend
npm run dev
```

**What you get:**
- Hot Module Replacement (HMR) - instant updates on code changes
- Source maps for debugging
- Error overlay in browser
- Debug logging in terminal

**Access:** http://localhost:5173

### Vite Dev Server Options

```bash
# Run on specific port
npm run dev -- --port 5173

# Run with host binding (needed for Docker)
npm run dev -- --host

# Verbose logging
npm run dev -- --debug

# Build and preview
npm run build && npm run preview
```

---

## Debugging in Browser

### Chrome DevTools

1. Open http://localhost:5173
2. Press `F12` or `Ctrl+Shift+I` (Cmd+Option+I on Mac)
3. Navigate tabs:
   - **Elements** - Inspect HTML/CSS
   - **Console** - View logs, errors, REPL
   - **Sources** - Debug JavaScript with breakpoints
   - **Network** - Monitor API requests
   - **Performance** - Profile performance
   - **Application** - Inspect localStorage, cookies

### React Developer Tools

Install browser extension:
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkobljjk)

**Features:**
- Component tree inspection
- Props and state viewing
- Hook inspection
- Performance monitoring

---

## Backend Debugging

### Start Backend in Watch Mode

```bash
cd backend
npm run dev
```

This uses `nodemon` to restart the server on file changes.

### Debug with Node.js Inspector

```bash
# Start with inspector
node --inspect-brk server.js

# Or with nodemon
NODE_OPTIONS='--inspect' npx nodemon server.js.js
```

Then open Chrome DevTools:
1. Go to `chrome://inspect`
2. Click "Configure" and add `localhost:9229`
3. Click "Open dedicated DevTools for Node"

### Console Logging

The backend uses structured logging:

```javascript
console.log('[PROMPTS] Test request received');
console.error('[PROMPTS] Error testing prompt:', err);
```

**Log locations:**
- Server startup: Backend root logs
- Request logs: HTTP requests logged with timestamp
- Operation logs: `[COMPONENT] Message` format

---

## Full Stack Debugging

### 1. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Use Vite Proxy for API Debugging

Vite automatically proxies `/api/*` requests:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

**Debug API calls in browser:**
1. Open DevTools → Network tab
2. Filter by XHR
3. Check request/response headers and payloads

### 3. Debug Backend API Handlers

Add temporary console logs or debugging middleware:

```javascript
// In server.js
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  console.log('Params:', req.params);
  next();
});
```

---

## Debugging Specific Features

### API Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# List applications
curl http://localhost:3000/api/applications

# Create application
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"company":"Test","position":"Engineer"}'

# Test prompt endpoint
curl -X POST http://localhost:3000/api/prompts/resume-generation/test \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello {name}","inputVariables":{"name":"World"}}'
```

### Debugging SSE Events

**Browser:**
```javascript
// In browser console
const eventSource = new EventSource('/api/events');
eventSource.onmessage = (e) => console.log(JSON.parse(e.data));
eventSource.onerror = (e) => console.error(e);
```

**Terminal:**
```bash
# Watch events endpoint
curl http://localhost:3000/api/events
```

---

## VS Code Debugging Setup

### Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "Debug Frontend (with Chrome)",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/vite",
      "args": ["dev"],
      "runtimeExecutable": "node",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Tasks Configuration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "group": "none",
      "presentation": {
        "reveal": "always"
      },
      "problemMatcher": []
    },
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "group": "none",
      "presentation": {
        "reveal": "always"
      },
      "problemMatcher": []
    }
  ]
}
```

---

## Debugging Checklist

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify Vite HMR is working (no full page reloads)
- [ ] Check Network tab for failed API calls
- [ ] Verify proxy is forwarding `/api/*` requests
- [ ] Check component state with React DevTools

### Backend Issues
- [ ] Check terminal logs for error messages
- [ ] Verify file permissions in `./data/` directory
- [ ] Check if Ollama is running: `curl http://localhost:11434/api/version`
- [ ] Look for port conflicts
- [ ] Check for unhandled promise rejections

### Common Debug Commands

```bash
# Kill process on port
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3000 | xargs kill -9  # Backend

# View all listening ports
lsof -i -P

# Check Node version
node --version

# Check npm version
npm --version

# Clear Vite cache
rm -rf frontend/node_modules/.vite
```

---

## Debug Mode Comparison

| Environment | Port | Features | Use Case |
|-------------|------|----------|----------|
| `npm run dev` | 5173 | HMR, Source maps, DevTools | Active development |
| `vite preview` | 5173 | Production build, No HMR | Preview production build |
| Node inspect | N/A | Breakpoints, Step-through | Deep debugging |
| Docker/Podman | 4445 | Container isolated | Testing deployment |

---

## Performance Debugging

### Measure API Response Times

```javascript
// In browser console
performance.mark('start');
fetch('/api/applications').then(() => {
  performance.mark('end');
  performance.measure('api-call', 'start', 'end');
  console.log(performance.getEntriesByName('api-call')[0].duration);
});
```

### React Component Profiling

1. Open React DevTools
2. Click "Profiler" tab
3. Click the target icon (⏺️) to start recording
4. Interact with components
5. Click stop and analyze renders

---

## Environment Variables for Debugging

```bash
# Set in frontend/.env or .env.local
VITE_DEBUG=true
VITE_API_URL=http://localhost:3000

# Set in backend
DEBUG=true
NODE_ENV=development
LLM_ENDPOINT=http://localhost:11434
```
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import applicationsRouter from './routes/applications.js';
import eventsRouter from './routes/events.js';
import tryoutsRouter from './routes/tryouts.js';
import { convertMarkdownToPDF, getPDFBuffer } from './services/pandocService.js';
import { generateInterviewPrimer } from './services/primerService.js';
import { initializeStorage } from './services/storageService.js';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dataDir: DATA_DIR
  });
});

// Mount SSE events router
app.use('/api/events', eventsRouter);

// Mount Applications router
app.use('/api/applications', applicationsRouter);

// Mount Tryouts router (nested under applications)
app.use('/api/applications/:applicationId', tryoutsRouter);

// Prompts routes (placeholders)
app.get('/api/applications/:id/prompts', (req, res) => {
  res.json({ message: 'Prompts list endpoint - to be implemented', applicationId: req.params.id });
});

app.post('/api/prompts/:id/generate', (req, res) => {
  res.json({ message: 'Generate prompt endpoint - to be implemented', id: req.params.id });
});

// Interview Primers routes
app.get('/api/applications/:id/primer', async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { getPrimer } = await import('./services/storageService.js');
    const primer = await getPrimer(applicationId);

    if (!primer) {
      return res.status(404).json({ error: 'No primer found for this application' });
    }

    res.json({
      success: true,
      data: primer
    });
  } catch (error) {
    console.error('[PRIMER] Fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/applications/:id/primer/generate', async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { tryoutId } = req.body;

    if (!tryoutId) {
      return res.status(400).json({ error: 'tryoutId is required' });
    }

    // Get application and tryout
    const { getApplication, getTryout, savePrimer } = await import('./services/storageService.js');
    const application = await getApplication(applicationId);
    const tryout = await getTryout(applicationId, tryoutId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!tryout) {
      return res.status(404).json({ error: 'Tryout not found' });
    }

    // Generate primer using LLM
    const primerData = await generateInterviewPrimer(
      application.jobDescription,
      tryout.resumeContent
    );

    // Add metadata
    primerData.applicationId = applicationId;
    primerData.tryoutId = tryoutId;

    // Save primer to storage
    await savePrimer(applicationId, primerData);

    res.json({
      success: true,
      message: 'Interview primer generated successfully',
      data: primerData
    });
  } catch (error) {
    console.error('[PRIMER] Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Finalization routes
app.post('/api/tryouts/:id/pdf', async (req, res) => {
  try {
    const tryoutId = req.params.id;

    // Get tryout from storage
    const { getTryout } = await import('./services/storageService.js');
    const tryout = await getTryout(tryoutId);

    if (!tryout) {
      return res.status(404).json({ error: 'Tryout not found' });
    }

    if (!tryout.resumeContent) {
      return res.status(400).json({ error: 'No resume content to convert' });
    }

    // Generate PDF
    const filename = `resume-${tryoutId}.pdf`;
    const result = await convertMarkdownToPDF(tryout.resumeContent, filename);

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: {
        tryoutId,
        filename: result.filename,
        pdfPath: result.pdfPath
      }
    });
  } catch (error) {
    console.error('[PDF] Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tryouts/:id/pdf/download', async (req, res) => {
  try {
    const tryoutId = req.params.id;
    const pdfPath = path.join(__dirname, 'data', 'pdfs', `resume-${tryoutId}.pdf`);

    // Get PDF buffer
    const buffer = await getPDFBuffer(pdfPath);

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resume-${tryoutId}.pdf"`);

    res.send(buffer);
  } catch (error) {
    console.error('[PDF] Download error:', error);
    res.status(404).json({ error: 'PDF not found. Generate it first.' });
  }
});

// Archive routes (placeholders)
app.get('/api/archive/resumes', (req, res) => {
  res.json({ message: 'Resume archive list endpoint - to be implemented', data: [] });
});

app.post('/api/archive/resumes', (req, res) => {
  res.json({ message: 'Upload resume endpoint - to be implemented', body: req.body });
});

// Settings routes (placeholders)
app.get('/api/settings', (req, res) => {
  res.json({
    message: 'Settings endpoint - returning defaults',
    data: {
      theme: 'auto',
      folders: {
        applications: './data/applications',
        archive: './data/archive'
      },
      llm: {
        provider: 'ollama',
        endpoint: 'http://localhost:11434'
      }
    }
  });
});

app.put('/api/settings', (req, res) => {
  res.json({ message: 'Update settings endpoint - to be implemented', body: req.body });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Initialize storage and start server
async function startServer() {
  try {
    await initializeStorage();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Resume Dashboard Backend running on port ${PORT}`);
      console.log(`[SERVER] Data directory: ${DATA_DIR}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
      console.log(`[SERVER] SSE events: http://localhost:${PORT}/api/events`);
      console.log(`[SERVER] Applications API: http://localhost:${PORT}/api/applications`);
    });
  } catch (err) {
    console.error('[SERVER] Failed to start:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully');
  process.exit(0);
});

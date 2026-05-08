import { Router } from 'express';

const router = Router();

// Store active SSE connections
const activeConnections = new Set();

// Event types
export const EVENT_TYPES = {
  CONNECTED: 'connected',
  HEARTBEAT: 'heartbeat',
  APPLICATION_CREATED: 'application_created',
  APPLICATION_UPDATED: 'application_updated',
  APPLICATION_DELETED: 'application_deleted',
  TRYOUT_GENERATED: 'tryout_generated',
  TRYOUT_UPDATED: 'tryout_updated',
  GAP_ANALYSIS_STARTED: 'gap_analysis_started',
  GAP_ANALYSIS_COMPLETED: 'gap_analysis_completed',
  FACT_CHECK_STARTED: 'fact_check_started',
  FACT_CHECK_COMPLETED: 'fact_check_completed',
  PDF_GENERATION_STARTED: 'pdf_generation_started',
  PDF_GENERATION_COMPLETED: 'pdf_generation_completed',
  PRIMER_GENERATED: 'primer_generated',
  ERROR: 'error'
};

/**
 * Broadcast an event to all connected SSE clients
 * @param {string} type - Event type from EVENT_TYPES
 * @param {object} data - Event payload
 */
export function broadcastEvent(type, data) {
  const event = {
    type,
    data,
    timestamp: new Date().toISOString()
  };

  const eventString = `data: ${JSON.stringify(event)}\n\n`;

  activeConnections.forEach(client => {
    try {
      client.write(eventString);
    } catch (err) {
      console.error('[SSE] Error sending event to client:', err.message);
      activeConnections.delete(client);
    }
  });

  console.log(`[SSE] Broadcasted ${type} to ${activeConnections.size} clients`);
}

/**
 * SSE endpoint - maintains persistent connection for real-time updates
 */
router.get('/', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  const connectionEvent = {
    type: EVENT_TYPES.CONNECTED,
    data: { clientId: req.ip },
    timestamp: new Date().toISOString()
  };
  res.write(`data: ${JSON.stringify(connectionEvent)}\n\n`);

  // Add client to active connections
  activeConnections.add(res);
  console.log(`[SSE] Client connected (${activeConnections.size} total)`);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      const heartbeat = {
        type: EVENT_TYPES.HEARTBEAT,
        data: { timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(heartbeat)}\n\n`);
    } catch (err) {
      console.error('[SSE] Heartbeat error:', err.message);
      cleanup();
    }
  }, 30000);

  // Cleanup function
  const cleanup = () => {
    clearInterval(heartbeatInterval);
    activeConnections.delete(res);
    console.log(`[SSE] Client disconnected (${activeConnections.size} remaining)`);
  };

  // Handle client disconnect
  req.on('close', cleanup);
  req.on('end', cleanup);
});

/**
 * Send a targeted event to all clients (for testing)
 */
router.post('/test', (req, res) => {
  const { type, data } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Event type required' });
  }

  broadcastEvent(type, data || {});

  res.json({
    success: true,
    recipients: activeConnections.size,
    event: { type, data }
  });
});

/**
 * Get SSE connection stats
 */
router.get('/stats', (req, res) => {
  res.json({
    activeConnections: activeConnections.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;

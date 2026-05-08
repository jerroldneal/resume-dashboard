import { Router } from 'express';
import {
    createApplication,
    deleteApplication,
    getApplication,
    listApplications,
    updateApplication
} from '../services/storageService.js';
import { broadcastEvent, EVENT_TYPES } from './events.js';

const router = Router();

/**
 * GET /api/applications
 * List all applications
 */
router.get('/', async (req, res, next) => {
  try {
    const applications = await listApplications();
    res.json({ data: applications, count: applications.length });
  } catch (err) {
    console.error('[APPLICATIONS] Error listing applications:', err);
    next(err);
  }
});

/**
 * GET /api/applications/:id
 * Get a specific application with job description
 */
router.get('/:id', async (req, res, next) => {
  try {
    const application = await getApplication(req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ data: application });
  } catch (err) {
    console.error('[APPLICATIONS] Error getting application:', err);
    next(err);
  }
});

/**
 * POST /api/applications
 * Create a new application
 *
 * Body:
 * {
 *   company: string,
 *   position: string,
 *   jobDescription: string (optional),
 *   notes: string (optional),
 *   status: 'active' | 'archived' (optional, default: 'active')
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { company, position, jobDescription, notes, status } = req.body;

    // Validation
    if (!company || !position) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['company', 'position']
      });
    }

    const application = await createApplication({
      company,
      position,
      jobDescription,
      notes,
      status
    });

    // Broadcast SSE event
    broadcastEvent(EVENT_TYPES.APPLICATION_CREATED, {
      id: application.id,
      company: application.company,
      position: application.position
    });

    res.status(201).json({ data: application });
  } catch (err) {
    console.error('[APPLICATIONS] Error creating application:', err);
    next(err);
  }
});

/**
 * PUT /api/applications/:id
 * Update an application
 *
 * Body: Partial application object (any fields to update)
 */
router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    const application = await updateApplication(req.params.id, updates);

    // Broadcast SSE event
    broadcastEvent(EVENT_TYPES.APPLICATION_UPDATED, {
      id: application.id,
      company: application.company,
      position: application.position
    });

    res.json({ data: application });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('[APPLICATIONS] Error updating application:', err);
    next(err);
  }
});

/**
 * DELETE /api/applications/:id
 * Delete an application (and all associated tryouts/primers)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteApplication(req.params.id);

    // Broadcast SSE event
    broadcastEvent(EVENT_TYPES.APPLICATION_DELETED, {
      id: req.params.id
    });

    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    console.error('[APPLICATIONS] Error deleting application:', err);
    next(err);
  }
});

/**
 * GET /api/applications/:id/requirements
 * Extract requirements from job description (placeholder - will use LLM)
 */
router.get('/:id/requirements', async (req, res, next) => {
  try {
    const application = await getApplication(req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // TODO: Use LLM to extract requirements from job description
    // For now, return placeholder
    res.json({
      data: {
        applicationId: application.id,
        requirements: [],
        message: 'LLM requirement extraction not yet implemented'
      }
    });
  } catch (err) {
    console.error('[APPLICATIONS] Error extracting requirements:', err);
    next(err);
  }
});

export default router;

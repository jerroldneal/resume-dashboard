import { Router } from 'express';
import {
    callLLM,
    generateResumeContent
} from '../services/llmClient.js';
import {
    createTryout,
    getApplication,
    getTryout,
    listTryouts,
    updateTryout
} from '../services/storageService.js';
import { broadcastEvent, EVENT_TYPES } from './events.js';

// This router is mounted at /api/applications/:applicationId
// All routes here are relative to that base path
const router = Router({ mergeParams: true });

/**
 * GET /api/applications/:applicationId/tryouts
 * List all tryouts for an application
 */
router.get('/tryouts', async (req, res, next) => {
  try {
    const tryouts = await listTryouts(req.params.applicationId);
    res.json({ data: tryouts, count: tryouts.length });
  } catch (err) {
    console.error('[TRYOUTS] Error listing tryouts:', err);
    next(err);
  }
});

/**
 * GET /api/applications/:applicationId/tryouts/:tryoutId
 * Get a specific tryout with resume content
 */
router.get('/tryouts/:tryoutId', async (req, res, next) => {
  try {
    const { applicationId, tryoutId } = req.params;
    const tryout = await getTryout(applicationId, tryoutId);

    if (!tryout) {
      return res.status(404).json({ error: 'Tryout not found' });
    }

    res.json({ data: tryout });
  } catch (err) {
    console.error('[TRYOUTS] Error getting tryout:', err);
    next(err);
  }
});

/**
 * POST /api/applications/:applicationId/tryouts
 * Generate a new tryout resume using LLM
 *
 * Body:
 * {
 *   baseResume: string (optional - markdown content to start from),
 *   version: number (optional - tryout version number)
 * }
 */
router.post('/tryouts', async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { baseResume, version } = req.body;

    // Get application to access job description
    const application = await getApplication(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!application.jobDescription) {
      return res.status(400).json({
        error: 'No job description available for this application'
      });
    }

    // Broadcast generation started event
    broadcastEvent(EVENT_TYPES.TRYOUT_GENERATED, {
      applicationId,
      status: 'started',
      company: application.company,
      position: application.position
    });

    // Generate resume content using LLM
    console.log(`[TRYOUTS] Generating resume for ${application.company} - ${application.position}`);
    const resumeContent = await generateResumeContent(
      application.jobDescription,
      baseResume
    );

    // Save tryout
    const tryout = await createTryout(applicationId, {
      resumeContent,
      version
    });

    // Broadcast generation completed event
    broadcastEvent(EVENT_TYPES.TRYOUT_GENERATED, {
      applicationId,
      tryoutId: tryout.id,
      status: 'completed',
      company: application.company,
      position: application.position
    });

    res.status(201).json({ data: tryout });
  } catch (err) {
    console.error('[TRYOUTS] Error generating tryout:', err);

    // Broadcast error event
    broadcastEvent(EVENT_TYPES.ERROR, {
      applicationId: req.params.applicationId,
      operation: 'tryout_generation',
      error: err.message
    });

    next(err);
  }
});

/**
 * PUT /api/applications/:applicationId/tryouts/:tryoutId
 * Update a tryout's resume content or metadata
 *
 * Body: Partial tryout object
 */
router.put('/tryouts/:tryoutId', async (req, res, next) => {
  try {
    const { applicationId, tryoutId } = req.params;
    const updates = req.body;

    const tryout = await updateTryout(applicationId, tryoutId, updates);

    // Broadcast update event
    broadcastEvent(EVENT_TYPES.TRYOUT_UPDATED, {
      applicationId,
      tryoutId
    });

    res.json({ data: tryout });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('[TRYOUTS] Error updating tryout:', err);
    next(err);
  }
});

/**
 * POST /api/applications/:applicationId/tryouts/:tryoutId/gap-analysis
 * Run gap analysis comparing resume to job requirements
 *
 * Body: {}
 */
router.post('/tryouts/:tryoutId/gap-analysis', async (req, res, next) => {
  try {
    const { applicationId, tryoutId } = req.params;

    // Get tryout and application
    const tryout = await getTryout(applicationId, tryoutId);
    if (!tryout) {
      return res.status(404).json({ error: 'Tryout not found' });
    }

    const application = await getApplication(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Broadcast analysis started
    broadcastEvent(EVENT_TYPES.GAP_ANALYSIS_STARTED, {
      applicationId,
      tryoutId
    });

    // Run gap analysis using LLM
    const prompt = `Compare this resume against the job requirements and identify gaps.

Job Description:
${application.jobDescription}

Resume:
${tryout.resumeContent}

Provide a JSON response with this structure:
{
  "coverage": 0-100 (percentage of requirements covered),
  "gaps": [{"requirement": "...", "severity": "critical|moderate|minor", "suggestion": "..."}],
  "strengths": ["..."],
  "overallAssessment": "..."
}`;

    const response = await callLLM(prompt, { temperature: 0.3 });

    // Parse JSON response
    let gapAnalysis;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      gapAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
    } catch (err) {
      console.error('[TRYOUTS] Failed to parse gap analysis JSON:', err);
      gapAnalysis = {
        coverage: 0,
        gaps: [],
        strengths: [],
        overallAssessment: response
      };
    }

    // Update tryout with gap analysis
    await updateTryout(applicationId, tryoutId, { gapAnalysis });

    // Broadcast analysis completed
    broadcastEvent(EVENT_TYPES.GAP_ANALYSIS_COMPLETED, {
      applicationId,
      tryoutId,
      coverage: gapAnalysis.coverage
    });

    res.json({ data: gapAnalysis });
  } catch (err) {
    console.error('[TRYOUTS] Error running gap analysis:', err);

    broadcastEvent(EVENT_TYPES.ERROR, {
      applicationId: req.params.applicationId,
      tryoutId: req.params.tryoutId,
      operation: 'gap_analysis',
      error: err.message
    });

    next(err);
  }
});

/**
 * POST /api/applications/:applicationId/tryouts/:tryoutId/fact-check
 * Verify claims in resume for accuracy
 *
 * Body: {}
 */
router.post('/tryouts/:tryoutId/fact-check', async (req, res, next) => {
  try {
    const { applicationId, tryoutId } = req.params;

    // Get tryout
    const tryout = await getTryout(applicationId, tryoutId);
    if (!tryout) {
      return res.status(404).json({ error: 'Tryout not found' });
    }

    // Broadcast fact check started
    broadcastEvent(EVENT_TYPES.FACT_CHECK_STARTED, {
      applicationId,
      tryoutId
    });

    // Run fact check using LLM
    const prompt = `Review this resume and identify any claims that should be verified or adjusted.

Resume:
${tryout.resumeContent}

Provide a JSON response with this structure:
{
  "claims": [
    {
      "statement": "...",
      "verifiable": true|false,
      "concern": "critical|moderate|minor|none",
      "suggestion": "...",
      "category": "dates|metrics|technology|responsibility"
    }
  ],
  "overallCredibility": "high|medium|low",
  "recommendations": ["..."]
}

Focus on:
- Dates and timelines (logical progression, no overlaps)
- Quantified metrics (realistic, verifiable)
- Technology claims (current, accurate terminology)
- Responsibility claims (aligned with role level)`;

    const response = await callLLM(prompt, { temperature: 0.3 });

    // Parse JSON response
    let factCheck;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      factCheck = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
    } catch (err) {
      console.error('[TRYOUTS] Failed to parse fact check JSON:', err);
      factCheck = {
        claims: [],
        overallCredibility: 'unknown',
        recommendations: [response]
      };
    }

    // Update tryout with fact check results
    await updateTryout(applicationId, tryoutId, { factCheck });

    // Broadcast fact check completed
    broadcastEvent(EVENT_TYPES.FACT_CHECK_COMPLETED, {
      applicationId,
      tryoutId,
      credibility: factCheck.overallCredibility
    });

    res.json({ data: factCheck });
  } catch (err) {
    console.error('[TRYOUTS] Error running fact check:', err);

    broadcastEvent(EVENT_TYPES.ERROR, {
      applicationId: req.params.applicationId,
      tryoutId: req.params.tryoutId,
      operation: 'fact_check',
      error: err.message
    });

    next(err);
  }
});

export default router;

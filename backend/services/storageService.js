import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

/**
 * Storage service for file-based data persistence
 * Structure:
 * - data/applications/{id}/metadata.json (application metadata)
 * - data/applications/{id}/jd.md (job description markdown)
 * - data/applications/{id}/tryouts/{tryoutId}/resume.md
 * - data/applications/{id}/tryouts/{tryoutId}/metadata.json
 * - data/applications/{id}/primer.md (interview primer)
 * - data/archive/{filename}.md (resume archive)
 * - data/settings.json (global settings)
 */

/**
 * Ensure a directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (err) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Read JSON file
 */
async function readJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw err;
  }
}

/**
 * Write JSON file
 */
async function writeJSON(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Read markdown file
 */
async function readMarkdown(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Write markdown file
 */
async function writeMarkdown(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * List all items in a directory (returns directory names only)
 */
async function listDirectories(dirPath) {
  try {
    await ensureDir(dirPath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch (err) {
    console.error(`Error listing directories in ${dirPath}:`, err.message);
    return [];
  }
}

/**
 * Delete a directory and all its contents
 */
async function deleteDirectory(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.error(`Error deleting directory ${dirPath}:`, err.message);
    throw err;
  }
}

// ========== APPLICATION STORAGE ==========

/**
 * Create a new application
 */
export async function createApplication(data) {
  const id = uuidv4();
  const metadata = {
    id,
    company: data.company,
    position: data.position,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: data.status || 'active', // active, archived
    notes: data.notes || ''
  };

  const appDir = path.join(DATA_DIR, 'applications', id);
  await writeJSON(path.join(appDir, 'metadata.json'), metadata);

  if (data.jobDescription) {
    await writeMarkdown(path.join(appDir, 'jd.md'), data.jobDescription);
  }

  return metadata;
}

/**
 * Get an application by ID
 */
export async function getApplication(id) {
  const metadataPath = path.join(DATA_DIR, 'applications', id, 'metadata.json');
  const metadata = await readJSON(metadataPath);

  if (!metadata) {
    return null;
  }

  const jdPath = path.join(DATA_DIR, 'applications', id, 'jd.md');
  const jobDescription = await readMarkdown(jdPath);

  return { ...metadata, jobDescription };
}

/**
 * Update an application
 */
export async function updateApplication(id, updates) {
  const metadataPath = path.join(DATA_DIR, 'applications', id, 'metadata.json');
  const metadata = await readJSON(metadataPath);

  if (!metadata) {
    throw new Error(`Application ${id} not found`);
  }

  const updatedMetadata = {
    ...metadata,
    ...updates,
    id, // Prevent ID override
    createdAt: metadata.createdAt, // Prevent createdAt override
    updatedAt: new Date().toISOString()
  };

  await writeJSON(metadataPath, updatedMetadata);

  if (updates.jobDescription !== undefined) {
    const jdPath = path.join(DATA_DIR, 'applications', id, 'jd.md');
    await writeMarkdown(jdPath, updates.jobDescription);
  }

  return updatedMetadata;
}

/**
 * Delete an application
 */
export async function deleteApplication(id) {
  const appDir = path.join(DATA_DIR, 'applications', id);
  await deleteDirectory(appDir);
}

/**
 * List all applications
 */
export async function listApplications() {
  const appsDir = path.join(DATA_DIR, 'applications');
  const appIds = await listDirectories(appsDir);

  const applications = await Promise.all(
    appIds.map(async id => {
      const metadataPath = path.join(appsDir, id, 'metadata.json');
      return await readJSON(metadataPath);
    })
  );

  return applications.filter(Boolean); // Filter out null values
}

// ========== TRYOUT STORAGE ==========

/**
 * Create a tryout for an application
 */
export async function createTryout(applicationId, data) {
  const id = uuidv4();
  const metadata = {
    id,
    applicationId,
    version: data.version || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gapAnalysis: null,
    factCheck: null,
    pdfGenerated: false
  };

  const tryoutDir = path.join(DATA_DIR, 'applications', applicationId, 'tryouts', id);
  await writeJSON(path.join(tryoutDir, 'metadata.json'), metadata);

  if (data.resumeContent) {
    await writeMarkdown(path.join(tryoutDir, 'resume.md'), data.resumeContent);
  }

  return metadata;
}

/**
 * Get a tryout by ID
 */
export async function getTryout(applicationId, tryoutId) {
  const metadataPath = path.join(DATA_DIR, 'applications', applicationId, 'tryouts', tryoutId, 'metadata.json');
  const metadata = await readJSON(metadataPath);

  if (!metadata) {
    return null;
  }

  const resumePath = path.join(DATA_DIR, 'applications', applicationId, 'tryouts', tryoutId, 'resume.md');
  const resumeContent = await readMarkdown(resumePath);

  return { ...metadata, resumeContent };
}

/**
 * Update a tryout
 */
export async function updateTryout(applicationId, tryoutId, updates) {
  const metadataPath = path.join(DATA_DIR, 'applications', applicationId, 'tryouts', tryoutId, 'metadata.json');
  const metadata = await readJSON(metadataPath);

  if (!metadata) {
    throw new Error(`Tryout ${tryoutId} not found`);
  }

  const updatedMetadata = {
    ...metadata,
    ...updates,
    id: tryoutId,
    applicationId,
    createdAt: metadata.createdAt,
    updatedAt: new Date().toISOString()
  };

  await writeJSON(metadataPath, updatedMetadata);

  if (updates.resumeContent !== undefined) {
    const resumePath = path.join(DATA_DIR, 'applications', applicationId, 'tryouts', tryoutId, 'resume.md');
    await writeMarkdown(resumePath, updates.resumeContent);
  }

  return updatedMetadata;
}

/**
 * List all tryouts for an application
 */
export async function listTryouts(applicationId) {
  const tryoutsDir = path.join(DATA_DIR, 'applications', applicationId, 'tryouts');
  const tryoutIds = await listDirectories(tryoutsDir);

  const tryouts = await Promise.all(
    tryoutIds.map(async id => {
      const metadataPath = path.join(tryoutsDir, id, 'metadata.json');
      return await readJSON(metadataPath);
    })
  );

  return tryouts.filter(Boolean);
}

// ========== PRIMER STORAGE ==========

/**
 * Save interview primer for an application
 */
export async function savePrimer(applicationId, primerData) {
  const primerPath = path.join(DATA_DIR, 'applications', applicationId, 'primer.json');
  await writeJSON(primerPath, primerData);

  console.log(`[STORAGE] Primer saved: ${applicationId}`);
  return primerData;
}

/**
 * Get interview primer for an application
 */
export async function getPrimer(applicationId) {
  const primerPath = path.join(DATA_DIR, 'applications', applicationId, 'primer.json');
  const data = await readJSON(primerPath);

  if (!data) {
    return null;
  }

  return data;
}

// ========== ARCHIVE STORAGE ==========

/**
 * Save a resume to the archive
 */
export async function saveArchivedResume(filename, content) {
  const archivePath = path.join(DATA_DIR, 'archive', filename);
  await writeMarkdown(archivePath, content);

  return {
    filename,
    savedAt: new Date().toISOString()
  };
}

/**
 * List all archived resumes
 */
export async function listArchivedResumes() {
  const archiveDir = path.join(DATA_DIR, 'archive');
  await ensureDir(archiveDir);

  const files = await fs.readdir(archiveDir);
  const resumes = await Promise.all(
    files.filter(f => f.endsWith('.md')).map(async filename => {
      const filePath = path.join(archiveDir, filename);
      const stats = await fs.stat(filePath);

      return {
        filename,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString()
      };
    })
  );

  return resumes;
}

/**
 * Get an archived resume
 */
export async function getArchivedResume(filename) {
  const archivePath = path.join(DATA_DIR, 'archive', filename);
  const content = await readMarkdown(archivePath);

  if (!content) {
    return null;
  }

  return {
    filename,
    content
  };
}

// ========== SETTINGS STORAGE ==========

/**
 * Get global settings
 */
export async function getSettings() {
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  const settings = await readJSON(settingsPath);

  // Return defaults if no settings file exists
  if (!settings) {
    return {
      theme: 'auto',
      folders: {
        applications: path.join(DATA_DIR, 'applications'),
        archive: path.join(DATA_DIR, 'archive')
      },
      llm: {
        provider: 'ollama',
        endpoint: process.env.LLM_ENDPOINT || 'http://localhost:11434',
        model: process.env.LLM_MODEL || 'qwen2.5:1.5b'
      }
    };
  }

  return settings;
}

/**
 * Update global settings
 */
export async function updateSettings(updates) {
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  const currentSettings = await getSettings();

  const updatedSettings = {
    ...currentSettings,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await writeJSON(settingsPath, updatedSettings);

  return updatedSettings;
}

// ========== INITIALIZATION ==========

/**
 * Initialize data directories
 */
export async function initializeStorage() {
  await ensureDir(path.join(DATA_DIR, 'applications'));
  await ensureDir(path.join(DATA_DIR, 'archive'));

  console.log('[STORAGE] Initialized data directories:', DATA_DIR);
}

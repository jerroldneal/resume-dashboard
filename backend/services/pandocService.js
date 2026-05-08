import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Convert markdown content to PDF using Pandoc
 * @param {string} markdownContent - The markdown content to convert
 * @param {object} options - Pandoc options
 * @returns {Promise<Buffer>} - PDF buffer
 */
export async function convertMarkdownToPDF(markdownContent, options = {}) {
  const tmpDir = '/tmp';
  const timestamp = Date.now();
  const inputFile = path.join(tmpDir, `resume-${timestamp}.md`);
  const outputFile = path.join(tmpDir, `resume-${timestamp}.pdf`);

  try {
    // Write markdown to temp file
    await fs.writeFile(inputFile, markdownContent, 'utf-8');

    // Build Pandoc command
    const pandocArgs = [
      `"${inputFile}"`,
      '-f', 'markdown',
      '-t', 'pdf',
      '-o', `"${outputFile}"`,
      '--pdf-engine=pdflatex',
      '-V', 'geometry:margin=1in',
      '-V', 'fontsize=11pt',
      ...(options.toc ? ['--toc'] : []),
      ...(options.template ? ['-V', `template=${options.template}`] : [])
    ];

    const command = `pandoc ${pandocArgs.join(' ')}`;

    // Execute Pandoc
    await execAsync(command);

    // Read generated PDF
    const pdfBuffer = await fs.readFile(outputFile);

    // Cleanup temp files
    await fs.unlink(inputFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});

    return pdfBuffer;
  } catch (error) {
    // Cleanup on error
    await fs.unlink(inputFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});
    
    throw new Error(`Pandoc conversion failed: ${error.message}`);
  }
}

/**
 * Get PDF buffer from markdown file path
 * @param {string} markdownPath - Path to markdown file
 * @param {object} options - Pandoc options
 * @returns {Promise<Buffer>} - PDF buffer
 */
export async function getPDFBuffer(markdownPath, options = {}) {
  try {
    const markdownContent = await fs.readFile(markdownPath, 'utf-8');
    return await convertMarkdownToPDF(markdownContent, options);
  } catch (error) {
    throw new Error(`Failed to read markdown file: ${error.message}`);
  }
}

/**
 * Check if Pandoc is installed and accessible
 * @returns {Promise<boolean>}
 */
export async function checkPandocInstalled() {
  try {
    await execAsync('pandoc --version');
    return true;
  } catch (error) {
    return false;
  }
}

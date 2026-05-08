import { getSettings } from './storageService.js';

/**
 * LLM Client for Ollama integration
 * Handles communication with Ollama API for resume generation, gap analysis, and fact checking
 */

/**
 * Call Ollama API with streaming support
 * @param {string} prompt - The prompt to send
 * @param {object} options - Optional configuration
 * @returns {Promise<string>} - The complete response
 */
export async function callLLM(prompt, options = {}) {
  const settings = await getSettings();
  const endpoint = settings.llm?.endpoint || 'http://localhost:11434';
  const model = options.model || settings.llm?.model || 'llama3.2:3b';

  const url = `${endpoint}/api/generate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false, // Non-streaming for now
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          ...options.modelOptions
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (err) {
    console.error('[LLM] Error calling Ollama:', err);
    throw new Error(`LLM call failed: ${err.message}`);
  }
}

/**
 * Call Ollama API with streaming for real-time updates
 * @param {string} prompt - The prompt to send
 * @param {function} onChunk - Callback for each chunk
 * @param {object} options - Optional configuration
 */
export async function callLLMStream(prompt, onChunk, options = {}) {
  const settings = await getSettings();
  const endpoint = settings.llm?.endpoint || 'http://localhost:11434';
  const model = options.model || settings.llm?.model || 'llama3.2:3b';

  const url = `${endpoint}/api/generate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          ...options.modelOptions
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;
            onChunk(data.response);
          }
        } catch (err) {
          console.warn('[LLM] Failed to parse streaming chunk:', line);
        }
      }
    }

    return fullResponse;
  } catch (err) {
    console.error('[LLM] Error calling Ollama (streaming):', err);
    throw new Error(`LLM stream failed: ${err.message}`);
  }
}

/**
 * Generate resume content based on job description and requirements
 * @param {string} jobDescription - The job description markdown
 * @param {string} baseResume - The base resume content (optional)
 * @returns {Promise<string>} - Generated resume markdown
 */
export async function generateResumeContent(jobDescription, baseResume = '') {
  const prompt = `You are an expert resume writer specializing in ATS optimization.

${baseResume ? `Base Resume:\n${baseResume}\n\n` : ''}Job Description:
${jobDescription}

Generate a tailored resume in markdown format that:
1. Highlights relevant experience matching the job requirements
2. Uses keywords from the job description
3. Quantifies achievements with metrics
4. Follows standard resume structure (Summary, Experience, Skills, Education)
5. Is ATS-friendly (no tables, clear formatting)

Return ONLY the markdown resume content, no explanations.`;

  return await callLLM(prompt, { temperature: 0.7 });
}

/**
 * Extract job requirements from job description
 * @param {string} jobDescription - The job description markdown
 * @returns {Promise<Array>} - Array of requirement objects
 */
export async function extractRequirements(jobDescription) {
  const prompt = `Extract key requirements from this job description. Return a JSON array of objects with this structure:
[{"category": "technical|experience|education|soft-skills", "requirement": "description", "priority": "required|preferred"}]

Job Description:
${jobDescription}

Return ONLY the JSON array, no explanations.`;

  const response = await callLLM(prompt, { temperature: 0.3 });

  try {
    // Try to extract JSON from response (LLM might add extra text)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (err) {
    console.error('[LLM] Failed to parse requirements JSON:', err);
    return [];
  }
}

/**
 * Test Ollama connection
 * @returns {Promise<boolean>} - True if Ollama is accessible
 */
export async function testOllamaConnection() {
  const settings = await getSettings();
  const endpoint = settings.llm?.endpoint || 'http://localhost:11434';

  try {
    const response = await fetch(`${endpoint}/api/tags`);
    return response.ok;
  } catch (err) {
    console.error('[LLM] Ollama connection test failed:', err);
    return false;
  }
}

/**
 * List available Ollama models
 * @returns {Promise<Array>} - Array of model names
 */
export async function listOllamaModels() {
  const settings = await getSettings();
  const endpoint = settings.llm?.endpoint || 'http://localhost:11434';

  try {
    const response = await fetch(`${endpoint}/api/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.models?.map(m => m.name) || [];
  } catch (err) {
    console.error('[LLM] Failed to list models:', err);
    return [];
  }
}

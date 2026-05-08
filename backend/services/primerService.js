import { callLLM } from './llmClient.js';

/**
 * Generate interview primer using LLM
 * @param {string} jobDescription - The job posting
 * @param {string} resumeContent - The tailored resume
 * @returns {Promise<Object>} Primer object with questions array
 */
export async function generateInterviewPrimer(jobDescription, resumeContent) {
  const prompt = `You are an interview preparation expert. Analyze this job description and resume to generate likely interview questions, suggested answers, and strategies for addressing gaps.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeContent}

Generate a comprehensive interview primer with:
1. 5-8 likely interview questions (mix of technical and behavioral)
2. For each question, provide:
   - The question
   - Category (technical, behavioral, or general)
   - A strong suggested answer highlighting relevant experience
   - If applicable, a "truthful out" (honest way to address gaps/weaknesses)
3. An overall interview strategy (2-3 sentences)

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "question": "Tell me about your experience with X",
      "category": "technical",
      "suggestedAnswer": "Detailed answer...",
      "truthfulOut": "If weak: explain transferable skills..." // or null if not applicable
    }
  ],
  "overallStrategy": "Focus on Y. Be prepared to discuss Z."
}`;

  try {
    const response = await callLLM(prompt);

    // Parse LLM response (should be JSON)
    let primerData;
    try {
      primerData = JSON.parse(response);
    } catch (parseError) {
      // If LLM didn't return clean JSON, try to extract it
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        primerData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('LLM response was not valid JSON');
      }
    }

    // Validate structure
    if (!primerData.questions || !Array.isArray(primerData.questions)) {
      throw new Error('Invalid primer structure: missing questions array');
    }

    // Add timestamp
    primerData.generated = new Date().toISOString();

    console.log(`[PRIMER] Generated ${primerData.questions.length} questions`);

    return primerData;
  } catch (error) {
    console.error('[PRIMER] Generation error:', error);
    throw new Error(`Interview primer generation failed: ${error.message}`);
  }
}

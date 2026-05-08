import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';

export default function PromptsTab() {
  const [prompts, setPrompts] = useState([
    {
      id: 'requirement-extraction',
      name: 'Requirement Extraction',
      description: 'Extracts key requirements, qualifications, and preferences from job descriptions',
      template: `You are analyzing a job description to extract structured requirements.

Job Description:
{jobDescription}

Extract and return a JSON object with:
- required_skills: array of must-have technical skills
- preferred_skills: array of nice-to-have skills
- required_experience: years and type of experience required
- education: education requirements
- certifications: any certifications mentioned
- responsibilities: key responsibilities of the role

Return ONLY valid JSON, no markdown formatting.`,
      variables: ['jobDescription']
    },
    {
      id: 'resume-generation',
      name: 'Resume Generation',
      description: 'Generates tailored resume content based on job requirements',
      template: `You are a professional resume writer. Create a tailored resume for this application.

Job Description:
{jobDescription}

Base Resume:
{baseResume}

Create a resume that:
1. Highlights relevant experience for this specific role
2. Uses keywords from the job description naturally
3. Quantifies achievements where possible
4. Emphasizes skills matching job requirements
5. Maintains truthfulness - do not fabricate experience

Return ONLY the resume content in valid markdown format.`,
      variables: ['jobDescription', 'baseResume']
    },
    {
      id: 'gap-analysis',
      name: 'Gap Analysis',
      description: 'Analyzes gaps between resume and job requirements',
      template: `Compare this resume against the job requirements and identify gaps.

Job Description:
{jobDescription}

Resume Content:
{resumeContent}

Return a JSON object with:
- coverage: percentage (0-100) of requirements met
- gaps: array of {requirement, severity: 'critical'|'moderate'|'info', suggestion}
- strengths: array of well-covered requirements
- overall_fit: 'strong'|'moderate'|'weak'

Return ONLY valid JSON, no markdown formatting.`,
      variables: ['jobDescription', 'resumeContent']
    },
    {
      id: 'fact-check',
      name: 'Fact Check',
      description: 'Verifies resume claims for accuracy and credibility',
      template: `Review this resume for factual accuracy and credibility concerns.

Resume Content:
{resumeContent}

Identify:
1. Quantitative claims (numbers, percentages, metrics)
2. Timeline/chronology consistency
3. Role/responsibility plausibility
4. Technical claims that may be verifiable

Return a JSON object with:
- overall_credibility: 'high'|'medium'|'low'
- claims: array of {statement, category, concern: 'none'|'unverifiable'|'implausible', suggestion}

Return ONLY valid JSON, no markdown formatting.`,
      variables: ['resumeContent']
    }
  ])

  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTemplate, setEditedTemplate] = useState('')
  const [testInput, setTestInput] = useState('')
  const [testOutput, setTestOutput] = useState(null)
  const [testing, setTesting] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  function handleEditClick(prompt) {
    setSelectedPrompt(prompt)
    setEditedTemplate(prompt.template)
    setIsEditing(true)
  }

  function handleSaveChanges() {
    setPrompts(prompts.map(p =>
      p.id === selectedPrompt.id
        ? { ...p, template: editedTemplate }
        : p
    ))
    setIsEditing(false)
    setSelectedPrompt(null)
  }

  function handleTestClick(prompt) {
    setSelectedPrompt(prompt)
    setTestInput('')
    setTestOutput(null)
    setShowTestModal(true)
  }

  async function handleRunTest() {
    setTesting(true)
    try {
      let processed = selectedPrompt.template
      selectedPrompt.variables.forEach(varName => {
        processed = processed.replace(`{${varName}}`, testInput || `[Sample ${varName}]`)
      })

      setTestOutput({
        processed_prompt: processed,
        note: 'Backend API not yet implemented - showing template preview'
      })
    } catch (err) {
      setTestOutput({ error: err.message })
    } finally {
      setTesting(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-dockhand-text">Prompt Templates</h2>

        <div className="space-y-4">
          {prompts.map(prompt => (
            <div
              key={prompt.id}
              className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-dockhand-text mb-1">
                    📝 {prompt.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {prompt.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Variables: {prompt.variables.map(v => `{${v}}`).join(', ')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(prompt)}
                    className="px-4 py-2 bg-dockhand-primary text-white rounded hover:opacity-90 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTestClick(prompt)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-dockhand-text rounded hover:opacity-90 transition"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isEditing && selectedPrompt) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setIsEditing(false); setSelectedPrompt(null); }}
              className="text-dockhand-primary hover:underline transition"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-dockhand-text">
              Editing: {selectedPrompt.name}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setIsEditing(false); setSelectedPrompt(null); }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-dockhand-text rounded hover:opacity-90 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-dockhand-primary text-white rounded hover:opacity-90 transition"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-4 mb-4">
          <label className="block text-sm font-semibold mb-2 text-dockhand-text">
            Prompt Template:
          </label>
          <Editor
            height="400px"
            language="markdown"
            theme={isDark ? 'vs-dark' : 'vs-light'}
            value={editedTemplate}
            onChange={(value) => setEditedTemplate(value || '')}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 14
            }}
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 text-dockhand-text">Variables Available:</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {selectedPrompt.variables.map(v => (
              <li key={v}>• <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{`{${v}}`}</code></li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return showTestModal && selectedPrompt ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dockhand-bg border border-dockhand-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-dockhand-text">
            Test: {selectedPrompt.name}
          </h3>
          <button
            onClick={() => setShowTestModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            ✕ Close
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-dockhand-text">
            Sample Input ({selectedPrompt.variables[0]}):
          </label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full h-32 p-2 border border-dockhand-border rounded bg-dockhand-surface text-dockhand-text"
            placeholder={`Enter sample ${selectedPrompt.variables[0]} text...`}
          />
        </div>

        <button
          onClick={handleRunTest}
          disabled={testing}
          className="px-4 py-2 bg-dockhand-primary text-white rounded disabled:opacity-50 transition mb-4"
        >
          {testing ? 'Testing...' : 'Run Test'}
        </button>

        {testOutput && (
          <div className="bg-dockhand-surface border border-dockhand-border rounded p-4">
            <h4 className="font-semibold text-sm mb-2 text-dockhand-text">Output:</h4>
            <pre className="text-xs text-dockhand-text whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(testOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  ) : null
}

import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { useSSE } from '../hooks/useSSE';

export default function TryoutsTab() {
  const [applications, setApplications] = useState([])
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [tryouts, setTryouts] = useState([])
  const [selectedTryout, setSelectedTryout] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [resumeContent, setResumeContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [factChecking, setFactChecking] = useState(false)
  const [error, setError] = useState(null)
  const [isDark, setIsDark] = useState(false)

  // SSE for real-time updates
  const { events } = useSSE('/api/events')

  // Check dark mode on mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // Fetch applications on mount
  useEffect(() => {
    fetchApplications()
  }, [])

  // Fetch tryouts when application selected
  useEffect(() => {
    if (selectedAppId) {
      fetchTryouts(selectedAppId)
      setSelectedTryout(null)
    }
  }, [selectedAppId])

  // Listen for SSE events
  useEffect(() => {
    if (events.length === 0) return

    const latestEvent = events[events.length - 1]

    if (latestEvent.type === 'tryout_generated' && latestEvent.data.status === 'completed') {
      fetchTryouts(latestEvent.data.applicationId)
      setGenerating(false)
    }

    if (latestEvent.type === 'gap_analysis_completed') {
      fetchTryoutDetails(latestEvent.data.tryoutId)
      setAnalyzing(false)
    }

    if (latestEvent.type === 'fact_check_completed') {
      fetchTryoutDetails(latestEvent.data.tryoutId)
      setFactChecking(false)
    }
  }, [events])

  async function fetchApplications() {
    try {
      const res = await fetch('/api/applications')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApplications(data.data || [])
      if (data.data?.length > 0 && !selectedAppId) {
        setSelectedAppId(data.data[0].id)
      }
    } catch (err) {
      setError(`Failed to load applications: ${err.message}`)
    }
  }

  async function fetchTryouts(appId) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${appId}/tryouts`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTryouts(data.data || [])
    } catch (err) {
      setError(`Failed to load tryouts: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTryoutDetails(tryoutId) {
    try {
      const res = await fetch(`/api/applications/${selectedAppId}/tryouts/${tryoutId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSelectedTryout(data.data)
      setResumeContent(data.data.resumeContent || '')
    } catch (err) {
      setError(`Failed to load tryout details: ${err.message}`)
    }
  }

  async function generateTryout() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${selectedAppId}/tryouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: tryouts.length + 1 })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // SSE will trigger refresh when completed
    } catch (err) {
      setError(`Failed to generate tryout: ${err.message}`)
      setGenerating(false)
    }
  }

  async function runGapAnalysis(tryoutId) {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${selectedAppId}/tryouts/${tryoutId}/gap-analysis`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // SSE will trigger refresh when completed
    } catch (err) {
      setError(`Gap analysis failed: ${err.message}`)
      setAnalyzing(false)
    }
  }

  async function runFactCheck(tryoutId) {
    setFactChecking(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${selectedAppId}/tryouts/${tryoutId}/fact-check`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // SSE will trigger refresh when completed
    } catch (err) {
      setError(`Fact check failed: ${err.message}`)
      setFactChecking(false)
    }
  }

  async function updateResume(tryoutId, content) {
    try {
      const res = await fetch(`/api/applications/${selectedAppId}/tryouts/${tryoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeContent: content })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setIsEditing(false)
      fetchTryoutDetails(tryoutId)
    } catch (err) {
      setError(`Failed to save resume: ${err.message}`)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const selectedApp = applications.find(a => a.id === selectedAppId)

  return (
    <div className="h-full flex flex-col">
      {/* Header with Application Selector */}
      <div className="bg-dockhand-surface border-b border-dockhand-border p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-sm text-dockhand-text mr-3">Application:</label>
            <select
              value={selectedAppId || ''}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="inline-block px-4 py-2 bg-white dark:bg-gray-800 border border-dockhand-border rounded text-dockhand-text cursor-pointer"
            >
              <option value="">Select Application...</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.company} - {app.position}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generateTryout}
            disabled={!selectedAppId || generating}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              generating || !selectedAppId
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-dockhand-primary text-white hover:bg-opacity-90'
            }`}
          >
            {generating ? '⏳ Generating...' : '+ Generate New Tryout'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 font-bold hover:underline"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedTryout ? (
          // Tryout Detail View
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Back Button and Metadata */}
            <div className="bg-dockhand-surface border-b border-dockhand-border p-6 flex items-center gap-4 flex-shrink-0">
              <button
                onClick={() => setSelectedTryout(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-dockhand-text rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h3 className="text-lg font-bold text-dockhand-text">
                  Version {selectedTryout.metadata?.version || 'Latest'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created: {formatDate(selectedTryout.metadata?.createdAt || new Date())}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-dockhand-surface border-b border-dockhand-border px-6 py-3 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  isEditing
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-700 text-dockhand-text hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {isEditing ? '✓ Done Editing' : '✎ Edit Resume'}
              </button>
              <button
                onClick={() => runGapAnalysis(selectedTryout.id)}
                disabled={analyzing}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  analyzing
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-gray-300 dark:bg-gray-700 text-dockhand-text hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {analyzing ? '⏳ Analyzing...' : 'Run Gap Analysis'}
              </button>
              <button
                onClick={() => runFactCheck(selectedTryout.id)}
                disabled={factChecking}
                className={`px-4 py-2 rounded font-semibold transition-colors ${
                  factChecking
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-gray-300 dark:bg-gray-700 text-dockhand-text hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {factChecking ? '⏳ Fact Checking...' : 'Fact Check'}
              </button>
            </div>

            {/* Resume Editor */}
            <div className="flex-1 overflow-hidden px-6 py-4 border-b border-dockhand-border flex-shrink-0">
              <h3 className="text-lg font-bold mb-3 text-dockhand-text">Resume Content (Markdown)</h3>
              <div className="h-96 border border-dockhand-border rounded overflow-hidden">
                {isEditing ? (
                  <div className="h-full flex flex-col">
                    <Editor
                      height="100%"
                      defaultLanguage="markdown"
                      value={resumeContent}
                      onChange={(value) => setResumeContent(value || '')}
                      theme={isDark ? 'vs-dark' : 'vs'}
                      options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        fontSize: 13
                      }}
                      className="mx-auto"
                    />
                    <div className="bg-dockhand-surface border-t border-dockhand-border p-3 flex gap-2">
                      <button
                        onClick={() => updateResume(selectedTryout.id, resumeContent)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold transition-colors"
                      >
                        💾 Save Resume
                      </button>
                      <button
                        onClick={() => {
                          setResumeContent(selectedTryout.resumeContent || '')
                          setIsEditing(false)
                        }}
                        className="px-4 py-2 bg-gray-400 dark:bg-gray-700 text-dockhand-text rounded hover:bg-gray-500 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto p-4 bg-white dark:bg-gray-900 text-dockhand-text font-mono text-sm whitespace-pre-wrap break-words">
                    {resumeContent || '(No content)'}
                  </div>
                )}
              </div>
            </div>

            {/* Gap Analysis Display */}
            {selectedTryout?.gapAnalysis && (
              <div className="px-6 py-4 border-b border-dockhand-border bg-dockhand-surface">
                <h3 className="text-lg font-bold mb-4 text-dockhand-text">Gap Analysis</h3>

                {/* Coverage Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-dockhand-text">Coverage</span>
                    <span className="text-sm font-bold text-dockhand-primary">
                      {selectedTryout.gapAnalysis.coverage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-dockhand-primary h-3 rounded-full transition-all"
                      style={{ width: `${selectedTryout.gapAnalysis.coverage}%` }}
                    />
                  </div>
                </div>

                {/* Gaps List */}
                {selectedTryout.gapAnalysis.gaps?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-dockhand-text">Gaps to Address:</h4>
                    <div className="space-y-3">
                      {selectedTryout.gapAnalysis.gaps.map((gap, i) => (
                        <div
                          key={i}
                          className="p-3 pl-4 border-l-4 border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 rounded"
                        >
                          <span
                            className={`text-xs font-bold ${
                              gap.severity === 'critical'
                                ? 'text-red-600 dark:text-red-400'
                                : gap.severity === 'moderate'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            [{gap.severity?.toUpperCase() || 'ISSUE'}]
                          </span>
                          <p className="text-sm text-dockhand-text font-medium mt-1">{gap.requirement}</p>
                          {gap.suggestion && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              💡 {gap.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {selectedTryout.gapAnalysis.strengths?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-dockhand-text">Strengths:</h4>
                    <ul className="space-y-2">
                      {selectedTryout.gapAnalysis.strengths.map((str, i) => (
                        <li key={i} className="text-sm text-green-600 dark:text-green-400 flex gap-2">
                          <span>✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Fact Check Display */}
            {selectedTryout?.factCheck && (
              <div className="px-6 py-4 bg-dockhand-surface">
                <h3 className="text-lg font-bold mb-4 text-dockhand-text">Fact Check</h3>

                <div className="mb-6">
                  <span className="text-sm text-dockhand-text mr-3">Overall Credibility:</span>
                  <span
                    className={`font-bold text-lg ${
                      selectedTryout.factCheck.overallCredibility === 'high'
                        ? 'text-green-600 dark:text-green-400'
                        : selectedTryout.factCheck.overallCredibility === 'medium'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {selectedTryout.factCheck.overallCredibility?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>

                {selectedTryout.factCheck.claims?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-dockhand-text">Claims to Review:</h4>
                    <div className="space-y-3">
                      {selectedTryout.factCheck.claims.map((claim, i) => (
                        <div
                          key={i}
                          className="p-3 bg-gray-100 dark:bg-gray-800 rounded border border-dockhand-border"
                        >
                          <p className="text-sm font-medium text-dockhand-text">{claim.statement}</p>
                          <div className="flex gap-2 mt-2 text-xs">
                            <span
                              className={
                                claim.concern === 'none'
                                  ? 'text-green-600 dark:text-green-400 font-semibold'
                                  : 'text-yellow-600 dark:text-yellow-400 font-semibold'
                              }
                            >
                              {claim.category || 'claim'}
                            </span>
                            {claim.concern && claim.concern !== 'none' && (
                              <span className="text-red-600 dark:text-red-400 font-semibold">
                                [{claim.concern}]
                              </span>
                            )}
                          </div>
                          {claim.suggestion && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              💡 {claim.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Tryouts List View
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-8 text-dockhand-text">
                <p className="text-lg">⏳ Loading tryouts...</p>
              </div>
            ) : tryouts.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p className="text-lg mb-4">No tryouts yet for this application</p>
                <p className="text-sm">Click "Generate New Tryout" to create one</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold mb-4 text-dockhand-text">
                  Tryouts for {selectedApp?.company} - {selectedApp?.position}
                </h3>
                <div className="grid gap-3">
                  {tryouts.map((tryout) => (
                    <button
                      key={tryout.id}
                      onClick={() => fetchTryoutDetails(tryout.id)}
                      className="text-left p-4 bg-dockhand-surface border border-dockhand-border rounded hover:border-dockhand-primary transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-dockhand-text">
                            Version {tryout.metadata?.version || 'Latest'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Created: {formatDate(tryout.metadata?.createdAt || new Date())}
                          </p>
                        </div>
                        <div className="text-right">
                          {tryout.gapAnalysis?.coverage && (
                            <div className="text-sm font-semibold text-dockhand-primary">
                              Coverage: {tryout.gapAnalysis.coverage}%
                            </div>
                          )}
                          {tryout.factCheck?.overallCredibility && (
                            <div
                              className={`text-sm font-semibold ${
                                tryout.factCheck.overallCredibility === 'high'
                                  ? 'text-green-600 dark:text-green-400'
                                  : tryout.factCheck.overallCredibility === 'medium'
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              Credibility: {tryout.factCheck.overallCredibility}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

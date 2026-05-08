import { useEffect, useState } from 'react';

export default function PrimersTab() {
  const [applications, setApplications] = useState([])
  const [selectedAppId, setSelectedAppId] = useState('')
  const [tryouts, setTryouts] = useState([])
  const [selectedTryoutId, setSelectedTryoutId] = useState('')
  const [primer, setPrimer] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    if (selectedAppId) {
      fetchTryouts(selectedAppId)
      fetchPrimer(selectedAppId)
      setSelectedTryoutId('')
    }
  }, [selectedAppId])

  async function fetchApplications() {
    try {
      const res = await fetch('/api/applications')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApplications(data.data || [])
      if (data.data?.length > 0) {
        setSelectedAppId(data.data[0].id)
      }
    } catch (err) {
      setError(`Failed to load applications: ${err.message}`)
    }
  }

  async function fetchTryouts(appId) {
    try {
      const res = await fetch(`/api/applications/${appId}/tryouts`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTryouts(data.data || [])
      if (data.data?.length > 0) {
        setSelectedTryoutId(data.data[0].id)
      }
    } catch (err) {
      setError(`Failed to load tryouts: ${err.message}`)
    }
  }

  async function fetchPrimer(appId) {
    setLoading(true)
    try {
      const res = await fetch(`/api/applications/${appId}/primer`)
      if (res.ok) {
        const data = await res.json()
        setPrimer(data.data)
      } else {
        setPrimer(null)
      }
    } catch (err) {
      setPrimer(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleGeneratePrimer() {
    if (!selectedTryoutId) {
      setError('Please select a resume version')
      return
    }

    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/applications/${selectedAppId}/primer/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tryoutId: selectedTryoutId })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPrimer(data.data)
    } catch (err) {
      setError(`Primer generation failed: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const selectedApp = applications.find(a => a.id === selectedAppId)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-dockhand-text">Interview Prep</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2 text-dockhand-text">
            Application:
          </label>
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="w-full p-2 border border-dockhand-border rounded bg-dockhand-surface text-dockhand-text"
          >
            <option value="">Select Application</option>
            {applications.map(app => (
              <option key={app.id} value={app.id}>
                {app.company} - {app.position}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2 text-dockhand-text">
            Using Resume:
          </label>
          <select
            value={selectedTryoutId}
            onChange={(e) => setSelectedTryoutId(e.target.value)}
            className="w-full p-2 border border-dockhand-border rounded bg-dockhand-surface text-dockhand-text"
            disabled={!selectedAppId || tryouts.length === 0}
          >
            <option value="">Select Version</option>
            {tryouts.map((tryout, idx) => (
              <option key={tryout.id} value={tryout.id}>
                Version {tryout.version || idx + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAppId && (
        <div className="mb-6">
          <button
            onClick={handleGeneratePrimer}
            disabled={generating || !selectedTryoutId}
            className="px-6 py-2 bg-dockhand-primary text-white rounded disabled:opacity-50 hover:opacity-90"
          >
            {generating ? '⏳ Generating Primer...' : '🎯 Generate Interview Primer'}
          </button>
        </div>
      )}

      {primer && (
        <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-dockhand-text">Interview Primer</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Generated: {new Date(primer.generated).toLocaleDateString()}
            </span>
          </div>

          {primer.overallStrategy && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <h4 className="font-semibold text-sm mb-2 text-dockhand-text">Overall Strategy:</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{primer.overallStrategy}</p>
            </div>
          )}

          <div className="space-y-4">
            {primer.questions?.map((q, idx) => (
              <div
                key={idx}
                className="border border-dockhand-border rounded-lg p-4 bg-dockhand-bg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-dockhand-text">
                    {idx + 1}. {q.question}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    q.category === 'technical' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                    q.category === 'behavioral' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {q.category}
                  </span>
                </div>

                {q.suggestedAnswer && (
                  <div className="mb-2 pl-4 border-l-4 border-green-500 dark:border-green-400">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                      ✅ Suggested Answer:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {q.suggestedAnswer}
                    </p>
                  </div>
                )}

                {q.truthfulOut && (
                  <div className="pl-4 border-l-4 border-yellow-500 dark:border-yellow-400">
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                      ⚠️ Truthful Out:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {q.truthfulOut}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedAppId && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Select an application to generate interview prep
        </div>
      )}

      {selectedAppId && !primer && !loading && !generating && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No primer generated yet. Click "Generate Interview Primer" to create one.
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          ⏳ Loading...
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react';

export default function FinalizeTab() {
  const [applications, setApplications] = useState([])
  const [selectedAppId, setSelectedAppId] = useState('')
  const [tryouts, setTryouts] = useState([])
  const [selectedTryoutId, setSelectedTryoutId] = useState('')
  const [resumeContent, setResumeContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [pdfReady, setPdfReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    if (selectedAppId) {
      fetchTryouts(selectedAppId)
      setSelectedTryoutId('')
      setResumeContent('')
      setPdfReady(false)
    }
  }, [selectedAppId])

  useEffect(() => {
    if (selectedTryoutId) {
      fetchTryoutContent(selectedTryoutId)
      setPdfReady(false)
    }
  }, [selectedTryoutId])

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
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  async function fetchTryoutContent(tryoutId) {
    try {
      const res = await fetch(`/api/tryouts/${tryoutId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResumeContent(data.data?.resumeContent || '')
    } catch (err) {
      setError(`Failed to load resume: ${err.message}`)
    }
  }

  async function handleGeneratePDF() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/tryouts/${selectedTryoutId}/pdf`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPdfReady(true)
    } catch (err) {
      setError(`PDF generation failed: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownloadPDF() {
    try {
      const res = await fetch(`/api/tryouts/${selectedTryoutId}/pdf/download`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume-${selectedTryoutId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(`Download failed: ${err.message}`)
    }
  }

  const selectedApp = applications.find(a => a.id === selectedAppId)
  const selectedTryout = tryouts.find(t => t.id === selectedTryoutId)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-dockhand-text">Finalize Resume</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700 dark:hover:text-red-300"
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
            Tryout Version:
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
                Version {tryout.version || idx + 1} - {new Date(tryout.created).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTryoutId && (
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleGeneratePDF}
            disabled={generating || !resumeContent}
            className="px-6 py-2 bg-dockhand-primary text-white rounded disabled:opacity-50 hover:opacity-90"
          >
            {generating ? '⏳ Generating...' : '📄 Generate PDF'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!pdfReady}
            className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50 hover:opacity-90"
          >
            ⬇️ Download PDF
          </button>
        </div>
      )}

      {selectedTryoutId && resumeContent && (
        <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-dockhand-text">Preview</h3>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-dockhand-text font-sans">
              {resumeContent}
            </pre>
          </div>
        </div>
      )}

      {!selectedAppId && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Select an application to finalize
        </div>
      )}

      {selectedAppId && tryouts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No tryouts found for this application
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          ⏳ Loading tryouts...
        </div>
      )}
    </div>
  )
}

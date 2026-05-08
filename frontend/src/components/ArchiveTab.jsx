import { useEffect, useState } from 'react';

export default function ArchiveTab() {
  const [resumes, setResumes] = useState([])
  const [filteredResumes, setFilteredResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [uploadForm, setUploadForm] = useState({
    title: '',
    company: '',
    position: '',
    year: new Date().getFullYear(),
    notes: '',
    content: ''
  })

  useEffect(() => {
    fetchResumes()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResumes(resumes)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredResumes(
        resumes.filter(r =>
          r.title.toLowerCase().includes(query) ||
          r.metadata?.company?.toLowerCase().includes(query) ||
          r.metadata?.position?.toLowerCase().includes(query) ||
          r.notes?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, resumes])

  async function fetchResumes() {
    setLoading(true)
    try {
      const res = await fetch('/api/archive/resumes')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResumes(data.data || [])
      setFilteredResumes(data.data || [])
    } catch (err) {
      setError(`Failed to load archive: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!uploadForm.title || !uploadForm.content) {
      setError('Title and content are required')
      return
    }

    try {
      const res = await fetch('/api/archive/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadForm.title,
          content: uploadForm.content,
          notes: uploadForm.notes,
          metadata: {
            company: uploadForm.company,
            position: uploadForm.position,
            year: uploadForm.year
          }
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      await fetchResumes()
      setIsUploading(false)
      setUploadForm({
        title: '',
        company: '',
        position: '',
        year: new Date().getFullYear(),
        notes: '',
        content: ''
      })
    } catch (err) {
      setError(`Upload failed: ${err.message}`)
    }
  }

  async function handleDelete(resumeId) {
    if (!confirm('Delete this archived resume?')) return

    try {
      const res = await fetch(`/api/archive/resumes/${resumeId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      await fetchResumes()
      setSelectedResume(null)
    } catch (err) {
      setError(`Delete failed: ${err.message}`)
    }
  }

  return (
    <div className="p-6">
      {!selectedResume && !isUploading && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dockhand-text">Resume Archive</h2>
            <button
              onClick={() => setIsUploading(true)}
              className="px-4 py-2 bg-dockhand-primary text-white rounded hover:opacity-90"
            >
              📤 Upload Resume
            </button>
          </div>

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

          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resumes by title, company, position, or notes..."
              className="w-full p-2 border border-dockhand-border rounded bg-dockhand-surface text-dockhand-text"
            />
          </div>

          {loading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              ⏳ Loading archive...
            </div>
          )}

          {!loading && filteredResumes.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No matching resumes found' : 'No archived resumes yet. Upload one to start building your library.'}
            </div>
          )}

          <div className="space-y-4">
            {filteredResumes.map(resume => (
              <div
                key={resume.id}
                onClick={() => setSelectedResume(resume)}
                className="bg-dockhand-surface border border-dockhand-border rounded-lg p-4 cursor-pointer hover:border-dockhand-primary transition-colors"
              >
                <h3 className="text-lg font-semibold text-dockhand-text mb-1">
                  📄 {resume.title}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {resume.metadata?.company && resume.metadata?.position && (
                    <span>{resume.metadata.company} - {resume.metadata.position} | </span>
                  )}
                  <span>{resume.metadata?.year || 'Unknown year'}</span>
                </div>
                {resume.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {resume.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {selectedResume && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedResume(null)}
                className="text-dockhand-primary hover:underline"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-dockhand-text">
                {selectedResume.title}
              </h2>
            </div>
            <button
              onClick={() => handleDelete(selectedResume.id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:opacity-90"
            >
              🗑️ Delete
            </button>
          </div>

          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {selectedResume.metadata?.company && (
                <div>
                  <span className="text-sm font-semibold text-dockhand-text">Company:</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedResume.metadata.company}
                  </p>
                </div>
              )}
              {selectedResume.metadata?.position && (
                <div>
                  <span className="text-sm font-semibold text-dockhand-text">Position:</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedResume.metadata.position}
                  </p>
                </div>
              )}
              {selectedResume.metadata?.year && (
                <div>
                  <span className="text-sm font-semibold text-dockhand-text">Year:</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedResume.metadata.year}
                  </p>
                </div>
              )}
            </div>
            {selectedResume.notes && (
              <div className="mb-4">
                <span className="text-sm font-semibold text-dockhand-text">Notes:</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedResume.notes}
                </p>
              </div>
            )}
          </div>

          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
            <h4 className="font-semibold mb-2 text-dockhand-text">Content:</h4>
            <pre className="whitespace-pre-wrap text-sm text-dockhand-text font-sans">
              {selectedResume.content}
            </pre>
          </div>
        </div>
      )}

      {isUploading && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dockhand-text">Upload Resume</h2>
            <button
              onClick={() => setIsUploading(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕ Close
            </button>
          </div>

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

          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Title: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                  placeholder="e.g., Software Engineer Resume (2024)"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                    Company:
                  </label>
                  <input
                    type="text"
                    value={uploadForm.company}
                    onChange={(e) => setUploadForm({ ...uploadForm, company: e.target.value })}
                    className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                    Position:
                  </label>
                  <input
                    type="text"
                    value={uploadForm.position}
                    onChange={(e) => setUploadForm({ ...uploadForm, position: e.target.value })}
                    className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                    Year:
                  </label>
                  <input
                    type="number"
                    value={uploadForm.year}
                    onChange={(e) => setUploadForm({ ...uploadForm, year: parseInt(e.target.value) })}
                    className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Notes:
                </label>
                <input
                  type="text"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                  placeholder="e.g., Version used for aerospace applications"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Content (Markdown): <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={uploadForm.content}
                  onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                  className="w-full h-64 p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text font-mono text-sm"
                  placeholder="Paste resume markdown content here..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-dockhand-text rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 bg-dockhand-primary text-white rounded hover:opacity-90"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

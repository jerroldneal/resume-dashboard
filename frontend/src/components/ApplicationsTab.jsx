import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';

export default function ApplicationsTab() {
  const [applications, setApplications] = useState([])
  const [selectedApp, setSelectedApp] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDark, setIsDark] = useState(false)

  // Form state for create/edit
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    jobDescription: '',
    notes: '',
    status: 'active'
  })

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

  async function fetchApplications() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/applications')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApplications(data.data || [])
    } catch (err) {
      setError(`Failed to load applications: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      company: '',
      position: '',
      jobDescription: '',
      notes: '',
      status: 'active'
    })
  }

  function handleCreateClick() {
    resetForm()
    setIsCreating(true)
  }

  function handleEditClick() {
    if (selectedApp) {
      setFormData({
        company: selectedApp.company,
        position: selectedApp.position,
        jobDescription: selectedApp.jobDescription || '',
        notes: selectedApp.notes || '',
        status: selectedApp.status || 'active'
      })
      setIsEditing(true)
    }
  }

  async function handleCreateSubmit(e) {
    e.preventDefault()
    if (!formData.company.trim() || !formData.position.trim()) {
      setError('Company and position are required')
      return
    }

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApplications([...applications, data.data])
      setIsCreating(false)
      resetForm()
    } catch (err) {
      setError(`Failed to create application: ${err.message}`)
    }
  }

  async function handleUpdateSubmit(e) {
    e.preventDefault()
    if (!formData.company.trim() || !formData.position.trim()) {
      setError('Company and position are required')
      return
    }

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApplications(applications.map(app =>
        app.id === selectedApp.id ? data.data : app
      ))
      setSelectedApp(data.data)
      setIsEditing(false)
    } catch (err) {
      setError(`Failed to update application: ${err.message}`)
    }
  }

  async function handleDeleteClick() {
    if (!selectedApp) return
    if (!confirm(`Delete "${selectedApp.company} - ${selectedApp.position}"?`)) return

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setApplications(applications.filter(app => app.id !== selectedApp.id))
      setSelectedApp(null)
    } catch (err) {
      setError(`Failed to delete application: ${err.message}`)
    }
  }

  async function handleStatusToggle() {
    if (!selectedApp) return
    const newStatus = selectedApp.status === 'active' ? 'archived' : 'active'

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApplications(applications.map(app =>
        app.id === selectedApp.id ? data.data : app
      ))
      setSelectedApp(data.data)
    } catch (err) {
      setError(`Failed to update status: ${err.message}`)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Render error alert
  if (error) {
    return (
      <div className="p-6 bg-dockhand-bg text-dockhand-text">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-start">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="font-bold text-lg hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
        <button
          onClick={() => { fetchApplications(); setError(null) }}
          className="bg-dockhand-primary hover:opacity-80 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    )
  }

  // Render loading state
  if (loading) {
    return (
      <div className="p-6 bg-dockhand-bg text-dockhand-text">
        <div className="text-center py-12">
          <p className="text-lg">Loading applications...</p>
        </div>
      </div>
    )
  }

  // Render create/edit form
  if (isCreating || isEditing) {
    return (
      <div className="p-6 bg-dockhand-bg text-dockhand-text min-h-screen">
        <div className="max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => {
                if (isCreating) setIsCreating(false)
                if (isEditing) setIsEditing(false)
                resetForm()
              }}
              className="bg-dockhand-surface border border-dockhand-border hover:opacity-80 px-3 py-2 rounded"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold">
              {isCreating ? 'New Application' : 'Edit Application'}
            </h2>
          </div>

          <form onSubmit={isCreating ? handleCreateSubmit : handleUpdateSubmit}>
            <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6 mb-6">
              {/* Company */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-dockhand-bg border border-dockhand-border rounded px-4 py-2 text-dockhand-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dockhand-primary"
                  placeholder="e.g., Boeing"
                  required
                />
              </div>

              {/* Position */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Position *
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-dockhand-bg border border-dockhand-border rounded px-4 py-2 text-dockhand-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dockhand-primary"
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-dockhand-bg border border-dockhand-border rounded px-4 py-2 text-dockhand-text focus:outline-none focus:ring-2 focus:ring-dockhand-primary"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Job Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Job Description (Markdown)
                </label>
                <div className="border border-dockhand-border rounded overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="markdown"
                    theme={isDark ? 'vs-dark' : 'vs-light'}
                    value={formData.jobDescription}
                    onChange={(value) => setFormData({ ...formData, jobDescription: value || '' })}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-dockhand-bg border border-dockhand-border rounded px-4 py-2 text-dockhand-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dockhand-primary"
                  placeholder="Add any notes about this application..."
                  rows="6"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-dockhand-primary hover:opacity-80 text-white px-6 py-2 rounded font-medium"
                >
                  {isCreating ? 'Create' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isCreating) setIsCreating(false)
                    if (isEditing) setIsEditing(false)
                    resetForm()
                  }}
                  className="bg-dockhand-surface border border-dockhand-border hover:opacity-80 px-6 py-2 rounded font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Render detail view
  if (selectedApp) {
    return (
      <div className="p-6 bg-dockhand-bg text-dockhand-text min-h-screen">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedApp(null)}
                className="bg-dockhand-surface border border-dockhand-border hover:opacity-80 px-3 py-2 rounded"
              >
                ← Back to List
              </button>
              <h2 className="text-2xl font-bold">
                {selectedApp.company} - {selectedApp.position}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEditClick}
                className="bg-dockhand-primary hover:opacity-80 text-white px-4 py-2 rounded font-medium"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                className="bg-red-600 hover:opacity-80 text-white px-4 py-2 rounded font-medium"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium">{formatDate(selectedApp.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated</p>
                <p className="font-medium">{formatDate(selectedApp.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    selectedApp.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {selectedApp.status === 'active' ? 'Active' : 'Archived'}
                  </span>
                  <button
                    onClick={handleStatusToggle}
                    className="text-sm underline hover:opacity-70"
                  >
                    toggle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Job Description</h3>
            <div className="prose prose-invert max-w-none text-dockhand-text">
              {selectedApp.jobDescription ? (
                <div className="bg-dockhand-bg rounded p-4 border border-dockhand-border whitespace-pre-wrap text-sm font-mono">
                  {selectedApp.jobDescription}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No job description provided</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            {selectedApp.notes ? (
              <div className="bg-dockhand-bg rounded p-4 border border-dockhand-border whitespace-pre-wrap text-sm">
                {selectedApp.notes}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No notes added</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render list view (default)
  return (
    <div className="p-6 bg-dockhand-bg text-dockhand-text min-h-screen">
      <div className="max-w-4xl">
        {/* Header with create button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Applications</h2>
          <button
            onClick={handleCreateClick}
            className="bg-dockhand-primary hover:opacity-80 text-white px-6 py-2 rounded-lg font-medium"
          >
            + New Application
          </button>
        </div>

        {/* Empty state */}
        {applications.length === 0 ? (
          <div className="text-center py-16 bg-dockhand-surface border border-dockhand-border rounded-lg">
            <p className="text-xl mb-6 text-gray-500 dark:text-gray-400">
              No applications yet
            </p>
            <button
              onClick={handleCreateClick}
              className="bg-dockhand-primary hover:opacity-80 text-white px-8 py-3 rounded-lg font-medium"
            >
              Create Your First Application
            </button>
          </div>
        ) : (
          /* Applications list */
          <div className="space-y-3">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="w-full text-left bg-dockhand-surface border border-dockhand-border rounded-lg p-4 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {app.company} - {app.position}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Created: {formatDate(app.createdAt)}</span>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        app.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {app.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react';

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    theme: 'auto',
    folders: {
      applications: './data/applications',
      archive: './data/archive'
    },
    llm: {
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      model: 'qwen2.5:1.5b'
    }
  })

  const [originalSettings, setOriginalSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [error, setError] = useState(null)
  const [healthInfo, setHealthInfo] = useState(null)

  useEffect(() => {
    fetchSettings()
    fetchHealth()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSettings(data.data)
      setOriginalSettings(JSON.parse(JSON.stringify(data.data)))
    } catch (err) {
      setError(`Failed to load settings: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function fetchHealth() {
    try {
      const res = await fetch('/health')
      if (res.ok) {
        const data = await res.json()
        setHealthInfo(data)
      }
    } catch (err) {
      // Ignore health check errors
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.toggle('dark', isDark)
      }

      setOriginalSettings(JSON.parse(JSON.stringify(settings)))
    } catch (err) {
      setError(`Failed to save settings: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setConnectionStatus(null)
    try {
      console.log(`Testing connection to ${settings.llm.endpoint}/api/version`)
      const res = await fetch(`${settings.llm.endpoint}/api/version`, {
        method: 'GET'
      })
      if (res.ok) {
        console.log('Connection successful!', await res.json());
        setConnectionStatus({ success: true, message: 'Connection successful!' })
      } else {
        setConnectionStatus({ success: false, message: `HTTP ${res.status}` })
      }
    } catch (err) {
      setConnectionStatus({ success: false, message: err.message })
    } finally {
      setTesting(false)
    }
  }

  function handleReset() {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)))
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-dockhand-text">Settings</h2>

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

      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          ⏳ Loading settings...
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-dockhand-text">Appearance</h3>
            <div>
              <label className="block text-sm font-semibold mb-2 text-dockhand-text">
                Theme:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={settings.theme === 'light'}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-dockhand-text">☀️ Light</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={settings.theme === 'dark'}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-dockhand-text">🌙 Dark</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="auto"
                    checked={settings.theme === 'auto'}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-dockhand-text">🔄 Auto</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-dockhand-text">LLM Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Provider:
                </label>
                <select
                  value={settings.llm.provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    llm: { ...settings.llm, provider: e.target.value }
                  })}
                  className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                >
                  <option value="ollama">Ollama</option>
                  <option value="openai">OpenAI (future)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Endpoint:
                </label>
                <input
                  type="text"
                  value={settings.llm.endpoint}
                  onChange={(e) => setSettings({
                    ...settings,
                    llm: { ...settings.llm, endpoint: e.target.value }
                  })}
                  className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                  placeholder="http://localhost:11434"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Model:
                </label>
                <input
                  type="text"
                  value={settings.llm.model}
                  onChange={(e) => setSettings({
                    ...settings,
                    llm: { ...settings.llm, model: e.target.value }
                  })}
                  className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                  placeholder="qwen2.5:1.5b"
                />
              </div>

              <div>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:opacity-90"
                >
                  {testing ? '⏳ Testing...' : '🔍 Test Connection'}
                </button>
                {connectionStatus && (
                  <span className={`ml-4 text-sm ${
                    connectionStatus.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {connectionStatus.success ? '✅' : '❌'} {connectionStatus.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-dockhand-text">Folder Paths</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Applications:
                </label>
                <input
                  type="text"
                  value={settings.folders.applications}
                  onChange={(e) => setSettings({
                    ...settings,
                    folders: { ...settings.folders, applications: e.target.value }
                  })}
                  className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-dockhand-text">
                  Archive:
                </label>
                <input
                  type="text"
                  value={settings.folders.archive}
                  onChange={(e) => setSettings({
                    ...settings,
                    folders: { ...settings.folders, archive: e.target.value }
                  })}
                  className="w-full p-2 border border-dockhand-border rounded bg-dockhand-bg text-dockhand-text"
                />
              </div>
            </div>
          </div>

          {healthInfo && (
            <div className="bg-dockhand-surface border border-dockhand-border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-dockhand-text">System Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-dockhand-text">Backend Status:</span>
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    ✅ {healthInfo.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-dockhand-text">Uptime:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {Math.floor(healthInfo.uptime / 3600)}h {Math.floor((healthInfo.uptime % 3600) / 60)}m
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-dockhand-text">Data Directory:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300 text-xs">
                    {healthInfo.dataDir}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-6 py-2 bg-dockhand-primary text-white rounded disabled:opacity-50 hover:opacity-90"
            >
              {saving ? '⏳ Saving...' : '💾 Save Settings'}
            </button>
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-dockhand-text rounded disabled:opacity-50 hover:opacity-90"
            >
              ↩️ Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

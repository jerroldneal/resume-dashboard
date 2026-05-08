import { useState } from 'react';
import ApplicationsTab from './components/ApplicationsTab';
import ArchiveTab from './components/ArchiveTab';
import FinalizeTab from './components/FinalizeTab';
import PrimersTab from './components/PrimersTab';
import PromptsTab from './components/PromptsTab';
import SettingsTab from './components/SettingsTab';
import TryoutsTab from './components/TryoutsTab';

const tabs = [
  { id: 'applications', label: 'Applications', component: ApplicationsTab },
  { id: 'tryouts', label: 'Tryouts', component: TryoutsTab },
  { id: 'prompts', label: 'Prompts', component: PromptsTab },
  { id: 'finalize', label: 'Finalize', component: FinalizeTab },
  { id: 'primers', label: 'Interview Primers', component: PrimersTab },
  { id: 'archive', label: 'Archive', component: ArchiveTab },
  { id: 'settings', label: 'Settings', component: SettingsTab }
]

export default function App() {
  const [activeTab, setActiveTab] = useState('applications')

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-dockhand-bg dark:bg-slate-900 text-dockhand-text dark:text-slate-50">
      {/* Header */}
      <header className="bg-dockhand-surface dark:bg-slate-800 border-b border-dockhand-border dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-dockhand-primary">Resume Dashboard</h1>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-dockhand-surface dark:bg-slate-800 border-b border-dockhand-border dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-dockhand-primary text-dockhand-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto">
        <div id={`panel-${activeTab}`} role="tabpanel">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </main>
    </div>
  )
}

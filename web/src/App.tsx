import { useEffect, useState, useMemo } from 'react'
import type { Paper, PaperStatus, ApiResponse, ReviewSettings } from './types'

const API_BASE = 'http://localhost:3000'

export default function App() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaperStatus>('ALL')

  // Review Settings state
  const [settings, setSettings] = useState<ReviewSettings>({
    id: 'default',
    topic: 'Do AI coding assistants help developers work faster or write better code?',
    inclusionCriteria: 'Empirical studies, experiments, or surveys measuring developer productivity, code quality, or development speed using AI coding assistants.',
    exclusionCriteria: 'Non-software engineering domains, papers without empirical developer evaluations, or general AI papers unrelated to code generation tools.',
  })
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')

  // Pagination state
  const [limit] = useState(10)
  const [offset, setOffset] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    venue: '',
    year: new Date().getFullYear().toString(),
    abstract: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Decision Modal state (Human screening)
  const [decisionModal, setDecisionModal] = useState<{
    paper: Paper
    status: 'INCLUDED' | 'EXCLUDED'
  } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [decisionError, setDecisionError] = useState('')

  // Track expanded reasons in table
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({})

  // AI Suggestion loading state
  const [requestingAi, setRequestingAi] = useState<Record<string, boolean>>({})
  const [reRunningAll, setReRunningAll] = useState(false)

  // Fetch review settings
  async function fetchSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (err) {
      console.error('Failed to load review settings:', err)
    }
  }

  // Save review settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsMessage('')
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setSettingsMessage('Settings saved successfully! Future AI screenings will use these criteria.')
        setTimeout(() => setSettingsMessage(''), 4000)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save settings')
      }
    } catch (err) {
      console.error(err)
      alert('Network error saving settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // Fetch papers
  async function fetchPapers() {
    try {
      const res = await fetch(`${API_BASE}/papers?limit=${limit}&offset=${offset}`)
      const data: ApiResponse = await res.json()
      setPapers(data.papers || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load papers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchPapers()
  }, [offset])

  // Poll when any paper is in QUEUED state
  useEffect(() => {
    const hasQueued = papers.some((p) => p.aiSuggestion === 'QUEUED')
    if (!hasQueued) return

    const interval = setInterval(() => {
      fetchPapers()
    }, 2000)

    return () => clearInterval(interval)
  }, [papers])

  // Handle Add Paper
  async function handleAddPaper(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setFormSubmitting(true)

    try {
      const res = await fetch(`${API_BASE}/papers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year, 10) || formData.year,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details) {
          const errors: Record<string, string> = {}
          for (const item of data.details) {
            errors[item.field] = item.message
          }
          setFieldErrors(errors)
        } else {
          alert(data.error || 'Failed to add paper')
        }
        return
      }

      setFormData({
        title: '',
        authors: '',
        venue: '',
        year: new Date().getFullYear().toString(),
        abstract: '',
      })
      fetchPapers()
    } catch (err) {
      console.error(err)
      alert('Network error connecting to API')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Trigger or Re-run AI suggestion for a single paper
  async function handleAiSuggest(paperId: string) {
    setRequestingAi((prev) => ({ ...prev, [paperId]: true }))
    try {
      const res = await fetch(`${API_BASE}/papers/${paperId}/ai-suggest`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to queue AI screening')
      } else {
        await fetchPapers()
      }
    } catch (err) {
      console.error(err)
      alert('Network error requesting AI screening')
    } finally {
      setRequestingAi((prev) => ({ ...prev, [paperId]: false }))
    }
  }

  // Re-run AI on all pending papers
  async function handleReRunAllAi() {
    if (!confirm('Re-run AI screening for all pending papers?')) return
    setReRunningAll(true)
    try {
      const res = await fetch(`${API_BASE}/papers/re-run-ai`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchPapers()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to re-run AI suggestions')
      }
    } catch (err) {
      console.error(err)
      alert('Network error re-running AI suggestions')
    } finally {
      setReRunningAll(false)
    }
  }

  // Handle Submit Human Decision
  async function handleDecisionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!decisionModal) return
    if (!decisionReason.trim()) {
      setDecisionError('Please provide a reason for your decision.')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/papers/${decisionModal.paper.id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decisionModal.status,
          decisionReason: decisionReason.trim(),
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        setDecisionError(errData.error || 'Failed to update decision')
        return
      }

      setDecisionModal(null)
      setDecisionReason('')
      setDecisionError('')
      fetchPapers()
    } catch (err) {
      console.error(err)
      setDecisionError('Network error connecting to API')
    }
  }

  // Toggle reason expanded
  function toggleReason(id: string) {
    setExpandedReasons((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter papers for display
  const filteredPapers = useMemo(() => {
    if (statusFilter === 'ALL') return papers
    return papers.filter((p) => p.status === statusFilter)
  }, [papers, statusFilter])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">mini-ReLiS</h1>
            <p className="text-slate-600 mt-1">
              Systematic Literature Review Screener with Topic-Guided AI Assistance
            </p>
          </div>
          <div className="bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-lg border border-amber-200 font-medium max-w-sm">
            💡 AI only provides suggestions based on your Review Settings. Humans make the final decision.
          </div>
        </div>
      </header>

      {/* Review Settings Form Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">🎯 Review Settings & Criteria</span>
            <span className="text-xs text-slate-500 font-normal">
              (AI checks every paper against these specific rules)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            {settingsOpen ? 'Hide Settings ▲' : 'Edit Settings ▼'}
          </button>
        </div>

        {settingsOpen && (
          <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Review Topic / Research Question
              </label>
              <input
                type="text"
                value={settings.topic}
                onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm border-slate-300 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Do AI coding assistants help developers work faster or write better code?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">
                  Inclusion Criteria
                </label>
                <textarea
                  rows={2}
                  value={settings.inclusionCriteria}
                  onChange={(e) => setSettings({ ...settings, inclusionCriteria: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-xs border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="What must a paper contain to be included?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-rose-800 mb-1">
                  Exclusion Criteria
                </label>
                <textarea
                  rows={2}
                  value={settings.exclusionCriteria}
                  onChange={(e) => setSettings({ ...settings, exclusionCriteria: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-xs border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="What reasons disqualify a paper?"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-slate-900 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
              {settingsMessage && (
                <span className="text-xs text-emerald-600 font-medium">{settingsMessage}</span>
              )}
            </div>
          </form>
        )}
      </section>

      {/* Main Grid: Add Paper (1 col) & Papers Table (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form: Add Paper */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-fit">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Add New Paper</h2>
          <form onSubmit={handleAddPaper} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Paper title"
              />
              {fieldErrors.title && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Authors
              </label>
              <input
                type="text"
                value={formData.authors}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Author names"
              />
              {fieldErrors.authors && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.authors}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. ICSE"
                />
                {fieldErrors.venue && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.venue}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="2024"
                />
                {fieldErrors.year && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.year}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Abstract
              </label>
              <textarea
                rows={3}
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary..."
              />
              {fieldErrors.abstract && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.abstract}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm cursor-pointer"
            >
              {formSubmitting ? 'Adding...' : 'Add Paper'}
            </button>
          </form>
        </section>

        {/* Papers Table & Screening (2 cols) */}
        <section className="lg:col-span-2 space-y-4">
          {/* Filter Controls & Bulk Re-run */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">
                Status:
              </span>
              {(['ALL', 'PENDING', 'INCLUDED', 'EXCLUDED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReRunAllAi}
                disabled={reRunningAll}
                className="text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                title="Re-run AI screening for all pending papers against the current review criteria"
              >
                {reRunningAll ? 'Re-running...' : '⚡ Re-run AI on all pending'}
              </button>
              <span className="text-xs text-slate-500 font-medium">
                {filteredPapers.length} of {total} papers
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading papers...</div>
            ) : filteredPapers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No papers found for this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-2/5">Title & Abstract</th>
                      <th className="py-3 px-4 w-1/3">AI Suggestion & Reason</th>
                      <th className="py-3 px-4">Human Decision</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPapers.map((paper) => {
                      const isAiExpanded = expandedReasons[`ai_${paper.id}`]
                      const isHumanExpanded = expandedReasons[`human_${paper.id}`]

                      return (
                        <tr key={paper.id} className="hover:bg-slate-50/50 align-top">
                          {/* Title & Abstract */}
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 leading-snug">{paper.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {paper.authors} • <span className="font-medium text-slate-700">{paper.venue}</span> ({paper.year})
                            </p>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                              {paper.abstract}
                            </p>
                          </td>

                          {/* AI Suggestion & Fully Readable Reason */}
                          <td className="py-3 px-4">
                            {paper.aiSuggestion === 'QUEUED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                                AI Thinking...
                              </span>
                            ) : paper.aiSuggestion === 'INCLUDE' ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                                    🤖 Suggest: INCLUDE
                                  </span>
                                  {paper.status === 'PENDING' && (
                                    <button
                                      onClick={() => handleAiSuggest(paper.id)}
                                      disabled={requestingAi[paper.id]}
                                      className="text-[11px] text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                                    >
                                      Re-run AI
                                    </button>
                                  )}
                                </div>
                                {paper.aiReason && (
                                  <div
                                    onClick={() => toggleReason(`ai_${paper.id}`)}
                                    className="cursor-pointer group"
                                    title="Click to expand/collapse"
                                  >
                                    <p
                                      className={`text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100 ${
                                        isAiExpanded ? '' : 'line-clamp-3'
                                      }`}
                                    >
                                      {paper.aiReason}
                                    </p>
                                    {paper.aiReason.length > 120 && (
                                      <span className="text-[10px] text-blue-600 font-medium group-hover:underline">
                                        {isAiExpanded ? 'Show less ▲' : 'Read more ▼'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : paper.aiSuggestion === 'EXCLUDE' ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                    🤖 Suggest: EXCLUDE
                                  </span>
                                  {paper.status === 'PENDING' && (
                                    <button
                                      onClick={() => handleAiSuggest(paper.id)}
                                      disabled={requestingAi[paper.id]}
                                      className="text-[11px] text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                                    >
                                      Re-run AI
                                    </button>
                                  )}
                                </div>
                                {paper.aiReason && (
                                  <div
                                    onClick={() => toggleReason(`ai_${paper.id}`)}
                                    className="cursor-pointer group"
                                    title="Click to expand/collapse"
                                  >
                                    <p
                                      className={`text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100 ${
                                        isAiExpanded ? '' : 'line-clamp-3'
                                      }`}
                                    >
                                      {paper.aiReason}
                                    </p>
                                    {paper.aiReason.length > 120 && (
                                      <span className="text-[10px] text-blue-600 font-medium group-hover:underline">
                                        {isAiExpanded ? 'Show less ▲' : 'Read more ▼'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : paper.aiSuggestion === 'FAILED' ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                    ⚠️ AI Failed
                                  </span>
                                  <button
                                    onClick={() => handleAiSuggest(paper.id)}
                                    disabled={requestingAi[paper.id]}
                                    className="text-[11px] text-red-600 hover:underline cursor-pointer"
                                  >
                                    Retry
                                  </button>
                                </div>
                                {paper.aiReason && (
                                  <p className="text-xs text-red-500 leading-relaxed">{paper.aiReason}</p>
                                )}
                              </div>
                            ) : paper.status === 'PENDING' ? (
                              <button
                                disabled={requestingAi[paper.id]}
                                onClick={() => handleAiSuggest(paper.id)}
                                className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                              >
                                {requestingAi[paper.id] ? 'Queuing...' : '✨ AI suggest'}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No suggestion</span>
                            )}
                          </td>

                          {/* Human Decision & Reason */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                paper.status === 'INCLUDED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : paper.status === 'EXCLUDED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {paper.status}
                            </span>
                            {paper.decisionReason && (
                              <div
                                onClick={() => toggleReason(`human_${paper.id}`)}
                                className="mt-1.5 cursor-pointer group"
                                title="Click to expand/collapse"
                              >
                                <p
                                  className={`text-xs text-slate-600 italic leading-relaxed ${
                                    isHumanExpanded ? '' : 'line-clamp-3'
                                  }`}
                                >
                                  "{paper.decisionReason}"
                                </p>
                                {paper.decisionReason.length > 100 && (
                                  <span className="text-[10px] text-blue-600 font-medium group-hover:underline">
                                    {isHumanExpanded ? 'Show less ▲' : 'Read more ▼'}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => {
                                  setDecisionModal({ paper, status: 'INCLUDED' })
                                  setDecisionReason(paper.aiReason || '')
                                  setDecisionError('')
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                              >
                                Include
                              </button>
                              <button
                                onClick={() => {
                                  setDecisionModal({ paper, status: 'EXCLUDED' })
                                  setDecisionReason(paper.aiReason || '')
                                  setDecisionError('')
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors cursor-pointer"
                              >
                                Exclude
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {total > limit && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-40 cursor-pointer font-medium"
                >
                  Previous
                </button>
                <span className="text-slate-600">
                  Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
                </span>
                <button
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-md disabled:opacity-40 cursor-pointer font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              {decisionModal.status === 'INCLUDED' ? 'Include' : 'Exclude'} Paper
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-medium">
              "{decisionModal.paper.title}"
            </p>

            {decisionModal.paper.aiSuggestion && (
              <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">AI Suggested: </span>
                <span
                  className={
                    decisionModal.paper.aiSuggestion === 'INCLUDE'
                      ? 'text-violet-700 font-bold'
                      : 'text-orange-700 font-bold'
                  }
                >
                  {decisionModal.paper.aiSuggestion}
                </span>
                {decisionModal.paper.aiReason && (
                  <p className="text-slate-500 mt-1 italic">"{decisionModal.paper.aiReason}"</p>
                )}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Reason for Decision
                </label>
                <textarea
                  autoFocus
                  rows={3}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why this paper is included or excluded..."
                />
                {decisionError && (
                  <p className="text-red-600 text-xs mt-1">{decisionError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm text-white font-medium rounded-md cursor-pointer ${
                    decisionModal.status === 'INCLUDED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {decisionModal.status === 'INCLUDED' ? 'Inclusion' : 'Exclusion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useMemo, useCallback } from 'react'
import type { Paper, PaperStatus, ApiResponse, ReviewSettings, ToastMessage, ScreeningStats } from './types'
import { Header } from './components/Header'
import { StatsStrip } from './components/StatsStrip'
import { ScreenFocusView } from './components/ScreenFocusView'
import { AllPapersView } from './components/AllPapersView'
import { AddPaperDrawer } from './components/AddPaperDrawer'
import { SettingsDrawer } from './components/SettingsDrawer'
import { DecisionModal } from './components/DecisionModal'
import { ToastContainer } from './components/Toast'
import { FocusSkeleton } from './components/Skeleton'

const API_BASE = 'http://localhost:3000'

export default function App() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Navigation & View Mode
  const [currentTab, setCurrentTab] = useState<'screen' | 'all'>('screen')
  const [focusIndex, setFocusIndex] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaperStatus>('ALL')

  // Pagination for All Papers table
  const [limit] = useState(15)
  const [offset, setOffset] = useState(0)

  // Drawers
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Review Settings
  const [settings, setSettings] = useState<ReviewSettings>({
    id: 'default',
    topic: 'Do AI coding assistants help developers work faster or write better code?',
    inclusionCriteria: 'Empirical studies, experiments, or surveys measuring developer productivity, code quality, or development speed using AI coding assistants.',
    exclusionCriteria: 'Non-software engineering domains, papers without empirical developer evaluations, or general AI papers unrelated to code generation tools.',
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Add Paper Form
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    venue: '',
    year: new Date().getFullYear().toString(),
    abstract: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submittingPaper, setSubmittingPaper] = useState(false)

  // Human Decision Modal
  const [decisionModal, setDecisionModal] = useState<{
    paper: Paper
    type: 'INCLUDED' | 'EXCLUDED'
  } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [decisionError, setDecisionError] = useState('')

  // AI Background Job triggers
  const [requestingAi, setRequestingAi] = useState<Record<string, boolean>>({})
  const [reRunningAll, setReRunningAll] = useState(false)

  // Toast Stack
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, type, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Fetch Settings
  async function fetchSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch {
      addToast('error', 'Unable to connect to API to load settings.')
    }
  }

  // Fetch Papers
  const fetchPapers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/papers?limit=${limit}&offset=${offset}`)
      const data: ApiResponse = await res.json()
      setPapers(data.papers || [])
      setTotal(data.total || 0)
    } catch {
      addToast('error', 'Unable to fetch papers from API.')
    } finally {
      setLoading(false)
    }
  }, [limit, offset, addToast])

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    fetchPapers()
  }, [fetchPapers])

  // Background polling when any paper is in QUEUED state
  useEffect(() => {
    const hasQueued = papers.some((p) => p.aiSuggestion === 'QUEUED')
    if (!hasQueued) return

    const interval = setInterval(() => {
      fetchPapers()
    }, 2000)

    return () => clearInterval(interval)
  }, [papers, fetchPapers])

  // Statistics Calculation
  const stats: ScreeningStats = useMemo(() => {
    const pending = papers.filter((p) => p.status === 'PENDING').length
    const included = papers.filter((p) => p.status === 'INCLUDED').length
    const excluded = papers.filter((p) => p.status === 'EXCLUDED').length
    const screened = included + excluded
    const totalCount = total || papers.length
    const percentage = totalCount > 0 ? Math.round((screened / totalCount) * 100) : 0

    return {
      total: totalCount,
      pending,
      included,
      excluded,
      screened,
      percentage,
    }
  }, [papers, total])

  // Pending papers for Focus Mode screening
  const pendingPapers = useMemo(() => {
    return papers.filter((p) => p.status === 'PENDING')
  }, [papers])

  // Save Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setIsSettingsOpen(false)
        addToast('success', 'Review protocol saved. AI screenings will now use this criteria.')
      } else {
        const err = await res.json()
        addToast('error', err.error || 'Failed to save review protocol.')
      }
    } catch {
      addToast('error', 'Network error connecting to API.')
    } finally {
      setSavingSettings(false)
    }
  }

  // Add Paper
  async function handleAddPaper(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setSubmittingPaper(true)

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
          addToast('error', data.error || 'Failed to add paper.')
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
      setIsAddOpen(false)
      addToast('success', 'Candidate paper successfully added.')
      fetchPapers()
    } catch {
      addToast('error', 'Network error submitting paper.')
    } finally {
      setSubmittingPaper(false)
    }
  }

  // Request / Re-run AI suggestion for single paper
  async function handleRequestAi(paperId: string) {
    setRequestingAi((prev) => ({ ...prev, [paperId]: true }))
    try {
      const res = await fetch(`${API_BASE}/papers/${paperId}/ai-suggest`, {
        method: 'POST',
      })
      if (res.ok) {
        addToast('info', 'AI screening job queued with Gemini 2.5.')
        await fetchPapers()
      } else {
        const data = await res.json()
        addToast('error', data.error || 'Failed to queue AI screening.')
      }
    } catch {
      addToast('error', 'Network error connecting to API.')
    } finally {
      setRequestingAi((prev) => ({ ...prev, [paperId]: false }))
    }
  }

  // Re-run AI on all pending
  async function handleReRunAllAi() {
    setReRunningAll(true)
    try {
      const res = await fetch(`${API_BASE}/papers/re-run-ai`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        addToast('info', data.message || 'Queued AI screening for all pending papers.')
        await fetchPapers()
      } else {
        const data = await res.json()
        addToast('error', data.error || 'Failed to queue bulk AI screening.')
      }
    } catch {
      addToast('error', 'Network error connecting to API.')
    } finally {
      setReRunningAll(false)
    }
  }

  // Open Decision Modal
  function handleOpenDecision(paper: Paper, decision: 'INCLUDED' | 'EXCLUDED') {
    setDecisionModal({ paper, type: decision })
    // Empty by default (user can click 'Use AI reason' to copy it)
    setDecisionReason('')
    setDecisionError('')
  }

  // Submit Decision
  async function handleDecisionSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!decisionModal) return
    if (!decisionReason.trim()) {
      setDecisionError('Please provide a screening rationale.')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/papers/${decisionModal.paper.id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decisionModal.type,
          decisionReason: decisionReason.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setDecisionError(data.error || 'Failed to record decision.')
        return
      }

      addToast(
        'success',
        `Paper successfully marked as ${decisionModal.type === 'INCLUDED' ? 'Included' : 'Excluded'}.`
      )
      setDecisionModal(null)
      setDecisionReason('')
      setDecisionError('')

      // If index is past end of pending list after removal, clamp to last index
      if (focusIndex > 0 && focusIndex >= pendingPapers.length - 1) {
        setFocusIndex(Math.max(0, pendingPapers.length - 2))
      }

      fetchPapers()
    } catch {
      setDecisionError('Network error connecting to API.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#141b24] font-sans selection:bg-teal-100 selection:text-teal-900 pb-16">
      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenAddPaper={() => setIsAddOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Stats Strip & Progress Bar */}
        <StatsStrip stats={stats} />

        {/* Main Content Area */}
        <main>
          {loading ? (
            <FocusSkeleton />
          ) : currentTab === 'screen' ? (
            <ScreenFocusView
              papers={pendingPapers}
              currentIndex={focusIndex}
              onNavigate={setFocusIndex}
              onOpenDecision={handleOpenDecision}
              onRequestAi={handleRequestAi}
              isRequestingAi={Boolean(pendingPapers[focusIndex] && requestingAi[pendingPapers[focusIndex].id])}
            />
          ) : (
            <AllPapersView
              papers={papers}
              total={total}
              limit={limit}
              offset={offset}
              statusFilter={statusFilter}
              loading={loading}
              onFilterChange={setStatusFilter}
              onOffsetChange={setOffset}
              onOpenDecision={handleOpenDecision}
              onRequestAi={handleRequestAi}
              onReRunAllAi={handleReRunAllAi}
              requestingAi={requestingAi}
              reRunningAll={reRunningAll}
            />
          )}
        </main>
      </div>

      {/* Slide-over Drawers */}
      <AddPaperDrawer
        isOpen={isAddOpen}
        formData={formData}
        fieldErrors={fieldErrors}
        submitting={submittingPaper}
        onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
        onSubmit={handleAddPaper}
        onClose={() => setIsAddOpen(false)}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        settings={settings}
        saving={savingSettings}
        onChange={(field, val) => setSettings((prev) => ({ ...prev, [field]: val }))}
        onSubmit={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Human Decision Modal */}
      {decisionModal && (
        <DecisionModal
          paper={decisionModal.paper}
          decisionType={decisionModal.type}
          reason={decisionReason}
          error={decisionError}
          onReasonChange={setDecisionReason}
          onSubmit={handleDecisionSubmit}
          onClose={() => setDecisionModal(null)}
        />
      )}
    </div>
  )
}

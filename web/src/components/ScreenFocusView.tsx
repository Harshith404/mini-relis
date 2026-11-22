import { useEffect } from 'react'
import { Sparkles, ArrowLeft, ArrowRight, Check, Ban, RotateCcw, AlertCircle } from 'lucide-react'
import type { Paper } from '../types'

interface Props {
  papers: Paper[]
  currentIndex: number
  onNavigate: (index: number) => void
  onOpenDecision: (paper: Paper, decision: 'INCLUDED' | 'EXCLUDED') => void
  onRequestAi: (paperId: string) => void
  isRequestingAi: boolean
}

export function ScreenFocusView({
  papers,
  currentIndex,
  onNavigate,
  onOpenDecision,
  onRequestAi,
  isRequestingAi,
}: Props) {
  const currentPaper = papers[currentIndex]

  // Global Keyboard Shortcuts (I, E, N, P, ArrowLeft, ArrowRight)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input, textarea, or modal is open
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (!currentPaper) return

      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        onOpenDecision(currentPaper, 'INCLUDED')
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        onOpenDecision(currentPaper, 'EXCLUDED')
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentIndex < papers.length - 1) onNavigate(currentIndex + 1)
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentIndex > 0) onNavigate(currentIndex - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPaper, currentIndex, papers.length, onNavigate, onOpenDecision])

  if (!currentPaper) {
    return (
      <div className="bg-[#fcfbf9] border border-[#e8e5dc] rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h3 className="text-base font-serif font-semibold text-stone-900">
          🎉 All papers screened!
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          You've screened every pending candidate. Switch to the <strong>All Papers</strong> tab to review decisions, inspect stats, or re-run screenings.
        </p>
      </div>
    )
  }

  const isPending = currentPaper.status === 'PENDING'
  const isIncluded = currentPaper.status === 'INCLUDED'
  const isExcluded = currentPaper.status === 'EXCLUDED'

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Paper Card */}
      <div className="bg-[#ffffff] border border-[#e8e5dc] rounded-2xl shadow-xs p-6 sm:p-8 space-y-6 relative">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-[#f0ede6] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Pending {currentIndex + 1} of {papers.length}
            </span>

            {/* Human Decision Badge (Visual Strongest) */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isIncluded
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isExcluded
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              {currentPaper.status}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-md border border-[#e2ded3] bg-[#fbfaf8] hover:bg-[#f2efe8] text-stone-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous paper (P or ←)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={currentIndex === papers.length - 1}
              className="p-1.5 rounded-md border border-[#e2ded3] bg-[#fbfaf8] hover:bg-[#f2efe8] text-stone-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next paper (N or →)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Paper Title & Metadata */}
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#141b24] leading-snug tracking-tight">
            {currentPaper.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mt-2">
            <span className="font-medium text-stone-700">{currentPaper.authors}</span>
            <span>•</span>
            <span className="italic">{currentPaper.venue}</span>
            <span>•</span>
            <span>{currentPaper.year}</span>
          </div>
        </div>

        {/* Abstract */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Abstract
          </h4>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans bg-[#fbfaf8] p-4 rounded-xl border border-[#f0ede6]">
            {currentPaper.abstract}
          </p>
        </div>

        {/* AI Suggestion Box (Dashed border + Sparkle Icon + Clearly Secondary) */}
        <div className="rounded-xl border border-dashed border-indigo-200 bg-[#f9f8fc] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-950 uppercase tracking-wider">
                AI suggestion
              </span>
              <span className="text-[10px] text-stone-400">
                ({currentPaper.aiModel || 'Gemini 2.5'})
              </span>
            </div>

            {isPending && (
              <button
                onClick={() => onRequestAi(currentPaper.id)}
                disabled={isRequestingAi || currentPaper.aiSuggestion === 'QUEUED'}
                className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{currentPaper.aiSuggestion ? 'Re-run AI' : 'Ask AI'}</span>
              </button>
            )}
          </div>

          {currentPaper.aiSuggestion === 'QUEUED' ? (
            <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium py-1 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Analyzing paper against your review criteria in background queue...</span>
            </div>
          ) : currentPaper.aiSuggestion === 'INCLUDE' ? (
            <div className="space-y-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-100 text-violet-800 border border-violet-200">
                INCLUDE
              </span>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "{currentPaper.aiReason}"
              </p>
            </div>
          ) : currentPaper.aiSuggestion === 'EXCLUDE' ? (
            <div className="space-y-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                EXCLUDE
              </span>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "{currentPaper.aiReason}"
              </p>
            </div>
          ) : currentPaper.aiSuggestion === 'FAILED' ? (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{currentPaper.aiReason || 'AI screening failed validation or exceeded rate limit.'}</p>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-stone-500 py-1">
              <span>No AI suggestion generated for this paper yet.</span>
              <button
                onClick={() => onRequestAi(currentPaper.id)}
                disabled={isRequestingAi}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                Generate Suggestion
              </button>
            </div>
          )}
        </div>

        {/* Existing Human Decision Note (if already screened) */}
        {!isPending && currentPaper.decisionReason && (
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs">
            <span className="font-semibold text-stone-700 uppercase tracking-wider text-[10px] block mb-1">
              Recorded Human Decision Reason:
            </span>
            <p className="text-stone-700 italic">"{currentPaper.decisionReason}"</p>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="pt-2 border-t border-[#f0ede6]">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => onOpenDecision(currentPaper, 'EXCLUDED')}
              className="py-3 px-4 rounded-xl border border-rose-200 bg-[#fff9f9] hover:bg-[#ffeef0] text-rose-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Ban className="w-4 h-4" />
              <span>Exclude Paper</span>
              <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono bg-white text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                E
              </kbd>
            </button>

            <button
              onClick={() => onOpenDecision(currentPaper, 'INCLUDED')}
              className="py-3 px-4 rounded-xl border border-emerald-200 bg-[#f7fdf9] hover:bg-[#edfbf1] text-emerald-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Include Paper</span>
              <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono bg-white text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                I
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Helper Ribbon */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400 font-medium">
        <span>Shortcuts:</span>
        <span>
          <kbd className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 font-mono">I</kbd> Include
        </span>
        <span>
          <kbd className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 font-mono">E</kbd> Exclude
        </span>
        <span>
          <kbd className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 font-mono">N</kbd> / <kbd className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 font-mono">→</kbd> Next
        </span>
        <span>
          <kbd className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 font-mono">P</kbd> / <kbd className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 font-mono">←</kbd> Prev
        </span>
      </div>
    </div>
  )
}

import React, { useEffect } from 'react'
import { Sparkles, X, Check, Ban } from 'lucide-react'
import type { Paper } from '../types'

interface Props {
  paper: Paper
  decisionType: 'INCLUDED' | 'EXCLUDED'
  reason: string
  error: string
  onReasonChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function DecisionModal({
  paper,
  decisionType,
  reason,
  error,
  onReasonChange,
  onSubmit,
  onClose,
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const isInclude = decisionType === 'INCLUDED'

  return (
    <div className="fixed inset-0 z-50 bg-[#141b24]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#fcfbf9] border border-[#e2ded3] rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isInclude ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isInclude ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
          </span>
          <h3 className="text-base font-serif font-bold text-stone-900">
            {isInclude ? 'Include Paper in Review' : 'Exclude Paper from Review'}
          </h3>
        </div>

        {/* Paper Title reference */}
        <p className="text-xs text-stone-600 font-serif italic line-clamp-2 pl-9 mb-4">
          "{paper.title}"
        </p>

        {/* AI Guidance Snippet (if available) */}
        {paper.aiSuggestion && (
          <div className="mb-4 p-3 rounded-lg bg-[#f5f3ee] border border-dashed border-indigo-200 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-indigo-900 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Suggestion: {paper.aiSuggestion}</span>
            </div>
            {paper.aiReason && (
              <p className="text-stone-600 italic leading-relaxed text-[11px]">
                "{paper.aiReason}"
              </p>
            )}
          </div>
        )}

        {/* Reason Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Screening Decision Reason <span className="text-rose-600">*</span>
              </label>
              {paper.aiReason && (
                <button
                  type="button"
                  onClick={() => onReasonChange(paper.aiReason || '')}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Use AI reason</span>
                </button>
              )}
            </div>
            <textarea
              autoFocus
              rows={3}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all placeholder:text-stone-400"
              placeholder="State why this paper satisfies or fails the inclusion criteria..."
            />
            {error && <p className="text-rose-700 text-xs mt-1.5 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel (Esc)
            </button>

            <button
              type="submit"
              className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs ${
                isInclude
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {isInclude ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
              <span>Confirm {isInclude ? 'Inclusion' : 'Exclusion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

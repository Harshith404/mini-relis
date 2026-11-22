import React, { useEffect } from 'react'
import { X, SlidersHorizontal, Check } from 'lucide-react'
import type { ReviewSettings } from '../types'

interface Props {
  isOpen: boolean
  settings: ReviewSettings
  saving: boolean
  onChange: (field: keyof ReviewSettings, val: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function SettingsDrawer({
  isOpen,
  settings,
  saving,
  onChange,
  onSubmit,
  onClose,
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#141b24]/30 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-[#fcfbf9] border-l border-[#e2ded3] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#e8e5dc] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-stone-100 text-stone-800 flex items-center justify-center border border-stone-200">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">Review Protocol</h2>
              <p className="text-xs text-stone-500 font-sans">
                Topic and criteria guiding both human and AI screening
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Review Topic / Research Question
            </label>
            <textarea
              rows={2}
              required
              value={settings.topic}
              onChange={(e) => onChange('topic', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8d3c5] bg-white text-xs font-medium text-stone-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all font-serif"
              placeholder="e.g. Do AI coding assistants help developers work faster or write better code?"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              The AI evaluates candidate papers specifically against this research question.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">
              Inclusion Criteria (IC)
            </label>
            <textarea
              rows={4}
              required
              value={settings.inclusionCriteria}
              onChange={(e) => onChange('inclusionCriteria', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
              placeholder="Specify the empirical methodologies, tool categories, or outcome metrics required..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-rose-800 mb-1">
              Exclusion Criteria (EC)
            </label>
            <textarea
              rows={4}
              required
              value={settings.exclusionCriteria}
              onChange={(e) => onChange('exclusionCriteria', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all"
              placeholder="Specify out-of-scope technologies, non-empirical opinion pieces, or unrelated domains..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-teal-800 hover:bg-teal-900 text-white font-medium py-2.5 rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving protocol...' : 'Save Review Protocol'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

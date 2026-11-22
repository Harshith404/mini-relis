import React, { useEffect } from 'react'
import { X, Plus, BookPlus } from 'lucide-react'

interface FormData {
  title: string
  authors: string
  venue: string
  year: string
  abstract: string
}

interface Props {
  isOpen: boolean
  formData: FormData
  fieldErrors: Record<string, string>
  submitting: boolean
  onChange: (field: keyof FormData, val: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function AddPaperDrawer({
  isOpen,
  formData,
  fieldErrors,
  submitting,
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

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-[#fcfbf9] border-l border-[#e2ded3] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#e8e5dc] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
              <BookPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">Add Paper</h2>
              <p className="text-xs text-stone-500 font-sans">
                Insert a candidate paper into the screening pipeline
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
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all placeholder:text-stone-400 font-serif"
              placeholder="e.g. Empirical Analysis of AI Code Assistants"
            />
            {fieldErrors.title && (
              <p className="text-rose-700 text-xs mt-1 font-medium">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Authors <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.authors}
              onChange={(e) => onChange('authors', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all placeholder:text-stone-400"
              placeholder="e.g. Jane Doe, John Smith"
            />
            {fieldErrors.authors && (
              <p className="text-rose-700 text-xs mt-1 font-medium">{fieldErrors.authors}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Venue <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => onChange('venue', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all placeholder:text-stone-400"
                placeholder="e.g. ICSE, TSE"
              />
              {fieldErrors.venue && (
                <p className="text-rose-700 text-xs mt-1 font-medium">{fieldErrors.venue}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Year <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => onChange('year', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all placeholder:text-stone-400"
                placeholder="2024"
              />
              {fieldErrors.year && (
                <p className="text-rose-700 text-xs mt-1 font-medium">{fieldErrors.year}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Abstract <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={formData.abstract}
              onChange={(e) => onChange('abstract', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#d8d3c5] bg-white text-xs text-stone-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all placeholder:text-stone-400"
              placeholder="Paste the paper abstract here..."
            />
            {fieldErrors.abstract && (
              <p className="text-rose-700 text-xs mt-1 font-medium">{fieldErrors.abstract}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-800 hover:bg-teal-900 text-white font-medium py-2.5 rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving paper...' : 'Add Paper to Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

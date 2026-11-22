import { useState } from 'react'
import { Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { Paper, PaperStatus } from '../types'

interface Props {
  papers: Paper[]
  total: number
  limit: number
  offset: number
  statusFilter: 'ALL' | PaperStatus
  loading: boolean
  onFilterChange: (status: 'ALL' | PaperStatus) => void
  onOffsetChange: (offset: number) => void
  onOpenDecision: (paper: Paper, decision: 'INCLUDED' | 'EXCLUDED') => void
  onRequestAi: (paperId: string) => void
  onReRunAllAi: () => void
  requestingAi: Record<string, boolean>
  reRunningAll: boolean
}

export function AllPapersView({
  papers,
  total,
  limit,
  offset,
  statusFilter,
  loading,
  onFilterChange,
  onOffsetChange,
  onOpenDecision,
  onRequestAi,
  onReRunAllAi,
  requestingAi,
  reRunningAll,
}: Props) {
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({})

  function toggleReason(key: string) {
    setExpandedReasons((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredPapers =
    statusFilter === 'ALL' ? papers : papers.filter((p) => p.status === statusFilter)

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#e8e5dc] shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mr-2">
            Status:
          </span>
          {(['ALL', 'PENDING', 'INCLUDED', 'EXCLUDED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onFilterChange(status)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Bulk Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReRunAllAi}
            disabled={reRunningAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-[#f9f8fc] hover:bg-[#f1effa] text-indigo-900 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Re-run AI evaluation on all pending papers"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{reRunningAll ? 'Queuing AI...' : 'Re-run AI on pending'}</span>
          </button>
        </div>
      </div>

      {/* Main Container: Table for Desktop, Cards for Mobile */}
      <div className="bg-white rounded-xl border border-[#e8e5dc] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500 text-xs font-medium">
            Loading papers...
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            No papers match the current filter.
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on small screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f5f0] border-b border-[#e8e5dc] text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-5/12">Paper & Authors</th>
                    <th className="py-3 px-4 w-4/12">AI Suggestion</th>
                    <th className="py-3 px-4 w-2/12">Human Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2efe8]">
                  {filteredPapers.map((paper) => {
                    const isAiExpanded = expandedReasons[`ai_${paper.id}`]
                    const isHumanExpanded = expandedReasons[`human_${paper.id}`]

                    return (
                      <tr key={paper.id} className="hover:bg-[#faf9f6]/60 align-top transition-colors">
                        {/* Title, Authors, Abstract */}
                        <td className="py-3.5 px-4 space-y-1">
                          <p className="font-serif font-bold text-stone-900 text-sm leading-snug">
                            {paper.title}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {paper.authors} • <span className="font-medium text-stone-700">{paper.venue}</span> ({paper.year})
                          </p>
                          <p className="text-[11px] text-stone-600 leading-relaxed pt-1">
                            {paper.abstract}
                          </p>
                        </td>

                        {/* AI Suggestion (Dashed badge, sparkle icon) */}
                        <td className="py-3.5 px-4 space-y-1.5">
                          {paper.aiSuggestion === 'QUEUED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-dashed border-indigo-300 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                              AI analyzing...
                            </span>
                          ) : paper.aiSuggestion === 'INCLUDE' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-800 border border-dashed border-violet-300">
                                  <Sparkles className="w-3 h-3 text-violet-600" />
                                  <span>AI suggestion: INCLUDE</span>
                                </span>
                                {paper.status === 'PENDING' && (
                                  <button
                                    onClick={() => onRequestAi(paper.id)}
                                    disabled={requestingAi[paper.id]}
                                    className="text-[10px] text-stone-400 hover:text-indigo-600 underline cursor-pointer"
                                  >
                                    Re-run
                                  </button>
                                )}
                              </div>
                              {paper.aiReason && (
                                <div
                                  onClick={() => toggleReason(`ai_${paper.id}`)}
                                  className="cursor-pointer group bg-[#fbfaf8] p-2 rounded-lg border border-[#ede9df]"
                                >
                                  <p
                                    className={`text-[11px] text-stone-600 leading-relaxed italic ${
                                      isAiExpanded ? '' : 'line-clamp-2'
                                    }`}
                                  >
                                    "{paper.aiReason}"
                                  </p>
                                  {paper.aiReason.length > 100 && (
                                    <span className="text-[10px] text-teal-800 font-medium flex items-center gap-0.5 mt-0.5 group-hover:underline">
                                      {isAiExpanded ? (
                                        <>
                                          <span>Collapse</span>
                                          <ChevronUp className="w-3 h-3" />
                                        </>
                                      ) : (
                                        <>
                                          <span>Expand reason</span>
                                          <ChevronDown className="w-3 h-3" />
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : paper.aiSuggestion === 'EXCLUDE' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-800 border border-dashed border-orange-300">
                                  <Sparkles className="w-3 h-3 text-orange-600" />
                                  <span>AI suggestion: EXCLUDE</span>
                                </span>
                                {paper.status === 'PENDING' && (
                                  <button
                                    onClick={() => onRequestAi(paper.id)}
                                    disabled={requestingAi[paper.id]}
                                    className="text-[10px] text-stone-400 hover:text-indigo-600 underline cursor-pointer"
                                  >
                                    Re-run
                                  </button>
                                )}
                              </div>
                              {paper.aiReason && (
                                <div
                                  onClick={() => toggleReason(`ai_${paper.id}`)}
                                  className="cursor-pointer group bg-[#fbfaf8] p-2 rounded-lg border border-[#ede9df]"
                                >
                                  <p
                                    className={`text-[11px] text-stone-600 leading-relaxed italic ${
                                      isAiExpanded ? '' : 'line-clamp-2'
                                    }`}
                                  >
                                    "{paper.aiReason}"
                                  </p>
                                  {paper.aiReason.length > 100 && (
                                    <span className="text-[10px] text-teal-800 font-medium flex items-center gap-0.5 mt-0.5 group-hover:underline">
                                      {isAiExpanded ? (
                                        <>
                                          <span>Collapse</span>
                                          <ChevronUp className="w-3 h-3" />
                                        </>
                                      ) : (
                                        <>
                                          <span>Expand reason</span>
                                          <ChevronDown className="w-3 h-3" />
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : paper.aiSuggestion === 'FAILED' ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>AI Failed</span>
                              <button
                                onClick={() => onRequestAi(paper.id)}
                                className="text-[10px] underline ml-1 cursor-pointer"
                              >
                                Retry
                              </button>
                            </div>
                          ) : paper.status === 'PENDING' ? (
                            <button
                              onClick={() => onRequestAi(paper.id)}
                              disabled={requestingAi[paper.id]}
                              className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{requestingAi[paper.id] ? 'Queuing...' : 'Ask AI'}</span>
                            </button>
                          ) : (
                            <span className="text-stone-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* Human Status (Muted colors: Pending=gray, Included=green, Excluded=red) */}
                        <td className="py-3.5 px-4 space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              paper.status === 'INCLUDED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : paper.status === 'EXCLUDED'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}
                          >
                            {paper.status}
                          </span>
                          {paper.decisionReason && (
                            <div
                              onClick={() => toggleReason(`human_${paper.id}`)}
                              className="cursor-pointer group mt-1"
                            >
                              <p
                                className={`text-[11px] text-stone-600 italic leading-relaxed ${
                                  isHumanExpanded ? '' : 'line-clamp-2'
                                }`}
                              >
                                "{paper.decisionReason}"
                              </p>
                              {paper.decisionReason.length > 90 && (
                                <span className="text-[10px] text-teal-800 font-medium flex items-center gap-0.5 mt-0.5 group-hover:underline">
                                  {isHumanExpanded ? 'Less ▲' : 'More ▼'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => onOpenDecision(paper, 'INCLUDED')}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                            >
                              Include
                            </button>
                            <button
                              onClick={() => onOpenDecision(paper, 'EXCLUDED')}
                              className="px-2.5 py-1 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors cursor-pointer"
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

            {/* Mobile Stacked Cards View (visible on small screens) */}
            <div className="md:hidden divide-y divide-[#f2efe8]">
              {filteredPapers.map((paper) => (
                <div key={paper.id} className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-stone-900 text-sm leading-snug">
                        {paper.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          paper.status === 'INCLUDED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : paper.status === 'EXCLUDED'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {paper.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {paper.authors} • {paper.venue} ({paper.year})
                    </p>
                    <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                      {paper.abstract}
                    </p>
                  </div>

                  {/* AI Suggestion */}
                  {paper.aiSuggestion && (
                    <div className="p-2.5 rounded-lg border border-dashed border-indigo-200 bg-[#f9f8fc] text-xs">
                      <div className="flex items-center gap-1 font-semibold text-indigo-900 text-[11px]">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>AI Suggestion: {paper.aiSuggestion}</span>
                      </div>
                      {paper.aiReason && (
                        <p className="text-stone-600 italic text-[11px] mt-1">"{paper.aiReason}"</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onOpenDecision(paper, 'INCLUDED')}
                      className="flex-1 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200 text-center"
                    >
                      Include
                    </button>
                    <button
                      onClick={() => onOpenDecision(paper, 'EXCLUDED')}
                      className="flex-1 py-2 text-xs font-semibold text-rose-800 bg-rose-50 rounded-lg border border-rose-200 text-center"
                    >
                      Exclude
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {total > limit && (
              <div className="flex items-center justify-between px-4 py-3 bg-[#f7f5f0] border-t border-[#e8e5dc] text-xs">
                <button
                  disabled={offset === 0}
                  onClick={() => onOffsetChange(Math.max(0, offset - limit))}
                  className="px-3 py-1 bg-white border border-[#d8d3c5] rounded-md disabled:opacity-40 cursor-pointer font-medium text-stone-700 hover:bg-stone-50"
                >
                  Previous
                </button>
                <span className="text-stone-600">
                  Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
                </span>
                <button
                  disabled={offset + limit >= total}
                  onClick={() => onOffsetChange(offset + limit)}
                  className="px-3 py-1 bg-white border border-[#d8d3c5] rounded-md disabled:opacity-40 cursor-pointer font-medium text-stone-700 hover:bg-stone-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

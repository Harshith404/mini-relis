import type { ScreeningStats } from '../types'

interface Props {
  stats: ScreeningStats
}

export function StatsStrip({ stats }: Props) {
  return (
    <div className="bg-[#f7f5f0] border border-[#e8e5dc] rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Count Stats */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 text-sm">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
              Total Papers
            </span>
            <span className="text-xl font-semibold text-stone-900 tracking-tight">
              {stats.total}
            </span>
          </div>

          <div className="sm:border-l sm:border-[#e8e5dc] sm:pl-6">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
              Pending
            </span>
            <span className="text-xl font-semibold text-stone-600 tracking-tight">
              {stats.pending}
            </span>
          </div>

          <div className="sm:border-l sm:border-[#e8e5dc] sm:pl-6">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
              Included
            </span>
            <span className="text-xl font-semibold text-emerald-700 tracking-tight">
              {stats.included}
            </span>
          </div>

          <div className="sm:border-l sm:border-[#e8e5dc] sm:pl-6">
            <span className="text-[11px] uppercase tracking-wider text-rose-800 font-semibold block">
              Excluded
            </span>
            <span className="text-xl font-semibold text-rose-700 tracking-tight">
              {stats.excluded}
            </span>
          </div>
        </div>

        {/* Screening Progress */}
        <div className="sm:min-w-[220px] flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-stone-600">Screening Progress</span>
            <span className="text-stone-900 font-semibold">
              {stats.screened} of {stats.total} ({stats.percentage}%)
            </span>
          </div>
          <div className="w-full bg-[#ebe7dc] rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-700 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

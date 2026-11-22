export function FocusSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="bg-white border border-[#e8e5dc] rounded-2xl p-8 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-[#f0ede6]">
          <div className="h-4 bg-stone-200 rounded w-28" />
          <div className="h-6 bg-stone-200 rounded-full w-20" />
        </div>
        <div className="space-y-2">
          <div className="h-7 bg-stone-200 rounded w-4/5" />
          <div className="h-4 bg-stone-100 rounded w-1/2" />
        </div>
        <div className="h-24 bg-stone-100 rounded-xl" />
        <div className="h-16 bg-indigo-50/50 rounded-xl border border-dashed border-indigo-100" />
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#f0ede6]">
          <div className="h-11 bg-rose-50 rounded-xl" />
          <div className="h-11 bg-emerald-50 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

import { BookOpen, SlidersHorizontal, Plus, Eye, ListFilter } from 'lucide-react'

interface Props {
  currentTab: 'screen' | 'all'
  onTabChange: (tab: 'screen' | 'all') => void
  onOpenAddPaper: () => void
  onOpenSettings: () => void
}

export function Header({ currentTab, onTabChange, onOpenAddPaper, onOpenSettings }: Props) {
  return (
    <header className="border-b border-[#e8e5dc] pb-4 sm:pb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-800 text-[#fcfbf9] flex items-center justify-center font-serif text-lg font-bold shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#141b24]">
                mini-ReLiS
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                SLR Tool
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Systematic Literature Review Screening Assistant
            </p>
          </div>
        </div>

        {/* View Switcher & Slide-over Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Tabs */}
          <div className="bg-[#edeae2] p-1 rounded-lg flex items-center gap-1 border border-[#e2ded3]">
            <button
              onClick={() => onTabChange('screen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'screen'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-teal-800" />
              <span>Screen (Focus)</span>
            </button>

            <button
              onClick={() => onTabChange('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                currentTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-teal-800" />
              <span>All Papers</span>
            </button>
          </div>

          <div className="h-6 w-px bg-[#e8e5dc] hidden sm:block" />

          {/* Trigger Drawers */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2ded3] bg-[#fbfaf8] hover:bg-[#f2efe8] text-xs font-medium text-stone-700 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Settings</span>
          </button>

          <button
            onClick={onOpenAddPaper}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-[#fcfbf9] text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Paper</span>
          </button>
        </div>
      </div>
    </header>
  )
}

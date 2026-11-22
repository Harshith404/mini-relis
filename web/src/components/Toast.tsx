import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import type { ToastMessage } from '../types'

interface Props {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border text-sm shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-[#f7fdf9] border-emerald-200 text-emerald-900'
              : toast.type === 'error'
                ? 'bg-[#fdf7f7] border-rose-200 text-rose-900'
                : 'bg-[#f7faff] border-blue-200 text-blue-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          )}

          <p className="flex-1 text-xs leading-relaxed font-medium">{toast.text}</p>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

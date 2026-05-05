import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ToastContext } from './toastContext'

const DEFAULT_DURATION_MS = 4500

const getToastIcon = (type) => {
  if (type === 'success') return CheckCircle2
  if (type === 'error') return AlertTriangle
  return AlertTriangle
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const remove = useCallback((id) => {
    setToasts(prev => (Array.isArray(prev) ? prev : []).filter(item => item.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(id)
  }, [])

  const push = useCallback((toast) => {
    const nextToast = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      type: toast?.type || 'error',
      title: toast?.title || '',
      message: toast?.message || '',
      durationMs: Number.isFinite(toast?.durationMs) ? toast.durationMs : DEFAULT_DURATION_MS,
    }

    setToasts(prev => [nextToast, ...(Array.isArray(prev) ? prev : [])].slice(0, 4))

    const timer = setTimeout(() => remove(nextToast.id), nextToast.durationMs)
    timersRef.current.set(nextToast.id, timer)
    return nextToast.id
  }, [remove])

  const api = useMemo(() => ({
    push,
    remove,
    success: (message, opts = {}) => push({ ...opts, type: 'success', message }),
    error: (message, opts = {}) => push({ ...opts, type: 'error', message }),
  }), [push, remove])

  const portal = typeof document === 'undefined'
    ? null
    : createPortal(
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] w-full max-w-md space-y-2 px-4 sm:w-auto sm:px-0">
        {toasts.map((toast) => {
          const Icon = getToastIcon(toast.type)
          const isSuccess = toast.type === 'success'
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md ${
                isSuccess
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-50'
                  : 'border-rose-400/30 bg-rose-400/10 text-rose-50'
              }`}
              role="status"
              aria-live="polite"
            >
              <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                isSuccess ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'
              }`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <p className="truncate text-[13px] font-semibold">{toast.title}</p>
                )}
                {toast.message && (
                  <p className={`mt-0.5 text-[12px] ${toast.title ? 'text-white/85' : 'text-white/90'}`}>
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close notification"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>,
      document.body
    )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {portal}
    </ToastContext.Provider>
  )
}

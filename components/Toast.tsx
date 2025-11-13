'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
}

export default function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />
  }

  const styles = {
    success: 'bg-green-50 border-green-500 text-green-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    info: 'bg-blue-50 border-blue-500 text-blue-900'
  }

  return (
    <div
      className={`flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-lg border-l-4 shadow-lg animate-slide-in ${styles[type]}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  )
}

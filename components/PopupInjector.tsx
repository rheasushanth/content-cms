'use client'
import { useEffect, useState } from 'react'

interface DisplayRules {
  delay?: number
  pages?: string[]
  trigger?: 'on-load' | 'exit-intent'
  frequency?: 'once-per-session' | 'always' | 'once-per-user' | 'once-per-page'
}

interface PopupData {
  id: string
  name: string
  template_type: string
  html_content: string
  display_rules?: DisplayRules
  is_active?: boolean
}

export default function PopupInjector() {
  const [popup, setPopup] = useState<PopupData | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let exitIntentBound = false

    const fetchPopups = async () => {
      try {
        const apiKey = (window as any).POPUP_API_KEY
        if (!apiKey) return

        const res = await fetch(`/api/public/popups?key=${apiKey}`, { cache: 'no-store' })
        if (!res.ok) return
        const { popups } = await res.json()
        if (!Array.isArray(popups)) return

        const match = popups.find((p: PopupData) => matchRules(p.display_rules))
        if (match) {
          setPopup(match)
          setupTrigger(match.display_rules)
        }
      } catch {}
    }

    const matchRules = (rules?: DisplayRules) => {
      if (!rules) return true
      const path = window.location.pathname
      const pages = rules.pages || ['all']
      if (pages.includes('all')) return true
      return pages.some(pattern => {
        if (pattern === '*') return true
        if (pattern.endsWith('*')) return path.startsWith(pattern.slice(0, -1))
        return path === pattern
      })
    }

    const setupTrigger = (rules?: DisplayRules) => {
      const delayMs = Math.max(0, (rules?.delay || 0)) * 1000
      const trigger = rules?.trigger || 'on-load'
      if (trigger === 'on-load') {
        setTimeout(() => maybeShow(rules), delayMs)
      } else if (trigger === 'exit-intent' && !exitIntentBound) {
        exitIntentBound = true
        const handler = (e: MouseEvent) => {
          if (e.clientY < 10) {
            maybeShow(rules)
            document.removeEventListener('mousemove', handler)
          }
        }
        document.addEventListener('mousemove', handler)
      }
    }

    const maybeShow = (rules?: DisplayRules) => {
      if (!popup) return
      const frequency = rules?.frequency || 'once-per-session'
      const baseKey = `popup_${popup.id}`
      if (frequency === 'always') {
        setVisible(true)
        return
      }
      if (frequency === 'once-per-user') {
        if (localStorage.getItem(baseKey + '_user_shown')) return
        localStorage.setItem(baseKey + '_user_shown', '1')
        setVisible(true)
        return
      }
      if (frequency === 'once-per-page') {
        const pageKey = baseKey + '_' + window.location.pathname + '_page_shown'
        if (sessionStorage.getItem(pageKey)) return
        sessionStorage.setItem(pageKey, '1')
        setVisible(true)
        return
      }

      const sessionKey = baseKey + '_session_shown'
      if (sessionStorage.getItem(sessionKey)) return
      sessionStorage.setItem(sessionKey, '1')
      setVisible(true)
    }

    fetchPopups()
  }, [popup])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setVisible(false) }
    if (visible) window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [visible])

  if (!popup || !visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 animate-overlay" onClick={() => setVisible(false)} />
      <div className="relative bg-white shadow-2xl rounded-2xl max-w-lg w-full p-7 animate-popup border border-gray-200">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close popup"
        >
          <span className="text-xl leading-none">×</span>
        </button>
        <div className="prose prose-black max-w-none text-black" dangerouslySetInnerHTML={{ __html: popup.html_content }} />
      </div>
      <style jsx>{`
        .animate-overlay { animation: overlay-fade .35s ease forwards; }
        @keyframes overlay-fade { from { opacity:0 } to { opacity:1 } }
        .animate-popup { animation: popup-in .35s cubic-bezier(.16,.8,.26,1); }
        @keyframes popup-in { 0% { opacity:0; transform: translateY(12px) scale(.96); } 100% { opacity:1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}

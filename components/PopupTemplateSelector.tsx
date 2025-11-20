"use client"
import { useState } from 'react'

interface PopupTemplateSelectorProps {
  value: string
  onChange: (val: string) => void
  templates: Record<string,string>
}

export default function PopupTemplateSelector({ value, onChange, templates }: PopupTemplateSelectorProps) {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(templates).map(([key, html]) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            onMouseEnter={() => setHover(key)}
            onMouseLeave={() => setHover(null)}
            className={`group relative rounded-xl border p-4 text-left transition shadow-sm hover:shadow-md ${active ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm capitalize">{key.replace(/-/g,' ')}</h3>
              {active && <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white">Selected</span>}
            </div>
            <div className="overflow-hidden rounded-lg border bg-white h-32 p-3 text-xs leading-snug" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-blue-300 pointer-events-none" />
            {hover === key && !active && <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-xl flex items-center justify-center text-xs font-medium">Click to select</div>}
          </button>
        )
      })}
    </div>
  )
}

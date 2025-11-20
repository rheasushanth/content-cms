"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, Sparkles, ArrowLeft } from 'lucide-react'

const templates: Record<string, string> = {
  'email-capture': `<h2>Stay Updated!</h2><p>Enter your email to receive our latest news and updates.</p><form><input type="email" placeholder="Your email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#2563eb;color:#fff;padding:8px 12px;border-radius:4px">Subscribe</button></form>`,
  'discount': `<h2>Get 10% Off</h2><p>Join our list and receive an instant discount code.</p><form><input type="email" placeholder="Email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#dc2626;color:#fff;padding:8px 12px;border-radius:4px">Claim Discount</button></form>`,
  'newsletter': `<h2>Join Our Newsletter</h2><p>Weekly tips & insights. No spam.</p><form><input type="email" placeholder="Email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#16a34a;color:#fff;padding:8px 12px;border-radius:4px">Join Now</button></form>`,
  'announcement': `<h2>Important Update</h2><p>We have launched a new feature! 🎉</p>`,
  'exit-intent': `<h2>Wait!</h2><p>Before you go, grab our free guide.</p><form><input type="email" placeholder="Email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#7c3aed;color:#fff;padding:8px 12px;border-radius:4px">Get Guide</button></form>`,
  'custom': `<h2>Custom Popup</h2><p>Edit this content freely.</p>`
}

const templateInfo: Record<string, { title: string; description: string; icon: string }> = {
  'discount': { title: '10% Off', description: 'Email Discount', icon: '🎫' },
  'newsletter': { title: 'Subscribe', description: 'Newsletter Signup', icon: '📰' },
  'announcement': { title: 'Special Offer', description: 'Promotional Banner', icon: '🎉' },
  'exit-intent': { title: 'Wait!', description: 'Exit Intent Offer', icon: '⚠️' },
  'email-capture': { title: 'Newsletter', description: 'Email Capture', icon: '📧' },
  'custom': { title: 'Feedback', description: 'Custom Popup', icon: '📊' }
}

export default function PopupsPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'rules' | 'templates'>('edit')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showBrowseTemplates, setShowBrowseTemplates] = useState(false)
  
  const [name, setName] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [templateType, setTemplateType] = useState('')
  const [active, setActive] = useState(true)
  const [rules, setRules] = useState({
    trigger: 'on-load' as 'on-load' | 'exit-intent',
    pages: ['all'],
    delay: 2,
    frequency: 'once-per-session' as 'once-per-session' | 'always' | 'once-per-user' | 'once-per-page'
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const res = await fetch('/api/popups', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setItems(data.popups || [])
      }
    }
    init()
  }, [router])

  const loadPopup = async (id: string) => {
    const res = await fetch(`/api/popups/${id}`)
    if (res.ok) {
      const data = await res.json()
      const p = data.popup
      setSelectedId(id)
      setName(p.name)
      setTemplateType(p.template_type)
      setHtmlContent(p.html_content)
      setActive(p.is_active)
      setRules({
        trigger: p.display_rules?.trigger || 'on-load',
        pages: p.display_rules?.pages || ['all'],
        delay: p.display_rules?.delay || 0,
        frequency: p.display_rules?.frequency || 'once-per-session'
      })
      setActiveTab('edit')
    }
  }

  const createNew = async () => {
    // Create a new popup with default values
    const payload = {
      name: 'New Popup',
      template_type: 'custom',
      html_content: '<h2>Custom Popup</h2><p>Edit this content freely.</p>',
      is_active: false,
      display_rules: {
        trigger: 'on-load',
        pages: ['all'],
        delay: 0,
        frequency: 'once-per-session'
      }
    }
    
    const res = await fetch('/api/popups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
    
    if (res.ok) {
      const data = await res.json()
      const newId = data.popup.id
      
      // Refresh the list
      const updatedRes = await fetch('/api/popups', { credentials: 'include' })
      if (updatedRes.ok) {
        const listData = await updatedRes.json()
        setItems(listData.popups || [])
        // Select the new popup
        loadPopup(newId)
      }
    } else {
      alert('Failed to create popup')
    }
  }

  const save = async () => {
    if (!selectedId) return
    setSaving(true)
    const payload = {
      name,
      template_type: templateType,
      html_content: htmlContent,
      is_active: active,
      display_rules: rules
    }
    const res = await fetch(`/api/popups/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    })
    setSaving(false)
    if (res.ok) {
      const updatedRes = await fetch('/api/popups', { credentials: 'include' })
      if (updatedRes.ok) {
        const data = await updatedRes.json()
        setItems(data.popups || [])
      }
      alert('Saved successfully!')
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data?.error ? JSON.stringify(data.error) : 'Failed to save')
    }
  }

  const deletePopup = async (id: string) => {
    if (!confirm('Delete this popup?')) return
    const res = await fetch(`/api/popups/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      setItems(items.filter(p => p.id !== id))
      if (selectedId === id) {
        setSelectedId(null)
      }
    }
  }

  const selected = items.find(p => p.id === selectedId)

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Sidebar - Popup List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Create Popup</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Your Popups <span className="ml-2 bg-black text-white text-xs rounded-full px-2 py-0.5">{items.length}</span></h2>
          </div>

          <div className="space-y-2">
            {items.map((p: any) => (
              <div
                key={p.id}
                onClick={() => loadPopup(p.id)}
                className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedId === p.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{p.display_rules?.trigger === 'exit-intent' ? 'delay' : 'immediate'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePopup(p.id) }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded transition-opacity"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={createNew}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus size={20} /> New Popup
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Popup Selected</h3>
              <p className="text-gray-600 mb-8">Select a popup from the list or create a new one to get started</p>
              <div className="flex gap-3 justify-center">
                <button onClick={createNew} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                   Create Blank Popup
                </button>
                <button onClick={() => setShowBrowseTemplates(true)} className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                   Browse Templates
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'edit' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                   Edit
                </button>
                <button
                  onClick={() => setActiveTab('rules')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'rules' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                   Rules
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'templates' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Templates
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  👁️ {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-8 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? '💾 Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8" onClick={() => setShowPreview(false)}>
                <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              {activeTab === 'edit' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                    <h3 className="text-xl font-bold mb-6">Edit Popup Content</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Popup Name</label>
                        <input
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Enter popup name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">HTML Content</label>
                        <textarea
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[300px]"
                          value={htmlContent}
                          onChange={e => setHtmlContent(e.target.value)}
                          placeholder="Enter HTML content..."
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={e => setActive(e.target.checked)}
                          className="h-5 w-5 rounded accent-blue-600"
                        />
                        <span className="text-base text-gray-800 font-semibold">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                    <h3 className="text-xl font-bold mb-6">Preview</h3>
                    <div className="border-2 border-gray-300 rounded-lg bg-white p-6 min-h-[200px]" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  </div>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
                    <h3 className="text-xl font-bold mb-6">Display Rules</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Trigger</label>
                        <select
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                          value={rules.trigger}
                          onChange={e => setRules(r => ({ ...r, trigger: e.target.value as any }))}
                        >
                          <option value="on-load">On Load</option>
                          <option value="exit-intent">Exit Intent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Delay (seconds)</label>
                        <input
                          type="number"
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                          value={rules.delay}
                          onChange={e => setRules(r => ({ ...r, delay: parseInt(e.target.value || '0', 10) }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pages</label>
                        <input
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                          value={rules.pages.join(',')}
                          onChange={e => setRules(r => ({ ...r, pages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                          placeholder="all, /blog/*, /pricing"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Frequency</label>
                        <select
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                          value={rules.frequency}
                          onChange={e => setRules(r => ({ ...r, frequency: e.target.value as any }))}
                        >
                          <option value="once-per-session">🔂 Once per session</option>
                          <option value="always">♾️ Always</option>
                          <option value="once-per-user"> Once per user</option>
                          <option value="once-per-page"> Once per page</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">Get Started with Templates</h3>
                    <p className="text-gray-600">Choose from professionally designed popup templates</p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.keys(templates).map(key => {
                      const info = templateInfo[key] || { title: key, description: 'Template', icon: '📄' }
                      return (
                        <div
                          key={key}
                          onClick={() => {
                            setTemplateType(key)
                            setHtmlContent(templates[key])
                            setActiveTab('edit')
                          }}
                          className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <div className="text-4xl mb-3">{info.icon}</div>
                          <h4 className="text-lg font-bold mb-1">{info.title}</h4>
                          <p className="text-sm text-gray-600 mb-4">{info.description}</p>
                          <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                            Use Template
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Browse Templates Modal */}
      {showBrowseTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8" onClick={() => setShowBrowseTemplates(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-1">Get Started with Templates</h3>
                <p className="text-gray-600">Choose from professionally designed popup templates</p>
              </div>
              <button
                onClick={() => setShowBrowseTemplates(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.keys(templates).map(key => {
                  const info = templateInfo[key] || { title: key, description: 'Template', icon: '📄' }
                  return (
                    <div
                      key={key}
                      onClick={async () => {
                        // Create new popup with this template
                        const payload = {
                          name: info.title,
                          template_type: key,
                          html_content: templates[key],
                          is_active: false,
                          display_rules: {
                            trigger: 'on-load',
                            pages: ['all'],
                            delay: 0,
                            frequency: 'once-per-session'
                          }
                        }
                        
                        const res = await fetch('/api/popups', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload),
                          credentials: 'include'
                        })
                        
                        if (res.ok) {
                          const data = await res.json()
                          const newId = data.popup.id
                          
                          // Refresh the list
                          const updatedRes = await fetch('/api/popups', { credentials: 'include' })
                          if (updatedRes.ok) {
                            const listData = await updatedRes.json()
                            setItems(listData.popups || [])
                            // Select and load the new popup
                            loadPopup(newId)
                            setShowBrowseTemplates(false)
                          }
                        }
                      }}
                      className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="text-4xl mb-3">{info.icon}</div>
                      <h4 className="text-lg font-bold mb-1">{info.title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{info.description}</p>
                      <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                        Use Template
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

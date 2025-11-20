'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import RichTextEditor from '@/components/RichTextEditor'
import PopupTemplateSelector from '@/components/PopupTemplateSelector'
import MobileNav from '@/components/MobileNav'
import Link from 'next/link'
import { Home, FolderOpen, KeyRound, User, Book, Megaphone, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Reuse template presets for quick switching
const templates: Record<string,string> = {
  'email-capture': `<h2>Stay Updated!</h2><p>Enter your email to receive our latest news and updates.</p><form><input type="email" placeholder="Your email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#2563eb;color:#fff;padding:8px 12px;border-radius:4px">Subscribe</button></form>`,
  'discount': `<h2>Get 10% Off</h2><p>Join our list and receive an instant discount code.</p><form><input type="email" placeholder="Email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#dc2626;color:#fff;padding:8px 12px;border-radius:4px">Claim Discount</button></form>`,
  'newsletter': `<h2>Join Our Newsletter</h2><p>Weekly tips & insights. No spam.</p><form><input type="email" placeholder="Email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#16a34a;color:#fff;padding:8px 12px;border-radius:4px">Join Now</button></form>`,
  'announcement': `<h2>Important Update</h2><p>We have launched a new feature! 🎉</p>`,
  'exit-intent': `<h2>Wait!</h2><p>Before you go, grab our free guide.</p><form><input type="email" placeholder="Email" style="padding:8px;width:100%;margin-bottom:8px"/><button type="submit" style="background:#7c3aed;color:#fff;padding:8px 12px;border-radius:4px">Get Guide</button></form>`,
  'custom': `<h2>Custom Popup</h2><p>Edit this content freely.</p>`
}

interface PopupResp {
  popup: {
    id: string
    name: string
    template_type: string
    html_content: string
    display_rules?: {
      trigger?: 'on-load' | 'exit-intent'
      pages?: string[]
      delay?: number
      frequency?: 'once-per-session' | 'always' | 'once-per-user' | 'once-per-page'
    }
    is_active: boolean
  }
}

export default function EditPopupPage() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams() as { id: string }
  const id = params.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [templateType, setTemplateType] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [active, setActive] = useState(true)
  const [rules, setRules] = useState({
    trigger: 'on-load' as 'on-load' | 'exit-intent',
    pages: [] as string[],
    delay: 0,
    frequency: 'once-per-session' as 'once-per-session' | 'always' | 'once-per-user' | 'once-per-page'
  })

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/popups/${id}`)
      if (res.ok) {
        const data: PopupResp = await res.json()
        const p = data.popup
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
      }
      setLoading(false)
    }
    load()
  }, [id])

  const save = async () => {
    setSaving(true)
    const payload = {
      name,
      template_type: templateType,
      html_content: htmlContent,
      is_active: active,
      display_rules: {
        trigger: rules.trigger,
        pages: rules.pages,
        delay: rules.delay,
        frequency: rules.frequency
      }
    }
    const res = await fetch(`/api/popups/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' })
    setSaving(false)
    if (res.ok) router.push('/dashboard')
    else {
      const data = await res.json().catch(() => ({}))
      alert(data?.error ? JSON.stringify(data.error) : 'Failed to save popup')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <MobileNav currentPath={pathname || ''} onLogout={handleLogout} />
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">CMS Tool</h1>
        </div>
        <nav className="flex-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"><Home size={20} /><span>Dashboard</span></Link>
          <Link href="/dashboard/collections" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"><FolderOpen size={20} /><span>Collections</span></Link>
          <Link href="/dashboard/popups" className="flex items-center gap-3 px-4 py-3 text-gray-900 bg-blue-50 rounded-lg mb-2"><Megaphone size={20} /><span className="font-medium">Popups</span></Link>
          <Link href="/dashboard/api-keys" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"><KeyRound size={20} /><span>API Keys</span></Link>
          <Link href="/docs" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"><Book size={20} /><span>API Docs</span></Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"><User size={20} /><span>Settings</span></Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg w-full"><LogOut size={20} /><span>Logout</span></button>
        </div>
      </div>
      <div className="flex-1 p-6 md:p-12">
        <div className="space-y-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">✏️ Edit Popup</h1>
            <button disabled={saving} onClick={save} className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg md:text-xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">{saving ? '⏳ Saving...' : '💾 Save Changes'}</button>
          </div>
          <div className="grid gap-12 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-10 space-y-7 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">📝 Details</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">Name</label>
                <input className="w-full border-2 border-gray-300 rounded-lg px-5 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={name} onChange={e => setName(e.target.value)} placeholder="Enter popup name" />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">Template Type</label>
                <input className="w-full border-2 border-gray-300 rounded-lg px-5 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={templateType} onChange={e => setTemplateType(e.target.value)} placeholder="Template type" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-6 w-6 rounded accent-blue-600" />
              <span className="text-base text-gray-800 font-semibold">Active</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-10 space-y-7 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">🎨 Templates</h2>
              <span className="text-base text-gray-600 font-medium">Click a card to apply</span>
            </div>
            <PopupTemplateSelector value={templateType} onChange={v => { setTemplateType(v); setHtmlContent(v in templates ? (templates as any)[v] : htmlContent) }} templates={templates as any} />
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-10 space-y-7 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">✍️ Content</h2>
            <RichTextEditor value={htmlContent} onChange={setHtmlContent} placeholder="Popup content..." />
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-10 space-y-7 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">⚙️ Display Rules</h2>
            <div className="grid gap-7 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Trigger</label>
                <select className="w-full border-2 border-gray-300 rounded-lg px-5 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={rules.trigger} onChange={e => setRules(r => ({ ...r, trigger: e.target.value as any }))}>
                  <option value="on-load">🚀 On Load</option>
                  <option value="exit-intent">🚪 Exit Intent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pages</label>
                <input className="w-full border-2 border-gray-300 rounded-lg px-5 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={rules.pages.join(',')} onChange={e => setRules(r => ({ ...r, pages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="e.g. /pricing,/blog/* or all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Delay (sec)</label>
                <input type="number" className="w-full border-2 border-gray-300 rounded-lg px-5 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={rules.delay} onChange={e => setRules(r => ({ ...r, delay: parseInt(e.target.value || '0', 10) }))} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Frequency</label>
                <select className="w-full border-2 border-gray-300 rounded-lg px-5 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" value={rules.frequency} onChange={e => setRules(r => ({ ...r, frequency: e.target.value as any }))}>
                  <option value="once-per-session">🔂 Once per session</option>
                  <option value="always">♾️ Always</option>
                  <option value="once-per-user">👤 Once per user</option>
                  <option value="once-per-page">📄 Once per page</option>
                </select>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 p-5 text-base text-blue-900 leading-relaxed shadow-sm">💡 <strong className="font-bold">Pro Tip:</strong> Adjust rules to refine audience targeting. Use <code className="bg-blue-200 px-2 py-1 rounded font-mono text-sm">all</code> or patterns like <code className="bg-blue-200 px-2 py-1 rounded font-mono text-sm">/blog/*</code>.</div>
          </div>
        </div>
        <div className="space-y-8">
            <div className="sticky top-6 space-y-6">
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-8 shadow-xl">
                <h2 className="text-xl font-extrabold text-gray-900 mb-5 flex items-center gap-2">👁️ Live Preview</h2>
                <div className="relative">
                  <div className="rounded-xl border-2 border-gray-300 bg-white p-6 min-h-[200px] text-base shadow-inner" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 font-semibold">Trigger: {rules.trigger}</div>
                    <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 font-semibold">Delay: {rules.delay}s</div>
                    <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 col-span-2 font-semibold">Pages: {rules.pages.join(',') || 'all'}</div>
                    <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 col-span-2 font-semibold">Frequency: {rules.frequency}</div>
                  </div>
                </div>
              </div>
            </div>
        </div>
        </div>
      </div>
    </div>
    </div>
  )
}

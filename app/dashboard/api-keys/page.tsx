'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MobileNav from '@/components/MobileNav'
import { Home, FolderOpen, KeyRound, Plus, Trash2, LogOut, Copy, Check } from 'lucide-react'

type ApiKeyRow = {
  id: string
  description: string
  scopes: string[]
  active: boolean
  created_at: string
  expires_at: string | null
}

export default function ApiKeysPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [creating, setCreating] = useState(false)
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [apiKeyPlain, setApiKeyPlain] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const availableScopes = useMemo(() => ['read:collections', 'read:popups'], [])
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:collections', 'read:popups'])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await fetchKeys()
      setLoading(false)
    }
    init()
  }, [router])

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load API keys')
      const data = await res.json()
      setKeys(data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setApiKeyPlain(null)
    setCopied(false)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          description: description || 'No description',
          scopes: selectedScopes,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }
      setApiKeyPlain(data.api_key || null)
      await fetchKeys()
      setDescription('')
      setExpiresAt('')
      setSelectedScopes(['read:collections', 'read:popups'])
    } catch (e: any) {
      alert(e.message || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean, descriptionText: string) => {
    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !active, description: descriptionText })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update key')
      await fetchKeys()
    } catch (e: any) {
      alert(e.message || 'Failed to update key')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete key')
      await fetchKeys()
    } catch (e: any) {
      alert(e.message || 'Failed to delete key')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const copyPlainKey = async () => {
    if (!apiKeyPlain) return
    await navigator.clipboard.writeText(apiKeyPlain)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Navigation */}
      <MobileNav currentPath={pathname || ''} onLogout={handleLogout} />

      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">CMS Tool</h1>
        </div>

        <nav className="flex-1 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
          >
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link
            href="/dashboard/collections"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
          >
            <FolderOpen size={20} />
            <span>Collections</span>
          </Link>

          <Link
            href="/dashboard/api-keys"
            className="flex items-center gap-3 px-4 py-3 text-gray-900 bg-blue-50 rounded-lg"
          >
            <KeyRound size={20} />
            <span className="font-medium">API Keys</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Create Key */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Create API Key</h2>
            </div>

            {apiKeyPlain && (
              <div className="mb-4 p-4 border rounded-md bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800 mb-2">
                  This is your API key. You will not be able to see it again. Copy and store it securely.
                </p>
                <div className="flex items-center justify-between gap-2 bg-white border rounded px-3 py-2">
                  <code className="text-xs md:text-sm break-all">{apiKeyPlain}</code>
                  <button
                    onClick={copyPlainKey}
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Read-only key for blog"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scopes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableScopes.map((scope) => {
                      const checked = selectedScopes.includes(scope)
                      return (
                        <label key={scope} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(new Set([...selectedScopes, scope]))
                                : selectedScopes.filter(s => s !== scope)
                              setSelectedScopes(next)
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{scope}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry (optional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank for no expiry.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  {creating ? 'Creating…' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>

          {/* Keys Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your API Keys</h2>
              <p className="text-sm text-gray-600">Keys are hashed in the database; only metadata is shown here.</p>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scopes</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 md:px-6 py-8 text-center text-sm text-gray-500">
                        No API keys yet. Create one above to get started.
                      </td>
                    </tr>
                  ) : keys.map((k) => {
                    const created = new Date(k.created_at).toLocaleDateString()
                    const expiry = k.expires_at ? new Date(k.expires_at).toLocaleDateString() : '—'
                    return (
                      <tr key={k.id} className="hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{k.description}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-wrap gap-1">
                            {(k.scopes || []).map(scope => (
                              <span key={scope} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{scope}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{created}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expiry}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${k.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {k.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => handleToggleActive(k.id, k.active, k.description)}
                              className="px-3 py-2 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              {k.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, FolderOpen, LogOut, Plus, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CollectionItemsPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [publishInFlight, setPublishInFlight] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      await fetchCollection()
      await fetchItems()
      setLoading(false)
    }

    checkUser()
  }, [router, collectionId])

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setCollection(data.collection || data.data)
      } else {
        console.error('Failed to fetch collection:', response.status)
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      } else {
        console.error('Failed to fetch items:', response.status)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        // Remove item from local state
        setItems(items.filter(item => item.id !== itemId))
        alert('Item deleted successfully!')
      } else {
        throw new Error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item. Please try again.')
    }
  }

  const handleTogglePublish = async (itemId: string, isPublished: boolean) => {
    const itemToUpdate = items.find((item) => item.id === itemId)
    if (!itemToUpdate) return

    setPublishInFlight(itemId)

    try {
      const response = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          data: itemToUpdate.data || {},
          published: !isPublished
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update publish status')
      }

      const updated = await response.json()
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? updated.item ?? item : item))
      )
    } catch (error) {
      console.error('Error updating publish status:', error)
      alert('Failed to update publish status. Please try again.')
    } finally {
      setPublishInFlight(null)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
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
            className="flex items-center gap-3 px-4 py-3 text-gray-900 bg-blue-50 rounded-lg"
          >
            <FolderOpen size={20} />
            <span className="font-medium">Collections</span>
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/collections"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to Collections</span>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {collection?.schema?.title || 'Collection Items'}
                </h1>
                <p className="text-gray-600">
                  {collection?.schema?.description || 'Manage your collection items'}
                </p>
              </div>
              <Link
                href={`/dashboard/collections/${collectionId}/new`}
                className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm md:text-base"
              >
                <Plus size={20} />
                <span className="font-medium">Add New Item</span>
              </Link>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </h2>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => {
                      const title = item.data?.title || item.data?.name || `Item ${item.id}`
                      const created = new Date(item.created_at).toLocaleDateString()
                      const previewFields = Object.entries(item.data || {}).slice(0, 2)
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{title}</div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{created}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.published
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-600 space-y-1">
                              {previewFields.map(([key, value]) => (
                                <div key={key} className="truncate max-w-[200px]">
                                  <span className="font-medium capitalize">{key}:</span>{' '}
                                  <span>
                                    {typeof value === 'string' && value.length > 60
                                      ? `${value.substring(0, 60)}...`
                                      : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Link
                                href={`/dashboard/collections/${collectionId}/items/${item.id}/edit`}
                                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                <span>Edit</span>
                              </Link>
                              <button
                                onClick={() => handleTogglePublish(item.id, item.published)}
                                disabled={publishInFlight === item.id}
                                className="px-3 py-2 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
                              >
                                {publishInFlight === item.id ? 'Updating…' : item.published ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                Delete
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
          ) : (
            // Empty State
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <FolderOpen className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Items Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first item in this collection
                </p>
                <Link
                  href={`/dashboard/collections/${collectionId}/new`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus size={20} />
                  <span className="font-medium">Create Your First Item</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, FolderOpen, LogOut, Plus, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'

export default function CollectionsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [collections, setCollections] = useState<any[]>([])
  const [collectionStats, setCollectionStats] = useState<Record<string, { count: number; published: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      await fetchCollections()
      setLoading(false)
    }

    checkUser()
  }, [router])

  const fetchCollections = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      // Fetch collections from your API
      const response = await fetch('/api/collections', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })
      
      if (response.ok) {
        const data = await response.json()
        const allCollections = data.collections || []
        
        // Group collections by schema_id to get unique collections
        // Keep only the container collection (the one with empty or minimal data) for each schema
        const uniqueCollections: any[] = []
        const schemaMap = new Map<string, any>()
        
        allCollections.forEach((collection: any) => {
          const schemaId = collection.schema_id
          if (!schemaId) return // Skip if no schema_id
          
          if (!schemaMap.has(schemaId)) {
            // First collection for this schema - keep it
            schemaMap.set(schemaId, collection)
            uniqueCollections.push(collection)
          } else {
            // We already have a collection for this schema
            // Prefer the one with empty data (the container) over items with data
            const existing = schemaMap.get(schemaId)
            const existingDataSize = Object.keys(existing.data || {}).length
            const currentDataSize = Object.keys(collection.data || {}).length
            
            // If current collection has less data (more likely to be the container), replace it
            if (currentDataSize < existingDataSize) {
              // Replace in the map
              schemaMap.set(schemaId, collection)
              // Replace in the array
              const index = uniqueCollections.findIndex(c => c.id === existing.id)
              if (index !== -1) {
                uniqueCollections[index] = collection
              }
            }
          }
        })
        
        setCollections(uniqueCollections)
        
        // Fetch item counts for each collection
        const stats: Record<string, { count: number; published: number }> = {}
        for (const collection of uniqueCollections) {
          try {
            const itemsResponse = await fetch(`/api/collections/${collection.id}/items`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            })
            
            if (itemsResponse.ok) {
              const itemsData = await itemsResponse.json()
              const items = itemsData.items || []
              stats[collection.id] = {
                count: items.length,
                published: items.filter((item: any) => item.published).length
              }
            } else {
              stats[collection.id] = { count: 0, published: 0 }
            }
          } catch (error) {
            stats[collection.id] = { count: 0, published: 0 }
          }
        }
        
        setCollectionStats(stats)
      } else {
        console.error('Failed to fetch collections:', response.status)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  const handleDeleteCollection = async (collectionId: string, schemaId?: string) => {
    if (!confirm('Are you sure you want to delete this collection? This will delete all items in this collection and cannot be undone.')) {
      return
    }

    try {
      // Delete all items (collections with the same schema_id)
      const itemsResponse = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        const items = itemsData.items || []
        
        // Delete all items
        for (const item of items) {
          await fetch(`/api/collections/${collectionId}/items/${item.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          })
        }
      }

      // Delete the collection container
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (response.ok) {
        // Delete the schema as well if schemaId exists
        if (schemaId) {
          try {
            await fetch(`/api/schemas/${schemaId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            })
          } catch (error) {
            console.error('Error deleting schema:', error)
          }
        }

        // Refresh the collections list
        await fetchCollections()
        alert('Collection deleted successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete collection')
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert(`Failed to delete collection: ${error instanceof Error ? error.message : 'Please try again.'}`)
    }
  }

  const handleEditCollection = (collectionId: string) => {
    // Navigate to the collection items page where user can manage items
    router.push(`/dashboard/collections/${collectionId}`)
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Collections</h1>
              <p className="text-gray-600 text-sm md:text-base">Manage your content collections</p>
            </div>
            <Link
              href="/dashboard/collections/new"
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm md:text-base w-full sm:w-auto"
            >
              <Plus size={20} />
              <span className="font-medium">Create Collection</span>
            </Link>
          </div>

          {/* Collections Grid */}
          {collections.length > 0 ? (
            <div className="grid gap-6">
              {collections.map((collection) => (
                <div key={collection.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {collection.schema?.title || 'Unnamed Collection'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {collection.schema?.description || 'No description'}
                      </p>
                    </div>
                    <FolderOpen className="text-gray-400" size={24} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {collectionStats[collection.id]?.count || 0} items • {collectionStats[collection.id]?.published || 0} published
                      </span>
                      {collection.schema?.title && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {collection.schema.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/collections/${collection.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
                      >
                        <Eye size={16} />
                        <span>View Items</span>
                      </Link>
                      <button 
                        onClick={() => handleEditCollection(collection.id)}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        title="Edit Collection"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCollection(collection.id, collection.schema_id)}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Collection"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <FolderOpen className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Collections Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first collection to get started managing content
                </p>
                <Link
                  href="/dashboard/collections/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus size={20} />
                  <span className="font-medium">Create Your First Collection</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
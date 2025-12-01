'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, FolderOpen, LogOut, FileText, ChevronDown, List, Book, User, Megaphone } from 'lucide-react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import SkeletonLoader from '@/components/SkeletonLoader'

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [collections, setCollections] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false)
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
      await fetchData()
      setLoading(false)
    }

    checkUser()
  }, [router])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showCollectionDropdown && !target.closest('.relative')) {
        setShowCollectionDropdown(false)
      }
    }

    if (showCollectionDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCollectionDropdown])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      // Fetch collections
      const collectionsResponse = await fetch('/api/collections', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (collectionsResponse.ok) {
        const data = await collectionsResponse.json()
        setCollections(data.collections || [])
        
        // Calculate total items (for now, we'll need to fetch items separately)
        // For now, set to 0 as we don't have an items count endpoint
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <MobileNav currentPath={pathname || ''} onLogout={handleLogout} />
        <div className="hidden md:flex w-64 bg-white border-r border-gray-200"></div>
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <SkeletonLoader />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Navigation */}
      <MobileNav currentPath={pathname || ''} onLogout={handleLogout} />
      
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">CMS Tool</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-gray-900 bg-blue-50 rounded-lg mb-2"
          >
            <Home size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          
          <Link
            href="/dashboard/collections"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
          >
            <FolderOpen size={20} />
            <span>Collections</span>
          </Link>
          <Link
            href="/dashboard/popups"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
          >
            <Megaphone size={20} />
            <span>Popups</span>
          </Link>

          <Link
            href="/dashboard/api-keys"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"></path><path d="m21 2-9.6 9.6"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>
            <span>API Keys</span>
          </Link>

          <Link
            href="/dashboard/form-submissions"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"></path><path d="M6 9.01V9"></path><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"></path></svg>
            <span>Form Submissions</span>
          </Link>

          <Link
            href="/docs"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-2"
          >
            <Book size={20} />
            <span>API Docs</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <User size={20} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Logout Button */}
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
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Welcome to Your CMS
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Manage your collections and content
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Total Collections
                </h3>
                <FolderOpen className="text-gray-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{collections.length}</p>
              <p className="text-sm text-gray-500 mt-1">Content types</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Total Items
                </h3>
                <FileText className="text-gray-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
              <p className="text-sm text-gray-500 mt-1">
                Entries across all collections
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
              Quick Actions
            </h2>
            <p className="text-sm text-gray-600 mb-4">Get started with common tasks</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard/collections/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors w-fit"
              >
                <span className="text-xl">+</span>
                <span className="font-medium">Create New Collection</span>
              </Link>
              
              <div className="relative">
                <button
                  onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                  className="flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-gray-700">Add Content to Collection...</span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
                
                {showCollectionDropdown && collections.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {collections.map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/dashboard/collections/${collection.id}/new`}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() => setShowCollectionDropdown(false)}
                      >
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-gray-700">{collection.schema?.title || 'Unnamed Collection'}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              <Link
                href="/dashboard/collections"
                className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-fit"
              >
                <List size={20} className="text-gray-600" />
                <span className="text-gray-700">Manage Collections</span>
              </Link>
            </div>
          </div>

          {/* Your Collections */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Your Collections
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {collections.length > 0 
                ? 'Click on a collection to manage its items'
                : 'Create your first collection to get started'}
            </p>
            
            {collections.length > 0 ? (
              <div className="space-y-4">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/dashboard/collections/${collection.id}`}
                    className="block bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {collection.schema?.title || 'Unnamed Collection'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {collection.schema?.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500">
                          0 items • 0 published
                        </p>
                      </div>
                      <FolderOpen className="text-gray-400 flex-shrink-0 ml-4" size={24} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No collections yet
                </h3>
                <Link
                  href="/dashboard/collections/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mt-4"
                >
                  <span className="text-xl">+</span>
                  <span className="font-medium">Create Your First Collection</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
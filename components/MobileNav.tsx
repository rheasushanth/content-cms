'use client'

import { useState } from 'react'
import { Menu, X, Home, FolderOpen, LogOut, KeyRound, Book, User, Megaphone } from 'lucide-react'
import Link from 'next/link'

interface MobileNavProps {
  currentPath: string
  onLogout: () => void
}

export default function MobileNav({ currentPath, onLogout }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">CMS Tool</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-600">CMS Tool</h1>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  currentPath === '/dashboard'
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home size={20} />
                <span className="font-medium">Dashboard</span>
              </Link>
              
              <Link
                href="/dashboard/collections"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  currentPath.startsWith('/dashboard/collections')
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FolderOpen size={20} />
                <span className="font-medium">Collections</span>
              </Link>
              <Link
                href="/dashboard/popups"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  currentPath.startsWith('/dashboard/popups')
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Megaphone size={20} />
                <span className="font-medium">Popups</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-gray-200">
              <Link
                href="/dashboard/api-keys"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                  currentPath.startsWith('/dashboard/api-keys')
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <KeyRound size={20} />
                <span className="font-medium">API Keys</span>
              </Link>

              <Link
                href="/docs"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                  currentPath === '/docs'
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Book size={20} />
                <span className="font-medium">API Docs</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                  currentPath === '/dashboard/settings'
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User size={20} />
                <span className="font-medium">Settings</span>
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg w-full"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, FolderOpen, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUpload from '@/components/ImageUpload'
import MobileNav from '@/components/MobileNav'

export default function EditItemPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const collectionId = params.id as string
  const itemId = params.itemId as string

  const [collection, setCollection] = useState<any>(null)
  const [schema, setSchema] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      await fetchItemData()
      setLoading(false)
    }

    checkUser()
  }, [router, collectionId, itemId])

  const fetchItemData = async () => {
    try {
      // Fetch item details
      const itemResponse = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (itemResponse.ok) {
        const itemData = await itemResponse.json()
        const item = itemData.item
        setItem(item)
        setCollection(item)
        setPublished(item.published || false)
        
        // Get schema from item
        let schema = item?.schema
        
        if (!schema && item?.schema_id) {
          const schemaResponse = await fetch(`/api/schemas/${item.schema_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })
          
          if (schemaResponse.ok) {
            const schemaData = await schemaResponse.json()
            schema = schemaData.schema || schemaData.data
          }
        }
        
        if (schema) {
          setSchema(schema)
          
          // Initialize form data with item data
          const itemData_obj = item?.data || {}
          const fields = schema?.definition || schema?.fields || []
          
          // Set form data from item data
          const initialData: Record<string, any> = {}
          if (Array.isArray(fields)) {
            fields.forEach((field: any) => {
              initialData[field.name] = itemData_obj[field.name] !== undefined 
                ? itemData_obj[field.name] 
                : (field.type === 'boolean' ? false : '')
            })
          }
          setFormData(initialData)
        }
      }
    } catch (error) {
      console.error('Error fetching item data:', error)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          data: formData,
          published: published
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update item')
      }

      // Success! Redirect back to items list
      router.push(`/dashboard/collections/${collectionId}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating item:', error)
      alert(`Failed to update item: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const renderField = (field: any) => {
    const commonClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
            className={commonClasses}
          />
        )
      
      case 'rich_text':
        return (
          <RichTextEditor
            value={formData[field.name] || ''}
            onChange={(value) => handleFieldChange(field.name, value)}
            placeholder={`Enter ${field.name}`}
          />
        )
      
      case 'image':
        return (
          <ImageUpload
            value={formData[field.name] || ''}
            onChange={(url) => handleFieldChange(field.name, url)}
            folder={collectionId}
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
            className={commonClasses}
          />
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            className={commonClasses}
          />
        )
      
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">
              {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
            </span>
          </div>
        )
      
      case 'select':
        const options = field.options || []
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            className={commonClasses}
          >
            <option value="">Select {field.name}</option>
            {options.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      default:
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
            className={commonClasses}
          />
        )
    }
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/dashboard/collections/${collectionId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to {collection?.schema?.title || 'Collection'}</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Edit {collection?.schema?.title || 'Collection'} Item
            </h1>
            <p className="text-gray-600">
              Update the fields for this item
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h2>
                <p className="text-sm text-gray-600 mb-6">Update the values for each field</p>
              </div>

              {(schema?.definition || schema?.fields || []).map((field: any) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {field.type}
                  </p>
                </div>
              ))}

              {(!schema?.definition && !schema?.fields) || 
               ((schema?.definition || schema?.fields || []).length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No fields defined for this collection
                </div>
              ) : null}

              {/* Publish Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                  Publish this item
                </label>
                <p className="text-xs text-gray-500 sm:ml-auto">
                  Published items are visible via the public API
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Updating Item...' : 'Update Item'}
              </button>
              <Link
                href={`/dashboard/collections/${collectionId}`}
                className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, FolderOpen, LogOut, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'

interface Field {
  id: string
  name: string
  type: string
  required: boolean
  options?: string[]
}

export default function CreateCollectionPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [description, setDescription] = useState('')
  const generateFieldId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  const [fields, setFields] = useState<Field[]>([
    { id: generateFieldId(), name: '', type: 'text', required: false, options: [] }
  ])

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'rich_text', label: 'Rich Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'image', label: 'Image' },
    { value: 'select', label: 'Select' }
  ]

  // Generate slug from collection name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
  }

  const schemaPresets: Array<{
    label: string
    name: string
    description: string
    fields: Array<Omit<Field, 'id'>>
  }> = [
    {
      label: 'Blog Post',
      name: 'Blog Posts',
      description: 'Content structure for long-form blog articles.',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'author', type: 'text', required: true },
        { name: 'content', type: 'rich_text', required: true },
        { name: 'publish_date', type: 'date', required: true },
        { name: 'hero_image', type: 'image', required: false },
        { name: 'summary', type: 'rich_text', required: false },
        { name: 'seo_title', type: 'text', required: false },
        { name: 'seo_description', type: 'rich_text', required: false }
      ]
    },
    {
      label: 'Product Catalog',
      name: 'Products',
      description: 'Schema for ecommerce product listings.',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'sku', type: 'text', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'description', type: 'rich_text', required: true },
        { name: 'product_image', type: 'image', required: false },
        { name: 'inventory', type: 'number', required: false },
        { name: 'status', type: 'select', required: true, options: ['Draft', 'Active', 'Archived'] },
        { name: 'tags', type: 'text', required: false }
      ]
    }
  ]

  const applyPreset = (preset: (typeof schemaPresets)[number]) => {
    setCollectionName(preset.name)
    setDescription(preset.description)
    setFields(
      preset.fields.map((field) => ({
        ...field,
        id: generateFieldId(),
        options: field.type === 'select' ? field.options ?? [] : field.options
      }))
    )
  }

  const addField = () => {
    const newField: Field = {
      id: generateFieldId(),
      name: '',
      type: 'text',
      required: false,
      options: []
    }
    setFields([...fields, newField])
  }

  const updateFieldOptions = (fieldId: string, optionsString: string) => {
    const options = optionsString.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
    updateField(fieldId, 'options', options)
  }

  const removeField = (fieldId: string) => {
    if (fields.length === 1) {
      alert('You must have at least one field')
      return
    }
    setFields(fields.filter(field => field.id !== fieldId))
  }

  const updateField = (fieldId: string, key: keyof Field, value: any) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, [key]: value } : field
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Validate fields
      const validFields = fields.filter(f => f.name.trim() !== '')
      
      if (validFields.length === 0) {
        alert('Please add at least one field with a name')
        setLoading(false)
        return
      }

      const schemaSlug = generateSlug(collectionName)
      const schemaDescription = description.trim()

      const requestBody = {
        title: collectionName,
        name: collectionName,
        slug: schemaSlug,
        description: schemaDescription || undefined,
        fields: validFields.map(f => ({
          name: f.name.trim(),
          type: f.type,
          required: f.required,
          options: f.type === 'select' ? (f.options || []) : undefined
        }))
      }

      console.log('📤 Sending to /api/schemas:', requestBody)

      const schemaResponse = await fetch('/api/schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Response status:', schemaResponse.status)

      if (!schemaResponse.ok) {
        const errorData = await schemaResponse.json()
        console.error('❌ Error response:', errorData)
        throw new Error(errorData.error || 'Failed to create schema')
      }
      const schemaData = await schemaResponse.json()

      // Create the collection (just needs schema_id, name/description come from schema)
      const collectionResponse = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          schema_id: schemaData.schema.id
        })
      })

      if (!collectionResponse.ok) {
        const errorData = await collectionResponse.json()
        throw new Error(errorData.error || 'Failed to create collection')
      }

      // Success! Show success message and redirect
      alert('Collection created successfully!')
      router.push('/dashboard/collections')
      router.refresh()
    } catch (error) {
      console.error('Error creating collection:', error)
      alert(`Failed to create collection: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
            suppressHydrationWarning
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
          <div className="mb-6 md:mb-8">
            <Link
              href="/dashboard/collections"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back to Collections</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Create New Collection
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Define the fields for your collection
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Schema Definition */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Schema Definition
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Define the structure for your collection
              </p>
              
              {schemaPresets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Start with a template
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {schemaPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
                      >
                        Use {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Prefill schema name, description, and fields for common use cases.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schema Name *
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g., Blog Posts Schema"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  suppressHydrationWarning
                />
                <p className="text-xs text-gray-500 mt-2">
                  This schema can be reused for other collections
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schema Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how this schema should be used"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  suppressHydrationWarning
                />
                <p className="text-xs text-gray-500 mt-2">
                  Helpful when sharing schemas with teammates or documenting API usage.
                </p>
              </div>
            </div>

            {/* Fields Definition */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Fields *</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Define the structure for your content
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  suppressHydrationWarning
                >
                  <Plus size={20} />
                  <span>Add Field</span>
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Field {index + 1}</h3>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="text-red-600 hover:text-red-700"
                          suppressHydrationWarning
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field Name *
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(field.id, 'name', e.target.value)}
                            placeholder="e.g., title, author"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            suppressHydrationWarning
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type *
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            suppressHydrationWarning
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              suppressHydrationWarning
                            />
                            <span className="text-sm text-gray-700">Required field</span>
                          </label>
                        </div>
                      </div>

                      {field.type === 'select' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Options * (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateFieldOptions(field.id, e.target.value)}
                            placeholder="e.g., Option 1, Option 2, Option 3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            suppressHydrationWarning
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Separate options with commas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/collections"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                suppressHydrationWarning
              >
                {loading ? 'Creating Collection...' : 'Create Collection'}
              </button>
              <Link
                href="/dashboard/collections"
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
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
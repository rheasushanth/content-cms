'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'

interface FormSubmission {
  id: string
  form_name: string
  form_data: any
  submitted_at: string
  ip_address: string
  user_agent: string
}

export default function FormSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<string>('all')
  const [formNames, setFormNames] = useState<string[]>([])

  useEffect(() => {
    loadSubmissions()
  }, [selectedForm])

  const loadSubmissions = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const url = selectedForm === 'all' 
      ? '/api/form-submissions'
      : `/api/form-submissions?form_name=${selectedForm}`

    const res = await fetch(url, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setSubmissions(data.submissions || [])
      
      // Extract unique form names
      const names = [...new Set(data.submissions.map((s: FormSubmission) => s.form_name))] as string[]
      setFormNames(names)
    }
    setLoading(false)
  }

  const exportToCSV = () => {
    if (submissions.length === 0) return

    // Get all unique keys from form_data
    const allKeys = new Set<string>()
    submissions.forEach(sub => {
      Object.keys(sub.form_data).forEach(key => allKeys.add(key))
    })

    // Create CSV header
    const headers = ['Form Name', 'Submitted At', 'IP Address', ...Array.from(allKeys)]
    const csvRows = [headers.join(',')]

    // Create CSV rows
    submissions.forEach(sub => {
      const row = [
        sub.form_name,
        new Date(sub.submitted_at).toLocaleString(),
        sub.ip_address,
        ...Array.from(allKeys).map(key => {
          const value = sub.form_data[key] || ''
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`
        })
      ]
      csvRows.push(row.join(','))
    })

    // Download CSV
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form-submissions-${selectedForm}-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 Form Submissions</h1>
              <p className="text-gray-600 text-lg">View and manage form submissions from your website</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadSubmissions}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                disabled={submissions.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Form</label>
          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="w-full md:w-64 border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Forms</option>
            {formNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600">Form submissions will appear here once users submit forms on your website.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{submission.form_name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(submission.submitted_at).toLocaleString()} • IP: {submission.ip_address}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Form Data:</h4>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(submission.form_data).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs font-semibold text-gray-600 uppercase mb-1">{key}</dt>
                        <dd className="text-sm text-gray-900 break-words">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Count */}
        {!loading && submissions.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

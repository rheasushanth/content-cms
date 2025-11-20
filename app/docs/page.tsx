'use client'

import { useState } from 'react'
import { Copy, Check, Book, Key, Database, Lock } from 'lucide-react'

export default function ApiDocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <button
      onClick={() => copyToClipboard(text, section)}
      className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
      title="Copy to clipboard"
    >
      {copiedSection === section ? (
        <Check size={16} className="text-green-400" />
      ) : (
        <Copy size={16} className="text-gray-300" />
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Book className="text-blue-600" size={32} />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              CMS API Documentation
            </h1>
          </div>
          <p className="text-gray-600">
            Complete guide to integrating with your CMS collections
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Quick Start */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="text-blue-600" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Start</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Get Your API Key</h3>
              <p className="text-gray-600 mb-3">
                Navigate to your dashboard and create an API key with the appropriate scopes.
              </p>
              <a
                href="/dashboard/api-keys"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Key size={16} />
                Manage API Keys
              </a>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Make Your First Request</h3>
              <p className="text-gray-600 mb-3">
                All API requests must include your API key in the <code className="px-2 py-1 bg-gray-100 rounded text-sm">Authorization</code> header.
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm">{`curl -X GET https://your-domain.com/api/public/collections \\
  -H "Authorization: Bearer cms_your_api_key_here" \\
  -H "Content-Type: application/json"`}</code>
                </pre>
                <CopyButton 
                  text={`curl -X GET https://your-domain.com/api/public/collections \\\n  -H "Authorization: Bearer cms_your_api_key_here" \\\n  -H "Content-Type: application/json"`}
                  section="quickstart"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Authentication */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Lock className="text-green-600" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            All public API endpoints require authentication using an API key. Include your API key in the <code className="px-2 py-1 bg-gray-100 rounded text-sm">Authorization</code> header with the <code className="px-2 py-1 bg-gray-100 rounded text-sm">Bearer</code> scheme.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">Format</h4>
            <code className="text-blue-800">Authorization: Bearer YOUR_API_KEY</code>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">⚠️ Security Warning</h4>
            <p className="text-red-800 text-sm">
              Never expose your API keys in client-side code, public repositories, or version control. Always use environment variables and make API calls from your backend.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Database className="text-purple-600" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">API Endpoints</h2>
          </div>

          {/* Get All Collections */}
          <div className="mb-8">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="px-3 py-1 bg-green-100 text-green-800 font-semibold rounded text-sm">GET</span>
              <code className="text-lg font-mono text-gray-900">/api/public/collections</code>
            </div>
            <p className="text-gray-600 mb-4">
              Retrieve all published collections accessible to your API key.
            </p>

            <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
            <div className="relative mb-4">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">{`{
  "collections": [
    {
      "id": "uuid",
      "schema_id": "uuid",
      "data": {},
      "published": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "schema": {
        "id": "uuid",
        "title": "Blog Posts",
        "description": "Blog content",
        "fields": [
          {
            "name": "title",
            "type": "string",
            "required": true
          },
          {
            "name": "content",
            "type": "richtext",
            "required": true
          }
        ]
      }
    }
  ]
}`}</code>
              </pre>
              <CopyButton 
                text={`{\n  "collections": [\n    {\n      "id": "uuid",\n      "schema_id": "uuid",\n      "data": {},\n      "published": true,\n      "created_at": "2025-01-01T00:00:00Z",\n      "updated_at": "2025-01-01T00:00:00Z",\n      "schema": {\n        "id": "uuid",\n        "title": "Blog Posts",\n        "description": "Blog content",\n        "fields": [\n          {\n            "name": "title",\n            "type": "string",\n            "required": true\n          },\n          {\n            "name": "content",\n            "type": "richtext",\n            "required": true\n          }\n        ]\n      }\n    }\n  ]\n}`}
                section="get-collections"
              />
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">Example Request</h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">JavaScript / Fetch</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm">{`fetch('https://your-domain.com/api/public/collections', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer cms_your_api_key_here',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data.collections))
  .catch(error => console.error('Error:', error));`}</code>
                  </pre>
                  <CopyButton 
                    text={`fetch('https://your-domain.com/api/public/collections', {\n  method: 'GET',\n  headers: {\n    'Authorization': 'Bearer cms_your_api_key_here',\n    'Content-Type': 'application/json'\n  }\n})\n  .then(response => response.json())\n  .then(data => console.log(data.collections))\n  .catch(error => console.error('Error:', error));`}
                    section="get-collections-js"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Python</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm">{`import requests

url = "https://your-domain.com/api/public/collections"
headers = {
    "Authorization": "Bearer cms_your_api_key_here",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)
collections = response.json()["collections"]
print(collections)`}</code>
                  </pre>
                  <CopyButton 
                    text={`import requests\n\nurl = "https://your-domain.com/api/public/collections"\nheaders = {\n    "Authorization": "Bearer cms_your_api_key_here",\n    "Content-Type": "application/json"\n}\n\nresponse = requests.get(url, headers=headers)\ncollections = response.json()["collections"]\nprint(collections)`}
                    section="get-collections-python"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Get Single Collection */}
          <div className="mb-8 pt-8 border-t border-gray-200">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="px-3 py-1 bg-green-100 text-green-800 font-semibold rounded text-sm">GET</span>
              <code className="text-lg font-mono text-gray-900">/api/public/collections/:id</code>
            </div>
            <p className="text-gray-600 mb-4">
              Retrieve a specific published collection by ID, including all its items.
            </p>

            <h4 className="font-semibold text-gray-900 mb-2">URL Parameters</h4>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-700">Parameter</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-2 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 pr-4"><code className="text-blue-600">id</code></td>
                    <td className="py-2 pr-4">string</td>
                    <td className="py-2">The unique identifier of the collection</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
            <div className="relative mb-4">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">{`{
  "collection": {
    "id": "uuid",
    "schema_id": "uuid",
    "published": true,
    "created_at": "2025-01-01T00:00:00Z",
    "schema": {
      "title": "Blog Posts",
      "fields": [...]
    },
    "items": [
      {
        "id": "uuid",
        "data": {
          "title": "My First Post",
          "content": "<p>Hello World!</p>",
          "author": "John Doe",
          "publishDate": "2025-01-01"
        },
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}`}</code>
              </pre>
              <CopyButton 
                text={`{\n  "collection": {\n    "id": "uuid",\n    "schema_id": "uuid",\n    "published": true,\n    "created_at": "2025-01-01T00:00:00Z",\n    "schema": {\n      "title": "Blog Posts",\n      "fields": [...]\n    },\n    "items": [\n      {\n        "id": "uuid",\n        "data": {\n          "title": "My First Post",\n          "content": "<p>Hello World!</p>",\n          "author": "John Doe",\n          "publishDate": "2025-01-01"\n        },\n        "created_at": "2025-01-01T00:00:00Z",\n        "updated_at": "2025-01-01T00:00:00Z"\n      }\n    ]\n  }\n}`}
                section="get-collection"
              />
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">Example Request</h4>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">{`const collectionId = 'your-collection-id';

fetch(\`https://your-domain.com/api/public/collections/\${collectionId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer cms_your_api_key_here',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('Collection:', data.collection);
    console.log('Items:', data.collection.items);
  });`}</code>
              </pre>
              <CopyButton 
                text={`const collectionId = 'your-collection-id';\n\nfetch(\`https://your-domain.com/api/public/collections/\${collectionId}\`, {\n  method: 'GET',\n  headers: {\n    'Authorization': 'Bearer cms_your_api_key_here',\n    'Content-Type': 'application/json'\n  }\n})\n  .then(response => response.json())\n  .then(data => {\n    console.log('Collection:', data.collection);\n    console.log('Items:', data.collection.items);\n  });`}
                section="get-collection-js"
              />
            </div>
          </div>
        </section>

        {/* Error Handling */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Handling</h2>
          
          <p className="text-gray-600 mb-4">
            The API uses standard HTTP status codes to indicate success or failure.
          </p>

          <div className="space-y-3">
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="font-mono font-semibold text-green-600">200</span>
              <div>
                <p className="font-semibold text-gray-900">OK</p>
                <p className="text-sm text-gray-600">Request succeeded</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="font-mono font-semibold text-yellow-600">401</span>
              <div>
                <p className="font-semibold text-gray-900">Unauthorized</p>
                <p className="text-sm text-gray-600">Missing or invalid API key</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="font-mono font-semibold text-orange-600">403</span>
              <div>
                <p className="font-semibold text-gray-900">Forbidden</p>
                <p className="text-sm text-gray-600">API key lacks required permissions</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="font-mono font-semibold text-red-600">404</span>
              <div>
                <p className="font-semibold text-gray-900">Not Found</p>
                <p className="text-sm text-gray-600">Resource doesn't exist</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="font-mono font-semibold text-red-600">500</span>
              <div>
                <p className="font-semibold text-gray-900">Internal Server Error</p>
                <p className="text-sm text-gray-600">Something went wrong on our end</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Error Response Format</h3>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm">{`{
  "error": "Unauthorized",
  "message": "Invalid API key"
}`}</code>
            </pre>
            <CopyButton 
              text={`{\n  "error": "Unauthorized",\n  "message": "Invalid API key"\n}`}
              section="error"
            />
          </div>
        </section>

        {/* Best Practices */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Cache Responses</h4>
                <p className="text-gray-600 text-sm">
                  Cache API responses on your server to reduce latency and API calls. Use appropriate cache invalidation strategies.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Handle Errors Gracefully</h4>
                <p className="text-gray-600 text-sm">
                  Always implement proper error handling and provide fallback content when API calls fail.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Use Environment Variables</h4>
                <p className="text-gray-600 text-sm">
                  Store API keys in environment variables, never in your codebase or client-side code.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Filter Unpublished Content</h4>
                <p className="text-gray-600 text-sm">
                  The API only returns published collections. Mark collections as published in your dashboard when ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 md:p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
          <p className="mb-6 text-blue-100">
            If you have questions or need assistance integrating with the API, we're here to help.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Go to Dashboard
            </a>
            <a
              href="/dashboard/api-keys"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-medium"
            >
              <Key size={16} />
              Manage API Keys
            </a>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            CMS Tool API Documentation • Updated November 2025
          </p>
        </div>
      </footer>
    </div>
  )
}

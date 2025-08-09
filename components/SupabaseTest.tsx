'use client'

import { useState } from 'react'
import { testConnection, getClasses } from '@/lib/supabase'

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [classCount, setClassCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const connectionResult = await testConnection()
      const classesResult = await getClasses()
      
      if (connectionResult.success && classesResult.success) {
        setTestResult('✅ Connected to Supabase!')
        setClassCount(classesResult.data?.length || 0)
      } else {
        setTestResult(' Connection failed')
      }
    } catch (error) {
      setTestResult(' Error: ' + error)
    }
    setLoading(false)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-blue-800 mb-2">Supabase Connection Test</h3>
      <button 
        onClick={handleTest}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Supabase Connection'}
      </button>
      {testResult && (
        <div className="mt-3">
          <p className="text-sm">{testResult}</p>
          {classCount > 0 && (
            <p className="text-sm text-green-600">Found {classCount} classes in database</p>
          )}
        </div>
      )}
    </div>
  )
}

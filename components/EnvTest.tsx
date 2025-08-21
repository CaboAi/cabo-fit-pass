'use client'

export default function EnvTest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-4">Environment Variable Test</h3>
      <div className="space-y-2">
        <div>
          <strong>Supabase URL:</strong> 
          <span className="ml-2">{supabaseUrl || 'MISSING'}</span>
        </div>
        <div>
          <strong>Supabase Key:</strong> 
          <span className="ml-2">{supabaseKey ? 'EXISTS' : 'MISSING'}</span>
        </div>
        <div>
          <strong>Status:</strong> 
          <span className="ml-2">
            {supabaseUrl && supabaseKey ? ' Ready' : ' Missing vars'}
          </span>
        </div>
      </div>
    </div>
  )
}

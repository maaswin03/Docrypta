'use client' // Only for app directory

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestPage() {
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*')

      if (error) {
        setError(error.message)
      } else {
        setUsers(data)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Test Supabase Connection</h1>
      {error && <p className="text-red-500">Error: {error}</p>}
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  )
}

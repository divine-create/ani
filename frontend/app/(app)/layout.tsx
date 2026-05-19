'use client'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { setAuthToken } from '@/lib/api'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    setAuthToken((session as any)?.backend_token ?? null)
  }, [(session as any)?.backend_token])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6fa]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

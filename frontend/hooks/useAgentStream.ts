'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AgentEvent } from '@/lib/types'

export function useAgentStream() {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()
  const token = (session as any)?.backend_token

  useEffect(() => {
    if (!token) return
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
    const url = `${base}/api/stream/agent?token=${encodeURIComponent(token)}`
    const source = new EventSource(url)

    source.onopen = () => setIsConnected(true)

    source.onmessage = (e) => {
      try {
        const event: AgentEvent = JSON.parse(e.data)
        if (event.type === 'ping') return
        setEvents(prev => [event, ...prev].slice(0, 25))
      } catch {}
    }

    source.onerror = () => {
      setIsConnected(false)
      source.close()
    }

    return () => source.close()
  }, [token])

  return { events, isConnected }
}

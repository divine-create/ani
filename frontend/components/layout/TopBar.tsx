'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useAgentStream } from '@/hooks/useAgentStream'
import { useSearch } from '@/lib/api'
import { Bell, Search, Mail, CheckSquare, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

function SearchDropdown({ q, onClose }: { q: string; onClose: () => void }) {
  const { data, isLoading } = useSearch(q)
  const router = useRouter()

  const messages = data?.messages ?? []
  const tasks = data?.tasks ?? []
  const empty = !isLoading && messages.length === 0 && tasks.length === 0

  return (
    <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 z-50 overflow-hidden">
      {isLoading && (
        <div className="p-4 text-center text-xs text-gray-400">Searching...</div>
      )}
      {empty && (
        <div className="p-4 text-center text-xs text-gray-400">No results for "{q}"</div>
      )}
      {messages.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">Messages</p>
          {messages.map((m: any) => (
            <button
              key={m.id}
              onClick={() => { router.push('/inbox'); onClose() }}
              className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              <Mail size={12} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{m.subject || m.from_address}</p>
                <p className="text-[10px] text-gray-400 truncate">{m.from_address}</p>
              </div>
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                m.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
              )}>{m.priority}</span>
            </button>
          ))}
        </div>
      )}
      {tasks.length > 0 && (
        <div className={messages.length > 0 ? 'border-t border-gray-100' : ''}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">Tasks</p>
          {tasks.map((t: any) => (
            <button
              key={t.id}
              onClick={() => { router.push('/tasks'); onClose() }}
              className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              <CheckSquare size={12} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs font-medium text-gray-800 truncate flex-1">{t.title}</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">{t.priority}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TopBar() {
  const { isConnected } = useAgentStream()
  const { data: session } = useSession()
  const user = session?.user
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const showDropdown = focused && q.length >= 2

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3" ref={wrapperRef}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search messages, tasks..."
            className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-gray-400"
          />
          {showDropdown && <SearchDropdown q={q} onClose={() => { setQ(''); setFocused(false) }} />}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-xs text-gray-400 hidden md:block">{now}</p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500 font-medium">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
        <button className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
          <Bell size={15} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {user?.image ? (
              <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.name ?? 'User'}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <LogOut size={12} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Inbox, Calendar, CheckSquare, Star, Settings, Sparkles, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStats } from '@/lib/api'

export function Sidebar() {
  const path = usePathname()
  const { data: stats } = useStats()

  const badges: Record<string, number> = {
    '/inbox': stats?.urgent_count ?? 0,
    '/tasks': stats?.open_tasks ?? 0,
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
    { href: '/inbox',     label: 'Inbox',          icon: Inbox },
    { href: '/calendar',  label: 'Calendar',       icon: Calendar },
    { href: '/tasks',     label: 'Tasks',          icon: CheckSquare },
    { href: '/reviews',   label: 'Reviews',        icon: Star },
    { href: '/meeting',   label: 'Meeting Intel',  icon: Mic },
  ]

  return (
    <aside className="w-60 flex flex-col flex-shrink-0 bg-[#0a0f1e]">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Ani</h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">Chief of Staff AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2 mt-1">
          Workspace
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/')
          const badge = badges[href] ?? 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon
                size={15}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  active ? 'text-indigo-400' : 'text-gray-500'
                )}
              />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none',
                  href === '/inbox' ? 'bg-red-500 text-white' : 'bg-indigo-500/40 text-indigo-200'
                )}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
            path === '/settings'
              ? 'bg-indigo-500/20 text-white'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          )}
        >
          <Settings size={15} className="flex-shrink-0 text-gray-500" />
          Settings
        </Link>

        <div className="px-3 py-2.5 rounded-xl bg-white/[0.03]">
          {stats && (
            <p className="text-[10px] text-indigo-400 font-semibold mb-0.5">
              {stats.time_saved_mins}m saved today
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-[10px] text-green-500 font-medium">All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

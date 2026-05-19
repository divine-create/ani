import { MorningBrief } from '@/lib/types'
import Link from 'next/link'
import { Clock, ChevronRight, CalendarDays } from 'lucide-react'

const EVENT_COLORS = [
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-blue-500',
  'bg-cyan-500',
]

export function PriorityList({ brief }: { brief: MorningBrief }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <CalendarDays size={13} className="text-indigo-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Events</h3>
        </div>
        <Link href="/calendar" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-0.5 transition-colors">
          View all <ChevronRight size={12} />
        </Link>
      </div>

      {!brief.events || brief.events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <CalendarDays size={16} className="text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 font-medium">No events today</p>
          <p className="text-[10px] text-gray-300 mt-0.5">Enjoy the free schedule</p>
        </div>
      ) : (
        <div className="space-y-1">
          {brief.events.map((e, i) => (
            <div key={i} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <div className={`w-1 h-10 rounded-full flex-shrink-0 ${EVENT_COLORS[i % EVENT_COLORS.length]}`} />
              <div className="flex items-center gap-1.5 flex-shrink-0 w-14">
                <Clock size={11} className="text-gray-400" />
                <span className="text-[11px] text-gray-400 font-medium">{e.time}</span>
              </div>
              <span className="text-sm text-gray-800 font-medium flex-1 truncate">{e.title}</span>
              <Link href="/calendar"
                className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                Brief <ChevronRight size={11} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

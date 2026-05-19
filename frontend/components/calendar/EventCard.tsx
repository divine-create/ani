import { CalendarEvent } from '@/lib/types'
import { cn, formatTime } from '@/lib/utils'
import { Video, Users, Clock, FileText } from 'lucide-react'

interface Props { event: CalendarEvent; selected: boolean; onSelect: () => void }

const EVENT_COLORS = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-teal-500']

export function EventCard({ event, selected, onSelect }: Props) {
  const colorIndex = event.id.charCodeAt(0) % EVENT_COLORS.length
  const barColor = EVENT_COLORS[colorIndex]
  const hasBrief = !!event.meeting_brief
  const startTime = event.start?.includes('T') ? formatTime(event.start) : 'All day'
  const endTime = event.end?.includes('T') ? formatTime(event.end) : ''

  return (
    <button onClick={onSelect} className={cn(
      'w-full text-left rounded-xl border overflow-hidden transition-all duration-150',
      selected
        ? 'border-indigo-200 shadow-md shadow-indigo-100'
        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
    )}>
      <div className="flex">
        <div className={cn('w-1 flex-shrink-0', barColor, selected ? 'opacity-100' : 'opacity-60')} />
        <div className={cn('flex-1 p-3', selected ? 'bg-indigo-50' : 'bg-white')}>
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-semibold truncate', selected ? 'text-indigo-900' : 'text-gray-900')}>
              {event.title}
            </p>
            {hasBrief && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <FileText size={9} /> Brief
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <span className={cn('flex items-center gap-1 text-[11px]', selected ? 'text-indigo-500' : 'text-gray-400')}>
              <Clock size={10} />
              {startTime}{endTime ? ` — ${endTime}` : ''}
            </span>
            {event.attendees?.length > 0 && (
              <span className={cn('flex items-center gap-1 text-[11px]', selected ? 'text-indigo-400' : 'text-gray-400')}>
                <Users size={10} /> {event.attendees.length}
              </span>
            )}
            {event.meet_link && (
              <span className={cn('flex items-center gap-1 text-[11px]', selected ? 'text-indigo-400' : 'text-gray-400')}>
                <Video size={10} /> Meet
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

import { CalendarEvent } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { Sparkles, Users, Video, Clock, Loader2, ExternalLink } from 'lucide-react'

interface Props {
  event: CalendarEvent
  onGenerateBrief: () => void
  isGenerating: boolean
}

export function MeetingBrief({ event, onGenerateBrief, isGenerating }: Props) {
  const startTime = event.start?.includes('T') ? formatTime(event.start) : 'All day'
  const endTime = event.end?.includes('T') ? formatTime(event.end) : ''

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50">
        <h2 className="font-bold text-gray-900 text-base leading-snug">{event.title}</h2>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock size={12} className="text-gray-400" />
            {startTime}{endTime ? ` — ${endTime}` : ''}
          </span>
          {event.attendees?.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={12} className="text-gray-400" />
              {event.attendees.map((a: any) => a.name || a.email).filter(Boolean).join(', ')}
            </span>
          )}
          {event.meet_link && (
            <a href={event.meet_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
              <Video size={12} /> Join Google Meet <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Brief content */}
      <div className="flex-1 overflow-y-auto p-5">
        {event.meeting_brief ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Sparkles size={13} className="text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">AI Meeting Brief</p>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {event.meeting_brief}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Sparkles size={22} className="text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No brief yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-6 max-w-xs">
              Ani will research attendees, review past interactions, and prep talking points.
            </p>
            <button
              onClick={onGenerateBrief}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-sm shadow-indigo-200"
            >
              {isGenerating
                ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                : <><Sparkles size={14} /> Generate Brief</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

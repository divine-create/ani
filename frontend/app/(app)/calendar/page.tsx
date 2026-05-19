'use client'
import { useState } from 'react'
import { useCalendar, useGenerateBrief } from '@/lib/api'
import { CalendarEvent } from '@/lib/types'
import { EventCard } from '@/components/calendar/EventCard'
import { MeetingBrief } from '@/components/calendar/MeetingBrief'
import { Calendar } from 'lucide-react'

export default function CalendarPage() {
  const { data, isLoading } = useCalendar()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const generate = useGenerateBrief()
  const events: CalendarEvent[] = data?.events ?? []

  // Always derive from live events so meeting_brief updates without re-selecting
  const selected = events.find(e => e.id === selectedId) ?? null

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="flex gap-5 h-full max-w-7xl mx-auto">
      {/* Left: event list */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Calendar size={15} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Calendar</h1>
            <p className="text-xs text-gray-400">{today}</p>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="card p-8 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <Calendar size={18} className="text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 font-medium">No events today</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Enjoy the free day</p>
            </div>
          ) : (
            events.map(e => (
              <EventCard
                key={e.id}
                event={e}
                selected={selectedId === e.id}
                onSelect={() => setSelectedId(e.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right: brief panel */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <MeetingBrief
            event={selected}
            onGenerateBrief={() => generate.mutate(selected.id)}
            isGenerating={generate.isPending}
          />
        ) : (
          <div className="card h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Calendar size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Select an event</p>
            <p className="text-xs text-gray-400 mt-1">Ani will generate a meeting brief with context and talking points</p>
          </div>
        )}
      </div>
    </div>
  )
}

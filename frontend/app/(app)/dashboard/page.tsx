'use client'
import { useBriefing, useTriggerBriefing, useStats, useIntegrations } from '@/lib/api'
import { useAgentStream } from '@/hooks/useAgentStream'
import { MorningBrief } from '@/components/dashboard/MorningBrief'
import { StatsBar } from '@/components/dashboard/StatsBar'
import { PriorityList } from '@/components/dashboard/PriorityList'
import { AgentActivity } from '@/components/dashboard/AgentActivity'
import { Sparkles, RefreshCw, CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function OnboardingChecklist({ connectedCount }: { connectedCount: number }) {
  const steps = [
    { label: 'Connect Gmail', done: connectedCount >= 1, href: '/settings' },
    { label: 'Connect Google Calendar', done: connectedCount >= 2, href: '/settings' },
    { label: 'Set your writing style', done: false, href: '/settings' },
    { label: 'Add an automation rule', done: false, href: '/settings' },
    { label: 'Generate your first morning brief', done: false, href: '/dashboard' },
  ]
  const doneCount = steps.filter(s => s.done).length

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Get started with Ani</h3>
          <p className="text-xs text-gray-400 mt-0.5">{doneCount}/{steps.length} steps complete</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Sparkles size={16} className="text-indigo-500" />
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <Link key={i} href={step.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
            {step.done
              ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              : <Circle size={16} className="text-gray-300 flex-shrink-0" />
            }
            <span className={`text-xs font-medium flex-1 ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {step.label}
            </span>
            {!step.done && <ArrowRight size={12} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: brief, isLoading } = useBriefing()
  const { data: statsData } = useStats()
  const { data: intData } = useIntegrations()
  const trigger = useTriggerBriefing()
  const { events, isConnected } = useAgentStream()

  const connectedCount = intData?.integrations?.filter((i: any) => i.connected).length ?? 0
  const stats = statsData

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center animate-pulse">
            <Sparkles size={18} className="text-indigo-500" />
          </div>
          <p className="text-sm text-gray-400">Loading your briefing...</p>
        </div>
      </div>
    )
  }

  if (!brief || brief.message) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <div className="card p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles size={28} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Good morning!</h2>
                <p className="text-sm text-gray-500 mt-1">Ani is ready to brief you on your day.</p>
              </div>
              <button
                onClick={() => trigger.mutate()}
                disabled={trigger.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {trigger.isPending
                  ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
                  : <><Sparkles size={14} /> Generate Morning Brief</>
                }
              </button>
            </div>
          </div>
          <div>
            <OnboardingChecklist connectedCount={connectedCount} />
          </div>
        </div>
      </div>
    )
  }

  const data = brief.content ?? brief

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <MorningBrief brief={data} stats={stats} />
      {stats && <StatsBar stats={stats} />}
      <div className="grid grid-cols-3 gap-5" style={{ minHeight: '380px' }}>
        <div className="col-span-2">
          <PriorityList brief={data} />
        </div>
        <div className="col-span-1 flex flex-col gap-5">
          <AgentActivity events={events} isConnected={isConnected} />
          {connectedCount < 4 && <OnboardingChecklist connectedCount={connectedCount} />}
        </div>
      </div>
    </div>
  )
}

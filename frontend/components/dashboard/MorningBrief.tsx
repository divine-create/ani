import { MorningBrief as Brief, Stats } from '@/lib/types'
import { Sparkles, TrendingUp } from 'lucide-react'

export function MorningBrief({ brief, stats }: { brief: Brief; stats?: Stats }) {
  // Use live stats if available — briefing counts can be stale if generated before inbox synced
  const decisions = stats
    ? stats.urgent_count + stats.needs_review
    : brief.total_decisions

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 text-white"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', transform: 'translateY(50%)' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-indigo-300" />
              <p className="text-indigo-200 text-xs font-medium tracking-wide uppercase">Morning Brief · {brief.date}</p>
            </div>
            <h2 className="text-2xl font-bold leading-tight">
              You have <span className="text-indigo-300">{decisions}</span> decisions today.
            </h2>
            <p className="text-indigo-200 text-sm mt-1">Everything else is handled by Ani.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ml-4"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <TrendingUp size={20} className="text-white" />
          </div>
        </div>

        {stats && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs text-indigo-200">{stats.urgent_count} urgent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-indigo-200">{stats.total_auto_handled} auto-handled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-300" />
              <span className="text-xs text-indigo-200">{stats.time_saved_mins}m saved</span>
            </div>
          </div>
        )}

        {brief.insight && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-indigo-100 italic leading-relaxed">
              &ldquo;{brief.insight}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

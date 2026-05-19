import { Stats } from '@/lib/types'
import { AlertCircle, CheckCircle2, Clock, GitCommit } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  accent: string
  bg: string
}

function StatCard({ label, value, sub, icon, accent, bg }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
          <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
          <div className={accent}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

function formatTime(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Urgent Messages"
        value={stats.urgent_count}
        sub="need your reply"
        icon={<AlertCircle size={18} />}
        accent="text-red-500"
        bg="bg-red-50"
      />
      <StatCard
        label="Auto-Handled"
        value={stats.total_auto_handled}
        sub="resolved by Ani"
        icon={<CheckCircle2 size={18} />}
        accent="text-green-500"
        bg="bg-green-50"
      />
      <StatCard
        label="Time Saved"
        value={formatTime(stats.time_saved_mins)}
        sub="~3 min per email"
        icon={<Clock size={18} />}
        accent="text-indigo-500"
        bg="bg-indigo-50"
      />
      <StatCard
        label="Commitments"
        value={stats.commitments_extracted}
        sub="extracted from email"
        icon={<GitCommit size={18} />}
        accent="text-amber-500"
        bg="bg-amber-50"
      />
    </div>
  )
}

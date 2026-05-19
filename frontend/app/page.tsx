import Link from 'next/link'
import {
  Sparkles, Mail, Calendar, CheckSquare, Star,
  MessageSquare, Zap, Shield, ArrowRight, Play,
  Brain, Clock, TrendingUp
} from 'lucide-react'

const integrations = [
  { name: 'Gmail',    color: 'bg-red-500',    letter: 'G' },
  { name: 'Calendar', color: 'bg-blue-500',   letter: 'C' },
  { name: 'WhatsApp', color: 'bg-green-500',  letter: 'W' },
  { name: 'Notion',   color: 'bg-gray-800',   letter: 'N' },
  { name: 'Slack',    color: 'bg-purple-500', letter: 'S' },
  { name: 'Drive',    color: 'bg-yellow-500', letter: 'D' },
  { name: 'Calendly', color: 'bg-teal-500',   letter: 'Ca' },
  { name: 'LinkedIn', color: 'bg-blue-700',   letter: 'Li' },
]

const features = [
  {
    icon: Mail,
    title: 'Autonomous Inbox Triage',
    desc: 'Ani reads every email, classifies urgency, drafts replies in your voice, and auto-sends routine ones — before you open your laptop.',
    accent: 'bg-red-50 text-red-500',
  },
  {
    icon: Brain,
    title: 'AI Morning Briefing',
    desc: 'Every morning Ani delivers a crisp briefing: X decisions need you, everything else is handled. Pulled from your real calendar and inbox.',
    accent: 'bg-indigo-50 text-indigo-500',
  },
  {
    icon: Calendar,
    title: 'Meeting Intelligence',
    desc: 'Before every meeting, Ani preps a brief — attendee context, past interactions, talking points. Walk in ready every time.',
    accent: 'bg-blue-50 text-blue-500',
  },
  {
    icon: CheckSquare,
    title: 'Commitment Tracker',
    desc: 'Every "I\'ll send that" gets auto-extracted into tasks and synced to Notion — nothing falls through the cracks.',
    accent: 'bg-green-50 text-green-500',
  },
  {
    icon: Star,
    title: 'Review Autopilot',
    desc: 'Monitors your Google My Business reviews, drafts personal responses, and auto-posts 4-5 star replies within minutes.',
    accent: 'bg-amber-50 text-amber-500',
  },
  {
    icon: Clock,
    title: 'EOD Summary',
    desc: 'At 6pm, a clean wrap-up: what Ani handled, what needs your eye tomorrow, and what slipped. Full situational awareness.',
    accent: 'bg-purple-50 text-purple-500',
  },
]

const stats = [
  { value: '90%', label: 'of emails handled autonomously' },
  { value: '< 2min', label: 'to your morning briefing' },
  { value: '9+', label: 'integrations connected' },
  { value: '24/7', label: 'always watching your channels' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,15,30,0.85)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">Ani</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:block">Your AI Chief of Staff</span>
            <Link href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
              Open App <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
            <Zap size={11} className="text-indigo-400" />
            AI-powered. Always on. Built for makers.
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-none tracking-tight">
            Your inbox runs itself.
            <br />
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)' }}>
              You run everything else.
            </span>
          </h1>
          <p className="mt-7 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Ani is an AI Chief of Staff that monitors Gmail, WhatsApp, Calendar, and more —
            triaging messages, drafting replies, prepping meeting briefs, and delivering
            daily intelligence. Autonomous by default, human when it matters.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/dashboard"
              className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-sm shadow-xl shadow-indigo-500/25">
              <Sparkles size={15} />
              Launch Ani
            </Link>
            <a href="#features"
              className="flex items-center gap-2 px-7 py-3.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold rounded-xl transition-all text-sm">
              <Play size={13} />
              See how it works
            </a>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.05))' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="flex-1 mx-3 h-5 rounded-lg bg-white/5 flex items-center px-3">
                <span className="text-[10px] text-gray-500">localhost:3000/dashboard</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
                <p className="text-indigo-300 text-xs font-medium mb-1">Morning Brief · Today</p>
                <p className="text-white font-bold text-xl">You have <span className="text-indigo-300">3 decisions</span> today.</p>
                <p className="text-indigo-200 text-sm mt-0.5">Everything else is handled by Ani.</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Urgent', val: '3', color: 'text-red-400' },
                  { label: 'Auto-handled', val: '14', color: 'text-green-400' },
                  { label: 'Meetings', val: '3', color: 'text-blue-400' },
                  { label: 'Reviews', val: '0', color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 bg-white/5">
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white/5 overflow-hidden divide-y divide-white/5">
                {[
                  { subject: 'New login to X from Firefox on Linux', tag: 'Urgent', color: 'bg-red-500', status: 'Reply drafted' },
                  { subject: '10 Great Free AI Learning Resources', tag: 'Normal', color: 'bg-blue-500', status: 'Reply drafted' },
                  { subject: 'AI/ML Ops Engineer at Marlocks', tag: 'Routine', color: 'bg-gray-500', status: 'Auto-archived' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.color}`} />
                    <span className="text-xs text-gray-300 flex-1 truncate">{row.subject}</span>
                    <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">{row.tag}</span>
                    <span className="text-[10px] text-indigo-400 flex-shrink-0">{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-16 opacity-20 blur-2xl rounded-full bg-indigo-500" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">What Ani does</p>
            <h2 className="text-3xl font-bold text-white">A Chief of Staff that never sleeps</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Every feature is built around one rule: only surface decisions that need a human. Everything else, Ani owns it.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, accent }) => (
              <div key={title}
                className="rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all duration-200 group"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                  <Icon size={17} />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">Integrations</p>
          <h2 className="text-2xl font-bold text-white mb-2">Connected to your whole stack</h2>
          <p className="text-gray-500 text-sm mb-12">Ani works where you already work. No new apps, no behaviour change.</p>
          <div className="flex flex-wrap justify-center gap-6">
            {integrations.map(({ name, color, letter }) => (
              <div key={name} className="flex flex-col items-center gap-2.5">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {letter}
                </div>
                <span className="text-[10px] text-gray-500">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative rounded-3xl p-12 overflow-hidden border border-indigo-500/20"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.08))' }}>
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ background: 'radial-gradient(circle at 50% 0%, #6366f1, transparent 70%)' }} />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/30">
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Ready to get your time back?</h2>
              <p className="text-gray-400 mt-3 mb-8 text-sm leading-relaxed">
                Ani is already connected to Gmail, Calendar, Notion, and Slack.
                Open the dashboard and generate your first briefing in seconds.
              </p>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-sm shadow-xl shadow-indigo-500/30">
                <TrendingUp size={15} />
                Launch Ani Now
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Ani</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 Ani · AI-powered Chief of Staff</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-500 font-medium">Live</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

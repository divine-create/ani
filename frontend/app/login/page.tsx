'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Sparkles, Mail, Shield, Zap, PlayCircle } from 'lucide-react'

export default function LoginPage() {
  const [demoLoading, setDemoLoading] = useState(false)

  async function handleDemo() {
    setDemoLoading(true)
    await signIn('demo', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/30">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Ani</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your AI Chief of Staff.<br />
            Sign in to connect your inbox and calendar.
          </p>
        </div>

        {/* Sign in card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <PlayCircle size={16} />
            {demoLoading ? 'Loading demo…' : 'Try Demo — no sign-in needed'}
          </button>

          <p className="text-xs text-gray-600 text-center mt-3">
            Demo includes pre-loaded emails, tasks, and meeting briefs
          </p>
        </div>

        {/* Feature hints */}
        <div className="space-y-3">
          {[
            { icon: <Mail size={13} />, text: 'Auto-handles routine emails in your writing style' },
            { icon: <Zap size={13} />, text: 'Classifies urgent messages so nothing slips through' },
            { icon: <Shield size={13} />, text: 'You approve every send — nothing goes without you' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-500 text-xs">
              <span className="text-indigo-400 flex-shrink-0">{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

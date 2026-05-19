'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useIntegrations, useSaveIntegration, useRules, useCreateRule, useDeleteRule, useWritingStyle, useSaveWritingStyle, useAutoReply, useSetAutoReply, getAuthToken } from '@/lib/api'
import { Settings, CheckCircle2, XCircle, Mail, Calendar, HardDrive, Star, MessageSquare, FileText, Hash, Clock, Linkedin, Plus, Trash2, Zap, ZapOff, PenLine, Save, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

type IntegrationField = { key: string; label: string; placeholder: string; isExtra?: boolean }
type IntegrationMeta = {
  icon: React.ReactNode
  color: string
  desc: string
  authType: 'oauth' | 'apikey'
  oauthStart?: string
  fields: IntegrationField[]
  helpUrl?: string
}

const INTEGRATION_META: Record<string, IntegrationMeta> = {
  gmail:    { icon: <Mail size={16} />,          color: 'text-red-500 bg-red-50',       desc: 'Inbox triage, auto-replies, commitment extraction', authType: 'oauth', fields: [] },
  calendar: { icon: <Calendar size={16} />,      color: 'text-blue-500 bg-blue-50',     desc: 'Meeting briefs, event-triggered prep', authType: 'oauth', fields: [] },
  drive:    { icon: <HardDrive size={16} />,     color: 'text-yellow-500 bg-yellow-50', desc: 'Document context for meeting briefs', authType: 'oauth', fields: [] },
  gmb:      { icon: <Star size={16} />,          color: 'text-amber-500 bg-amber-50',   desc: 'Review monitoring and auto-responses', authType: 'oauth', fields: [
    { key: 'account_id', label: 'GMB Account ID', placeholder: 'accounts/123456789', isExtra: true },
    { key: 'location_id', label: 'Location ID', placeholder: 'locations/987654321', isExtra: true },
  ]},
  whatsapp: { icon: <MessageSquare size={16} />, color: 'text-green-500 bg-green-50',   desc: 'WhatsApp triage and smart replies via Twilio', authType: 'apikey', helpUrl: 'https://console.twilio.com', fields: [
    { key: 'api_key', label: 'Twilio Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    { key: 'auth_token', label: 'Twilio Auth Token', placeholder: 'your_auth_token', isExtra: true },
    { key: 'phone_number', label: 'WhatsApp Number', placeholder: '+14155238886', isExtra: true },
  ]},
  notion:   { icon: <FileText size={16} />,      color: 'text-gray-700 bg-gray-100',    desc: 'Task creation and status sync', authType: 'oauth', oauthStart: '/oauth/notion/start', fields: [
    { key: 'database_id', label: 'Notion Database ID', placeholder: '32-char database ID from the page URL', isExtra: true },
  ]},
  slack:    { icon: <Hash size={16} />,          color: 'text-purple-500 bg-purple-50', desc: 'Daily briefings and urgent alerts', authType: 'oauth', oauthStart: '/oauth/slack/start', fields: [
    { key: 'channel_id', label: 'Channel ID override', placeholder: 'C0XXXXXXXX (optional, auto-detected from OAuth)', isExtra: true },
  ]},
  calendly: { icon: <Clock size={16} />,         color: 'text-teal-500 bg-teal-50',     desc: 'Booking notifications and prep', authType: 'oauth', oauthStart: '/oauth/calendly/start', fields: [] },
  linkedin: { icon: <Linkedin size={16} />,      color: 'text-blue-700 bg-blue-50',     desc: 'Attendee research via Proxycurl', authType: 'apikey', helpUrl: 'https://nubela.co/proxycurl', fields: [
    { key: 'api_key', label: 'Proxycurl API Key', placeholder: 'your_proxycurl_api_key' },
  ]},
}

const SERVICE_NAMES: Record<string, string> = {
  slack: 'Slack', notion: 'Notion', calendly: 'Calendly',
}

function ConnectedBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const svc = searchParams?.get('connected')
    if (svc) {
      setMsg(`${SERVICE_NAMES[svc] ?? svc} connected successfully!`)
      router.replace('/settings', { scroll: false })
      const t = setTimeout(() => setMsg(null), 5000)
      return () => clearTimeout(t)
    }
  }, [searchParams, router])

  if (!msg) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-4">
      <CheckCircle2 size={16} />
      {msg}
    </div>
  )
}

const SCHEDULES = [
  { time: '7:00 AM',    label: 'Morning Brief',  desc: 'Full inbox + calendar + review summary sent to Slack' },
  { time: 'Every 15m',  label: 'Inbox Sync',     desc: 'Classify new emails, draft replies, extract commitments' },
  { time: 'Every 5m',   label: 'Meeting Prep',   desc: 'Generate brief for meetings starting in ~30 minutes' },
  { time: 'Every 1h',   label: 'Review Check',   desc: 'Scan GMB reviews, auto-post 4-5★ responses' },
  { time: '6:00 PM',    label: 'EOD Summary',    desc: 'What was handled, what needs attention tomorrow' },
]

const CONDITION_TYPES = [
  { value: 'sender',  label: 'Sender email/domain' },
  { value: 'domain',  label: 'Domain (e.g. gmail.com)' },
  { value: 'keyword', label: 'Subject/body keyword' },
  { value: 'intent',  label: 'Message intent' },
]

const ACTIONS = [
  { value: 'auto_reply',  label: 'Auto-reply',   color: 'text-green-600 bg-green-50 border-green-100' },
  { value: 'flag_urgent', label: 'Flag urgent',  color: 'text-red-600 bg-red-50 border-red-100' },
  { value: 'archive',     label: 'Archive',      color: 'text-gray-500 bg-gray-50 border-gray-200' },
  { value: 'create_task', label: 'Create task',  color: 'text-blue-600 bg-blue-50 border-blue-100' },
]

const INTENTS = ['scheduling', 'question', 'follow_up', 'fyi', 'sales', 'complaint', 'praise', 'commitment']

function actionStyle(action: string) {
  return ACTIONS.find(a => a.value === action)?.color ?? 'text-gray-500 bg-gray-50 border-gray-200'
}
function actionLabel(action: string) {
  return ACTIONS.find(a => a.value === action)?.label ?? action
}

function AutoReplySection() {
  const { data } = useAutoReply()
  const toggle = useSetAutoReply()
  const enabled = data?.enabled ?? true

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-gray-500" />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email Auto-Reply</h2>
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Auto-reply to routine emails</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {enabled
                ? 'Ani will automatically send replies to routine emails (newsletters, job alerts, notifications) without your approval.'
                : 'Auto-reply is paused. Routine emails will be queued for your review instead of being sent automatically.'
              }
            </p>
          </div>
          <button
            onClick={() => toggle.mutate(!enabled)}
            disabled={toggle.isPending}
            className={cn(
              'relative ml-4 flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300',
              enabled ? 'bg-green-500' : 'bg-gray-200'
            )}
          >
            <span className={cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300',
              enabled ? 'left-7' : 'left-1'
            )} />
          </button>
        </div>
        <div className={cn(
          'mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs',
          enabled ? 'text-green-600' : 'text-gray-400'
        )}>
          {enabled
            ? <><Zap size={12} /> Auto-reply is <strong>ON</strong> — routine emails are sent automatically</>
            : <><ZapOff size={12} /> Auto-reply is <strong>OFF</strong> — all emails queue for your review</>
          }
        </div>
      </div>
    </section>
  )
}

function RulesSection() {
  const { data, isLoading } = useRules()
  const createRule = useCreateRule()
  const deleteRule = useDeleteRule()

  const [open, setOpen] = useState(false)
  const [condType, setCondType] = useState('sender')
  const [condValue, setCondValue] = useState('')
  const [action, setAction] = useState('auto_reply')

  const rules = data?.rules ?? []

  function handleAdd() {
    if (!condValue.trim()) return
    const labelMap: Record<string, string> = {
      sender: `Sender: ${condValue}`, domain: `Domain: ${condValue}`,
      keyword: `Keyword: ${condValue}`, intent: `Intent: ${condValue}`,
    }
    createRule.mutate({
      name: labelMap[condType] ?? condValue,
      channel: 'gmail',
      condition_type: condType,
      condition_value: condValue.trim().toLowerCase(),
      action,
    }, {
      onSuccess: () => { setCondValue(''); setOpen(false) }
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Automation Rules</h2>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={12} /> Add rule
        </button>
      </div>

      {/* Add rule form */}
      {open && (
        <div className="card p-4 mb-3 border-indigo-100 bg-indigo-50/40">
          <p className="text-xs font-bold text-gray-700 mb-3">New rule — Gmail</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Condition</label>
              <select
                value={condType}
                onChange={e => { setCondType(e.target.value); setCondValue('') }}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              >
                {CONDITION_TYPES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Value</label>
              {condType === 'intent' ? (
                <select
                  value={condValue}
                  onChange={e => setCondValue(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                >
                  <option value="">Select intent…</option>
                  {INTENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              ) : (
                <input
                  value={condValue}
                  onChange={e => setCondValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder={
                    condType === 'sender' ? 'e.g. noreply@indeed.com' :
                    condType === 'domain' ? 'e.g. linkedin.com' :
                    'e.g. invoice'
                  }
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder:text-gray-300"
                />
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Then…</label>
            <div className="flex gap-2">
              {ACTIONS.map(a => (
                <button
                  key={a.value}
                  onClick={() => setAction(a.value)}
                  className={cn(
                    'flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-all',
                    action === a.value ? a.color : 'text-gray-400 bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!condValue.trim() || createRule.isPending}
              className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {createRule.isPending ? 'Saving…' : 'Save rule'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rule list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-14" />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="card p-6 text-center border-dashed">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-2">
            <Zap size={16} className="text-gray-300" />
          </div>
          <p className="text-xs font-semibold text-gray-500">No rules yet</p>
          <p className="text-[11px] text-gray-400 mt-1">Rules override the AI — e.g. always auto-reply to job alerts, always flag legal emails as urgent.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule: any) => (
            <div key={rule.id} className="card p-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800 capitalize">{rule.condition_type}:</span>
                  <code className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{rule.condition_value}</code>
                </div>
              </div>
              <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0', actionStyle(rule.action))}>
                {actionLabel(rule.action)}
              </span>
              <button
                onClick={() => deleteRule.mutate(rule.id)}
                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function WritingStyleSection() {
  const { data } = useWritingStyle()
  const save = useSaveWritingStyle()
  const [sample, setSample] = useState('')
  const [saved, setSaved] = useState(false)

  const currentStyle = data?.style || ''

  function handleSave() {
    if (!sample.trim()) return
    save.mutate([sample.trim()], {
      onSuccess: () => {
        setSample('')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <PenLine size={14} className="text-gray-500" />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Writing Style</h2>
      </div>
      <div className="card p-5 space-y-4">
        {currentStyle ? (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ani's current style profile</p>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 italic">"{currentStyle}"</p>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500">No writing style trained yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Paste a sample email below so Ani learns how you write.</p>
          </div>
        )}
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Add a sample email you wrote
          </label>
          <textarea
            value={sample}
            onChange={e => setSample(e.target.value)}
            placeholder="Paste an email you wrote here. Ani will learn your tone, formality, and style from it..."
            rows={5}
            className="w-full text-xs border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder:text-gray-300 leading-relaxed"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!sample.trim() || save.isPending}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all',
            saved
              ? 'bg-green-50 text-green-600 border border-green-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
          )}
        >
          <Save size={12} />
          {saved ? 'Style saved!' : save.isPending ? 'Saving...' : 'Train on this sample'}
        </button>
      </div>
    </section>
  )
}

function IntegrationCard({ integration }: { integration: { id: string; name: string; connected: boolean } }) {
  const meta = INTEGRATION_META[integration.id]
  const save = useSaveIntegration()
  const [open, setOpen] = useState(false)
  const [vals, setVals] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  if (!meta) return null

  const isOAuth = meta.authType === 'oauth' && !!meta.oauthStart
  const isGoogleLinked = meta.authType === 'oauth' && !meta.oauthStart
  const hasExtraFields = meta.fields.length > 0

  function handleOAuthConnect() {
    const token = getAuthToken()
    if (!token) return
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
    window.location.href = `${backendUrl}${meta.oauthStart}?token=${encodeURIComponent(token)}`
  }

  function handleSave() {
    const extra: Record<string, string> = {}
    for (const f of meta.fields) {
      if (f.isExtra && vals[f.key]) extra[f.key] = vals[f.key]
    }
    // For already-connected OAuth services, don't overwrite the OAuth token
    const api_key = (isOAuth && integration.connected) ? '' : (vals.api_key ?? '')
    save.mutate({ service: integration.id, api_key, extra_data: extra }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => { setSaved(false); setOpen(false) }, 1500)
      }
    })
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
          <p className="text-xs text-gray-400 truncate">{meta.desc}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {integration.connected ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
              <CheckCircle2 size={11} /> Connected
            </span>
          ) : isGoogleLinked ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
              <XCircle size={11} /> Via Google sign-in
            </span>
          ) : isOAuth ? (
            <button
              onClick={handleOAuthConnect}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 transition-all"
            >
              <ExternalLink size={11} /> Connect with {integration.name}
            </button>
          ) : (
            <button
              onClick={() => setOpen(!open)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
                open
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50'
              )}
            >
              {open ? <><ChevronUp size={11} /> Cancel</> : <><Plus size={11} /> Connect</>}
            </button>
          )}
          {/* Edit chevron: show when connected and there are extra fields to configure */}
          {hasExtraFields && (
            <button
              onClick={() => setOpen(!open)}
              className="text-gray-300 hover:text-gray-500 transition-colors"
              title="Configure additional settings"
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {open && hasExtraFields && (
        <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-3">
          {isOAuth && !integration.connected && (
            <p className="text-[11px] text-indigo-600 font-medium">
              Click "Connect with {integration.name}" above first, then come back to set additional options.
            </p>
          )}
          {meta.helpUrl && !isOAuth && (
            <a href={meta.helpUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 font-medium">
              <ExternalLink size={10} /> Get your API key →
            </a>
          )}
          {meta.fields.map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{f.label}</label>
              <input
                type={f.key.includes('token') || f.key === 'api_key' || f.key.includes('auth') ? 'password' : 'text'}
                value={vals[f.key] ?? ''}
                onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 placeholder:text-gray-300 font-mono"
              />
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
              saved
                ? 'bg-green-50 text-green-600 border border-green-100'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
            )}
          >
            <Save size={12} />
            {saved ? 'Saved!' : save.isPending ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { data: intData, isLoading } = useIntegrations()
  const integrations = intData?.integrations ?? []
  const connected = integrations.filter((i: any) => i.connected).length
  const total = integrations.length

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Suspense fallback={null}>
        <ConnectedBanner />
      </Suspense>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          <Settings size={15} className="text-gray-600" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-400">{connected}/{total} integrations connected</p>
        </div>
      </div>

      {/* Integrations */}
      <section>
        <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Integrations</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {integrations.map((integration: { id: string; name: string; connected: boolean }) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        )}
      </section>

      {/* Auto-reply toggle */}
      <AutoReplySection />

      {/* Automation Rules */}
      <RulesSection />

      {/* Writing Style */}
      <WritingStyleSection />

      {/* Automation Schedule */}
      <section>
        <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Automation Schedule</h2>
        <div className="space-y-2">
          {SCHEDULES.map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-4">
              <div className="w-20 flex-shrink-0">
                <p className="text-xs font-bold text-indigo-600 font-mono">{s.time}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Active
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

import { Integration } from '@/lib/types'
import { CheckCircle, XCircle } from 'lucide-react'

export function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{integration.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {integration.connected ? 'Connected' : 'Not connected'}
        </p>
      </div>
      {integration.connected
        ? <CheckCircle size={18} className="text-green-500" />
        : <XCircle size={18} className="text-gray-300" />
      }
    </div>
  )
}

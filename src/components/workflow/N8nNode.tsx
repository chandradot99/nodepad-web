import { Handle, Position } from 'reactflow'

// ─── Category config ───────────────────────────────────────────────────────────

type Category = {
  accent: string
  icon: string
  label: string
  iconBg: string
}

const CATEGORIES: Record<string, Category> = {
  trigger:   { accent: 'bg-orange-500',  icon: '⚡', label: 'Trigger',   iconBg: 'bg-orange-500/20' },
  logic:     { accent: 'bg-purple-500',  icon: '⬡',  label: 'Logic',     iconBg: 'bg-purple-500/20' },
  http:      { accent: 'bg-blue-500',    icon: '↗',  label: 'HTTP',      iconBg: 'bg-blue-500/20'   },
  transform: { accent: 'bg-yellow-500',  icon: '⚙',  label: 'Transform', iconBg: 'bg-yellow-500/20' },
  comms:     { accent: 'bg-green-500',   icon: '✉',  label: 'Comms',     iconBg: 'bg-green-500/20'  },
  database:  { accent: 'bg-red-500',     icon: '⬡',  label: 'Database',  iconBg: 'bg-red-500/20'    },
  default:   { accent: 'bg-gray-500',    icon: '◆',  label: 'Node',      iconBg: 'bg-gray-500/20'   },
}

export function getCategory(nodeType: string): Category {
  const t = nodeType.toLowerCase()
  if (t.includes('trigger') || t.includes('webhook') || t.includes('cron') || t.includes('start') || t.includes('manual')) return CATEGORIES.trigger
  if (t.includes('.if') || t.includes('switch') || t.includes('merge') || t.includes('filter') || t.includes('splitin')) return CATEGORIES.logic
  if (t.includes('http') || t.includes('request')) return CATEGORIES.http
  if (t.includes('code') || t.includes('function') || t.includes('.set') || t.includes('transform')) return CATEGORIES.transform
  if (t.includes('slack') || t.includes('gmail') || t.includes('email') || t.includes('telegram') || t.includes('discord')) return CATEGORIES.comms
  if (t.includes('postgres') || t.includes('mysql') || t.includes('mongo') || t.includes('redis') || t.includes('database')) return CATEGORIES.database
  return CATEGORIES.default
}

// ─── Component ─────────────────────────────────────────────────────────────────

export interface N8nNodeData {
  label:       string
  nodeType:    string
  parameters:  Record<string, any>
  credentials: Record<string, any>
  disabled:    boolean
  notes?:      string
  typeVersion?: number
}

export default function N8nNode({ data, selected }: { data: N8nNodeData; selected?: boolean }) {
  const cat = getCategory(data.nodeType)
  const shortType = data.nodeType?.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() ?? 'Node'

  return (
    <div className={`relative bg-gray-800 border rounded-lg min-w-[170px] max-w-[220px] shadow-2xl overflow-hidden transition-all ${
      selected
        ? 'border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.25)]'
        : 'border-gray-600 hover:border-gray-400'
    } ${data.disabled ? 'opacity-40' : ''}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cat.accent}`} />

      <div className="pl-4 pr-3 py-2.5">
        {/* Icon + type row */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${cat.iconBg}`}>
            {cat.icon}
          </div>
          <span className="text-xs text-gray-400 truncate">{shortType}</span>
        </div>
        {/* Node name */}
        <div className="text-sm font-semibold text-white truncate">{data.label}</div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-700 !border-2 !border-gray-500 hover:!border-gray-300 !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gray-700 !border-2 !border-gray-500 hover:!border-gray-300 !-right-1.5"
      />
    </div>
  )
}

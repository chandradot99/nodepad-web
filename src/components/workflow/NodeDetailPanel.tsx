import { useState } from 'react'
import { getCategory, type N8nNodeData } from './N8nNode'

// ─── Parameter value renderer ──────────────────────────────────────────────────

function ParamRow({ name, value }: { name: string; value: any }) {
  const [expanded, setExpanded] = useState(false)

  const label = name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())

  // Complex object/array — expandable
  if (value !== null && typeof value === 'object') {
    const isEmpty = Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0
    const preview = Array.isArray(value) ? `[${value.length} items]` : `{${Object.keys(value).length} keys}`
    return (
      <div className="py-2 border-t border-gray-800 first:border-t-0">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-left group"
        >
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors font-mono">
            {isEmpty ? '—' : preview} {!isEmpty && (expanded ? '▲' : '▼')}
          </span>
        </button>
        {expanded && !isEmpty && (
          <pre className="mt-2 text-xs text-gray-300 font-mono bg-gray-900 rounded-md p-3 overflow-auto max-h-48 leading-relaxed">
            {JSON.stringify(value, null, 2)}
          </pre>
        )}
      </div>
    )
  }

  // Long string or multiline (e.g. code)
  if (typeof value === 'string' && (value.length > 80 || value.includes('\n'))) {
    const isExpression = value.startsWith('=')
    return (
      <div className="py-2 border-t border-gray-800 first:border-t-0">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-left group"
        >
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
            {isExpression ? 'expression' : 'text'} {expanded ? '▲' : '▼'}
          </span>
        </button>
        {expanded && (
          <pre className={`mt-2 text-xs font-mono rounded-md p-3 overflow-auto max-h-48 leading-relaxed ${
            isExpression ? 'text-yellow-300 bg-yellow-500/5' : 'text-gray-300 bg-gray-900'
          }`}>
            {value}
          </pre>
        )}
        {!expanded && (
          <p className={`text-xs font-mono truncate mt-1 ${isExpression ? 'text-yellow-400' : 'text-gray-500'}`}>
            {value.slice(0, 60)}…
          </p>
        )}
      </div>
    )
  }

  // Primitive value
  const isExpression = typeof value === 'string' && value.startsWith('=')
  const isEmpty = value === '' || value === null || value === undefined

  return (
    <div className="flex items-start justify-between gap-4 py-2 border-t border-gray-800 first:border-t-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-xs text-right break-all font-mono ${
        isEmpty        ? 'text-gray-600 italic not-italic font-sans'
        : isExpression ? 'text-yellow-400'
        : typeof value === 'boolean' ? (value ? 'text-green-400' : 'text-gray-500')
        : typeof value === 'number'  ? 'text-blue-400'
        : 'text-gray-300'
      }`}>
        {isEmpty ? '—' : String(value)}
      </span>
    </div>
  )
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

interface Props {
  node: N8nNodeData
  onClose: () => void
}

export default function NodeDetailPanel({ node, onClose }: Props) {
  const cat = getCategory(node.nodeType)
  const shortType = node.nodeType?.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() ?? 'Node'
  const paramKeys = Object.keys(node.parameters ?? {})
  const credKeys  = Object.keys(node.credentials ?? {})

  return (
    <div className="w-[300px] shrink-0 bg-gray-950 border-l border-gray-800 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3.5 border-b border-gray-800 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${cat.iconBg}`}>
              {cat.icon}
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{shortType}</span>
          </div>
          <h2 className="text-sm font-semibold text-white leading-tight">{node.label}</h2>
          {node.typeVersion && (
            <p className="text-[10px] text-gray-600 font-mono mt-0.5">v{node.typeVersion}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-3 w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors text-base shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Disabled badge */}
        {node.disabled && (
          <div className="mx-4 mt-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-xs text-yellow-400">This node is disabled</p>
          </div>
        )}

        {/* Notes */}
        {node.notes && (
          <div className="px-4 pt-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-xs text-gray-400 leading-relaxed">{node.notes}</p>
          </div>
        )}

        {/* Parameters */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Parameters</p>
          {paramKeys.length === 0 ? (
            <p className="text-xs text-gray-600 py-2">No parameters configured</p>
          ) : (
            <div>
              {paramKeys.map((key) => (
                <ParamRow key={key} name={key} value={node.parameters[key]} />
              ))}
            </div>
          )}
        </div>

        {/* Credentials */}
        {credKeys.length > 0 && (
          <div className="px-4 pt-3 pb-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Credentials</p>
            <div className="space-y-1.5">
              {credKeys.map((type) => (
                <div key={type} className="flex items-center gap-2.5 bg-gray-800 rounded-md px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-300 truncate">
                      {node.credentials[type]?.name ?? type}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate font-mono">{type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Node type footer */}
        <div className="px-4 pb-4 pt-2">
          <p className="text-[10px] text-gray-700 font-mono">{node.nodeType}</p>
        </div>

      </div>
    </div>
  )
}

import { useEffect, useState, useCallback, useRef } from 'react'
import client from '../../api/client'
import type { Message } from '../../types'

interface Props {
  workflowId: string
}

export default function ChatPanel({ workflowId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude_api_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('claude_api_key'))
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    client.post(`/workflows/${workflowId}/conversations`, { title: 'Chat' })
      .then(r => {
        setConversationId(r.data.id)
        return client.get(`/conversations/${r.data.id}/messages`).catch(() => ({ data: [] }))
      })
      .then(r => setMessages(r.data || []))
      .catch(() => {})
  }, [workflowId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const saveApiKey = () => {
    localStorage.setItem('claude_api_key', apiKey)
    setShowKeyInput(false)
  }

  const send = useCallback(async () => {
    if (!input.trim() || !conversationId || !apiKey || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      conversation_id: conversationId,
      inserted_at: '',
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const { data } = await client.post(`/conversations/${conversationId}/messages`, {
        content,
        claude_api_key: apiKey,
      })
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        conversation_id: conversationId,
        inserted_at: '',
      }])
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Failed to get a response.'
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errMsg}`,
        conversation_id: conversationId,
        inserted_at: '',
      }])
    } finally {
      setSending(false)
    }
  }, [input, conversationId, apiKey, sending])

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h2 className="text-sm font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={() => setShowKeyInput(v => !v)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {showKeyInput ? 'Cancel' : '🔑 API Key'}
        </button>
      </div>

      {/* API key input */}
      {showKeyInput && (
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 space-y-2 shrink-0">
          <p className="text-xs text-gray-400">Your Claude API key — stored locally, never sent to our servers</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
              placeholder="sk-ant-..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
            <button
              onClick={saveApiKey}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !sending && (
          <div className="text-center mt-12 space-y-2">
            <p className="text-2xl">✦</p>
            <p className="text-gray-400 text-sm">Ask me to modify this workflow</p>
            <p className="text-gray-600 text-xs">e.g. "Add a Slack notification after the last step"</p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mr-2 mt-0.5">A</div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-800 text-gray-100 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">A</div>
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800 shrink-0">
        {!apiKey && !showKeyInput && (
          <button
            onClick={() => setShowKeyInput(true)}
            className="w-full text-xs text-yellow-400 hover:text-yellow-300 mb-2 text-left transition-colors"
          >
            ⚠ Set your Claude API key to start chatting →
          </button>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={apiKey ? 'Ask to modify this workflow...' : 'API key required'}
            rows={2}
            disabled={!apiKey}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-600 disabled:opacity-40 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || !apiKey || sending}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

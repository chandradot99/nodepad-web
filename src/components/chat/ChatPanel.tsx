import { useEffect, useState, useCallback, useRef } from 'react'
import client from '../../api/client'
import type { Message, Credential } from '../../types'

// Friendly display names for common n8n credential types
const CREDENTIAL_LABELS: Record<string, string> = {
  googleSheetsOAuth2Api: 'Google Sheets',
  gmailOAuth2: 'Gmail',
  googleDriveOAuth2Api: 'Google Drive',
  googleCalendarOAuth2Api: 'Google Calendar',
  slackApi: 'Slack',
  slackOAuth2Api: 'Slack',
  telegramApi: 'Telegram',
  discordApi: 'Discord',
  githubApi: 'GitHub',
  githubOAuth2Api: 'GitHub',
  notionApi: 'Notion',
  airtableApi: 'Airtable',
  postgresDb: 'PostgreSQL',
  mysqlDb: 'MySQL',
  mongoDb: 'MongoDB',
  redisDb: 'Redis',
  httpBasicAuth: 'HTTP Basic',
  httpHeaderAuth: 'HTTP Header',
}

function credentialLabel(type: string) {
  return CREDENTIAL_LABELS[type] ?? type.replace(/([A-Z])/g, ' $1').trim()
}

interface Props {
  workflowId: string
  credentials: Credential[]
}

export default function ChatPanel({ workflowId, credentials }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude_api_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('claude_api_key'))
  const [showCredentials, setShowCredentials] = useState(false)
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
    <div className="flex flex-col h-full bg-surface border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <h2 className="text-xs font-semibold text-text">AI Assistant</h2>
        </div>
        <button
          onClick={() => setShowKeyInput(v => !v)}
          className="text-xs text-text-muted hover:text-text transition-colors"
        >
          {showKeyInput ? 'Cancel' : '🔑 API Key'}
        </button>
      </div>

      {/* API key input */}
      {showKeyInput && (
        <div className="px-4 py-3 border-b border-border bg-bg space-y-2 shrink-0">
          <p className="text-xs text-text-muted">Your Claude API key — stored locally, never sent to our servers</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
              placeholder="sk-ant-..."
              className="input flex-1 px-2 py-1.5 text-sm"
            />
            <button
              onClick={saveApiKey}
              className="px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent-hover text-xs font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Credentials */}
      <div className="border-b border-border shrink-0">
        <button
          onClick={() => setShowCredentials(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>🔐</span>
            <span className="font-medium">Available Credentials</span>
            {credentials.length > 0 && (
              <span className="bg-surface-raised text-text-muted rounded-full px-1.5 py-0.5 text-[10px]">{credentials.length}</span>
            )}
          </div>
          <span>{showCredentials ? '▲' : '▼'}</span>
        </button>
        {showCredentials && (
          <div className="px-4 pb-3 space-y-1.5">
            {credentials.length > 0 ? credentials.map(cred => (
              <div key={cred.id} className="flex items-center gap-2 bg-surface-raised border border-border rounded-md px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-text truncate">{cred.name}</div>
                  <div className="text-xs text-text-muted truncate">{credentialLabel(cred.type)}</div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-text-muted text-center py-1">
                Credentials API not supported by this n8n version.<br />
                You can still reference credentials by name in chat.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !sending && (
          <div className="text-center mt-12 space-y-2">
            <p className="text-xl opacity-30">✦</p>
            <p className="text-text-muted text-sm">Ask me to modify this workflow</p>
            <p className="text-text-muted text-xs opacity-50">e.g. "Add a Slack notification after the last step"</p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold shrink-0 mr-2 mt-0.5">A</div>
            )}
            <div className={`max-w-[85%] px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent text-white rounded-2xl rounded-tr-sm'
                : 'bg-surface-raised text-text rounded-2xl rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">A</div>
            <div className="bg-surface-raised px-4 py-2.5 rounded-2xl rounded-tl-sm flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        {!apiKey && !showKeyInput && (
          <button
            onClick={() => setShowKeyInput(true)}
            className="w-full text-xs text-yellow-500 hover:text-yellow-400 mb-2 text-left transition-colors"
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
            className="input flex-1 px-3 py-2.5 text-sm resize-none disabled:opacity-40"
          />
          <button
            onClick={send}
            disabled={!input.trim() || !apiKey || sending}
            className="w-9 h-9 bg-accent text-white rounded-full hover:bg-accent-hover text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

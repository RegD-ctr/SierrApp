import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'

interface SupportProps {
  onBack: () => void
  orderId?: string
}

interface SupportMessageItem {
  id: string
  userId: string
  orderId?: string | null
  autor: 'USUARIO' | 'SOPORTE'
  mensaje: string
  createdAt: string
}

export default function Support({ onBack, orderId }: SupportProps) {
  const initialText = orderId
    ? `Tengo una pregunta sobre mi pedido #${orderId.slice(0, 8).toUpperCase()}: `
    : ''
  const [msg, setMsg] = useState(initialText)
  const [messages, setMessages] = useState<SupportMessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<SupportMessageItem[]>('/api/support/messages')
      setMessages(data || [])
    } catch (err: any) {
      console.error('Error al cargar mensajes de soporte:', err)
      setError(err?.message || 'Error al cargar mensajes de soporte.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleMessage = (message: SupportMessageItem) => {
      if (message.autor === 'SOPORTE') {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev
          return [...prev, message]
        })
      }
    }

    socket.on('support:message', handleMessage)
    return () => {
      socket.off('support:message', handleMessage)
    }
  }, [])

  const send = async () => {
    const texto = msg.trim()
    if (!texto || sending) return
    setSending(true)
    setError(null)
    try {
      const payload: { mensaje: string; orderId?: string } = { mensaje: texto }
      if (orderId) payload.orderId = orderId

      const nuevo = await api.post<SupportMessageItem>('/api/support/messages', payload)
      setMessages(prev => [...prev, nuevo])
      setMsg('')
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err)
      setError(err?.message || 'Error al enviar mensaje de soporte.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide leading-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              Soporte y Ayuda
            </h1>
            <p className="text-[10px] text-[#5bc827] font-semibold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5bc827] animate-pulse" /> En línea
            </p>
          </div>
        </div>
        {orderId && (
          <span className="text-[10px] font-mono text-[#d9a05b] bg-[#d9a05b]/10 border border-[#d9a05b]/30 px-2 py-0.5 rounded">
            Pedido #{orderId.slice(0, 8)}
          </span>
        )}
      </header>

      {error && (
        <div className="bg-red-950/40 border-b border-red-500/40 px-4 py-2 text-xs text-red-300 text-center">
          {error}
        </div>
      )}

      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col space-y-3 pb-24 overflow-y-auto">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#5bc827] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#9a9da3] text-sm">Cargando conversación...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#5bc827]/10 border border-[#5bc827]/30 flex items-center justify-center text-2xl mb-3">
              💬
            </div>
            <p className="text-white font-bold text-sm">¿En qué podemos ayudarte?</p>
            <p className="text-[#9a9da3] text-xs mt-1 max-w-xs">
              Escribe un mensaje para comunicarte directamente con nuestro equipo de soporte de Sierra App.
            </p>
          </div>
        ) : (
          messages.map(m => {
            const isUser = m.autor === 'USUARIO'
            const hora = m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              : ''

            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                    isUser
                      ? 'bg-[#5bc827] text-[#1a1b1e] rounded-br-none font-medium'
                      : 'bg-[#232427] border border-[#35373b] text-white rounded-bl-none'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-[#d9a05b]">
                      <span>🛡️</span>
                      <span>Soporte Sierra</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.mensaje}</p>
                  <p className={`text-[10px] text-right mt-1 ${isUser ? 'text-[#1a1b1e]/70' : 'text-[#9a9da3]'}`}>
                    {hora}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b] z-40">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <input
            type="text"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            disabled={sending}
            placeholder={orderId ? "Describe tu consulta sobre este pedido..." : "Escribe tu mensaje..."}
            className="flex-1 bg-[#232427] border border-[#35373b] rounded-full px-4 py-3 text-sm text-white placeholder-[#9a9da3] focus:outline-none focus:border-[#5bc827] transition-colors disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!msg.trim() || sending}
            className="bg-[#5bc827] text-[#1a1b1e] rounded-full p-3 hover:bg-[#7ed944] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer flex-shrink-0"
            aria-label="Enviar mensaje"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-[#1a1b1e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

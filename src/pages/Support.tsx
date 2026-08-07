import { useState } from 'react'

export default function Support({ onBack }: { onBack: () => void }) {
  const [msg, setMsg] = useState('')
  const [chat, setChat] = useState([
    { id: 1, sender: 'bot', text: '¡Hola! ¿En qué podemos ayudarte con tu pedido?' }
  ])

  const send = () => {
    if (!msg.trim()) return
    setChat([...chat, { id: Date.now(), sender: 'user', text: msg }])
    setMsg('')
    setTimeout(() => {
      setChat(c => [...c, { id: Date.now(), sender: 'bot', text: 'Un agente te atenderá en breve. Gracias por tu paciencia.' }])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Soporte</h1>
      </header>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col space-y-4 pb-24">
        {chat.map(c => (
          <div key={c.id} className={`flex ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${c.sender === 'user' ? 'bg-[#5bc827] text-[#1a1b1e]' : 'bg-[#232427] border border-[#35373b] text-white'}`}>
              {c.text}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1a1b1e]/95 backdrop-blur-sm border-t border-[#35373b]">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-[#232427] border border-[#35373b] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#5bc827] transition-colors"
          />
          <button
            onClick={send}
            className="bg-[#5bc827] text-[#1a1b1e] rounded-full p-2.5 hover:bg-[#7ed944] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Notifications({ onBack }: { onBack: () => void }) {
  const notifs = [
    { id: 1, type: 'order', text: 'Tu pedido en El Rincón del Sabor ha sido aceptado.', time: 'Hace 5 min', unread: true },
    { id: 2, type: 'promo', text: '¡Tienes un cupón de 20% de descuento esperándote!', time: 'Hace 2 horas', unread: true },
    { id: 3, type: 'info', text: 'Bienvenido a Sierra App. Explora nuestros restaurantes.', time: 'Hace 1 día', unread: false },
  ]

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Notificaciones</h1>
      </header>

      <div className="max-w-lg mx-auto w-full">
        {notifs.map(n => (
          <div key={n.id} className={`p-4 border-b border-[#35373b] flex gap-3 ${n.unread ? 'bg-[#232427]' : 'bg-transparent'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
              n.type === 'order' ? 'bg-orange-500/20 text-orange-400' :
              n.type === 'promo' ? 'bg-[#5bc827]/20 text-[#5bc827]' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {n.type === 'order' ? '🛵' : n.type === 'promo' ? '🏷️' : '👋'}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${n.unread ? 'font-semibold text-white' : 'text-[#c4c6ca]'}`}>{n.text}</p>
              <p className="text-[#9a9da3] text-xs mt-1">{n.time}</p>
            </div>
            {n.unread && <div className="w-2 h-2 rounded-full bg-[#5bc827] mt-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface DeliveryItem {
  id: string
  total?: number
  comisionRepartidorFija?: number
  updatedAt?: string
  createdAt?: string
  [key: string]: any
}

export default function EarningsRepartidor({ onBack }: { onBack: () => void }) {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await api.get<DeliveryItem[]>('/api/orders/me/deliveries')
        if (mounted) setDeliveries(data || [])
      } catch (err) {
        console.error('Error cargando historial de entregas:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Cálculo en cliente temporal (hasta disponer de un endpoint de agregación en backend)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  // Inicio de semana actual (lunes)
  const day = now.getDay()
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1)
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday).getTime()

  let totalHoy = 0
  let totalSemana = 0
  let countHoy = 0

  deliveries.forEach(d => {
    const comision = Number(d.comisionRepartidorFija ?? 20)
    const t = new Date(d.updatedAt || d.createdAt || Date.now()).getTime()
    if (t >= startOfToday) {
      totalHoy += comision
      countHoy += 1
    }
    if (t >= startOfWeek) {
      totalSemana += comision
    }
  })

  const history = deliveries.map(h => ({
    id: `#${h.id.slice(0, 8)}`,
    time: new Date(h.updatedAt || h.createdAt || Date.now()).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    amount: `+$${Number(h.comisionRepartidorFija ?? 20).toFixed(2)}`,
  }))

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-[#9a9da3] hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Mis Ganancias</h1>
      </header>

      <div className="p-4 max-w-lg mx-auto w-full space-y-6">
        <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-6 text-center">
          <p className="text-[#9a9da3] text-sm uppercase tracking-wider mb-2">Ganancias de hoy</p>
          <p className="text-5xl font-bold text-[#5bc827] mb-6" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            ${totalHoy.toFixed(2)}
          </p>
          
          <div className="grid grid-cols-2 gap-4 border-t border-[#35373b] pt-4">
            <div>
              <p className="text-[#9a9da3] text-xs mb-1">Esta semana</p>
              <p className="font-semibold">${totalSemana.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[#9a9da3] text-xs mb-1">Entregas hoy</p>
              <p className="font-semibold">{countHoy}</p>
            </div>
          </div>
        </div>

        {/* Botón de retiro deshabilitado pendiente de endpoint en backend */}
        <button
          disabled
          title="Próximamente: solicitud de retiro"
          className="w-full py-4 rounded-xl bg-[#5bc827]/40 text-[#1a1b1e]/70 font-bold text-base cursor-not-allowed transition-all"
        >
          Solicitar retiro (Próximamente)
        </button>

        <div>
          <h2 className="text-[#9a9da3] text-sm font-semibold mb-3 uppercase tracking-wider">
            Historial reciente ({history.length})
          </h2>
          {loading ? (
            <p className="text-[#9a9da3] text-sm text-center py-6">Cargando ganancias...</p>
          ) : history.length === 0 ? (
            <div className="bg-[#232427] border border-[#35373b] rounded-xl p-8 text-center">
              <span className="text-4xl block mb-2">💰</span>
              <p className="text-white font-medium text-sm">Sin ganancias registradas</p>
              <p className="text-[#9a9da3] text-xs mt-1">Completa entregas para ver tus comisiones aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h, idx) => (
                <div key={`${h.id}-${idx}`} className="bg-[#232427] border border-[#35373b] rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">Pedido {h.id}</p>
                    <p className="text-[#9a9da3] text-xs">{h.time}</p>
                  </div>
                  <p className="text-[#5bc827] font-bold">{h.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


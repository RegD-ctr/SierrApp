import { useState } from 'react'

interface Props {
  restaurantName: string
  driverName: string
  onSubmit: (ratings: { restaurant: number; driver: number; comment?: string }) => void
  onSkip: () => void
}

/**
 * Componente para calificar la entrega de un pedido al completarse.
 * Permite calificar de forma independiente al restaurante y al repartidor con 5 estrellas,
 * agregar comentarios opcionales o bien omitir la evaluación.
 * 
 * @param {Props} props - Nombres de los evaluados y funciones callbacks.
 */
export default function RateOrder({ restaurantName, driverName, onSubmit, onSkip }: Props) {
  const [restaurantRating, setRestaurantRating] = useState(0)
  const [driverRating, setDriverRating] = useState(0)
  const [hoverRest, setHoverRest] = useState(0)
  const [hoverDriver, setHoverDriver] = useState(0)
  const [comment, setComment] = useState('')

  const isValid = restaurantRating > 0 && driverRating > 0

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit({
      restaurant: restaurantRating,
      driver: driverRating,
      comment: comment.trim() || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col items-center justify-center p-4">
      <div className="bg-[#232427] border border-[#35373b] rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-[#5bc827]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            ¡Pedido entregado!
          </h1>
          <p className="text-[#9a9da3] text-sm">Cuéntanos cómo fue tu experiencia</p>
        </div>

        {/* Sección 1: Calificación del Restaurante */}
        <div className="bg-[#1a1b1e] border border-[#35373b] rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs uppercase tracking-wider text-[#9a9da3] font-semibold">Restaurante</p>
          <h3 className="font-bold text-white text-base">{restaurantName}</h3>
          
          <div className="flex justify-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRest(star)}
                onMouseLeave={() => setHoverRest(0)}
                onClick={() => setRestaurantRating(star)}
                className="text-3xl transition-transform hover:scale-125 focus:outline-none"
              >
                <span className={(hoverRest || restaurantRating) >= star ? 'text-[#5bc827]' : 'text-[#35373b]'}>
                  ★
                </span>
              </button>
            ))}
          </div>
          {restaurantRating > 0 && (
            <p className="text-xs text-[#5bc827] font-semibold pt-1">
              {['Malo', 'Regular', 'Bueno', 'Muy Bueno', '¡Excelente!'][restaurantRating - 1]}
            </p>
          )}
        </div>

        {/* Sección 2: Calificación del Repartidor */}
        <div className="bg-[#1a1b1e] border border-[#35373b] rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs uppercase tracking-wider text-[#9a9da3] font-semibold">Repartidor</p>
          <h3 className="font-bold text-white text-base">{driverName}</h3>
          
          <div className="flex justify-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverDriver(star)}
                onMouseLeave={() => setHoverDriver(0)}
                onClick={() => setDriverRating(star)}
                className="text-3xl transition-transform hover:scale-125 focus:outline-none"
              >
                <span className={(hoverDriver || driverRating) >= star ? 'text-[#5bc827]' : 'text-[#35373b]'}>
                  ★
                </span>
              </button>
            ))}
          </div>
          {driverRating > 0 && (
            <p className="text-xs text-[#5bc827] font-semibold pt-1">
              {['Malo', 'Regular', 'Bueno', 'Muy Bueno', '¡Excelente!'][driverRating - 1]}
            </p>
          )}
        </div>

        {/* Campo opcional de comentarios */}
        <div className="space-y-1">
          <label className="text-xs text-[#9a9da3] font-semibold">Comentarios adicionales (opcional)</label>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="¿Algo que quieras destacar sobre la entrega o la comida?..."
            className="w-full bg-[#1a1b1e] border border-[#35373b] focus:border-[#5bc827] rounded-xl p-3 text-sm text-white placeholder-[#9a9da3] outline-none transition-colors resize-none"
          />
        </div>

        {/* Acciones */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              isValid
                ? 'bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] hover:scale-[1.01] active:scale-98 cursor-pointer'
                : 'bg-[#35373b] text-[#9a9da3] cursor-not-allowed'
            }`}
          >
            Enviar calificación
          </button>

          <button
            onClick={onSkip}
            className="w-full py-2 text-xs font-semibold text-[#9a9da3] hover:text-white transition-colors cursor-pointer text-center"
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    </div>
  )
}

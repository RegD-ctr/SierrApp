import { useState } from 'react'

interface OnboardingProps {
  onComplete: () => void
  onBack?: () => void
}

export default function Onboarding({ onComplete, onBack }: OnboardingProps) {
  const [slide, setSlide] = useState(0)

  const slides = [
    {
      title: 'Tus antojos,\na la puerta',
      desc: 'Encuentra los mejores restaurantes locales con envío rápido y seguro. \n En el Salto Pueblo Nuevo Durango.',
      emoji: '🍔',
    },
    {
      title: 'Ofertas\nexclusivas',
      desc: 'Aprovecha promociones diarias y envíos gratis en tus lugares favoritos.',
      emoji: '🏷️',
    },
    {
      title: 'Rastrea en\ntiempo real',
      desc: 'Sigue tu pedido desde la cocina hasta la puerta de tu casa.',
      emoji: '🛵',
    }
  ]

  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col relative overflow-hidden">
      {/* Top navigation */}
      <div className="relative z-20 flex items-center justify-between p-6">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[#9a9da3] hover:text-[#5bc827] text-sm transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        ) : <div />}

        <button
          onClick={onComplete}
          className="text-xs text-[#9a9da3] hover:text-white transition-colors cursor-pointer"
        >
          Saltar
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#5bc827]/10 rounded-full blur-3xl" />
        
        <div className="text-8xl mb-8 z-10 animate-bounce">{slides[slide].emoji}</div>
        
        <h1 className="text-4xl font-bold uppercase tracking-wide mb-4 whitespace-pre-line z-10" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          {slides[slide].title}
        </h1>
        <p className="text-[#9a9da3] text-sm max-w-xs z-10">
          {slides[slide].desc}
        </p>
      </div>

      <div className="p-6 pb-12 relative z-10">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-6 bg-[#5bc827]' : 'w-1.5 bg-[#35373b]'}`} />
          ))}
        </div>
        
        <button
          onClick={() => slide < slides.length - 1 ? setSlide(s => s + 1) : onComplete()}
          className="w-full py-4 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5bc827]/20 cursor-pointer"
        >
          {slide < slides.length - 1 ? 'Siguiente' : 'Comenzar registro'}
        </button>
      </div>
    </div>
  )
}

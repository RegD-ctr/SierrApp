interface PrivacidadProps {
  onBack: () => void
}

export default function Privacidad({ onBack }: PrivacidadProps) {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1a1b1e]/95 backdrop-blur-sm border-b border-[#35373b] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-[#9a9da3] hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-[#232427]"
            title="Regresar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1
              className="text-xl font-bold uppercase tracking-wide leading-tight text-white"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Aviso de Privacidad
            </h1>
            <p className="text-[10px] text-[#5bc827] font-semibold uppercase tracking-wider">
              Protección de Datos · Sierra App
            </p>
          </div>
        </div>
        <span className="text-xl">🔒</span>
      </header>

      {/* Contenido */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6 pb-20 text-[#c4c6ca] text-sm leading-relaxed">
        <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 text-xs text-[#9a9da3]">
          <p>
            <strong className="text-white">Última actualización:</strong> Octubre 2026.
          </p>
          <p className="mt-1">
            En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
            (LFPDPPP) y su Reglamento, Sierra App emite el presente Aviso de Privacidad Integral.
          </p>
        </div>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>1.</span> Responsable del Tratamiento
          </h2>
          <p>
            Sierra App, con domicilio de operaciones en El Salto, Municipio de Pueblo Nuevo, Durango, México, es
            responsable del uso, tratamiento y salvaguarda de la información personal recabada a través de nuestra
            aplicación web y móvil.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>2.</span> Datos Personales que Recabamos
          </h2>
          <p>Para la correcta prestación de nuestros servicios, recabamos las siguientes categorías de datos:</p>
          <ul className="list-disc list-inside space-y-1 text-xs pl-2 text-[#9a9da3]">
            <li><strong className="text-white">Datos de identificación:</strong> Nombre completo, correo electrónico y fotografía de perfil (en caso de repartidores).</li>
            <li><strong className="text-white">Datos de contacto:</strong> Número de teléfono celular y domicilios de entrega (calle, número, colonia, referencias).</li>
            <li><strong className="text-white">Datos de geolocalización:</strong> Ubicación en tiempo real durante la entrega activa de pedidos para repartidores y clientes.</li>
            <li><strong className="text-white">Datos transaccionales:</strong> Historial de compras, tickets, valoraciones y métodos de pago registrados.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>3.</span> Finalidades Primarias del Tratamiento
          </h2>
          <p>Sus datos personales son indispensables para las siguientes finalidades primarias:</p>
          <ul className="list-disc list-inside space-y-1 text-xs pl-2 text-[#9a9da3]">
            <li>Creación, autenticación y administración de su cuenta en la plataforma.</li>
            <li>Procesamiento, preparación y despacho de pedidos solicitados a los comercios.</li>
            <li>Asignación de rutas y entrega de pedidos mediante repartidores asignados.</li>
            <li>Emisión de comprobantes y comunicación de soporte ante incidencias.</li>
            <li>Garantizar la seguridad física y digital de usuarios, comercios y repartidores.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>4.</span> Finalidades Secundarias
          </h2>
          <p>
            De forma optativa, podemos emplear sus datos para enviarle promociones, cupones de descuento y encuestas de satisfacción.
            Usted puede revocar en cualquier momento su consentimiento para estas finalidades enviando una solicitud a soporte.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>5.</span> Transferencia de Datos
          </h2>
          <p>
            Sierra App no vende ni comparte su información personal con terceros ajenos al servicio. Sus datos de entrega y teléfono
            únicamente se comparten de forma temporal y restringida con el restaurante y repartidor asignados a su orden activa.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>6.</span> Ejercicio de Derechos ARCO
          </h2>
          <p>
            Usted tiene derecho a conocer qué datos personales conservamos, para qué los utilizamos y las condiciones de su uso (Acceso).
            Asimismo, tiene derecho a solicitar la corrección de su información (Rectificación), que la eliminemos de nuestros registros
            (Cancelación) o a oponerse al uso de sus datos para fines específicos (Oposición).
          </p>
          <p>
            Para ejercer sus derechos ARCO, puede comunicarse directamente desde el módulo de Soporte de la aplicación o al correo
            privacidad@sierraapp.com.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>7.</span> Seguridad de la Información
          </h2>
          <p>
            Implementamos medidas de seguridad administrativas, técnicas y físicas avanzadas como cifrado TLS/SSL y almacenamiento
            seguro de contraseñas mediante hashing para proteger sus datos personales contra daño, pérdida, alteración o uso no autorizado.
          </p>
        </section>

        <div className="pt-4 border-t border-[#35373b]">
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-[#5bc827] hover:bg-[#7ed944] text-[#1a1b1e] font-bold text-sm transition-all cursor-pointer shadow-lg shadow-[#5bc827]/10"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

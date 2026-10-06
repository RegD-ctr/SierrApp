interface TerminosProps {
  onBack: () => void
}

export default function Terminos({ onBack }: TerminosProps) {
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
              Términos y Condiciones
            </h1>
            <p className="text-[10px] text-[#5bc827] font-semibold uppercase tracking-wider">
              Sierra App · El Salto, Pueblo Nuevo, Dgo.
            </p>
          </div>
        </div>
        <span className="text-xl">📋</span>
      </header>

      {/* Contenido */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6 pb-20 text-[#c4c6ca] text-sm leading-relaxed">
        <div className="bg-[#232427] border border-[#35373b] rounded-2xl p-4 text-xs text-[#9a9da3]">
          <p>
            <strong className="text-white">Última actualización:</strong> Octubre 2026.
          </p>
          <p className="mt-1">
            Por favor, lee atentamente estos Términos y Condiciones antes de utilizar los servicios de Sierra App.
            Al registrarte o utilizar nuestra plataforma, aceptas quedar vinculado por las presentes condiciones.
          </p>
        </div>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>1.</span> Objeto y Alcance de la Plataforma
          </h2>
          <p>
            Sierra App es una plataforma tecnológica digital de intermediación que conecta a consumidores finales
            con comercios o restaurantes locales y repartidores independientes dentro del municipio de Pueblo Nuevo,
            Durango, con cobertura principal en la cabecera municipal de El Salto.
          </p>
          <p>
            Sierra App no elabora alimentos ni productos comercializados por los restaurantes afiliados, ni presta
            directamente servicios de transporte vehicular, actuando únicamente como intermediario tecnológico.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>2.</span> Registro de Cuentas y Responsabilidad
          </h2>
          <p>
            Para acceder a pedidos o prestar servicios en la plataforma, es indispensable contar con una cuenta activa.
            El usuario se compromete a:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs pl-2 text-[#9a9da3]">
            <li>Proporcionar información fidedigna, completa y actualizada durante el registro.</li>
            <li>Mantener en estricta confidencialidad sus credenciales de acceso y contraseña.</li>
            <li>Notificar de inmediato a Sierra App ante cualquier uso no autorizado de su cuenta.</li>
            <li>No crear cuentas duplicadas o con identidades falsas.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>3.</span> Pedidos, Precios y Métodos de Pago
          </h2>
          <p>
            Los precios de los platillos y artículos exhibidos en la plataforma son fijados de forma directa por
            cada restaurante o comercio afiliado. Los costos de envío y tarifas de servicio se desglosan de forma
            transparente antes de confirmar cualquier pedido.
          </p>
          <p>
            Los métodos de pago admitidos incluyen tarjeta de débito/crédito a través de pasarela digital segura y
            pago en efectivo contra entrega, según las opciones habilitadas por el comercio al momento de la compra.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>4.</span> Entregas, Tiempos y Zonas de Cobertura
          </h2>
          <p>
            Los tiempos estimados de entrega mostrados en la aplicación son aproximados y pueden variar de acuerdo
            a la demanda del restaurante, condiciones climáticas o eventualidades de tránsito en las distintas zonas
            de El Salto y sus alrededores.
          </p>
          <p>
            Es responsabilidad del usuario indicar una dirección correcta, completa y con referencias claras para
            facilitar la entrega por parte del repartidor asignado.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>5.</span> Cancelaciones, Devoluciones y Garantías
          </h2>
          <p>
            Una vez que el restaurante o comercio aliado ha comenzado la preparación del pedido, no se podrán realizar
            cancelaciones sin costo. En caso de pedidos incompletos, erróneos o en mal estado, el usuario deberá
            comunicarse de inmediato a través del canal de Soporte dentro de la app para gestionar la aclaración o reembolso correspondiente.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>6.</span> Normas de Conducta y Seguridad
          </h2>
          <p>
            Sierra App promueve un entorno respetuoso y seguro para clientes, colaboradores de restaurantes y
            repartidores. Cualquier agresión física o verbal, intento de fraude o uso indebido de la plataforma
            será motivo de suspensión inmediata y definitiva de la cuenta.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>7.</span> Modificaciones a los Términos
          </h2>
          <p>
            Sierra App se reserva el derecho de actualizar estos Términos y Condiciones en cualquier momento.
            Cualquier modificación sustancial será informada oportunamente a través de los canales oficiales de la aplicación.
          </p>
        </section>

        <section className="space-y-2">
          <h2
            className="text-lg font-bold text-[#5bc827] uppercase tracking-wide flex items-center gap-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <span>8.</span> Jurisdicción y Ley Aplicable
          </h2>
          <p>
            Estos términos se rigen e interpretan conforme a las leyes vigentes de los Estados Unidos Mexicanos
            y del Estado de Durango. Cualquier controversia será sometida a la jurisdicción de los tribunales
            competentes en la entidad.
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

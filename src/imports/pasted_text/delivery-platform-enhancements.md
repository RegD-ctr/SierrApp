Quiero ampliar el diseño actual de mi plataforma web de pedidos y delivery. Mantén exactamente el mismo estilo visual, paleta de colores, tipografías, componentes, bordes, espaciados y estructura general que ya utiliza el proyecto. No rediseñes las pantallas existentes; agrega las nuevas funcionalidades de forma coherente con el diseño actual.

Se deben crear o actualizar dos módulos principales:

1. Panel de Local Asociado / Restaurante

Dentro de la ventana existente de "Local Asociado", agregar una sección para administrar los platillos o productos que vende el establecimiento.

Gestión de platillos

Agregar una opción visible de "Agregar platillo".

Al presionarla, mostrar un formulario para registrar un nuevo platillo con los siguientes campos:

Nombre del platillo.
Descripción.
Categoría.
Precio.
Imagen/fotografía del platillo.
Disponibilidad.
Botón "Guardar platillo".
Botón "Cancelar".

Los platillos registrados deben mostrarse en una lista o tarjetas manteniendo el estilo actual de la plataforma.

Cada platillo debe mostrar:

Imagen.
Nombre.
Descripción breve.
Precio.
Categoría.
Estado de disponibilidad.
Botón para editar.
Botón "Marcar como agotado".
Función "Platillo agotado"

Cada platillo registrado, incluyendo los nuevos que se agreguen posteriormente, debe tener un botón que permita al establecimiento marcarlo como "Agotado".

Cuando se marque como agotado:

Cambiar visualmente su estado a "Agotado".
El botón puede cambiar a "Volver a habilitar".
El producto debe quedar deshabilitado para nuevas ventas.
En la interfaz del cliente, el platillo debe aparecer como "Agotado" y no debe poder agregarse al carrito.
No eliminar el platillo del catálogo, solamente cambiar su disponibilidad.
Permitir que el establecimiento vuelva a habilitarlo cuando tenga existencias nuevamente.

Agregar filtros para visualizar:
"Todos", "Disponibles" y "Agotados".

El objetivo es que el local pueda administrar rápidamente su menú y disponibilidad desde un mismo panel.

2. Nueva ventana: Panel de Repartidor

Crear una nueva interfaz web específica para los repartidores.

Debe ser responsive y estar especialmente optimizada para dispositivos móviles, ya que será utilizada principalmente mientras el repartidor está realizando entregas.

Pantalla principal

La pantalla debe incluir:

Mapa como elemento principal.
Ubicación actual del repartidor.
Marcadores de los establecimientos/locales relacionados con sus pedidos.
Marcador del destino del cliente.
Ruta visual entre los puntos correspondientes.
Panel con órdenes asignadas o nuevas órdenes.
Registro de órdenes

Agregar una sección "Mis órdenes" donde el repartidor pueda visualizar las órdenes que le van llegando.

Cada orden debe mostrar:

Número o ID de pedido.
Nombre del establecimiento.
Dirección del establecimiento.
Lista/resumen de productos.
Cantidad de productos.
Total del pedido si corresponde.
Hora del pedido.
Dirección de entrega del cliente.
Estado actual del pedido.

Utilizar estados visuales como:

"Nueva orden"
"Dirígete al local"
"Esperando producto"
"Producto recibido"
"En camino"
"Entregado"

Detalle de una orden

Al seleccionar una orden, mostrar una vista detallada.

Primero debe aparecer la información necesaria para recoger el pedido:

Nombre del local.
Dirección del local.
Ubicación en el mapa.
Número de pedido.
Productos que contiene.
Cantidades.
Notas importantes del pedido.
Botón principal "Confirmar producto recibido".
Confirmación de producto recibido

Cuando el repartidor presione "Confirmar producto recibido":

Mostrar una pequeña confirmación para evitar pulsaciones accidentales.
Cambiar automáticamente el estado de la orden a "En camino".
Cambiar la información principal de navegación.
El mapa debe cambiar la ruta del repartidor hacia la ubicación del cliente.
Mostrar ahora la dirección de entrega del cliente.
Mostrar un botón principal "Confirmar entrega".

La transición debe quedar visualmente clara:

LOCAL → RECOGER PEDIDO → PRODUCTO RECIBIDO → CLIENTE → ENTREGADO

Entrega al cliente

Durante la etapa "En camino", mostrar:

Mapa y ruta hacia el cliente.
Dirección de entrega.
Número de pedido.
Información necesaria para identificar la entrega.
Botón "Confirmar entrega".

Al confirmar la entrega:

Cambiar el estado a "Entregado".
Mostrar una confirmación visual de entrega completada.
Registrar la orden dentro del historial del repartidor.
Regresar al repartidor a la pantalla de órdenes disponibles/activas.
Navegación del panel de repartidor

Agregar las secciones:

Inicio / Mapa
Mis órdenes
Orden activa
Historial
Perfil

En dispositivos móviles utilizar una barra de navegación inferior para facilitar el acceso con una sola mano.

Consideraciones UX/UI

Mantener el diseño limpio, moderno y consistente con el resto de la plataforma.

Dar prioridad visual a las acciones importantes del repartidor.

Los botones "Confirmar producto recibido" y "Confirmar entrega" deben ser grandes, claros y fáciles de utilizar desde un teléfono.

Los estados de las órdenes deben distinguirse visualmente mediante badges, iconos o indicadores.

No saturar las pantallas con información innecesaria.

El mapa debe tener suficiente espacio y ser uno de los elementos principales de la interfaz.

Diseñar también los estados vacíos, por ejemplo:

"No tienes órdenes asignadas actualmente."

Y los estados de carga:

"Buscando nuevas órdenes..."

El resultado debe integrarse al proyecto existente sin modificar innecesariamente las pantallas que ya están diseñadas.
Quiero ampliar y hacer funcional el diseño actual de mi plataforma web de pedidos y delivery. IMPORTANTE: conserva el diseño existente, incluyendo colores, tipografías, componentes, navegación, tarjetas, botones, espaciados y estilo general. No elimines ni rediseñes funcionalidades existentes; únicamente agrega e integra las siguientes funciones.

# 1. PERFIL DEL USUARIO / CLIENTE

En la interfaz del usuario ya existe una sección donde aparecen diferentes restaurantes.

Hacer que cada restaurante sea seleccionable.

Al hacer clic o tocar un restaurante, abrir una página individual con toda la información de ese establecimiento.

## Página del restaurante

En la parte superior mostrar:

* Imagen de portada del restaurante.
* Logo del restaurante.
* Nombre del restaurante.
* Dirección.
* Puntuación mediante estrellas.
* Número de calificaciones, si existe.
* Estado: "Abierto" o "Cerrado".

Debajo debe aparecer el menú completo del restaurante.

IMPORTANTE: cada restaurante solamente debe mostrar los platillos que estén relacionados con ese restaurante.

Organizar los platillos por categorías cuando corresponda.

Cada platillo debe mostrar:

* Fotografía.
* Nombre.
* Descripción.
* Precio.
* Disponibilidad.
* Botón "Agregar".

Los productos marcados como "Agotados" por el restaurante deben aparecer visualmente como agotados y NO deben poder agregarse al carrito.

# 2. PERSONALIZACIÓN DEL PLATILLO

Cuando el usuario presione "Agregar" sobre un platillo, NO agregarlo inmediatamente al carrito si el producto tiene opciones de personalización.

Abrir automáticamente una ventana, modal, panel inferior o sidebar para configurar el platillo.

Mostrar solamente las opciones disponibles para ese producto.

Ejemplos:

* Tamaño.
* Ingredientes.
* Complementos.
* Salsas.
* Tipo de preparación.
* Extras.
* Quitar ingredientes.
* Cantidad.
* Notas o instrucciones especiales.

Distinguir entre opciones obligatorias y opcionales.

Si una opción tiene costo adicional, mostrarlo claramente:

"Extra queso +$15"
"Porción adicional +$25"

Actualizar el precio del producto automáticamente dependiendo de las opciones seleccionadas.

Al finalizar mostrar:

"Agregar al carrito — $TOTAL"

Al presionar el botón, agregar el producto personalizado al carrito.

# 3. CARRITO FUNCIONAL

Hacer completamente funcional el botón/icono del carrito que ya existe en la interfaz.

El icono debe mostrar un contador con la cantidad de productos agregados.

Ejemplo:

🛒 3

Al abrir el carrito mostrar todos los productos seleccionados.

Cada producto debe mostrar:

* Imagen.
* Nombre.
* Restaurante.
* Personalizaciones seleccionadas.
* Cantidad.
* Precio unitario.
* Precio de extras.
* Subtotal.

Permitir:

* Aumentar cantidad.
* Disminuir cantidad.
* Eliminar producto.
* Editar personalización.

Actualizar los precios automáticamente después de cualquier modificación.

En la parte inferior mostrar:

Subtotal
Costo de envío
Total

Y un botón principal:

"Continuar con el pedido"

Si el carrito está vacío mostrar:

"Tu carrito está vacío"

con un botón para regresar a explorar restaurantes.

# 4. CREACIÓN DE CUENTA

Agregar un apartado claramente visible de:

"Iniciar sesión"
"Crear cuenta"

Al seleccionar "Crear cuenta", primero preguntar qué tipo de cuenta desea crear.

Mostrar tres opciones:

USUARIO / CLIENTE
RESTAURANTE
REPARTIDOR

Cada opción debe llevar a un formulario diferente.

# 5. CREAR CUENTA — USUARIO / CLIENTE

Solicitar:

* Nombre completo.
* Correo electrónico.
* Contraseña.
* Confirmar contraseña.
* Número de teléfono.
* Dirección de entrega.

Para la dirección solicitar:

* Calle.
* Número.
* Colonia.
* Código postal.
* Ciudad.
* Estado.
* Referencias o detalles adicionales.

Agregar un campo:

"Detalles para encontrar tu dirección"

Ejemplo:

"Casa con portón negro, enfrente del parque."

Si es posible, permitir seleccionar la ubicación mediante un mapa y colocar un marcador en la dirección exacta.

Botón:

"Crear cuenta"

Después de crearla, dirigir automáticamente al perfil del usuario.

# 6. CREAR CUENTA — RESTAURANTE

Cuando se seleccione "Restaurante", mostrar un formulario específico.

Solicitar:

* Nombre del restaurante.
* Dirección.
* Logo del restaurante.
* Imagen de portada, si corresponde.
* Teléfono de contacto.

Agregar un mapa para establecer la ubicación del restaurante.

La ubicación debe quedar marcada mediante un punto/marcador.

Una vez registrado el restaurante, crear automáticamente su perfil/panel.

Después del registro, llevar directamente al apartado:

"Agregar platillos"

# 7. AGREGAR PLATILLOS DEL RESTAURANTE

Permitir que el restaurante comience a crear su menú inmediatamente después de registrarse.

Para cada platillo solicitar:

* Fotografía.
* Nombre.
* Descripción.
* Categoría.
* Precio.
* Opciones de personalización.
* Extras.
* Disponibilidad.

Botón:

"Agregar platillo"

Los platillos agregados deben aparecer automáticamente dentro de la página pública de ese restaurante.

También conservar la función existente para:

"Marcar como agotado"

Cuando un restaurante marque un platillo como agotado, el cliente debe verlo como "Agotado" y no debe poder agregarlo al carrito.

# 8. CREAR CUENTA — REPARTIDOR

Cuando se seleccione "Repartidor", crear un formulario sencillo.

Solicitar únicamente:

* Nombre completo.
* Fotografía de perfil.

Al crear la cuenta, el sistema debe generar automáticamente una matrícula o identificador único del repartidor.

Ejemplo visual:

Nombre:
Juan Pérez

Matrícula:
REP-000124

Foto:
[Fotografía del repartidor]

La matrícula NO debe ser escrita manualmente por el repartidor.

Debe generarse automáticamente y no debe repetirse.

Después del registro, dirigir al repartidor hacia el panel de repartidores que ya existe en el proyecto.

# 9. RELACIÓN ENTRE RESTAURANTES Y PLATILLOS

Es muy importante representar correctamente esta relación dentro del prototipo:

Cada restaurante tiene su propio perfil.

Cada restaurante tiene sus propios platillos.

Los platillos agregados desde el panel de un restaurante solamente deben aparecer en ese restaurante.

Ejemplo:

Restaurante A
→ Hamburguesa
→ Papas
→ Refresco

Restaurante B
→ Tacos
→ Quesadilla
→ Agua

Los productos del Restaurante A NO deben aparecer dentro del Restaurante B.

# 10. FLUJO GENERAL DEL USUARIO

Representar y conectar correctamente el siguiente flujo:

INICIO
→ Explorar restaurantes
→ Seleccionar restaurante
→ Ver información del restaurante
→ Ver menú
→ Seleccionar platillo
→ Personalizar platillo
→ Agregar al carrito
→ Abrir carrito
→ Revisar productos
→ Ver total
→ Continuar con el pedido

# 11. FLUJO DE REGISTRO

Crear también el flujo:

CREAR CUENTA
→ Elegir tipo de cuenta

Si selecciona USUARIO:
→ Datos personales
→ Dirección
→ Crear cuenta
→ Perfil de usuario

Si selecciona RESTAURANTE:
→ Datos del restaurante
→ Ubicación en mapa
→ Crear restaurante
→ Agregar platillos
→ Panel del restaurante

Si selecciona REPARTIDOR:
→ Nombre
→ Fotografía
→ Generar matrícula automáticamente
→ Panel del repartidor

# 12. INTERACCIONES Y PROTOTIPO

No crear únicamente pantallas visuales aisladas.

Conectar los botones y pantallas mediante interacciones para que el prototipo permita simular todo el flujo.

Deben funcionar visualmente:

* Seleccionar restaurante.
* Regresar a la lista de restaurantes.
* Seleccionar platillos.
* Personalizar platillos.
* Agregar productos al carrito.
* Abrir carrito.
* Cambiar cantidades.
* Eliminar productos.
* Mostrar el total.
* Crear una cuenta.
* Elegir el tipo de cuenta.
* Registrar usuario.
* Registrar restaurante.
* Agregar platillos.
* Registrar repartidor.
* Mostrar matrícula generada.
* Navegar entre las diferentes interfaces.

Mantener siempre el diseño responsive.

La interfaz del cliente y restaurante debe funcionar correctamente tanto en escritorio como en móvil.

El panel del repartidor debe priorizar el diseño móvil.

No modificar innecesariamente las pantallas existentes. Integrar todas estas funciones dentro del diseño actual de forma consistente, moderna, clara y fácil de utilizar.

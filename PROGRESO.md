# Progreso del proyecto

Última actualización: 2026-10-23

## Etapa actual: 7 (legales, SEO, dominio y lanzamiento), en curso

Tienda online (prueba): https://zapateria-mu.vercel.app (Vercel, se publica sola con cada push a `main`).

**Pruebas automáticas** (2026-10-23): `npm run build` y `npm run pruebas` (detalle en el README). 8 pruebas, 180
comprobaciones: funciones SQL, carrito y checkout, pago, panel de pedidos, arrepentimiento, tienda, y dos en el
navegador (tienda y panel). Viven en `scripts/pruebas/` (antes estaban en una carpeta temporal y se perdieron).
Todas pasaron contra `mejoras-celular` antes de pasarla a `main`.

**Rama `mejoras-celular` (pasada a `main` el 2026-10-23):**

- Diseño para celular y arreglos de Lighthouse: encabezado en una línea, filtros en panel, producto con fotos
  deslizables y barra fija, carrito y checkout con pasos.
- Inicio estilo tienda grande: anuncio, menú Mujer/Hombre/Niños/Tendencias/Deportes/Outlet, buscador con
  sugerencias, carrusel de portadas editable desde el panel, franja de marcas con logos y páginas por marca.
  Migración `20261026000000_portada_y_secciones.sql` **ya corrida en Supabase** (2026-10-23): la base es la misma
  para `main` y la rama, y el código de `main` no usa las columnas nuevas, así que no le afecta.
- Probado: panel en el navegador (12 comprobaciones: subir foto de portada y logo, textos y link, link a otro sitio
  rechazado, el formulario no pierde lo escrito ante un error, precio anterior), secciones, marcas, búsqueda y
  sugerencias, ancho de todas las páginas en el celular, capturas en celular y compu. Lighthouse: inicio 96/100/100/100
  en celular y 100 en compu; Outlet, marca y búsqueda 98 en celular.
- Animaciones sutiles (sin librerías): aparición al hacer scroll (CSS `animation-timeline: view()`), zoom leve y
  segunda foto al pasar el mouse (en el celular no se descarga), transición de la foto de la tarjeta al producto y
  fundido entre páginas (`<ViewTransition>` de React; las tarjetas usan `prefetch` completo para que el producto
  llegue entero), rebote del carrito al agregar, y entrada suave del menú, el buscador, el panel de filtros y los
  textos del carrusel. 120–300 ms, solo transform/opacity. **Con "reducir movimiento" se apagan todas** (verificado).
  Lighthouse con las animaciones activas: igual que antes (96–97 en celular, 100 en compu, CLS 0).
  Ojo al medir: el Edge sin pantalla de esta PC informa "reducir movimiento"; para medir con animaciones, agregar
  `--force-prefers-no-reduced-motion` a `--chrome-flags`.
- **Ahora que está en `main`:** cargar las fotos de portada reales (o editar/ocultar las de ejemplo) y los logos de las
  marcas reales desde el panel. Logos solo de marcas que el cliente esté autorizado a usar.

## Pendientes / bugs conocidos

- [x] ~~Al crear un producto no deja elegir marca ni categoría.~~ Resuelto el 2026-10-21: no era un bug,
  no había marcas ni categorías cargadas. Con los datos de ejemplo funciona.
  Mejora posible: mostrar un aviso con link a Marcas/Categorías cuando estén vacías.
- [ ] Confirmar en el navegador que al editar un producto en el panel el cambio se ve enseguida en la tienda.
- [ ] **En el ambiente de Prueba de Mercado Pago el webhook da 401 (firma inválida). Verificarlo con el primer pago
  real de la cuenta del cliente** (decidido el 2026-10-23: se deja así hasta el lanzamiento).
  - Pagos: 184528616557 (#1032), 185569749738 (#1033), 184533563631 (#1034) y 184682425583 (2026-10-23, ya con
    Next.js 16.4.3). Todos los pedidos quedaron pagados igual, porque la vuelta del comprador confirma el pago.
    El webhook es un respaldo (por ejemplo, si el comprador cierra la pestaña antes de volver).
  - Log de Vercel del 2026-10-23: el aviso llega completo y con el formato de la documentación
    (`?data.id=184682425583&type=payment`, `x-request-id` y `ts` en segundos, que coincide con la hora de la compra).
    O sea, la firma se calcula bien y lo que no coincide es la clave: todo indica que Mercado Pago firma los avisos de
    "Ambiente: Prueba" con otra clave que la del panel, aunque el panel muestre la misma.
  - La simulación de Mercado Pago ("URL de producción") sí pasa la firma: da 500, que es lo esperado porque el pago
    simulado no existe. Las claves secretas de prueba y productivo son iguales. Un aviso sin firma da 401, así que la
    clave está cargada en Vercel.
  - En Mercado Pago los avisos reales figuran bajo "Ambiente: Prueba", aunque la API dice que el pago es productivo
    (`live_mode: true`). Las compras se hicieron con usuarios de prueba.
  - Ya probado sin éxito (commit `bcd6b75`): sacar `notification_url` de los cobros (los avisos salen solo del webhook
    del panel) y armar la firma solo con el `data.id` de la URL. Desde ese commit, cada firma inválida deja en los
    logs de Vercel la URL del aviso, `x-request-id` y `ts`.
  - **Al lanzar:** con las credenciales de producción del cliente (Access Token y la clave secreta del webhook de su
    aplicación), hacer el primer pago real chico y mirar en Mercado Pago → Webhooks que el aviso dé **200**.
    - Si da 401: buscar "firma inválida" en Vercel → Logs.
    - Para confirmar la causa: agregar al log la firma recibida (`v1`), que no es secreta, y calcularla en la PC con
      la clave del `.env.local`.
    - No desactivar el chequeo de firma.
- [x] ~~Mails automáticos~~ Hechos el 2026-10-23 con Resend (ver "Mails automáticos" abajo). **Falta conectarlos
  al dominio propio** (README → Mails automáticos): mientras tanto salen desde `onboarding@resend.dev` y Resend solo
  entrega a la dirección de la cuenta (marquitosnicodiaz8@gmail.com), así que a otros compradores no les llegan.
- [ ] **Antes de lanzar: `npm run ejemplo:borrar`** para sacar los datos de ejemplo (ver abajo).

Repositorio: https://github.com/mtzMarcos/Zapateria (privado, rama `main`).

## Empezar en una PC nueva

1. Instalar Node.js LTS, Git y VS Code.
2. `git clone https://github.com/mtzMarcos/Zapateria.git` y entrar a la carpeta.
3. `npm install` (la carpeta `node_modules` no se sube a GitHub).
4. Copiar `.env.example` como `.env.local` y completar las claves desde el panel de Supabase.
   `.env.local` **no está en el repositorio a propósito** (tiene claves secretas): hay que crearlo en cada PC.
5. `npm run dev` y abrir http://localhost:3000 (el panel está en http://localhost:3000/admin)

Rutina entre PCs: `git pull` antes de empezar, `git push` al terminar.

## Plan de etapas

| Etapa | Descripción | Estado |
|---|---|---|
| 0 | Relevamiento con el cliente | Pendiente |
| 1 | Base del proyecto y modelo de datos | ✅ Probado con Supabase |
| 2 | Panel de administración (login, productos, fotos, stock por talle) | ✅ Funciona (ver bug de marca/categoría en Pendientes) |
| 3 | Catálogo público con filtros y página de producto | ✅ Probado en el navegador con los datos de ejemplo |
| 4 | Carrito y checkout (envío por zona o retiro en local) | ✅ Probado en el navegador |
| 5 | Mercado Pago Checkout Pro, webhook y descuento de stock | ✅ Probado (en la PC y en Vercel con vuelta automática). Webhook: 401 en Prueba, se verifica al lanzar |
| 6 | Pedidos en el panel | ✅ Probado (también a mano en el navegador) |
| 7 | Legales, SEO, dominio y lanzamiento | En curso: código hecho, faltan datos del cliente, dominio y lanzamiento |

## Decisiones tomadas

- Stack: Next.js 16 + Supabase + Mercado Pago Checkout Pro + Vercel.
- Envíos: costo fijo por zona + retiro en local. **Los precios de las zonas son de ejemplo** (CABA $6.000, GBA $8.500, Interior $12.000); definirlos con el cliente.
- Compra como invitado (sin cuentas de clientes).
- Emails transaccionales: con Resend (ver "Mails automáticos").
- El stock se descuenta solo cuando el webhook de Mercado Pago confirma el pago aprobado.
- Modo claro y oscuro (según el sistema): en `src/app/globals.css` el modo oscuro invierte la escala de grises
  (`white`, `neutral-*`) y ajusta rojo/verde/ámbar. **Regla para código nuevo:** usar solo esos colores pensando
  en el modo claro, sin `dark:`. Contraste de textos revisado (mínimo 4.5:1 en ambos modos, 2026-10-22).

## Qué se hizo (Etapa 1)

- Proyecto Next.js 16.4 con TypeScript y Tailwind.
- Esquema de base de datos en `supabase/migrations/20261013000000_esquema_inicial.sql`: catálogo, talles con stock, zonas de envío, pedidos, admins, reglas de seguridad (RLS) y bucket de fotos.
- Clientes de Supabase en `src/lib/supabase/` (público y secreto, este último solo servidor).
- Página de inicio provisoria que verifica la conexión con la base.
- README con los pasos para levantar el proyecto.

- Proyecto subido a GitHub (repositorio privado).
- Supabase configurado y probado (el SQL corrió sin errores, la home muestra las zonas).

## Qué se hizo (Etapa 2)

Panel en `/admin` (`src/app/admin/`), solo para usuarios que estén en la tabla `admins`:

- **Login** con email y contraseña (Supabase Auth). `src/proxy.ts` renueva la sesión y manda al login
  si no hay sesión; además cada página y acción verifica que sea admin (`src/lib/admin/auth.ts`).
- **Productos**: listado con portada, precio, stock total y avisos ("visible sin fotos / sin stock");
  alta, edición (nombre, marca, categoría, precio, descripción, visible/oculto) y eliminación.
  El slug (URL) se genera al crearlo y no cambia al renombrar.
- **Talles y stock**: agregar talles de a uno, en lista ("38, 39, 40") o en rango ("35-42");
  editar el stock de todos juntos; quitar talles.
- **Fotos**: subida múltiple (JPG/PNG/WEBP, hasta 5 MB) directo del navegador a Supabase Storage,
  reordenar (la primera es la portada) y borrar.
- **Marcas, categorías y zonas de envío**: alta, edición y baja (no deja borrar marcas/categorías en uso).
- Las acciones llaman a `catalogoActualizado()`, que invalida la etiqueta de caché `catalogo`:
  la tienda pública de la Etapa 3 tiene que cachear sus consultas con `cacheTag("catalogo")`.

Probado: build, lint y tipos OK; con un admin temporal (ya borrado) se verificaron los permisos
RLS, las consultas, la subida/borrado de fotos y que todas las páginas del panel rendericen.
Usuario admin creado y panel probado en el navegador. Registro de usuarios nuevos desactivado en Supabase.

## Qué se hizo (Etapa 3)

Tienda pública (`src/app/(tienda)/`), con encabezado (menú de categorías) y pie:

- **Inicio** (`/`): presentación, categorías y "Novedades" (los 8 más nuevos, con stock primero).
- **Catálogo** (`/productos`): filtros por categoría, marca y talle (solo talles con stock) y orden
  (más nuevos / menor precio / mayor precio). Los filtros van en la URL
  (`/productos?categoria=zapatillas&talle=40&orden=precio-asc`), así se pueden compartir.
  Los productos sin stock se muestran con la etiqueta "Sin stock" y van al final.
- **Producto** (`/productos/[slug]`): galería de fotos, precio, talles (los agotados tachados),
  descripción y "También te puede interesar" (misma categoría). Título y foto para compartir en redes.
  El botón "Agregar al carrito" está deshabilitado hasta la Etapa 4.
- Los productos ocultos no aparecen y su URL da 404.
- Datos en `src/lib/catalogo.ts` (con `use cache` + etiqueta `catalogo`), filtros en `src/lib/filtros.ts`.
  Se trae todo el catálogo en una consulta y se filtra en memoria (alcanza para cientos de productos).
- Se borró la página provisoria que verificaba la conexión con Supabase.

**Caché (importante para las próximas etapas):** el catálogo queda guardado hasta 1 hora.
El panel lo refresca al instante con `updateTag("catalogo")`. **Cualquier cosa que cambie productos o
stock por fuera del panel** (por ejemplo, el webhook de Mercado Pago en la Etapa 5) tiene que llamar a
`revalidateTag("catalogo")`; si no, la tienda muestra stock viejo. El cliente público de Supabase usa
`cache: "no-store"` a propósito: si no, Next guarda las consultas en otra caché que sobrevive a los
deploys y que `updateTag` no borra.

Probado con datos temporales (ya borrados) en un servidor de producción aparte: filtros, orden,
productos sin stock, ocultos, 404, relacionados y títulos. **Falta probar a mano en el navegador**
(y confirmar que al editar un producto en el panel el cambio se ve enseguida en la tienda).

## Qué se hizo (Etapa 4)

- **Carrito** (`/carrito`): se guarda en una cookie (30 días) con solo el id de cada talle y la cantidad.
  Precio, nombre y stock se leen siempre de la base (sin caché), así nadie puede cambiar un precio
  editando la cookie. Sumar/restar unidades, quitar, y como máximo 10 unidades por talle o el stock que haya.
  Si un producto se agota, se oculta o baja el stock mientras está en el carrito, se avisa y hay un botón
  "Ajustar al stock disponible"; no deja seguir al checkout hasta corregirlo.
  Contador de unidades en el encabezado.
- **Agregar al carrito** en la página de producto (elegir talle primero).
- **Checkout** (`/checkout`): nombre, email, teléfono; envío a domicilio (zona + dirección completa, provincia
  de una lista) o retiro en el local (sin costo). El total se actualiza al elegir la zona.
  La validación real está en el servidor (`src/app/(tienda)/checkout/`): recalcula precios, stock y costo
  de envío desde la base; lo que mande el navegador solo se usa para los datos del comprador.
- Al confirmar se crea el pedido en `orders` + `order_items` con estado `pending_payment`, se vacía el
  carrito y se muestra `/pedido/[id]` con el número de pedido (#1001, #1002…). Los pedidos se escriben y
  leen con la clave secreta (el público no tiene acceso por RLS); el id es un UUID imposible de adivinar.
- **El stock no se descuenta al crear el pedido**: se descuenta cuando Mercado Pago confirme el pago (Etapa 5).
  Por ahora la confirmación dice "te vamos a contactar para coordinar el pago"; en la Etapa 5 el checkout
  va a mandar a pagar a Mercado Pago en lugar de ir directo a la confirmación.
- Datos del local para el retiro (dirección y horarios) en `src/config/tienda.ts`: **completar con el cliente**.
- `src/lib/admin/form.ts` pasó a `src/lib/form.ts` (lo usan el panel y la tienda).

Probado en un servidor de producción aparte, mandando los formularios como un navegador sin JavaScript
(29 comprobaciones): agregar, tope de stock, contador, +/−, aviso y ajuste cuando baja el stock,
validaciones del checkout, pedido con envío (totales recalculados aunque se mande un total falso),
pedido con retiro, carrito vacío, confirmación y pedido inexistente. Los pedidos de prueba se borraron.
Probado a mano en el navegador el 2026-10-22: funciona.

Nota: los pedidos todavía no se ven en el panel (eso es la Etapa 6). Mientras tanto se ven en
Supabase → Table Editor → `orders` y `order_items`.

## Qué se hizo (Etapa 6)

- **Pedidos en el panel** (`/admin/pedidos`, es la primera pantalla al entrar al panel):
  - Listado con filtros: **Para atender** (pagados, sin stock, en preparación, despachados, listos para retirar),
    Sin pagar, Entregados, Cancelados y Todos, con la cantidad de cada uno. Búsqueda por número, nombre o email.
  - Detalle: estado, cliente (email y teléfono con link), dirección o retiro, indicaciones del cliente,
    productos, totales, pago de Mercado Pago (número de operación y fecha) y link a la página del pedido del cliente.
  - **Cambio de estado** con botones según el estado y el tipo de entrega: pagado → en preparación →
    despachado (envío) o listo para retirar (retiro) → entregado. "Pagado sin stock" → en preparación cuando se
    consigue el producto. Si el pedido cambió mientras tanto (otra pestaña, un pago que llegó), no se pisa.
  - **Cancelar** (excepto entregados): con la opción de devolver las unidades al stock si ya se habían descontado,
    con la función SQL `cancelar_pedido` (`supabase/migrations/20261023000000_cancelar_pedido.sql`). No devuelve el
    dinero: eso se hace desde Mercado Pago (el panel lo avisa).
  - **Notas internas** editables; ahí están también los avisos automáticos de la Etapa 5.
- Estados, nombres y pasos posibles en `src/lib/admin/pedidos.ts`.

Migración SQL de cancelar corrida el 2026-10-22.
Probado con un admin temporal (ya borrado) en un servidor de producción aparte (27 comprobaciones): login,
filtros, búsqueda, detalle, cada cambio de estado, cambios no permitidos, pantalla desactualizada, retiro vs envío,
notas, salir; cancelar reponiendo stock, sin reponer, "pagado sin stock" y sin pagar (no reponen), entregado no
cancelable, la clave pública no puede cancelar. Capturas en modo claro y oscuro.
**Probado a mano en el navegador el 2026-10-22:** el pedido #1019 pasó por todos los estados hasta Entregado.

## Qué se hizo (Etapa 5)

- **Pago con Mercado Pago Checkout Pro** (API REST, sin SDK): al confirmar el checkout se crea el pedido y un
  cobro ("preferencia") con los montos del pedido en la base (productos + envío). Vence a las 48 h.
- **Confirmación del pago** (`src/lib/pagos.ts`): siempre se consulta el pago a la API de Mercado Pago. Si está
  aprobado, es en pesos y el monto es igual al total, la función SQL `confirmar_pago`
  (`supabase/migrations/20261022000000_pagos.sql`) descuenta el stock y marca el pedido `paid` en una sola
  transacción, bloqueando los talles para que dos pagos no vendan la misma unidad. Si ya no hay stock: `stock_issue`
  sin descontar nada y con una nota para el dueño. Rechazado → `payment_rejected` (se puede reintentar).
  Pago duplicado, monto distinto, devolución o contracargo → nota en `admin_notes` (se verán en la Etapa 6).
  Después de descontar stock se refresca la caché del catálogo (`revalidateTag("catalogo", { expire: 0 })`).
- **Tres caminos que procesan el pago** (repetirlos no tiene efecto): webhook `/api/mercadopago/webhook`
  (verifica la firma si hay `MERCADOPAGO_WEBHOOK_SECRET`), la vuelta del comprador `/api/mercadopago/retorno`, y el
  botón **"Ya pagué: actualizar estado"** de la página del pedido (busca los pagos del pedido en Mercado Pago).
- **Página del pedido** según el estado: pagado, en proceso, falta el pago (botón "Pagar con Mercado Pago"),
  rechazado ("Intentar de nuevo"), sin stock o cancelado.
- **Limitación de la PC:** Mercado Pago solo acepta direcciones https para volver a la tienda y para los webhooks.
  Con `http://localhost` el checkout lleva primero a la página del pedido; se paga desde ahí y al volver se usa
  "Ya pagué". En Vercel (https) el checkout va directo a Mercado Pago y vuelve solo.
- El cliente de Supabase con clave secreta ahora también usa `cache: "no-store"` (estado de pedidos siempre actual).

Probado contra un servidor de producción aparte (18 comprobaciones): pedido → cobro con total, ítems y
external_reference correctos; página del pedido; "Ya pagué" sin pagos; retorno; reintentar el pago; webhook
(otros avisos, sin firma, firma falsa, firma válida, id inválido).
Migración SQL corrida el 2026-10-22. `confirmar_pago` probada contra la base (11 comprobaciones): descuenta stock,
el mismo pago repetido no descuenta dos veces, rechazado y después aprobado, sin stock → `stock_issue` sin
descontar, dos pagos simultáneos por la última unidad → uno `paid` y otro `stock_issue` (stock nunca negativo),
la clave pública no puede llamarla.
Pagos directos por API (`/v1/payments`) no se pudieron simular: Mercado Pago responde "Unauthorized use of live
credentials" aun con la Public Key (probablemente la aplicación está habilitada solo para Checkout Pro). No afecta a
la tienda, que usa Checkout Pro.
**Probado en el navegador el 2026-10-22:** pedido #1019 pagado con cuenta compradora de prueba y tarjeta `APRO`,
confirmado con "Ya pagué": quedó `paid` y descontó el stock (Nike Air Max 90 talle 42: 2 → 1).
**Probado en Vercel el 2026-10-22:** webhook configurado en Mercado Pago (evento Pagos) y su clave en
`MERCADOPAGO_WEBHOOK_SECRET`. Pedido #1032 (Adidas Adilette talle 40, operación 184528616557): Mercado Pago volvió
solo a la página del pedido con "Pago aprobado"; en la base quedó `paid` con el número de operación y el stock
bajó de 8 a 7. Un aviso al webhook sin firma es rechazado (401), así que la clave está cargada en Vercel.
**El webhook da 401 en el ambiente de Prueba** (en Mercado Pago → Webhooks → historial): se verifica con el primer
pago real del cliente, ver Pendientes.
Los pagos se confirman igual con la vuelta del comprador.

## Qué se hizo (Etapa 7, en curso)

- **Datos del cliente con espacios marcados** (`src/config/tienda.ts`): local, contacto, titular, CUIT, domicilio
  legal, jurisdicción, Data fiscal, plazo de entrega y política de cambios. Los que faltan se ven en la tienda como
  "[Completar: …]" (resaltados) y el panel muestra la lista arriba de cada pantalla.
- **Páginas legales:** Términos y condiciones, Cambios y devoluciones, Privacidad (Ley 25.326 con los textos
  obligatorios). **Son un texto base: que las revise un abogado o el contador del cliente antes de lanzar.**
- **Botón de arrepentimiento** (`/arrepentimiento`, Res. SCI 424/2020): número de pedido + email, sin cuenta;
  devuelve al instante un código de solicitud (`ARR-1032-XXXX`). El mismo pedido repetido devuelve el mismo código;
  si el número o el email no coinciden, no dice cuál de los dos falla. En el panel: aviso arriba del listado con los
  pedidos con arrepentimiento sin cancelar (aunque estén entregados), aviso en el detalle, y un pedido entregado con
  arrepentimiento ahora se puede cancelar reponiendo el stock. Migración
  `supabase/migrations/20261024000000_arrepentimiento.sql` (columnas `withdrawal_*` y nueva versión de
  `cancelar_pedido`). El código se muestra en pantalla y también se manda por mail (ver "Mails automáticos").
- **Pie de página:** contacto, local, links legales, botón de arrepentimiento, link a Defensa del Consumidor
  (Res. SCI 274/2021), titular, CUIT y QR de Data fiscal.
- Checkout: "Al confirmar aceptás los Términos y condiciones y la política de cambios".
- **SEO:** `sitemap.xml`, `robots.txt` (no indexa panel, carrito, checkout ni pedidos), imagen para compartir,
  URL canónica y datos estructurados de producto (precio, stock, marca). `metadataBase` con `NEXT_PUBLIC_SITE_URL`
  (ahora en `src/lib/sitio.ts`).
- Pasos del dominio propio en el README.

Probado (2026-10-23, servidor de producción aparte): build, tipos y lint; las páginas nuevas, `sitemap.xml`,
`robots.txt`, imagen para compartir, canonical y datos estructurados; capturas del pie, términos y arrepentimiento en
modo claro y oscuro.
Migración del arrepentimiento corrida el 2026-10-23. Botón de arrepentimiento y panel probados (24 comprobaciones):
validaciones, número o email que no coinciden (mismo mensaje), código `ARR-…` guardado con fecha y comentario, mismo
código si se repite, la clave pública no lee pedidos, aviso arriba del listado aunque esté entregado, aviso en el
detalle (comentario escapado), cancelar un entregado con arrepentimiento reponiendo el stock, y un entregado sin
arrepentimiento sigue sin poder cancelarse. También en Edge con JavaScript (error, datos conservados, confirmación
con código en modo claro y oscuro). Siguen pasando las pruebas de carrito (29), pago (18) y panel (27).
Nota para las pruebas: las páginas son estáticas (cacheComponents), así que si se envía un formulario sin JavaScript
la respuesta trae el resultado como datos de React, no como HTML ya armado. Con JavaScript (cualquier navegador) se ve normal.

### Lista para el lanzamiento

1. Cargar en `src/config/tienda.ts` todos los datos marcados (el panel muestra cuáles faltan).
2. Que el abogado o contador revise las páginas legales.
3. Cargar los productos reales y correr `npm run ejemplo:borrar`.
4. Precios reales de las zonas de envío (panel → Envíos).
5. Dominio propio (ver README) y `NEXT_PUBLIC_SITE_URL` con el dominio.
6. Mercado Pago del cliente: Access Token de producción en Vercel, webhook nuevo (URL con el dominio, evento Pagos) y
   su clave secreta en `MERCADOPAGO_WEBHOOK_SECRET`. Redeploy.
7. Primer pago real chico: que vuelva solo a la tienda, que descuente el stock y que el webhook dé 200 (ver Pendientes).
   Devolverlo desde Mercado Pago y cancelar el pedido en el panel reponiendo el stock.
8. Google Search Console: dar de alta el dominio y enviar `https://dominio/sitemap.xml`.
9. Logo y favicon del cliente (`src/app/favicon.ico`; imagen para compartir en `src/app/opengraph-image.tsx`).
10. Mails con el dominio: verificarlo en Resend (DNS), `MAIL_REMITENTE` con `pedidos@dominio` y `MAIL_AVISOS` con el
    email del cliente (ver README). Con el primer pago real, revisar que los dos mails lleguen y no caigan en spam.

## Mails automáticos (2026-10-23)

- Con Resend, por su API REST (`src/lib/mails.ts`). Variables `RESEND_API_KEY`, `MAIL_REMITENTE` y `MAIL_AVISOS`, cargadas
  en `.env.local` y en Vercel. Sin `RESEND_API_KEY` no se manda nada y la tienda funciona igual.
- **Pago confirmado** (pagado o pagado sin stock): confirmación al comprador con productos, total, entrega y link a su
  pedido; aviso "Pedido nuevo #N" al dueño con los datos del cliente y link al panel ("Responder" le escribe al cliente).
  Salen después de responder (`after`), para no demorar al comprador que vuelve de Mercado Pago.
- **Una sola vez:** la columna `orders.paid_notified_at` (migración `20261025000000_mails.sql`, corrida el 2026-10-23) la
  "toma" el primero que procesa el pago. Si Resend falla se libera y se reintenta con el próximo procesamiento del pago;
  además Resend descarta reenvíos con la misma clave de idempotencia. Los pedidos pagados antes de la migración quedaron
  marcados como avisados.
- **Botón de arrepentimiento:** el código por mail al comprador (la norma pide mandárselo) y aviso al dueño. La pantalla
  de confirmación dice "También te lo mandamos por email".
- Probado: 12 comprobaciones con Resend simulado (tres procesamientos simultáneos → un solo juego de mails, contenido,
  textos del cliente escapados, sin pagar no avisa, sin stock, retiro), falla de Resend → se reintenta, mails de
  arrepentimiento, y **envío real** a marquitosnicodiaz8@gmail.com (pedido de prueba #1070, ya borrado). Capturas de
  los dos mails. Siguen pasando las pruebas de carrito (29), pago (18), panel (27) y arrepentimiento (24 + navegador).

## Datos de ejemplo (2026-10-21)

`scripts/datos-ejemplo.mjs`, con `npm run ejemplo:cargar` y `npm run ejemplo:borrar` (detalle en el README).
Cargados en Supabase: marcas Nike, Adidas, Puma y Topper; categorías Zapatillas, Botas y Ojotas;
10 productos con talles 36 a 44 y stock variado (2 agotados: Adidas Ultraboost Light y Puma Bota Urbana)
y fotos generadas con el nombre del producto. Sus URLs empiezan con `ejemplo-`; el borrado solo toca esos
productos y las marcas/categorías de ejemplo que hayan quedado sin productos. Probado: cargar, volver a
cargar, borrar y cargar de nuevo. Jordan Air (el producto cargado a mano) no se toca.

## Qué sigue

1. Etapa 7: legales, SEO, dominio y lanzamiento (en curso). Al pasar al dominio propio: cambiar
   `NEXT_PUBLIC_SITE_URL` en Vercel y la URL del webhook en Mercado Pago. Al lanzar: credenciales de producción de
   la cuenta del cliente (Access Token y un webhook nuevo con su propia clave secreta), y verificar el webhook con el
   primer pago real (ver Pendientes).
2. ~~Mails automáticos~~ (hechos; se conectan al dominio propio en el lanzamiento).

## Pendiente con el cliente

Marcas y categorías, sistema de talles, fotos, precios de envío por zona, acceso a su cuenta de Mercado Pago, logo,
dominio, y los datos de `src/config/tienda.ts`: dirección y horarios del local, email, WhatsApp e Instagram, razón
social o titular, CUIT, domicilio legal, ciudad para la jurisdicción, QR de Data fiscal (ARCA), plazo de entrega,
plazo para cambios y quién paga el envío de un cambio.

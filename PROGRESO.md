# Progreso del proyecto

Última actualización: 2026-10-22

## Etapa actual: 6 (pedidos en el panel) hecha y probada automáticamente. Falta probarla a mano en el navegador

## Pendientes / bugs conocidos

- [x] ~~Al crear un producto no deja elegir marca ni categoría.~~ Resuelto el 2026-10-21: no era un bug,
  no había marcas ni categorías cargadas. Con los datos de ejemplo funciona.
  Mejora posible: mostrar un aviso con link a Marcas/Categorías cuando estén vacías.
- [ ] Confirmar en el navegador que al editar un producto en el panel el cambio se ve enseguida en la tienda.
- [ ] **Mails automáticos** (confirmación de pedido al comprador, aviso de pedido nuevo al dueño): pendientes,
  no entran en la Etapa 5. Mientras tanto la confirmación dice "te vamos a contactar".
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
| 5 | Mercado Pago Checkout Pro, webhook y descuento de stock | ✅ Probado (pago aprobado real en el navegador) |
| 6 | Pedidos en el panel | ✅ Probado (falta probar a mano en el navegador) |
| 7 | Legales, SEO, dominio y lanzamiento | — |

## Decisiones tomadas

- Stack: Next.js 16 + Supabase + Mercado Pago Checkout Pro + Vercel.
- Envíos: costo fijo por zona + retiro en local. **Los precios de las zonas son de ejemplo** (CABA $6.000, GBA $8.500, Interior $12.000); definirlos con el cliente.
- Compra como invitado (sin cuentas de clientes).
- Emails transaccionales: postergados para más adelante (ver Pendientes).
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
Falta probar en Vercel la vuelta automática y el webhook (necesitan https).

## Datos de ejemplo (2026-10-21)

`scripts/datos-ejemplo.mjs`, con `npm run ejemplo:cargar` y `npm run ejemplo:borrar` (detalle en el README).
Cargados en Supabase: marcas Nike, Adidas, Puma y Topper; categorías Zapatillas, Botas y Ojotas;
10 productos con talles 36 a 44 y stock variado (2 agotados: Adidas Ultraboost Light y Puma Bota Urbana)
y fotos generadas con el nombre del producto. Sus URLs empiezan con `ejemplo-`; el borrado solo toca esos
productos y las marcas/categorías de ejemplo que hayan quedado sin productos. Probado: cargar, volver a
cargar, borrar y cargar de nuevo. Jordan Air (el producto cargado a mano) no se toca.

## Qué sigue

1. Probar el panel de pedidos en el navegador (el pedido #1019 sirve para probar los botones).
2. Subir a **Vercel** para probar la vuelta automática desde Mercado Pago y los webhooks (necesitan https):
   variables de entorno, `NEXT_PUBLIC_SITE_URL=https://…` y configurar el webhook en Mercado Pago (ver README).
3. Mails automáticos: pendientes (ver Pendientes).
4. Etapa 7: legales, SEO, dominio y lanzamiento.

## Pendiente con el cliente

Marcas y categorías, sistema de talles, fotos, precios de envío por zona, dirección y horarios del local, política de cambios, datos fiscales y acceso a su cuenta de Mercado Pago.

# Tienda online – Zapatería

Next.js 16 + Supabase + Mercado Pago (Checkout Pro), deploy en Vercel.

## Puesta en marcha (desarrollo)

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env.local` y completar las claves de Supabase.
3. Base de datos: en Supabase → **SQL Editor**, pegar y ejecutar, en orden y una sola vez, cada archivo de
   `supabase/migrations/` (`20261013000000_esquema_inicial.sql`, `20261022000000_pagos.sql`,
   `20261023000000_cancelar_pedido.sql`, `20261024000000_arrepentimiento.sql`, `20261025000000_mails.sql` y
   `20261026000000_portada_y_secciones.sql`).
4. Levantar el servidor: `npm run dev` y abrir http://localhost:3000
5. Crear el usuario administrador (ver abajo) y entrar a http://localhost:3000/admin

## Usuario administrador

No hay registro público. Para dar acceso al panel:

1. Supabase → **Authentication → Users → Add user → Create new user**: email y
   contraseña, con "Auto Confirm User" tildado.
2. Supabase → **SQL Editor**, ejecutar (con el email del paso anterior):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'dueño@ejemplo.com';
   ```

Recomendado: en **Authentication → Sign In / Providers**, desactivar
"Allow new users to sign up" para que nadie pueda crearse una cuenta.

## Datos de ejemplo

Para probar la tienda sin los productos reales:

- `npm run ejemplo:cargar`: crea 4 marcas, 3 categorías y 10 productos con talles del 36 al 44
  (algunos sin stock) y fotos generadas. Se puede correr de nuevo: vuelve a crear los productos de ejemplo desde cero.
- `npm run ejemplo:borrar`: borra los productos de ejemplo (con talles y fotos) y las marcas/categorías
  de ejemplo que no tengan productos asignados. **No toca los productos reales**: los de ejemplo se
  reconocen porque su URL empieza con `ejemplo-`.

Usan la clave secreta de `.env.local`. Después de correrlos, si la tienda no muestra los cambios,
reiniciar `npm run dev` o guardar cualquier cosa en el panel (refresca la caché del catálogo).

## Mercado Pago

Checkout Pro: el comprador paga en la página de Mercado Pago. Variables en `.env.local`
(ver `.env.example`): `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` y `NEXT_PUBLIC_SITE_URL`.

- El pago se confirma consultando la API de Mercado Pago (nunca con lo que manda el navegador). Si está
  aprobado y el monto coincide, la función SQL `confirmar_pago` descuenta el stock y marca el pedido como
  pagado en una sola transacción. Si ya no hay stock, el pedido queda en `stock_issue` con una nota.
- Los avisos llegan por tres caminos, y procesar el mismo pago varias veces no tiene efecto:
  el webhook (`/api/mercadopago/webhook`), la vuelta del comprador (`/api/mercadopago/retorno`) y el botón
  "Ya pagué: actualizar estado" de la página del pedido.
- **En la PC (`http://localhost`)** Mercado Pago no vuelve a la tienda ni manda webhooks (exige https): el
  checkout lleva a la página del pedido, se paga desde ahí y después se usa "Ya pagué".
- **En Vercel:** `NEXT_PUBLIC_SITE_URL=https://…` y configurar el webhook en Mercado Pago → Tus integraciones →
  la aplicación → Webhooks: URL `https://…/api/mercadopago/webhook`, evento **Pagos**. Copiar la clave
  secreta que muestra en `MERCADOPAGO_WEBHOOK_SECRET`.
- Para probar pagos: ingresar a Mercado Pago con una **cuenta de prueba compradora** (no la vendedora) y usar
  las tarjetas de prueba de la documentación (titular `APRO` = aprobado, `OTHE` = rechazado).

## Mails automáticos

Con [Resend](https://resend.com), en `src/lib/mails.ts`. Variables: `RESEND_API_KEY`, `MAIL_REMITENTE` y
`MAIL_AVISOS` (ver `.env.example`). Sin `RESEND_API_KEY` la tienda funciona igual pero no manda mails.

- **Pago confirmado:** confirmación al comprador (productos, total, entrega y link a su pedido) y aviso de pedido
  nuevo al dueño (con los datos del cliente y link al panel; "Responder" le escribe al cliente). Si el pago quedó
  sin stock, los dos mails lo dicen. Salen una sola vez aunque el pago se procese por varios caminos: la columna
  `orders.paid_notified_at` marca que ya se avisó (migración `20261025000000_mails.sql`). Si Resend falla, se
  reintenta la próxima vez que se procese el pago.
- **Botón de arrepentimiento:** el código de solicitud al comprador y un aviso al dueño.

**Sin dominio propio (pruebas):** `MAIL_REMITENTE="Zapatería <onboarding@resend.dev>"`. Así Resend **solo entrega
a la dirección con la que se creó la cuenta de Resend**: para probar, comprar con ese email.

**Con el dominio propio:**

1. Resend → **Domains → Add Domain** con el dominio de la tienda (o un subdominio como `mail.dominio`).
2. Cargar en el DNS del dominio los registros que muestra Resend (SPF y DKIM, y el DMARC recomendado) y esperar a
   que figure **Verified**.
3. En Vercel: `MAIL_REMITENTE="Nombre de la tienda <pedidos@dominio>"` y `MAIL_AVISOS` con el email del dueño.
   Redeploy.
4. Hacer una compra de prueba y revisar que los mails no lleguen a spam.

## Inicio, menú, buscador y marcas

- **Anuncio** (barra fina de arriba) y **portadas** (carrusel del inicio): panel → **Portada**. Cada portada tiene
  foto de compu (1920×800), foto de celular opcional (900×1200), título, subtítulo, texto del botón y adónde lleva
  (sección, marca, categoría, producto u otra dirección de la tienda o https). Se pueden ocultar, reordenar y borrar.
  Sin foto, la tienda muestra un fondo neutro marcado "[Completar: foto de portada]". Pasa sola cada 6 segundos
  (no, si el sistema pide "reducir movimiento"), con botón de pausa, puntitos, flechas y deslizable en el celular.
- **Menú:** Mujer, Hombre, Niños, Tendencias, Deportes y Outlet (`src/lib/secciones.ts`), con páginas propias
  (`/mujer`, `/outlet`…) con los filtros. En cada producto del panel: **Público** (los unisex aparecen en Mujer y
  Hombre), tildes de Tendencias, Deportes y Outlet, y **precio anterior** opcional (se ve tachado con el % de descuento).
- **Buscador:** en el encabezado (en el celular, la lupa abre un buscador a pantalla completa). Busca por nombre,
  marca, categoría y público, sin importar tildes ni mayúsculas, con sugerencias mientras se escribe
  (`/api/buscar`). Enter muestra todos los resultados en `/productos?q=…`, con los filtros.
- **Marcas:** franja deslizable en el inicio y página por marca (`/marcas/nike`). El logo se carga en panel →
  Marcas (PNG/JPG/WEBP, idealmente 400×200 con fondo blanco o transparente); sin logo se muestra el nombre.
- Las fotos de portada y los logos van al mismo bucket que las fotos de productos (carpetas `portada/` y
  `marcas/`); al cambiarlos o borrarlos se borra el archivo anterior.

## Datos de la tienda y legales

Los datos del negocio están en `src/config/tienda.ts`: dirección y horarios del local, contacto, titular, CUIT,
domicilio legal, jurisdicción, link del QR de Data fiscal (ARCA), plazo de entrega y política de cambios.
Los que todavía no se cargaron están marcados con `completar("…")`: en la tienda se ven resaltados como
"[Completar: …]" y el panel muestra la lista de lo que falta. Para cargar uno, reemplazar `completar("…")`
por el texto entre comillas.

Páginas legales (texto base: conviene que las revise un abogado o el contador antes de lanzar):

- `/terminos`, `/cambios-y-devoluciones` y `/privacidad` (Ley 25.326, con los textos obligatorios).
- `/arrepentimiento`: **Botón de arrepentimiento** (Res. SCI 424/2020). El comprador pone el número de pedido y
  el email de la compra, y recibe al instante un código de solicitud (`ARR-1032-XXXX`). El pedido queda marcado en
  el panel (aviso arriba del listado y en el detalle) y, si ya estaba entregado, se puede cancelar reponiendo el
  stock. El dinero se devuelve desde Mercado Pago.
- En el pie de todas las páginas: links legales, botón de arrepentimiento, link a Defensa del Consumidor
  (Res. SCI 274/2021), titular y CUIT, y el QR de Data fiscal.

## SEO

- `src/app/sitemap.ts` y `src/app/robots.ts` generan `/sitemap.xml` y `/robots.txt` con `NEXT_PUBLIC_SITE_URL`.
  El panel, el carrito, el checkout y las páginas de pedidos no se indexan.
- `src/app/opengraph-image.tsx`: imagen al compartir un link de la tienda. Las páginas de producto usan la
  foto del producto, tienen URL canónica y datos estructurados (schema.org `Product`: precio, stock, marca).
- Después de lanzar: dar de alta el sitio en Google Search Console y enviar el sitemap.

## Dominio propio

1. Registrar el dominio (los `.com.ar` en https://nic.ar, con la clave fiscal del titular).
2. Vercel → proyecto → **Settings → Domains** → agregar el dominio y cargar en el proveedor del dominio los
   registros DNS que indica Vercel (en NIC.ar: "Delegar" a los servidores DNS de Vercel o de otro proveedor).
3. Vercel → **Environment Variables**: `NEXT_PUBLIC_SITE_URL=https://dominio` y hacer **Redeploy** (se usa al
   compilar).
4. Mercado Pago → Webhooks: cambiar la URL a `https://dominio/api/mercadopago/webhook`.

## Pruebas automáticas

```
npm run build
npm run pruebas                    # todas
npm run pruebas -- carrito pago    # solo algunas
```

Levantan la tienda compilada en http://localhost:3124 (con los mails apagados) y prueban, contra la base de
`.env.local`:

| Prueba | Qué cubre |
|---|---|
| `sql` | `confirmar_pago`: descuenta stock, pago repetido, sin stock, dos pagos por la última unidad, permisos |
| `carrito` | Carrito y checkout sin JavaScript: topes de stock, +/−, ajuste, validaciones, totales recalculados, envío y retiro |
| `pago` | Cobro en Mercado Pago, página del pedido en cada estado, vuelta del comprador, firma del webhook |
| `pedidos` | Panel de pedidos: login, filtros, búsqueda, cambios de estado, notas, cancelar, salir |
| `arrepentimiento` | Botón de arrepentimiento y su manejo en el panel |
| `tienda` | Secciones, marcas, buscador y sugerencias, 404, SEO, legales |
| `navegador-tienda` | En Edge: celular, carrito, filtros, buscadores, arrepentimiento, transiciones, "reducir movimiento" |
| `navegador-panel` | En Edge: portada (foto, textos, link), logo de marca, precio anterior |

- Todo lo que crean (pedidos, un admin temporal, archivos) se borra al terminar, y el stock vuelve a como estaba. Los
  pedidos reales no se tocan. Necesitan los datos de ejemplo cargados (`npm run ejemplo:cargar`).
- Las de navegador usan Edge (o Chrome) sin pantalla; si no está instalado, se omiten.
- Ojo: la base es la misma que la de la tienda publicada, así que mientras corren pueden verse pedidos de prueba en el
  panel por unos segundos.

## Estructura

```
src/
  app/                 Páginas (App Router)
  app/(tienda)/        Tienda pública: inicio, catálogo, producto, carrito, checkout y pedido
  app/admin/           Panel de administración (login, pedidos, productos, marcas, categorías, envíos)
  proxy.ts             Renueva la sesión y protege /admin
  components/admin/    Botones, mensajes y estilos del panel
  components/tienda/   Tarjetas y grilla de productos
  config/tienda.ts     Nombre, contacto y datos legales de la tienda (los que faltan, marcados)
  lib/catalogo.ts      Consultas del catálogo (cacheadas con la etiqueta "catalogo")
  lib/filtros.ts       Filtros y orden del catálogo
  lib/admin/           Verificación de admin (auth.ts), estados de pedidos y opciones del panel
  lib/carrito.ts       Carrito (cookie) con precios y stock leídos de la base
  lib/form.ts          Utilidades de formularios (panel y tienda)
  lib/mercadopago.ts   API de Mercado Pago (cobros, pagos, firma de webhooks)
  lib/pagos.ts         Iniciar el pago de un pedido y procesar pagos
  lib/mails.ts         Mails automáticos (Resend): pago confirmado y arrepentimiento
  lib/secciones.ts     Públicos y secciones del menú (Mujer, Hombre, Niños, Tendencias, Deportes, Outlet)
  lib/portada.ts       Portadas del carrusel y anuncio (cacheados con la etiqueta "catalogo")
  app/api/mercadopago/ Webhook y vuelta desde Mercado Pago
  lib/supabase/
    public.ts          Cliente con clave pública (RLS aplica) – catálogo
    service.ts         Cliente con clave secreta (saltea RLS) – solo servidor
    server.ts          Cliente con la sesión del usuario logueado (panel)
    browser.ts         Cliente del navegador (subida de fotos)
    env.ts             Variables de entorno y URL pública de las fotos
  lib/formato.ts       Formato de precios en pesos
  lib/sitio.ts         URL pública de la tienda (NEXT_PUBLIC_SITE_URL)
supabase/migrations/   Esquema de la base de datos (SQL)
scripts/               Datos de ejemplo (cargar / borrar)
scripts/pruebas/       Pruebas automáticas (npm run pruebas)
```

## Modelo de datos

- `brands`, `categories`: marcas y categorías.
- `products`: un producto (precio, descripción, activo/oculto).
- `product_variants`: **un registro por talle**, con su stock.
- `product_images`: fotos (archivos en el bucket `product-images` de Storage).
- `shipping_zones`: zonas de envío con costo fijo (los precios actuales son de ejemplo).
- `orders`, `order_items`: pedidos. Los ítems guardan nombre, talle y precio al momento de la compra.
  Las columnas `withdrawal_*` guardan el pedido de arrepentimiento (código, fecha y comentario).
- `admins`: usuarios que pueden entrar al panel.

Seguridad: todas las tablas tienen RLS. El público solo puede leer el catálogo
activo y las zonas de envío; los pedidos solo los ve el admin.

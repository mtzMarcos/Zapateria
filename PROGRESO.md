# Progreso del proyecto

Última actualización: 2026-10-21

## Etapa actual: 4 (carrito y checkout) en curso

## Pendientes / bugs conocidos

- [x] ~~Al crear un producto no deja elegir marca ni categoría.~~ Resuelto el 2026-10-21: no era un bug,
  no había marcas ni categorías cargadas. Con los datos de ejemplo funciona.
  Mejora posible: mostrar un aviso con link a Marcas/Categorías cuando estén vacías.
- [ ] Confirmar en el navegador que al editar un producto en el panel el cambio se ve enseguida en la tienda.
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
| 4 | Carrito y checkout (envío por zona o retiro en local) | En curso |
| 5 | Mercado Pago Checkout Pro, webhook y descuento de stock | — |
| 6 | Pedidos en el panel | — |
| 7 | Legales, SEO, dominio y lanzamiento | — |

## Decisiones tomadas

- Stack: Next.js 16 + Supabase + Mercado Pago Checkout Pro + Vercel.
- Envíos: costo fijo por zona + retiro en local. **Los precios de las zonas son de ejemplo** (CABA $6.000, GBA $8.500, Interior $12.000); definirlos con el cliente.
- Compra como invitado (sin cuentas de clientes).
- Emails transaccionales: postergados para más adelante.
- El stock se descuenta solo cuando el webhook de Mercado Pago confirma el pago aprobado.

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

## Datos de ejemplo (2026-10-21)

`scripts/datos-ejemplo.mjs`, con `npm run ejemplo:cargar` y `npm run ejemplo:borrar` (detalle en el README).
Cargados en Supabase: marcas Nike, Adidas, Puma y Topper; categorías Zapatillas, Botas y Ojotas;
10 productos con talles 36 a 44 y stock variado (2 agotados: Adidas Ultraboost Light y Puma Bota Urbana)
y fotos generadas con el nombre del producto. Sus URLs empiezan con `ejemplo-`; el borrado solo toca esos
productos y las marcas/categorías de ejemplo que hayan quedado sin productos. Probado: cargar, volver a
cargar, borrar y cargar de nuevo. Jordan Air (el producto cargado a mano) no se toca.

## Qué sigue

1. **Etapa 4: carrito y checkout** (envío por zona o retiro en local).
2. (Opcional) Conectar el repositorio con Vercel y cargar las mismas variables de entorno.

## Pendiente con el cliente

Marcas y categorías, sistema de talles, fotos, precios de envío por zona, dirección y horarios del local, política de cambios, datos fiscales y acceso a su cuenta de Mercado Pago.

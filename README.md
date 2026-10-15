# Tienda online – Zapatería

Next.js 16 + Supabase + Mercado Pago (Checkout Pro), deploy en Vercel.

## Puesta en marcha (desarrollo)

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env.local` y completar las claves de Supabase.
3. Base de datos: en Supabase → **SQL Editor**, pegar y ejecutar el contenido de
   `supabase/migrations/20261013000000_esquema_inicial.sql` (una sola vez).
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

## Estructura

```
src/
  app/                 Páginas (App Router)
  app/admin/           Panel de administración (login, productos, marcas, categorías, envíos)
  proxy.ts             Renueva la sesión y protege /admin
  components/admin/    Botones, mensajes y estilos del panel
  config/tienda.ts     Nombre y datos generales de la tienda
  lib/admin/           Verificación de admin (auth.ts) y utilidades de formularios
  lib/supabase/
    public.ts          Cliente con clave pública (RLS aplica) – catálogo
    service.ts         Cliente con clave secreta (saltea RLS) – solo servidor
    server.ts          Cliente con la sesión del usuario logueado (panel)
    browser.ts         Cliente del navegador (subida de fotos)
    env.ts             Variables de entorno y URL pública de las fotos
  lib/formato.ts       Formato de precios en pesos
supabase/migrations/   Esquema de la base de datos (SQL)
```

## Modelo de datos

- `brands`, `categories`: marcas y categorías.
- `products`: un producto (precio, descripción, activo/oculto).
- `product_variants`: **un registro por talle**, con su stock.
- `product_images`: fotos (archivos en el bucket `product-images` de Storage).
- `shipping_zones`: zonas de envío con costo fijo (los precios actuales son de ejemplo).
- `orders`, `order_items`: pedidos. Los ítems guardan nombre, talle y precio al momento de la compra.
- `admins`: usuarios que pueden entrar al panel.

Seguridad: todas las tablas tienen RLS. El público solo puede leer el catálogo
activo y las zonas de envío; los pedidos solo los ve el admin.

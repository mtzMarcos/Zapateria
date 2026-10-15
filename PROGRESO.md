# Progreso del proyecto

Última actualización: 2026-10-15

## Etapa actual: 1 terminada en código, falta configurar Supabase

Repositorio: https://github.com/mtzMarcos/Zapateria (privado, rama `main`).

## Empezar en una PC nueva

1. Instalar Node.js LTS, Git y VS Code.
2. `git clone https://github.com/mtzMarcos/Zapateria.git` y entrar a la carpeta.
3. `npm install` (la carpeta `node_modules` no se sube a GitHub).
4. Copiar `.env.example` como `.env.local` y completar las claves desde el panel de Supabase.
   `.env.local` **no está en el repositorio a propósito** (tiene claves secretas): hay que crearlo en cada PC.
5. `npm run dev` y abrir http://localhost:3000

Rutina entre PCs: `git pull` antes de empezar, `git push` al terminar.

## Plan de etapas

| Etapa | Descripción | Estado |
|---|---|---|
| 0 | Relevamiento con el cliente | Pendiente |
| 1 | Base del proyecto y modelo de datos | ✅ Código listo, falta probar con Supabase |
| 2 | Panel de administración (login, productos, fotos, stock por talle) | Siguiente |
| 3 | Catálogo público con filtros y página de producto | — |
| 4 | Carrito y checkout (envío por zona o retiro en local) | — |
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

## Qué sigue

1. **Configurar Supabase (todavía no se hizo):**
   1. Crear el proyecto en supabase.com (región South America – São Paulo).
   2. SQL Editor → New query → pegar todo `supabase/migrations/20261013000000_esquema_inicial.sql` → Run.
      Debe decir "Success. No rows returned". Todavía no se probó contra una base real: si da error, copiarlo tal cual.
   3. Crear `.env.local` con las 3 claves de Project Settings → API Keys.
   4. `npm run dev` y verificar que la página de inicio muestre "✅ Conectado a Supabase" y las 3 zonas de envío.
2. (Opcional) Conectar el repositorio con Vercel y cargar las mismas variables de entorno.
3. Arrancar la **Etapa 2: panel de administración** (login del dueño, alta/edición de productos, fotos y stock por talle).

## Pendiente con el cliente

Marcas y categorías, sistema de talles, fotos, precios de envío por zona, dirección y horarios del local, política de cambios, datos fiscales y acceso a su cuenta de Mercado Pago.

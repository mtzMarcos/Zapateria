-- =====================================================================
-- Portada, secciones del menú, logos de marcas y anuncio
-- Se ejecuta una sola vez en el SQL Editor de Supabase (después de
-- 20261025000000_mails.sql).
-- =====================================================================


-- ---------------------------------------------------------------------
-- Productos: público, secciones y precio anterior
-- ---------------------------------------------------------------------

-- Público del producto. Los unisex aparecen en Mujer y en Hombre.
-- Las secciones Tendencias, Deportes y Outlet son marcas que elige el dueño.
-- compare_at_price: precio anterior opcional (se muestra tachado, con el
-- porcentaje de descuento). Si está, tiene que ser mayor que el precio.
alter table public.products
  add column audience text not null default 'unisex'
    check (audience in ('mujer', 'hombre', 'ninos', 'unisex')),
  add column is_trending boolean not null default false,
  add column is_sports boolean not null default false,
  add column is_outlet boolean not null default false,
  add column compare_at_price numeric(12, 2),
  add constraint products_compare_at_price_check
    check (compare_at_price is null or compare_at_price > price);


-- ---------------------------------------------------------------------
-- Marcas: logo
-- ---------------------------------------------------------------------

-- Ruta del logo en el bucket product-images (carpeta marcas/). Vacío: la
-- tienda muestra solo el nombre.
alter table public.brands
  add column logo_path text;


-- ---------------------------------------------------------------------
-- Portada: fotos grandes del carrusel del inicio
-- ---------------------------------------------------------------------

-- Las fotos van en el bucket product-images (carpeta portada/). Sin foto, la
-- tienda muestra un fondo neutro marcado "[Completar: foto de portada]".
-- Los links solo pueden ser de la tienda ("/…") o https: así nadie puede
-- guardar un link "javascript:".
create table public.home_slides (
  id                uuid primary key default gen_random_uuid(),
  title             text not null default '',
  subtitle          text not null default '',
  button_text       text not null default 'Comprar ahora',
  button_url        text not null default '/productos'
                      check (button_url ~ '^(/|https://)'),
  image_path        text,           -- foto para compu (recomendado 1920×800)
  mobile_image_path text,           -- foto para celular, opcional (900×1200)
  position          integer not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger home_slides_updated_at
  before update on public.home_slides
  for each row execute function public.set_updated_at();

-- Portadas de ejemplo, para que el inicio no quede vacío. El dueño las edita
-- (o las borra) desde el panel.
insert into public.home_slides (title, subtitle, button_text, button_url, position) values
  ('Nueva temporada', 'Los modelos que recién llegan.', 'Comprar ahora', '/tendencias', 1),
  ('Para entrenar', 'Zapatillas para correr, entrenar y jugar.', 'Ver deportes', '/deportes', 2),
  ('Outlet', 'Precios especiales por tiempo limitado.', 'Ver ofertas', '/outlet', 3);


-- ---------------------------------------------------------------------
-- Configuración del sitio: anuncio de la barra fina de arriba
-- ---------------------------------------------------------------------

-- Una sola fila (id siempre true).
create table public.site_settings (
  id                  boolean primary key default true check (id),
  announcement_text   text not null default '',
  announcement_url    text check (announcement_url is null or announcement_url ~ '^(/|https://)'),
  announcement_active boolean not null default true,
  updated_at          timestamptz not null default now()
);

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (announcement_text) values ('Retirá gratis en el local');


-- ---------------------------------------------------------------------
-- Seguridad (RLS) y permisos de la API
-- ---------------------------------------------------------------------

alter table public.home_slides   enable row level security;
alter table public.site_settings enable row level security;

-- Portadas: el público ve las visibles; el admin ve y edita todas.
create policy "Lectura pública de activas" on public.home_slides
  for select using (active or public.is_admin());
create policy "Admin gestiona" on public.home_slides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Configuración: lectura pública, solo el admin la cambia (no se crean ni
-- borran filas: hay una sola).
create policy "Lectura pública" on public.site_settings
  for select using (true);
create policy "Admin edita" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.home_slides, public.site_settings to anon, authenticated;
grant insert, update, delete on public.home_slides to authenticated;
grant update on public.site_settings to authenticated;
grant all on public.home_slides, public.site_settings to service_role;

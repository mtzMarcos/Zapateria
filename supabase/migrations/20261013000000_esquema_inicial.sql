-- =====================================================================
-- Esquema inicial de la tienda
-- Se ejecuta una sola vez en el SQL Editor de Supabase.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------

-- Actualiza la columna updated_at cada vez que se modifica una fila.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- Administradores
-- No hay registro público: el dueño se crea a mano en Supabase y se
-- agrega su id a esta tabla.
-- ---------------------------------------------------------------------

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Devuelve true si el usuario logueado es administrador.
-- "security definer" le permite leer la tabla admins aunque el usuario
-- no tenga permiso directo sobre ella.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;


-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------

create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  brand_id    uuid references public.brands (id) on delete restrict,
  category_id uuid references public.categories (id) on delete restrict,
  price       numeric(12, 2) not null check (price >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_brand_id_idx on public.products (brand_id);
create index products_category_id_idx on public.products (category_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt          text not null default '',
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

-- Una variante = un producto en un talle. El stock vive acá.
create table public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size       text not null,
  stock      integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size)
);

create index product_variants_product_id_idx on public.product_variants (product_id);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- Envíos
-- ---------------------------------------------------------------------

create table public.shipping_zones (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  price      numeric(12, 2) not null check (price >= 0),
  active     boolean not null default true,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  -- Número corto y legible para el cliente ("Pedido #1001").
  order_number      bigint generated always as identity (start with 1001) unique,
  status            text not null default 'pending_payment' check (status in (
                      'pending_payment',  -- esperando el pago
                      'paid',             -- pago aprobado, stock descontado
                      'payment_rejected', -- el pago fue rechazado
                      'cancelled',        -- cancelado (vencido, arrepentimiento, etc.)
                      'stock_issue',      -- pagado pero sin stock: revisar a mano
                      'preparing',        -- el dueño lo está preparando
                      'shipped',          -- despachado
                      'ready_for_pickup', -- listo para retirar en el local
                      'delivered'         -- entregado
                    )),

  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,

  delivery_method   text not null check (delivery_method in ('shipping', 'pickup')),
  shipping_zone_id  uuid references public.shipping_zones (id) on delete set null,
  -- Se copia el nombre de la zona por si después se borra o renombra.
  shipping_zone_name text,
  address_street    text,
  address_number    text,
  address_apartment text,
  address_city      text,
  address_province  text,
  address_postal_code text,
  address_notes     text,

  subtotal          numeric(12, 2) not null check (subtotal >= 0),
  shipping_cost     numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  total             numeric(12, 2) not null check (total >= 0),

  mp_preference_id  text,
  mp_payment_id     text unique,
  paid_at           timestamptz,
  admin_notes       text not null default '',

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Si es envío a domicilio, la dirección es obligatoria.
  constraint orders_shipping_address_required check (
    delivery_method = 'pickup'
    or (shipping_zone_name is not null
        and address_street is not null
        and address_number is not null
        and address_city is not null
        and address_province is not null
        and address_postal_code is not null)
  )
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Cada renglón del pedido guarda una "foto" del producto al momento de la
-- compra (nombre, talle y precio), para que el pedido no cambie si después
-- el dueño edita o borra el producto.
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  variant_id   uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  size         text not null,
  unit_price   numeric(12, 2) not null check (unit_price >= 0),
  quantity     integer not null check (quantity > 0)
);

create index order_items_order_id_idx on public.order_items (order_id);


-- ---------------------------------------------------------------------
-- Seguridad: Row Level Security (RLS)
--
-- Con RLS activado, nadie puede leer ni escribir una tabla salvo lo que
-- permitan las políticas de abajo. El servidor de la tienda usa la clave
-- secreta (que saltea RLS) solo para crear pedidos y procesar pagos.
-- ---------------------------------------------------------------------

alter table public.admins           enable row level security;
alter table public.brands           enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.shipping_zones   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- admins: sin políticas. Solo se consulta a través de is_admin().

-- Marcas y categorías: lectura pública, escritura solo admin.
create policy "Lectura pública" on public.brands
  for select using (true);
create policy "Admin gestiona" on public.brands
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Lectura pública" on public.categories
  for select using (true);
create policy "Admin gestiona" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Productos: el público solo ve los activos; el admin ve y edita todos.
create policy "Lectura pública de activos" on public.products
  for select using (active or public.is_admin());
create policy "Admin gestiona" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Fotos y talles: visibles si el producto es visible.
create policy "Lectura pública" on public.product_images
  for select using (
    exists (select 1 from public.products p
            where p.id = product_id and (p.active or public.is_admin()))
  );
create policy "Admin gestiona" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Lectura pública" on public.product_variants
  for select using (
    exists (select 1 from public.products p
            where p.id = product_id and (p.active or public.is_admin()))
  );
create policy "Admin gestiona" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Zonas de envío: el público ve las activas.
create policy "Lectura pública de activas" on public.shipping_zones
  for select using (active or public.is_admin());
create policy "Admin gestiona" on public.shipping_zones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Pedidos: el público NO tiene acceso. Solo el admin los ve y actualiza.
-- (Los pedidos los crea el servidor con la clave secreta.)
create policy "Admin ve pedidos" on public.orders
  for select to authenticated using (public.is_admin());
create policy "Admin actualiza pedidos" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admin ve items" on public.order_items
  for select to authenticated using (public.is_admin());


-- ---------------------------------------------------------------------
-- Permisos de la API
-- (RLS sigue decidiendo qué filas se pueden tocar; esto solo habilita
-- el acceso a las tablas desde la API de Supabase.)
-- ---------------------------------------------------------------------

grant select on public.brands, public.categories, public.products,
  public.product_images, public.product_variants, public.shipping_zones
  to anon, authenticated;

grant insert, update, delete on public.brands, public.categories, public.products,
  public.product_images, public.product_variants, public.shipping_zones
  to authenticated;

grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

grant execute on function public.is_admin() to anon, authenticated;


-- ---------------------------------------------------------------------
-- Fotos de productos (Supabase Storage)
-- Bucket público: cualquiera puede ver las fotos, solo el admin las sube.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB por foto
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Admin sube fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admin edita fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy "Admin borra fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());


-- ---------------------------------------------------------------------
-- Datos iniciales
-- ---------------------------------------------------------------------

-- Zonas de envío. PRECIOS DE EJEMPLO: definirlos con el cliente.
insert into public.shipping_zones (name, price, position) values
  ('CABA', 6000, 1),
  ('Gran Buenos Aires', 8500, 2),
  ('Interior del país', 12000, 3);

-- =====================================================================
-- Navegación: subcategorías y tarjetas del inicio
-- Se ejecuta una sola vez en el SQL Editor de Supabase (después de
-- 20261027000000_color_portadas.sql). El código de main no usa nada de
-- esto, así que se puede correr antes de pasar la rama a main.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Subcategorías: una categoría puede estar "dentro de" otra
-- ---------------------------------------------------------------------

-- Un solo nivel: Zapatillas → Running, pero Running no puede tener
-- subcategorías. Los productos siguen teniendo una sola categoría, que puede
-- ser la madre (Zapatillas) o una subcategoría (Running).
-- on delete restrict: no se puede borrar una categoría con subcategorías.
alter table public.categories
  add column parent_id uuid references public.categories (id) on delete restrict,
  add constraint categories_parent_id_check check (parent_id is null or parent_id <> id);

create index categories_parent_id_idx on public.categories (parent_id);

create or replace function public.categories_un_nivel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null then
    if exists (select 1 from public.categories where id = new.parent_id and parent_id is not null) then
      raise exception 'Una subcategoría no puede tener subcategorías.' using errcode = '23514';
    end if;
    if exists (select 1 from public.categories where parent_id = new.id) then
      raise exception 'Una categoría con subcategorías no puede ir dentro de otra.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger categories_un_nivel
  before insert or update of parent_id on public.categories
  for each row execute function public.categories_un_nivel();


-- ---------------------------------------------------------------------
-- Tarjetas del inicio: Tendencias, Deportes y Outlet
-- ---------------------------------------------------------------------

-- Una fila por sección (no se crean ni se borran: solo se editan). Llevan a
-- /tendencias, /deportes y /outlet. La foto va en el bucket product-images
-- (carpeta portada/); sin foto, la tienda muestra un fondo neutro marcado
-- "[Completar: foto]". Una tarjeta oculta, o de una sección sin productos,
-- no se muestra.
create table public.home_cards (
  section    text primary key check (section in ('tendencias', 'deportes', 'outlet')),
  title      text not null default '',
  subtitle   text not null default '',
  image_path text,                    -- vertical, recomendado 900×1200
  position   integer not null default 0,
  active     boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger home_cards_updated_at
  before update on public.home_cards
  for each row execute function public.set_updated_at();

insert into public.home_cards (section, title, subtitle, position) values
  ('tendencias', 'Tendencias', 'Los modelos que se están usando.', 1),
  ('deportes', 'Deportes', 'Para correr, entrenar y jugar.', 2),
  ('outlet', 'Outlet', 'Precios especiales por tiempo limitado.', 3);

alter table public.home_cards enable row level security;

-- El público ve las visibles; el admin ve todas y las edita.
create policy "Lectura pública de activas" on public.home_cards
  for select using (active or public.is_admin());
create policy "Admin edita" on public.home_cards
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.home_cards to anon, authenticated;
grant update on public.home_cards to authenticated;
grant all on public.home_cards to service_role;

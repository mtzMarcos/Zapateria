-- =====================================================================
-- Color de las fotos de portada
-- Se ejecuta una sola vez en el SQL Editor de Supabase (después de
-- 20261026000000_portada_y_secciones.sql).
-- =====================================================================

-- Color dominante de la franja de abajo de cada foto de portada (compu y
-- celular), en formato #rrggbb. Lo calcula el navegador al subir la foto desde
-- el panel. La tienda lo usa para el degradado que une la portada con el resto
-- de la página. Vacío: se usa un gris neutro.
alter table public.home_slides
  add column image_color text check (image_color ~ '^#[0-9a-fA-F]{6}$'),
  add column mobile_image_color text check (mobile_image_color ~ '^#[0-9a-fA-F]{6}$');

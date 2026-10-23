-- =====================================================================
-- Etapa 7: botón de arrepentimiento (Resolución SCI 424/2020)
-- Se ejecuta una sola vez en el SQL Editor de Supabase (después de
-- 20261023000000_cancelar_pedido.sql).
-- =====================================================================

-- El comprador pide revocar la compra desde /arrepentimiento con su número de
-- pedido y su email. Se guarda en el pedido, con un código que se le muestra
-- al instante (la norma exige darle un código de identificación de la
-- solicitud). Lo escribe el servidor con la clave secreta: el público sigue
-- sin acceso a la tabla orders.
alter table public.orders
  add column withdrawal_code text unique,
  add column withdrawal_requested_at timestamptz,
  add column withdrawal_reason text check (char_length(withdrawal_reason) <= 1000);

-- Un pedido entregado ahora se puede cancelar si el cliente pidió el
-- arrepentimiento (devuelve el producto): así el dueño puede cerrar la
-- solicitud y reponer el stock. Sin arrepentimiento, entregado sigue sin poder
-- cancelarse. El resto es igual a 20261023000000_cancelar_pedido.sql.
create or replace function public.cancelar_pedido(p_order_id uuid, p_reponer_stock boolean)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
  v_arrepentimiento text;
begin
  select status, withdrawal_code into v_status, v_arrepentimiento
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'no_existe';
  end if;

  if v_status = 'cancelled' or (v_status = 'delivered' and v_arrepentimiento is null) then
    return 'no_cancelable';
  end if;

  if p_reponer_stock and v_status in ('paid', 'preparing', 'shipped', 'ready_for_pickup', 'delivered') then
    -- Los talles borrados (variant_id null) no se pueden reponer.
    update public.product_variants v
    set stock = v.stock + i.cantidad
    from (
      select variant_id, sum(quantity) as cantidad
      from public.order_items
      where order_id = p_order_id and variant_id is not null
      group by variant_id
    ) i
    where v.id = i.variant_id;
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;
  return v_status;
end;
$$;

-- Solo el servidor (clave secreta) puede llamarla.
revoke execute on function public.cancelar_pedido(uuid, boolean) from public, anon, authenticated;
grant execute on function public.cancelar_pedido(uuid, boolean) to service_role;

-- =====================================================================
-- Etapa 6: cancelar pedidos desde el panel
-- Se ejecuta una sola vez en el SQL Editor de Supabase (después de
-- 20261022000000_pagos.sql).
-- =====================================================================

-- Cancela un pedido y, si se pide, devuelve al stock las unidades que se
-- descontaron al confirmar el pago. Todo en una sola transacción.
--
-- Solo se descontó stock en los pedidos pagados (paid y los estados que
-- siguen). En 'stock_issue' no se descontó nada, así que no se repone.
-- Un pedido entregado o ya cancelado no se puede cancelar.
--
-- Lo llama el servidor (clave secreta) después de verificar que quien lo
-- pide es admin. Devuelve el estado anterior del pedido, o 'no_existe' /
-- 'no_cancelable'.
create or replace function public.cancelar_pedido(p_order_id uuid, p_reponer_stock boolean)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'no_existe';
  end if;

  if v_status in ('delivered', 'cancelled') then
    return 'no_cancelable';
  end if;

  if p_reponer_stock and v_status in ('paid', 'preparing', 'shipped', 'ready_for_pickup') then
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

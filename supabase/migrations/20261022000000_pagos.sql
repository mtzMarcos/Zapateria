-- =====================================================================
-- Etapa 5: confirmación de pagos de Mercado Pago
-- Se ejecuta una sola vez en el SQL Editor de Supabase (después del
-- esquema inicial).
-- =====================================================================

-- Confirma el pago aprobado de un pedido: descuenta el stock y lo marca
-- como pagado, todo en una sola transacción.
--
-- Lo llama el servidor de la tienda (clave secreta) cuando Mercado Pago
-- informa un pago aprobado. Puede llegar dos veces el mismo aviso (webhook
-- y vuelta del comprador): si el pedido ya está procesado no hace nada.
--
-- Si al momento de pagar ya no hay stock de algún talle (otro comprador
-- pagó antes la última unidad), no descuenta nada y deja el pedido en
-- 'stock_issue' para que el dueño lo resuelva (devolver el dinero o
-- conseguir el producto).
--
-- Devuelve el estado en que quedó el pedido, o 'no_existe'.
create or replace function public.confirmar_pago(p_order_id uuid, p_payment_id text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
  v_sin_stock boolean;
begin
  -- Bloquea el pedido: un segundo aviso del mismo pago espera acá.
  select status into v_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'no_existe';
  end if;

  if v_status not in ('pending_payment', 'payment_rejected', 'cancelled') then
    return v_status; -- ya procesado
  end if;

  -- Bloquea los talles del pedido para que dos pagos simultáneos no
  -- vendan la misma unidad.
  perform 1
  from public.product_variants
  where id in (select variant_id from public.order_items where order_id = p_order_id)
  order by id
  for update;

  -- Falta stock si algún talle ya no existe o no alcanza.
  select exists (
    select 1
    from (
      select variant_id, sum(quantity) as cantidad
      from public.order_items
      where order_id = p_order_id
      group by variant_id
    ) i
    left join public.product_variants v on v.id = i.variant_id
    where v.id is null or v.stock < i.cantidad
  ) into v_sin_stock;

  if v_sin_stock then
    update public.orders
    set status = 'stock_issue', mp_payment_id = p_payment_id, paid_at = now()
    where id = p_order_id;
    return 'stock_issue';
  end if;

  update public.product_variants v
  set stock = v.stock - i.cantidad
  from (
    select variant_id, sum(quantity) as cantidad
    from public.order_items
    where order_id = p_order_id
    group by variant_id
  ) i
  where v.id = i.variant_id;

  update public.orders
  set status = 'paid', mp_payment_id = p_payment_id, paid_at = now()
  where id = p_order_id;

  return 'paid';
end;
$$;

-- Solo el servidor (clave secreta) puede llamarla.
revoke execute on function public.confirmar_pago(uuid, text) from public, anon, authenticated;
grant execute on function public.confirmar_pago(uuid, text) to service_role;

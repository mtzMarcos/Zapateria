-- =====================================================================
-- Mails automáticos: marca de "ya se avisó el pago"
-- Se ejecuta una sola vez en el SQL Editor de Supabase (después de
-- 20261024000000_arrepentimiento.sql).
-- =====================================================================

-- Cuando se confirma un pago se manda un mail al comprador y otro al dueño.
-- El mismo pago se puede procesar varias veces y al mismo tiempo (webhook,
-- vuelta del comprador, botón "Ya pagué"): el servidor "toma" el aviso
-- completando esta columna solo si está vacía, así los mails salen una vez.
alter table public.orders
  add column paid_notified_at timestamptz;

-- Los pedidos que ya estaban pagados (o más avanzados) antes de los mails
-- cuentan como avisados: no se les manda nada tarde. Los cancelados sin pago
-- quedan sin marcar: si después llega un pago, se avisa.
update public.orders
set paid_notified_at = coalesce(paid_at, now())
where paid_at is not null
   or status not in ('pending_payment', 'payment_rejected', 'cancelled');

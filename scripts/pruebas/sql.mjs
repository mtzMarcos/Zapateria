// Función SQL confirmar_pago: descuenta el stock y marca el pedido pagado en una
// sola transacción. La llama el servidor cuando Mercado Pago aprueba un pago.
import { borrarPedidos, check, crearPedido, db, publico, stockDe, talle, terminar } from "./utilidades.mjs";

const rock = await talle("ejemplo-topper-rock", "40");
const stockOriginal = rock.stock;
const creados = [];
const confirmar = (id, pago = `prueba-${crypto.randomUUID()}`) => db.rpc("confirmar_pago", { p_order_id: id, p_payment_id: pago });
const nuevo = async (cantidad, status = "pending_payment") => {
  const p = await crearPedido({ variante: rock, status, cantidad });
  creados.push(p.id);
  return p;
};

try {
  await db.from("product_variants").update({ stock: 5 }).eq("id", rock.id);

  const a = await nuevo(2);
  let r = await confirmar(a.id, "pago-a");
  const filaA = (await db.from("orders").select("status, mp_payment_id, paid_at").eq("id", a.id).single()).data;
  check(r.data === "paid" && (await stockDe(rock.id)) === 3, `pago aprobado: pagado y descuenta stock (5 → ${await stockDe(rock.id)})`);
  check(filaA.mp_payment_id === "pago-a" && filaA.paid_at, "guarda el número de operación y la fecha de pago");
  r = await confirmar(a.id, "pago-a");
  check(r.data === "paid" && (await stockDe(rock.id)) === 3, "el mismo pago otra vez no descuenta de nuevo");

  const b = await nuevo(1, "payment_rejected");
  r = await confirmar(b.id);
  check(r.data === "paid" && (await stockDe(rock.id)) === 2, "rechazado y después aprobado: se confirma");

  const c = await nuevo(5);
  r = await confirmar(c.id);
  check(r.data === "stock_issue" && (await stockDe(rock.id)) === 2, "sin stock suficiente: queda “pagado sin stock” y no descuenta");

  // Dos pagos al mismo tiempo por la última unidad.
  await db.from("product_variants").update({ stock: 1 }).eq("id", rock.id);
  const d = await nuevo(1);
  const e = await nuevo(1);
  const [rd, re] = await Promise.all([confirmar(d.id), confirmar(e.id)]);
  check([rd.data, re.data].toSorted().join(",") === "paid,stock_issue", `dos pagos por la última unidad: uno pagado y otro sin stock (${rd.data}, ${re.data})`);
  check((await stockDe(rock.id)) === 0, "el stock nunca queda negativo");

  r = await confirmar(crypto.randomUUID());
  check(r.data === "no_existe", "pedido inexistente: no_existe");
  const anon = await publico().rpc("confirmar_pago", { p_order_id: a.id, p_payment_id: "x" });
  check(!!anon.error, "la clave pública no puede confirmar pagos");
  const cancelar = await publico().rpc("cancelar_pedido", { p_order_id: a.id, p_reponer_stock: true });
  check(!!cancelar.error, "la clave pública no puede cancelar pedidos");
} finally {
  await borrarPedidos(creados);
  await db.from("product_variants").update({ stock: stockOriginal }).eq("id", rock.id);
  console.log(`\nLimpieza: ${creados.length} pedidos de prueba borrados; stock restaurado a ${stockOriginal}.`);
  terminar("Funciones SQL");
}

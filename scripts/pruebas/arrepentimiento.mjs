// Botón de arrepentimiento (formulario público) y su manejo en el panel.
// La página es estática: sin JavaScript, la respuesta trae el resultado como
// datos de React (no como HTML armado), así que se buscan los datos.
import {
  borrarAdmin,
  borrarPedidos,
  check,
  crearAdmin,
  crearPedido,
  db,
  formularios,
  login,
  nuevoCliente,
  publico,
  stockDe,
  talle,
  terminar,
} from "./utilidades.mjs";

const rock = await talle("ejemplo-topper-rock", "40");
const stockOriginal = rock.stock;
const creados = [];
let admin;
const EMAIL = "Comprador.Arrep@Ejemplo.com";

try {
  const entregado = await crearPedido({ variante: rock, status: "delivered", cantidad: 2, email: EMAIL });
  const otro = await crearPedido({ variante: rock, status: "paid", email: EMAIL });
  creados.push(entregado.id, otro.id);
  const c = nuevoCliente();
  const pedir = async (campos) => c.enviar("/arrepentimiento", formularios((await c.get("/arrepentimiento")).html)[0], campos);

  // --- Formulario público
  const pagina = (await c.get("/arrepentimiento")).html;
  check(pagina.includes("10 días corridos") && pagina.includes("Revocar la compra"), "la página explica el plazo y tiene el formulario");
  check((await c.get("/")).html.includes('href="/arrepentimiento"'), "el pie de la tienda tiene el link al botón");

  let r = await pedir({ pedido: String(entregado.order_number), email: "otro@ejemplo.com" });
  check(r.html.includes("No encontramos un pedido") && !/ARR-\d+-/.test(r.html), "email que no coincide: error, sin código");
  r = await pedir({ pedido: "999999999", email: EMAIL });
  check(r.html.includes("No encontramos un pedido"), "pedido inexistente: el mismo mensaje (no revela si existe)");
  r = await pedir({ pedido: "abc", email: "no-es-email" });
  check(r.html.includes("Revisá el número de pedido y el email"), "datos inválidos: error de validación");
  check(r.html.includes('"pedido":"abc"'), "devuelve lo escrito para no perderlo");

  r = await pedir({ pedido: `#${entregado.order_number}`, email: "COMPRADOR.arrep@ejemplo.com", motivo: "No me quedó bien <b>" });
  const codigo = r.html.match(/ARR-\d+-[A-Z0-9]{4}/)?.[0];
  check(codigo?.startsWith(`ARR-${entregado.order_number}-`), `con "#" y otras mayúsculas: registra y da el código (${codigo})`);
  let fila = (await db.from("orders").select("withdrawal_code, withdrawal_requested_at, withdrawal_reason, status").eq("id", entregado.id).single()).data;
  check(fila.withdrawal_code === codigo && fila.withdrawal_requested_at && fila.withdrawal_reason === "No me quedó bien <b>", "queda guardado en el pedido (código, fecha y comentario)");
  check(fila.status === "delivered", "no cambia el estado del pedido");
  r = await pedir({ pedido: String(entregado.order_number), email: EMAIL });
  check(r.html.includes(codigo), "pedirlo de nuevo devuelve el mismo código");
  const { data: visto } = await publico().from("orders").select("withdrawal_code").eq("id", entregado.id);
  check(!visto?.length, "la clave pública no puede leer los pedidos");

  // --- Panel
  admin = await crearAdmin();
  await login(c, admin);
  let p = (await c.get("/admin/pedidos")).html;
  check(p.includes("Botón de arrepentimiento:") && p.includes(`#${entregado.order_number}`), "el listado avisa arriba (aunque el pedido esté entregado)");
  p = (await c.get(`/admin/pedidos?q=${entregado.order_number}`)).html;
  check(p.includes("Pidió arrepentimiento"), "en la fila del pedido figura el arrepentimiento");
  p = (await c.get(`/admin/pedidos/${entregado.id}`)).html;
  check(p.includes("El cliente pidió revocar la compra") && p.includes(codigo) && p.includes("No me quedó bien &lt;b&gt;"), "el detalle muestra el aviso, el código y el comentario (escapado)");
  check(p.includes("Cancelar pedido") && p.includes('name="reponer"'), "entregado con arrepentimiento: se puede cancelar reponiendo stock");
  check(!(await c.get(`/admin/pedidos/${otro.id}`)).html.includes("El cliente pidió revocar"), "un pedido sin arrepentimiento no muestra el aviso");

  const stockAntes = await stockDe(rock.id);
  r = await c.enviar(`/admin/pedidos/${entregado.id}`, formularios(p).find((f) => f.html.includes("Cancelar pedido")), { reponer: "on" });
  fila = (await db.from("orders").select("status").eq("id", entregado.id).single()).data;
  check(fila.status === "cancelled" && (await stockDe(rock.id)) === stockAntes + 2, `cancelado y stock ${stockAntes} → ${await stockDe(rock.id)}`);
  check(!(await c.get("/admin/pedidos")).html.includes("Botón de arrepentimiento:"), "cancelado, deja de avisar arriba del listado");

  await db.from("orders").update({ status: "delivered" }).eq("id", otro.id);
  const rpc = await db.rpc("cancelar_pedido", { p_order_id: otro.id, p_reponer_stock: true });
  check(rpc.data === "no_cancelable", "entregado sin arrepentimiento: la función SQL no lo cancela");
  check(!(await c.get(`/admin/pedidos/${otro.id}`)).html.includes("Cancelar pedido"), "entregado sin arrepentimiento: el panel no ofrece cancelar");
} finally {
  await borrarPedidos(creados);
  await db.from("product_variants").update({ stock: stockOriginal }).eq("id", rock.id);
  await borrarAdmin(admin);
  console.log(`\nLimpieza: ${creados.length} pedidos de prueba y el admin temporal borrados; stock restaurado a ${stockOriginal}.`);
  terminar("Botón de arrepentimiento");
}

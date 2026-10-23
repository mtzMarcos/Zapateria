// Panel de pedidos con un admin temporal: login, listado, filtros, búsqueda,
// cambios de estado, notas, cancelar (con y sin reponer stock) y salir.
import {
  borrarAdmin,
  borrarPedidos,
  check,
  crearAdmin,
  crearPedido,
  db,
  formularioCon,
  login,
  nuevoCliente,
  stockDe,
  talle,
  terminar,
} from "./utilidades.mjs";

const rock = await talle("ejemplo-topper-rock", "40");
const stockOriginal = rock.stock;
const creados = [];
let admin;
const nuevo = async (opciones) => {
  const p = await crearPedido({ variante: rock, ...opciones });
  creados.push(p.id);
  return p;
};
const estado = async (id) => (await db.from("orders").select("status").eq("id", id).single()).data.status;

try {
  const c = nuevoCliente();
  check((await c.get("/admin/pedidos")).location?.includes("/admin/login"), "sin sesión, el panel manda al login");

  admin = await crearAdmin();
  const entrada = await login(c, admin);
  check(entrada.status === 303 && entrada.location === "/admin/pedidos", `el login lleva a Pedidos (${entrada.status} ${entrada.location})`);
  check((await c.get("/admin")).location === "/admin/pedidos", "/admin redirige a Pedidos");

  const sufijo = Date.now().toString(36);
  const envio = await nuevo({ status: "paid", nombre: `Ana Envío ${sufijo}` });
  const retiro = await nuevo({ status: "paid", entrega: "pickup", nombre: `Beto Retiro ${sufijo}` });
  const sinPagar = await nuevo({ status: "pending_payment", nombre: `Caro SinPagar ${sufijo}` });
  const sinStock = await nuevo({ status: "stock_issue", nombre: `Dani SinStock ${sufijo}` });

  // --- Listado, filtros y búsqueda
  let p = (await c.get("/admin/pedidos")).html;
  check([envio, retiro, sinStock].every((x) => p.includes(`#${x.order_number}`)), "Para atender: pagados y pagados sin stock");
  check(!p.includes(`#${sinPagar.order_number}`), "Para atender: no muestra los sin pagar");
  check(p.includes("Pagado: preparar") && p.includes("Pagado sin stock"), "muestra los estados con su nombre");
  p = (await c.get("/admin/pedidos?estado=sin-pagar")).html;
  check(p.includes(`#${sinPagar.order_number}`) && !p.includes(`#${envio.order_number}`), "filtro Sin pagar");
  p = (await c.get(`/admin/pedidos?q=${envio.order_number}`)).html;
  check(p.includes(`Ana Envío ${sufijo}`) && !p.includes(`Beto Retiro ${sufijo}`), "busca por número");
  p = (await c.get(`/admin/pedidos?q=beto%20retiro%20${sufijo}`)).html;
  check(p.includes(`Beto Retiro ${sufijo}`) && !p.includes(`Ana Envío ${sufijo}`), "busca por nombre (sin distinguir mayúsculas)");
  check((await c.get("/admin/pedidos?q=a%2Cb)(%25")).status === 200, "una búsqueda con caracteres raros no rompe");

  // --- Cambios de estado (envío)
  const urlEnvio = `/admin/pedidos/${envio.id}`;
  p = (await c.get(urlEnvio)).html;
  check(p.includes(`Ana Envío ${sufijo}`) && p.includes("Calle de Prueba 123") && p.includes("Marcar en preparación") && p.includes("Marcar despachado"), "detalle con envío: datos y botones");
  const formViejo = formularioCon(p, 'name="hacia"');
  let r = await c.enviar(urlEnvio, formViejo, { hacia: "delivered" });
  check(r.html.includes("Ese cambio de estado no es posible.") && (await estado(envio.id)) === "paid", "no deja saltar de pagado a entregado");
  r = await c.enviar(urlEnvio, formViejo, { hacia: "preparing" });
  check(r.html.includes("En preparación") && (await estado(envio.id)) === "preparing", "pagado → en preparación");
  r = await c.enviar(urlEnvio, formViejo, { hacia: "shipped" });
  check(r.html.includes("cambió de estado mientras tanto") && (await estado(envio.id)) === "preparing", "una pantalla desactualizada no pisa el estado");
  await c.enviar(urlEnvio, formularioCon((await c.get(urlEnvio)).html, 'name="hacia"'), { hacia: "shipped" });
  await c.enviar(urlEnvio, formularioCon((await c.get(urlEnvio)).html, 'name="hacia"'), { hacia: "delivered" });
  check((await estado(envio.id)) === "delivered", "en preparación → despachado → entregado");
  p = (await c.get(urlEnvio)).html;
  check(!p.includes("Cancelar pedido") && !p.includes('name="hacia"'), "entregado: sin botones de estado ni cancelar");

  // --- Retiro en el local
  p = (await c.get(`/admin/pedidos/${retiro.id}`)).html;
  check(p.includes("Marcar listo para retirar") && !p.includes("Marcar despachado") && p.includes("Retiro en el local"), "retiro: listo para retirar en vez de despachado");

  // --- Notas internas
  r = await c.enviar(`/admin/pedidos/${retiro.id}`, formularioCon(p, 'name="notas"'), { notas: "Nota de prueba <b>" });
  const notas = (await db.from("orders").select("admin_notes").eq("id", retiro.id).single()).data.admin_notes;
  check(notas === "Nota de prueba <b>", "guarda las notas internas");
  check((await c.get(`/admin/pedidos/${retiro.id}`)).html.includes("Nota de prueba &lt;b&gt;"), "las notas se muestran escapadas");

  // --- Cancelar
  const formCancelar = async (id) => formularioCon((await c.get(`/admin/pedidos/${id}`)).html, "Cancelar pedido");
  await db.from("product_variants").update({ stock: 5 }).eq("id", rock.id);
  const pagado = await nuevo({ status: "paid", cantidad: 2 });
  r = await c.enviar(`/admin/pedidos/${pagado.id}`, await formCancelar(pagado.id), { reponer: "on" });
  check((await estado(pagado.id)) === "cancelled" && (await stockDe(rock.id)) === 7, `cancelar un pagado reponiendo: cancelado y stock 5 → ${await stockDe(rock.id)}`);
  check(r.html.includes("Las unidades volvieron al stock."), "confirma que repuso el stock");
  const preparando = await nuevo({ status: "preparing" });
  await c.enviar(`/admin/pedidos/${preparando.id}`, await formCancelar(preparando.id), {});
  check((await estado(preparando.id)) === "cancelled" && (await stockDe(rock.id)) === 7, "cancelar sin tildar “devolver al stock” no cambia el stock");
  await c.enviar(`/admin/pedidos/${sinStock.id}`, await formCancelar(sinStock.id), { reponer: "on" });
  check((await estado(sinStock.id)) === "cancelled" && (await stockDe(rock.id)) === 7, "“pagado sin stock” no repone (no se había descontado)");
  await c.enviar(`/admin/pedidos/${sinPagar.id}`, await formCancelar(sinPagar.id), { reponer: "on" });
  check((await estado(sinPagar.id)) === "cancelled" && (await stockDe(rock.id)) === 7, "un pedido sin pagar no repone");
  const entregado = await db.rpc("cancelar_pedido", { p_order_id: envio.id, p_reponer_stock: true });
  check(entregado.data === "no_cancelable", "un pedido entregado (sin arrepentimiento) no se puede cancelar");

  // --- Salir
  const salir = formularioCon((await c.get("/admin/pedidos")).html, "Salir");
  await c.enviar("/admin/pedidos", salir);
  check((await c.get("/admin/pedidos")).location?.includes("/admin/login"), "después de Salir, vuelve a pedir login");
} finally {
  await borrarPedidos(creados);
  await db.from("product_variants").update({ stock: stockOriginal }).eq("id", rock.id);
  await borrarAdmin(admin);
  console.log(`\nLimpieza: ${creados.length} pedidos de prueba y el admin temporal borrados; stock restaurado a ${stockOriginal}.`);
  terminar("Panel de pedidos");
}

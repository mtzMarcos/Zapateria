// Carrito y checkout, mandando los formularios como un navegador sin JavaScript.
import {
  borrarPedidos,
  check,
  cookieCarrito,
  db,
  formularioCon,
  nuevoCliente,
  stockDe,
  talle,
  terminar,
} from "./utilidades.mjs";

const rock = await talle("ejemplo-topper-rock", "40");
const victori = await talle("ejemplo-nike-victori-one", "37");
const stockOriginal = { [rock.id]: rock.stock, [victori.id]: victori.stock };
const creados = [];

/** Líneas del carrito según la cookie del cliente. */
const lineas = (c) => JSON.parse(decodeURIComponent(c.jar.get("carrito") ?? "%5B%5D"));
const cantidadDe = (c, id) => lineas(c).find((l) => l.v === id)?.q ?? 0;
/** Cantidad que muestra el ícono del carrito en el encabezado. */
const contador = (html) => Number(html.match(/>(\d+)<span class="sr-only"> productos?<\/span>/)?.[1] ?? 0);

try {
  await db.from("product_variants").update({ stock: 10 }).eq("id", rock.id);
  await db.from("product_variants").update({ stock: 2 }).eq("id", victori.id);
  const c = nuevoCliente();

  // --- Agregar desde la página del producto
  const agregar = async (slug, variante) => {
    const form = formularioCon((await c.get(`/productos/${slug}`)).html, 'name="variante"');
    return c.enviar(`/productos/${slug}`, form, { variante });
  };
  let r = await agregar("ejemplo-topper-rock", rock.id);
  check(cantidadDe(c, rock.id) === 1, "agregar un talle lo guarda en el carrito");
  check(r.html.includes("Agregado al carrito (talle 40)"), "confirma qué talle agregó");
  r = await agregar("ejemplo-topper-rock", "no-es-un-talle");
  check(r.html.includes("Elegí un talle") && lineas(c).length === 1, "un talle inválido no se agrega");

  for (let i = 0; i < 3; i++) r = await agregar("ejemplo-nike-victori-one", victori.id);
  check(cantidadDe(c, victori.id) === 2, `no deja pasar el stock (stock 2, pidió 3 → ${cantidadDe(c, victori.id)})`);
  check(r.html.includes("Ya tenés en el carrito todo el stock de este talle."), "avisa que no hay más stock");

  let carrito = await c.get("/carrito");
  check(contador(carrito.html) === 3, `el ícono del carrito cuenta las unidades (${contador(carrito.html)})`);
  check(carrito.html.includes("Topper Rock") && carrito.html.includes("Nike Victori One"), "el carrito muestra los productos");

  // --- Sumar, restar y quitar
  const formFila = (html, nombre, accion) => {
    const fila = html.split("<li").find((li) => li.includes(nombre));
    return formularioCon(fila, accion);
  };
  await c.enviar("/carrito", formFila(carrito.html, "Topper Rock", "Agregar una unidad"));
  check(cantidadDe(c, rock.id) === 2, "+ suma una unidad");
  carrito = await c.get("/carrito");
  await c.enviar("/carrito", formFila(carrito.html, "Topper Rock", "Quitar una unidad"));
  check(cantidadDe(c, rock.id) === 1, "− resta una unidad");

  // --- Cuando baja el stock mientras está en el carrito
  await db.from("product_variants").update({ stock: 1 }).eq("id", victori.id);
  carrito = await c.get("/carrito");
  check(carrito.html.includes("Solo queda 1 unidad."), "avisa que bajó el stock");
  check(carrito.html.includes("Ajustar al stock disponible"), "ofrece ajustar al stock");
  const checkoutBloqueado = await c.get("/checkout");
  check(checkoutBloqueado.html.includes("Cambió el stock de algunos productos"), "el checkout no deja seguir");
  await c.enviar("/carrito", formularioCon(carrito.html, "Ajustar al stock disponible"));
  check(cantidadDe(c, victori.id) === 1, "ajustar deja la cantidad en el stock disponible");

  carrito = await c.get("/carrito");
  await c.enviar("/carrito", formFila(carrito.html, "Nike Victori One", "Quitar<"));
  check(cantidadDe(c, victori.id) === 0 && cantidadDe(c, rock.id) === 1, "Quitar saca solo ese producto");

  // --- Checkout: validaciones
  const { data: zona } = await db.from("shipping_zones").select("id, name, price").eq("active", true).order("position").limit(1).single();
  let checkout = await c.get("/checkout");
  const formCheckout = formularioCon(checkout.html, 'name="nombre"');
  r = await c.enviar("/checkout", formCheckout, { nombre: "", email: "mal", telefono: "1", entrega: "shipping" });
  check(r.html.includes("Revisá los datos marcados."), "datos incompletos: no crea el pedido");
  check(r.html.includes("El email no es válido.") && r.html.includes("Elegí la zona de envío."), "marca cada campo con error");

  // --- Pedido con envío (el total que manda el navegador no cuenta)
  await c.enviar("/carrito", formFila((await c.get("/carrito")).html, "Topper Rock", "Agregar una unidad"));
  const datos = {
    nombre: "Prueba Automática",
    email: "Prueba.Automatica@Ejemplo.com",
    telefono: "11 2345-6789",
    entrega: "shipping",
    zona: zona.id,
    calle: "Av. Siempre Viva",
    numero: "742",
    depto: "",
    ciudad: "Springfield",
    provincia: "Buenos Aires",
    cp: "1425",
    notas: "Timbre B",
    total: "1",
  };
  r = await c.enviar("/checkout", formCheckout, datos);
  const id = r.location?.split("/pedido/")[1];
  check(r.status === 303 && id, `crea el pedido y lleva a su página (${r.status} ${r.location})`);
  if (id) creados.push(id);
  const { data: pedido } = await db
    .from("orders")
    .select("order_number, status, subtotal, shipping_cost, total, customer_email, mp_preference_id, order_items(quantity, unit_price)")
    .eq("id", id)
    .single();
  const subtotal = Number(rock.products.price) * 2;
  check(
    Number(pedido.subtotal) === subtotal && Number(pedido.shipping_cost) === Number(zona.price) && Number(pedido.total) === subtotal + Number(zona.price),
    `totales recalculados en el servidor (${pedido.total} = ${subtotal} + envío ${zona.price})`,
  );
  check(pedido.status === "pending_payment" && pedido.order_items.length === 1 && pedido.order_items[0].quantity === 2, "queda esperando el pago, con sus ítems");
  check(pedido.customer_email === "prueba.automatica@ejemplo.com", "guarda el email en minúsculas");
  check(!!pedido.mp_preference_id, "crea el cobro en Mercado Pago");
  check(lineas(c).length === 0, "vacía el carrito");
  check(await stockDe(rock.id) === 10, "no descuenta stock hasta que se pague");

  const pagina = await c.get(`/pedido/${id}`);
  check(pagina.html.includes(`#${pedido.order_number}`) && pagina.html.includes("Falta el pago") && pagina.html.includes("Av. Siempre Viva 742"), "página del pedido: número, estado y dirección");

  // --- Pedido con retiro en el local
  await agregar("ejemplo-topper-rock", rock.id);
  checkout = await c.get("/checkout");
  r = await c.enviar("/checkout", formularioCon(checkout.html, 'name="nombre"'), { ...datos, entrega: "pickup", zona: "", calle: "", numero: "", ciudad: "", provincia: "", cp: "" });
  const idRetiro = r.location?.split("/pedido/")[1];
  if (idRetiro) creados.push(idRetiro);
  const { data: retiro } = await db.from("orders").select("delivery_method, shipping_cost, total").eq("id", idRetiro).single();
  check(retiro?.delivery_method === "pickup" && Number(retiro.shipping_cost) === 0 && Number(retiro.total) === Number(rock.products.price), "pedido con retiro: sin costo de envío");

  // --- Casos límite
  checkout = await c.get("/checkout");
  check(checkout.html.includes("Tu carrito está vacío."), "checkout con el carrito vacío");
  const vacio = await c.enviar("/checkout", formCheckout, datos);
  check(vacio.status !== 303 && vacio.html.includes("Tu carrito está vacío."), "no crea pedidos con el carrito vacío");
  const otro = nuevoCliente();
  otro.jar.set("carrito", cookieCarrito([{ v: "basura", q: 99 }, { v: rock.id, q: 50 }]));
  check(contador((await otro.get("/carrito")).html) === 10, "una cookie manipulada se limita (máximo 10 por talle, talles válidos)");
  const inexistente = await c.get(`/pedido/${crypto.randomUUID()}`);
  check(inexistente.html.includes("NEXT_HTTP_ERROR_FALLBACK;404"), "pedido inexistente: no encontrado");
} finally {
  await borrarPedidos(creados);
  for (const [id, stock] of Object.entries(stockOriginal)) await db.from("product_variants").update({ stock }).eq("id", id);
  console.log(`\nLimpieza: ${creados.length} pedidos de prueba borrados; stock restaurado.`);
  terminar("Carrito y checkout");
}

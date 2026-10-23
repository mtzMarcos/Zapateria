import type { Metadata } from "next";
import Link from "next/link";
import { tienda } from "@/config/tienda";
import { Dato } from "@/components/tienda/dato";
import { MediosDeContacto, PaginaLegal } from "@/components/tienda/pagina-legal";

// Texto base para una tienda online en Argentina (Ley 24.240 de Defensa del
// Consumidor y Código Civil y Comercial). Conviene que lo revise un abogado o
// el contador del cliente antes de lanzar.

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: `Condiciones de compra en ${tienda.nombre}: precios, pagos, envíos, cambios y derecho de arrepentimiento.`,
};

export default function TerminosPage() {
  const { legal, retiro } = tienda;

  return (
    <PaginaLegal titulo="Términos y condiciones">
      <p>
        Estos términos rigen las compras que hagas en este sitio. Al confirmar un pedido aceptás estas
        condiciones.
      </p>

      <h2>1. Quiénes somos</h2>
      <p>
        El sitio pertenece a <Dato valor={legal.titular} />, CUIT <Dato valor={legal.cuit} />, con domicilio
        en <Dato valor={legal.domicilio} />. Podés comunicarte con nosotros <MediosDeContacto />.
      </p>

      <h2>2. Productos y precios</h2>
      <ul>
        <li>Los precios están en pesos argentinos e incluyen IVA.</li>
        <li>
          El precio que vale es el que figura en el sitio al confirmar el pedido. El costo de envío se suma
          según la zona y se informa antes de pagar.
        </li>
        <li>
          Las ventas están sujetas al stock disponible. Las fotos son ilustrativas: los colores pueden variar
          levemente según la pantalla.
        </li>
      </ul>

      <h2>3. Compra y pago</h2>
      <ul>
        <li>
          El pago se hace a través de Mercado Pago, con los medios que ofrece (tarjetas, dinero en cuenta y
          otros). Nosotros no recibimos ni guardamos los datos de tu tarjeta.
        </li>
        <li>
          El pedido queda confirmado cuando Mercado Pago aprueba el pago. Hasta entonces el stock no se
          reserva.
        </li>
        <li>
          Si al aprobarse el pago otra persona ya compró la última unidad, te contactamos para ofrecerte un
          cambio o devolverte el total pagado.
        </li>
      </ul>

      <h2>4. Envíos y retiro</h2>
      <ul>
        <li>
          Enviamos a todo el país con un costo fijo por zona. Plazo estimado de entrega:{" "}
          <Dato valor={tienda.envios.plazo} />, desde que se confirma el pago.
        </li>
        <li>
          También podés retirar sin costo en <Dato valor={retiro.direccion} /> (
          <Dato valor={retiro.horarios} />
          ). Te avisamos cuando el pedido esté listo.
        </li>
        <li>
          El número de pedido y su estado se ven en la página del pedido, a la que llegás después de pagar.
        </li>
      </ul>

      <h2>5. Derecho de arrepentimiento</h2>
      <p>
        Podés revocar la compra dentro de los <strong>10 días corridos</strong> desde que recibiste el
        producto (o desde la compra, si es posterior), sin dar explicaciones y sin costo, como establecen el
        artículo 34 de la Ley 24.240 y el artículo 1110 del Código Civil y Comercial. El producto tiene que
        estar sin uso y en las mismas condiciones en que lo recibiste. Los gastos de devolución corren por
        nuestra cuenta y te reintegramos el total pagado.
      </p>
      <p>
        Para hacerlo, usá el <Link href="/arrepentimiento">Botón de arrepentimiento</Link>: te damos un
        código de solicitud al instante.
      </p>

      <h2>6. Cambios y garantía</h2>
      <p>
        Los cambios de talle o modelo y los productos con fallas se rigen por nuestra{" "}
        <Link href="/cambios-y-devoluciones">política de cambios y devoluciones</Link>. Los productos tienen
        la garantía legal prevista en la Ley 24.240.
      </p>

      <h2>7. Datos personales</h2>
      <p>
        Usamos tus datos solo para gestionar tu compra. Más información en la{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>

      <h2>8. Reclamos y jurisdicción</h2>
      <p>
        Ante cualquier problema, escribinos primero: lo vamos a resolver lo antes posible. También podés
        hacer un reclamo en la{" "}
        <a
          href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ventanilla Única Federal de Defensa del Consumidor
        </a>
        .
      </p>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Sin perjuicio de los derechos que la
        ley te da como consumidor para reclamar en tu domicilio, son competentes los tribunales ordinarios de{" "}
        <Dato valor={legal.jurisdiccion} />.
      </p>
    </PaginaLegal>
  );
}

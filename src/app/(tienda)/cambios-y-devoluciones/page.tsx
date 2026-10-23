import type { Metadata } from "next";
import Link from "next/link";
import { tienda } from "@/config/tienda";
import { Dato } from "@/components/tienda/dato";
import { MediosDeContacto, PaginaLegal } from "@/components/tienda/pagina-legal";

// Texto base: el plazo y quién paga el envío de un cambio los define el cliente
// (src/config/tienda.ts → cambios). Conviene revisarlo con él antes de lanzar.

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description: `Cómo cambiar un talle o modelo, qué hacer si un producto tiene una falla y cómo devolver una compra en ${tienda.nombre}.`,
};

export default function CambiosPage() {
  const { cambios, retiro } = tienda;

  return (
    <PaginaLegal titulo="Cambios y devoluciones">
      <h2>Cambio de talle o modelo</h2>
      <ul>
        <li>
          Podés cambiar tu compra dentro de <Dato valor={cambios.plazo} /> desde que la recibiste.
        </li>
        <li>
          El producto tiene que estar sin uso, con sus etiquetas y en la caja original, y tenés que indicarnos
          el número de pedido.
        </li>
        <li>
          Podés hacer el cambio en el local (<Dato valor={retiro.direccion} />, <Dato valor={retiro.horarios} />
          ) o por envío. Costo del envío de un cambio: <Dato valor={cambios.envio} />.
        </li>
        <li>
          Si elegís un producto de otro precio, te cobramos o te devolvemos la diferencia. Los cambios están
          sujetos al stock disponible.
        </li>
      </ul>
      <p>
        Para coordinar un cambio, escribinos <MediosDeContacto /> con tu número de pedido.
      </p>

      <h2>Productos con fallas</h2>
      <p>
        Si un producto tiene una falla de fabricación, avisanos con tu número de pedido y una foto de la
        falla. Según la garantía legal de la Ley 24.240 lo reparamos, lo cambiamos por otro igual o te
        devolvemos el dinero. En este caso los envíos corren por nuestra cuenta.
      </p>

      <h2>Arrepentimiento de la compra</h2>
      <p>
        Además de los cambios, tenés derecho a <strong>revocar la compra dentro de los 10 días corridos</strong>{" "}
        desde que recibiste el producto, sin dar explicaciones y sin costo (artículo 34 de la Ley 24.240). El
        producto tiene que estar sin uso. Te devolvemos el total pagado y los gastos de devolución corren por
        nuestra cuenta.
      </p>
      <p>
        Para hacerlo, usá el <Link href="/arrepentimiento">Botón de arrepentimiento</Link>.
      </p>

      <h2>Reintegros</h2>
      <p>
        Los reintegros se hacen por el mismo medio de pago, a través de Mercado Pago, cuando recibimos el
        producto. El tiempo en que se ve reflejado depende de Mercado Pago y del banco o tarjeta.
      </p>
    </PaginaLegal>
  );
}

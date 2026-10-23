import type { Metadata } from "next";
import { tienda } from "@/config/tienda";
import { Dato } from "@/components/tienda/dato";
import { PaginaLegal } from "@/components/tienda/pagina-legal";

// Política de privacidad según la Ley 25.326 de Protección de Datos Personales.
// Los dos últimos párrafos de "Tus derechos" son textos obligatorios
// (Disposición 10/2008): no cambiarlos.

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Qué datos personales usa ${tienda.nombre}, para qué y cómo ejercer tus derechos.`,
};

export default function PrivacidadPage() {
  const { legal, contacto } = tienda;

  return (
    <PaginaLegal titulo="Política de privacidad">
      <h2>Responsable de los datos</h2>
      <p>
        <Dato valor={legal.titular} />, CUIT <Dato valor={legal.cuit} />, con domicilio en{" "}
        <Dato valor={legal.domicilio} />. Contacto: <Dato valor={contacto.email} />.
      </p>

      <h2>Qué datos usamos y para qué</h2>
      <p>
        Cuando hacés un pedido nos das tu nombre, email, teléfono y, si elegís envío, tu dirección. Los usamos
        solamente para procesar y entregar tu pedido, contactarte por él y cumplir obligaciones legales (por
        ejemplo, la facturación). No usamos tus datos para publicidad y no los vendemos ni los cedemos.
      </p>
      <p>Solo los conocen quienes intervienen en tu compra:</p>
      <ul>
        <li>
          <strong>Mercado Pago</strong>, que procesa el pago. Los datos de tu tarjeta los cargás en Mercado
          Pago: nosotros no los recibimos ni los guardamos.
        </li>
        <li>La empresa de envíos, si elegís envío a domicilio (nombre, teléfono y dirección).</li>
        <li>
          Los proveedores que alojan el sitio y la base de datos, que los guardan por cuenta nuestra y no
          pueden usarlos para otra cosa.
        </li>
      </ul>
      <p>
        Guardamos los datos de cada pedido mientras lo exijan las obligaciones legales y contables.
      </p>

      <h2>Cookies</h2>
      <p>
        El sitio usa una sola cookie, para recordar tu carrito durante 30 días. No usamos cookies de
        publicidad ni de seguimiento.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedir acceder a tus datos, corregirlos, actualizarlos o eliminarlos escribiendo a{" "}
        <Dato valor={contacto.email} />.
      </p>
      <p>
        El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en
        forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al
        efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.
      </p>
      <p>
        La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley Nº
        25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten
        afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos
        personales.
      </p>
    </PaginaLegal>
  );
}

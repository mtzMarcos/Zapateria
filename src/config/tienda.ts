// Datos generales de la tienda. Completar con la info real del cliente.
//
// Lo que el cliente todavía no pasó queda marcado con completar("…"): en la
// tienda se ve resaltado como "[Completar: …]" y el panel muestra la lista de
// lo que falta (datosFaltantes). Para cargar un dato, reemplazar completar("…")
// por el texto real entre comillas.

const MARCA = "[Completar: ";

function completar(que: string) {
  return `${MARCA}${que}]`;
}

/** true si el valor todavía es un espacio marcado con completar(). */
export function faltaCompletar(valor: string) {
  return valor.startsWith(MARCA);
}

export const tienda = {
  nombre: "Zapatería",
  descripcion: "Zapatillas y calzado con envío a todo el país.",

  // Retiro en el local: se muestra en el checkout, en la confirmación del pedido y en el pie.
  retiro: {
    direccion: completar("dirección del local"),
    horarios: completar("horarios de atención"),
  },

  contacto: {
    email: completar("email de contacto"),
    // Con código de área, por ejemplo "11 2345-6789". Se arma el link a WhatsApp.
    whatsapp: completar("WhatsApp"),
    // Usuario sin @, por ejemplo "zapateria.ok". Vacío ("") para no mostrarlo.
    instagram: completar("usuario de Instagram (o dejar vacío)"),
  },

  // Datos del vendedor que exige la Ley de Defensa del Consumidor (Ley 24.240)
  // y que figuran en los Términos y condiciones.
  legal: {
    titular: completar("razón social o nombre del titular"),
    cuit: completar("CUIT"),
    domicilio: completar("domicilio legal"),
    // Ciudad cuyos tribunales intervienen ante un conflicto (Términos y condiciones).
    jurisdiccion: completar("ciudad para la jurisdicción"),
    // Link del QR "Data fiscal" (formulario 960 de ARCA). Se genera con la clave fiscal
    // del titular en ARCA → "Data fiscal". Es obligatorio mostrarlo en el sitio.
    dataFiscalUrl: completar("link del QR de Data fiscal de ARCA"),
  },

  // Plazo de entrega que se informa en los Términos y condiciones.
  envios: {
    plazo: completar("plazo estimado de entrega, por ejemplo 3 a 7 días hábiles"),
  },

  // Política de cambios (página /cambios-y-devoluciones).
  cambios: {
    plazo: completar("plazo para cambios, por ejemplo 30 días corridos"),
    envio: completar("quién paga el envío de un cambio"),
  },

  // Fecha que se muestra en las páginas legales. Actualizarla cuando cambien.
  legalesActualizados: "23 de octubre de 2026",
};

/** Lista de los datos que todavía falta completar (para el aviso del panel). */
export function datosFaltantes(): string[] {
  const faltantes: string[] = [];
  const recorrer = (valor: unknown) => {
    if (typeof valor === "string" && faltaCompletar(valor)) {
      faltantes.push(valor.slice(MARCA.length, -1));
    } else if (valor && typeof valor === "object") {
      Object.values(valor).forEach(recorrer);
    }
  };
  recorrer(tienda);
  return faltantes;
}

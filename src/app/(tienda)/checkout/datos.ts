// Campos del formulario de checkout y su validación. Se usa en el servidor
// (la validación que cuenta) y el tipo del estado lo comparte el formulario.
import { provincias } from "@/lib/provincias";

export const campos = [
  "nombre",
  "email",
  "telefono",
  "entrega",
  "zona",
  "calle",
  "numero",
  "depto",
  "ciudad",
  "provincia",
  "cp",
  "notas",
] as const;

export type Campo = (typeof campos)[number];
export type Valores = Record<Campo, string>;

export type EstadoCheckout = {
  error?: string;
  errores?: Partial<Record<Campo, string>>;
  valores?: Valores;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Código postal: 4 dígitos (1425) o CPA (C1425ABC).
const CODIGO_POSTAL = /^[A-Za-z]?\d{4}[A-Za-z]{0,3}$/;
const LARGO_MAXIMO = 200;

export function validar(v: Valores): Partial<Record<Campo, string>> {
  const errores: Partial<Record<Campo, string>> = {};

  for (const campo of campos) {
    if (v[campo].length > LARGO_MAXIMO) errores[campo] = "Es demasiado largo.";
  }

  if (v.nombre.length < 3) errores.nombre = "Escribí tu nombre y apellido.";
  if (!EMAIL.test(v.email)) errores.email = "El email no es válido.";
  if (v.telefono.replace(/\D/g, "").length < 8) {
    errores.telefono = "Escribí un teléfono con código de área.";
  }

  if (v.entrega !== "shipping" && v.entrega !== "pickup") {
    errores.entrega = "Elegí cómo recibir tu pedido.";
  }
  if (v.entrega === "shipping") {
    if (!v.zona) errores.zona = "Elegí la zona de envío.";
    if (!v.calle) errores.calle = "Falta la calle.";
    if (!v.numero) errores.numero = "Falta el número.";
    if (!v.ciudad) errores.ciudad = "Falta la localidad.";
    if (!provincias.includes(v.provincia)) errores.provincia = "Elegí la provincia.";
    if (!CODIGO_POSTAL.test(v.cp)) errores.cp = "El código postal no es válido.";
  }

  return errores;
}

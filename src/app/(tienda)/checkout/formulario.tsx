"use client";

import { useActionState, useState } from "react";
import type { ZonaEnvio } from "@/lib/envios";
import { formatearPrecio } from "@/lib/formato";
import { provincias } from "@/lib/provincias";
import { crearPedido } from "./actions";
import type { Campo, EstadoCheckout } from "./datos";

const claseInput =
  "w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none aria-invalid:border-red-600";

export function FormularioCheckout({
  zonas,
  subtotal,
  retiro,
}: {
  zonas: ZonaEnvio[];
  subtotal: number;
  retiro: { direccion: string; horarios: string };
}) {
  const [estado, enviar, enviando] = useActionState(crearPedido, {} as EstadoCheckout);
  const [entrega, setEntrega] = useState(estado.valores?.entrega || "shipping");
  const [zonaId, setZonaId] = useState(estado.valores?.zona ?? "");

  const zona = zonas.find((z) => z.id === zonaId);
  const envio = entrega === "shipping" ? (zona?.price ?? null) : 0;

  // Después de enviar, React vacía el formulario: los valores vuelven con el
  // estado de la acción y se usan como defaultValue para no perder lo escrito.
  const campo = (nombre: Campo) => ({
    id: nombre,
    name: nombre,
    defaultValue: estado.valores?.[nombre],
    "aria-invalid": estado.errores?.[nombre] ? true : undefined,
    "aria-describedby": estado.errores?.[nombre] ? `${nombre}-error` : undefined,
    className: claseInput,
  });

  return (
    <form action={enviar} className="space-y-8" noValidate>
      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">Tus datos</legend>
        <Campo etiqueta="Nombre y apellido" nombre="nombre" estado={estado}>
          <input {...campo("nombre")} autoComplete="name" required />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Email" nombre="email" estado={estado}>
            <input {...campo("email")} type="email" autoComplete="email" required />
          </Campo>
          <Campo etiqueta="Teléfono" nombre="telefono" estado={estado}>
            <input
              {...campo("telefono")}
              type="tel"
              autoComplete="tel"
              placeholder="11 2345-6789"
              required
            />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-lg font-semibold">Entrega</legend>
        <Opcion
          valor="shipping"
          elegida={entrega}
          onChange={setEntrega}
          titulo="Envío a domicilio"
          detalle="Costo según la zona."
        />
        <Opcion
          valor="pickup"
          elegida={entrega}
          onChange={setEntrega}
          titulo="Retiro en el local (sin costo)"
          detalle={`${retiro.direccion}. ${retiro.horarios}.`}
        />
        <ErrorCampo nombre="entrega" estado={estado} />
      </fieldset>

      {entrega === "shipping" && (
        <fieldset className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">Dirección de envío</legend>
          <Campo etiqueta="Zona" nombre="zona" estado={estado}>
            <select
              {...campo("zona")}
              defaultValue={undefined}
              value={zonaId}
              onChange={(e) => setZonaId(e.target.value)}
            >
              <option value="">Elegí una zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}: {formatearPrecio(z.price)}
                </option>
              ))}
            </select>
          </Campo>
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem_7rem]">
            <Campo etiqueta="Calle" nombre="calle" estado={estado}>
              <input {...campo("calle")} autoComplete="address-line1" />
            </Campo>
            <Campo etiqueta="Número" nombre="numero" estado={estado}>
              <input {...campo("numero")} />
            </Campo>
            <Campo etiqueta="Piso/Depto" nombre="depto" estado={estado} opcional>
              <input {...campo("depto")} autoComplete="address-line2" />
            </Campo>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
            <Campo etiqueta="Localidad" nombre="ciudad" estado={estado}>
              <input {...campo("ciudad")} autoComplete="address-level2" />
            </Campo>
            <Campo etiqueta="Provincia" nombre="provincia" estado={estado}>
              <select {...campo("provincia")}>
                <option value="">Elegí</option>
                {provincias.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Código postal" nombre="cp" estado={estado}>
              <input {...campo("cp")} autoComplete="postal-code" />
            </Campo>
          </div>
        </fieldset>
      )}

      <Campo
        etiqueta={entrega === "shipping" ? "Indicaciones para la entrega" : "Comentarios"}
        nombre="notas"
        estado={estado}
        opcional
      >
        <textarea {...campo("notas")} rows={2} />
      </Campo>

      <div className="space-y-2 border-t border-neutral-200 pt-6">
        <Fila texto="Productos" valor={formatearPrecio(subtotal)} />
        <Fila
          texto="Envío"
          valor={envio === null ? "Elegí una zona" : envio === 0 ? "Sin costo" : formatearPrecio(envio)}
        />
        <Fila texto="Total" valor={formatearPrecio(subtotal + (envio ?? 0))} destacado />
      </div>

      {estado.error && (
        <p role="alert" className="text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-300 disabled:text-neutral-700"
      >
        {enviando ? "Registrando pedido…" : "Confirmar pedido"}
      </button>
    </form>
  );
}

function Campo({
  etiqueta,
  nombre,
  estado,
  opcional,
  children,
}: {
  etiqueta: string;
  nombre: Campo;
  estado: EstadoCheckout;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={nombre} className="mb-1 block text-sm font-medium">
        {etiqueta}
        {opcional && <span className="font-normal text-neutral-500"> (opcional)</span>}
      </label>
      {children}
      <ErrorCampo nombre={nombre} estado={estado} />
    </div>
  );
}

function ErrorCampo({ nombre, estado }: { nombre: Campo; estado: EstadoCheckout }) {
  const mensaje = estado.errores?.[nombre];
  if (!mensaje) return null;
  return (
    <p id={`${nombre}-error`} className="mt-1 text-sm text-red-700">
      {mensaje}
    </p>
  );
}

function Opcion({
  valor,
  elegida,
  onChange,
  titulo,
  detalle,
}: {
  valor: string;
  elegida: string;
  onChange: (valor: string) => void;
  titulo: string;
  detalle: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-md border border-neutral-300 p-4 has-checked:border-neutral-900">
      <input
        type="radio"
        name="entrega"
        value={valor}
        checked={elegida === valor}
        onChange={() => onChange(valor)}
        className="mt-1"
      />
      <span>
        <span className="block font-medium">{titulo}</span>
        <span className="block text-sm text-neutral-500">{detalle}</span>
      </span>
    </label>
  );
}

function Fila({ texto, valor, destacado }: { texto: string; valor: string; destacado?: boolean }) {
  return (
    <div className={`flex justify-between ${destacado ? "text-lg font-semibold" : "text-neutral-600"}`}>
      <span>{texto}</span>
      <span>{valor}</span>
    </div>
  );
}

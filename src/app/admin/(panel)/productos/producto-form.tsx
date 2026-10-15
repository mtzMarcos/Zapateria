"use client";

import { useActionState } from "react";
import { estadoInicial, type EstadoForm } from "@/lib/admin/form";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { claseInput, claseLabel } from "@/components/admin/estilos";

type Opcion = { id: string; name: string };

export type DatosProducto = {
  name: string;
  description: string;
  brand_id: string | null;
  category_id: string | null;
  price: number;
  active: boolean;
};

export function ProductoForm({
  accion,
  producto,
  marcas,
  categorias,
  textoBoton,
}: {
  accion: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  producto?: DatosProducto;
  marcas: Opcion[];
  categorias: Opcion[];
  textoBoton: string;
}) {
  const [estado, formAction] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="nombre" className={claseLabel}>
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={producto?.name}
          placeholder="Ej: Zapatilla Urbana Cuero Negra"
          className={claseInput}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="marca" className={claseLabel}>
            Marca
          </label>
          <select
            id="marca"
            name="marca"
            defaultValue={producto?.brand_id ?? ""}
            className={claseInput}
          >
            <option value="">Sin marca</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoria" className={claseLabel}>
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={producto?.category_id ?? ""}
            className={claseInput}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="precio" className={claseLabel}>
            Precio ($)
          </label>
          <input
            id="precio"
            name="precio"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={producto?.price}
            className={claseInput}
          />
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className={claseLabel}>
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={5}
          defaultValue={producto?.description}
          placeholder="Materiales, horma, recomendaciones de talle…"
          className={claseInput}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input name="activo" type="checkbox" defaultChecked={producto?.active ?? true} />
        Visible en la tienda
      </label>

      <Mensaje estado={estado} />
      <BotonEnviar>{textoBoton}</BotonEnviar>
    </form>
  );
}

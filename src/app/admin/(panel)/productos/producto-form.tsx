"use client";

import { useActionState } from "react";
import { estadoInicial, type EstadoForm } from "@/lib/form";
import { BotonEnviar, Mensaje } from "@/components/admin/ui";
import { claseInput, claseLabel } from "@/components/admin/estilos";
import { publicos } from "@/lib/secciones";

type Opcion = { id: string; name: string };

export type DatosProducto = {
  name: string;
  description: string;
  brand_id: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  audience: string;
  is_trending: boolean;
  is_sports: boolean;
  is_outlet: boolean;
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="precioAnterior" className={claseLabel}>
            Precio anterior ($) <span className="font-normal text-neutral-500">(opcional)</span>
          </label>
          <input
            id="precioAnterior"
            name="precioAnterior"
            type="number"
            min={0}
            step="0.01"
            defaultValue={producto?.compare_at_price ?? ""}
            aria-describedby="precioAnterior-ayuda"
            className={claseInput}
          />
          <p id="precioAnterior-ayuda" className="mt-1 text-xs text-neutral-500">
            Si lo cargás, se muestra tachado con el % de descuento. Tiene que ser mayor que el precio.
          </p>
        </div>
        <div>
          <label htmlFor="publico" className={claseLabel}>
            Público
          </label>
          <select
            id="publico"
            name="publico"
            defaultValue={producto?.audience ?? "unisex"}
            aria-describedby="publico-ayuda"
            className={claseInput}
          >
            {Object.entries(publicos).map(([valor, nombre]) => (
              <option key={valor} value={valor}>
                {nombre}
              </option>
            ))}
          </select>
          <p id="publico-ayuda" className="mt-1 text-xs text-neutral-500">
            Unisex aparece en Mujer y en Hombre.
          </p>
        </div>
        <fieldset>
          <legend className={claseLabel}>Secciones del menú</legend>
          <div className="space-y-1 text-sm">
            <label className="flex items-center gap-2">
              <input name="tendencia" type="checkbox" defaultChecked={producto?.is_trending} />
              Tendencias
            </label>
            <label className="flex items-center gap-2">
              <input name="deportes" type="checkbox" defaultChecked={producto?.is_sports} />
              Deportes
            </label>
            <label className="flex items-center gap-2">
              <input name="outlet" type="checkbox" defaultChecked={producto?.is_outlet} />
              Outlet
            </label>
          </div>
        </fieldset>
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

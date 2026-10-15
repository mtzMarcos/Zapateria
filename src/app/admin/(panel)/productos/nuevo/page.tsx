import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { opcionesProducto } from "@/lib/admin/opciones";
import { ProductoForm } from "../producto-form";
import { crearProducto } from "../actions";

export default async function NuevoProductoPage() {
  const { supabase } = await requireAdmin();
  const { marcas, categorias } = await opcionesProducto(supabase);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/productos" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Productos
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-bold">Nuevo producto</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Después de crearlo vas a poder cargar las fotos y el stock por talle.
      </p>
      <ProductoForm
        accion={crearProducto}
        marcas={marcas}
        categorias={categorias}
        textoBoton="Crear producto"
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { opcionesProducto } from "@/lib/admin/opciones";
import { urlFoto } from "@/lib/supabase/env";
import { compararTalles } from "@/lib/talles";
import { ProductoForm, type DatosProducto } from "../producto-form";
import { guardarProducto } from "../actions";
import { Talles } from "./talles";
import { Fotos } from "./fotos";
import { BorrarProducto } from "./borrar-producto";

type Producto = DatosProducto & {
  id: string;
  product_variants: { id: string; size: string; stock: number }[];
  product_images: { id: string; storage_path: string }[];
};

export default async function EditarProductoPage({ params }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  // Un id con formato inválido haría fallar la consulta: se trata como "no existe".
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const [resultado, { marcas, categorias }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, description, brand_id, category_id, price, active, product_variants(id, size, stock), product_images(id, storage_path)",
      )
      .eq("id", id)
      .order("position", { referencedTable: "product_images" })
      .order("created_at", { referencedTable: "product_images" })
      .maybeSingle(),
    opcionesProducto(supabase),
  ]);
  if (resultado.error) throw resultado.error;
  if (!resultado.data) notFound();

  const producto = resultado.data as Producto;

  // Los talles se ordenan "como números" cuando se puede: 35, 36, 40.5, 41.
  const talles = producto.product_variants.toSorted((a, b) => compararTalles(a.size, b.size));
  const fotos = producto.product_images.map((f) => ({ id: f.id, url: urlFoto(f.storage_path) }));

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/productos" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{producto.name}</h1>
      </div>

      <Seccion titulo="Fotos" descripcion="La primera foto es la portada del producto.">
        <Fotos productId={producto.id} fotos={fotos} />
      </Seccion>

      <Seccion
        titulo="Talles y stock"
        descripcion="El stock se descuenta solo cuando se aprueba un pago."
      >
        <Talles productId={producto.id} talles={talles} />
      </Seccion>

      <Seccion titulo="Datos del producto">
        <div className="max-w-2xl">
          <ProductoForm
            accion={guardarProducto.bind(null, producto.id)}
            producto={producto}
            marcas={marcas}
            categorias={categorias}
            textoBoton="Guardar cambios"
          />
        </div>
      </Seccion>

      <Seccion titulo="Eliminar producto">
        <BorrarProducto productId={producto.id} />
      </Seccion>
    </div>
  );
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      {descripcion && <p className="mt-1 text-sm text-neutral-500">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { formatearPrecio } from "@/lib/formato";
import { urlFoto } from "@/lib/supabase/env";
import { clasesBoton } from "@/components/admin/estilos";

type FilaProducto = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  brands: { name: string } | null;
  categories: { name: string } | null;
  product_variants: { stock: number }[];
  product_images: { storage_path: string }[];
};

export default async function ProductosPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, price, active, brands(name), categories(name), product_variants(stock), product_images(storage_path)",
    )
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "product_images" })
    .limit(1, { referencedTable: "product_images" });
  if (error) throw error;

  const productos = data as unknown as FilaProducto[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link href="/admin/productos/nuevo" className={clasesBoton()}>
          Nuevo producto
        </Link>
      </div>

      {productos.length === 0 ? (
        <p className="text-neutral-500">
          Todavía no hay productos. Conviene cargar primero las marcas y categorías.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="p-3 font-medium">Producto</th>
                <th className="p-3 font-medium">Categoría</th>
                <th className="p-3 text-right font-medium">Precio</th>
                <th className="p-3 text-right font-medium">Stock</th>
                <th className="p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {productos.map((p) => {
                const stock = p.product_variants.reduce((total, v) => total + v.stock, 0);
                const portada = p.product_images[0];
                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="p-3">
                      <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3">
                        <span className="relative size-12 shrink-0 overflow-hidden rounded bg-neutral-100">
                          {portada && (
                            <Image
                              src={urlFoto(portada.storage_path)}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span>
                          <span className="block font-medium">{p.name}</span>
                          <span className="text-neutral-500">{p.brands?.name ?? "Sin marca"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="p-3">{p.categories?.name ?? "—"}</td>
                    <td className="p-3 text-right">{formatearPrecio(p.price)}</td>
                    <td className={`p-3 text-right ${stock === 0 ? "text-red-700" : ""}`}>
                      {stock}
                    </td>
                    <td className="p-3">
                      <Avisos activo={p.active} stock={stock} conFotos={!!portada} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Avisos({ activo, stock, conFotos }: { activo: boolean; stock: number; conFotos: boolean }) {
  if (!activo) return <span className="text-neutral-500">Oculto</span>;
  const faltan = [!conFotos && "fotos", stock === 0 && "stock"].filter(Boolean);
  if (faltan.length > 0) return <span className="text-amber-700">Visible, sin {faltan.join(" ni ")}</span>;
  return <span className="text-green-700">Visible</span>;
}

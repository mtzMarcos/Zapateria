import { requireAdmin } from "@/lib/admin/auth";
import { ListaCategorias, type CategoriaPanel } from "./lista-categorias";

export default async function CategoriasPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, parent_id, products(count)")
    .order("position")
    .order("name");
  if (error) throw error;

  const fila = (c: (typeof data)[number]) => ({
    id: c.id as string,
    name: c.name as string,
    productos: (c.products as { count: number }[])[0]?.count ?? 0,
  });

  // Árbol: las principales en orden, cada una con sus subcategorías en orden.
  const categorias: CategoriaPanel[] = data
    .filter((c) => !c.parent_id)
    .map((c) => ({ ...fila(c), subcategorias: data.filter((s) => s.parent_id === c.id).map(fila) }));

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Categorías</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Una categoría puede tener subcategorías (por ejemplo Zapatillas → Running). Los productos se asignan a una
        subcategoría o directamente a la categoría. El orden de esta lista es el de los menús y filtros de la tienda.
      </p>
      <ListaCategorias categorias={categorias} />
    </>
  );
}

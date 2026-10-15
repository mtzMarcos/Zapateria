import { requireAdmin } from "@/lib/admin/auth";
import { ListaTaxonomia } from "../lista-taxonomia";

export default async function CategoriasPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, products(count)")
    .order("position")
    .order("name");
  if (error) throw error;

  const items = data.map((c) => ({ id: c.id, name: c.name, productos: c.products[0]?.count ?? 0 }));

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Categorías</h1>
      <ListaTaxonomia
        tabla="categories"
        items={items}
        placeholder="Nueva categoría (ej: Zapatillas)"
      />
    </>
  );
}

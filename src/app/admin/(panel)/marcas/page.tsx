import { requireAdmin } from "@/lib/admin/auth";
import { urlFoto } from "@/lib/supabase/env";
import { ListaTaxonomia } from "../lista-taxonomia";

export default async function MarcasPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, logo_path, products(count)")
    .order("name");
  if (error) throw error;

  const items = data.map((m) => ({
    id: m.id,
    name: m.name,
    productos: m.products[0]?.count ?? 0,
    logo: m.logo_path ? urlFoto(m.logo_path) : null,
  }));

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Marcas</h1>
      <ListaTaxonomia tabla="brands" items={items} placeholder="Nueva marca (ej: Nike)" />
    </>
  );
}

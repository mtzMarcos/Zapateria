import { requireAdmin } from "@/lib/admin/auth";
import { Zonas } from "./zonas";

export default async function EnviosPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("shipping_zones")
    .select("id, name, price, active")
    .order("position");
  if (error) throw error;

  return (
    <>
      <h1 className="text-2xl font-bold">Zonas de envío</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Costo fijo de envío por zona. Las zonas inactivas no se ofrecen en el checkout. El retiro
        en el local siempre es gratis.
      </p>
      <Zonas zonas={data} />
    </>
  );
}

"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { mensajeError, numero, texto, type EstadoForm } from "@/lib/form";
import { catalogoActualizado } from "@/lib/admin/revalidar";

function leerZona(formData: FormData) {
  const nombre = texto(formData, "nombre");
  const precio = numero(formData, "precio");
  if (!nombre) return { error: "Escribí el nombre de la zona." } as const;
  if (precio === null || precio < 0) return { error: "El precio no es válido." } as const;
  return { zona: { name: nombre, price: precio, active: formData.get("activa") === "on" } };
}

export async function crearZona(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const leido = leerZona(formData);
  if ("error" in leido) return leido;

  // La zona nueva va al final de la lista.
  const { data: ultima } = await supabase
    .from("shipping_zones")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("shipping_zones")
    .insert({ ...leido.zona, position: (ultima?.position ?? 0) + 1 });
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: "Zona agregada." };
}

export async function guardarZona(
  id: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const leido = leerZona(formData);
  if ("error" in leido) return leido;

  const { error } = await supabase.from("shipping_zones").update(leido.zona).eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: "Guardado." };
}

export async function borrarZona(id: string): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return {};
}

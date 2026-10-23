"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";
import { mensajeError, numero, texto, type EstadoForm } from "@/lib/form";
import { catalogoActualizado } from "@/lib/admin/revalidar";
import { borrarArchivos } from "@/lib/admin/archivos";
import { slugify } from "@/lib/slug";
import { esPublico } from "@/lib/secciones";

// ---------------------------------------------------------------------
// Datos del producto
// ---------------------------------------------------------------------

function leerProducto(formData: FormData) {
  const nombre = texto(formData, "nombre");
  const precio = numero(formData, "precio");
  const anterior = numero(formData, "precioAnterior");
  const publico = texto(formData, "publico");
  if (!nombre) return { error: "Escribí el nombre del producto." } as const;
  if (precio === null || precio < 0) return { error: "El precio no es válido." } as const;
  if (texto(formData, "precioAnterior") && (anterior === null || anterior <= precio)) {
    return {
      error: "El precio anterior tiene que ser mayor que el precio (o dejalo vacío si no hay descuento).",
    } as const;
  }
  if (!esPublico(publico)) return { error: "Elegí el público del producto." } as const;

  return {
    producto: {
      name: nombre,
      description: texto(formData, "descripcion"),
      brand_id: texto(formData, "marca") || null,
      category_id: texto(formData, "categoria") || null,
      price: precio,
      compare_at_price: anterior,
      audience: publico,
      is_trending: formData.get("tendencia") === "on",
      is_sports: formData.get("deportes") === "on",
      is_outlet: formData.get("outlet") === "on",
      active: formData.get("activo") === "on",
    },
  };
}

/** Genera un slug que no esté usado: "air-max", "air-max-2", "air-max-3"… */
async function slugLibre(supabase: SupabaseClient, nombre: string) {
  const base = slugify(nombre) || "producto";
  const { data } = await supabase.from("products").select("slug").like("slug", `${base}%`);
  const usados = new Set((data ?? []).map((p) => p.slug as string));

  let slug = base;
  for (let n = 2; usados.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

export async function crearProducto(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const leido = leerProducto(formData);
  if ("error" in leido) return leido;

  const slug = await slugLibre(supabase, leido.producto.name);
  const { data, error } = await supabase
    .from("products")
    .insert({ ...leido.producto, slug })
    .select("id")
    .single();
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  // Después de crearlo se sigue con fotos y talles en la página de edición.
  redirect(`/admin/productos/${data.id}`);
}

export async function guardarProducto(
  id: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();
  const leido = leerProducto(formData);
  if ("error" in leido) return leido;

  // El slug (la URL del producto) no cambia al renombrar, para no romper
  // links que ya se hayan compartido.
  const { error } = await supabase.from("products").update(leido.producto).eq("id", id);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: "Cambios guardados." };
}

export async function borrarProducto(id: string): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { data: fotos } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);

  // Borra el producto; sus talles y registros de fotos se borran solos (cascade).
  // Los pedidos viejos no se ven afectados: guardan una copia de nombre y precio.
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: mensajeError(error) };

  await borrarArchivos((fotos ?? []).map((f) => f.storage_path as string));

  catalogoActualizado();
  redirect("/admin/productos");
}

// ---------------------------------------------------------------------
// Talles y stock
// ---------------------------------------------------------------------

/**
 * Interpreta lo que escribió el usuario:
 * "35-40" → 35, 36, 37, 38, 39, 40
 * "38, 39, 40.5" → 38, 39, 40.5
 * "S M L" → S, M, L
 */
function interpretarTalles(entrada: string) {
  const rango = entrada.match(/^(\d+)\s*(?:-|a)\s*(\d+)$/);
  if (rango) {
    const desde = Number(rango[1]);
    const hasta = Number(rango[2]);
    if (desde <= hasta && hasta - desde <= 30) {
      return Array.from({ length: hasta - desde + 1 }, (_, i) => String(desde + i));
    }
  }
  return [
    ...new Set(
      entrada
        .split(/[,;\s]+/)
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
}

export async function agregarTalles(
  productId: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const talles = interpretarTalles(texto(formData, "talles"));
  if (talles.length === 0) return { error: "Escribí uno o más talles." };

  // Los talles que ya existen se ignoran (no se pisa su stock).
  const { error } = await supabase.from("product_variants").upsert(
    talles.map((size) => ({ product_id: productId, size, stock: 0 })),
    { onConflict: "product_id,size", ignoreDuplicates: true },
  );
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return { ok: `Talles agregados: ${talles.join(", ")}. Ahora cargá el stock.` };
}

export async function guardarStock(
  productId: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const cambios: { id: string; stock: number }[] = [];
  for (const [campo, valor] of formData) {
    if (!campo.startsWith("stock:")) continue;
    const stock = Number(valor);
    if (!Number.isInteger(stock) || stock < 0) {
      return { error: "El stock tiene que ser un número entero, 0 o mayor." };
    }
    cambios.push({ id: campo.slice("stock:".length), stock });
  }

  const resultados = await Promise.all(
    cambios.map((c) =>
      supabase
        .from("product_variants")
        .update({ stock: c.stock })
        .eq("id", c.id)
        .eq("product_id", productId),
    ),
  );
  const fallo = resultados.find((r) => r.error)?.error;
  if (fallo) return { error: mensajeError(fallo) };

  catalogoActualizado();
  return { ok: "Stock guardado." };
}

export async function borrarTalle(
  productId: string,
  varianteId: string,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", varianteId)
    .eq("product_id", productId);
  if (error) return { error: mensajeError(error) };

  catalogoActualizado();
  return {};
}

// ---------------------------------------------------------------------
// Fotos
// Los archivos los sube el navegador directo a Supabase Storage; acá solo
// se registran en la tabla product_images.
// ---------------------------------------------------------------------

export async function registrarFotos(productId: string, rutas: string[]): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  // Las rutas tienen la forma "<id del producto>/<uuid>.<jpg|png|webp>".
  const rutaValida = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
  if (
    rutas.length === 0 ||
    rutas.some((r) => !rutaValida.test(r) || !r.startsWith(`${productId}/`))
  ) {
    return { error: "Ruta de foto inválida." };
  }

  const { data: ultima } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const inicio = (ultima?.position ?? -1) + 1;

  const { error } = await supabase.from("product_images").insert(
    rutas.map((storage_path, i) => ({
      product_id: productId,
      storage_path,
      position: inicio + i,
    })),
  );
  if (error) {
    await borrarArchivos(rutas);
    return { error: mensajeError(error) };
  }

  catalogoActualizado();
  return {};
}

export async function borrarFoto(productId: string, fotoId: string): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { data: foto, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", fotoId)
    .eq("product_id", productId)
    .select("storage_path")
    .maybeSingle();
  if (error) return { error: mensajeError(error) };
  if (foto) await borrarArchivos([foto.storage_path]);

  catalogoActualizado();
  return {};
}

/** Mueve una foto un lugar antes (-1) o después (+1). La primera es la portada. */
export async function moverFoto(
  productId: string,
  fotoId: string,
  direccion: -1 | 1,
): Promise<EstadoForm> {
  const { supabase } = await requireAdmin();

  const { data: fotos, error } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("position")
    .order("created_at");
  if (error) return { error: mensajeError(error) };

  const ids = fotos.map((f) => f.id as string);
  const desde = ids.indexOf(fotoId);
  const hasta = desde + direccion;
  if (desde === -1 || hasta < 0 || hasta >= ids.length) return {};

  [ids[desde], ids[hasta]] = [ids[hasta], ids[desde]];

  const resultados = await Promise.all(
    ids.map((id, position) => supabase.from("product_images").update({ position }).eq("id", id)),
  );
  const fallo = resultados.find((r) => r.error)?.error;
  if (fallo) return { error: mensajeError(fallo) };

  catalogoActualizado();
  return {};
}

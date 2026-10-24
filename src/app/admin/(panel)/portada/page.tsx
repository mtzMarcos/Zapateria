import { requireAdmin } from "@/lib/admin/auth";
import { secciones } from "@/lib/secciones";
import { urlFoto } from "@/lib/supabase/env";
import { BotonAgregarPortada, EditorPortada, FormAnuncio, type Destino } from "./editor";

export default async function PortadaPage() {
  const { supabase } = await requireAdmin();

  const [ajustes, portadas, marcas, categorias, productos] = await Promise.all([
    supabase.from("site_settings").select("announcement_text, announcement_url, announcement_active").maybeSingle(),
    supabase
      .from("home_slides")
      .select("id, title, subtitle, button_text, button_url, image_path, mobile_image_path, image_color, mobile_image_color, active")
      .order("position")
      .order("created_at"),
    supabase.from("brands").select("name, slug").order("name"),
    supabase.from("categories").select("name, slug").order("position").order("name"),
    supabase.from("products").select("name, slug").eq("active", true).order("name"),
  ]);
  if (portadas.error) throw portadas.error;

  // Opciones para "El botón lleva a".
  const destinos: Destino[] = [
    {
      grupo: "Secciones",
      opciones: [
        { url: "/productos", nombre: "Todos los productos" },
        ...secciones.map((s) => ({ url: `/${s.slug}`, nombre: s.nombre })),
      ],
    },
    { grupo: "Marcas", opciones: (marcas.data ?? []).map((m) => ({ url: `/marcas/${m.slug}`, nombre: m.name })) },
    {
      grupo: "Categorías",
      opciones: (categorias.data ?? []).map((c) => ({ url: `/productos?categoria=${c.slug}`, nombre: c.name })),
    },
    {
      grupo: "Productos",
      opciones: (productos.data ?? []).map((p) => ({ url: `/productos/${p.slug}`, nombre: p.name })),
    },
  ];

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-2 text-2xl font-bold">Portada</h1>
        <p className="text-sm text-neutral-600">
          Lo que se ve al entrar a la tienda. Los cambios se ven enseguida.
        </p>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Anuncio</h2>
        <p className="mb-4 text-sm text-neutral-500">La barra fina de arriba de todo, en todas las páginas.</p>
        <FormAnuncio
          texto={ajustes.data?.announcement_text ?? ""}
          link={ajustes.data?.announcement_url ?? null}
          visible={ajustes.data?.announcement_active ?? false}
        />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Fotos grandes del inicio</h2>
            <p className="text-sm text-neutral-500">
              Pasan solas cada 6 segundos, en este orden. Las ocultas no se muestran.
            </p>
          </div>
          <BotonAgregarPortada />
        </div>
        {portadas.data.length === 0 ? (
          <p className="text-neutral-500">
            No hay portadas. Sin portadas, el inicio muestra solo el nombre de la tienda.
          </p>
        ) : (
          <ul className="space-y-6">
            {portadas.data.map((p, i) => (
              <EditorPortada
                key={p.id}
                numero={i + 1}
                esPrimera={i === 0}
                esUltima={i === portadas.data.length - 1}
                destinos={destinos}
                portada={{
                  id: p.id,
                  title: p.title,
                  subtitle: p.subtitle,
                  button_text: p.button_text,
                  button_url: p.button_url,
                  active: p.active,
                  foto: p.image_path ? urlFoto(p.image_path) : null,
                  fotoCelular: p.mobile_image_path ? urlFoto(p.mobile_image_path) : null,
                  color: p.image_color,
                  colorCelular: p.mobile_image_color,
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

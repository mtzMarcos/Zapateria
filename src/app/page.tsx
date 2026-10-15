import { Suspense } from "react";
import { connection } from "next/server";
import { tienda } from "@/config/tienda";
import { createPublicClient } from "@/lib/supabase/public";
import { formatearPrecio } from "@/lib/formato";

// Página provisoria: muestra si la conexión con Supabase funciona.
// En la Etapa 3 se reemplaza por el catálogo.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">{tienda.nombre}</h1>
      <p className="mt-2 text-neutral-500">Tienda en construcción.</p>

      <section className="mt-10 rounded-lg border border-neutral-300 p-6">
        <h2 className="font-semibold">Estado de la base de datos</h2>
        <Suspense fallback={<p className="mt-2">Conectando…</p>}>
          <EstadoConexion />
        </Suspense>
      </section>
    </main>
  );
}

async function EstadoConexion() {
  // Consultar la base en cada visita, no al momento del build.
  await connection();

  let error: string | null = null;
  let zonas: { name: string; price: number }[] = [];

  try {
    const supabase = createPublicClient();
    const resultado = await supabase
      .from("shipping_zones")
      .select("name, price")
      .order("position");

    if (resultado.error) error = resultado.error.message;
    else zonas = resultado.data;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return <p className="mt-2 text-red-600">❌ No se pudo conectar: {error}</p>;
  }

  return (
    <>
      <p className="mt-2 text-green-700">✅ Conectado a Supabase. Zonas de envío:</p>
      <ul className="mt-2 list-disc pl-6">
        {zonas.map((zona) => (
          <li key={zona.name}>
            {zona.name}: {formatearPrecio(zona.price)}
          </li>
        ))}
      </ul>
    </>
  );
}

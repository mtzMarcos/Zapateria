import { faltaCompletar } from "@/config/tienda";

/**
 * Muestra un dato de src/config/tienda.ts. Si todavía no se completó, se ve
 * resaltado ("[Completar: …]") para que no pase desapercibido antes de lanzar.
 */
export function Dato({ valor }: { valor: string }) {
  if (!faltaCompletar(valor)) return <>{valor}</>;
  return (
    <mark className="rounded border border-dashed border-red-300 bg-red-50 px-1 text-red-700">
      {valor}
    </mark>
  );
}

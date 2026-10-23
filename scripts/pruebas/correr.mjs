// Corre las pruebas automáticas contra un servidor de producción local.
//
//   npm run build        (compilar primero: las pruebas usan esa versión)
//   npm run pruebas      (todas)
//   npm run pruebas -- carrito pago      (solo algunas)
//
// Levanta `next start` en el puerto 3124 con los mails apagados (RESEND_API_KEY
// vacía) y una clave de webhook de prueba, corre cada archivo de esta carpeta y
// al final apaga el servidor. Usa la base de .env.local: todo lo que crean las
// pruebas se borra al terminar y el stock vuelve a como estaba.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BASE, SECRETO_WEBHOOK, espera } from "./utilidades.mjs";

const TODAS = ["sql", "carrito", "pago", "pedidos", "arrepentimiento", "tienda", "navegador-tienda", "navegador-panel"];
const elegidas = process.argv.slice(2);
const pruebas = elegidas.length ? TODAS.filter((p) => elegidas.includes(p)) : TODAS;
const puerto = new URL(BASE).port || "3124";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Faltan las variables de .env.local (correr con: npm run pruebas).");
  process.exit(1);
}
if (!existsSync(join(".next", "BUILD_ID"))) {
  console.error("No hay una compilación: corré primero npm run build.");
  process.exit(1);
}
if (await fetch(BASE).then(() => true).catch(() => false)) {
  console.error(`Ya hay algo escuchando en ${BASE}. Cerralo y volvé a correr las pruebas.`);
  process.exit(1);
}

const servidor = spawn(`npx next start -p ${puerto}`, {
  shell: true,
  env: { ...process.env, RESEND_API_KEY: "", MERCADOPAGO_WEBHOOK_SECRET: SECRETO_WEBHOOK },
  stdio: ["ignore", "ignore", "pipe"],
});
servidor.stderr.on("data", () => {}); // los errores esperados (pagos inexistentes) no ensucian la salida

function apagar() {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(servidor.pid), "/T", "/F"]);
  else servidor.kill();
}

const resultados = [];
try {
  let listo = false;
  for (let i = 0; i < 120 && !listo; i++) {
    await espera(500);
    listo = await fetch(BASE).then((r) => r.ok).catch(() => false);
  }
  if (!listo) throw new Error("El servidor de pruebas no arrancó.");

  for (const prueba of pruebas) {
    console.log(`\n=== ${prueba} ${"=".repeat(60 - prueba.length)}`);
    const inicio = Date.now();
    const r = spawnSync(process.execPath, [join("scripts", "pruebas", `${prueba}.mjs`)], { stdio: "inherit", env: process.env });
    resultados.push({ prueba, ok: r.status === 0, segundos: Math.round((Date.now() - inicio) / 1000) });
  }
} finally {
  apagar();
}

console.log("\n=== Resumen " + "=".repeat(51));
for (const r of resultados) console.log(`${r.ok ? "OK   " : "FALLA"} ${r.prueba.padEnd(18)} ${r.segundos}s`);
const fallaron = resultados.filter((r) => !r.ok).length;
console.log(fallaron ? `\n${fallaron} prueba(s) con fallas.` : "\nTodas las pruebas pasaron.");
process.exitCode = fallaron || resultados.length < pruebas.length ? 1 : 0;

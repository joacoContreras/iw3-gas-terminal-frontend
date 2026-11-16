import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

/**
 * Reglas del proyecto (CLAUDE.md, secciones 3 y 9) que el CI comprueba solas, para que no vuelvan a colarse:
 * sin mock, sin tokens ni credenciales en el código, sin `any`, sin `catch` silenciosos y la URL de la API leída como
 * `process.env.NEXT_PUBLIC_API_URL` literal. Los archivos de prueba se excluyen (pueden nombrar lo prohibido).
 */
const SRC = fileURLToPath(new URL("./", import.meta.url));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}
const sources = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.d\.ts$/.test(f));
const read = (f) => readFileSync(f, "utf8");
const rel = (f) => relative(SRC, f).replaceAll("\\", "/");
/** Sin comentarios: una regla prohibida puede nombrarse en una explicación sin que sea una infracción. */
const code = (f) => read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const offenders = (re) => sources.filter((f) => re.test(code(f))).map(rel);

describe("reglas del proyecto", () => {
  test("hay código para revisar", () => {
    assert.ok(sources.length > 50, String(sources.length));
  });

  test("no existe el mock ni nada lo importa (D-7)", () => {
    assert.equal(existsSync(join(SRC, "services/mock")), false);
    assert.deepEqual(offenders(/MockStore|mockStore|services\/mock/), []);
  });

  test("no hay tokens falsos, credenciales ni usuarios por defecto", () => {
    assert.deepEqual(offenders(/demo-jwt|buildMockJwt|mockSignature|admin123|password123|admin_terminal/), []);
  });

  test("sin `any` explícito (TypeScript estricto)", () => {
    assert.deepEqual(offenders(/:\s*any\b|<any>|\bas any\b|Promise<any>/), []);
  });

  test("sin supresiones de chequeos ni `console` en el código de producción", () => {
    assert.deepEqual(offenders(/@ts-ignore|@ts-expect-error|eslint-disable|console\.(log|warn|error|debug)/), []);
  });

  test("la URL de la API se lee como `process.env.NEXT_PUBLIC_API_URL` literal y solo en el cliente HTTP", () => {
    const users = offenders(/process\.env\./);
    assert.deepEqual(users, ["services/api/client.ts"]);
    assert.ok(/process\.env\.NEXT_PUBLIC_API_URL\b/.test(read(join(SRC, "services/api/client.ts"))));
    assert.deepEqual(offenders(/process\.env\[/), []);
  });

  test("ningún componente llama a `fetch` directo: todo pasa por el cliente HTTP (token, errores y 401)", () => {
    const users = offenders(/\bfetch\(/).filter((f) => f !== "services/api/client.ts");
    assert.deepEqual(users, []);
  });

  test("no se muestra `devInfo` (stack trace del backend) en ninguna pantalla", () => {
    const users = offenders(/\.devInfo\b/).filter((f) => !f.startsWith("types/"));
    assert.deepEqual(users, []);
  });

  test("ningún `catch` vacío esconde un error (cada uno debe explicar por qué se ignora)", () => {
    const empties = sources.filter((f) => /catch\s*(\([^)]*\))?\s*\{\s*\}/.test(read(f))).map(rel); // con el comentario incluido: un `catch` que solo tiene un comentario sí explica por qué ignora el error
    assert.deepEqual(empties, []);
  });
});

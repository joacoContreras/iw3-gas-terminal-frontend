import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import {
  ApiError,
  UNAUTHORIZED_EVENT,
  apiClient,
  apiRequest,
  defaultMessageFor,
  errorMessage,
  isApiError,
} from "./client.ts";
import {
  alarmsPageExample,
  forbiddenErrorExample,
  notFoundErrorExample,
  ordersPageExample,
  unauthorizedErrorExample,
} from "../../types/api/contract-examples.ts";

const BASE = "http://api.test/api/v1";

/** Instala un `fetch` simulado. `responder(url, init)` devuelve una `Response`; las llamadas quedan en `calls`. */
function installFetch(responder) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return responder(String(url), init);
  };
  return calls;
}

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

let storedToken;
let events;

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = BASE;
  storedToken = null;
  events = [];
  globalThis.window = {
    localStorage: { getItem: () => storedToken },
    dispatchEvent: (event) => events.push(event.type),
  };
});

afterEach(() => {
  delete globalThis.window;
});

describe("dirección de la API", () => {
  test("arma la URL con la base y el endpoint", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("/orders");
    assert.equal(calls[0].url, `${BASE}/orders`);
  });

  test("tolera barras de más en la base y un endpoint sin barra inicial", async () => {
    process.env.NEXT_PUBLIC_API_URL = `  ${BASE}///  `;
    const calls = installFetch(() => json({}));
    await apiClient("orders/5");
    assert.equal(calls[0].url, `${BASE}/orders/5`);
  });

  test("una URL absoluta no se prefija", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("https://otro.test/x");
    assert.equal(calls[0].url, "https://otro.test/x");
  });

  test("sin NEXT_PUBLIC_API_URL falla con un mensaje claro y NO llama a ninguna API (sin respaldo silencioso)", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const calls = installFetch(() => json({}));
    await assert.rejects(apiClient("/orders"), (e) => {
      assert.ok(isApiError(e));
      assert.equal(e.status, 0);
      assert.match(e.message, /NEXT_PUBLIC_API_URL/);
      return true;
    });
    assert.equal(calls.length, 0);
  });

  test("una variable en blanco también falla", async () => {
    process.env.NEXT_PUBLIC_API_URL = "   ";
    installFetch(() => json({}));
    await assert.rejects(apiClient("/orders"), /NEXT_PUBLIC_API_URL/);
  });
});

describe("parámetros", () => {
  test("omite undefined, null y cadena vacía; incluye números y booleanos", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("/orders", { params: { status: 2, size: 20, q: "", x: undefined, y: null, ok: true, zero: 0 } });
    assert.equal(calls[0].url, `${BASE}/orders?status=2&size=20&ok=true&zero=0`);
  });

  test("un arreglo repite el parámetro y los espacios se codifican", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("/orders", { params: { sort: ["preset,desc", "status,asc"], texto: "a b" } });
    assert.equal(calls[0].url, `${BASE}/orders?sort=preset%2Cdesc&sort=status%2Casc&texto=a+b`);
  });

  test("sin parámetros no agrega el signo de pregunta; con uno ya presente, usa &", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("/orders", { params: {} });
    await apiClient("/orders?a=1", { params: { b: 2 } });
    assert.equal(calls[0].url, `${BASE}/orders`);
    assert.equal(calls[1].url, `${BASE}/orders?a=1&b=2`);
  });
});

describe("encabezados y cuerpo", () => {
  test("un GET sin token no manda Authorization ni Content-Type (evita un preflight innecesario)", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("/orders");
    const h = calls[0].init.headers;
    assert.equal(h.Authorization, undefined);
    assert.equal(h["Content-Type"], undefined);
    assert.match(h.Accept, /application\/json/);
  });

  test("con token guardado manda Authorization: Bearer", async () => {
    storedToken = "abc.def.ghi";
    const calls = installFetch(() => json({}));
    await apiClient("/orders");
    assert.equal(calls[0].init.headers.Authorization, "Bearer abc.def.ghi");
  });

  test("auth: false no manda el token aunque exista (login)", async () => {
    storedToken = "abc.def.ghi";
    const calls = installFetch(() => json({}));
    await apiClient("/login", { method: "POST", auth: false, form: { username: "a", password: "b" } });
    assert.equal(calls[0].init.headers.Authorization, undefined);
  });

  test("form: formulario codificado (el login del backend recibe form, no JSON)", async () => {
    const calls = installFetch(() => new Response("tok.en.jwt", { headers: { "content-type": "text/plain" } }));
    await apiClient("/login", { method: "POST", form: { username: "ana", password: "p&w d" } });
    assert.equal(calls[0].init.headers["Content-Type"], "application/x-www-form-urlencoded");
    assert.equal(calls[0].init.body, "username=ana&password=p%26w+d");
  });

  test("json: serializa el cuerpo y marca el tipo", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("/alarms/config", { method: "PUT", json: { temperatureThreshold: 30, recipientEmails: [] } });
    assert.equal(calls[0].init.headers["Content-Type"], "application/json");
    assert.equal(calls[0].init.body, '{"temperatureThreshold":30,"recipientEmails":[]}');
  });

  test("un cuerpo ya serializado (código heredado) sin Content-Type se envía como JSON; uno explícito se respeta", async () => {
    const calls = installFetch(() => json({}));
    await apiClient("/x", { method: "POST", body: '{"a":1}' });
    await apiClient("/y", { method: "POST", body: "a=1", headers: { "content-type": "application/x-www-form-urlencoded" } });
    assert.equal(calls[0].init.headers["Content-Type"], "application/json");
    assert.equal(calls[1].init.headers["content-type"], "application/x-www-form-urlencoded");
    assert.equal(calls[1].init.headers["Content-Type"], undefined);
  });
});

describe("respuestas correctas", () => {
  test("JSON: devuelve el objeto del contrato", async () => {
    installFetch(() => json(ordersPageExample));
    const page = await apiClient("/orders");
    assert.deepEqual(page, ordersPageExample);
    assert.equal(page.content[0].truck.plate, "AL123RM");
  });

  test("apiRequest devuelve estado y cabeceras: el alta de una orden responde 201 sin cuerpo y con Location", async () => {
    installFetch(() => new Response(null, { status: 201, headers: { location: "/api/v1/orders/90001" } }));
    const res = await apiRequest("/integration/sap/orders", { method: "POST", json: { orderNumber: 90001 } });
    assert.equal(res.status, 201);
    assert.equal(res.data, undefined);
    assert.equal(res.headers.get("location"), "/api/v1/orders/90001");
  });

  test("texto plano: el token del login se devuelve recortado", async () => {
    installFetch(() => new Response("  eyJ.abc.def\n", { headers: { "content-type": "text/plain;charset=UTF-8" } }));
    assert.equal(await apiClient("/login", { method: "POST", auth: false, form: {} }), "eyJ.abc.def");
  });

  test("el login real etiqueta como application/json el token pelado: se devuelve como texto (defecto hallado con Chrome real)", async () => {
    installFetch(() => new Response("eyJhbGciOiJIUzUxMiJ9.abc.def", { headers: { "content-type": "application/json" } }));
    assert.equal(await apiClient("/login", { method: "POST", auth: false, form: {} }), "eyJhbGciOiJIUzUxMiJ9.abc.def");
  });

  test("un objeto o arreglo JSON roto sigue siendo un error aunque el tipo diga json", async () => {
    for (const roto of ['{"a":', "[1,2", '  {"a" 1}']) {
      installFetch(() => new Response(roto, { headers: { "content-type": "application/json" } }));
      await assert.rejects(apiClient("/orders"), (e) => isApiError(e) && /no es válida/.test(e.message), roto);
    }
  });

  test("204 y cuerpo vacío dan undefined", async () => {
    installFetch(() => new Response(null, { status: 204 }));
    assert.equal(await apiClient("/algo", { method: "DELETE" }), undefined);
  });

  test("un JSON declarado pero malformado es un error, no un dato roto", async () => {
    installFetch(() => new Response("{no es json", { status: 200, headers: { "content-type": "application/json" } }));
    await assert.rejects(apiClient("/orders"), (e) => isApiError(e) && e.status === 200 && /no es válida/.test(e.message));
  });
});

describe("errores del backend", () => {
  test("usa el message REAL del backend (404 del contrato)", async () => {
    installFetch(() => json(notFoundErrorExample, 404));
    await assert.rejects(apiClient("/orders/1"), (e) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 404);
      assert.equal(e.message, "No se encuentra la Orden numero=1");
      assert.equal(e.isNotFound, true);
      return true;
    });
  });

  test("403 y 401 reales del contrato", async () => {
    installFetch(() => json(forbiddenErrorExample, 403));
    await assert.rejects(apiClient("/x"), (e) => e.status === 403 && e.isForbidden && /No tiene permisos/.test(e.message));
    installFetch(() => json(unauthorizedErrorExample, 401));
    await assert.rejects(apiClient("/x"), (e) => e.status === 401 && e.isUnauthorized && e.message === "Falta el token o es inválido");
  });

  test("409: el estado no permite la operación", async () => {
    installFetch(() => json({ message: "La conciliación solo está disponible para órdenes en estado 4", code: 409, devInfo: null }, 409));
    await assert.rejects(apiClient("/orders/1/reconciliation"), (e) => e.isConflict && /estado 4/.test(e.message));
  });

  test("sin message (400 de Spring con otro formato) usa el mensaje por defecto del código", async () => {
    installFetch(() => json({ timestamp: "2026-11-12", status: 400, error: "Bad Request", path: "/api/v1/integration/sap/orders" }, 400));
    await assert.rejects(apiClient("/integration/sap/orders", { method: "POST", json: {} }), (e) => e.status === 400 && e.message === defaultMessageFor(400));
  });

  test("mensajes por defecto de cada código", () => {
    for (const [code, re] of [[400, /no son válidos/], [401, /Sesión vencida/], [403, /permisos/], [404, /No se encontró/], [409, /estado actual/], [302, /ya existe/], [500, /interno/], [503, /interno/], [418, /Error HTTP 418/]]) {
      assert.match(defaultMessageFor(code), re, String(code));
    }
  });

  test("302 (orden repetida) llega como ApiError con el message del backend", async () => {
    installFetch(() => json({ message: "Ya existe la orden 90001", code: 302, devInfo: null }, 302));
    await assert.rejects(apiClient("/integration/sap/orders", { method: "POST", json: {} }), (e) => e.status === 302 && e.message === "Ya existe la orden 90001");
  });

  test("el devInfo (stack trace) NUNCA se expone: ni en el mensaje ni en data", async () => {
    const traza = "org.springframework.security.access.AccessDeniedException\r\n\tat ar.edu.iua.iw3...";
    installFetch(() => json({ message: "No tiene permisos para realizar esta operación", code: 403, devInfo: traza }, 403));
    await assert.rejects(apiClient("/x"), (e) => {
      assert.ok(!e.message.includes("springframework"));
      assert.equal("devInfo" in e.data, false);
      assert.ok(!JSON.stringify(e.data).includes("springframework"));
      assert.equal(e.data.code, 403);
      return true;
    });
  });

  test("una página HTML de error (proxy) no se muestra: se usa el mensaje del código", async () => {
    installFetch(() => new Response("<html><body>502 Bad Gateway</body></html>", { status: 502, headers: { "content-type": "text/html" } }));
    await assert.rejects(apiClient("/orders"), (e) => e.status === 502 && e.message === defaultMessageFor(502));
  });

  test("un texto plano corto sí se usa", async () => {
    installFetch(() => new Response("Servicio en mantenimiento", { status: 503, headers: { "content-type": "text/plain" } }));
    await assert.rejects(apiClient("/orders"), (e) => e.message === "Servicio en mantenimiento");
  });
});

describe("401 y la sesión", () => {
  test("un 401 CON token enviado emite el evento para cerrar la sesión", async () => {
    storedToken = "vencido.token.jwt";
    installFetch(() => json(unauthorizedErrorExample, 401));
    await assert.rejects(apiClient("/orders"), (e) => e.status === 401);
    assert.deepEqual(events, [UNAUTHORIZED_EVENT]);
  });

  test("un 401 SIN token (login con credenciales incorrectas) no cierra ninguna sesión", async () => {
    storedToken = "vencido.token.jwt";
    installFetch(() => json({ message: "Invalid password", code: 401, devInfo: null }, 401));
    await assert.rejects(apiClient("/login", { method: "POST", auth: false, form: {} }), (e) => e.message === "Invalid password");
    assert.deepEqual(events, []);
  });

  test("403, 404 y 500 no cierran la sesión", async () => {
    storedToken = "token.valido.jwt";
    for (const status of [403, 404, 409, 500]) {
      installFetch(() => json({ message: "x", code: status, devInfo: null }, status));
      await assert.rejects(apiClient("/orders"));
    }
    assert.deepEqual(events, []);
  });

  test("sin window (render del servidor) un 401 igual da ApiError y no revienta", async () => {
    delete globalThis.window;
    installFetch(() => json(unauthorizedErrorExample, 401));
    await assert.rejects(apiClient("/orders"), (e) => e.status === 401);
  });

  test("si el almacenamiento está bloqueado no se manda token y no revienta", async () => {
    globalThis.window = { localStorage: { getItem: () => { throw new Error("bloqueado"); } }, dispatchEvent: () => {} };
    const calls = installFetch(() => json({}));
    await apiClient("/orders");
    assert.equal(calls[0].init.headers.Authorization, undefined);
  });
});

describe("red, tiempo y cancelación", () => {
  test("sin respuesta (servidor apagado o CORS) es un ApiError de estado 0", async () => {
    installFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    await assert.rejects(apiClient("/orders"), (e) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 0);
      assert.equal(e.isNetworkError, true);
      assert.match(e.message, /No se pudo conectar/);
      return true;
    });
  });

  test("tiempo agotado: el pedido se cancela y se informa", async () => {
    installFetch((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    const t0 = Date.now();
    await assert.rejects(apiClient("/orders", { timeoutMs: 30 }), (e) => e.status === 0 && /tardó demasiado/.test(e.message));
    assert.ok(Date.now() - t0 < 2000);
  });

  test("el tiempo máximo también cubre un cuerpo que se cuelga", async () => {
    installFetch((_url, init) => {
      const stream = new ReadableStream({
        start(controller) {
          init.signal.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")));
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "application/json" } });
    });
    await assert.rejects(apiClient("/orders", { timeoutMs: 30 }), (e) => e.status === 0 && /tardó demasiado/.test(e.message));
  });

  test("si el que llama cancela (por ejemplo al desmontar un componente), se relanza el AbortError y no es un ApiError", async () => {
    installFetch((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    const controller = new AbortController();
    const pedido = apiClient("/orders", { signal: controller.signal });
    controller.abort();
    await assert.rejects(pedido, (e) => e.name === "AbortError" && !(e instanceof ApiError));
  });
});

describe("utilidades", () => {
  test("isApiError y errorMessage", () => {
    const e = new ApiError(403, "No tenés permisos");
    assert.equal(isApiError(e), true);
    assert.equal(isApiError(new Error("x")), false);
    assert.equal(errorMessage(e), "No tenés permisos");
    assert.equal(errorMessage(new Error("interno de JavaScript"), "No se pudo cargar"), "No se pudo cargar");
    assert.equal(errorMessage("texto"), "Ocurrió un error inesperado");
  });

  test("las alarmas del contrato pasan intactas por el cliente", async () => {
    installFetch(() => json(alarmsPageExample));
    const page = await apiClient("/alarms", { params: { status: "PENDING" } });
    assert.equal(page.content[0].emailSentAt, null);
    assert.equal(page.page.totalElements, 13);
  });
});

import { expect, Page, TestInfo, Browser, Locator } from '@playwright/test';

/** Usuarios de prueba (variables de entorno). Si faltan, las pruebas @con-login se omiten. */
export const CRED = {
  cliente: { email: process.env.QA_CLIENTE_EMAIL, clave: process.env.QA_CLIENTE_PASS },
  pro: { email: process.env.QA_PRO_EMAIL, clave: process.env.QA_PRO_PASS },
  /** Categoría en la que trabaja el profesional de prueba (texto tal como se ve en "Buscar"). */
  categoria: process.env.QA_PRO_CATEGORIA || 'Electricidad',
  /** Nombre del profesional de prueba tal como aparece en los resultados de búsqueda. */
  proNombre: process.env.QA_PRO_NOMBRE || '',
};
export const hayCliente = !!(CRED.cliente.email && CRED.cliente.clave);
export const hayPro = !!(CRED.pro.email && CRED.pro.clave);
export const hayAmbos = hayCliente && hayPro && !!CRED.proNombre;

type Usuario = { email?: string; clave?: string };

// ── Localizadores ────────────────────────────────────────────────────────────
// En web, React Navigation deja las pantallas anteriores montadas (ocultas) debajo de la actual,
// por eso todos los localizadores se limitan a lo que está VISIBLE.
const visible = (l: Locator) => l.filter({ visible: true });
/** Texto exacto visible. */
export const texto = (p: Page, t: string) => visible(p.getByText(t, { exact: true }));
/** Texto parcial/regex visible. */
export const textoParcial = (p: Page, t: string | RegExp) => visible(p.getByText(t));
/** Campo por placeholder, visible. */
export const campo = (p: Page, placeholder: string | RegExp, exact = false) =>
  visible(p.getByPlaceholder(placeholder, { exact }));

export const campoCorreo = (p: Page) => campo(p, 'Correo electrónico');
export const campoClave = (p: Page) => campo(p, 'Contraseña', true);
/** "Iniciar sesión" aparece como título y como botón; el botón es el último. */
export const botonIniciarSesion = (p: Page) => texto(p, 'Iniciar sesión').last();

/**
 * Pestañas de la barra inferior: SOLO elementos con rol "tab". No se acepta "cualquier texto igual"
 * porque pantallas ya visitadas (p. ej. el título "Mis servicios") siguen montadas y aparecen antes
 * en el DOM que la pestaña, aunque estén tapadas.
 */
export const pestana = (p: Page, nombre: string) =>
  visible(p.getByRole('tab', { name: nombre })).first();

// ── Alertas (visibles gracias a web-stubs/Alert.js) ──────────────────────────
export const alertaTitulo = (p: Page) => p.getByTestId('rn-alert-title');
export const alertaMensaje = (p: Page) => p.getByTestId('rn-alert-message');
export async function cerrarAlerta(p: Page, texto = 'OK') {
  await p.getByTestId('rn-alert-btn').filter({ hasText: texto }).first().click();
}

// ── Acciones ─────────────────────────────────────────────────────────────────
export async function abrirApp(p: Page) {
  await p.goto('/');
  await expect(campoCorreo(p)).toBeVisible({ timeout: 30_000 });
}

/** Inicia sesión y espera a que termine la pantalla de bienvenida (≈3 s) y aparezca la barra de pestañas. */
export async function iniciarSesion(p: Page, u: Usuario) {
  await abrirApp(p);
  await campoCorreo(p).fill(u.email!);
  await campoClave(p).fill(u.clave!);
  await botonIniciarSesion(p).click();
  await expect(pestana(p, 'Ajustes')).toBeVisible({ timeout: 30_000 });
}

/** Adjunta una captura con nombre al reporte (evidencia de un paso concreto). */
export async function evidencia(p: Page, info: TestInfo, nombre: string) {
  await info.attach(nombre, { body: await p.screenshot(), contentType: 'image/png' });
}

/** Recoge errores de consola/JS durante la prueba; útil como evidencia de bugs. */
export function vigilarErrores(p: Page) {
  const errores: string[] = [];
  p.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() === 'error') errores.push(`console.error: ${m.text().slice(0, 300)}`);
  });
  return errores;
}

/** Abre una sesión aparte (otro "teléfono") para simular al otro rol en la misma prueba. */
export async function nuevaSesion(browser: Browser, u: Usuario) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 860 }, baseURL: process.env.BASE_URL || 'http://localhost:8081' });
  const page = await ctx.newPage();
  await iniciarSesion(page, u);
  return { ctx, page };
}

/** Flujo del cliente: busca por categoría y envía una solicitud al profesional de prueba. */
export async function crearSolicitud(p: Page, descripcion: string) {
  await pestana(p, 'Buscar').click();
  await tocar(texto(p, CRED.categoria));
  const tarjeta = textoParcial(p, CRED.proNombre).first();
  await expect(tarjeta).toBeVisible({ timeout: 20_000 });
  await tocar(texto(p, 'Solicitar servicio'));
  await campo(p, /Describe el trabajo/).fill(descripcion);
  await campo(p, 'Ej: 80000').first().fill('80000');
  await tocar(texto(p, 'Enviar solicitud'));
}

/**
 * En web, React Navigation deja montadas las pantallas ya visitadas, apiladas unas sobre otras.
 * Un mismo texto (p. ej. la categoría "Electricidad") existe en Home, Buscar y Mis servicios, y
 * Playwright puede escoger la copia que está TAPADA por la pantalla activa (el clic no llega).
 * Esta función devuelve la primera coincidencia que el usuario realmente puede tocar.
 */
export async function tocable(loc: Locator): Promise<Locator> {
  const indices = () =>
    loc.evaluateAll((els) =>
      els
        .map((e, i) => {
          const r = e.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return -1;
          e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          const r2 = e.getBoundingClientRect();
          const t = document.elementFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2);
          return t && (t === e || e.contains(t)) ? i : -1;
        })
        .filter((i) => i >= 0)
    );
  await expect
    .poll(async () => (await indices()).length, { timeout: 20_000, message: 'No hay un elemento tocable (¿tapado por otra pantalla?)' })
    .toBeGreaterThan(0);
  return loc.nth((await indices())[0]);
}

/** Toca la primera coincidencia realmente tocable de un localizador. */
export async function tocar(loc: Locator) {
  await (await tocable(loc)).click();
}

/**
 * Tras aceptar/finalizar, la app intenta generar un PDF (expo-print). En el navegador eso no existe y la app
 * muestra la alerta "Documento no generado", que TAPA la pantalla. El PDF está fuera del alcance de la prueba web
 * (se verifica en el celular), así que se cierra la alerta y se anota en el reporte.
 */
export async function cerrarAvisoPdf(p: Page, info?: TestInfo) {
  const t = alertaTitulo(p);
  if (await aparece(t.filter({ hasText: 'Documento no generado' }), 6000)) {
    info?.annotations.push({ type: 'nota', description: 'Web: el PDF no se genera (expo-print); se verifica en el dispositivo.' });
    await cerrarAlerta(p, 'OK');
  }
}

/**
 * ¿Aparece este elemento dentro de `ms` milisegundos? (locator.isVisible() NO espera: responde al instante
 * e ignora el timeout, por eso no sirve para "esperar y ver si sale".)
 */
export async function aparece(loc: Locator, ms = 5000): Promise<boolean> {
  try {
    await loc.first().waitFor({ state: 'visible', timeout: ms });
    return true;
  } catch {
    return false;
  }
}

/**
 * Chip de filtro de las listas de servicios. La app le agrega el conteo al texto cuando hay elementos
 * ("En proceso (1)", "Finalizados (20)"), así que el texto exacto cambia: se acepta con o sin "(N)".
 */
export const filtro = (p: Page, nombre: string) =>
  visible(p.getByText(new RegExp(`^${nombre}( \\(\\d+\\))?$`)));

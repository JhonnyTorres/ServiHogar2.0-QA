import { test, expect } from '@playwright/test';
import {
  CRED, hayCliente, hayPro, hayAmbos,
  abrirApp, iniciarSesion, nuevaSesion, crearSolicitud, pestana, texto, textoParcial, campo, tocar,
  campoCorreo, campoClave, botonIniciarSesion,
  alertaTitulo, alertaMensaje, cerrarAlerta, cerrarAvisoPdf, aparece, filtro, evidencia, vigilarErrores,
} from './helpers';

/**
 * Pruebas que SÍ necesitan Firebase y usuarios de prueba (ver README: variables QA_*).
 * Si faltan las variables, las pruebas se OMITEN (no fallan).
 *
 * Los textos salen del código de la app (pantallas y modales). Si una prueba falla por un
 * localizador y no por un comportamiento, ajústalo con `npx playwright codegen <url>`
 * y revisa la traza (`trace.zip`) del reporte.
 */

const SIN_CLIENTE = 'Falta QA_CLIENTE_EMAIL / QA_CLIENTE_PASS';
const SIN_PRO = 'Falta QA_PRO_EMAIL / QA_PRO_PASS';
const SIN_AMBOS = 'Faltan QA_CLIENTE_*, QA_PRO_* y QA_PRO_NOMBRE';

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Roles, bienvenida y navegación @con-login', () => {
  test('T11 Cliente: pantalla de bienvenida y pestañas propias del rol', async ({ page }, info) => {
    test.skip(!hayCliente, SIN_CLIENTE);
    await abrirApp(page);
    await campoCorreo(page).fill(CRED.cliente.email!);
    await campoClave(page).fill(CRED.cliente.clave!);
    await botonIniciarSesion(page).click();

    await expect(textoParcial(page, 'Cargando tu espacio...')).toBeVisible(); // bienvenida cliente
    await evidencia(page, info, 'bienvenida-cliente');
    await expect(pestana(page, 'Ajustes')).toBeVisible({ timeout: 30_000 });

    for (const nombre of ['Buscar', 'Mis servicios', 'Mensajes', 'Usuario']) {
      await expect(pestana(page, nombre), `pestaña ${nombre}`).toBeVisible();
    }
    await expect(texto(page, 'Solicitudes'), 'el cliente no debe ver "Solicitudes"').toHaveCount(0);
    await expect(textoParcial(page, '¿Qué necesitas hoy?')).toBeVisible();
    await evidencia(page, info, 'home-cliente');
  });

  test('T12 Profesional: pantalla de bienvenida y pestañas propias del rol', async ({ page }, info) => {
    test.skip(!hayPro, SIN_PRO);
    await abrirApp(page);
    await campoCorreo(page).fill(CRED.pro.email!);
    await campoClave(page).fill(CRED.pro.clave!);
    await botonIniciarSesion(page).click();

    await expect(textoParcial(page, 'Preparando tu panel...')).toBeVisible(); // bienvenida profesional
    await evidencia(page, info, 'bienvenida-profesional');
    await expect(pestana(page, 'Ajustes')).toBeVisible({ timeout: 30_000 });

    await expect(pestana(page, 'Solicitudes')).toBeVisible();
    await expect(texto(page, 'Buscar'), 'el profesional no debe ver "Buscar"').toHaveCount(0);
    await expect(texto(page, 'Mis servicios'), 'el profesional no debe ver "Mis servicios"').toHaveCount(0);
    await expect(textoParcial(page, 'Aquí está tu resumen de hoy')).toBeVisible();
    await evidencia(page, info, 'home-profesional');
  });

  test('T13 Cliente: la búsqueda ofrece las 14 categorías de servicio', async ({ page }, info) => {
    test.skip(!hayCliente, SIN_CLIENTE);
    await iniciarSesion(page, CRED.cliente);
    await pestana(page, 'Buscar').click();
    await expect(textoParcial(page, 'Selecciona una categoría')).toBeVisible();
    const categorias = [
      'Plomería', 'Electricidad', 'Construcción', 'Pintura', 'Carpintería', 'Cerrajería', 'Jardinería',
      'Aseo', 'Gas', 'Climatización', 'Domicilios', 'Cuidado niños', 'Adultos mayores', 'Servicios gen.',
    ];
    for (const c of categorias) {
      await expect(texto(page, c).first(), `categoría ${c}`).toBeAttached();
    }
    await evidencia(page, info, 'categorias');
  });

  test('T14 Mensajes: la lista de chats carga sin errores de JavaScript', async ({ page }, info) => {
    test.skip(!hayCliente, SIN_CLIENTE);
    const errores = vigilarErrores(page);
    await iniciarSesion(page, CRED.cliente);
    await pestana(page, 'Mensajes').click();
    await expect(texto(page, 'Mensajes').first()).toBeVisible();
    await page.waitForTimeout(1500); // deja cargar la suscripción a Firestore
    await evidencia(page, info, 'lista-de-chats');
    await info.attach('errores-consola', { body: errores.join('\n') || '(sin errores)', contentType: 'text/plain' });
    expect(errores.filter((e) => e.startsWith('pageerror'))).toEqual([]);
  });

  test('T15 Ajustes: cerrar sesión vuelve al login sin errores de navegación', async ({ page }, info) => {
    test.skip(!hayCliente, SIN_CLIENTE);
    const errores = vigilarErrores(page);
    await iniciarSesion(page, CRED.cliente);
    await pestana(page, 'Ajustes').click();
    await tocar(texto(page, 'Cerrar sesión'));
    await expect(alertaTitulo(page)).toContainText('Sesión cerrada');
    await evidencia(page, info, 'alerta-sesion-cerrada');
    await cerrarAlerta(page, 'OK'); // ejecuta navigation.reset(Login) mientras el usuario ya es null
    await expect(campoCorreo(page)).toBeVisible();
    await info.attach('errores-consola', { body: errores.join('\n') || '(sin errores)', contentType: 'text/plain' });
    // Si aquí aparece "The action 'RESET' ... was not handled", es un hallazgo (ver reporte).
    expect(errores.filter((e) => /RESET|not handled/i.test(e))).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Preparación: deja al profesional sin solicitudes activas para que la suite se pueda repetir.
// No es una prueba de HU: solo rechaza las pendientes y finaliza las "En proceso" que hayan quedado de corridas anteriores.
test.describe('Preparación @con-login', () => {
  test('T00 Limpieza: sin solicitudes activas antes del ciclo de servicio', async ({ page }) => {
    test.skip(!hayAmbos, SIN_AMBOS);
    await iniciarSesion(page, CRED.pro);
    await pestana(page, 'Solicitudes').click();

    // Esperar a que la lista termine de cargar ("N en total") antes de mirar si hay algo por limpiar
    await expect(textoParcial(page, /en total/)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2000);

    // Pendientes (filtro por defecto): rechazar todas
    for (let n = 0; n < 10 && (await aparece(texto(page, 'Rechazar'), 4000)); n++) {
      await tocar(texto(page, 'Rechazar'));
      await campo(page, /Explica brevemente/).fill('Limpieza QA automática');
      await tocar(texto(page, 'Rechazar y enviar'));
      await expect(texto(page, 'Rechazar y enviar')).toHaveCount(0, { timeout: 10_000 }); // el modal ya cerró
      await page.waitForTimeout(2500);
    }
    // En proceso: finalizar todas. Es una limpieza "de mejor esfuerzo": si no hay chip tocable, no hay nada que limpiar.
    if (!(await aparece(filtro(page, 'En proceso'), 8000))) return;
    await tocar(filtro(page, 'En proceso'));
    for (let n = 0; n < 10 && (await aparece(texto(page, 'Marcar como finalizado'), 4000)); n++) {
      await tocar(texto(page, 'Marcar como finalizado'));
      const pideMonto = campo(page, 'Ej: 80000').first();
      if (await aparece(pideMonto, 3000)) {
        await pideMonto.fill('80000');
        await tocar(texto(page, 'Continuar'));
      }
      await cerrarAvisoPdf(page);
      await page.waitForTimeout(1500);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Ciclo de vida de un servicio: pendiente → en_proceso → finalizado (serial: cada paso usa el anterior)
test.describe('Ciclo de un servicio @con-login', () => {
  test.describe.configure({ mode: 'serial' });
  const descripcion = `QA automatizado ${new Date().toISOString().slice(0, 16)}`;

  test('T16 Cliente solicita un servicio y queda "Pendiente" en Mis servicios', async ({ page }, info) => {
    test.skip(!hayAmbos, SIN_AMBOS);
    await iniciarSesion(page, CRED.cliente);
    await pestana(page, 'Mis servicios').click();

    // El encabezado de Mis servicios dice "N en total": se usa como contador (el nombre del
    // profesional también aparece en Buscar, así que contarlo daría un resultado falso).
    const leerTotal = async () => {
      const t = await page.getByText(/\d+ en total/).first().textContent();
      return Number(t!.match(/(\d+)/)![1]);
    };
    await expect(page.getByText(/\d+ en total/).first()).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500); // deja terminar la carga desde Firestore
    const antes = await leerTotal();

    await crearSolicitud(page, descripcion);
    await expect(alertaTitulo(page), 'PRECONDICIÓN: el cliente ya tiene una solicitud pendiente/en proceso con este profesional (la app bloquea duplicados por cliente+profesional). Finalízala o usa otro cliente de prueba.').toHaveText('¡Solicitud enviada!');
    await evidencia(page, info, 'solicitud-enviada');
    await cerrarAlerta(page, 'OK');

    await pestana(page, 'Mis servicios').click();
    await expect.poll(leerTotal, { timeout: 20_000 }).toBe(antes + 1);
    await evidencia(page, info, 'mis-servicios-pendiente');
  });

  test('T17 Profesional acepta la solicitud (cotiza) y pasa a "En proceso"', async ({ page }, info) => {
    test.skip(!hayPro, SIN_PRO);
    await iniciarSesion(page, CRED.pro);
    await pestana(page, 'Solicitudes').click();
    await expect(texto(page, 'Aceptar').first()).toBeVisible({ timeout: 20_000 });
    await evidencia(page, info, 'solicitudes-pendientes');

    await tocar(texto(page, 'Aceptar'));
    await expect(textoParcial(page, 'Valor del servicio (COP)')).toBeVisible();
    // Mismo valor que el presupuesto del cliente (80000): si fuera distinto, la app exige un comentario y deshabilita "Continuar".
    await campo(page, 'Ej: 80000').first().fill('80000');
    await evidencia(page, info, 'modal-cotizacion');
    await tocar(texto(page, 'Continuar'));
    await cerrarAvisoPdf(page, info);

    await evidencia(page, info, 'despues-de-aceptar');
    await tocar(filtro(page, 'En proceso')); // filtro de la lista
    await expect(texto(page, 'Marcar como finalizado').first()).toBeVisible({ timeout: 20_000 });
    await evidencia(page, info, 'servicio-en-proceso');
  });

});

// T21 va en su propio bloque (no serial) para que, si fallara, no se salten T18 y T19.
// Se ejecuta con el servicio en "En proceso": sirve para probar que la app impide otra solicitud activa (HU-19).
test.describe('Solicitud duplicada @con-login', () => {
  test('T21 Cliente: con una solicitud activa, pedir otra al mismo profesional muestra "Solicitud existente"', async ({ page }, info) => {
    test.skip(!hayAmbos, SIN_AMBOS);
    await iniciarSesion(page, CRED.cliente);
    await crearSolicitud(page, `QA solicitud duplicada ${Date.now()}`);
    await expect(alertaTitulo(page)).toHaveText('Solicitud existente');
    await expect(alertaMensaje(page)).toContainText('servicio activo');
    await evidencia(page, info, 'solicitud-duplicada-bloqueada');
  });

});

test.describe('Finalizar y calificar @con-login', () => {
  test.describe.configure({ mode: 'serial' });

  test('T18 Profesional finaliza el servicio y el pago aparece en el historial del cliente', async ({ page, browser }, info) => {
    test.skip(!hayAmbos, SIN_AMBOS);
    await iniciarSesion(page, CRED.pro);
    await pestana(page, 'Solicitudes').click();
    await tocar(filtro(page, 'En proceso'));
    await tocar(texto(page, 'Marcar como finalizado'));
    // Si pide el valor final, se confirma con el mismo monto cotizado.
    const pideMonto = campo(page, 'Ej: 80000').first();
    if (await aparece(pideMonto, 3000)) {
      await pideMonto.fill('80000');
      await tocar(texto(page, 'Continuar'));
    }
    await cerrarAvisoPdf(page, info);
    // En web el PDF (expo-print) puede abrir el diálogo de impresión o avisar que no se generó: no es parte de la HU.
    await tocar(filtro(page, 'Finalizados'));
    await expect(texto(page, 'Marcar como finalizado')).toHaveCount(0, { timeout: 20_000 });
    await evidencia(page, info, 'servicio-finalizado');

    const cliente = await nuevaSesion(browser, CRED.cliente);
    await tocar(texto(cliente.page, 'Historial de pagos'));
    await expect(textoParcial(cliente.page, CRED.proNombre).first()).toBeVisible({ timeout: 20_000 });
    await evidencia(cliente.page, info, 'historial-de-pagos-cliente');
    await cliente.ctx.close();
  });

  test('T19 Cliente: la ventana "Calificar servicio" no permite enviar sin elegir estrellas', async ({ page }, info) => {
    test.skip(!hayCliente, SIN_CLIENTE);
    await iniciarSesion(page, CRED.cliente);
    await pestana(page, 'Mis servicios').click();
    await tocar(filtro(page, 'Finalizado')); // filtro
    await tocar(texto(page, 'Calificar servicio'));
    // "Tu calificación" también está en cada tarjeta finalizada (varias coincidencias); el modal se reconoce por su botón "Enviar".
    const enviar = texto(page, 'Enviar').first();
    await expect(enviar).toBeVisible();
    await evidencia(page, info, 'modal-calificar-sin-estrellas');

    // Comportamiento real: sin estrellas el botón "Enviar" queda DESHABILITADO (la app no llega a mostrar
    // la alerta "Calificación requerida" que existe en el código). Ver OBS-01 en el informe.
    await expect(enviar.locator('xpath=ancestor-or-self::*[@aria-disabled][1]'), 'Sin estrellas, "Enviar" debe estar deshabilitado').toHaveAttribute('aria-disabled', 'true');
    await enviar.click({ force: true }); // un toque sobre el botón deshabilitado no debe enviar nada
    await page.waitForTimeout(1000);
    await expect(alertaTitulo(page), 'No debe aparecer ninguna alerta (ni "¡Gracias!" de calificación registrada)').toHaveCount(0);
    await evidencia(page, info, 'enviar-deshabilitado-sin-estrellas');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Rechazo de una solicitud @con-login', () => {
  test('T20 Profesional rechaza con motivo y el cliente ve el rechazo', async ({ page, browser }, info) => {
    test.skip(!hayAmbos, SIN_AMBOS);
    const motivo = `Motivo QA ${Date.now()}`;

    // Precondición: una solicitud nueva del cliente
    const cliente = await nuevaSesion(browser, CRED.cliente);
    await crearSolicitud(cliente.page, `Solicitud para rechazar ${Date.now()}`);
    await expect(alertaTitulo(cliente.page), 'PRECONDICIÓN: el cliente ya tiene una solicitud pendiente/en proceso con este profesional (la app bloquea duplicados por cliente+profesional). Finalízala o usa otro cliente de prueba.').toHaveText('¡Solicitud enviada!');
    await cerrarAlerta(cliente.page, 'OK');

    // Profesional rechaza
    await iniciarSesion(page, CRED.pro);
    await pestana(page, 'Solicitudes').click();
    await tocar(texto(page, 'Rechazar'));
    await expect(textoParcial(page, 'Rechazar solicitud')).toBeVisible();
    await campo(page, /Explica brevemente/).fill(motivo);
    await evidencia(page, info, 'modal-rechazo');
    await tocar(texto(page, 'Rechazar y enviar'));

    // Cliente lo ve en "Rechazado"
    await pestana(cliente.page, 'Mis servicios').click();
    await tocar(filtro(cliente.page, 'Rechazado'));
    await expect(textoParcial(cliente.page, motivo).first()).toBeVisible({ timeout: 20_000 });
    await evidencia(cliente.page, info, 'cliente-ve-rechazo');
    await cliente.ctx.close();
  });
});

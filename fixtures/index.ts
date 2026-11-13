import { test as base, expect, BrowserContext, Page, TestInfo } from '@playwright/test';
import { LoginPage } from '../pom/LoginPage';
import { ClientePage } from '../pom/ClientePage';
import { ProfesionalPage } from '../pom/ProfesionalPage';
import { RegistroPage } from '../pom/RegistroPage';
import { AppPage } from '../pom/AppPage';
import { datos, cred, hayCredenciales, Datos } from './datos';

export { expect, datos, cred, hayCredenciales };

export type Rol = 'cliente' | 'profesional';
export type Sesion = {
  page: Page;
  app: AppPage;
  login: LoginPage;
  cliente: ClientePage;
  profesional: ProfesionalPage;
};

/** Adjunta una captura con nombre al reporte (evidencia de un paso). */
export async function evidencia(info: TestInfo, page: Page, nombre: string): Promise<void> {
  await info.attach(nombre, { body: await page.screenshot(), contentType: 'image/png' });
}

/** Inicia sesión en una página y devuelve los Page Objects de esa sesión. */
export async function entrar(page: Page, rol: Rol): Promise<Sesion> {
  const login = new LoginPage(page);
  const app = new AppPage(page);
  await app.ignorarAvisoPdf();
  await login.iniciarSesion(cred[rol].correo, cred[rol].clave);
  return { page, app, login, cliente: new ClientePage(page), profesional: new ProfesionalPage(page) };
}

type Fixtures = {
  datos: Datos;
  /** Page Objects del formulario de registro/login sobre la página de la prueba (no requiere cuentas). */
  paginas: { login: LoginPage; registro: RegistroPage; app: AppPage };
  /** Abre una sesión nueva (otro "teléfono") ya iniciada con la cuenta de ese rol. Se cierra sola. */
  nuevaSesion: (rol: Rol) => Promise<Sesion>;
  /** El profesional de prueba queda sin solicitudes activas antes y después de la prueba. */
  sinActivos: void;
  /** Precondición: una solicitud del cliente al profesional, en estado "Pendiente". */
  solicitudPendiente: { descripcion: string };
  /** Precondición: la solicitud fue aceptada (cotizada) y está "En proceso". */
  servicioEnProceso: { descripcion: string };
  /** Precondición: el servicio fue finalizado por el profesional y está sin calificar. */
  servicioFinalizado: { descripcion: string };
};

export const test = base.extend<Fixtures>({
  datos: async ({}, use) => use(datos),

  paginas: async ({ page }, use) => {
    await use({ login: new LoginPage(page), registro: new RegistroPage(page), app: new AppPage(page) });
  },

  nuevaSesion: async ({ browser, baseURL, viewport }, use, testInfo) => {
    testInfo.skip(
      !hayCredenciales,
      'Faltan las cuentas de prueba: define QA_CLIENTE_EMAIL/PASS, QA_PRO_EMAIL/PASS y QA_PRO_NOMBRE (ver README).'
    );
    const sesiones: { ctx: BrowserContext; page: Page }[] = [];
    await use(async (rol) => {
      // Cada sesión es un "teléfono" aparte. Se graba su video (la traza la gestiona Playwright según la configuración) para que la evidencia
      // incluya lo que hizo cada usuario (la página por defecto de Playwright no se usa aquí).
      const ctx = await browser.newContext({
        baseURL,
        viewport,
        recordVideo: process.env.PW_VIDEO ? { dir: testInfo.outputPath('videos'), size: viewport ?? undefined } : undefined,
      });
      const page = await ctx.newPage();
      sesiones.push({ ctx, page });
      return entrar(page, rol);
    });

    const fallo = testInfo.status !== testInfo.expectedStatus;
    for (const [i, { ctx, page }] of sesiones.entries()) {
      const etiqueta = `sesion-${i + 1}`;
      if (fallo) {
        await testInfo.attach(`${etiqueta}-pantalla-al-fallar`, { body: await page.screenshot(), contentType: 'image/png' }).catch(() => {});
      }
      const video = page.video();
      await ctx.close();
      if (video && (fallo || process.env.PW_VIDEO)) {
        await testInfo.attach(`${etiqueta}-video`, { path: await video.path(), contentType: 'video/webm' }).catch(() => {});
      }
    }
  },

  sinActivos: async ({ nuevaSesion }, use) => {
    const limpiar = async () => {
      const pro = await nuevaSesion('profesional');
      await pro.profesional.limpiarActivas(datos.servicio.montoCotizado, datos.servicio.motivoRechazo);
    };
    await limpiar();
    await use();
    await limpiar();
  },

  solicitudPendiente: async ({ nuevaSesion, sinActivos }, use) => {
    void sinActivos;
    const cli = await nuevaSesion('cliente');
    const descripcion = `${datos.servicio.prefijoDescripcion} ${Date.now()}`;
    await cli.cliente.solicitar({
      categoria: cred.categoria,
      profesional: cred.profesionalNombre,
      descripcion,
      presupuesto: datos.servicio.presupuesto,
    });
    await expect(cli.cliente.alertaTitulo, 'La precondición (solicitud creada) no se cumplió').toHaveText(
      datos.servicio.mensajes.solicitudEnviada
    );
    await cli.cliente.cerrarAlerta('OK');
    await use({ descripcion });
  },

  servicioEnProceso: async ({ nuevaSesion, solicitudPendiente }, use) => {
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await pro.profesional.aceptar(datos.servicio.montoCotizado);
    await use(solicitudPendiente);
  },

  servicioFinalizado: async ({ nuevaSesion, servicioEnProceso }, use) => {
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await pro.profesional.filtro('En proceso');
    await pro.profesional.finalizar(datos.servicio.montoCotizado);
    await use(servicioEnProceso);
  },
});

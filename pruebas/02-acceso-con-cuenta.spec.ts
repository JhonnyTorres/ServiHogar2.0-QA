import { test, expect, datos, cred, hayCredenciales, evidencia, entrar } from '../fixtures';

/**
 * Módulo Acceso con cuenta: login, navegación por rol y cierre de sesión.
 * Requiere las cuentas de prueba (ver README). Cada prueba abre su propia sesión.
 */
const anotar = (hu: string, ca: string) => ({
  tag: '@con-cuenta',
  annotation: [
    { type: 'HU', description: hu },
    { type: 'CA', description: ca },
  ],
});

test.describe('Acceso con cuenta', () => {
  test('CP-04.3 Credenciales válidas permiten el acceso: cada rol entra al Home de su rol', anotar('HU-04', 'CA-03'), async ({ nuevaSesion }, info) => {
    const cliente = await nuevaSesion('cliente');
    await expect(cliente.app.textoParcial(datos.home.cliente)).toBeVisible();
    await evidencia(info, cliente.page, 'home-cliente');

    const pro = await nuevaSesion('profesional');
    await expect(pro.app.textoParcial(datos.home.profesional)).toBeVisible();
    await evidencia(info, pro.page, 'home-profesional');
  });

  test('CP-04.4 Credenciales inválidas muestran un mensaje y no dan acceso (clave incorrecta, correo inexistente, campos vacíos)', anotar('HU-04', 'CA-04'), async ({ paginas, page }, info) => {
    test.skip(!cred.cliente.correo, 'Falta QA_CLIENTE_EMAIL (necesario para la combinación "contraseña incorrecta").');
    const { login } = paginas;
    const m = datos.login.mensajes;
    await login.abrir();

    const intentar = async (correo: string, clave: string) => {
      await login.correo.fill(correo);
      await login.clave.fill(clave);
      await login.botonIniciar.click();
    };

    await test.step('contraseña incorrecta', async () => {
      await intentar(cred.cliente.correo, datos.login.claveIncorrecta);
      await expect(login.textoParcial(m.credencialesIncorrectas)).toBeVisible();
      await evidencia(info, page, 'clave-incorrecta');
    });
    await test.step('correo inexistente', async () => {
      await intentar(datos.login.correoInexistente, datos.login.claveIncorrecta);
      await expect(login.textoParcial(m.credencialesIncorrectas)).toBeVisible();
      await evidencia(info, page, 'correo-inexistente');
    });
    await test.step('campos vacíos', async () => {
      await intentar('', '');
      await expect(login.textoParcial(m.camposVacios)).toBeVisible();
      await evidencia(info, page, 'campos-vacios');
    });
    await expect(login.pestana('Ajustes'), 'No se debe acceder a la app').toHaveCount(0);
    await expect(login.correo).toBeVisible();
  });

  test('CP-10.1 El cliente ve sus pestañas y ninguna del profesional', anotar('HU-10', 'CA-01'), async ({ nuevaSesion }, info) => {
    const s = await nuevaSesion('cliente');
    for (const nombre of datos.pestanas.cliente) await expect(s.app.pestana(nombre), `pestaña ${nombre}`).toBeVisible();
    for (const nombre of datos.pestanas.clienteNoDebeVer) await expect(s.app.pestana(nombre), `"${nombre}" no es del cliente`).toHaveCount(0);
    await evidencia(info, s.page, 'pestanas-cliente');
  });

  test('CP-10.2 El profesional ve sus pestañas y ninguna del cliente', anotar('HU-10', 'CA-02'), async ({ nuevaSesion }, info) => {
    const s = await nuevaSesion('profesional');
    for (const nombre of datos.pestanas.profesional) await expect(s.app.pestana(nombre), `pestaña ${nombre}`).toBeVisible();
    for (const nombre of datos.pestanas.profesionalNoDebeVer) await expect(s.app.pestana(nombre), `"${nombre}" no es del profesional`).toHaveCount(0);
    await evidencia(info, s.page, 'pestanas-profesional');
  });

  test('CP-06.3 Al cerrar sesión se regresa a la pantalla de login', anotar('HU-06', 'CA-03'), async ({ page }, info) => {
    test.skip(!hayCredenciales, 'Faltan las cuentas de prueba (ver README).');
    const s = await entrar(page, 'cliente');
    await s.app.pestana('Ajustes').click();
    await s.app.tocar(s.app.texto('Cerrar sesión'));
    await expect(s.app.alertaTitulo).toContainText(datos.sesion.alertaCierre);
    await s.app.cerrarAlerta('OK');
    await expect(s.login.correo).toBeVisible();
    await expect(s.login.botonIniciar).toBeVisible();
    await expect(s.app.pestana('Ajustes'), 'No debe quedar la barra interna').toHaveCount(0);
    await evidencia(info, page, 'login-tras-cerrar-sesion');
  });
});

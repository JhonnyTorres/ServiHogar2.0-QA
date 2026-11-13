import { test, expect, datos, evidencia } from '../fixtures';

/**
 * Módulo Registro y Login (pantallas sin sesión). No necesitan cuentas de prueba.
 * Cada prueba lleva el ID del caso del plan (CP-xx.n) y los datos EXACTOS del caso (datos/datos.json).
 */
const reg = datos.registro;

const anotar = (hu: string, ca: string) => ({
  tag: '@sin-cuenta',
  annotation: [
    { type: 'HU', description: hu },
    { type: 'CA', description: ca },
  ],
});

test.describe('Registro y Login sin cuenta', () => {
  test.beforeEach(async ({ paginas }) => {
    await paginas.login.abrir();
  });

  test('CP-04.1 El login solicita correo y contraseña (contraseña oculta) y ofrece iniciar sesión', anotar('HU-04', 'CA-01'), async ({ paginas, page }, info) => {
    await expect(paginas.login.correo).toBeVisible();
    await expect(paginas.login.clave).toBeVisible();
    await expect(paginas.login.clave).toHaveAttribute('type', 'password');
    await expect(paginas.login.botonIniciar).toBeVisible();
    await evidencia(info, page, 'login-campos');
  });

  test.describe('Formulario de registro', () => {
    test.beforeEach(async ({ paginas }) => {
      await paginas.login.irARegistro();
      await paginas.registro.esperarFormulario();
    });

    test('CP-02.1 Correo con formato válido: rechaza abc, abc@, abc@x y "a b@x.com"; acepta qa.valido@correo.com', anotar('HU-02', 'CA-01'), async ({ paginas, page }, info) => {
      const r = paginas.registro;
      const datosValidos = { nombre: reg.nombre, clave: reg.claveValida, confirmar: reg.claveValida };

      for (const correo of reg.correosInvalidos) {
        await test.step(`correo inválido: "${correo}"`, async () => {
          await r.llenar({ ...datosValidos, correo });
          await r.continuar();
          // Esperado: se rechaza con mensaje y NO se avanza a la selección de rol.
          await expect.soft(r.textoParcial(reg.mensajes.correoInvalido), `"${correo}" debe mostrar "${reg.mensajes.correoInvalido}"`).toBeVisible({ timeout: 2000 });
          await expect.soft(r.preguntaRol, `"${correo}" no debe permitir avanzar`).toHaveCount(0, { timeout: 2000 });
          await evidencia(info, page, `correo-invalido-${correo.replace(/[^a-z0-9]/gi, '_')}`);
          if (await r.preguntaRol.count()) await r.volverDeSeleccionRol();
        });
      }

      await test.step(`correo válido: "${reg.correoValido}"`, async () => {
        await r.llenar({ ...datosValidos, correo: reg.correoValido });
        await r.continuar();
        await expect(r.textoParcial(reg.mensajes.correoInvalido)).toHaveCount(0);
        await expect(r.preguntaRol).toBeVisible();
      });
    });

    test('CP-02.2 Contraseña mínima de 6 caracteres (valor límite 5, 6 y 7)', anotar('HU-02', 'CA-02'), async ({ paginas, page }, info) => {
      const r = paginas.registro;
      const { cinco, seis, siete } = reg.contrasenasLimite;
      const base = { nombre: reg.nombre, correo: reg.correoValido };

      await test.step('5 caracteres: se rechaza', async () => {
        await r.llenar({ ...base, clave: cinco, confirmar: cinco });
        await r.continuar();
        await expect(r.textoParcial(reg.mensajes.claveCorta)).toBeVisible();
        await expect(r.preguntaRol).toHaveCount(0);
        await evidencia(info, page, 'clave-5-caracteres');
      });
      for (const [etiqueta, clave] of [['6', seis], ['7', siete]]) {
        await test.step(`${etiqueta} caracteres: se acepta`, async () => {
          await r.llenar({ ...base, clave, confirmar: clave });
          await r.continuar();
          await expect(r.preguntaRol).toBeVisible();
          await expect(r.textoParcial(reg.mensajes.claveCorta)).toHaveCount(0);
          await evidencia(info, page, `clave-${etiqueta}-caracteres`);
          await r.volverDeSeleccionRol();
        });
      }
    });

    test('CP-02.3 Campos inválidos muestran su mensaje (todos vacíos y solo el nombre vacío)', anotar('HU-02', 'CA-03'), async ({ paginas, page }, info) => {
      const r = paginas.registro;

      await test.step('todos los campos vacíos', async () => {
        await r.continuar();
        await expect(r.textoParcial(reg.mensajes.camposObligatorios)).toBeVisible();
        await evidencia(info, page, 'campos-vacios');
      });
      await test.step('solo el nombre vacío', async () => {
        await r.correo.fill(reg.correoValido);
        await r.clave.fill(reg.claveValida);
        await r.confirmar.fill(reg.claveValida);
        await r.continuar();
        await expect(r.textoParcial(reg.mensajes.camposObligatorios)).toBeVisible();
        await expect(r.preguntaRol).toHaveCount(0);
        await evidencia(info, page, 'nombre-vacio');
      });
    });

    test('CP-02.4 El registro no continúa mientras haya datos inválidos (correo "abc@")', anotar('HU-02', 'CA-04'), async ({ paginas, page }, info) => {
      const r = paginas.registro;
      await r.llenar({ nombre: reg.nombre, correo: reg.correoCP024, clave: reg.claveValida, confirmar: reg.claveValida });
      await r.continuar();
      await evidencia(info, page, 'correo-abc-arroba');
      await expect(r.preguntaRol, 'No se debe avanzar de pantalla con un correo inválido').toHaveCount(0);
      await expect(r.nombre, 'Se debe permanecer en el formulario de registro').toBeVisible();
    });

    test('CP-03.1 La selección de rol muestra exactamente las opciones Cliente y Profesional', anotar('HU-03', 'CA-01'), async ({ paginas, page }, info) => {
      const r = paginas.registro;
      await r.llenar({ nombre: reg.nombre, correo: reg.correoValido, clave: reg.claveValida, confirmar: reg.claveValida });
      await r.continuar();
      await expect(r.preguntaRol).toBeVisible();
      await expect(r.textoParcial(reg.subtituloRol)).toBeVisible();
      await expect(r.opcionCliente).toBeVisible();
      await expect(r.opcionProfesional).toBeVisible();
      // "Exactamente dos": cada opción trae su descripción y no hay ninguna otra.
      await expect(r.textoParcial(/^(Busco|Ofrezco) servicios/)).toHaveCount(2);
      await expect(r.textoParcial(reg.opcionesRol.cliente)).toBeVisible();
      await expect(r.textoParcial(reg.opcionesRol.profesional)).toBeVisible();
      await evidencia(info, page, 'seleccion-de-rol');
    });
  });
});

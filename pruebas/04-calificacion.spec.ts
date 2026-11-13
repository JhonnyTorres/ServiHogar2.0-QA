import { test, expect, datos, evidencia } from '../fixtures';

/**
 * Módulo Calificación de servicios. Cada prueba parte de un servicio recién finalizado y sin calificar
 * (fixture servicioFinalizado), de modo que no depende de otras pruebas ni de datos anteriores.
 */
const cal = datos.calificacion;
const anotar = (hu: string, ca: string) => ({
  tag: '@con-cuenta',
  annotation: [
    { type: 'HU', description: hu },
    { type: 'CA', description: ca },
  ],
});

test.describe('Calificación de servicios', () => {
  test('CP-27.2 La puntuación va de 1 a 5 estrellas: con 0 no se envía; 1 y 5 se aceptan (valor límite)', anotar('HU-27', 'CA-02'), async ({ nuevaSesion, servicioFinalizado }, info) => {
    void servicioFinalizado;
    const cli = await nuevaSesion('cliente');
    const c = cli.cliente;
    await c.abrirCalificar();

    await test.step('0 estrellas: el botón Enviar está deshabilitado', async () => {
      await expect(cli.app.deshabilitado(c.botonEnviarCalificacion)).toHaveAttribute('aria-disabled', 'true');
      await evidencia(info, cli.page, 'cero-estrellas');
    });
    await test.step('1 estrella: se habilita', async () => {
      await c.estrella(cal.estrellasLimite.minimo).click();
      await expect(c.botonEnviarCalificacion).toBeVisible();
      await expect(cli.app.deshabilitado(c.botonEnviarCalificacion), 'Enviar ya no debe estar deshabilitado').toHaveCount(0); // habilitado: el atributo desaparece
      await evidencia(info, cli.page, 'una-estrella');
    });
    await test.step('5 estrellas: se habilita y se envía', async () => {
      await c.estrella(cal.estrellasLimite.maximo).click();
      await expect(c.botonEnviarCalificacion).toBeVisible();
      await expect(cli.app.deshabilitado(c.botonEnviarCalificacion), 'Enviar ya no debe estar deshabilitado').toHaveCount(0); // habilitado: el atributo desaparece
      await c.botonEnviarCalificacion.click();
      await expect(cli.app.alertaTitulo).toHaveText(cal.mensajeGracias);
      await evidencia(info, cli.page, 'cinco-estrellas-enviado');
    });
  });

  test('CP-27.4 El comentario admite hasta 300 caracteres (valor límite 299, 300 y 301)', anotar('HU-27', 'CA-04'), async ({ nuevaSesion, servicioFinalizado }, info) => {
    void servicioFinalizado;
    const cli = await nuevaSesion('cliente');
    const c = cli.cliente;
    await c.abrirCalificar();
    const texto = (n: number) => 'a'.repeat(n);
    const contador = (n: number) => new RegExp(`^${n} / ${cal.limiteComentario}$`);

    await test.step('299 caracteres: se aceptan', async () => {
      await c.campoComentario.fill(texto(cal.comentario299));
      await expect(c.contadorComentario).toHaveText(contador(cal.comentario299));
    });
    await test.step('300 caracteres: se aceptan', async () => {
      await c.campoComentario.fill(texto(cal.comentario300));
      await expect(c.contadorComentario).toHaveText(contador(cal.comentario300));
      await evidencia(info, cli.page, 'comentario-300');
    });
    await test.step('301 caracteres: el carácter extra no se acepta', async () => {
      await c.campoComentario.pressSequentially('b'); // el usuario intenta escribir el carácter 301
      await expect(c.contadorComentario).toHaveText(contador(cal.limiteComentario));
      await expect(c.campoComentario).toHaveValue(texto(cal.comentario300));
      await evidencia(info, cli.page, 'comentario-301-rechazado');
    });
  });
});

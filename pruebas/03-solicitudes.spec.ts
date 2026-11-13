import { test, expect, datos, cred, evidencia } from '../fixtures';

/**
 * Módulo Solicitudes de servicio: solicitar, evitar duplicados, aceptar, rechazar y finalizar.
 * Cada prueba prepara SUS propios datos con fixtures (solicitudPendiente, servicioEnProceso...)
 * y deja al profesional sin solicitudes activas al terminar: se puede ejecutar sola y en cualquier orden.
 */
const sv = datos.servicio;
const anotar = (hu: string, ca: string) => ({
  tag: '@con-cuenta',
  annotation: [
    { type: 'HU', description: hu },
    { type: 'CA', description: ca },
  ],
});

const datosSolicitud = (descripcion: string) => ({
  categoria: cred.categoria,
  profesional: cred.profesionalNombre,
  descripcion,
  presupuesto: sv.presupuesto,
});

test.describe('Solicitudes de servicio', () => {
  test('CP-18.4 La solicitud queda inicialmente en estado Pendiente (cliente y profesional la ven así)', anotar('HU-18', 'CA-04'), async ({ nuevaSesion, solicitudPendiente }, info) => {
    const cli = await nuevaSesion('cliente');
    await cli.cliente.abrirMisServicios();
    await cli.cliente.filtro('Pendiente');
    await expect(cli.app.textoParcial(cred.profesionalNombre).first()).toBeVisible();
    await expect(cli.app.texto('Pendiente').first()).toBeVisible();
    await evidencia(info, cli.page, 'cliente-ve-pendiente');

    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await expect(pro.app.textoParcial(solicitudPendiente.descripcion)).toBeVisible();
    expect(await pro.profesional.conteoFiltro('Pendientes')).toBe(1);
    expect(await pro.profesional.conteoFiltro('En proceso')).toBe(0);
    await evidencia(info, pro.page, 'profesional-ve-pendiente');
  });

  test('CP-19.1 Con una solicitud pendiente no se crea otra y se informa (Solicitud existente)', anotar('HU-19', 'CA-01'), async ({ nuevaSesion, solicitudPendiente }, info) => {
    const cli = await nuevaSesion('cliente');
    await cli.cliente.abrirMisServicios();
    const antes = await cli.cliente.totalServicios();

    await cli.cliente.solicitar(datosSolicitud(`${solicitudPendiente.descripcion} (intento repetido)`));
    await expect(cli.cliente.alertaTitulo).toHaveText(sv.mensajes.solicitudExistente);
    await expect(cli.cliente.alertaMensaje).toContainText(sv.mensajes.solicitudExistenteDetalle);
    await evidencia(info, cli.page, 'solicitud-existente-pendiente');
    await cli.cliente.cerrarAlerta('OK');

    await cli.cliente.abrirMisServicios();
    expect(await cli.cliente.totalServicios(), 'No debe haberse creado otra solicitud').toBe(antes);
  });

  test('CP-19.2 Con una solicitud en proceso tampoco se crea otra y se informa', anotar('HU-19', 'CA-02'), async ({ nuevaSesion, servicioEnProceso }, info) => {
    const cli = await nuevaSesion('cliente');
    await cli.cliente.abrirMisServicios();
    const antes = await cli.cliente.totalServicios();

    await cli.cliente.solicitar(datosSolicitud(`${servicioEnProceso.descripcion} (intento repetido)`));
    await expect(cli.cliente.alertaTitulo).toHaveText(sv.mensajes.solicitudExistente);
    await expect(cli.cliente.alertaMensaje).toContainText(sv.mensajes.solicitudExistenteDetalle);
    await evidencia(info, cli.page, 'solicitud-existente-en-proceso');
    await cli.cliente.cerrarAlerta('OK');

    await cli.cliente.abrirMisServicios();
    expect(await cli.cliente.totalServicios(), 'No debe haberse creado otra solicitud').toBe(antes);
  });

  test('CP-25.1 El profesional tiene la opción Aceptar en una solicitud pendiente', anotar('HU-25', 'CA-01'), async ({ nuevaSesion, solicitudPendiente }, info) => {
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await expect(pro.app.textoParcial(solicitudPendiente.descripcion)).toBeVisible();
    await expect(pro.profesional.botonAceptar).toBeVisible();
    await evidencia(info, pro.page, 'boton-aceptar');
  });

  test('CP-25.2 El profesional tiene la opción Rechazar en una solicitud pendiente', anotar('HU-25', 'CA-02'), async ({ nuevaSesion, solicitudPendiente }, info) => {
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await expect(pro.app.textoParcial(solicitudPendiente.descripcion)).toBeVisible();
    await expect(pro.profesional.botonRechazar).toBeVisible();
    await evidencia(info, pro.page, 'boton-rechazar');
  });

  test('CP-25.4 Aceptar (con valor cotizado) cambia el estado a En proceso', anotar('HU-25', 'CA-04'), async ({ nuevaSesion, solicitudPendiente }, info) => {
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    expect(await pro.profesional.conteoFiltro('En proceso')).toBe(0);

    await pro.profesional.aceptar(sv.montoCotizado);
    await pro.profesional.filtro('En proceso');
    await expect(pro.app.textoParcial(solicitudPendiente.descripcion)).toBeVisible();
    await expect(pro.profesional.botonFinalizar).toBeVisible();
    await expect.poll(() => pro.profesional.conteoFiltro('En proceso')).toBe(1);
    await expect.poll(() => pro.profesional.conteoFiltro('Pendientes')).toBe(0);
    await evidencia(info, pro.page, 'profesional-en-proceso');

    const cli = await nuevaSesion('cliente');
    await cli.cliente.abrirMisServicios();
    await cli.cliente.filtro('En proceso');
    await expect(cli.app.textoParcial(cred.profesionalNombre).first()).toBeVisible();
    await evidencia(info, cli.page, 'cliente-ve-en-proceso');
  });

  test('CP-25.5 Rechazar (con motivo) cambia el estado a Rechazado y el cliente ve el motivo', anotar('HU-25', 'CA-05'), async ({ nuevaSesion, solicitudPendiente }, info) => {
    const motivo = `${sv.motivoRechazo} ${Date.now()}`;
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await pro.profesional.rechazar(motivo);
    await expect.poll(() => pro.profesional.conteoFiltro('Pendientes')).toBe(0);
    await pro.profesional.filtro('Rechazados');
    await expect(pro.app.textoParcial(motivo).first()).toBeVisible();
    await evidencia(info, pro.page, 'profesional-rechazado');

    const cli = await nuevaSesion('cliente');
    await cli.cliente.abrirMisServicios();
    await cli.cliente.filtro('Rechazado');
    await expect(cli.app.textoParcial(motivo).first()).toBeVisible();
    await evidencia(info, cli.page, 'cliente-ve-motivo');
    void solicitudPendiente;
  });

  test('CP-26.1 "Marcar como finalizado" aparece solo en el servicio en proceso, no en el pendiente', anotar('HU-26', 'CA-01'), async ({ nuevaSesion, solicitudPendiente }, info) => {
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await expect(pro.app.textoParcial(solicitudPendiente.descripcion)).toBeVisible();
    await expect(pro.profesional.botonFinalizar, 'En una solicitud pendiente no debe existir Finalizar').toHaveCount(0);
    await evidencia(info, pro.page, 'pendiente-sin-finalizar');

    await pro.profesional.aceptar(sv.montoCotizado);
    await pro.profesional.filtro('En proceso');
    await expect(pro.profesional.botonFinalizar).toBeVisible();
    await evidencia(info, pro.page, 'en-proceso-con-finalizar');
  });

  test('CP-26.3 Finalizar cambia el estado a Finalizado y el servicio sale de En proceso', anotar('HU-26', 'CA-03'), async ({ nuevaSesion, servicioEnProceso }, info) => {
    const pro = await nuevaSesion('profesional');
    await pro.profesional.abrir();
    await pro.profesional.filtro('En proceso');
    await expect(pro.app.textoParcial(servicioEnProceso.descripcion)).toBeVisible();
    // El conteo se lee con la lista ya cargada (antes de eso los chips pueden mostrar 0).
    const antes = await pro.profesional.conteoFiltro('Finalizados');

    await pro.profesional.finalizar(sv.montoCotizado);
    await expect(pro.profesional.botonFinalizar).toHaveCount(0);
    await expect.poll(() => pro.profesional.conteoFiltro('En proceso')).toBe(0);
    await expect.poll(() => pro.profesional.conteoFiltro('Finalizados')).toBe(antes + 1);
    await pro.profesional.filtro('Finalizados');
    await expect(pro.app.textoParcial(servicioEnProceso.descripcion)).toBeVisible();
    await evidencia(info, pro.page, 'profesional-finalizado');

    const cli = await nuevaSesion('cliente');
    await cli.cliente.abrirMisServicios();
    await cli.cliente.filtro('Finalizado');
    await expect(cli.app.textoParcial(cred.profesionalNombre).first()).toBeVisible();
    await evidencia(info, cli.page, 'cliente-ve-finalizado');
  });
});

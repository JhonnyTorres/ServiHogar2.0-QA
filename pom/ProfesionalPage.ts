import { expect, Locator } from '@playwright/test';
import { AppPage } from './AppPage';

/** Pestaña "Solicitudes" del profesional. */
export class ProfesionalPage extends AppPage {
  get botonAceptar(): Locator {
    return this.texto('Aceptar');
  }
  get botonRechazar(): Locator {
    return this.texto('Rechazar');
  }
  get botonFinalizar(): Locator {
    return this.texto('Marcar como finalizado');
  }
  /** Campo de valor de la ventana de cotización/factura. */
  get campoValor(): Locator {
    return this.campo('Ej: 80000').first();
  }
  get campoMotivo(): Locator {
    return this.campo(/Explica brevemente/);
  }

  /** Abre Solicitudes y espera a que la lista termine de cargar (mientras carga solo hay un spinner). */
  async abrir(): Promise<void> {
    await this.pestana('Solicitudes').click();
    await expect(this.page.getByText(/\d+ en total/).first()).toBeVisible({ timeout: 20_000 });
  }

  async filtro(nombre: 'Pendientes' | 'En proceso' | 'Finalizados' | 'Rechazados'): Promise<void> {
    await this.tocar(this.chipFiltro(nombre));
  }

  /** Número que la app agrega al chip de filtro ("En proceso (2)" → 2; sin número → 0). */
  async conteoFiltro(nombre: 'Pendientes' | 'En proceso' | 'Finalizados' | 'Rechazados'): Promise<number> {
    // Se lee el chip que el usuario ve (no una copia tapada de otra pantalla apilada).
    const texto = (await (await this.tocable(this.chipFiltro(nombre))).textContent()) ?? '';
    const m = texto.match(/\((\d+)\)/);
    return m ? Number(m[1]) : 0;
  }

  async aceptar(valor: string): Promise<void> {
    await this.tocar(this.botonAceptar);
    await expect(this.textoParcial('Valor del servicio (COP)')).toBeVisible();
    await this.campoValor.fill(valor);
    await this.tocar(this.texto('Continuar'));
    await expect(this.campoValor).toBeHidden();
  }

  async rechazar(motivo: string): Promise<void> {
    await this.tocar(this.botonRechazar);
    await expect(this.textoParcial('Rechazar solicitud')).toBeVisible();
    await this.campoMotivo.fill(motivo);
    await this.tocar(this.texto('Rechazar y enviar'));
    await expect(this.campoMotivo).toBeHidden();
  }

  async finalizar(valor: string): Promise<void> {
    await this.tocar(this.botonFinalizar);
    await expect(this.campoValor).toBeVisible();
    await this.campoValor.fill(valor);
    await this.tocar(this.texto('Continuar'));
    await expect(this.campoValor).toBeHidden();
  }

  /**
   * Deja al profesional sin solicitudes activas: rechaza las pendientes y finaliza las que están en proceso.
   * Se espera por el estado de la pantalla (cantidad de botones), nunca por tiempo fijo.
   */
  async limpiarActivas(valor: string, motivo: string): Promise<void> {
    await this.abrir();
    await this.filtro('Pendientes');
    for (let n = await this.botonRechazar.count(); n > 0; n = await this.botonRechazar.count()) {
      await this.rechazar(motivo);
      await expect(this.botonRechazar).toHaveCount(n - 1);
    }
    await this.filtro('En proceso');
    for (let n = await this.botonFinalizar.count(); n > 0; n = await this.botonFinalizar.count()) {
      await this.finalizar(valor);
      await expect(this.botonFinalizar).toHaveCount(n - 1);
    }
  }
}

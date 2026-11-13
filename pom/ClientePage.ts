import { expect, Locator } from '@playwright/test';
import { AppPage } from './AppPage';

/** Pestañas Buscar y Mis servicios del cliente. */
export class ClientePage extends AppPage {
  // ── Solicitar ──
  async solicitar(o: { categoria: string; profesional: string; descripcion: string; presupuesto: string }): Promise<void> {
    await this.pestana('Buscar').click();
    await this.tocar(this.texto(o.categoria));
    await expect(this.textoParcial(o.profesional).first()).toBeVisible({ timeout: 20_000 });
    await this.tocar(this.texto('Solicitar servicio'));
    await this.campo(/Describe el trabajo/).fill(o.descripcion);
    await this.campo('Ej: 80000').first().fill(o.presupuesto);
    await this.tocar(this.texto('Enviar solicitud'));
  }

  // ── Mis servicios ──
  async abrirMisServicios(): Promise<void> {
    await this.pestana('Mis servicios').click();
    await expect(this.page.getByText(/\d+ en total/).first()).toBeVisible({ timeout: 20_000 });
  }

  async filtro(nombre: 'Todos' | 'Pendiente' | 'En proceso' | 'Finalizado' | 'Rechazado'): Promise<void> {
    await this.tocar(this.chipFiltro(nombre));
  }

  /** Cantidad de servicios que muestra el encabezado ("N en total"). */
  async totalServicios(): Promise<number> {
    const t = await this.page.getByText(/\d+ en total/).first().textContent();
    return Number(t!.match(/(\d+)/)![1]);
  }

  // ── Calificar ──
  get botonCalificar(): Locator {
    return this.texto('Calificar servicio');
  }
  get botonEnviarCalificacion(): Locator {
    return this.texto('Enviar').first();
  }
  /** Ventana "Calificar servicio": el contenedor más interno que tiene el botón Enviar y el campo de comentario. */
  get ventanaCalificar(): Locator {
    return this.page.locator('div').filter({ has: this.texto('Enviar') }).filter({ hasText: 'Comentario (opcional)' }).last();
  }
  get campoComentario(): Locator {
    return this.campo('¿Cómo fue tu experiencia?');
  }
  get contadorComentario(): Locator {
    return this.ventanaCalificar.getByText(/^\d+ \/ \d+$/);
  }
  /** Estrella n (1 a 5) de la ventana. Usa el testID que añade `npm run parche-web` (estrella-1 ... estrella-5). */
  estrella(n: number): Locator {
    return this.page.getByTestId(`estrella-${n}`).filter({ visible: true }).first();
  }

  async abrirCalificar(): Promise<void> {
    await this.abrirMisServicios();
    await this.filtro('Finalizado');
    await this.tocar(this.botonCalificar);
    await expect(this.botonEnviarCalificacion).toBeVisible();
  }
}

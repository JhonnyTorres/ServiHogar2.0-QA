import { expect, Locator } from '@playwright/test';
import { AppPage } from './AppPage';

export type DatosRegistro = { nombre: string; correo: string; clave: string; confirmar: string };

export class RegistroPage extends AppPage {
  get nombre(): Locator {
    return this.campo('Nombre completo');
  }
  get correo(): Locator {
    return this.campo('Correo electrónico');
  }
  get clave(): Locator {
    return this.campo('Contraseña', true);
  }
  get confirmar(): Locator {
    return this.campo('Confirmar contraseña');
  }
  get botonContinuar(): Locator {
    return this.texto('Continuar →');
  }
  /** Pantalla "¿Cómo usarás la app?" (selección de rol). */
  get preguntaRol(): Locator {
    return this.textoParcial('¿Cómo usarás la app?');
  }

  async esperarFormulario(): Promise<void> {
    await expect(this.nombre).toBeVisible();
  }

  async llenar(d: DatosRegistro): Promise<void> {
    await this.nombre.fill(d.nombre);
    await this.correo.fill(d.correo);
    await this.clave.fill(d.clave);
    await this.confirmar.fill(d.confirmar);
  }

  async continuar(): Promise<void> {
    await this.botonContinuar.click();
  }

  async volverDeSeleccionRol(): Promise<void> {
    await this.texto('Volver').click();
    await this.esperarFormulario();
  }

  /** Opciones de la pantalla de selección de rol. */
  get opcionCliente(): Locator {
    return this.texto('Cliente');
  }
  get opcionProfesional(): Locator {
    return this.texto('Profesional');
  }
}

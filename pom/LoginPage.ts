import { expect, Locator } from '@playwright/test';
import { AppPage } from './AppPage';

export class LoginPage extends AppPage {
  get correo(): Locator {
    return this.campo('Correo electrónico');
  }
  get clave(): Locator {
    return this.campo('Contraseña', true);
  }
  /** "Iniciar sesión" aparece como título y como botón: el botón es el último. */
  get botonIniciar(): Locator {
    return this.texto('Iniciar sesión').last();
  }

  async abrir(): Promise<void> {
    await this.page.goto('/');
    await expect(this.correo).toBeVisible({ timeout: 30_000 });
  }

  async enviar(correo: string, clave: string): Promise<void> {
    if (correo) await this.correo.fill(correo);
    if (clave) await this.clave.fill(clave);
    await this.botonIniciar.click();
  }

  /** Inicia sesión y espera a que termine la bienvenida y aparezca la barra de pestañas. */
  async iniciarSesion(correo: string, clave: string): Promise<void> {
    await this.abrir();
    await this.enviar(correo, clave);
    await expect(this.pestana('Ajustes')).toBeVisible({ timeout: 30_000 });
  }

  async irARegistro(): Promise<void> {
    await this.texto('Regístrate').click();
  }
}

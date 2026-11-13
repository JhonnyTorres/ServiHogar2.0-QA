import { expect, Locator, Page } from '@playwright/test';

/**
 * Base de todos los Page Objects.
 *
 * Nota técnica: en la versión web, React Navigation deja montadas (y apiladas) las pantallas ya
 * visitadas. Por eso todos los localizadores se limitan a lo VISIBLE y `tocar()` hace clic solo en
 * la copia que el usuario realmente puede tocar (la que no está tapada por otra pantalla).
 */
export class AppPage {
  constructor(readonly page: Page) {}

  protected visibles(l: Locator): Locator {
    return l.filter({ visible: true });
  }

  /** Texto exacto visible. */
  texto(t: string): Locator {
    return this.visibles(this.page.getByText(t, { exact: true }));
  }

  /** Texto parcial o expresión regular visible. */
  textoParcial(t: string | RegExp): Locator {
    return this.visibles(this.page.getByText(t));
  }

  /** Campo de texto por su placeholder. */
  campo(placeholder: string | RegExp, exacto = false): Locator {
    return this.visibles(this.page.getByPlaceholder(placeholder, { exact: exacto }));
  }

  /** Pestaña de la barra inferior (rol "tab"). */
  pestana(nombre: string): Locator {
    return this.visibles(this.page.getByRole('tab', { name: nombre })).first();
  }

  /** Chip de filtro: la app añade el conteo al texto ("En proceso (1)"), se acepta con o sin él (sin conteo queda un espacio al final). */
  chipFiltro(nombre: string): Locator {
    return this.visibles(this.page.getByText(new RegExp(`^${nombre}\\s*(\\(\\d+\\))?\\s*$`)));
  }

  // ── Alertas (se ven en el DOM gracias al parche web: web-stubs/Alert.js) ──
  get alertaTitulo(): Locator {
    return this.page.getByTestId('rn-alert-title');
  }
  get alertaMensaje(): Locator {
    return this.page.getByTestId('rn-alert-message');
  }
  async cerrarAlerta(boton = 'OK'): Promise<void> {
    await this.page.getByTestId('rn-alert-btn').filter({ hasText: boton }).first().click();
  }

  /** ¿Está deshabilitado el botón que contiene este texto? (el estado lo lleva el contenedor) */
  deshabilitado(boton: Locator): Locator {
    return boton.locator('xpath=ancestor-or-self::*[@aria-disabled][1]');
  }

  /**
   * Toca la primera coincidencia realmente tocable: hace scroll hasta ella y comprueba con
   * `elementFromPoint` que no la tapa otra pantalla. Reintenta (sin esperas fijas) hasta que exista.
   */
  async tocable(loc: Locator): Promise<Locator> {
    const indices = () =>
      loc.evaluateAll((els) =>
        els
          .map((e, i) => {
            const r = e.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return -1;
            e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            const r2 = e.getBoundingClientRect();
            const t = document.elementFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2);
            return t && (t === e || e.contains(t)) ? i : -1;
          })
          .filter((i) => i >= 0)
      );
    await expect
      .poll(async () => (await indices()).length, {
        timeout: 20_000,
        message: 'No hay un elemento tocable (¿lo tapa otra pantalla o no existe?)',
      })
      .toBeGreaterThan(0);
    return loc.nth((await indices())[0]);
  }

  async tocar(loc: Locator): Promise<void> {
    await (await this.tocable(loc)).click();
  }

  /**
   * Cierra sola la alerta "Documento no generado". Al aceptar o finalizar un servicio la app intenta
   * crear un PDF con expo-print, que no existe en el navegador. El PDF no es objeto de estas pruebas.
   */
  ignorarAvisoPdf(): Promise<void> {
    return this.page.addLocatorHandler(
      this.page.getByTestId('rn-alert-title').filter({ hasText: 'Documento no generado' }),
      async () => {
        await this.page.getByTestId('rn-alert-btn').first().click();
      }
    );
  }
}

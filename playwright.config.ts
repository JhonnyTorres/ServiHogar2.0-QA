import { defineConfig } from '@playwright/test';
import 'dotenv/config'; // lee las cuentas de prueba de un archivo .env (ver .env.example)

/**
 * Configuración de las pruebas de ServiHogar 2.0.
 *
 * - Sin BASE_URL: Playwright levanta la app con `npx expo start --web` en APP_DIR
 *   (por defecto la carpeta superior, es decir, esta carpeta debe vivir dentro del repo de la app).
 * - Con BASE_URL: usa una app que ya está corriendo (no levanta nada).
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';

export default defineConfig({
  testDir: './pruebas',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reporte/html', open: 'never' }],
    ['json', { outputFile: 'reporte/resultados.json' }],
  ],
  outputDir: 'reporte/evidencias',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 420, height: 860 }, // tamaño de teléfono
    screenshot: 'only-on-failure', // además, cada prueba adjunta capturas de sus pasos con evidencia()
    video: process.env.PW_VIDEO ? 'on' : 'retain-on-failure', // PW_VIDEO=1 graba TODAS las pruebas (video de una ejecución completa)
    trace: 'retain-on-failure', // traza navegable solo si falla
    channel: process.env.PW_CHANNEL || undefined, // p. ej. PW_CHANNEL=chrome para usar Chrome instalado
    launchOptions: {
      args: process.env.PW_NO_SANDBOX ? ['--no-sandbox'] : [],
      executablePath: process.env.PW_CHROMIUM || undefined, // ruta de un Chromium ya instalado (opcional)
    },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npx expo start --web --port 8081',
        cwd: process.env.APP_DIR || '..',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 300_000,
      },
});

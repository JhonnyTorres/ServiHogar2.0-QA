# Pruebas automatizadas de ServiHogar 2.0 (Playwright)

Automatización de **22 casos del plan de pruebas corregido** de ServiHogar 2.0
(Verificación y validación de software). Herramienta: **Playwright** (TypeScript).

- Plan corregido y tabla de cambios: `Plan_de_pruebas_ServiHogar2_completo.docx` (sección 14).
- Casos automatizados con sus datos y resultados esperados: `docs/casos-automatizados.json`.
- Datos de prueba, separados del código: `datos/datos.json`.
- Matriz de trazabilidad (se genera tras ejecutar): `reporte/MATRIZ_TRAZABILIDAD.md`.

## 1. Qué se prueba y cómo

Playwright controla navegadores, no la app nativa. Por eso las pruebas se ejecutan sobre la **versión web
de la misma aplicación** (`expo start --web`, mismo código React Native). Lo que no se puede automatizar
por esta vía (SQLite sin conexión, notificaciones push, cámara/galería, PDF) queda como prueba manual en dispositivo.

Para abrir la app en el navegador hace falta un parche pequeño que **no cambia Android ni iOS**
(`npm run parche-web`):

| Cambio | Por qué |
|---|---|
| `firebaseService.js`: en web usa `getAuth()` | `getReactNativePersistence` no existe en Firebase Auth para web |
| `metro.config.js` + `web-stubs/expo-sqlite.js` | `expo-sqlite` no funciona en el navegador; se simula una base vacía |
| `web-stubs/Alert.js` | `Alert.alert` no hace nada en web; así las alertas se ven en el DOM y se pueden verificar |
| `ClientServicesScreen.js`: `testID` en las estrellas | selector estable para el caso CP-27.2 |

Cada cambio deja una copia `.orig` del archivo original.

## 2. Requisitos

- Node.js 20 o superior y npm.
- El repositorio de la app a probar (ver la sección 3) con su archivo `.env` de Firebase (`EXPO_PUBLIC_FIREBASE_*`) y sus dependencias instaladas.
- Dos cuentas de prueba en Firebase con el **correo ya verificado** (la verificación por correo no se automatiza):
  un **cliente** y un **profesional** (con la categoría Electricidad y un nombre reconocible).
  Usa un proyecto de pruebas, no producción.

## 3. Obtener la app a probar

Este repositorio solo contiene las pruebas. La app es otro repositorio:
**https://github.com/JhonnyTorres/ServiHogar2.0**

```bash

git clone https://github.com/JhonnyTorres/ServiHogar2.0.git
cd ServiHogar2.0
git checkout 774250b      # commit sobre el que se ejecutaron las pruebas del informe
npm install
```

- La app necesita su archivo `.env` con las variables `EXPO_PUBLIC_FIREBASE_*` de un proyecto de Firebase de pruebas.
  Ese archivo no está en GitHub: [se entrega al docente por separado].
- Las cuentas de prueba (un cliente y un profesional con el correo ya verificado) también se entregan por separado.
  Sus datos van en el `.env` de este repositorio (sección 4).

## 4. Instalación desde cero

```bash
# 1. Clonar ESTE repositorio de pruebas, por ejemplo en C:\movil-2\qa

git clone https://github.com/JhonnyTorres/ServiHogar2.0-QA.git qa
cd qa

# 2. Dependencias y navegador de pruebas
npm install
npx playwright install chromium

# 3. Parche web sobre la app clonada en la sección 3 (ajusta la ruta)
node aplicar-parche-web.mjs C:\movil-2\ServiHogar2.0

# 4. Cuentas de prueba: copia .env.example como .env y complétalo
copy .env.example .env
```

El archivo `.env` (no se sube a GitHub) lleva:

```
APP_DIR=C:\movil-2\ServiHogar2.0
QA_CLIENTE_EMAIL=...        QA_CLIENTE_PASS=...
QA_PRO_EMAIL=...            QA_PRO_PASS=...
QA_PRO_NOMBRE=Jonathan Montoya      # tal como aparece en la pestaña Buscar
QA_PRO_CATEGORIA=Electricidad
```

Comprobación opcional: en la carpeta de la app, `npx expo start --web` debe mostrar la pantalla de login.

## 5. Ejecutar

```bash
npm test                  # los 22 casos (levanta la app sola en el puerto 8081)
npm run test:sin-cuenta   # CP de registro y login: no necesitan cuentas (no incluye CP-04.4)
npm run test:con-cuenta   # CP con sesión: necesitan las cuentas de prueba
npm run test:video        # todo, grabando video de TODAS las pruebas
npx playwright test -g "CP-02.2"    # un solo caso por su ID
npm run reporte:html      # abre el reporte de Playwright (resultado de cada prueba, capturas, videos, trazas)
npm run reporte:matriz    # genera reporte/MATRIZ_TRAZABILIDAD.md
```

Si la app ya está corriendo: `BASE_URL=http://localhost:8081 npm test` (PowerShell: `$env:BASE_URL='http://localhost:8081'`).

Duración aproximada de la suite completa: 8 a 12 minutos (cada caso con sesión prepara sus propios datos).

## 6. Estructura

```
pruebas/      Scripts. Cada test lleva el ID del caso del plan: "CP-02.2 Contraseña mínima de 6 caracteres..."
pom/          Page Objects (Login, Registro, Cliente, Profesional) sobre una base común AppPage
fixtures/     Datos de prueba y preparación de escenarios (solicitud pendiente, servicio en proceso, finalizado)
datos/        datos.json: valores de entrada y mensajes esperados, iguales a los del plan
docs/         Plan corregido, tabla de cambios y casos automatizados
scripts/      Generador de la matriz de trazabilidad
reporte/      Resultados de la ejecución (se genera)
```

- **Independencia:** ningún caso depende de otro. Los que necesitan un servicio en cierto estado lo preparan con fixtures
  (limpian al profesional, crean la solicitud y la llevan al estado requerido) y lo dejan limpio al terminar.
  Se pueden ejecutar solos y en cualquier orden.
- **Sin esperas fijas:** no hay `sleep` ni `waitForTimeout`; todas las esperas son por el estado de la pantalla.
- **Selectores:** por rol, texto visible, placeholder y `data-testid` (estrellas).
- **Aserciones:** cada script verifica el mensaje exacto, el estado de pantalla o el conteo del caso.

## 7. Casos automatizados

| Módulo | Casos |
|---|---|
| Registro y login (sin cuenta) | CP-04.1, CP-02.1, CP-02.2 (límite 5/6/7), CP-02.3, CP-02.4, CP-03.1 |
| Acceso con cuenta | CP-04.3, CP-04.4, CP-10.1, CP-10.2, CP-06.3 |
| Solicitudes de servicio | CP-18.4, CP-19.1, CP-19.2, CP-25.1, CP-25.2, CP-25.4, CP-25.5, CP-26.1, CP-26.3 |
| Calificación | CP-27.2 (límite 0/1/5), CP-27.4 (límite 299/300/301) |

Valores límite: CP-02.2, CP-27.2 y CP-27.4. Negativos: CP-02.1 a CP-02.4, CP-04.4, CP-19.1, CP-19.2.
Los casos CP-02.1 y CP-02.4 **fallan a propósito del defecto real** de la app (el registro acepta correos inválidos).

## 8. Si algo falla

1. Abre la traza: `npx playwright show-trace reporte/evidencias/<carpeta>/trace.zip` (o la traza `sesion-N-trace` adjunta en el reporte HTML).
2. Revisa en el reporte HTML la captura, el video y el paso que falló.
3. Si el texto de la app cambió, actualiza `datos/datos.json`.

Problemas frecuentes:

| Síntoma | Solución |
|---|---|
| Expo pide instalar TypeScript | Esta carpeta debe estar **fuera** del repo de la app; usa `APP_DIR` |
| `Solicitud existente` en un caso | No debería ocurrir (los fixtures limpian), pero si pasa, entra como profesional y rechaza o finaliza lo pendiente |
| Las estrellas no se encuentran | Corre de nuevo `node aplicar-parche-web.mjs <ruta de la app>` |
| Las pruebas con cuenta se omiten | Faltan las variables del `.env` |

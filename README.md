# Pruebas automatizadas de ServiHogar 2.0 (Playwright)

Suite de 20 pruebas (T01–T20) para la entrega de Verificación y validación de software.
Genera reporte HTML, capturas de cada prueba, y video + traza de las que fallan (evidencia de bugs).

## 1. Qué se prueba y cómo

Playwright prueba **navegadores**, así que la app se ejecuta en su versión web (`expo start --web`).
Para eso hay que aplicar un parche pequeño y reversible que **no cambia Android/iOS**:

| Cambio | Por qué |
|---|---|
| `firebaseService.js`: en web usa `getAuth()` | `getReactNativePersistence` no existe en Firebase Auth web; sin esto la app no abre en el navegador |
| `metro.config.js` + `web-stubs/expo-sqlite.js` | `expo-sqlite` en web falla (`SharedArrayBuffer`/worker). Se simula una base vacía |
| `web-stubs/Alert.js` | `Alert.alert` de react-native-web no hace nada; así las alertas se ven en el DOM y se pueden verificar |

**Límites que debes declarar en el informe:** el caché SQLite/offline, las notificaciones push, la cámara/galería y el PDF (`expo-print`) **no** se prueban aquí; se prueban en el dispositivo.

## 2. Instalación (una sola vez)

1. Copia esta carpeta **dentro del repo de la app**, junto a `App.js` (queda `ServiHogar2.0/qa/`).
2. Aplica el parche a la app:
   ```bash
   cd qa
   npm install
   npx playwright install chromium
   npm run parche-web
   ```
   El script deja una copia `firebaseService.js.orig`. Para deshacer: borra `metro.config.js` y `web-stubs/`, y restaura ese archivo.
3. Comprueba que la app abre en el navegador: `cd ..` y `npx expo start --web`. Debes ver el login.
   (Necesitas tu `.env` con las claves `EXPO_PUBLIC_FIREBASE_*`, como siempre.)

## 3. Usuarios de prueba (para las pruebas T11–T20)

Crea **en Firebase** dos cuentas con el **correo ya verificado** (la verificación por email no se puede automatizar) y, de preferencia, en un proyecto de pruebas, no en el de producción:

- un **cliente**,
- un **profesional** con al menos una categoría (p. ej. Electricidad) y un nombre reconocible.

Pon las variables antes de correr (PowerShell):

```powershell
$env:QA_CLIENTE_EMAIL="cliente.qa@ejemplo.com"; $env:QA_CLIENTE_PASS="..."
$env:QA_PRO_EMAIL="pro.qa@ejemplo.com";        $env:QA_PRO_PASS="..."
$env:QA_PRO_NOMBRE="Nombre del profesional tal como sale en Buscar"
$env:QA_PRO_CATEGORIA="Electricidad"
```

(En Linux/macOS: `export QA_CLIENTE_EMAIL=...`.) Si no defines las variables, las pruebas con login se **omiten**, no fallan.

## 4. Ejecutar

```bash
npm test                 # todas (levanta la app sola en :8081)
npm run test:sin-login   # solo T01–T10 (no necesitan Firebase)
npm run reporte:html     # abre el reporte HTML con capturas, videos y trazas
npm run reporte:md       # genera reporte/REPORTE_RESULTADOS.md (tabla + hallazgos)
```

Si ya tienes la app corriendo: `BASE_URL=http://localhost:8081 npm test`.

## 5. Pruebas incluidas

| ID | Qué verifica | ¿Necesita login? |
|---|---|---|
| T01–T02 | Login: validación de campos vacíos | No |
| T03 | Login: mostrar/ocultar contraseña | No |
| T04 | Navegación Login ⇄ Registro | No |
| T05–T07 | Registro: campos vacíos, contraseñas distintas, contraseña corta | No |
| T08 | Registro: correo con formato inválido | No |
| T09 | Selección de rol: botón deshabilitado sin elegir | No |
| T10 | Perfil profesional: servicio y descripción obligatorios | No |
| T11–T12 | Bienvenida y pestañas por rol (cliente / profesional) | Sí |
| T13 | Búsqueda: 14 categorías | Sí |
| T14 | Lista de chats carga sin errores | Sí |
| T15 | Cerrar sesión | Sí |
| T16 | Cliente solicita servicio | Sí (ambos) |
| T17 | Profesional acepta y cotiza | Sí |
| T18 | Profesional finaliza → pago en historial | Sí (ambos) |
| T19 | Calificar sin estrellas → "Calificación requerida" | Sí |
| T20 | Profesional rechaza con motivo; el cliente lo ve | Sí (ambos) |
| T21 | Solicitud duplicada: la app lo impide (HU-19) | Sí (ambos) |

Completa en `reporte/REPORTE_RESULTADOS.md` la columna **HU (Jira)** para cada prueba.

## 5b. Estado inicial de los datos (importante)

La app no permite que un cliente tenga **dos solicitudes activas (pendiente o en proceso) con el mismo profesional**. Antes de correr T16–T21, el cliente de prueba **no debe tener ninguna solicitud activa con el profesional de prueba**. Si la tiene, T16 y T20 fallarán con la alerta "Solicitud existente" (mensaje de PRECONDICIÓN en el reporte). Finalízala desde la cuenta del profesional o usa otro cliente de prueba.

Al terminar la suite, T18 finaliza lo que T16 creó y T20 rechaza lo que creó, así que se puede volver a correr. Si T16 pasa pero T17 o T18 fallan, queda una solicitud activa que hay que cerrar a mano antes de repetir.

## 6. Si una prueba con login falla

T11–T20 se escribieron leyendo el código de las pantallas, pero **no se pudieron ejecutar contra Firebase** al prepararlas. Antes de reportar un bug:

1. Abre la traza: `npx playwright show-trace reporte/evidencias/<carpeta>/trace.zip` y mira en qué paso se detuvo.
2. Si fue un localizador (el texto no existe o hay dos), corrígelo con `npx playwright codegen http://localhost:8081`.
3. Si el comportamiento es el equivocado, es un **hallazgo**: la captura y el video ya quedaron como evidencia.

Ayuda opcional: añadir `testID="..."` a los botones principales de la app hace los localizadores más estables (en web se convierte en `data-testid`).

# Informe de hallazgos — ServiHogar 2.0

**Asignatura:** Verificación y validación de software · **Herramienta:** Playwright (TypeScript) · **Fecha de ejecución:** 13 de noviembre de 2026
**Versión probada:** commit 774250b del repositorio ServiHogar2.0 · **Navegador:** Chromium (incluido con Playwright) · **Entorno:** versión web de la app (Expo), con Firebase real y dos cuentas de prueba (cliente y profesional)

## 1. Resumen

| Casos automatizados | Pasan | Fallan | Omitidos |
|---|---|---|---|
| 22 (del plan de pruebas corregido) | 20 | 2 (CP-02.1, CP-02.4) | 0 |

- **Defectos:** 1 (BUG-01, validación del correo en el registro), detectado por dos casos.
- **Observaciones de usabilidad:** 2 (OBS-01, OBS-02). **Discrepancia con la documentación:** 1 (DOC-01).
- Casos con valores límite: CP-02.2, CP-27.2 y CP-27.4. Casos negativos: 9. Todos los scripts llevan el ID del caso en su nombre.
- Evidencia: reporte HTML de Playwright, video de la corrida completa (22 casos) y capturas/trazas de los casos fallidos.
- Matriz de trazabilidad: `reporte/MATRIZ_TRAZABILIDAD.md`.

## 2. Alcance y limitaciones

- **Automatizado:** registro y validaciones, selección de rol, inicio y cierre de sesión, pestañas por rol, solicitudes de servicio (estado inicial, bloqueo de duplicadas), aceptar/rechazar/finalizar y calificación.
- **No automatizable con esta herramienta** (se verifica manualmente en el dispositivo, según el plan): caché SQLite y modo sin conexión, notificaciones push, cámara/galería y generación de PDF.
- Playwright controla navegadores, por lo que las pruebas corren sobre la **versión web de la misma app** (mismo código React Native). Se aplica un parche solo para pruebas (Firebase Auth web, simulación de SQLite, alertas visibles en el DOM y `testID` en las estrellas); el código de Android/iOS no se modifica.
- La verificación de correo no se automatiza: las cuentas de prueba tienen el correo ya verificado.

## 3. Resultados por caso

| Caso | HU · criterio | Criterio de aceptación | Tipo | Resultado |
|---|---|---|---|---|
| CP-02.1 | HU-02 · CA-01 | El correo debe tener un formato válido | Negativo | ❌ BUG-01 |
| CP-02.2 | HU-02 · CA-02 | La contraseña debe tener mínimo 6 caracteres | Límite (5/6/7) | ✅ |
| CP-02.3 | HU-02 · CA-03 | Los campos inválidos muestran mensajes de error claros | Negativo | ✅ |
| CP-02.4 | HU-02 · CA-04 | El registro no continúa mientras existan datos inválidos | Negativo | ❌ BUG-01 |
| CP-03.1 | HU-03 · CA-01 | Se muestran las opciones Cliente y Profesional | Positivo | ✅ |
| CP-04.1 | HU-04 · CA-01 | El sistema solicita correo y contraseña | Positivo | ✅ |
| CP-04.3 | HU-04 · CA-03 | Las credenciales válidas permiten el acceso | Positivo | ✅ |
| CP-04.4 | HU-04 · CA-04 | Las credenciales inválidas generan un mensaje de error | Negativo | ✅ |
| CP-06.3 | HU-06 · CA-03 | El usuario regresa a la pantalla de autenticación | Positivo | ✅ |
| CP-10.1 | HU-10 · CA-01 | El cliente visualiza sus pestañas | Positivo | ✅ |
| CP-10.2 | HU-10 · CA-02 | El profesional visualiza sus pestañas | Positivo | ✅ |
| CP-18.4 | HU-18 · CA-04 | La solicitud queda inicialmente en estado pendiente | Positivo | ✅ |
| CP-19.1 | HU-19 · CA-01 | El sistema consulta solicitudes pendientes | Negativo | ✅ |
| CP-19.2 | HU-19 · CA-02 | También consulta solicitudes en proceso | Negativo | ✅ |
| CP-25.1 | HU-25 · CA-01 | Existe la opción de aceptar | Positivo | ✅ |
| CP-25.2 | HU-25 · CA-02 | Existe la opción de rechazar | Positivo | ✅ |
| CP-25.4 | HU-25 · CA-04 | Aceptar cambia el estado a en_proceso | Positivo | ✅ |
| CP-25.5 | HU-25 · CA-05 | Rechazar cambia el estado a rechazado | Negativo | ✅ |
| CP-26.1 | HU-26 · CA-01 | Existe la opción de finalizar | Negativo | ✅ |
| CP-26.3 | HU-26 · CA-03 | El estado cambia a finalizado | Positivo | ✅ |
| CP-27.2 | HU-27 · CA-02 | La puntuación está entre 1 y 5 estrellas | Límite (0/1/5) | ✅ |
| CP-27.4 | HU-27 · CA-04 | El comentario no puede superar 300 caracteres | Límite (299/300/301) | ✅ |

## 4. Defectos encontrados

### BUG-01 — El registro permite continuar con un correo de formato inválido
- **Casos:** CP-02.1 y CP-02.4 · **HU:** HU-02 (CA-01, CA-04) · **Severidad:** Media · **Tipo:** Validación · **Ticket Jira:** SER-84
- **Pasos:** Registro → nombre válido, correo inválido, contraseña válida en ambos campos → *Continuar*.
- **Datos:** `abc`, `abc@`, `abc@x`, `a b@x.com` (el correo `qa.valido@correo.com` sí se acepta, como se espera).
- **Resultado esperado:** el formulario rechaza el correo con el mensaje «El correo no tiene un formato válido» (como hace el inicio de sesión) y no avanza.
- **Resultado obtenido:** con los cuatro valores la app avanza a «¿Cómo usarás la app?». El error aparece solo al final del registro, como un modal genérico «Error / Error al crear la cuenta» (confirmado manualmente en el dispositivo).
- **Evidencia:** capturas, video y traza en `reporte/evidencias/` de los casos CP-02.1 y CP-02.4 (carpetas `01-registro-...`).
- **Sugerencia:** validar el formato del correo con una expresión regular en `RegisterScreen.handleContinue`, antes de avanzar.

## 5. Observaciones (no son defectos)

- **OBS-01 — Botones deshabilitados sin explicación:** «Registrarse» y «Finalizar registro» quedan deshabilitados sin elegir rol o servicio, por lo que las alertas «Selecciona un rol» y «Selecciona al menos un servicio» del código nunca se muestran.
- **OBS-02 — Alerta inalcanzable al calificar (CP-27.2):** «Enviar» está deshabilitado con 0 estrellas, así que la alerta «Calificación requerida» nunca aparece. El comportamiento es correcto, pero no se le indica al usuario por qué no puede enviar.
- **Reglas verificadas durante las pruebas:** si el profesional cotiza un valor distinto al presupuesto, la app exige un comentario de al menos 5 caracteres; el comentario de la calificación admite hasta 300 caracteres (CP-27.4).

## 6. Discrepancias con la documentación

- **DOC-01:** la HU-11 (Jira) habla de 10 categorías de servicio, pero la app muestra 14.

## 7. Conclusión

En la versión web los flujos probados cumplen los criterios de aceptación, salvo la validación del formato del correo en el registro (BUG-01). Riesgos no cubiertos por automatización: funcionamiento sin conexión y caché SQLite, notificaciones push, cámara/galería y generación de PDF; se verifican manualmente en dispositivo.

**Reproducibilidad:** la suite deja los datos de prueba limpios y se repite con `npm test` (ver README).

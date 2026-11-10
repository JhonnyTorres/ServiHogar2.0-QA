# Informe de hallazgos — ServiHogar 2.0

**Asignatura:** Verificación y validación de software · **Herramienta:** Playwright (TypeScript) · **Fecha de ejecución:** 9 de noviembre de 2026
**Versión probada:** commit 774250b del repositorio ServiHogar2.0 · **Navegador:** Chromium (el incluido con Playwright) · **Entorno:** build web de la app (Expo), con Firebase real y dos cuentas de prueba (cliente y profesional)

## 1. Resumen

| Pruebas funcionales | Pasan | Fallan | Omitidas | HU con pruebas ejecutadas |
|---|---|---|---|---|
| 21 (T01–T21) | 20 | 1 (T08) | 0 | **21 de 41** |

- **Bugs:** 1 (BUG-01, validación del correo en el registro).
- **Observaciones de usabilidad:** 2 (OBS-01 y OBS-02).
- **Discrepancia con la documentación:** 1 (DOC-01).
- Además hay una prueba de preparación (T00) que limpia solicitudes de corridas anteriores; no es una prueba de HU y no cuenta en los totales.

## 2. Alcance y limitaciones

- **Cubierto:** registro y validaciones, selección de rol, inicio y cierre de sesión, navegación por rol, búsqueda por categorías, ciclo completo de un servicio (solicitar → aceptar con cotización → finalizar → historial de pagos), rechazo con motivo, bloqueo de solicitudes duplicadas, calificación y lista de chats.
- **No cubierto con automatización** (se verifica en el dispositivo): caché SQLite y modo sin conexión, notificaciones push, cámara/galería y generación de PDF (`expo-print`).
- La app se ejecutó en su **versión web** con un parche solo para pruebas (Firebase Auth web, simulación de SQLite y alertas visibles en pantalla). El código de Android/iOS no se modificó.
- La verificación de correo no se puede automatizar: las cuentas de prueba tienen el correo ya verificado.

## 3. Cobertura de historias de usuario

| Prueba | HU (Jira) | Criterios | Resultado |
|---|---|---|---|
| T01, T02 | HU-04 Iniciar sesión | CA-04 | ✅ |
| T03 | HU-04 | CA-01 | ✅ |
| T04 | HU-01 Registrar usuarios | CA-01/02/03 | ✅ |
| T05 | HU-01, HU-02 | CA-05 ; CA-03 | ✅ |
| T06, T07 | HU-02 Validar datos de registro | CA-03/04 ; CA-02/04 | ✅ |
| **T08** | **HU-02** | **CA-01/CA-04** | **❌ BUG-01** |
| T09 | HU-03 Selección de rol | CA-01/02 | ✅ (ver OBS-01) |
| T10 | HU-07, HU-08 | CA-02/03 ; CA-01 | ✅ (ver OBS-01) |
| T11 | HU-10, HU-38, HU-39 | CA-01/03 ; CA-01 ; CA-01 | ✅ |
| T12 | HU-10, HU-13, HU-39 | CA-02/03 ; CA-01 ; CA-01 | ✅ |
| T13 | HU-11, HU-14 | CA-03 ; CA-01 | ✅ (ver DOC-01) |
| T14 | HU-38 Lista de chats | CA-01/04 | ✅ |
| T15 | HU-06 Cerrar sesión, HU-35 | CA-01/02/03 ; CA-04 | ✅ |
| T16 | HU-18, HU-20 | CA-01/02/04 ; CA-04 | ✅ |
| T17 | HU-24, HU-25 | CA-02 ; CA-01/04 | ✅ |
| T18 | HU-26 Finalizar servicios | CA-01/03/04 | ✅ |
| T19 | HU-27 Calificar servicios | CA-02 | ✅ (ver OBS-02) |
| T20 | HU-25 | CA-02/05 | ✅ |
| T21 | HU-19 Evitar solicitudes duplicadas | CA-02/03/04 | ✅ |

HU sin prueba automatizada: HU-05, 09, 12, 15, 16, 17, 21, 22, 23, 28 a 34, 36, 37, 40 y 41.

## 4. Bugs encontrados

### BUG-01 — El registro permite continuar con un correo de formato inválido
- **Prueba:** T08 · **HU:** HU-02 (CA-01, CA-04) · **Severidad:** Media · **Tipo:** Validación
- **Pasos:** Registro → nombre válido, correo `esto-no-es-un-correo`, contraseña `clave123` en ambos campos → *Continuar*.
- **Resultado esperado:** el formulario avisa que el correo no es válido en ese mismo paso, como hace el inicio de sesión ("El correo no tiene un formato válido").
- - **Resultado obtenido:** la app avanza a la pantalla "¿Cómo usarás la app?". Solo al elegir rol y tocar *Registrarse* aparece un modal con el título "Error" y el mensaje genérico "Error al crear la cuenta", sin indicar que el correo es inválido. (Confirmado también en el dispositivo.)
- **Evidencia:** captura `test-failed-1.png`, video `video.webm` y traza `trace.zip` en `reporte/evidencias/01-acceso-y-registro-Acces-5862f-se-en-este-mismo-formulario/`; captura adicional `T08-evidencia-correo-invalido.png`.
- **Sugerencia:** validar el formato del correo con una expresión regular en `RegisterScreen.handleContinue`, antes de avanzar.

## 5. Observaciones (no son bugs)

- **OBS-01 — Botones deshabilitados sin explicación** (T09, T10): "Registrarse" y "Finalizar registro" quedan deshabilitados sin elegir rol o servicio, por lo que las alertas "Selecciona un rol" y "Selecciona al menos un servicio" del código nunca se muestran. El usuario no sabe por qué el botón no responde.
- **OBS-02 — Alerta inalcanzable al calificar** (T19): en "Calificar servicio" el botón *Enviar* está deshabilitado mientras no haya estrellas, de modo que la alerta "Calificación requerida" definida en el código nunca aparece. El resultado es correcto (no se puede calificar con 0 estrellas), pero falta indicar al usuario que debe elegir estrellas.
- **Regla verificada durante las pruebas:** si el profesional cotiza un valor distinto al presupuesto del cliente, la app exige un comentario de al menos 5 caracteres y bloquea *Continuar* hasta escribirlo.

## 6. Discrepancias con la documentación

- **DOC-01:** la HU-11 (SER-11) habla de 10 categorías de servicio, pero la app muestra **14** (T13). Conviene actualizar la historia en Jira o revisar si hay categorías de más.

## 7. Conclusión

En la versión web, los flujos principales funcionan: registro, inicio y cierre de sesión, ciclo completo de un servicio, rechazo con motivo, protección contra solicitudes duplicadas y calificación. Se encontró un defecto real de validación (BUG-01) y dos puntos de usabilidad (botones deshabilitados sin explicación).

**Riesgos pendientes** (no cubiertos): funcionamiento sin conexión y caché SQLite, notificaciones push, cámara/galería y generación de PDF. Se recomienda probarlos manualmente en un dispositivo antes de la entrega final. La suite se puede repetir con `npm test`, ya que deja los datos de prueba limpios.

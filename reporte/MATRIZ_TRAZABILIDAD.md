# Matriz de trazabilidad — pruebas automatizadas ServiHogar 2.0

Generada: 13/11/2026, 3:19:19 a. m. · Herramienta: Playwright · Casos automatizados: **22** · Ejecutados: **22** · ✅ 20 · ❌ 2 · ⏭️ 0

| ID del caso | Escenario o criterio de aceptación | Archivo y nombre del script | Resultado |
|---|---|---|---|
| CP-02.1 | HU-02 CA-01: El correo debe tener un formato válido | `01-registro.spec.ts` › CP-02.1 Correo con formato válido: rechaza abc, abc@, abc@x y "a b@x.com"; acepta qa.valido@correo.com | ❌ Fallida |
| CP-02.2 | HU-02 CA-02: La contraseña debe tener mínimo 6 caracteres | `01-registro.spec.ts` › CP-02.2 Contraseña mínima de 6 caracteres (valor límite 5, 6 y 7) | ✅ Aprobada |
| CP-02.3 | HU-02 CA-03: Los campos inválidos muestran mensajes de error claros | `01-registro.spec.ts` › CP-02.3 Campos inválidos muestran su mensaje (todos vacíos y solo el nombre vacío) | ✅ Aprobada |
| CP-02.4 | HU-02 CA-04: El registro no continúa mientras existan datos inválidos | `01-registro.spec.ts` › CP-02.4 El registro no continúa mientras haya datos inválidos (correo "abc@") | ❌ Fallida |
| CP-03.1 | HU-03 CA-01: Se muestran las opciones Cliente y Profesional | `01-registro.spec.ts` › CP-03.1 La selección de rol muestra exactamente las opciones Cliente y Profesional | ✅ Aprobada |
| CP-04.1 | HU-04 CA-01: El sistema solicita correo y contraseña | `01-registro.spec.ts` › CP-04.1 El login solicita correo y contraseña (contraseña oculta) y ofrece iniciar sesión | ✅ Aprobada |
| CP-04.3 | HU-04 CA-03: Las credenciales válidas permiten el acceso | `02-acceso-con-cuenta.spec.ts` › CP-04.3 Credenciales válidas permiten el acceso: cada rol entra al Home de su rol | ✅ Aprobada |
| CP-04.4 | HU-04 CA-04: Las credenciales inválidas generan un mensaje de error | `02-acceso-con-cuenta.spec.ts` › CP-04.4 Credenciales inválidas muestran un mensaje y no dan acceso (clave incorrecta, correo inexistente, campos vacíos) | ✅ Aprobada |
| CP-06.3 | HU-06 CA-03: El usuario regresa a la pantalla de autenticación | `02-acceso-con-cuenta.spec.ts` › CP-06.3 Al cerrar sesión se regresa a la pantalla de login | ✅ Aprobada |
| CP-10.1 | HU-10 CA-01: El cliente visualiza sus pestañas | `02-acceso-con-cuenta.spec.ts` › CP-10.1 El cliente ve sus pestañas y ninguna del profesional | ✅ Aprobada |
| CP-10.2 | HU-10 CA-02: El profesional visualiza sus pestañas | `02-acceso-con-cuenta.spec.ts` › CP-10.2 El profesional ve sus pestañas y ninguna del cliente | ✅ Aprobada |
| CP-18.4 | HU-18 CA-04: La solicitud queda inicialmente en estado pendiente | `03-solicitudes.spec.ts` › CP-18.4 La solicitud queda inicialmente en estado Pendiente (cliente y profesional la ven así) | ✅ Aprobada |
| CP-19.1 | HU-19 CA-01: El sistema consulta solicitudes pendientes | `03-solicitudes.spec.ts` › CP-19.1 Con una solicitud pendiente no se crea otra y se informa (Solicitud existente) | ✅ Aprobada |
| CP-19.2 | HU-19 CA-02: También consulta solicitudes en proceso | `03-solicitudes.spec.ts` › CP-19.2 Con una solicitud en proceso tampoco se crea otra y se informa | ✅ Aprobada |
| CP-25.1 | HU-25 CA-01: Existe la opción de aceptar | `03-solicitudes.spec.ts` › CP-25.1 El profesional tiene la opción Aceptar en una solicitud pendiente | ✅ Aprobada |
| CP-25.2 | HU-25 CA-02: Existe la opción de rechazar | `03-solicitudes.spec.ts` › CP-25.2 El profesional tiene la opción Rechazar en una solicitud pendiente | ✅ Aprobada |
| CP-25.4 | HU-25 CA-04: Aceptar cambia el estado a en_proceso | `03-solicitudes.spec.ts` › CP-25.4 Aceptar (con valor cotizado) cambia el estado a En proceso | ✅ Aprobada |
| CP-25.5 | HU-25 CA-05: Rechazar cambia el estado a rechazado | `03-solicitudes.spec.ts` › CP-25.5 Rechazar (con motivo) cambia el estado a Rechazado y el cliente ve el motivo | ✅ Aprobada |
| CP-26.1 | HU-26 CA-01: Existe la opción de finalizar | `03-solicitudes.spec.ts` › CP-26.1 "Marcar como finalizado" aparece solo en el servicio en proceso, no en el pendiente | ✅ Aprobada |
| CP-26.3 | HU-26 CA-03: El estado cambia a finalizado | `03-solicitudes.spec.ts` › CP-26.3 Finalizar cambia el estado a Finalizado y el servicio sale de En proceso | ✅ Aprobada |
| CP-27.2 | HU-27 CA-02: La puntuación está entre 1 y 5 estrellas | `04-calificacion.spec.ts` › CP-27.2 La puntuación va de 1 a 5 estrellas: con 0 no se envía; 1 y 5 se aceptan (valor límite) | ✅ Aprobada |
| CP-27.4 | HU-27 CA-04: El comentario no puede superar 300 caracteres | `04-calificacion.spec.ts` › CP-27.4 El comentario admite hasta 300 caracteres (valor límite 299, 300 y 301) | ✅ Aprobada |

## Casos fallidos (posibles defectos)

> Antes de reportar un defecto, abre la traza de la carpeta de evidencias y confirma que el fallo no es del script.

### CP-02.1 — El correo debe tener un formato válido

- **HU / criterio:** HU-02 CA-01
- **Resultado esperado (plan):** Con cada uno de los 4 correos inválidos se permanece en Registro y se muestra «El correo no tiene un formato válido» (mismo texto del Login). Con qa.valido@correo.com se avanza a «¿Cómo usarás la app?».
- **Resultado obtenido:**

```
Error: "abc" debe mostrar "El correo no tiene un formato válido"

expect(locator).toBeVisible() failed

Locator: getByText('El correo no tiene un formato válido').visible()
Expected: visible
Timeout: 2000ms
Error: element(s) not found

Call log:
```

- **Evidencias:**
  - ![screenshot](evidencias/01-registro-Registro-y-Log-99071-acepta-qa-valido-correo-com/test-failed-1.png)
  - [video](evidencias/01-registro-Registro-y-Log-99071-acepta-qa-valido-correo-com/video.webm)
  - [error-context](evidencias/01-registro-Registro-y-Log-99071-acepta-qa-valido-correo-com/error-context.md)
  - [trace](evidencias/01-registro-Registro-y-Log-99071-acepta-qa-valido-correo-com/trace.zip)

### CP-02.4 — El registro no continúa mientras existan datos inválidos

- **HU / criterio:** HU-02 CA-04
- **Resultado esperado (plan):** Se permanece en Registro (no aparece «¿Cómo usarás la app?») y no se crea ninguna cuenta ni documento nuevo. La automatización verifica el no avance de pantalla; la ausencia de cuenta se confirma manualmente en la consola.
- **Resultado obtenido:**

```
Error: No se debe avanzar de pantalla con un correo inválido

expect(locator).toHaveCount(expected) failed

Locator:  getByText('¿Cómo usarás la app?').visible()
Expected: 0
Received: 1
Timeout:  10000ms

Call log:
```

- **Evidencias:**
  - ![screenshot](evidencias/01-registro-Registro-y-Log-474f4-datos-inválidos-correo-abc-/test-failed-1.png)
  - [video](evidencias/01-registro-Registro-y-Log-474f4-datos-inválidos-correo-abc-/video.webm)
  - [error-context](evidencias/01-registro-Registro-y-Log-474f4-datos-inválidos-correo-abc-/error-context.md)
  - [trace](evidencias/01-registro-Registro-y-Log-474f4-datos-inválidos-correo-abc-/trace.zip)


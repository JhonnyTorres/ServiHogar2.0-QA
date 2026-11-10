# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-acceso-y-registro.spec.ts >> Acceso y registro @sin-login >> Registro >> T08 Registro: un correo con formato inválido debe rechazarse en este mismo formulario
- Location: tests\01-acceso-y-registro.spec.ts:84:5

# Error details

```
Error: BUG: el registro deja avanzar a la selección de rol con un correo inválido

expect(locator).toHaveCount(expected) failed

Locator:  getByText('¿Cómo usarás la app?').visible()
Expected: 0
Received: 1
Timeout:  10000ms

Call log:
  - BUG: el registro deja avanzar a la selección de rol con un correo inválido getByText('¿Cómo usarás la app?').visible() with timeout 10000ms
  - waiting for getByText('¿Cómo usarás la app?').visible()
    23 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e13]:
  - generic [ref=e14]: 
  - generic [ref=e16]: ¿Cómo usarás la app?
  - generic [ref=e17]: Elige tu rol para continuar
  - generic [ref=e18]:
    - generic [ref=e19] [cursor=pointer]:
      - generic [ref=e20]: 
      - generic [ref=e22]:
        - generic [ref=e23]: Cliente
        - generic [ref=e24]: Busco servicios para mi hogar
    - generic [ref=e26] [cursor=pointer]:
      - generic [ref=e27]: 
      - generic [ref=e29]:
        - generic [ref=e30]: Profesional
        - generic [ref=e31]: Ofrezco servicios del hogar
    - generic: Registrarse
    - generic [ref=e34] [cursor=pointer]:
      - generic [ref=e35]: 
      - generic [ref=e36]: Volver
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import {
  3   |   abrirApp, campo, campoCorreo, campoClave, botonIniciarSesion, texto, textoParcial,
  4   |   alertaTitulo, alertaMensaje, evidencia, vigilarErrores,
  5   | } from './helpers';
  6   | 
  7   | /**
  8   |  * Estas pruebas NO necesitan usuarios ni conexión a Firebase: validan formularios y navegación
  9   |  * de las pantallas Login, Registro, Selección de rol y Perfil profesional.
  10  |  * Cada prueba lleva su ID (Txx); en el reporte se cruza con la HU de Jira.
  11  |  */
  12  | 
  13  | test.describe('Acceso y registro @sin-login', () => {
  14  |   test.beforeEach(async ({ page }) => {
  15  |     await abrirApp(page);
  16  |   });
  17  | 
  18  |   test('T01 Login: enviar el formulario vacío muestra "Completa todos los campos"', async ({ page }, info) => {
  19  |     await botonIniciarSesion(page).click();
  20  |     await expect(textoParcial(page, 'Completa todos los campos')).toBeVisible();
  21  |     await evidencia(page, info, 'mensaje-campos-vacios');
  22  |   });
  23  | 
  24  |   test('T02 Login: con correo pero sin contraseña también exige completar los campos', async ({ page }, info) => {
  25  |     await campoCorreo(page).fill('cliente@ejemplo.com');
  26  |     await botonIniciarSesion(page).click();
  27  |     await expect(textoParcial(page, 'Completa todos los campos')).toBeVisible();
  28  |     await evidencia(page, info, 'sin-contrasena');
  29  |   });
  30  | 
  31  |   test('T03 Login: el ícono del ojo muestra y oculta la contraseña', async ({ page }, info) => {
  32  |     const clave = campoClave(page);
  33  |     await clave.fill('secreto123');
  34  |     await expect(clave).toHaveAttribute('type', 'password');
  35  |     await clave.locator('xpath=../div[last()]').click();
  36  |     await expect(clave).not.toHaveAttribute('type', 'password'); // sin type = texto visible
  37  |     await evidencia(page, info, 'contrasena-visible');
  38  |     await clave.locator('xpath=../div[last()]').click();
  39  |     await expect(clave).toHaveAttribute('type', 'password');
  40  |   });
  41  | 
  42  |   test('T04 Navegación: Login → Registro → Login', async ({ page }, info) => {
  43  |     await texto(page, 'Regístrate').click();
  44  |     await expect(texto(page, 'Crear cuenta').first()).toBeVisible();
  45  |     await expect(textoParcial(page, 'Únete a la comunidad')).toBeVisible();
  46  |     await evidencia(page, info, 'pantalla-registro');
  47  |     await texto(page, 'Inicia sesión').click();
  48  |     await expect(textoParcial(page, 'Bienvenido de nuevo')).toBeVisible();
  49  |   });
  50  | 
  51  |   test.describe('Registro', () => {
  52  |     test.beforeEach(async ({ page }) => {
  53  |       await texto(page, 'Regístrate').click();
  54  |       await expect(campo(page, 'Nombre completo')).toBeVisible();
  55  |     });
  56  | 
  57  |     const llenar = async (page, nombre: string, correo: string, clave: string, confirmar: string) => {
  58  |       await campo(page, 'Nombre completo').fill(nombre);
  59  |       await campoCorreo(page).fill(correo);
  60  |       await campo(page, 'Contraseña', true).fill(clave);
  61  |       await campo(page, 'Confirmar contraseña').fill(confirmar);
  62  |     };
  63  | 
  64  |     test('T05 Registro: campos vacíos → "Todos los campos son obligatorios"', async ({ page }, info) => {
  65  |       await texto(page, 'Continuar →').click();
  66  |       await expect(textoParcial(page, 'Todos los campos son obligatorios')).toBeVisible();
  67  |       await evidencia(page, info, 'registro-vacio');
  68  |     });
  69  | 
  70  |     test('T06 Registro: contraseñas distintas → "Las contraseñas no coinciden"', async ({ page }, info) => {
  71  |       await llenar(page, 'Ana Prueba', 'ana@ejemplo.com', 'clave123', 'clave124');
  72  |       await texto(page, 'Continuar →').click();
  73  |       await expect(textoParcial(page, 'Las contraseñas no coinciden')).toBeVisible();
  74  |       await evidencia(page, info, 'contrasenas-distintas');
  75  |     });
  76  | 
  77  |     test('T07 Registro: contraseña de menos de 6 caracteres → mensaje de longitud mínima', async ({ page }, info) => {
  78  |       await llenar(page, 'Ana Prueba', 'ana@ejemplo.com', '12345', '12345');
  79  |       await texto(page, 'Continuar →').click();
  80  |       await expect(textoParcial(page, 'La contraseña debe tener al menos 6 caracteres')).toBeVisible();
  81  |       await evidencia(page, info, 'contrasena-corta');
  82  |     });
  83  | 
  84  |     test('T08 Registro: un correo con formato inválido debe rechazarse en este mismo formulario', async ({ page }, info) => {
  85  |       // Resultado esperado: el formulario avisa del formato del correo (como ya hace el Login).
  86  |       await llenar(page, 'Ana Prueba', 'esto-no-es-un-correo', 'clave123', 'clave123');
  87  |       await texto(page, 'Continuar →').click();
  88  |       await evidencia(page, info, 'correo-invalido');
  89  |       await expect(
  90  |         textoParcial(page, '¿Cómo usarás la app?'),
  91  |         'BUG: el registro deja avanzar a la selección de rol con un correo inválido'
> 92  |       ).toHaveCount(0);
      |         ^ Error: BUG: el registro deja avanzar a la selección de rol con un correo inválido
  93  |     });
  94  | 
  95  |     test('T09 Selección de rol: sin elegir rol el botón de registro está deshabilitado', async ({ page }, info) => {
  96  |       await llenar(page, 'Ana Prueba', 'ana@ejemplo.com', 'clave123', 'clave123');
  97  |       await texto(page, 'Continuar →').click();
  98  |       await expect(textoParcial(page, '¿Cómo usarás la app?')).toBeVisible();
  99  |       await expect(texto(page, 'Cliente')).toBeVisible();
  100 |       await expect(texto(page, 'Profesional')).toBeVisible();
  101 |       // el estado deshabilitado lo lleva el contenedor del botón (aria-disabled)
  102 |       await expect(texto(page, 'Registrarse').locator('xpath=ancestor::*[@aria-disabled][1]')).toHaveAttribute('aria-disabled', 'true');
  103 |       await evidencia(page, info, 'seleccion-rol-sin-elegir');
  104 |       await texto(page, 'Volver').click();
  105 |       await expect(campo(page, 'Nombre completo')).toBeVisible();
  106 |     });
  107 | 
  108 |     test('T10 Perfil profesional: el registro exige al menos un servicio y una descripción', async ({ page }, info) => {
  109 |       const errores = vigilarErrores(page);
  110 |       await llenar(page, 'Pedro Pro', 'pedro@ejemplo.com', 'clave123', 'clave123');
  111 |       await texto(page, 'Continuar →').click();
  112 |       await texto(page, 'Profesional').click();
  113 |       await texto(page, 'Continuar →').click();
  114 |       await expect(textoParcial(page, 'Tus servicios')).toBeVisible();
  115 | 
  116 |       // 1) Sin servicio seleccionado el botón está deshabilitado (no hay mensaje que explique por qué)
  117 |       const finalizar = texto(page, 'Finalizar registro');
  118 |       await expect(finalizar.locator('xpath=ancestor::*[@aria-disabled][1]')).toHaveAttribute('aria-disabled', 'true');
  119 |       await evidencia(page, info, 'sin-servicio-boton-deshabilitado');
  120 | 
  121 |       // 2) Con servicio pero sin descripción → alerta
  122 |       await texto(page, 'Plomería').first().click();
  123 |       await finalizar.click();
  124 |       await expect(alertaTitulo(page)).toHaveText('Agrega una descripción');
  125 |       await expect(alertaMensaje(page)).toContainText('experiencia');
  126 |       await evidencia(page, info, 'sin-descripcion');
  127 | 
  128 |       // Sin errores de JavaScript durante el flujo
  129 |       expect(errores.filter((e) => e.startsWith('pageerror'))).toEqual([]);
  130 |     });
  131 |   });
  132 | });
  133 | 
```
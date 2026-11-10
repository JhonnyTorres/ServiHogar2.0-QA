import { test, expect } from '@playwright/test';
import {
  abrirApp, campo, campoCorreo, campoClave, botonIniciarSesion, texto, textoParcial,
  alertaTitulo, alertaMensaje, evidencia, vigilarErrores,
} from './helpers';

/**
 * Estas pruebas NO necesitan usuarios ni conexión a Firebase: validan formularios y navegación
 * de las pantallas Login, Registro, Selección de rol y Perfil profesional.
 * Cada prueba lleva su ID (Txx); en el reporte se cruza con la HU de Jira.
 */

test.describe('Acceso y registro @sin-login', () => {
  test.beforeEach(async ({ page }) => {
    await abrirApp(page);
  });

  test('T01 Login: enviar el formulario vacío muestra "Completa todos los campos"', async ({ page }, info) => {
    await botonIniciarSesion(page).click();
    await expect(textoParcial(page, 'Completa todos los campos')).toBeVisible();
    await evidencia(page, info, 'mensaje-campos-vacios');
  });

  test('T02 Login: con correo pero sin contraseña también exige completar los campos', async ({ page }, info) => {
    await campoCorreo(page).fill('cliente@ejemplo.com');
    await botonIniciarSesion(page).click();
    await expect(textoParcial(page, 'Completa todos los campos')).toBeVisible();
    await evidencia(page, info, 'sin-contrasena');
  });

  test('T03 Login: el ícono del ojo muestra y oculta la contraseña', async ({ page }, info) => {
    const clave = campoClave(page);
    await clave.fill('secreto123');
    await expect(clave).toHaveAttribute('type', 'password');
    await clave.locator('xpath=../div[last()]').click();
    await expect(clave).not.toHaveAttribute('type', 'password'); // sin type = texto visible
    await evidencia(page, info, 'contrasena-visible');
    await clave.locator('xpath=../div[last()]').click();
    await expect(clave).toHaveAttribute('type', 'password');
  });

  test('T04 Navegación: Login → Registro → Login', async ({ page }, info) => {
    await texto(page, 'Regístrate').click();
    await expect(texto(page, 'Crear cuenta').first()).toBeVisible();
    await expect(textoParcial(page, 'Únete a la comunidad')).toBeVisible();
    await evidencia(page, info, 'pantalla-registro');
    await texto(page, 'Inicia sesión').click();
    await expect(textoParcial(page, 'Bienvenido de nuevo')).toBeVisible();
  });

  test.describe('Registro', () => {
    test.beforeEach(async ({ page }) => {
      await texto(page, 'Regístrate').click();
      await expect(campo(page, 'Nombre completo')).toBeVisible();
    });

    const llenar = async (page, nombre: string, correo: string, clave: string, confirmar: string) => {
      await campo(page, 'Nombre completo').fill(nombre);
      await campoCorreo(page).fill(correo);
      await campo(page, 'Contraseña', true).fill(clave);
      await campo(page, 'Confirmar contraseña').fill(confirmar);
    };

    test('T05 Registro: campos vacíos → "Todos los campos son obligatorios"', async ({ page }, info) => {
      await texto(page, 'Continuar →').click();
      await expect(textoParcial(page, 'Todos los campos son obligatorios')).toBeVisible();
      await evidencia(page, info, 'registro-vacio');
    });

    test('T06 Registro: contraseñas distintas → "Las contraseñas no coinciden"', async ({ page }, info) => {
      await llenar(page, 'Ana Prueba', 'ana@ejemplo.com', 'clave123', 'clave124');
      await texto(page, 'Continuar →').click();
      await expect(textoParcial(page, 'Las contraseñas no coinciden')).toBeVisible();
      await evidencia(page, info, 'contrasenas-distintas');
    });

    test('T07 Registro: contraseña de menos de 6 caracteres → mensaje de longitud mínima', async ({ page }, info) => {
      await llenar(page, 'Ana Prueba', 'ana@ejemplo.com', '12345', '12345');
      await texto(page, 'Continuar →').click();
      await expect(textoParcial(page, 'La contraseña debe tener al menos 6 caracteres')).toBeVisible();
      await evidencia(page, info, 'contrasena-corta');
    });

    test('T08 Registro: un correo con formato inválido debe rechazarse en este mismo formulario', async ({ page }, info) => {
      // Resultado esperado: el formulario avisa del formato del correo (como ya hace el Login).
      await llenar(page, 'Ana Prueba', 'esto-no-es-un-correo', 'clave123', 'clave123');
      await texto(page, 'Continuar →').click();
      await evidencia(page, info, 'correo-invalido');
      await expect(
        textoParcial(page, '¿Cómo usarás la app?'),
        'BUG: el registro deja avanzar a la selección de rol con un correo inválido'
      ).toHaveCount(0);
    });

    test('T09 Selección de rol: sin elegir rol el botón de registro está deshabilitado', async ({ page }, info) => {
      await llenar(page, 'Ana Prueba', 'ana@ejemplo.com', 'clave123', 'clave123');
      await texto(page, 'Continuar →').click();
      await expect(textoParcial(page, '¿Cómo usarás la app?')).toBeVisible();
      await expect(texto(page, 'Cliente')).toBeVisible();
      await expect(texto(page, 'Profesional')).toBeVisible();
      // el estado deshabilitado lo lleva el contenedor del botón (aria-disabled)
      await expect(texto(page, 'Registrarse').locator('xpath=ancestor::*[@aria-disabled][1]')).toHaveAttribute('aria-disabled', 'true');
      await evidencia(page, info, 'seleccion-rol-sin-elegir');
      await texto(page, 'Volver').click();
      await expect(campo(page, 'Nombre completo')).toBeVisible();
    });

    test('T10 Perfil profesional: el registro exige al menos un servicio y una descripción', async ({ page }, info) => {
      const errores = vigilarErrores(page);
      await llenar(page, 'Pedro Pro', 'pedro@ejemplo.com', 'clave123', 'clave123');
      await texto(page, 'Continuar →').click();
      await texto(page, 'Profesional').click();
      await texto(page, 'Continuar →').click();
      await expect(textoParcial(page, 'Tus servicios')).toBeVisible();

      // 1) Sin servicio seleccionado el botón está deshabilitado (no hay mensaje que explique por qué)
      const finalizar = texto(page, 'Finalizar registro');
      await expect(finalizar.locator('xpath=ancestor::*[@aria-disabled][1]')).toHaveAttribute('aria-disabled', 'true');
      await evidencia(page, info, 'sin-servicio-boton-deshabilitado');

      // 2) Con servicio pero sin descripción → alerta
      await texto(page, 'Plomería').first().click();
      await finalizar.click();
      await expect(alertaTitulo(page)).toHaveText('Agrega una descripción');
      await expect(alertaMensaje(page)).toContainText('experiencia');
      await evidencia(page, info, 'sin-descripcion');

      // Sin errores de JavaScript durante el flujo
      expect(errores.filter((e) => e.startsWith('pageerror'))).toEqual([]);
    });
  });
});

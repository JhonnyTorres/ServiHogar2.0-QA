import fs from 'fs';
import path from 'path';

/** Datos de prueba (archivo aparte del código; mismos valores que los casos del plan). */
export type Datos = typeof import('../datos/datos.json');

export const datos: Datos = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'datos', 'datos.json'), 'utf8')
);

/** Cuentas de prueba: nunca van en el repositorio, vienen de .env o de variables de entorno. */
export const cred = {
  cliente: { correo: process.env.QA_CLIENTE_EMAIL || '', clave: process.env.QA_CLIENTE_PASS || '' },
  profesional: { correo: process.env.QA_PRO_EMAIL || '', clave: process.env.QA_PRO_PASS || '' },
  /** Nombre del profesional de prueba tal como se ve en Buscar. */
  profesionalNombre: process.env.QA_PRO_NOMBRE || '',
  categoria: process.env.QA_PRO_CATEGORIA || datos.servicio.categoriaPorDefecto,
};

export const hayCredenciales = !!(
  cred.cliente.correo && cred.cliente.clave && cred.profesional.correo && cred.profesional.clave && cred.profesionalNombre
);

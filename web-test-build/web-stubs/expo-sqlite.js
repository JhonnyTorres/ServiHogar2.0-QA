// Reemplazo de expo-sqlite SOLO para la build web de pruebas.
// expo-sqlite en web exige SharedArrayBuffer + worker y falla al abrir la base.
// La app solo usa SQLite como caché local, así que en web se simula una base vacía.
// Consecuencia: el caché/offline (SQLite) NO se prueba con Playwright; solo en el dispositivo.
const db = {
  getAllSync: () => [],
  runSync: () => ({ changes: 0, lastInsertRowId: 0 }),
  execSync: () => {},
};

export const openDatabaseSync = () => db;
export default { openDatabaseSync };

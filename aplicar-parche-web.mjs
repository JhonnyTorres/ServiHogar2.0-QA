// Prepara la app ServiHogar para poder probarla en el navegador.
// Uso:  node aplicar-parche-web.mjs [ruta-de-la-app]     (por defecto: la carpeta superior)
//
// Hace 3 cosas (ninguna cambia el comportamiento en Android/iOS):
//   1. Copia web-stubs/ (SQLite simulado y Alert visible en el DOM) a la raíz de la app.
//   2. Copia metro.config.js (solo si la app no tiene uno).
//   3. Ajusta src/services/firebaseService.js: en web usa getAuth() porque
//      getReactNativePersistence no existe en la versión web de Firebase Auth.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(process.argv[2] || path.join(aqui, '..'));
const origen = path.join(aqui, 'web-test-build');

const fallar = (msg) => { console.error('✗ ' + msg); process.exit(1); };

if (!fs.existsSync(path.join(app, 'package.json')) || !fs.existsSync(path.join(app, 'App.js'))) {
  fallar(`No encuentro la app en ${app}. Pasa la ruta: node aplicar-parche-web.mjs C:\\ruta\\ServiHogar2.0`);
}

// 1) web-stubs
fs.mkdirSync(path.join(app, 'web-stubs'), { recursive: true });
for (const f of fs.readdirSync(path.join(origen, 'web-stubs'))) {
  fs.copyFileSync(path.join(origen, 'web-stubs', f), path.join(app, 'web-stubs', f));
}
console.log('✓ web-stubs copiados');

// 2) metro.config.js
const metroDestino = path.join(app, 'metro.config.js');
if (fs.existsSync(metroDestino)) {
  const actual = fs.readFileSync(metroDestino, 'utf8');
  if (actual.includes('web-stubs')) console.log('✓ metro.config.js ya estaba parchado');
  else fallar('La app ya tiene un metro.config.js. Combínalo a mano con web-test-build/metro.config.js y vuelve a correr.');
} else {
  fs.copyFileSync(path.join(origen, 'metro.config.js'), metroDestino);
  console.log('✓ metro.config.js copiado');
}

// 3) firebaseService.js
const fbPath = path.join(app, 'src', 'services', 'firebaseService.js');
if (!fs.existsSync(fbPath)) fallar('No existe src/services/firebaseService.js');
let fb = fs.readFileSync(fbPath, 'utf8');
if (fb.includes("Platform.OS === 'web'")) {
  console.log('✓ firebaseService.js ya estaba parchado');
} else {
  const reImport = /\s*getReactNativePersistence,\r?\n/;
  const reAuth = /const auth = initializeAuth\(app, \{\s*persistence: getReactNativePersistence\(ReactNativeAsyncStorage\)\s*\}\);/;
  if (!reImport.test(fb) || !reAuth.test(fb)) {
    fallar('firebaseService.js no tiene el formato esperado; aplica el cambio a mano (ver README, sección "Parche manual").');
  }
  fs.copyFileSync(fbPath, fbPath + '.orig');
  fb = fb
    .replace(reImport, '\n')
    .replace(
      /(import \{ initializeApp \} from ["']firebase\/app["'];)/,
      "$1\nimport { Platform } from 'react-native';\nimport * as FirebaseAuth from 'firebase/auth';"
    )
    .replace(
      reAuth,
      "const auth = Platform.OS === 'web'\n  ? FirebaseAuth.getAuth(app)\n  : initializeAuth(app, {\n      persistence: FirebaseAuth.getReactNativePersistence(ReactNativeAsyncStorage)\n    });"
    );
  fs.writeFileSync(fbPath, fb);
  console.log('✓ firebaseService.js parchado (copia de seguridad: firebaseService.js.orig)');
}

console.log('\nListo. Verifica con:  cd ' + app + '  &&  npx expo start --web');

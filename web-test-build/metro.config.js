// Config de Metro SOLO para poder probar la app en el navegador (build web).
// No cambia nada en Android/iOS: los reemplazos aplican únicamente cuando platform === 'web'.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const resolverOriginal = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolver = resolverOriginal || context.resolveRequest;

  if (platform === 'web') {
    // 1) SQLite simulado
    if (moduleName === 'expo-sqlite') {
      return { type: 'sourceFile', filePath: path.resolve(__dirname, 'web-stubs/expo-sqlite.js') };
    }
    // 2) Alert visible en el DOM
    const resultado = resolver(context, moduleName, platform);
    if (
      resultado &&
      resultado.type === 'sourceFile' &&
      resultado.filePath.replace(/\\/g, '/').endsWith('react-native-web/dist/exports/Alert/index.js')
    ) {
      return { type: 'sourceFile', filePath: path.resolve(__dirname, 'web-stubs/Alert.js') };
    }
    return resultado;
  }

  return resolver(context, moduleName, platform);
};

module.exports = config;

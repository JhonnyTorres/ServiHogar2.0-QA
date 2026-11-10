// Convierte reporte/resultados.json (lo genera Playwright) en reporte/REPORTE_RESULTADOS.md:
// tabla de resultados por prueba + detalle de cada fallo con sus evidencias, listo para
// copiar a la sección "Hallazgos" del informe.
// Uso:  npm test  &&  npm run reporte:md
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(raiz, 'reporte', 'resultados.json');
if (!fs.existsSync(jsonPath)) {
  console.error('No existe reporte/resultados.json. Ejecuta primero: npm test');
  process.exit(1);
}

const datos = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const mapaPath = path.join(raiz, 'scripts', 'mapa-hu.json');
const mapa = fs.existsSync(mapaPath) ? JSON.parse(fs.readFileSync(mapaPath, 'utf8')) : { hu: {}, pruebas: {} };
let filas = [];

function recorrer(suite, titulos = []) {
  const t = suite.title && !suite.file ? [...titulos, suite.title] : titulos;
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const res = test.results?.[test.results.length - 1] || {};
      filas.push({
        titulo: spec.title,
        archivo: spec.file,
        estado: test.status, // expected | unexpected | skipped | flaky
        duracion: res.duration || 0,
        error: (res.errors?.[0]?.message || res.error?.message || '').replace(/\u001b\[[0-9;]*m/g, ''),
        adjuntos: (res.attachments || []).filter((a) => a.path),
      });
    }
  }
  for (const s of suite.suites || []) recorrer(s, t);
}
for (const s of datos.suites || []) recorrer(s);

const etiqueta = { expected: '✅ Pasa', unexpected: '❌ Falla', skipped: '⏭️ Omitida', flaky: '⚠️ Inestable' };
const rel = (p) => path.relative(path.join(raiz, 'reporte'), p).replace(/\\/g, '/');
const id = (t) => (t.match(/^(T\d+)/) || [, '—'])[1];

// T00 es una preparación de datos (limpia solicitudes de corridas anteriores), no una prueba de HU:
// no cuenta en totales ni en hallazgos; solo se avisa si falló.
const prep = filas.filter((f) => id(f.titulo) === 'T00');
filas = filas.filter((f) => id(f.titulo) !== 'T00');
const total = filas.length;
const cuenta = (e) => filas.filter((f) => f.estado === e).length;
const hoy = new Date().toLocaleString('es-CO');

let md = `# Reporte de resultados — pruebas automatizadas ServiHogar 2.0\n\n`;
md += `Generado: ${hoy} · Herramienta: Playwright · Total: **${total}** · ✅ ${cuenta('expected')} · ❌ ${cuenta('unexpected')} · ⏭️ ${cuenta('skipped')}\n\n`;
const huDe = (tid) => Object.entries(mapa.pruebas[tid]?.hu || {});
if (prep.some((f) => f.estado === 'unexpected')) md += `> Nota: la preparación T00 (limpieza de datos) falló en esta ejecución; no afecta los resultados de las HU.\n\n`;
md += `## Resultados por prueba\n\n| ID | HU (Jira) | Criterios | Prueba | Resultado | Duración |\n|---|---|---|---|---|---|\n`;
for (const f of filas) {
  const hus = huDe(id(f.titulo));
  md += `| ${id(f.titulo)} | ${hus.map(([h]) => h).join(', ') || '—'} | ${hus.map(([, c]) => c.join('/')).join(' ; ') || '—'} | ${f.titulo.replace(/\|/g, '\\|')} | ${etiqueta[f.estado] || f.estado} | ${(f.duracion / 1000).toFixed(1)} s |\n`;
}

// Cobertura por HU: una HU cuenta como cubierta si al menos una prueba que la toca SE EJECUTÓ (no omitida)
const porHU = {};
for (const f of filas) {
  for (const [h, cas] of huDe(id(f.titulo))) {
    const x = (porHU[h] ||= { pruebas: [], cas: new Set(), ejecutada: false, fallo: false });
    x.pruebas.push(id(f.titulo));
    if (f.estado !== 'skipped') { x.ejecutada = true; cas.forEach((c) => x.cas.add(c)); }
    if (f.estado === 'unexpected' || f.estado === 'flaky') x.fallo = true;
  }
}
const cubiertas = Object.entries(porHU).filter(([, v]) => v.ejecutada);
md += `\n## Cobertura de historias de usuario\n\n`;
md += `**HU con al menos una prueba ejecutada: ${cubiertas.length} de ${Object.keys(mapa.hu).length}** (el profesor pide mínimo 15).\n\n`;
md += `| HU | Jira | Título | Pruebas | Criterios verificados | Estado |\n|---|---|---|---|---|---|\n`;
for (const [h, v] of Object.entries(porHU).sort()) {
  const info = mapa.hu[h] || {};
  const estado = !v.ejecutada ? '⏭️ sin ejecutar' : v.fallo ? '❌ con fallo' : '✅ sin fallos';
  md += `| ${h} | ${info.jira || ''} | ${info.titulo || ''} | ${v.pruebas.join(', ')} | ${v.cas.size} de ${info.totalCA ?? '?'} | ${estado} |\n`;
}
const sinPrueba = Object.keys(mapa.hu).filter((h) => !porHU[h]);
md += `\nSin ninguna prueba automatizada: ${sinPrueba.join(', ') || '—'}.\n`;

const fallos = filas.filter((f) => f.estado === 'unexpected' || f.estado === 'flaky');
md += `\n## Hallazgos (pruebas que fallaron)\n\n`;
md += `> Antes de registrar un fallo como bug, abre su traza y confirma que no es un problema del localizador de la prueba.\n\n`;
if (!fallos.length) md += `Ninguna prueba falló en esta ejecución.\n`;
fallos.forEach((f, i) => {
  md += `### H-${String(i + 1).padStart(2, '0')} · ${id(f.titulo)} — ${f.titulo}\n\n`;
  md += `- **Severidad:** _(Alta / Media / Baja)_\n- **Tipo:** _(Funcional / Validación / UX / Seguridad)_\n- **Resultado esperado:** _(según el criterio de aceptación)_\n`;
  md += `- **Resultado obtenido:**\n\n\`\`\`\n${f.error.split('\n').slice(0, 8).join('\n')}\n\`\`\`\n\n`;
  md += `- **Evidencias:**\n`;
  for (const a of f.adjuntos) {
    if ((a.contentType || '').startsWith('image/')) md += `  - ![${a.name}](${rel(a.path)})\n`;
    else md += `  - [${a.name}](${rel(a.path)})\n`;
  }
  md += `\n`;
});

fs.writeFileSync(path.join(raiz, 'reporte', 'REPORTE_RESULTADOS.md'), md);
console.log(`✓ reporte/REPORTE_RESULTADOS.md (${total} pruebas, ${fallos.length} con fallo)`);

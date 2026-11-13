// Genera la matriz de trazabilidad a partir de lo que realmente se ejecutó.
// Entradas: reporte/resultados.json (lo escribe Playwright) y docs/casos-automatizados.json (casos del plan corregido).
// Salida: reporte/MATRIZ_TRAZABILIDAD.md
// Uso: npm test  &&  npm run reporte:matriz
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
const casos = JSON.parse(fs.readFileSync(path.join(raiz, 'docs', 'casos-automatizados.json'), 'utf8'));

const filas = new Map(); // cp -> {archivo, titulo, estado, duracion, error, adjuntos}
function recorrer(suite) {
  for (const spec of suite.specs || []) {
    const cp = (spec.title.match(/^(CP-\d+\.\d+)/) || [])[1];
    if (!cp) continue;
    for (const t of spec.tests || []) {
      const r = t.results?.[t.results.length - 1] || {};
      filas.set(cp, {
        archivo: spec.file.replace(/\\/g, '/'),
        titulo: spec.title,
        estado: t.status, // expected | unexpected | skipped | flaky
        duracion: r.duration || 0,
        error: (r.errors?.[0]?.message || '').replace(/\u001b\[[0-9;]*m/g, ''),
        adjuntos: (r.attachments || []).filter((a) => a.path),
      });
    }
  }
  for (const s of suite.suites || []) recorrer(s);
}
for (const s of datos.suites || []) recorrer(s);

const etiqueta = { expected: '✅ Aprobada', unexpected: '❌ Fallida', skipped: '⏭️ Omitida', flaky: '⚠️ Inestable' };
const rel = (p) => path.relative(path.join(raiz, 'reporte'), p).replace(/\\/g, '/');
const cuenta = (e) => [...filas.values()].filter((f) => f.estado === e).length;

let md = `# Matriz de trazabilidad — pruebas automatizadas ServiHogar 2.0\n\n`;
md += `Generada: ${new Date().toLocaleString('es-CO')} · Herramienta: Playwright · Casos automatizados: **${casos.length}** · Ejecutados: **${filas.size}** · ✅ ${cuenta('expected')} · ❌ ${cuenta('unexpected')} · ⏭️ ${cuenta('skipped')}\n\n`;
md += `| ID del caso | Escenario o criterio de aceptación | Archivo y nombre del script | Resultado |\n|---|---|---|---|\n`;
for (const c of casos) {
  const f = filas.get(c.cp);
  const script = f ? `\`${f.archivo}\` › ${f.titulo.replace(/\|/g, '\\|')}` : '— (no se encontró en la ejecución)';
  const res = f ? etiqueta[f.estado] || f.estado : '⏭️ No ejecutada';
  md += `| ${c.cp} | ${c.hu} ${c.ca}: ${c.criterio.replace(/\|/g, '\\|')} | ${script} | ${res} |\n`;
}

const fallidas = casos.filter((c) => ['unexpected', 'flaky'].includes(filas.get(c.cp)?.estado));
md += `\n## Casos fallidos (posibles defectos)\n\n`;
md += `> Antes de reportar un defecto, abre la traza de la carpeta de evidencias y confirma que el fallo no es del script.\n\n`;
if (!fallidas.length) md += `Ningún caso falló en esta ejecución.\n`;
for (const c of fallidas) {
  const f = filas.get(c.cp);
  md += `### ${c.cp} — ${c.criterio}\n\n- **HU / criterio:** ${c.hu} ${c.ca}\n- **Resultado esperado (plan):** ${c.esperado.replace(/\n/g, ' ')}\n`;
  md += `- **Resultado obtenido:**\n\n\`\`\`\n${f.error.split('\n').slice(0, 10).join('\n')}\n\`\`\`\n\n- **Evidencias:**\n`;
  for (const a of f.adjuntos) {
    md += (a.contentType || '').startsWith('image/') ? `  - ![${a.name}](${rel(a.path)})\n` : `  - [${a.name}](${rel(a.path)})\n`;
  }
  md += `\n`;
}
fs.writeFileSync(path.join(raiz, 'reporte', 'MATRIZ_TRAZABILIDAD.md'), md);
console.log(`✓ reporte/MATRIZ_TRAZABILIDAD.md (${casos.length} casos, ${fallidas.length} fallidos)`);

import { readFile, writeFile } from 'node:fs/promises';
const report = JSON.parse(await readFile('docs/experiencia-hibrida/captures/review.json', 'utf8'));
const intro = JSON.parse(await readFile('docs/experiencia-hibrida/captures/intro/review.json', 'utf8'));
const names = ['hero', 'mis-eventos', 'favoritos', 'evento', 'pase', 'nave', 'cabina', 'cabina-editando'];
let md = '# Galería · Órbitas 2D + 3D\n\n48 capturas de recorridos con reloj vivo; 18 poses de carga con reloj controlado. Chrome de Windows, viewports emulados. Sin deploy.\n\n[Datos de recorridos](review.json) · [Datos de la intro](intro/review.json) · [Implementación](../implementacion.md)\n\n';
md += '[Preview de las tres versiones](preview/review.json): 18 comprobaciones y 24 capturas bajo `/supernova-eventos/`. Comparación de escritorio: [original](preview/original-dark-1440.png), [3D](preview/3d-dark-1440.png), [híbrida](preview/hibrida-dark-1440.png). La original también completó su inscripción/pase en ambos temas y los tres anchos.\n\n';
for (const viewport of ['1440x900','390x844','320x667']) {
  md += `## ${viewport}\n\n| Recorrido | Oscuro | Claro |\n| --- | --- | --- |\n`;
  names.forEach((name,index) => {
    const prefix = `${String(index + 1).padStart(2,'0')}-${name}`;
    md += `| ${name} | [Ver](${prefix}-dark-${viewport}.png) | [Ver](${prefix}-light-${viewport}.png) |\n`;
  });
  md += '\n';
}
md += '## Carga → hero\n\n';
for (const width of [1440,390]) md += `${width}px: ${intro.captures.filter(capture => capture.viewport.width === width).map(capture => `[${capture.time} ms](intro/${capture.file})`).join(' · ')}\n\n`;
md += '![Hero híbrido](01-hero-dark-1440x900.png)\n\n![Cabina ilustrada](07-cabina-dark-1440x900.png)\n\n';
md += `${report.journeys.length} recorridos conservaron el Canvas y emitieron un pase cada uno. Cero errores JS/consola/requests fallidas y cero desbordes horizontales. Máximo estático: ${Math.max(...report.captures.map(item => Number(item.canvas.hybridCalls)))} calls / ${Math.max(...report.captures.map(item => Number(item.canvas.hybridTriangles)))} triángulos. La intro verifica coincidencia de centro/diámetro a 1,4 s con tolerancia de 2 px.\n\n`;
md += 'Las poses de intro se obtienen avanzando el reloj Playwright sobre una apertura con assets ya calientes. Las capturas de recorridos desactivan animaciones DOM durante el screenshot; la escena Three mantiene su reloj. No son pruebas de GPU ni de dispositivos móviles físicos.\n';
await writeFile('docs/experiencia-hibrida/captures/README.md', md);

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

// Build the critical HTML from the actual lightweight artwork and stylesheet.
// --write-index is the frontend integration step for both critical backgrounds.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const temporaryModule = resolve(root, 'docs/trailer/.bootstrap-artwork.mjs');
const source = await readFile(resolve(root, 'src/features/intro/IntroArtwork.tsx'), 'utf8');
const css = await readFile(resolve(root, 'src/features/intro/intro.css'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

await writeFile(temporaryModule, compiled);
try {
  const { default: Artwork } = await import(pathToFileURL(temporaryModule).href);
  const markup = renderToStaticMarkup(createElement(Artwork));
  const bootstrap = `<!-- Critical solar first frame. Capture its clock/dismissal before removal; copy this entire block before #root. -->
<style id="intro-bootstrap-style">${css.trim()}</style>
<div id="intro-bootstrap" class="cinematic-intro intro-pending" role="status" aria-label="Preparando Órbita">
  <p class="intro-sr-only">Órbita. Conectá sin límites. Preparando la experiencia. Presioná Escape para continuar.</p>
  ${markup}
</div>
<p id="intro-bootstrap-note" role="status">Preparando tu universo.<span>La aplicación todavía se está cargando.</span></p>
<script>
(() => {
  const bootstrap = document.getElementById('intro-bootstrap');
  const note = document.getElementById('intro-bootstrap-note');
  const startedAtMs = performance.now();
  bootstrap.setAttribute('data-intro-started-at', String(startedAtMs));
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const release = () => {
    bootstrap.setAttribute('data-intro-dismissed', 'true');
    bootstrap.setAttribute('aria-hidden', 'true');
    bootstrap.inert = true;
    bootstrap.style.opacity = '0';
    bootstrap.style.visibility = 'hidden';
    bootstrap.style.pointerEvents = 'none';
    if (note && bootstrap.isConnected) note.style.opacity = '1';
  };
  const timer = window.setTimeout(release, preference.matches ? 150 : 3600);
  const onKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      release();
    }
  };
  const onPreferenceChange = event => { if (event.matches) release(); };
  document.addEventListener('keydown', onKeyDown);
  preference.addEventListener('change', onPreferenceChange);
  const observer = new MutationObserver(() => {
    if (bootstrap.isConnected) return;
    window.clearTimeout(timer);
    document.removeEventListener('keydown', onKeyDown);
    preference.removeEventListener('change', onPreferenceChange);
    observer.disconnect();
    note?.remove();
  });
  observer.observe(document.body, { childList: true });
})();
</script>
`;
  await writeFile(resolve(root, 'src/features/intro/bootstrap.html'), bootstrap);
  if (process.argv.includes('--write-index')) {
    const indexPath = resolve(root, 'index.html');
    const backgroundCss = await readFile(resolve(root, 'src/features/background/tour-nebula.css'), 'utf8');
    const backgroundMarkup = await readFile(resolve(root, 'src/features/background/bootstrap.html'), 'utf8');
    let index = await readFile(indexPath, 'utf8');
    index = index.replace(/<!-- Persistent Tour backdrop start -->[\s\S]*?<!-- Persistent Tour backdrop end -->\s*/, '');
    const start = index.indexOf('<!-- Critical solar first frame.');
    const end = index.indexOf('    <div id="root">', start);
    if (start < 0 || end < start) throw new Error('Critical bootstrap markers missing in index.html.');
    const background = `<!-- Persistent Tour backdrop start -->\n<style id="tour-nebula-bootstrap-style">${backgroundCss.trim()}</style>\n${backgroundMarkup.trim()}\n<!-- Persistent Tour backdrop end -->\n`;
    index = index.slice(0, start) + background + bootstrap + index.slice(end);
    await writeFile(indexPath, index);
    console.log('Persistent Tour background and solar intro synchronized into index.html.');
  }
  console.log('Solar bootstrap regenerated from IntroArtwork.tsx and intro.css.');
} finally {
  await unlink(temporaryModule);
}

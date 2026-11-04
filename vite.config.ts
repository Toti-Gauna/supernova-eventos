import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// GitHub Pages only serves files: each version path from src/versions/catalog.ts
// needs its own index.html. 404.html mirrors the dev server's SPA fallback.
const versionRoutes = ['original', '3d', 'hibrida', 'comercial', 'versiones'];
// Only 3D and 2D + 3D show the space backdrop. Elsewhere its photo stays lazy, and a lazy
// image inside a hidden element is never downloaded.
const routesWithoutBackdrop = new Set(['original', 'comercial', 'versiones']);
const withoutBackdropPhoto = (html: string) => html.replace(/(<img class="tour-nebula-image"[^>]*?) fetchpriority="high">/, '$1 loading="lazy">');

function staticVersionRoutes(): Plugin {
  let outDir = '';
  return {
    name: 'supernova-static-version-routes',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const html = await readFile(resolve(outDir, 'index.html'), 'utf8');
      for (const route of versionRoutes) {
        await mkdir(resolve(outDir, route), { recursive: true });
        await writeFile(resolve(outDir, route, 'index.html'), routesWithoutBackdrop.has(route) ? withoutBackdropPhoto(html) : html);
      }
      await writeFile(resolve(outDir, '404.html'), html);
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/supernova-eventos/' : '/',
  plugins: [react(), staticVersionRoutes()],
}));

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Read the committed presentation without checking out or overwriting working files.
const sources = [
  'src/App.tsx', 'src/components/Header.tsx', 'src/components/CosmicScene.tsx',
  'src/features/admin/AdminPanel.tsx', 'src/features/admin/EventWizard.tsx',
  'src/features/favorites/Favorites.tsx', 'src/features/profile/Profile.tsx',
  'src/features/registration/MyEvents.tsx', 'src/features/registration/RegistrationModal.tsx',
  'src/features/registration/theme.css',
  'src/hooks/useTheme.ts',
  'src/features/intro/CinematicIntro.tsx', 'src/features/intro/IntroLoading.tsx',
  'src/features/intro/IntroArtwork.tsx', 'src/features/intro/introLifecycle.ts', 'src/features/intro/intro.css',
];
const destination = source => source.replace(/^src\//, 'src/versions/original/');
const originalFiles = new Set(sources);
for (const source of sources) {
  const target = destination(source);
  if (existsSync(target)) throw new Error(`Snapshot already exists: ${target}`);
  let content = execFileSync('git', ['show', `HEAD:${source}`], { encoding: 'utf8' }).replace(/^\uFEFF/, '');
  content = content.replace(/((?:from\s*|import\s*\(\s*|import\s*)['"])(\.[^'"]+)(['"])/g, (match, before, specifier, after) => {
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(source), specifier));
    const reference = [resolved, `${resolved}.tsx`, `${resolved}.ts`, `${resolved}/index.ts`].find(candidate => originalFiles.has(candidate)) ?? resolved;
    const mapped = originalFiles.has(reference) ? destination(resolved) : resolved;
    let relative = path.posix.relative(path.posix.dirname(target), mapped);
    if (!relative.startsWith('.')) relative = `./${relative}`;
    return `${before}${relative}${after}`;
  });
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
}
console.log(`Preserved ${sources.length} presentation files from ${execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()}.`);

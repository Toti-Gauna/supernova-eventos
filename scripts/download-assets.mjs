import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('public/images', { recursive: true });
const assets = {
  concert: 'photo-1470229722913-7c0e2dbbafd3',
  wellness: 'photo-1506126613408-eca07ce68773',
  innovation: 'photo-1451187580459-43490279c0fa',
  community: 'photo-1511632765486-a01980e01a18',
  workshop: 'photo-1522071820081-009f0129c71c',
  outdoor: 'photo-1464822759023-fed622ff2c3b',
};
for (const [name, id] of Object.entries(assets)) {
  const response = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  await writeFile(`public/images/${name}.jpg`, Buffer.from(await response.arrayBuffer()));
  console.log(`Saved ${name}.jpg`);
}

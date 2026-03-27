// Post-build script: copy index.html to all SPA sub-routes
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, 'dist/public');
const indexHtml = resolve(distDir, 'index.html');

const routes = ['auth', 'dashboard', 'membros', 'perfil', 'planos'];

for (const route of routes) {
  const routeDir = resolve(distDir, route);
  mkdirSync(routeDir, { recursive: true });
  copyFileSync(indexHtml, resolve(routeDir, 'index.html'));
  console.log(`  ✓ ${route}/index.html`);
}

console.log('Post-build: SPA sub-routes created successfully.');

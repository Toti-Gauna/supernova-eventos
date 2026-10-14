import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import jsQR from 'jsqr';

const adminOnly = process.env.QR_REVIEW_SCOPE === 'admin-mobile';
const output = resolve(adminOnly ? 'docs/cambios-eventos/captures-qr/admin-mobile-final' : 'docs/cambios-eventos/captures-qr');
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const started = Date.now();
const report = { browser: browser.version(), date: '2026-10-09', rows: [], errors: [], httpErrors: [], failedRequests: [] };
await mkdir(output, { recursive: true });

async function screenshot(page, stem, stage) {
  const name = `${stem}-${stage}.png`;
  await page.screenshot({ path: resolve(output, name), animations: 'disabled' });
  return name;
}

async function decode(image) {
  const raster = await image.evaluate(async img => {
    await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const context = canvas.getContext('2d'); context.drawImage(img, 0, 0, 512, 512);
    return Array.from(context.getImageData(0, 0, 512, 512).data);
  });
  return jsQR(new Uint8ClampedArray(raster), 512, 512)?.data ?? null;
}

try {
  const scenarios = adminOnly ? ['original', '3d', 'hibrida'].flatMap(version => ['dark', 'light'].map(theme => ({ version, width: 320, theme }))) : ['original', '3d', 'hibrida'].flatMap(version => [
    ...[1440, 390, 320].map(width => ({ version, width, theme: 'dark' })),
    { version, width: 320, theme: 'light' },
  ]);
  for (const { version, width, theme } of scenarios) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 667 }, reducedMotion: 'reduce', locale: 'es-AR', timezoneId: 'America/Montevideo' });
    await context.addInitScript(value => localStorage.setItem('supernova-theme-v1', JSON.stringify(value)), theme);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push({ version, width, theme, error: error.message }));
    page.on('response', response => { if (response.status() >= 400) report.httpErrors.push({ version, width, theme, url: response.url(), status: response.status() }); });
    page.on('requestfailed', request => report.failedRequests.push({ version, width, theme, url: request.url(), error: request.failure()?.errorText }));
    await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
    await page.goto(`http://127.0.0.1:5173/${version}/`);
    await page.getByRole('dialog', { name: 'Bienvenido a Supernova Eventos' }).waitFor({ state: 'detached' });
    const stem = `${version}-${width}-${theme}`;
    const row = { version, width, theme, captures: [], userQR: null, adminQR: null };
    await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).waitFor();
    if (!adminOnly || theme === 'light') {
    await page.getByRole('button', { name: 'Ver Supernova Sessions', exact: true }).click();
    const selector = page.locator('.event-session-selector');
    await selector.getByRole('radio').nth(1).check();
    await selector.scrollIntoViewIfNeeded();
    row.captures.push(await screenshot(page, stem, 'funciones'));
    await page.getByRole('checkbox', { name: 'Acepto los términos y condiciones del evento.' }).check();
    await page.getByRole('button', { name: 'Confirmar mi lugar', exact: true }).click();
    await page.getByRole('heading', { name: 'Ya sos parte.', exact: true }).waitFor();
    row.pass = await page.locator('.registration-modal').evaluate(element => {
      const bounds = node => { const box = node?.getBoundingClientRect(); return box ? { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom } : null; };
      const buttons = Array.from(element.querySelectorAll('.success-actions .button')).map(node => ({ label: node.textContent.trim(), ...bounds(node) }));
      const back = bounds(element.querySelector('.registration-back'));
      return {
        horizontalOverflow: element.scrollWidth > element.clientWidth + 1,
        verticalOverflow: element.scrollHeight > element.clientHeight + 1,
        calendar: bounds(element.querySelector('.event-calendar')),
        actions: buttons, back,
        actionsInViewport: buttons.every(box => box.x >= -1 && box.right <= innerWidth + 1 && box.y >= -1 && box.bottom <= innerHeight + 1),
        backOverlapsAction: !!back && buttons.some(box => back.x < box.right && back.right > box.x && back.y < box.bottom && back.bottom > box.y),
      };
    });
    row.captures.push(await screenshot(page, stem, 'pase'));
    if (!adminOnly) {
    await page.getByRole('button', { name: 'Ver mi QR', exact: true }).click();
    const userQR = page.getByRole('dialog', { name: 'Mi QR de acceso', exact: true });
    await userQR.locator('.qr-image').waitFor();
    row.userQR = JSON.parse(await decode(userQR.locator('.qr-image')));
    row.qrOverflow = await userQR.evaluate(element => element.scrollWidth > element.clientWidth + 1);
    row.captures.push(await screenshot(page, stem, 'qr-usuario'));
    await userQR.getByRole('button', { name: 'Volver', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Cerrar inscripción', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Administrar', exact: true }).click();
    await page.getByRole('button', { name: 'QR de Supernova Sessions', exact: true }).click();
    const adminQR = page.getByRole('dialog', { name: 'QR de Supernova Sessions', exact: true });
    const options = await adminQR.locator('option').evaluateAll(items => items.map(item => item.value));
    await adminQR.getByRole('combobox', { name: 'Función del QR', exact: true }).selectOption(options[1]);
    await adminQR.locator('.qr-image').waitFor();
    row.adminQR = await decode(adminQR.locator('.qr-image'));
    row.admin = await adminQR.evaluate(element => {
      const dialog = element.getBoundingClientRect();
      const actions = Array.from(element.querySelectorAll('.qr-dialog-actions .button')).map(node => {
        const box = node.getBoundingClientRect();
        return { label: node.textContent.trim(), top: box.top, bottom: box.bottom, completeInViewport: box.top >= 0 && box.bottom <= innerHeight && box.top >= dialog.top && box.bottom <= dialog.bottom };
      });
      return { horizontalOverflow: element.scrollWidth > element.clientWidth + 1, actions, actionsInViewport: actions.every(action => action.completeInViewport) };
    });
    row.captures.push(await screenshot(page, stem, 'qr-admin'));
    report.rows.push(row);
    await context.close();
  }
} finally {
  report.elapsedMs = Date.now() - started;
  await browser.close();
  await writeFile(resolve(output, 'review.json'), JSON.stringify(report, null, 2));
  const table = report.rows.map(row => `| ${row.version} | ${row.width} | ${row.theme} | ${row.captures.map(file => `[${file.split('-').slice(3).join('-').replace('.png', '')}](${file})`).join(' · ')} |`).join('\n');
  await writeFile(resolve(output, 'README.md'), `# ${adminOnly ? 'Móvil final · funciones, pases y QR' : 'Funciones y QR · revisión local'}\n\nCapturas del 9 de octubre de 2026, con movimiento reducido, datos ficticios y la segunda función seleccionada. Chrome ${report.browser}.\n\n${adminOnly ? 'Seis escenarios: las tres versiones, claras y oscuras, en 320 × 667 px. Los escenarios claros también capturan selector y pase después del pulido de contraste. Se mide que cada acción del QR esté completamente dentro del viewport y del dialog.' : 'Doce escenarios: tres versiones oscuras en 1440, 390 y 320 px, más las tres versiones claras en 320 px. La altura es 900 px en escritorio y 667 px en móvil.'}\n\n| Versión | Ancho | Tema | Capturas |\n| --- | --- | --- | --- |\n${table}\n\n[Mediciones, QR decodificados y errores](review.json). Esta revisión no mide tiempos de GPU ni dispositivos móviles físicos.\n`);
}
console.log(JSON.stringify({ scenarios: report.rows.length, captures: report.rows.reduce((count, row) => count + row.captures.length, 0), elapsedMs: report.elapsedMs, errors: report.errors, httpErrors: report.httpErrors, failedRequests: report.failedRequests, layoutIssues: report.rows.filter(row => (row.pass && (row.pass.horizontalOverflow || row.pass.verticalOverflow || !row.pass.actionsInViewport || row.pass.backOverlapsAction)) || row.qrOverflow || row.admin.horizontalOverflow || !row.admin.actionsInViewport).map(row => ({ version: row.version, width: row.width, theme: row.theme, pass: row.pass, qrOverflow: row.qrOverflow, admin: row.admin })) }, null, 2));

import { expect, type Page } from '@playwright/test';

export async function setupRealSource(page: Page, isMobile: boolean, label: string) {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  await page.goto('/');



  await expect(page.getByRole('button', { name: 'Mein Notebook',exact:true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept(`E2E ${label} ${suffix}`));
  const created = page.waitForResponse(response => response.url().includes('/api/notebooks') && response.request().method() === 'POST');
  await page.getByRole('button', { name: '+ Notebook' }).click();
  await created;
  const scope = isMobile
    ? (await page.getByRole('button', { name: 'Quellen' }).click(), page.getByRole('dialog', { name: 'Quellen' }))
    : page;
  await scope.locator('input[type=file]').setInputFiles({
    name: 'e2e-quelle.txt', mimeType: 'text/plain', buffer: Buffer.from('E2E-Quelleninhalt für sichere Transporttests. '+label),
  });
  await expect(scope.getByText('e2e-quelle.txt', { exact: true })).toBeVisible();
  await scope.getByRole('button', { name: 'e2e-quelle.txt Bereit · Text', exact: true }).click();
  if (isMobile) await page.getByRole('button', { name: 'Quellen schließen' }).click();
}

import { expect, test } from './test-fixture';
test('TXT-Import, Reload und Löschen funktionieren', async ({ page, isMobile }) => {
  const suffix = Date.now().toString(36);
  await page.goto('/');
  await page.getByText('Notebooks wechseln', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mein Notebook', exact: true })).toBeVisible();
  page.once('dialog', (d) => d.accept('Import ' + suffix));
  await page.getByRole('button', { name: '+ Notebook' }).click();
  await expect(page.locator('.topbar .notebook')).toContainText('Import ' + suffix);
  const scope = isMobile
    ? (await page.getByRole('button', { name: 'Quellen' }).click(),
      page.getByRole('dialog', { name: 'Quellen' }))
    : page;
  await scope.locator('input[type=file]').setInputFiles({
    name: 'eigene-notiz.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Eigene Quelle für den Importtest.'),
  });
  await expect(
    scope.getByRole('button', { name: 'eigene-notiz.txt Bereit · Text', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  if (isMobile) {
    await page.getByRole('button', { name: 'Quellen' }).click();
  }
  const afterReload = isMobile ? page.getByRole('dialog', { name: 'Quellen' }) : page;
  await expect(afterReload.getByText('eigene-notiz.txt')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await afterReload.getByRole('button', { name: 'eigene-notiz.txt löschen' }).click();
  await expect(afterReload.getByText('eigene-notiz.txt')).toHaveCount(0);
});

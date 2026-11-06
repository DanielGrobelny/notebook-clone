import { test, expect } from './test-fixture';
test('Upload: ehrlicher Status, Sperre, Fehler, Retry, Dedup und Auswahl', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await page.getByText('Notebooks wechseln', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mein Notebook', exact: true })).toBeVisible();
  await expect(page.locator('.disclaimer')).toContainText(
    'Lade mindestens eine Quelle hoch, um Fragen zu stellen.',
  );
  await expect(page.getByText('Quellenmodus', { exact: true })).toHaveCount(0);
  if (isMobile) await page.getByRole('button', { name: 'Quellen', exact: true }).click();
  const scope = isMobile
    ? page.getByRole('dialog', { name: 'Quellen', exact: true })
    : page.locator('.sources');
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route('**/sources', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    calls++;
    if (calls === 1) {
      await gate;
      return route.fulfill({ status: 503, json: { message: 'Test: Import nicht verfügbar.' } });
    }
    return route.continue();
  });
  await scope.locator('input[type=file]').setInputFiles({
    name: 'status.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Eine eigene Quelle für den Status-Test.'),
  });
  await expect(scope.getByRole('status')).toContainText(
    'status.txt · Wird hochgeladen und verarbeitet',
  );
  await expect(scope.getByRole('button', { name: 'Datei', exact: true })).toBeDisabled();
  await expect(scope.getByRole('button', { name: 'Text einfügen' })).toBeDisabled();
  expect(calls).toBe(1);
  await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();
  await expect(
    page.getByRole('heading', { name: 'Deine Quelle wird verarbeitet …' }),
  ).toBeVisible();
  release();
  await expect(scope.getByRole('alert')).toContainText('Test: Import nicht verfügbar.');
  await scope.getByRole('button', { name: 'Import erneut versuchen' }).click();
  await expect(scope.getByRole('status')).toContainText('Bereit und ausgewählt');
  const source = scope.getByRole('button', { name: 'status.txt Bereit · Text', exact: true });
  await expect(source).toHaveAttribute('aria-pressed', 'true');
  await scope.locator('input[type=file]').setInputFiles({
    name: 'status.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Eine eigene Quelle für den Status-Test.'),
  });
  await expect(scope.getByRole('status')).toContainText('Bereits vorhanden');
  await expect(source).toHaveCount(1);
  await expect(page.getByLabel('Frage an deine Quellen')).toBeEnabled();
  await source.click();
  await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();
  if (isMobile) await page.getByRole('button', { name: 'Quellen schließen' }).click();
  await expect(page.locator('.disclaimer')).toContainText(
    'Wähle mindestens eine vorhandene Quelle',
  );
  await expect(page.getByRole('button', { name: 'Frage senden' })).toBeDisabled();
});

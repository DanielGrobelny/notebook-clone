import { expect, test } from './test-fixture';

test('Besuchersitzung und Notebook-CRUD bleiben nach Reload erhalten', async ({ page }) => {
  const suffix = Date.now().toString(36);
  const initial = 'Visitor Notebook ' + suffix;
  const renamed = initial + ' umbenannt';

  await page.goto('/');

  await page.getByText('Notebooks wechseln', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mein Notebook', exact: true })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept(initial));
  await page.getByRole('button', { name: '+ Notebook' }).click();
  await page.getByText('Notebooks wechseln', { exact: true }).click();
  await expect(page.getByRole('button', { name: initial, exact: true })).toBeVisible();

  await page.reload();
  await page.getByText('Notebooks wechseln', { exact: true }).click();
  await expect(page.getByRole('button', { name: initial, exact: true })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept(renamed));
  await page.getByRole('button', { name: initial + ' umbenennen', exact: true }).click();
  await expect(page.getByRole('button', { name: renamed, exact: true })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: renamed + ' löschen' }).click();
  await expect(page.getByRole('button', { name: renamed, exact: true })).toHaveCount(0);
});

import { expect, test } from '@playwright/test';

test('Registrierung und Notebook-CRUD bleiben nach Reload erhalten', async ({ page }) => {
  const suffix = Date.now().toString(36);
  const email = 'dan238-ui-' + suffix + '@example.test';
  const password = 'DAN238-ui-password';
  const initial = 'DAN238 Notebook ' + suffix;
  const renamed = initial + ' umbenannt';

  await page.goto('/');
  await page.getByLabel('E-Mail').fill(email);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Registrieren' }).click();
  await expect(page.getByRole('button', { name: '+ Notebook' })).toBeVisible();

  page.once('dialog', dialog => dialog.accept(initial));
  await page.getByRole('button', { name: '+ Notebook' }).click();
  await expect(page.getByRole('button', { name: initial, exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: initial, exact: true })).toBeVisible();

  page.once('dialog', dialog => dialog.accept(renamed));
  await page.getByRole('button', { name: initial, exact: true }).click();
  await expect(page.getByRole('button', { name: renamed, exact: true })).toBeVisible();

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: renamed + ' löschen' }).click();
  await expect(page.getByRole('button', { name: renamed, exact: true })).toHaveCount(0);
});

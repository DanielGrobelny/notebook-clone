import { expect, test } from './test-fixture';

test('bootstrap retry resolves once and notebook switch discards previous selection', async ({
  page,
}) => {
  let failures = 1;
  await page.route('**/api/session', async (route) => {
    if (failures-- > 0)
      await route.fulfill({ status: 503, json: { message: 'synthetic unavailable' } });
    else await route.continue();
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Erneut versuchen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Erneut versuchen', exact: true })).toHaveCount(0);
  await expect(page.locator('.notebook-heading')).toHaveText('Mein Notebook');
  page.once('dialog', (dialog) => dialog.accept('Lifecycle empty notebook'));
  await page.getByRole('button', { name: '+ Notebook', exact: true }).click();
  await expect(page.locator('.notebook-heading')).toHaveText('Lifecycle empty notebook');
  await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();
  await expect(page.locator('.answer')).toHaveCount(0);
  await page.getByText('Notebooks wechseln', { exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Lifecycle empty notebook löschen' }).click();
  await expect(page.locator('.notebook-heading')).toHaveText('Mein Notebook');
  await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();
});

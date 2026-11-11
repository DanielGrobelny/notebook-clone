import { test, expect } from './test-fixture';
test('separate Recherche ohne Dokumente; Query-only, Inlinebeleg und Rückkehr', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();
  let payload: unknown;
  await page.route('**/api/research', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      json: {
        text: 'MDN erklärt map.',
        citations: [{ start: 0, end: 3, url: 'https://developer.mozilla.org/', title: 'MDN' }],
        sources: [{ url: 'https://developer.mozilla.org/', title: 'MDN' }],
        searched: true,
        complete: true,
      },
    });
  });
  await page.getByRole('button', { name: 'Webrecherche', exact: true }).click();
  await page.getByLabel('Öffentliche Suchfrage').fill('MDN map');
  await page.getByRole('button', { name: 'Im Web recherchieren' }).click();
  await expect(page.locator('.research-answer a')).toHaveAttribute(
    'href',
    'https://developer.mozilla.org/',
  );
  expect(payload).toEqual({ query: 'MDN map' });
  await expect(page.getByRole('heading', { name: 'Webquellen (1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Webrecherche schließen' }).click();
  await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();
  await page.getByRole('button', { name: 'Webrecherche', exact: true }).click();
  await expect(page.locator('.research-answer')).toContainText('MDN');
  await page.reload();
  await page.getByRole('button', { name: 'Webrecherche', exact: true }).click();
  await expect(page.locator('.research-answer')).toHaveCount(0);
});

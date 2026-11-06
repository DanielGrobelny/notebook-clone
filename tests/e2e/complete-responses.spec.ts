import { expect, test } from './test-fixture';
import { setupRealSource } from './real-source';
for (const limited of [false, true])
  test(
    'lange CV-Antwort ' +
      (limited ? 'Tokenlimit ehrlich' : 'vollständig') +
      ' mit Reload und Belegen',
    async ({ page, isMobile }) => {
      await setupRealSource(page, isMobile, 'synthetischer CV: TypeScript und Projektarbeit');
      await page
        .getByLabel('Frage an deine Quellen')
        .fill(
          limited
            ? 'LIMIT_CV_RESPONSE Vergleiche CV und Ausschreibung'
            : 'LONG_CV_RESPONSE Vergleiche CV und Ausschreibung',
        );
      await page.getByRole('button', { name: 'Frage senden' }).click();
      const answer = page.locator('.answer-text');
      await expect(answer).toContainText(
        limited ? 'Antwort unvollständig: Ausgabelimit erreicht' : 'ENDE DER VOLLSTÄNDIGEN ANTWORT',
      );
      await expect(answer.locator('strong').first()).toHaveText('CV und Ausschreibung');
      await expect(answer).not.toContainText('[citation:');
      await expect(answer).not.toContainText('**');
      await expect(
        answer.getByRole('button', { name: 'Beleg', exact: true }).first(),
      ).toBeVisible();
      const before = await answer.innerText();
      await page.reload();
      await expect.poll(() => answer.innerText()).toBe(before);
      await answer.getByRole('button', { name: 'Beleg', exact: true }).first().click();
      await expect(page.getByRole('dialog', { name: 'Belegpassage' })).toContainText('TypeScript');
    },
  );
for (const mode of ['ERROR', 'ABORT', 'TIMEOUT'])
  test('Teilantwort bei ' + mode + ' bleibt ehrlich nach Reload', async ({ page, isMobile }) => {
    test.setTimeout(45000);
    await setupRealSource(page, isMobile, 'synthetischer CV: TypeScript');
    await page
      .getByLabel('Frage an deine Quellen')
      .fill('STREAM_' + mode + '_CV Vergleiche Erfahrung');
    await page.getByRole('button', { name: 'Frage senden' }).click();
    await expect(page.locator('.answer-text')).toContainText('Lokale Chatantwort');
    if (mode === 'ABORT') await page.getByRole('button', { name: 'Anfrage abbrechen' }).click();
    else if (mode === 'TIMEOUT')
      await expect(page.locator('.answer-text')).toContainText(
        'Antwort unvollständig: Zeitlimit erreicht',
        { timeout: 35000 },
      );
    else
      await expect(page.locator('.answer[role=alert]')).toContainText('Teilantwort', {
        timeout: 35000,
      });
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.locator('.answer-text')).toContainText('Antwort unvollständig');
    await expect(
      page.getByRole('button', { name: 'Frage gezielter erneut stellen' }),
    ).toBeVisible();
  });

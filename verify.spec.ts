import { test, expect } from '@playwright/test';

test('verify view fire station popup', async ({ page }) => {
  // Navigate to the admin login page
  await page.goto('http://localhost:8080/admin/login');

  // Click the button to fill test credentials
  await page.getByRole('button', { name: 'Utiliser les identifiants de test' }).click();

  // Fill in the password
  await page.getByLabel('Mot de passe').fill('admin242118');

  // Click the login button
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Wait for navigation to the admin dashboard and then go to fire stations
  await page.waitForURL('http://localhost:8080/admin');
  await page.goto('http://localhost:8080/admin/fire-stations');

  // Click the view icon on the first row
  await page.locator('tbody tr:first-child td:last-child button').first().click();

  // Wait for the dialog to appear
  const dialog = page.getByRole('dialog', { name: 'Détails de la caserne' });
  await expect(dialog).toBeVisible();

  // Take a screenshot of the dialog
  await page.screenshot({ path: '/home/jules/verification/fire-station-view.png' });
});

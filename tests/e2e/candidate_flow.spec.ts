import { test, expect } from '@playwright/test';

test.describe('Candidate End-to-End Application Flow', () => {
  const timestamp = Date.now();
  const testEmail = `candidate_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Alex Thomas';

  test('completes signup -> search -> change location -> apply click -> confirm flow', async ({ page }) => {
    // 1. Navigate to landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/smart-hire/i);

    // 2. Navigate to signup
    await page.click('text=Sign up free');
    await expect(page).toHaveURL(/\/signup/);

    // Fill signup form
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Create Free Account")');

    // 3. Lands on search page
    await expect(page).toHaveURL(/\/app\/search/);
    await expect(page.locator('input[placeholder*="Job title, skill"]')).toBeVisible();

    // 4. Search and change location
    const locationInput = page.locator('input[placeholder*="City, state"]');
    await locationInput.click();
    await locationInput.fill('Bengaluru');
    
    // Select Bengaluru option from combobox
    const option = page.locator('div[role="option"]:has-text("Bengaluru")').first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    // 5. Verify results updated for location
    await expect(page.locator('text=jobs found').first()).toBeVisible();

    // 6. Click apply on the first job
    const applyButton = page.locator('button:has-text("Apply on")').first();
    await expect(applyButton).toBeVisible();
    await applyButton.click();

    // 7. Verify confirmation modal appears
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Did you submit your application?')).toBeVisible();

    // 8. Confirm application
    await modal.locator('button:has-text("Yes, I Applied")').click();

    // Verify modal dismissed and confirmation toast appears
    await expect(modal).not.toBeVisible();
    await expect(page.locator('text=Application confirmed')).toBeVisible();
  });
});


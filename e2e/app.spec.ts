import { test, expect, Page } from '@playwright/test';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Helper to upload an image
async function uploadImage(page: Page, filename: string) {
  const filePath = path.join(FIXTURES_DIR, filename);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

// Helper to wait for processing to complete
async function waitForProcessingComplete(page: Page) {
  const processingText = page.getByText('Processing image...');
  const isProcessing = await processingText.isVisible().catch(() => false);

  if (isProcessing) {
    await expect(processingText).toBeHidden({ timeout: 30000 });
  }
}

test.describe('Image to Clicker E2E', () => {
  test('page loads with all sections visible', async ({ page }) => {
    await page.goto('/');

    // Main heading
    await expect(page.getByRole('heading', { name: 'Image to Clicker' })).toBeVisible();

    // All workflow sections
    await expect(page.getByText('1. Upload Image')).toBeVisible();
    await expect(page.getByText('2. Processing Mode')).toBeVisible();
    await expect(page.getByText('3. Switch Type')).toBeVisible();
    await expect(page.getByText('4. Size & Thickness')).toBeVisible();
    await expect(page.getByText('5. Export STL Files')).toBeVisible();

    // Upload zone is immediately available (no waiting for OpenCV)
    await expect(page.getByText('Drag & drop an image here')).toBeVisible();

    // Export buttons disabled initially
    await expect(page.getByRole('button', { name: 'Export Both' })).toBeDisabled();
  });

  test('full workflow: upload image and export STL', async ({ page }) => {
    await page.goto('/');

    // Upload should work immediately (using lightweight fallback)
    await uploadImage(page, 'circle.png');

    // Verify upload succeeded
    await expect(page.locator('img[alt="Uploaded image"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Change Image' })).toBeVisible();

    // Wait for processing (uses lightweight contour extraction)
    await waitForProcessingComplete(page);

    // May show fallback warning
    const fallbackWarning = page.getByText('Using quick processing mode');
    // Don't assert on this - it depends on whether OpenCV loaded yet

    // Export should become available
    await expect(page.getByRole('button', { name: 'Export Both' })).toBeEnabled({ timeout: 20000 });

    // Test download works
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.getByRole('button', { name: 'Bottom STL' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('bottom.stl');
  });
});

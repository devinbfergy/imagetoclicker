import { test, expect, Page } from '@playwright/test';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Helper to wait for OpenCV to load - reduced timeout
async function waitForOpenCVReady(page: Page) {
  // First check if the loading message exists
  const loadingText = page.getByText('Loading image processing library');
  const isLoading = await loadingText.isVisible().catch(() => false);

  if (isLoading) {
    await expect(loadingText).toBeHidden({ timeout: 60000 });
  }
}

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

// Use serial mode to share page state between tests in each describe block
test.describe.configure({ mode: 'serial' });

test.describe('Image to Clicker App', () => {
  test.describe('Page Load', () => {
    test('should display the main heading and settings', async ({ page }) => {
      await page.goto('/');

      // Check main heading
      await expect(page.getByRole('heading', { name: 'Image to Clicker' })).toBeVisible();

      // Check all settings sections
      await expect(page.getByText('1. Upload Image')).toBeVisible();
      await expect(page.getByText('2. Processing Mode')).toBeVisible();
      await expect(page.getByText('3. Switch Type')).toBeVisible();
      await expect(page.getByText('4. Size & Thickness')).toBeVisible();
      await expect(page.getByText('5. Export STL Files')).toBeVisible();

      // Check preview section
      await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible();
    });

    test('should show upload drop zone', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('Drag & drop an image here')).toBeVisible();
      await expect(page.getByText('PNG, JPG, SVG supported')).toBeVisible();
    });

    test('should show processing mode options', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('Alpha Channel')).toBeVisible();
      await expect(page.getByText('Threshold')).toBeVisible();
    });

    test('should show switch type options', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('button', { name: /Cherry MX/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Kailh Choc/i })).toBeVisible();
    });

    test('should have disabled export buttons initially', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('button', { name: 'Bottom STL' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Top STL' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Export Both' })).toBeDisabled();
    });
  });

  test.describe('Image Upload Workflow', () => {
    test('should upload image and process it', async ({ page }) => {
      await page.goto('/');
      await waitForOpenCVReady(page);

      // Upload the circle image
      await uploadImage(page, 'circle.png');

      // Should show the uploaded image
      await expect(page.locator('img[alt="Uploaded image"]')).toBeVisible({ timeout: 10000 });

      // Should show "Click or drag to replace" text
      await expect(page.getByText('Click or drag to replace')).toBeVisible();

      // Should show "Change Image" button
      await expect(page.getByRole('button', { name: 'Change Image' })).toBeVisible();

      // Wait for processing to complete
      await waitForProcessingComplete(page);

      // Wait for plates to generate (export buttons should become enabled)
      await expect(page.getByRole('button', { name: 'Export Both' })).toBeEnabled({ timeout: 15000 });
    });

    test('should switch to threshold mode', async ({ page }) => {
      await page.goto('/');
      await waitForOpenCVReady(page);

      // Click on threshold option
      await page.getByText('Threshold').first().click();

      // Should show threshold slider
      await expect(page.getByText(/Threshold: \d+/)).toBeVisible();
    });

    test('should switch between switch types', async ({ page }) => {
      await page.goto('/');

      // Default should be Cherry MX
      const mxButton = page.getByRole('button', { name: /Cherry MX/i });
      await expect(mxButton).toHaveAttribute('aria-pressed', 'true');

      // Click Kailh Choc
      await page.getByRole('button', { name: /Kailh Choc/i }).click();

      // Should now be selected
      const chocButton = page.getByRole('button', { name: /Kailh Choc/i });
      await expect(chocButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Full Workflow', () => {
    test('should complete upload -> process -> export workflow', async ({ page }) => {
      await page.goto('/');
      await waitForOpenCVReady(page);

      // Upload image
      await uploadImage(page, 'circle.png');

      // Verify preview is shown
      await expect(page.locator('img[alt="Uploaded image"]')).toBeVisible({ timeout: 10000 });

      // Wait for processing
      await waitForProcessingComplete(page);

      // Change switch type
      await page.getByRole('button', { name: /Kailh Choc/i }).click();

      // Wait for export to be available
      await expect(page.getByRole('button', { name: 'Export Both' })).toBeEnabled({ timeout: 15000 });

      // Test download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await page.getByRole('button', { name: 'Bottom STL' }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('bottom.stl');
    });
  });
});

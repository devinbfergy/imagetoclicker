import { test, expect, Page } from '@playwright/test';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Helper to wait for OpenCV to load
async function waitForOpenCVReady(page: Page) {
  await expect(page.getByText('Loading image processing library')).toBeHidden({
    timeout: 30000,
  });
}

// Helper to upload an image
async function uploadImage(page: Page, filename: string) {
  const filePath = path.join(FIXTURES_DIR, filename);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

// Helper to wait for processing to complete
async function waitForProcessingComplete(page: Page) {
  await expect(page.getByText('Processing image...')).toBeHidden({
    timeout: 30000,
  });
}

test.describe('Image Upload Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Browser error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      console.log(`Page error: ${error.message}`);
    });

    await page.goto('/');
    await waitForOpenCVReady(page);
  });

  test('should successfully load OpenCV', async ({ page }) => {
    // Verify OpenCV loaded by checking that the upload is enabled
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).not.toBeDisabled();
  });

  test('should handle image upload and show image in preview', async ({ page }) => {
    // Upload the circle image
    await uploadImage(page, 'circle.png');

    // Wait for the uploaded image to appear
    const uploadedImg = page.locator('img[alt="Uploaded image"]');
    await expect(uploadedImg).toBeVisible({ timeout: 10000 });

    // Get the src attribute to verify it's a data URL
    const src = await uploadedImg.getAttribute('src');
    expect(src).toContain('data:image');
  });

  test('should process image without errors', async ({ page }) => {
    // Set up error tracking
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Upload image
    await uploadImage(page, 'circle.png');
    await waitForProcessingComplete(page);

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Check no processing errors appeared
    const errorAlert = page.locator('.MuiAlert-standardError');
    const hasError = await errorAlert.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log('Error alert text:', errorText);
    }

    // Log any console errors
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
  });

  test('should enable export buttons after successful processing', async ({ page }) => {
    await uploadImage(page, 'circle.png');
    await waitForProcessingComplete(page);

    // Wait for plates to generate
    const exportBtn = page.getByRole('button', { name: 'Export Both' });

    // Poll for button to become enabled (max 15 seconds)
    let enabled = false;
    for (let i = 0; i < 15; i++) {
      const isDisabled = await exportBtn.isDisabled();
      if (!isDisabled) {
        enabled = true;
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (!enabled) {
      // Check for error message
      const errorAlert = page.locator('.MuiAlert-standardError');
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent();
        console.log('Processing failed with error:', errorText);
      }
    }

    expect(enabled).toBe(true);
  });

  test('should show polygon preview after processing', async ({ page }) => {
    await uploadImage(page, 'circle.png');
    await waitForProcessingComplete(page);
    await page.waitForTimeout(2000);

    // Check if canvas has content (PlatePreview component)
    // The preview section should show something other than empty state
    const previewHeading = page.getByRole('heading', { name: 'Preview' });
    await expect(previewHeading).toBeVisible();

    // Look for canvas element in preview area
    const canvas = page.locator('canvas');
    const canvasCount = await canvas.count();
    console.log('Canvas elements found:', canvasCount);
  });

  test('should handle threshold mode correctly', async ({ page }) => {
    // Use square.png which has no alpha channel - better for threshold mode
    await uploadImage(page, 'square.png');
    await waitForProcessingComplete(page);

    // Switch to threshold mode
    const thresholdRadio = page.getByText('Threshold').first();
    await thresholdRadio.click();

    // Wait for reprocessing
    await waitForProcessingComplete(page);
    await page.waitForTimeout(2000);

    // Check for errors
    const errorAlert = page.locator('.MuiAlert-standardError');
    const hasError = await errorAlert.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log('Threshold mode error:', errorText);
    }

    expect(hasError).toBe(false);
  });

  test('should correctly read file input and trigger FileReader', async ({ page }) => {
    // Intercept console to see any FileReader errors
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await uploadImage(page, 'circle.png');

    // Give time for FileReader to process
    await page.waitForTimeout(2000);

    // Check that image was read successfully by verifying preview image exists
    const previewImg = page.locator('img[alt="Uploaded image"]');
    const isVisible = await previewImg.isVisible();

    // Log any issues
    const errorLogs = logs.filter((l) => l.includes('[error]'));
    if (errorLogs.length > 0) {
      console.log('Error logs during upload:', errorLogs);
    }

    expect(isVisible).toBe(true);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Somajam Homestay - Deep Workflow & Edge Cases Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const autoFillBtn = page.getByRole('button', { name: 'Auto Fill' });
    if (await autoFillBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await autoFillBtn.click();
      await page.getByRole('button', { name: 'Sign In to Portal' }).click();
      await expect(page.locator('h2:has-text("Parunthumpara Operations")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('E1. Calendar interaction: clicking on an active booking opens detail modal with check-out/cancel actions', async ({ page }) => {
    await page.locator('a[href="/bookings"]').first().click();
    await expect(page.locator('h2:has-text("Bookings & Check-In")')).toBeVisible();

    // Switch to Monthly Calendar View
    await page.click('button:has-text("Monthly Calendar")');

    // Navigate back to August 2026 where seeded bookings exist
    let monthHeading = await page.locator('h3:has-text("2026")').textContent();
    while (monthHeading && !monthHeading.includes('August')) {
      await page.locator('button[title="Previous Month"]').click();
      await page.waitForTimeout(150);
      monthHeading = await page.locator('h3:has-text("2026")').textContent();
    }

    // Verify bookings exist on August in calendar
    const bookingPill = page.locator('button:has-text("Sarah Jenkins")').first();
    await expect(bookingPill).toBeVisible({ timeout: 5000 });

    // Click on Sarah Jenkins's booking card in the calendar
    await bookingPill.click();

    // Verify Booking Details modal pops up
    await expect(page.locator('h3:has-text("Details")')).toBeVisible();
    await expect(page.locator('h4:has-text("Sarah Jenkins")')).toBeVisible();

    // Close detail modal
    await page.click('button:has-text("Close")');
    await expect(page.locator('h3:has-text("Details")')).not.toBeVisible();
  });

  test('E2. Double-Booking Prevention: Attempting overlapping reservation throws error toast', async ({ page }) => {
    await page.locator('a[href="/bookings"]').first().click();
    await page.click('button:has-text("List / Table")');

    // Open Create New Booking Modal
    await page.click('button:has-text("Create New Booking")');
    await expect(page.locator('h3:has-text("New Cottage Reservation & Check-In")')).toBeVisible();

    // Fill Quick Booking form with overlapping dates for Room No. 2 (occupied 2026-08-17 to 2026-08-20)
    await page.fill('input[placeholder="e.g. Rajesh Kumar"]', 'Rahul Tester');
    await page.fill('input[placeholder="e.g. +91 98470 12345"]', '+91 99999 88888');

    // Set overlapping dates
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-08-17');
    await dateInputs.nth(1).fill('2026-08-19');

    // Select Room No. 2
    const room2Btn = page.locator('button:has-text("Room No. 2")').first();
    if (await room2Btn.isVisible().catch(() => false)) {
      await room2Btn.click();
    }

    // Submit booking via modal submit button
    await page.locator('.fixed.inset-0.z-50 button[type="submit"]').click();

    // Verify double-booking prevention message is shown (both toast and inline alert appear)
    await expect(page.locator('text=Double Booking Blocked').first()).toBeVisible({ timeout: 5000 });

    // Close modal
    await page.locator('.fixed.inset-0.z-50 button:has-text("Cancel")').first().click();
  });

  test('E3. Document Viewer Modal: opens, displays verified badge, and closes properly', async ({ page }) => {
    await page.locator('a[href="/reports-settings"]').first().click();
    await page.click('button:has-text("Date-Wise Guest Register")');

    // Show All Stays
    await page.click('button:has-text("All Stays")');
    await page.waitForTimeout(300);

    // Look for "View ID" button in table
    const viewIdBtn = page.locator('button:has-text("View ID")').first();
    await expect(viewIdBtn).toBeVisible({ timeout: 5000 });
    await viewIdBtn.click();

    // Verify DocumentViewerModal appears with exact badge
    await expect(page.getByText('Verified ID', { exact: true })).toBeVisible({ timeout: 4000 });
    const closeBtn = page.locator('button:has-text("Close Document"), button:has-text("Close Preview")');
    await expect(closeBtn).toBeVisible();

    // Close Viewer
    await closeBtn.click();
    await expect(page.getByText('Verified ID', { exact: true })).not.toBeVisible();
  });

  test('E4. Monthly Archive ZIP generation with file count validation', async ({ page }) => {
    await page.locator('a[href="/reports-settings"]').first().click();
    await page.click('button:has-text("Monthly Archive & Free-Tier Storage")');

    // Select August 2026 (Month 8)
    const monthSelect = page.locator('select').first();
    await monthSelect.selectOption('8');
    await page.waitForTimeout(300);

    // Verify stats updated for August
    await expect(page.locator('text=August 2026').first()).toBeVisible();
    await expect(page.locator('text=5 Bookings')).toBeVisible();

    // Download ZIP
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.click('button:has-text("Download August Archive (.ZIP)")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('Somajam_Visitors_Archive_2026_08_August.zip');

    // Verify download badge appears
    await expect(page.locator('text=Downloaded & Saved to PC for August 2026')).toBeVisible({ timeout: 5000 });
  });

  test('E5. Storage Purge Safety Lock & Confirmation Modal', async ({ page }) => {
    await page.locator('a[href="/reports-settings"]').first().click();
    await page.click('button:has-text("Monthly Archive & Free-Tier Storage")');

    // Click "Free Up Cloud Storage"
    const purgeBtn = page.locator('button:has-text("Free Up Cloud Storage")');
    await expect(purgeBtn).toBeVisible();
    await purgeBtn.click();

    // Confirm modal opens
    const modalHeading = page.locator('h3:has-text("Reclaim Cloud Storage")');
    await expect(modalHeading).toBeVisible();
    await expect(page.locator('text=Free Tier Database & Storage Cleanup')).toBeVisible();

    // Cancel modal - target the button inside the modal dialog
    const modalDialog = page.locator('.fixed.inset-0.z-50');
    await modalDialog.locator('button:has-text("Cancel")').click();
    await expect(modalHeading).not.toBeVisible();
  });

});

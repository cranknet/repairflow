import { test, expect } from '@playwright/test';

test.describe('Ticket Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to login and authenticate
        await page.goto('/login');
        // TODO: Add authentication steps
    });

    test('should create a new ticket successfully', async ({ page }) => {
        // Navigate to new ticket page
        await page.goto('/tickets/new');

        // Fill in customer information
        await page.fill('[name="customerName"]', 'Test Customer');
        await page.fill('[name="customerPhone"]', '123-456-7890');

        // Fill in device information
        await page.fill('[id="deviceBrand"]', 'Apple');
        await page.fill('[id="deviceModel"]', 'iPhone 13');
        await page.fill('[name="deviceIssue"]', 'Screen replacement');

        // Fill in pricing
        await page.fill('[name="estimatedPrice"]', '299');

        // Submit the form
        await page.click('button[type="submit"]');

        // Verify success
        await expect(page.locator('text=Ticket created successfully')).toBeVisible({
            timeout: 5000
        });
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
        await page.goto('/tickets/new');

        // Try to submit without filling required fields
        await page.click('button[type="submit"]');

        // Verify validation messages appear
        await expect(page.locator('text=/required/i')).toBeVisible();
    });

    test('should filter customers by search term', async ({ page }) => {
        await page.goto('/tickets/new');

        // Type in customer search
        const customerInput = page.locator('[name="customerSearch"]');
        await customerInput.fill('John');

        // Verify dropdown appears with filtered results
        await expect(page.locator('[role="listbox"]')).toBeVisible();
    });
});

test.describe('Ticket List', () => {
    test('should display tickets and allow filtering', async ({ page }) => {
        await page.goto('/tickets');

        // Verify tickets are displayed
        await expect(page.locator('[data-testid="ticket-row"]').first()).toBeVisible();

        // Test search functionality
        await page.fill('[placeholder*="Search"]', 'iPhone');
        await page.waitForTimeout(500); // Wait for debounce

        // Verify filtered results
        const tickets = await page.locator('[data-testid="ticket-row"]').count();
        expect(tickets).toBeGreaterThan(0);
    });
});

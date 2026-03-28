import { test, expect } from '@playwright/test';

test('KCS WMS 로그인 페이지 표시', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/login/);
  await page.screenshot({ path: 'tests/screenshots/login.png' });
});

test('KCS WMS 로그인 후 대시보드 이동', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', 'admin@kcs.com');
  await page.fill('input[type="password"], input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
  await page.screenshot({ path: 'tests/screenshots/dashboard.png' });
});

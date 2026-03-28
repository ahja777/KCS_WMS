import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3200',
    headless: false,
    channel: 'chromium',
  },
  timeout: 60000,
});

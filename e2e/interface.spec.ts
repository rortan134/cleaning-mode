/* eslint-disable no-console */
import {
  test,
  expect,
  _electron as electron,
  Page,
  ElectronApplication,
} from '@playwright/test';
import path from 'path';

test.describe.serial(() => {
  let page: Page;
  let electronApp: ElectronApplication;
  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [
        path.join(__dirname, '..', 'release', 'app', 'dist', 'main', 'main.js'),
      ],
    });
    page = await electronApp.firstWindow();
    // Direct Electron console to Node terminal.
    page.on('console', console.log);
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Electron App has the correct buttons on it', async () => {
    // Evaluation expression in the Electron context.
    const appPath = await electronApp.evaluate(async ({ app }) => {
      // This runs in the main Electron process, parameter here is always
      // the result of the require('electron') in the main app script.
      return app.getAppPath();
    });
    console.log(appPath);

    // Print the title.
    console.log(await page.title());

    await expect(page.locator('text=Cleaning Mode')).toBeVisible();
    await expect(page.locator('text=Ready to clean?')).toBeVisible();
    await expect(page.locator('text=Activate')).toBeVisible();
  });
});

/* eslint-disable no-console */
// https://github.com/spaceagetv/electron-playwright-example/blob/master/e2e-tests/main.spec.ts

import path from 'path';

import {
  test,
  expect,
  _electron as electron,
  Page,
  ElectronApplication,
} from '@playwright/test';
import clickMenuItemById from './helpers';

test.describe.serial(() => {
  let electronApp: ElectronApplication;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [
        path.join(__dirname, '..', 'release', 'app', 'dist', 'main', 'main.js'),
      ],
    });

    electronApp.on('window', async (page) => {
      const filename = page.url()?.split('/').pop();
      console.log(`Window opened: ${filename}`);

      // capture errors
      page.on('pageerror', (error) => {
        console.error(error);
      });
      // capture console messages
      page.on('console', (msg) => {
        console.log(msg.text());
      });
    });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  let window: Page;

  // test('Clicking on tray triggers IPC opening slide animation', async () => {
  //   electronApp.evaluate(({ ipcRenderer }) => {
  //     ipcRenderer.emit('show');
  //   });
  //   const newwindow = await electronApp.waitForEvent('window');
  //   expect(newwindow).toBeTruthy();
  //   expect(await newwindow.title()).toBe('Window 3');
  //   window = newwindow;
  // });

  test('Tray interface renders correctly', async () => {
    await clickMenuItemById(electronApp, 'open-menu-option');
    const newWindow = await electronApp.waitForEvent('window');
    window = newWindow;
    expect(window).toBeTruthy();
    expect(await window.title()).toBe('Cleaning Mode');

    await window.waitForSelector('h1');
    const text = await window.$eval('h1', (el) => el.textContent);
    expect(text).toBe('Cleaning Mode');

    await expect(window.locator('text=Ready to clean?')).toBeVisible();
    await expect(window.locator('text=Activate')).toBeVisible();
  });

  test('Activate button creates new backdrop window', async () => {
    await window.click('#activate-mode');
    const newWindow = await electronApp.waitForEvent('window');
    expect(newWindow).toBeTruthy();
    window = newWindow;
  });

  test('Backdrop window renders correctly', async () => {
    const title = await window.title();
    expect(title).toBe('Backdrop');

    await expect(window.locator('text=You are free to clean.')).toBeVisible();
  });

  /* todo:
  - test color scheme?
  - test winapi taskbar behavior (if it )
  */
});

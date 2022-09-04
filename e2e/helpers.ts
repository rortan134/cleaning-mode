import { ElectronApplication } from '@playwright/test';

/**
 * Get a given attribute the MenuItem with the given id.
 *
 * @category Menu
 *
 * @param electronApp {ElectronApplication} - the Electron application object (from Playwright)
 * @param menuId {string} - the id of the MenuItem to retrieve the attribute from
 * @param attribute {string} - the attribute to retrieve
 * @returns {Promise<string>}
 * @fulfil {string} resolves with the attribute value
 */
export default function clickMenuItemById(
  electronApp: ElectronApplication,
  id: string
): Promise<unknown> {
  return electronApp.evaluate(({ Menu }, menuId) => {
    const menu = Menu.getApplicationMenu();
    if (!menu) {
      throw new Error('No application menu found');
    }
    const menuItem = menu.getMenuItemById(menuId);
    if (menuItem) {
      return menuItem.click();
    }
    throw new Error(`Menu item with id ${menuId} not found`);
  }, id);
}

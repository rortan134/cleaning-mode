/* eslint global-require: off, no-console: off, promise/always-return: off */
/**
 * Electron's main process.
 */

import os from 'os';
import path from 'path';
import {
  app,
  shell,
  ipcMain,
  Menu,
  systemPreferences,
  BrowserWindow,
  screen,
} from 'electron';
import { Menubar, menubar } from 'menubar';

import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';
import { User32 } from 'win32-api';
import { resolveHtmlPath } from './util';

const Struct = require('ref-struct-di')(ref);

const is64bit = os.arch() === 'x64';
const user32 = User32.load();

// Winapi Types
const LONG = is64bit ? ref.types.long : ref.types.int32;
const ULONG = is64bit ? ref.types.ulong : ref.types.uint32;
const INT = ref.types.int;
const UINT = ref.types.uint;
const DWORD = ref.types.uint32; // DWORD always is unsigned 32-bit
const BOOL = ref.types.bool;

const HANDLE = is64bit ? ref.types.uint64 : ref.types.uint32;
const HHOOK = HANDLE;
const HWND = HANDLE;
const HINSTANCE = HANDLE;

const WPARAM = is64bit ? ref.types.uint64 : ref.types.uint32; // typedef UINT_PTR, uint32(x86) or uint64(64)
const LPARAM = is64bit ? ref.types.int64 : ref.types.int32; // typedef LONG_PTR, int32(x86) or int64(64)
const LRESULT = is64bit ? ref.types.int64 : ref.types.int32; // typedef LONG_PTR

const HOOKPROC = 'pointer';

// Structures
const RECT = Struct({
  left: LONG,
  top: LONG,
  right: LONG,
  bottom: LONG,
});

const APPBARDATA = Struct({
  cbSize: DWORD,
  hWnd: WPARAM,
  uCallbackMessage: DWORD,
  uEdge: DWORD,
  rc: RECT,
  lParam: DWORD,
});

enum AppBarStates {
  AutoHide = 0x01,
  AlwaysOnTop = 0x02,
}

enum AppBarMessages {
  New = 0x00,
  Remove = 0x01,
  QueryPos = 0x02,
  SetPos = 0x03,
  GetState = 0x04,
  GetTaskBarPos = 0x05,
  Activate = 0x06,
  GetAutoHideBar = 0x07,
  SetAutoHideBar = 0x08,
  WindowPosChanged = 0x09,
  SetState = 0x0a,
}

const shellapi = ffi.Library('shell32.dll', {
  SHAppBarMessage: [DWORD, [INT, HOOKPROC]],
});

const hTaskbarWndBuf =
  Buffer.from('System_TrayWnd\0', 'ucs2') ||
  Buffer.from('Shell_TrayWnd\0', 'ucs2');

function setTaskbarState(option: AppBarStates) {
  const hTaskbarWnd = user32.FindWindowExW(0, 0, hTaskbarWndBuf, null);

  const msgData = new APPBARDATA();
  msgData.cbSize = APPBARDATA.size;
  msgData.hWnd = hTaskbarWnd;
  msgData.lParam = option;
  shellapi.SHAppBarMessage(AppBarMessages.SetState, msgData.ref());
}

function getTaskbarState() {
  const hTaskbarWnd = user32.FindWindowExW(0, 0, hTaskbarWndBuf, null);

  const msgData = new APPBARDATA();
  msgData.cbSize = APPBARDATA.size;
  msgData.hWnd = hTaskbarWnd;
  return shellapi.SHAppBarMessage(AppBarMessages.GetState, msgData.ref());
}

function lockTaskbarWithAutohide() {
  if (getTaskbarState() === AppBarStates.AlwaysOnTop) return; // if doesnt have autohide on
  setTaskbarState(AppBarStates.AlwaysOnTop);
}

function unlockTaskbarWithAutohide() {
  if (getTaskbarState() === AppBarStates.AlwaysOnTop) return; // if doesnt have autohide on
  setTaskbarState(AppBarStates.AutoHide);
}

let mainWindow: Menubar | null = null;
let backdropWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

/**
 * Windows color scheme
 * https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesgetcolorcolor-windows-macos
 */
const wndColors = {
  tdDarkShadow: systemPreferences.getColor('3d-dark-shadow'),
  tdFace: systemPreferences.getColor('3d-face'),
  tdHighlight: systemPreferences.getColor('3d-highlight'),
  tdLight: systemPreferences.getColor('3d-light'),
  tdShadow: systemPreferences.getColor('3d-shadow'),
  activeCaption: systemPreferences.getColor('active-caption'),
  appWorkspace: systemPreferences.getColor('app-workspace'),
  buttonText: systemPreferences.getColor('button-text'),
  captionText: systemPreferences.getColor('caption-text'),
  desktop: systemPreferences.getColor('desktop'),
  disabledText: systemPreferences.getColor('disabled-text'),
  highlight: systemPreferences.getColor('highlight'),
  highlightText: systemPreferences.getColor('highlight-text'),
  hotlight: systemPreferences.getColor('hotlight'),
  inactiveBorder: systemPreferences.getColor('inactive-border'),
  inactiveCaption: systemPreferences.getColor('inactive-caption'),
  infoBackground: systemPreferences.getColor('info-background'),
  infoText: systemPreferences.getColor('info-text'),
  menu: systemPreferences.getColor('menu'),
  menuHighlight: systemPreferences.getColor('menu-highlight'),
  menubar: systemPreferences.getColor('menubar'),
  menuText: systemPreferences.getColor('menu-text'),
  scrollbar: systemPreferences.getColor('scrollbar'),
  window: systemPreferences.getColor('window'),
  windowFrame: systemPreferences.getColor('window-frame'),
  windowText: systemPreferences.getColor('window-text'),
} as const;

ipcMain.on('get-colors', async (event, arg) => {
  event.reply('get-colors', [wndColors]);
});

const contextMenu = Menu.buildFromTemplate([
  {
    label: 'Open',
    click: () => {
      mainWindow?.showWindow();
    },
    type: 'normal',
  },
  {
    label: 'Quit',
    click: () => {
      app.quit();
    },
    type: 'normal',
  },
]);

function activateBackdrop() {
  if (!backdropWindow) {
    throw new Error('Backdrop window is not defined');
  }

  backdropWindow.setKiosk(true);
  backdropWindow.maximize();
  backdropWindow.show();
  backdropWindow.moveTop();
  backdropWindow.setFullScreen(true);
  backdropWindow.focus();
}

function hideBackdrop() {
  backdropWindow?.minimize();
  backdropWindow?.hide();
}

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = menubar({
    index: resolveHtmlPath('index.html'),
    icon: getAssetPath('icon.png'),
    preloadWindow: true,
    windowPosition: 'trayRight',
    showDockIcon: false,
    browserWindow: {
      width: 350,
      height: 215,
      frame: false,
      skipTaskbar: true,
      resizable: false,
      transparent: true,
      minimizable: false,
      alwaysOnTop: true,
      title: 'Cleaning Mode',
      titleBarStyle: 'hidden',
      webPreferences: {
        backgroundThrottling: false,
        sandbox: false,
        devTools: !app.isPackaged,
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
      },
    },
  });

  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  backdropWindow = new BrowserWindow({
    x: externalDisplay?.bounds.x ?? 0,
    y: externalDisplay?.bounds.y ?? 0,
    frame: false,
    show: false,
    skipTaskbar: true,
    resizable: false, // needed to maximize to full screen width
    transparent: true,
    minimizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    kiosk: true,
    titleBarStyle: 'hidden',
    icon: getAssetPath('icon.png'),
    webPreferences: {
      sandbox: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  backdropWindow.loadURL(resolveHtmlPath('backdrop.html'));

  /**
   * Event listeners...
   */
  mainWindow.on('after-create-window', () => {
    const window = mainWindow?.window;
    const tray = mainWindow?.tray;
    mainWindow?.app.commandLine.appendSwitch(
      'disable-backgrounding-occluded-windows',
      'true'
    );
    // mainWindow?.app.commandLine.appendSwitch('wm-window-animations-disabled');

    if (!window || !tray) {
      throw new Error('window is not defined');
    }

    tray.setContextMenu(contextMenu); // attach context menu
    tray.setToolTip('Cleaning Mode (Click to open)');

    // Open urls in the user's browser
    window.webContents.setWindowOpenHandler((edata: { url: string }) => {
      shell.openExternal(edata.url);
      return { action: 'deny' };
    });

    mainWindow?.on('show', () => {
      window.webContents.send('show'); // trigger animation
      lockTaskbarWithAutohide(); // reposition
    });

    mainWindow?.on('focus-lost', () => {
      window.webContents.send('hide');
      unlockTaskbarWithAutohide();

      setTimeout(() => {
        // wait for hiding animation to complete
        mainWindow?.hideWindow();
      }, 100);
    });
  });

  backdropWindow.on('blur', () => {
    hideBackdrop();

    // update renderer state indicating window has closed
    // mainly used to update the ActivateBtn state
    mainWindow?.window?.webContents.send('activate', [false]);
  });

  backdropWindow.on('close', () => {
    backdropWindow = null;
  });

  mainWindow.on('after-close', () => {
    mainWindow = null;
  });
};

const appFolder = path.dirname(process.execPath);
const updateExe = path.resolve(appFolder, '..');
const exeName = path.basename(process.execPath);

app.setLoginItemSettings({
  openAtLogin: true,
  path: updateExe,
  args: [
    '--processStart',
    `"${exeName}"`,
    '--process-start-args',
    `"--hidden"`,
  ],
});

/**
 * Global Event listeners...
 */

ipcMain.on('activate', (arg, val: boolean[]) => {
  // send message current state to backdrop window
  backdropWindow?.webContents.send('backdrop', [val[0]]);

  if (val[0] === true) {
    // if button is active
    activateBackdrop();
  } else {
    hideBackdrop();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
  })
  .catch(console.log);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

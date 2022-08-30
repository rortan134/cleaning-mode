import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'get-colors' | 'activate' | 'backdrop';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
});

ipcRenderer.on('show', () => {
  const root = document.getElementById('root') as HTMLElement;
  root.style.animation =
    'show 0.25s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
});

ipcRenderer.on('hide', () => {
  const root = document.getElementById('root') as HTMLElement;
  root.style.animation =
    'hide 0.1s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
});

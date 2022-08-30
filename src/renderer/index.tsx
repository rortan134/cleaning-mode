import { SystemPreferences } from 'electron';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  createRoot(container).render(<App />);
}

// Get system color scheme
type GetColorParams = Parameters<SystemPreferences['getColor']>;
type Colors = GetColorParams[0];

window.electron.ipcRenderer.once('get-colors', (args) => {
  const root = document.documentElement;
  const colors = args as Record<string, Colors>;

  Object.values(colors[0]).forEach((value, i) => {
    // insert as css variables
    root.style.setProperty(`--${Object.keys(colors[0])[i]}`, value);
  });
});

window.electron.ipcRenderer.sendMessage('get-colors', []);

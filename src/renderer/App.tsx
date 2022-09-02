import { PropsWithChildren, useEffect, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import settingsIcon from '../../assets/settings.svg';
import cleanIcon from '../../assets/clean.svg';
import './App.css';

const Toolbar = () => {
  return (
    <div className="clean-toolbar">
      <button type="button">
        <img height={12} width={12} src={settingsIcon} alt="Settings" />
      </button>
    </div>
  );
};

const Layout = (props: PropsWithChildren) => {
  const { children } = props;

  return (
    <div className="clean-container noselect">
      <div className="clean-background" />
      <Toolbar />
      <div className="clean-wrapper" id="clean-content">
        {children}
      </div>
    </div>
  );
};

const Head = () => {
  return (
    <section className="clean-head">
      <div className="clean-headline">
        <img className="noselect" height={56} width={56} src={icon} alt="" />
        <h1>Cleaning Mode</h1>
      </div>
    </section>
  );
};

const Subtitle = () => {
  return (
    <div className="clean-subtitle">
      <span>Ready to clean?</span>
      <p>
        This tool helps you stop unwanted keyboard presses or touch actions
        while cleaning your keyboard or screen.
      </p>
    </div>
  );
};

const ActivateBtn = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('activate', [active]);
    window.electron.ipcRenderer.on('activate', (value) => {
      const state = (value as boolean[])[0];

      if (state !== active) {
        // state mismatch, which means the window has closed
        setActive(state);
      }
    });
  }, [active]);

  const toggleState = () => setActive((prev) => !prev);

  return (
    <button
      type="button"
      className={`clean-activate-mode ${active ? 'active' : ''}`}
      onClick={toggleState}
    >
      <img height={15} width={15} src={cleanIcon} alt="Activate" />
      <span>Activate</span>
    </button>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Head />
              <Subtitle />
              <ActivateBtn />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

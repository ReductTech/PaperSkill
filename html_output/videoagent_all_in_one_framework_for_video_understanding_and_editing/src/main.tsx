import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/components.css';
import './styles/paper.css';
import { EditingSessionProvider } from './lib/EditingSession';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <EditingSessionProvider><App /></EditingSessionProvider>
  </React.StrictMode>
);

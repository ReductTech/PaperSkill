import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/paper-tokens.css';
import './styles/base.css';
import './styles/modules.css';
import './styles/reference-shell.css';
import './styles/ppt-mode.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

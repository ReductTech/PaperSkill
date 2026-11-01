import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/reference-tokens.css';
import './styles/reference-components.css';
import './styles/ppt-mode.css';
import './styles/interactions.css';
import './styles/paper.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

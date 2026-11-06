import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/paper.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/lenswalk.css';
import './styles/reference-migration.css';
import './styles/learning-module.css';
import './styles/hero-comparison.css';
import './styles/sidebar-restore.css';
import './styles/foundation-lessons.css';
import './styles/inspatio-source.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

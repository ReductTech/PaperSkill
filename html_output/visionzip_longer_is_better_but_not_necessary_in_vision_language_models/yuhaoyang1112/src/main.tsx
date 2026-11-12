import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/paper.css';
import './styles/series.css';
import './styles/interaction-motion.css';
import './styles/reader-navigation.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

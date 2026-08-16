import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { preloadMathlive } from './shared/react/learning/MathFormulaBlock';
import './styles/tokens.css';
import './shared/react/typography/typography.css';
import './shared/vendor/mathlive/mathlive-fonts.css';
import './styles/components.css';
import './styles/paper.css';

// Start parsing MathLive while the hero is visible so the first symbol hover is immediate.
void preloadMathlive();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

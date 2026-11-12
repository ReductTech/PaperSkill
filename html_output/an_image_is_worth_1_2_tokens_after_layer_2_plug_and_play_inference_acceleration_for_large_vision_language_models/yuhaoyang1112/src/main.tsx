import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/template.css';
import './styles/v9.css';
import './modules/charts.css';
import './styles/series-reference.css';
import './styles/control-motion.css';
import './styles/reader-navigation.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

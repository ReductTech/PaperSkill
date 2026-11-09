import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyPaletteVars } from './modules/sv-palette';
import './styles/tokens.css';
import './styles/v9.css';
import './live/live.css';
import './styles/paper.css';

// 长滚动版不引入 components.css（它把 html, body 设为 overflow: hidden，供 PPT 播放器使用）与 presentation.css。
applyPaletteVars();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

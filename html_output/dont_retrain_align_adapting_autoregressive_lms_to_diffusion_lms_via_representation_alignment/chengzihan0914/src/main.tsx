import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/components.css';
import './styles/paper.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('无法初始化教程：页面缺少 #root 挂载节点。');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

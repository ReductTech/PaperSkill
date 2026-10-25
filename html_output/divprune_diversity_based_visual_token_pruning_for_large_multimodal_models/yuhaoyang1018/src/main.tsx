import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
// 与官方模板的差异：不再引入 components.css（它服务于模板的幻灯片布局），
// 全部页面样式写在 paper.css 中。components.css 文件本身保留未改动。
import './styles/paper.css';
import { installAurora } from './lib/aurora';

installAurora();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
// 与官方模板的差异：不再引入 components.css（它服务于模板的 PPT 播放器，并把 html/body 设为 overflow: hidden，
// 会让长滚动页面无法滚动）。components.css 文件本身保留未改动；全部页面样式写在 paper.css 中。
import './styles/paper.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

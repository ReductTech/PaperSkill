import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/elf.css';

// ELF 教程使用从成品提取的完整样式（elf.css），不再加载模板 tokens/components/paper。
// 引擎在 App 挂载后初始化；关闭 StrictMode 避免开发模式双重初始化。

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);

import React, { useEffect } from 'react';
import { initElfTutorial } from './lib/elf-engine';
import { ELF_HERO_HTML, ELF_CHAPTERS, ELF_VIDEOS_HTML } from './data/elfContent';

// ELF 交互式教程（React 外壳）。
// 关键约束：引擎脚本通过 `$qa('section.chap')` 拿章节并把每章当作
// `main` 的直接兄弟节点（在章节间插入"继续下一章"loader），因此
// 所有章节与视频区必须拼接进同一个 <main dangerouslySetInnerHTML>，
// 不能用数组包裹成多个 div —— 否则渐进解锁逻辑会失效。
// 引擎在挂载后初始化一次，视觉与交互与原单 HTML 成品 100% 一致。

const ELF_MAIN_HTML =
  ELF_CHAPTERS.map((ch) => ch.html).join('\n') + '\n' + ELF_VIDEOS_HTML;

export default function App() {
  useEffect(() => {
    // 引擎脚本内含多个 IIFE 与事件绑定，必须在 DOM 渲染完成后执行一次。
    // React StrictMode 在开发模式会双重挂载，这里用全局标记保证只初始化一次。
    if ((window as unknown as { __elfInited?: boolean }).__elfInited) return;
    (window as unknown as { __elfInited?: boolean }).__elfInited = true;
    initElfTutorial();
  }, []);

  return (
    <>
      {/* Hero 区：GPT vs ELF 对比动画（在 main 之外） */}
      <div dangerouslySetInnerHTML={{ __html: ELF_HERO_HTML }} />
      {/* 10 章 + 视频区：必须是 main 的直接子节点（兄弟关系），保持引擎 DOM 假设 */}
      <main dangerouslySetInnerHTML={{ __html: ELF_MAIN_HTML }} />
    </>
  );
}

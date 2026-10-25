import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/vtw/Hero';
import { Chapter } from './components/vtw/Chapter';
import { Retell, Verdict, Glossary, Sources } from './components/vtw/Back';
import { FloatingNav, ProgressBar, jumpTo, type NavItem } from './components/vtw/Nav';
import { TideBackground } from './components/vtw/TideBackground';
import { useReducedMotion } from './lib/hooks';

// 与官方模板的差异：模板是 PPT 播放器（左侧缩略图目录 + 一页一屏 + 翻页按钮）；
// 本工程按需求改为单页长滚动：只保留顶部阅读进度条与右下角悬浮章节导航，
// 没有侧边索引、没有底部上一章 / 下一章按钮。模板的 PPT 组件与视频组件保留在工程中但不渲染。

export default function App() {
  const reduced = useReducedMotion();

  useEffect(() => {
    document.title = 'VTW 精读';
  }, []);

  // 入场动画：只在“允许动画 + 支持 IntersectionObserver”时启用；
  // 否则不加 anim-ok，所有内容直接完整显示，不会停在半透明或位移状态。
  // 已入场的标记写在 data-in 属性上（React 不管理这个属性），组件重新渲染、改 className 时不会被冲掉；
  // 之后才挂载的 .reveal 元素直接标记为已入场，绝不会停在透明状态。
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('rm', reduced);
    const markAll = () => document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => (el.dataset.in = '1'));
    if (reduced || typeof IntersectionObserver === 'undefined') {
      root.classList.remove('anim-ok');
      markAll();
      return;
    }
    const vh = window.innerHeight;
    document.querySelectorAll<HTMLElement>('.reveal:not([data-in])').forEach((el) => {
      if (el.getBoundingClientRect().top < vh) el.dataset.in = '1';
    });
    root.classList.add('anim-ok');
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not([data-in])'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = '1';
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.01 }
    );
    els.forEach((el) => io.observe(el));
    const mo = new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches('.reveal')) n.dataset.in = '1';
          n.querySelectorAll<HTMLElement>('.reveal').forEach((el) => (el.dataset.in = '1'));
        });
    });
    mo.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [reduced]);

  // 带锚点打开时跳到对应位置
  useEffect(() => {
    const id = decodeURIComponent(location.hash.replace('#', ''));
    if (!id) return;
    if (document.getElementById(id)) window.setTimeout(() => jumpTo(id, true), 80);
  }, []);

  const items: NavItem[] = useMemo(() => [
    { id: 'top', num: '封面', title: 'VTW 精读' },
    ...tutorial.chapters.map((c, i) => ({ id: c.id, num: String(i + 1).padStart(2, '0'), title: c.short ?? c.title })),
    { id: 'retell', num: '↺', title: '用自己的话讲一遍' },
    { id: 'verdict', num: '✦', title: '结论分级' },
    { id: 'glossary', num: 'Aa', title: '术语表' },
    { id: 'sources', num: '¶', title: '资料与口径' },
  ], []);

  return (
    <>
      <TideBackground />
      <a className="skip" href="#chap-1">
        跳到第 1 章
      </a>
      <ProgressBar />
      <div className="shell">
        <Hero />
        <main className="page">
          {tutorial.chapters.map((c, i) => (
            <Chapter key={c.id} ch={c} index={i} total={tutorial.chapters.length} />
          ))}
          <Retell />
          <Verdict />
          <Glossary />
          <Sources />
        </main>
      </div>
      <FloatingNav items={items} />
    </>
  );
}

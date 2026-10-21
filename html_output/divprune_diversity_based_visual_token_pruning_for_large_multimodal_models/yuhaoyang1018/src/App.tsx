import React, { useEffect, useLayoutEffect } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/dp/Hero';
import { Chapter } from './components/dp/Chapter';
import { Verdict, Glossary, Sources } from './components/dp/Back';
import { FloatingNav, ProgressBar, type NavItem } from './components/dp/Nav';
import { useReducedMotion } from './lib/hooks';

// 与官方模板的差异：模板是“左侧目录 + 一章一屏 + 底部上一章/下一章”的幻灯片布局；
// 本工程按需求改为单页长滚动：只保留顶部阅读进度条和右下角的悬浮章节导航。
// 模板的视频推荐组件（BiliVideos）仍在工程中，但这里不渲染。

export default function App() {
  const reduced = useReducedMotion();

  // 入场动画：仅在“允许动画 + 支持 IntersectionObserver”时启用；
  // 否则不加 anim-ok，所有内容直接完整显示，不会停在半透明或位移状态。
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('rm', reduced);
    if (reduced || typeof IntersectionObserver === 'undefined') {
      root.classList.remove('anim-ok');
      return;
    }
    // 首屏内的块在首帧前直接标记为已显示，保证页面“静止时完整”（缩略图、后台标签页也不会是空白）
    const vh = window.innerHeight;
    document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)').forEach((el) => {
      if (el.getBoundingClientRect().top < vh) el.classList.add('is-in');
    });
    root.classList.add('anim-ok');
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  // 打开带锚点的链接时，跳到对应章节
  useEffect(() => {
    const id = decodeURIComponent(location.hash.replace('#', ''));
    if (!id) return;
    const el = document.getElementById(id);
    if (el) window.setTimeout(() => el.scrollIntoView({ block: 'start' }), 60);
  }, []);

  const items: NavItem[] = [
    { id: 'top', num: '封面', title: 'DivPrune 精读' },
    ...tutorial.chapters.map((c, i) => ({ id: c.id, num: String(i + 1).padStart(2, '0'), title: c.short ?? c.title })),
    { id: 'verdict', num: '✦', title: '结论分级' },
    { id: 'glossary', num: 'Aa', title: '术语表' },
    { id: 'sources', num: '¶', title: '资料与口径' },
  ];

  return (
    <>
      <a className="skip" href="#chap-1">
        跳到第 1 章
      </a>
      <ProgressBar />
      <Hero />
      <main className="page">
        {tutorial.chapters.map((c, i) => (
          <Chapter key={c.id} ch={c} index={i} total={tutorial.chapters.length} />
        ))}
        <Verdict />
        <Glossary />
        <Sources />
      </main>
      <FloatingNav items={items} />
    </>
  );
}

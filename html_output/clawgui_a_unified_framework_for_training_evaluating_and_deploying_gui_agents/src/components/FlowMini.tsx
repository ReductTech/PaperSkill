import React, { useEffect, useState } from 'react';

// 全站唯一的章节进度栏：固定在视口左侧，随滚动高亮当前章节。
// 绿色 = 已解锁，蓝色 = 当前在读，灰色 = 尚未解锁；点击已解锁章节可直接跳转。
// 窄屏（< 1280px）由 CSS 隐藏，避免遮挡正文。
export function FlowMini({
  chapters,
  revealed,
}: {
  chapters: { id: string; title: string }[];
  revealed: number;
}) {
  const [active, setActive] = useState(1);

  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mark = window.innerHeight * 0.38;
      let cur = 1;
      for (let i = 0; i < Math.min(revealed, chapters.length); i++) {
        const el = document.getElementById(chapters[i].id);
        if (el && el.getBoundingClientRect().top <= mark) cur = i + 1;
      }
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    pick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [chapters, revealed]);

  return (
    <nav className="flow-mini" aria-label="章节进度">
      {chapters.map((ch, i) => {
        const n = i + 1;
        const unlocked = n <= revealed;
        const cls = !unlocked
          ? 'flow-step locked'
          : n === active
            ? 'flow-step active'
            : 'flow-step done';
        return (
          <button
            key={ch.id}
            type="button"
            className={cls}
            title={`§${n} ${ch.title}`}
            disabled={!unlocked}
            onClick={() =>
              document.getElementById(ch.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            §{n}
          </button>
        );
      })}
    </nav>
  );
}

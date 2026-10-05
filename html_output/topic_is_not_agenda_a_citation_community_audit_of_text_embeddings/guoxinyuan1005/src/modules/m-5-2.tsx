import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.2：按一次按钮，让两种排序在同一批候选上同步摊开，比较各自的第一名。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', red: '#c43f52',
  green: '#228d5c', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const M52: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0, running: false });
  const [label, setLabel] = useState('开始对比');
  const [fb, setFb] = useState({
    text: '同一批候选、同一批查询，只换排序依据。',
    cls: '',
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let last = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (s.running) {
        s.t = reduce ? 1 : clamp(s.t + dt / 1.8, 0, 1);
        if (s.t >= 1) s.running = false;
      }
      const e = easeInOutQuad(s.t);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      const panels = [
        { x: 40, accent: C.red, label: '只排序', hit: false },
        { x: 560, accent: C.green, label: '加引文重排', hit: true },
      ];

      for (const p of panels) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        roundRect(ctx, p.x, 44, 480, 196, 8);
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.6;
        roundRect(ctx, p.x, 44, 480, 196, 8);
        ctx.stroke();

        // 卡片从同一基线同步滑出
        for (let i = 0; i < 5; i++) {
          const from = p.x + 26;
          const to = p.x + 26 + i * 92;
          const x = from + (to - from) * e;
          const w = 80;
          const h = 54;
          const y = 96;
          ctx.fillStyle = '#fff';
          roundRect(ctx, x, y, w, h, 5);
          ctx.fill();
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
          roundRect(ctx, x, y, w, h, 5);
          ctx.stroke();
          ctx.fillStyle = 'rgba(240,126,71,0.85)';
          ctx.fillRect(x + 9, y + 9, 62 * (1 - i * 0.13), 5);
          if (i === 0 && e > 0.9) {
            ctx.strokeStyle = p.accent;
            ctx.lineWidth = 2.6;
            if (p.hit) {
              ctx.beginPath();
              ctx.moveTo(x + w - 26, y + h - 20);
              ctx.lineTo(x + w - 19, y + h - 12);
              ctx.lineTo(x + w - 9, y + h - 27);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.moveTo(x + w - 24, y + h - 25);
              ctx.lineTo(x + w - 12, y + h - 13);
              ctx.moveTo(x + w - 12, y + h - 25);
              ctx.lineTo(x + w - 24, y + h - 13);
              ctx.stroke();
            }
          }
        }

        // 面板数值
        const score = p.hit ? 59.6 : 39.3;
        const shown = (score * e).toFixed(1);
        ctx.fillStyle = '#fff';
        roundRect(ctx, p.x + 170, 174, 140, 44, 8);
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 2;
        roundRect(ctx, p.x + 170, 174, 140, 44, 8);
        ctx.stroke();
        ctx.fillStyle = p.accent;
        ctx.font = '700 24px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(shown, p.x + 240, 204);

        ctx.fillStyle = C.text;
        ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(p.label, p.x + 18, 30);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    );
    return () => {
      if (raf) cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  const start = () => {
    const s = stateRef.current;
    if (s.running) return;
    s.running = true;
    s.t = 0;
    stateRef.current = s;
    setLabel('再看一次');
    setFb({
      text: '两种排法在同 80 条议程查询上：<b>39.3%</b> → <b>59.6%</b>；论文补充：引文重排的 top-10 平均只覆盖 <b>4.4</b> 个议程，而余弦检索器覆盖 5.2–6.0 个。',
      cls: 'good',
    });
    window.setTimeout(() => {
      if (stateRef.current) stateRef.current.running = false;
    }, 1900);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label="左右两块面板同步摊开同一批候选：左侧只排序的第一名离题，右侧加引文重排的第一名命中"
      />
      <div className="step-ctrl">
        <button className="tiny" onClick={start}>
          {label}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M52;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 6.1：结果赛跑。七个检索器的 top-1 议程命中率从同一基线升起，
// 「有无引文重排」两组之间的分界一眼可见。数值取自论文 Table 3。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', green: '#228d5c',
  muted: '#68778f', border: '#d7deea', text: '#21324a',
};

const BARS = [
  { name: 'BM25', value: 39.3, group: 0 },
  { name: 'SPECTER2', value: 39.7, group: 0 },
  { name: 'Qwen3-0.6B', value: 39.6, group: 0 },
  { name: 'Qwen3-8B', value: 44.9, group: 0 },
  { name: 'Gemini', value: 50.6, group: 0 },
  { name: 'Graph', value: 57.7, group: 1 },
  { name: 'BM25+cite', value: 59.6, group: 1 },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ race: 0, running: false });
  const [label, setLabel] = useState('开始比较');
  const [fb, setFb] = useState({ text: '七个检索器、同一批 80 条议程查询、同一个指标。', cls: '' });

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
        s.race = reduce ? 1 : clamp(s.race + dt / 2.0, 0, 1);
        if (s.race >= 1) s.running = false;
      }

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      const axisY = 226;
      const topY = 42;
      const yv = (v: number) => axisY - (v / 70) * (axisY - topY);
      const bw = 96;
      const gap = 24;
      const start = 104;

      // 刻度尺
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      for (let v = 0; v <= 70; v += 10) {
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(start - 12, yv(v));
        ctx.lineTo(start + 7 * bw + 6 * gap + 30, yv(v));
        ctx.stroke();
        ctx.setLineDash([]);
        if (v > 0) {
          ctx.fillStyle = C.muted;
          ctx.fillText(String(v), start - 18, yv(v) + 4);
        }
      }
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(start - 12, axisY);
      ctx.lineTo(start + 7 * bw + 6 * gap + 30, axisY);
      ctx.stroke();

      for (let i = 0; i < BARS.length; i++) {
        const b = BARS[i];
        const p = easeOutCubic(clamp((s.race - i * 0.045) / 0.72, 0, 1));
        const x = start + i * (bw + gap) + (b.group === 1 ? 30 : 0);
        const h = (axisY - topY) * (b.value / 70) * p;
        ctx.fillStyle = b.group === 1 ? C.green : i === 4 ? C.blue : C.muted;
        roundRect(ctx, x, axisY - h, bw, h, 4);
        ctx.fill();
        if (b.group === 1 && s.race > 0.98) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          roundRect(ctx, x, axisY - h, bw, h, 4);
          ctx.stroke();
        }
        // 柱顶数值
        ctx.fillStyle = b.group === 1 ? C.green : C.text;
        ctx.font = '700 15px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((b.value * p).toFixed(1), x + bw / 2, axisY - h - 10);
        // 柱底名称
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(b.name, x + bw / 2, axisY + 18);
      }

      // 组分隔线
      const gx = start + 5 * bw + 4.5 * gap + 15;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(gx, topY - 6);
      ctx.lineTo(gx, axisY + 28);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('top-1 议程 %', 24, 30);

      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      let lx = 240;
      for (const it of [
        { color: C.muted, label: '无引文重排' },
        { color: C.green, label: '加引文重排' },
      ]) {
        ctx.fillStyle = it.color;
        ctx.fillRect(lx, 18, 11, 11);
        ctx.fillStyle = C.muted;
        ctx.fillText(it.label, lx + 16, 28);
        lx += 16 + ctx.measureText(it.label).width + 16;
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
    s.race = 0;
    stateRef.current = s;
    setLabel('再看一次');
    setFb({
      text: '加引文重排的两个方法（<b>57.7%</b>、<b>59.6%</b>）都超过五个仅候选检索器；<b>7–9</b> 个百分点的增益是下界——最好的方法仍漏掉约 <b>40%</b> 的 top-1 议程。',
      cls: 'good',
    });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label="七个检索器的 top-1 议程命中率从同一基线升起，加引文重排的两个方法最高"
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

export default M61;

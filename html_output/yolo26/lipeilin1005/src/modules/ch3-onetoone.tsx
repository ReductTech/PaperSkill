import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch3 Module 3.1 (P3): one shared start button drives two synchronized panels —
// left: one-to-many head spawns 12 overlapping boxes, NMS gate trims to 4;
// right: one-to-one head always gives exactly 4 clean boxes, zero post-processing.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

// 4 objects per panel: x, y, size (last one is tiny)
const OBJS = [
  { x: 90, y: 80, s: 44 },
  { x: 210, y: 170, s: 52 },
  { x: 340, y: 90, s: 38 },
  { x: 430, y: 200, s: 14 },
];

// deterministic per-object jitter for the 12 duplicate boxes
const J = OBJS.map((_, i) => [0, 1, 2].map((k) => ({
  dx: ((i * 37 + k * 61) % 48) - 24,
  dy: ((i * 53 + k * 29) % 40) - 20,
})));

export const Ch3OneToOne: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ progress: 0, running: false, startAt: 0 });
  const [fb, setFb] = useState({ text: '按下开始，左右两侧将从同一张街景出发。', cls: '' });
  const [btn, setBtn] = useState('开始对比');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawPanel = (ox: number, title: string, color: string) => {
      ctx.fillStyle = '#fff'; ctx.fillRect(ox, 10, 500, 260);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(ox, 10, 500, 260);
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText(title, ox + 16, 32);
      for (const o of OBJS) {
        ctx.fillStyle = '#e6ebdd';
        ctx.fillRect(ox + o.x - o.s / 2, o.y - o.s / 2, o.s, o.s);
      }
    };

    const render = (time: number) => {
      const s = stateRef.current;
      if (s.running) {
        const raw = (time - s.startAt) / 1800;
        s.progress = Math.min(raw, 1);
        if (raw >= 1) {
          s.running = false;
          setBtn('再看一次');
          setFb({ text: '左侧靠 NMS 事后筛掉 8 个重复框；右侧训练时就一对一，推理零后处理——代价只是 AP 低 0.6–0.8。', cls: 'good' });
        }
      }
      const p = easeInOutQuad(s.progress);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left panel: one-to-many + NMS ----
      drawPanel(20, '一对多头 + NMS', C.red);
      const leftCount = Math.round(12 - 8 * (p > 0.55 ? (p - 0.55) / 0.45 : 0));
      let drawn = 0;
      OBJS.forEach((o, i) => {
        // keep 1 "true" box per object; the rest are duplicates
        const dupForThis = i < leftCount % 4 ? Math.floor(leftCount / 4) + 1 : Math.floor(leftCount / 4);
        for (let k = 0; k < dupForThis && drawn < leftCount; k++, drawn++) {
          const jx = k === 0 ? 0 : J[i][k - 1].dx;
          const jy = k === 0 ? 0 : J[i][k - 1].dy;
          const isSurvivor = p > 0.55 && k === 0;
          ctx.strokeStyle = isSurvivor ? C.blue : `rgba(196,63,82,${0.35 + p * 0.3})`;
          ctx.lineWidth = isSurvivor ? 2.5 : 1.5;
          ctx.strokeRect(20 + o.x - o.s / 2 + jx, o.y - o.s / 2 + jy, o.s, o.s);
        }
      });
      // NMS gate icon at right edge of left panel
      ctx.fillStyle = p > 0.55 ? C.green : C.red;
      ctx.fillRect(486, 110, 26, 60);
      ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif';
      ctx.fillText('NMS', 487, 145);
      // ---- right panel: one-to-one ----
      drawPanel(560, '一对一头（端到端）', C.green);
      if (s.progress > 0.05) {
        OBJS.forEach((o) => {
          ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
          ctx.strokeRect(560 + o.x - o.s / 2, o.y - o.s / 2, o.s, o.s);
        });
      }
      ctx.fillStyle = C.green; ctx.font = '12px sans-serif';
      ctx.fillText('零后处理', 946, 252);
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const run = () => {
    stateRef.current.progress = 0;
    stateRef.current.running = true;
    stateRef.current.startAt = performance.now();
    setBtn('进行中…');
    setFb({ text: '两侧从同一张图出发……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={run} disabled={btn === '进行中…'}>{btn}</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch3OneToOne;

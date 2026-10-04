import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

function makeDots() {
  const uniform: { x: number; y: number }[] = [];
  const cluster: { x: number; y: number }[] = [];
  const centers = [
    { x: 200, y: 80 },
    { x: 330, y: 120 },
    { x: 260, y: 190 },
    { x: 150, y: 150 },
  ];
  let i = 0;
  for (let gy = 30; gy <= 250; gy += 26) {
    for (let gx = 20; gx <= 360; gx += 26) {
      uniform.push({ x: gx + 40, y: gy });
      const c = centers[i % centers.length];
      const jx = c.x + Math.cos(i * 2.3) * 22 + (i % 3) * 14;
      const jy = c.y + Math.sin(i * 1.7) * 26;
      cluster.push({ x: jx + 40, y: clamp(jy, 20, 260) });
      i += 1;
    }
  }
  return { uniform, cluster };
}

export const ModStructure: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ startTs: -1 });
  const raf = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [fb, setFb] = useState({ text: '点「开始对比」，看两种假设在同一片网格上如何展开。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }
    const dots = makeDots();

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const progress = s.startTs < 0 ? 0 : clamp((performance.now() - s.startTs) / 2200, 0, 1);
      const count = Math.round(progress * dots.uniform.length);

      // left panel: uniform assumption (red)
      ctx.fillStyle = 'rgba(196,63,82,0.06)';
      ctx.fillRect(40, 16, 400, 268);
      ctx.strokeStyle = '#c43f52';
      ctx.strokeRect(40, 16, 400, 268);
      ctx.fillStyle = '#c43f52';
      for (let i = 0; i < count; i += 1) {
        const d = dots.uniform[i];
        ctx.beginPath();
        ctx.arc(40 + d.x, 16 + d.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // right panel: real clustered structure (green)
      ctx.fillStyle = 'rgba(34,141,92,0.06)';
      ctx.fillRect(640, 16, 400, 268);
      ctx.strokeStyle = '#228d5c';
      ctx.strokeRect(640, 16, 400, 268);
      ctx.fillStyle = '#228d5c';
      for (let i = 0; i < count; i += 1) {
        const d = dots.cluster[i];
        ctx.beginPath();
        ctx.arc(640 + d.x, 16 + d.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('均匀假设', 240, 300 - 8);
      ctx.fillText('真实结构', 840, 300 - 8);
    };

    const tick = () => {
      render();
      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const play = () => {
    stateRef.current.startTs = performance.now();
    setPlaying(true);
    setFb({ text: '两侧同时展开：左边处处均匀（红，浪费比特），右边在边缘处抱团（绿，可利用）。', cls: 'good' });
  };
  const reset = () => {
    stateRef.current.startTs = -1;
    setPlaying(false);
    setFb({ text: '已重置。再点「开始对比」观察两种假设的差别。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className="tiny" onClick={play} disabled={playing}>
          开始对比
        </button>
        <button className="tiny ghost" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModStructure;

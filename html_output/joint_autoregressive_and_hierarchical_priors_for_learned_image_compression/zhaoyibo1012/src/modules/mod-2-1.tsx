import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

interface Region {
  label: string;
  dot: string;
  grid: number[][];
}

function makeGrid(seed: (i: number, j: number) => number): number[][] {
  return Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => seed(i, j)));
}

const REGIONS: Record<string, Region> = {
  sky: {
    label: '天空',
    dot: '#9ec5e8',
    grid: makeGrid((i, j) => 0.58 + 0.08 * Math.sin((i + 1) * (j + 1))),
  },
  sea: {
    label: '海面',
    dot: '#2f5d8a',
    grid: makeGrid((i, j) => 0.5 + 0.15 * Math.sin(i * 2 + j)),
  },
  lighthouse: {
    label: '灯塔',
    dot: '#f5f8f0',
    grid: makeGrid((i, j) => (Math.abs(i - 2) < 2 && Math.abs(j - 2) < 2 ? 0.85 : 0.4)),
  },
  grass: {
    label: '草地',
    dot: '#7fb069',
    grid: makeGrid((i, j) => 0.5 + 0.22 * ((i + j) % 2)),
  },
  fence: {
    label: '围栏',
    dot: '#92400e',
    grid: makeGrid((i, j) => 0.3 + 0.6 * (j % 2)),
  },
};

const HOTSPOTS: { id: string; x: number; y: number }[] = [
  { id: 'sky', x: 60, y: 55 },
  { id: 'sea', x: 60, y: 155 },
  { id: 'lighthouse', x: 240, y: 140 },
  { id: 'grass', x: 60, y: 225 },
  { id: 'fence', x: 390, y: 225 },
];

export const Mod21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ region: 'sky' });
  const rafRef = useRef<number | null>(null);
  const [region, setRegion] = useState('sky');
  const [feedback, setFeedback] = useState({ text: '天空：大片平滑，隐变量数值接近。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const r = REGIONS[stateRef.current.region] || REGIONS.sky;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // left: stylized photo
      ctx.fillStyle = '#a6c8e8';
      ctx.fillRect(0, 0, 480, 110);
      ctx.fillStyle = '#2f5d8a';
      ctx.fillRect(0, 110, 480, 90);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(230, 128, 24, 72);
      ctx.fillStyle = '#7fb069';
      ctx.fillRect(0, 200, 480, 50);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      for (let fx = 300; fx < 480; fx += 36) {
        ctx.beginPath();
        ctx.moveTo(fx, 200);
        ctx.lineTo(fx, 250);
        ctx.stroke();
      }
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 480, 250);

      // hotspots
      for (const hs of HOTSPOTS) {
        const active = hs.id === stateRef.current.region;
        ctx.beginPath();
        ctx.arc(hs.x, hs.y, active ? 14 : 11, 0, Math.PI * 2);
        ctx.fillStyle = REGIONS[hs.id].dot;
        ctx.fill();
        ctx.lineWidth = active ? 4 : 2;
        ctx.strokeStyle = active ? '#f07e47' : '#21324a';
        ctx.stroke();
      }

      // right: latent grid
      ctx.fillStyle = '#21324a';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText('隐变量网格', 520, 32);
      ctx.fillStyle = '#68778f';
      ctx.fillText('当前：' + r.label, 520, 62);
      const gx = 520;
      const gy = 80;
      const cell = 38;
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const v = r.grid[i][j];
          ctx.fillStyle = `rgba(39, 68, 110, ${(0.15 + 0.85 * v).toFixed(3)})`;
          ctx.fillRect(gx + j * cell, gy + i * cell, cell - 4, cell - 4);
        }
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    stateRef.current.region = id;
    setRegion(id);
    const r = REGIONS[id];
    setFeedback(
      id === 'fence'
        ? { text: '围栏：纹理复杂，隐变量波动大。', cls: 'bad' }
        : id === 'sky'
          ? { text: '天空：大片平滑，隐变量数值接近。', cls: 'good' }
          : { text: `${r.label}：结构在天空与围栏之间，隐变量有中等波动。`, cls: '' }
    );
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * W;
    const cy = ((e.clientY - rect.top) / rect.height) * H;
    for (const hs of HOTSPOTS) {
      const d = Math.hypot(cx - hs.x, cy - hs.y);
      if (d < 24) {
        pick(hs.id);
        return;
      }
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onCanvasClick} />
      <div className="chip-row">
        {Object.keys(REGIONS).map((id) => (
          <button key={id} className={`chip ${region === id ? 'selected' : ''}`} onClick={() => pick(id)}>
            {REGIONS[id].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod21;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 Module 1.1 — 缺失强度：拖动滑块，粉层里的洞与右侧观测格同时变化。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const SUPPORT = '#92400e';
const BLUE = '#27446e';
const RED = '#c43f52';
const BORDER = '#d7deea';

const COLS = 48;
const ROWS = 37;
const GX = 650;
const GY = 56;
const GW = 370;
const GH = 178;
const MAX_RATE = 0.5;

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ rate: 0 });
  const rafRef = useRef<number | null>(null);
  const [rate, setRate] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '粉层是完整的：每个位置都能观测到。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const holesFor = (r: number) => {
      const rand = mulberry(20260424);
      const want = Math.round(r * 1200);
      const cells: { c: number; rr: number }[] = [];
      const seen = new Set<number>();
      let guard = 0;
      while (cells.length < want && guard < 40000) {
        guard++;
        if (rand() > r) continue;
        const c = Math.floor(rand() * COLS);
        const rr = Math.floor(rand() * ROWS);
        const key = rr * COLS + c;
        if (seen.has(key)) continue;
        seen.add(key);
        cells.push({ c, rr });
      }
      return cells;
    };

    const render = (s: { rate: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      // counter
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 232, W, 30);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 232);
      ctx.lineTo(W, 232);
      ctx.stroke();

      // ---- left: the bed ----
      ctx.strokeStyle = SUPPORT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(150, 60);
      ctx.lineTo(430, 60);
      ctx.lineTo(396, 150);
      ctx.lineTo(184, 150);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#6f4a2f';
      ctx.beginPath();
      ctx.moveTo(188, 142);
      ctx.lineTo(392, 142);
      ctx.lineTo(380, 118);
      ctx.lineTo(330, 100);
      ctx.lineTo(262, 108);
      ctx.lineTo(204, 124);
      ctx.closePath();
      ctx.fill();

      const holes = holesFor(s.rate);
      ctx.fillStyle = RED;
      for (const hole of holes) {
        const hx = 196 + (hole.c / COLS) * 184;
        const hy = 104 + (hole.rr / ROWS) * 34;
        ctx.beginPath();
        ctx.arc(hx, hy, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      // target line for the settled bed
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(168, 142);
      ctx.lineTo(414, 142);
      ctx.stroke();

      // ---- right: the observation grid ----
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(GX, GY, GW, GH);
      const cw = GW / COLS;
      const chh = GH / ROWS;
      const holeSet = new Set(holes.map((h) => h.rr * COLS + h.c));
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = holeSet.has(r * COLS + c) ? RED : BLUE;
          ctx.fillRect(GX + c * cw + 0.6, GY + r * chh + 0.6, Math.max(1, cw - 1.2), Math.max(1, chh - 1.2));
        }
      }
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(GX, GY, GW, GH);

      // in-canvas labels (max 2, <= 8 chars each)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('缺失强度', 44, 40);
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText(`${Math.round(s.rate * 100)}%`, 44, 72);

      // legend (3 entries)
      const legend: { color: string; text: string }[] = [
        { color: BLUE, text: '有值' },
        { color: RED, text: '缺失' },
        { color: '#228d5c', text: '目标' },
      ];
      ctx.font = '13px "Segoe UI", sans-serif';
      legend.forEach((item, i) => {
        const lx = 660 + i * 120;
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, 250, 14, 10);
        ctx.fillStyle = '#68778f';
        ctx.fillText(item.text, lx + 20, 260);
      });
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, MAX_RATE);
    stateRef.current.rate = v;
    setRate(v);
    const pct = Math.round(v * 100);
    if (v === 0) setFeedback({ text: '粉层是完整的：每个位置都能观测到。', cls: '' });
    else if (v <= 0.15)
      setFeedback({
        text: `缺失强度 ${pct}%：少数位置观测不到，多数时刻仍有值。`,
        cls: '',
      });
    else if (v <= 0.35)
      setFeedback({
        text: `缺失强度 ${pct}%：缺失已经不可忽略，直接当作完整数据会误导下游。`,
        cls: '',
      });
    else
      setFeedback({
        text: `缺失强度 ${pct}%：将近一半的位置没有值——这正是真实系统的常态，而不是数据事故。`,
        cls: 'bad',
      });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label htmlFor={`rate-${chapterId}-${moduleId}`}>
          缺失强度 <span className="val">{Math.round(rate * 100)}%</span>
        </label>
        <input
          id={`rate-${chapterId}-${moduleId}`}
          type="range"
          min={0}
          max={50}
          step={1}
          value={Math.round(rate * 100)}
          onChange={onChange}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;

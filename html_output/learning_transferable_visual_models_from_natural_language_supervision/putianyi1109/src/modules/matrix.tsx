import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const N = 4;

export const MatrixWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [fb, setFb] = useState({ text: '点格子：判断它是正样本还是负样本。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H);
      c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText('4 × 4 配对表', 60, 40);
    const x0 = 160;
    const y0 = 70;
    const s = 42;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const k = i * N + j;
        const correct = i === j;
        const on = sel.has(k);
        ctx.fillStyle = on ? (correct ? '#228d5c' : '#c43f52') : '#d7deea';
        ctx.fillRect(x0 + j * s, y0 + i * s, s - 3, s - 3);
      }
    }
    ctx.fillStyle = '#68778f';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('列：文本 1–4', x0, y0 - 10);
    ctx.fillText('行：图像 1–4', 70, y0 + 60);
    const good = [...sel].filter((k) => k % (N + 1) === 0).length;
    const bad = sel.size - good;
    ctx.fillStyle = '#21324a';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('已选 ' + sel.size + ' 格：正样本 ' + good + '，负样本 ' + bad, 60, 250);
  }, [sel]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width;
    const y = ((e.clientY - r.top) * H) / r.height;
    const col = Math.floor((x - 160) / 42);
    const row = Math.floor((y - 70) / 42);
    if (col < 0 || col >= N || row < 0 || row >= N) return;
    const k = row * N + col;
    const next = new Set(sel);
    if (next.has(k)) next.delete(k); else next.add(k);
    setSel(next);
    const correct = row === col;
    setFb(correct
      ? { text: '对角线是真实配对，标绿；其余 N²−N 格是负样本。', cls: 'good' }
      : { text: '非对角线是错误配对，应标红，作为负样本。', cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} onClick={onClick} />
      <div className="ctrl">
        <button onClick={() => { setSel(new Set()); setFb({ text: '已清空，重新点格子。', cls: '' }); }}>清空</button>
        <button onClick={() => { setSel(new Set([0, 5, 10, 15])); setFb({ text: '四条对角线都选上了：4 个正样本。', cls: 'good' }); }}>
          标出正样本
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MatrixWidget;

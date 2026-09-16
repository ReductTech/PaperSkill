import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 300;

type Mode = 'tok' | 'traj' | 'step';

const modes: Record<Mode, { title: string; vals: number[]; note: string; color: string }> = {
  tok: {
    title: 'Token-GAE（示意）',
    vals: [0.08, 0.1, 0.09, 0.12, 0.11, 0.95],
    note: '优势挤在局部 token 上抖动；完整动作的贡献难分辨。',
    color: C.red,
  },
  traj: {
    title: '轨迹相对（示意）',
    vals: [0.55, 0.55, 0.55, 0.55, 0.55, 0.55],
    note: '整条轨迹同一标量，中间关键转向被糊成一片。',
    color: C.orange,
  },
  step: {
    title: 'Step-GAE（示意）',
    vals: [0.15, 0.15, 0.8, 0.8, -0.1, -0.1],
    note: '按交互步给优势：检索步高、干扰步低，中间决策可辨。',
    color: C.green,
  },
};

/** Schematic advantage distributions — NOT experimental scores. */
export const Ch5Credit: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('tok');
  const [fb, setFb] = useState({ text: '切换范式，观察优势分布形状（示意，非实验分数）。', cls: '' });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      clearScene(ctx, W, H);
      const m = modes[mode];
      drawLabel(ctx, m.title, 40, 36, m.color);
      drawLabel(ctx, '横轴：生成片段（token 或步块） · 纵轴：优势（示意）', 40, 60, C.muted);
      // zero line
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(40, 180);
      ctx.lineTo(W - 40, 180);
      ctx.stroke();
      const labels = mode === 'step'
        ? ['步1思考', '步1思考', '步2检索', '步2检索', '步3干扰', '步3干扰']
        : mode === 'traj'
        ? ['t1', 't2', 't3', 't4', 't5', 't6']
        : ['tok1', 'tok2', 'tok3', 'tok4', 'tok5', 'tok6'];
      m.vals.forEach((v, i) => {
        const x = 80 + i * 150;
        const hgt = Math.abs(v) * 100;
        ctx.fillStyle = v >= 0 ? m.color : C.red;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, v >= 0 ? 180 - hgt : 180, 70, hgt);
        ctx.globalAlpha = 1;
        drawLabel(ctx, labels[i], x + 4, 210, C.muted);
        drawLabel(ctx, v.toFixed(2), x + 12, v >= 0 ? 170 - hgt : 200 + hgt, m.color);
      });
      // group braces for step mode
      if (mode === 'step') {
        ctx.strokeStyle = C.blue;
        ctx.strokeRect(70, 70, 290, 150);
        ctx.strokeRect(370, 70, 290, 150);
        ctx.strokeRect(670, 70, 290, 150);
        drawLabel(ctx, '同一步共享优势', 40, 250, C.blue);
      }
      drawLegend(ctx, [
        { color: C.red, label: 'Token' },
        { color: C.orange, label: '轨迹' },
        { color: C.green, label: '步级' },
      ], 700, 36);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const loop = () => { render(); rafRef.current = requestAnimationFrame(loop); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [mode]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {(Object.keys(modes) as Mode[]).map((k) => (
          <button key={k} type="button" className={mode === k ? 'chip on' : 'chip'} onClick={() => {
            setMode(k);
            setFb({ text: modes[k].note, cls: k === 'step' ? 'good' : k === 'tok' ? 'bad' : '' });
          }}>{modes[k].title.replace('（示意）', '')}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <p className="term-note">判断句：信用单位应与交互步一致——太碎会噪声，太粗会淹没中间决策（对照论文 Figure 3）。</p>
    </div>
  );
};
export default Ch5Credit;

import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, DC, useDcCanvas } from './dc-kit';

const W = 1080;
const H = 280;
const VALS = [-0.9, -0.7, -0.5, -0.3, -0.05, 0.2, 0.45, 0.7, 0.92];
const CENTS = [-0.7, -0.15, 0.25, 0.85];

export const M7Finetune: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== 'running') return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1400);
      setProgress(p);
      if (p >= 1) setPhase('done');
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const panels: { x0: number; x1: number; title: string; focused: boolean }[] = [
      { x0: 60, x1: 500, title: '只聚类', focused: false },
      { x0: 580, x1: 1020, title: '聚类 + 微调', focused: true },
    ];
    panels.forEach((p) => {
      const yy = 150;
      ctx.strokeStyle = DC.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x0, yy);
      ctx.lineTo(p.x1, yy);
      ctx.stroke();
      const px = (v: number) => p.x0 + ((v + 1) / 2) * (p.x1 - p.x0);
      CENTS.forEach((c) => {
        ctx.fillStyle = p.focused ? DC.green : DC.blue;
        ctx.beginPath();
        ctx.moveTo(px(c), yy - 60);
        ctx.lineTo(px(c) + 6, yy - 52);
        ctx.lineTo(px(c), yy - 44);
        ctx.lineTo(px(c) - 6, yy - 52);
        ctx.closePath();
        ctx.fill();
      });
      VALS.forEach((v, i) => {
        const target = CENTS[i % CENTS.length];
        const t = p.focused && phase !== 'idle' ? progress : 0;
        const vv = v + (target - v) * t;
        ctx.fillStyle = p.focused && phase === 'done' ? DC.green : DC.red;
        ctx.beginPath();
        ctx.arc(px(vv), yy + (i % 2) * 6 - 3, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      drawSceneLabel(ctx, p.x0, 54, p.title, p.focused ? DC.green : DC.red, 15);
    });
    drawSceneLabel(ctx, 60, 220, phase === 'done' ? '误差已下降' : '等待开始', DC.muted, 13);
    drawLegend(ctx, 580, 220, [
      { label: '权重', color: DC.red },
      { label: '中心', color: DC.blue },
    ]);
  }, W, H);

  const text =
    phase === 'idle'
      ? '按下开始，比较「只聚类」和「聚类 + 微调」。'
      : phase === 'running'
      ? '两侧同时出发，注意右侧的点在向中心靠拢。'
      : '只聚类误差较大；中心微调后误差明显下降，接近原始网络。';

  return (
    <div>
      <canvas id="cv-m7-finetune" ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => { setProgress(0); setPhase('running'); }}>
          开始比较
        </button>
        <button className="tiny ghost" onClick={() => { setPhase('idle'); setProgress(0); }}>
          重置
        </button>
      </div>
      <div className={`feedback ${phase === 'done' ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M7Finetune;

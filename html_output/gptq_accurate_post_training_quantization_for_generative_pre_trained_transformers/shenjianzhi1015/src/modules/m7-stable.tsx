import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPath, drawLevel, drawSceneLabel, drawLegend, GQ, useGptqCanvas } from './gptq-kit';

const W = 1080;
const H = 280;

function layerErr(mode: 'naive' | 'stable', i: number): number {
  if (mode === 'stable') return 0.1 + i * 0.004;
  // naive: mostly small, but a few layers blow up
  const spike = i % 5 === 3 ? 2.4 : 0;
  return 0.12 + i * 0.01 + spike;
}

export const M7Stable: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'naive' | 'stable'>('stable');
  const [run, setRun] = useState(false);
  const [prog, setProg] = useState(0);
  const done = prog >= 1;

  useEffect(() => {
    if (!run) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1200);
      setProg(p);
      if (p >= 1) setRun(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  const ref = useGptqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const p = run ? prog : done ? 1 : 0;
    const broken = mode === 'naive' && p > 0.6;
    drawPath(ctx, 40, 70, 12, 40, 8, (i) => ({
      filled: i / 12 < p,
      cracked: broken && i > 7,
    }));
    drawLevel(ctx, 280, 190, 260, broken ? 0.14 : 0, !broken);
    // error curve over layers
    const x0 = 600;
    const x1 = 1030;
    const y0 = 220;
    const y1 = 70;
    ctx.strokeStyle = GQ.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.strokeStyle = mode === 'stable' ? GQ.green : GQ.red;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const xx = x0 + (i / 12) * (x1 - x0) * p;
      const yy = y0 - (Math.min(3, layerErr(mode, i)) / 3) * (y0 - y1);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    drawSceneLabel(ctx, x0, y0 + 22, '层号 →', GQ.muted, 12);
    drawLegend(ctx, 600, 250, [{ label: '层误差', color: mode === 'stable' ? GQ.green : GQ.red }]);
  }, W, H);

  const cls = done ? (mode === 'naive' ? 'bad' : 'good') : '';
  const text =
    !done && !run
      ? '选一种设置，再开始比较。'
      : mode === 'naive'
      ? 'H⁻¹ 变得不定，补偿方向失控，个别层被量化坏。'
      : 'Cholesky 预计算 + 1% 阻尼，全程稳定。';

  return (
    <div>
      <canvas id="cv-m7-stable" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'naive' ? 'selected' : ''}`} onClick={() => { setMode('naive'); setProg(0); }}>
          无稳定化
        </button>
        <button className={`chip ${mode === 'stable' ? 'selected' : ''}`} onClick={() => { setMode('stable'); setProg(0); }}>
          Cholesky + 阻尼
        </button>
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={() => { setProg(0); setRun(true); }}>
          开始比较
        </button>
      </div>
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};

export default M7Stable;

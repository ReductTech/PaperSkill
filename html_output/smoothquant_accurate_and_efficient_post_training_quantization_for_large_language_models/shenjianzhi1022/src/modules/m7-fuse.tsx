import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawPole, drawBar, drawSceneLabel, drawLegend, SQ, useSqCanvas } from './sq-kit';

const W = 1080;
const H = 280;

export const M7Fuse: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'naive' | 'fused'>('fused');
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

  const ref = useSqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const p = run ? prog : done ? 1 : 0;
    const stops = mode === 'naive' ? 3 : 0;
    drawPole(ctx, 60, 90, 300, 0, { leftRocks: 4, rightRocks: 4 });
    for (let i = 0; i < stops; i++) {
      const x = 120 + i * 80 + p * 120;
      if (p > 0.3 + i * 0.15) {
        ctx.fillStyle = SQ.red;
        ctx.beginPath();
        ctx.arc(x, 150, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawBar(ctx, 600, 100, 400, 22, (mode === 'naive' ? 0.35 : 0.02) * Math.max(0.2, p), mode === 'naive' ? SQ.red : SQ.green);
    drawSceneLabel(ctx, 600, 90, mode === 'naive' ? '额外开销大' : '几乎无开销', mode === 'naive' ? SQ.red : SQ.green, 13);
    drawSceneLabel(ctx, 600, 150, '精度不变', SQ.blue, 13);
    drawLegend(ctx, 600, 230, [{ label: '额外开销', color: mode === 'naive' ? SQ.red : SQ.green }]);
  }, W, H);

  const text =
    !done && !run
      ? '选一种方式，再开始比较。'
      : mode === 'naive'
      ? '每次运行都要额外缩放，内核调用变多。'
      : 's 已融进前一层，运行时不额外调用；精度不变。';

  return (
    <div>
      <canvas id="cv-m7-fuse" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'naive' ? 'selected' : ''}`} onClick={() => { setMode('naive'); setProg(0); }}>
          未融合
        </button>
        <button className={`chip ${mode === 'fused' ? 'selected' : ''}`} onClick={() => { setMode('fused'); setProg(0); }}>
          离线融合
        </button>
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={() => { setProg(0); setRun(true); }}>
          开始比较
        </button>
      </div>
      <div className={`feedback ${done ? (mode === 'fused' ? 'good' : 'bad') : ''}`}>{text}</div>
    </div>
  );
};

export default M7Fuse;

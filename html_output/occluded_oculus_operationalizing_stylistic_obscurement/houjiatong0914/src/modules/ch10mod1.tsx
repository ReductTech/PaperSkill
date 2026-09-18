import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { COLORS, clearScene, drawLabel } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const AXIS_MAX = 4.8;

// Maximum classify() distance per scenario across the eight training texts,
// taken verbatim from Table 2 (full-text supplied).
const BARS = [
  { id: 'int', label: 'IN+T', max: 4.6644, min: 4.2021, injection: true, color: COLORS.green },
  { id: 'in', label: 'IN', max: 4.5029, min: 4.0406, injection: true, color: COLORS.green },
  { id: 'im', label: 'IM', max: 1.4687, min: 1.1861, injection: false, color: COLORS.red },
  { id: 't', label: 'T', max: 1.3790, min: 1.0180, injection: false, color: COLORS.red },
];

export const Ch10Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const phaseRef = useRef('idle');
  const startRef = useRef(0);
  const progRef = useRef(0);
  const [phase, setPhase] = useState('idle');
  const [fb, setFb] = useState({ text: '按下开始，比较各场景在全文 classify() 实验中的最大距离。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (p: number) => {
      clearScene(ctx, W, H);
      for (let i = 0; i < BARS.length; i++) {
        const b = BARS[i];
        const x = 170 + i * 220;
        const h = (b.max / AXIS_MAX) * 170 * p;
        ctx.fillStyle = '#edf1ea';
        ctx.fillRect(x, 60, 80, 170);
        ctx.fillStyle = b.color;
        ctx.fillRect(x, 60 + (170 - h), 80, h);
        drawLabel(ctx, (b.max * p).toFixed(2), x + 4, 48, COLORS.ink, 18);
      }
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(140, 230); ctx.lineTo(W - 80, 230); ctx.stroke();
    };

    const tick = () => {
      if (phaseRef.current === 'running') {
        progRef.current = clamp((performance.now() - startRef.current) / 1600, 0, 1);
        if (progRef.current >= 1) setPhase('done');
      }
      render(phaseRef.current === 'idle' ? 0 : easeOutCubic(progRef.current));
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, []);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const onStart = () => {
    startRef.current = performance.now();
    progRef.current = 0;
    setPhase('running');
    setFb({ text: '各场景从同一基线出发……', cls: '' });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip selected" onClick={onStart} disabled={phase === 'running'}>
          {phase === 'done' ? '重新比较' : '开始比较'}
        </button>
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>全文 classify() 距离区间（表 2）</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          {BARS.map((b) => (
            <li key={b.id}>
              {b.label}：{b.min.toFixed(4)} – {b.max.toFixed(4)}
              {b.injection ? '（含注入）' : '（不含注入）'}
            </li>
          ))}
        </ul>
      </div>
      <div className={'feedback ' + (phase === 'done' ? 'good' : '')}>
        {phase === 'idle'
          ? '按下开始，观察含注入与不含注入的场景在距离上的差距。'
          : phase === 'running'
          ? '正在按同一基线推进距离条……'
          : '含注入的场景整体远高于其余场景；组内次序会随距离度量与文本长度变化，因此论文正文与附录给出了两种不同的排序口径。'}
      </div>
    </div>
  );
};

export default Ch10Mod1;

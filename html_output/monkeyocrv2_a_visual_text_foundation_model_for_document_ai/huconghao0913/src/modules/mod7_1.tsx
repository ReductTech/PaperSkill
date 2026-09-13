import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS, drawLegend, drawSubText } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
const PHASES = [
  { name: '初始化', lt: 8.5, lr: 12.0, desc: '随机初始化，两个损失都很高' },
  { name: '早期训练', lt: 4.2, lr: 6.8, desc: '文本生成快速下降，重建逐步学习' },
  { name: '中期训练', lt: 2.1, lr: 3.5, desc: '两个目标交替优化，互相促进' },
  { name: '收敛', lt: 1.2, lr: 1.8, desc: '联合损失收敛，编码器获得双重能力' },
];
export const Mod7_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const sRef = useRef(0);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      clearScene(ctx, W, H);
      const p = PHASES[sRef.current];
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('联合预训练损失曲线 · 64×A800 · lr=1e-3 · batch=256', 40, 35);
      // Chart area
      const cx = 40, cy = 55, cw = 600, ch = 180;
      ctx.strokeStyle = COLORS.border; ctx.strokeRect(cx, cy, cw, ch);
      // Grid
      for (let i = 0; i <= 4; i++) {
        const y = cy + (ch / 4) * i;
        ctx.strokeStyle = '#eee'; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + cw, y); ctx.stroke();
        ctx.fillStyle = COLORS.inkLight; ctx.font = '10px sans-serif';
        ctx.fillText((12 - i * 3).toFixed(0), cx - 25, y + 4);
      }
      // L_text curve (blue) - full curve up to current phase
      const ltVals = [8.5, 4.2, 2.1, 1.2];
      const lrVals = [12.0, 6.8, 3.5, 1.8];
      const drawCurve = (vals: number[], color: string, maxPhase: number) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let i = 0; i <= maxPhase; i++) {
          const x = cx + (i / 3) * cw;
          const y = cy + ch - (vals[i] / 12) * ch;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        // Current point
        const x = cx + (maxPhase / 3) * cw;
        const y = cy + ch - (vals[maxPhase] / 12) * ch;
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      };
      drawCurve(ltVals, COLORS.blue, sRef.current);
      drawCurve(lrVals, COLORS.green, sRef.current);
      // Current values
      drawSubText(ctx, 'L_text = ' + p.lt.toFixed(1), 680, 80, 16, COLORS.blue, 'sans-serif');
      drawSubText(ctx, 'L_rec = ' + p.lr.toFixed(1), 680, 110, 16, COLORS.green, 'sans-serif');
      drawSubText(ctx, 'L_pretrain = ' + (p.lt + p.lr).toFixed(1), 680, 140, 13, COLORS.ink, 'sans-serif');
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText(p.desc, 680, 170);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
      ctx.fillText('训练步数 →', cx + cw - 60, cy + ch + 20);
      ctx.fillText('损失 ↓', cx - 30, cy - 5);
      drawLegend(ctx, 680, 200, [
        { color: COLORS.blue, label: '文本生成损失' },
        { color: COLORS.green, label: '像素重建损失' },
      ]);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const next = () => { const v = Math.min(sRef.current + 1, PHASES.length - 1); sRef.current = v; setPhase(v); };
  const prev = () => { const v = Math.max(sRef.current - 1, 0); sRef.current = v; setPhase(v); };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl"><button onClick={prev} disabled={phase === 0}>上一步</button>
      <button onClick={next} disabled={phase === PHASES.length - 1}>下一步</button></div>
    <div className="feedback">{PHASES[phase].name}：{PHASES[phase].desc}。两个损失联合下降，编码器同时获得语义理解和视觉重建能力。</div></div>);
};
export default Mod7_1;

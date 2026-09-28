import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 7.1：训练三元组比例滑块（实测点：1%→80.8，10%→81.1，100%→81.8；SPECTER 80.0）。
const W = 1080, H = 280;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', orange: '#f07e47', blue: '#27446e' };
const PTS: Array<[number, number]> = [[1, 80.8], [10, 81.1], [100, 81.8]];
const SPEC = 80.0;
const interp = (pct: number) => {
  const lx = (v: number) => Math.log10(v);
  if (pct <= PTS[0][0]) return PTS[0][1];
  if (pct >= 100) return PTS[2][1];
  for (let i = 0; i < PTS.length - 1; i++) {
    if (pct >= PTS[i][0] && pct <= PTS[i + 1][0]) {
      const t = (lx(pct) - lx(PTS[i][0])) / (lx(PTS[i + 1][0]) - lx(PTS[i][0]));
      return PTS[i][1] + t * (PTS[i + 1][1] - PTS[i][1]);
    }
  }
  return PTS[2][1];
};

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ pct: 100 });
  const [pct, setPct] = useState(100);
  const [fb, setFb] = useState({ text: '完整数据的平均分：81.8。', cls: 'good' });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const gx = 80, gy = 40, gw = 920, gh = 160;
    const xOf = (p: number) => gx + 40 + (Math.log10(Math.max(1, p)) / 2) * (gw - 80);
    const yOf = (v: number) => gy + 24 + (81.9 - v) / 2.0 * (gh - 48);
    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.fillRect(gx, gy, gw, gh); ctx.strokeRect(gx, gy, gw, gh);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx + 40, gy + 16); ctx.lineTo(gx + 40, gy + gh - 28); ctx.lineTo(gx + gw - 24, gy + gh - 28); ctx.stroke();
      ctx.font = '12px sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'left';
      ['78.9', '79.9', '80.9', '81.9'].forEach((v, i) => ctx.fillText(v, gx + 6, gy + 24 + i * ((gh - 48) / 3)));
      ['1%', '10%', '100%'].forEach((lb, i) => ctx.fillText(lb, xOf(PTS[i][0]) - 8, gy + gh - 10));
      // SPECTER 虚线
      ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(gx + 40, yOf(SPEC)); ctx.lineTo(gx + gw - 24, yOf(SPEC)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red; ctx.fillText('SPECTER 80.0', gx + gw - 120, yOf(SPEC) - 6);
      // 超过 SPECTER 的区域着色
      ctx.globalAlpha = 0.08; ctx.fillStyle = C.green;
      ctx.fillRect(gx + 40, gy + 16, gw - 64, yOf(SPEC) - (gy + 16));
      ctx.globalAlpha = 1;
      // 曲线
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const p = Math.pow(10, (i / 80) * 2);
        const px = xOf(p), py = yOf(interp(p));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // 实测点
      PTS.forEach(([p, v]) => {
        ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(xOf(p), yOf(v), 5, 0, Math.PI * 2); ctx.fill();
      });
      // 当前标记
      const v = interp(s.pct);
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(xOf(s.pct), yOf(v), 8, 0, Math.PI * 2); ctx.fill();
      ctx.font = '22px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText(v.toFixed(1), xOf(s.pct) + 12, yOf(v) - 10);
    };
    let raf = 0;
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) raf = requestAnimationFrame(tick); }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const apply = (p: number) => {
    stateRef.current.pct = p;
    setPct(p);
    const v = interp(p);
    if (p === 1) setFb({ text: '1% 三元组：80.8，仍比 SPECTER 高 0.8 分。', cls: 'good' });
    else setFb({ text: `${p}% 三元组：约 ${v.toFixed(1)}，高于 SPECTER 基线。`, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>训练三元组比例 <span className="val">{pct}%</span></label>
        <input type="range" min={1} max={100} value={pct} onChange={(e) => apply(Number(e.target.value))} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M71;

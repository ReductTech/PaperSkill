import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.2：k⁺ 与 k⁻hard 双滑块实验台（验证分曲线 + 碰撞计数）。
const W = 1080, H = 280;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', orange: '#f07e47', blue: '#27446e' };

// 曲线形状依据论文图 2/3（验证分 80.6–81.2 区间）；碰撞形状依据图 4。
const scoreKPlus = (k: number) => k <= 25 ? 81.2 - (25 - k) * 0.01 : k <= 100 ? 81.2 - (k - 25) * 0.0006 : Math.max(80.7, 81.155 - (k - 100) * 0.0009);
const scoreKHard = (k: number) => k < 2000 ? 81.05 - (2000 - k) * 0.00022 : k <= 4000 ? 81.2 - (4000 - k) * 0.00007 : Math.max(80.6, 81.2 - (k - 4000) * 0.0006);
const collisionsOf = (kPlus: number, kHard: number) => {
  const f = kPlus <= 5 ? 0.2 : kPlus <= 25 ? 1 : 2.5;
  return Math.round(f * Math.max(0, 1000 - kHard));
};

export const M52: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ kPlus: 25, kHard: 4000 });
  const [ui, setUi] = useState({ kPlus: 25, kHard: 4000 });
  const [fb, setFb] = useState({ text: '当前就是论文选出的最优组合。', cls: 'good' });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const cx = 220, cy = 148;
    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      // 靶：显示当前绿带/红带位置（示意半径）
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 118, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      for (const f of [1, 0.66, 0.33]) { ctx.beginPath(); ctx.arc(cx, cy, 118 * f, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      const rPlus = 30 + (s.kPlus / 500) * 70;
      const rHard = 100 + ((Math.log(s.kHard) - Math.log(1000)) / (Math.log(5000) - Math.log(1000))) * 16;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(cx, cy, rPlus, 0, Math.PI * 2); ctx.arc(cx, cy, Math.max(6, rPlus - 8), 0, Math.PI * 2, true); ctx.fill();
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(cx, cy, rHard, 0, Math.PI * 2); ctx.arc(cx, cy, rHard - 8, 0, Math.PI * 2, true); ctx.fill();
      ctx.globalAlpha = 1;
      // 验证分曲线 inset
      const gx = 430, gy = 40, gw = 600, gh = 120;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.fillRect(gx, gy, gw, gh); ctx.strokeRect(gx, gy, gw, gh);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx + 30, gy + 12); ctx.lineTo(gx + 30, gy + gh - 26); ctx.lineTo(gx + gw - 14, gy + gh - 26); ctx.stroke();
      ctx.font = '12px sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'left';
      ctx.fillText('80.6', gx + 2, gy + 30); ctx.fillText('81.2', gx + 2, gy + 56);
      // 曲线（合成：两段各取相关区段）
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.beginPath();
      const yOf = (v: number) => gy + 20 + (81.2 - v) / 0.6 * 70;
      for (let i = 0; i <= 60; i++) {
        const k = 5 + (i / 60) * 495;
        let v: number;
        if (k <= 500) v = scoreKPlus(k);
        else v = scoreKHard(1000 + ((k - 500) / 500) * 4000);
        const px = gx + 30 + (i / 60) * (gw - 50);
        const py = Math.min(gy + gh - 26, yOf(v));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // 峰值点（k+=25）
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(gx + 30 + ((25 - 5) / 495) * (gw - 50), yOf(81.2), 5, 0, Math.PI * 2); ctx.fill();
      // 当前 k+ 指示
      const cur = Math.min(s.kPlus, 500);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(gx + 30 + ((cur - 5) / 495) * (gw - 50), gy + 12); ctx.lineTo(gx + 30 + ((cur - 5) / 495) * (gw - 50), gy + gh - 26); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '13px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('验证分（形状依据图 2/3）', gx + 14, gy + 16);
      // 碰撞条
      const col = collisionsOf(s.kPlus, s.kHard);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.fillRect(430, 180, 600, 44); ctx.strokeRect(430, 180, 600, 44);
      ctx.fillStyle = col > 300 ? C.red : col > 0 ? C.orange : C.green;
      const cw = Math.min(1, col / 2500) * 560;
      ctx.fillRect(450, 190, cw, 24);
      ctx.font = '20px sans-serif'; ctx.fillStyle = C.text; ctx.textAlign = 'left';
      ctx.fillText(String(col), 450 + cw + 8, 208);
      ctx.font = '13px sans-serif'; ctx.fillStyle = C.muted;
      ctx.fillText('碰撞数（形状依据图 4，越少越好）', 450, 236);
    };
    let raf = 0;
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) raf = requestAnimationFrame(tick); }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const apply = (kPlus: number, kHard: number) => {
    stateRef.current = { kPlus, kHard };
    setUi({ kPlus, kHard });
    const col = collisionsOf(kPlus, kHard);
    if (kPlus > 100) setFb({ text: 'k⁺ 太大：绿带逼近红带，正负样本开始碰撞（图 4），验证分下降。', cls: 'bad' });
    else if (kHard < 2000) setFb({ text: 'k⁻hard 过小：验证分下降（图 3），红带开始逼近绿带。', cls: 'bad' });
    else if (kHard > 4500) setFb({ text: '难负样本「不够难」，性能回落（图 3）。', cls: '' });
    else if (kPlus === 25 && kHard === 4000) setFb({ text: '最优组合：k⁺=25、k⁻hard=4000。', cls: 'good' });
    else setFb({ text: '可行组合，但验证分低于峰值。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>k⁺ <span className="val">{ui.kPlus}</span></label>
        <input type="range" min={5} max={500} value={ui.kPlus} onChange={(e) => apply(Number(e.target.value), stateRef.current.kHard)} />
        <label>k⁻hard <span className="val">{ui.kHard}</span></label>
        <input type="range" min={1000} max={5000} step={50} value={ui.kHard} onChange={(e) => apply(stateRef.current.kPlus, Number(e.target.value))} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M52;

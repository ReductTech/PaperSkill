import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 4.1：拖动负样本 d−，调 ξ，看三元组损失 L 何时归零。
const W = 1080, H = 280;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', orange: '#f07e47', blue: '#27446e' };
const D_PLUS = 70; // d+ 固定在绿带中心

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ dMinus: 90, xi: 1 });
  const [dMinus, setDMinus] = useState(90);
  const [xi, setXi] = useState(1);
  const [fb, setFb] = useState({ text: '把负样本拖到比正样本远出 ξ 的位置。', cls: '' });
  const fbRef = useRef(fb);
  fbRef.current = fb;

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const axX0 = 80, axX1 = 1000, axY = 110;
    const rToX = (r: number) => axX0 + (r / 220) * (axX1 - axX0);

    const render = () => {
      const s = stateRef.current;
      const L = Math.max(D_PLUS - s.dMinus + s.xi, 0);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      // 半径轴
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(axX0, axY); ctx.lineTo(axX1, axY); ctx.stroke();
      for (let r = 0; r <= 220; r += 20) {
        ctx.beginPath(); ctx.moveTo(rToX(r), axY - 5); ctx.lineTo(rToX(r), axY + 5); ctx.stroke();
      }
      // dQ
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(rToX(0), axY, 9, 0, Math.PI * 2); ctx.fill();
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = C.blue; ctx.fillText('d_Q', rToX(0), axY - 18);
      // d+ 距离弧（绿）
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(rToX(0), axY + 16); ctx.lineTo(rToX(D_PLUS), axY + 16); ctx.stroke();
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(rToX(D_PLUS), axY, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('d₊', rToX(D_PLUS), axY - 18);
      // d− 距离弧（红）+ 标记
      ctx.strokeStyle = C.red; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(rToX(0), axY + 30); ctx.lineTo(rToX(s.dMinus), axY + 30); ctx.stroke();
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(rToX(s.dMinus), axY, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('d₋', rToX(s.dMinus), axY - 18);
      // ξ 标记（d+ 右侧 xi 距离处）
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(rToX(D_PLUS + s.xi), axY - 34); ctx.lineTo(rToX(D_PLUS + s.xi), axY + 42); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.textAlign = 'left';
      ctx.fillText('ξ', rToX(D_PLUS + s.xi) + 6, axY - 38);
      // 损失条
      const barMax = 4;
      const bw = (Math.min(L, barMax) / barMax) * 920;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.fillRect(80, 196, 920, 30); ctx.strokeRect(80, 196, 920, 30);
      ctx.fillStyle = L === 0 ? C.green : C.red;
      ctx.fillRect(81, 197, Math.max(2, bw * 919 / 920), 28);
      ctx.fillStyle = L === 0 ? C.green : C.red;
      ctx.font = '22px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(L.toFixed(2), 82, 190);
      ctx.font = '13px sans-serif'; ctx.fillStyle = C.muted;
      ctx.fillText('L', 64, 216);
      ctx.font = '13px sans-serif'; ctx.fillStyle = C.muted; ctx.textAlign = 'right';
      ctx.fillText('近 ←—— 距离 ——→ 远', axX1, axY + 52);
      void fbRef.current;
    };
    let raf = 0;
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) raf = requestAnimationFrame(tick); }, () => { cancelAnimationFrame(raf); raf = 0; });

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      if (y < axY - 40 || y > axY + 50) return;
      const r = clamp(((x - axX0) / (axX1 - axX0)) * 220, 30, 220);
      applyD(r);
    };
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      onPointer(e);
      const move = (ev: PointerEvent) => onPointer(ev);
      const up = () => { canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); };
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', up);
    };
    canvas.addEventListener('pointerdown', down);
    return () => { canvas.removeEventListener('pointerdown', down); cancelAnimationFrame(raf); stop(); };
  }, []);

  const applyD = (d: number) => {
    stateRef.current.dMinus = d;
    setDMinus(d);
    updateFb(d, stateRef.current.xi);
  };
  const applyXi = (v: number) => {
    stateRef.current.xi = v;
    setXi(v);
    updateFb(stateRef.current.dMinus, v);
  };
  const updateFb = (d: number, xiv: number) => {
    const L = Math.max(D_PLUS - d + xiv, 0);
    if (L === 0 && xiv === 0) setFb({ text: '没有边际时，正样本只比负样本近一点点也算满足——训练信号变弱。', cls: '' });
    else if (L === 0) setFb({ text: '张力归零：d₊ 比 d₋ 近超过 ξ，这组三元组已满足约束。', cls: 'good' });
    else setFb({ text: `d₋ 太近：损失 L = ${L.toFixed(2)}，编码器会被推向「拉开正负」的方向。`, cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>松弛项 ξ <span className="val">{xi.toFixed(1)}</span></label>
        <input type="range" min={0} max={3} step={0.1} value={xi} onChange={(e) => applyXi(Number(e.target.value))} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M41;

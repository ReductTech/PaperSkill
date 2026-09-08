import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// HiPPO 的核心想法：不直接记每一步输入，而是把「整段历史」当作一条曲线，
// 用平移 Legendre 多项式当坐标轴投影，得到 d 个系数存进隐状态（d_state）。
// 本模块演示：历史 f(t) → d 个系数 → 用这 d 个系数重建历史，看还原精度随 d 变化。

const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#d97706', ink: '#21324a', muted: '#68778f', line: '#d7deea',
  hist: 'rgba(104,119,143,0.55)',
};

const M = 60; // 采样点：历史长度
// 历史信号：几个不同频率的起伏（示意“过去 60 步的输入”）
function fAt(x: number): number {
  return (
    0.5 +
    0.32 * Math.sin(x * 2 * Math.PI * 2.3 + 0.6) +
    0.18 * Math.cos(x * 2 * Math.PI * 5.7 - 0.4) +
    0.08 * Math.sin(x * 2 * Math.PI * 11)
  );
}
// 平移 Legendre 多项式 P_k(x)，x∈[0,1]，递推
function polyK(k: number, x: number): number {
  if (k === 0) return 1;
  if (k === 1) return 2 * x - 1;
  let p0 = 1, p1 = 2 * x - 1, pk = 0;
  for (let i = 2; i <= k; i++) {
    pk = ((2 * i - 1) * (2 * x - 1) * p1 - (i - 1) * p0) / i;
    p0 = p1;
    p1 = pk;
  }
  return pk;
}
// 正交投影系数：c_k = ⟨f,P_k⟩/⟨P_k,P_k⟩ = (Σ f·P_k / M) · (2k+1)
function project(d: number): number[] {
  const coeffs: number[] = [];
  for (let k = 0; k < d; k++) {
    let s = 0;
    for (let i = 0; i < M; i++) {
      const x = i / (M - 1);
      s += fAt(x) * polyK(k, x);
    }
    coeffs.push((s / M) * (2 * k + 1));
  }
  return coeffs;
}
function reconstruct(coeffs: number[], x: number): number {
  let v = 0;
  for (let k = 0; k < coeffs.length; k++) v += coeffs[k] * polyK(k, x);
  return v;
}

const W = 560, H = 250;
const PX0 = 36, PX1 = 548;
const PY0 = 26, PY1 = 116; // 曲线绘图区
const CY0 = 156, CY1 = 218; // 系数条区域
const CY = (CY0 + CY1) / 2; // 系数条零线
const Y = (v: number) => PY1 - v * (PY1 - PY0);
const X = (t: number) => PX0 + (t / (M - 1)) * (PX1 - PX0);

const D_OPTS = [2, 4, 8, 16];
const FEEDBACK: Record<number, string> = {
  2: '只有 2 个系数，重建只能抓住整体趋势——起伏的细节全被丢了。',
  4: '4 个系数抓住了主要起伏，但高频细节还差一点。',
  8: '8 个系数已经能较好地还原历史——MambaPSA 用的正是 d_state=8。',
  16: '16 个系数几乎完美重建。d 越大历史摘要越精细，代价是隐状态更宽。',
};

export const SsmHippoProj: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ d: 8 });
  const [d, setD] = useState(8);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { d: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);

      const coeffs = project(s.d);

      // ---- 上：历史 f(t) 与重建曲线 ----
      // 背景网格 + 坐标轴
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
      for (let g = 0.25; g <= 0.75; g += 0.25) {
        const gy = Y(g);
        ctx.beginPath(); ctx.moveTo(PX0, gy); ctx.lineTo(PX1, gy); ctx.stroke();
      }

      // 历史（灰实线）
      ctx.strokeStyle = C.hist;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < M; i++) {
        const x = X(i), y = Y(fAt(i / (M - 1)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 重建（蓝虚线）
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i < M; i++) {
        const x = X(i), y = Y(reconstruct(coeffs, i / (M - 1)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = C.ink;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('历史 f(t)：过去 60 步的输入', PX0, PY0 - 6);
      // 图例
      ctx.fillStyle = C.hist;
      ctx.fillRect(PX0, PY1 + 10, 14, 3);
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('历史', PX0 + 18, PY1 + 14);
      ctx.strokeStyle = C.blue;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(PX0 + 52, PY1 + 11); ctx.lineTo(PX0 + 66, PY1 + 11); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.fillText(`${s.d} 个系数重建`, PX0 + 70, PY1 + 14);

      // ---- 下：系数条 ----
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`隐状态 h = 这 ${s.d} 个 Legendre 系数（d_state = ${s.d}）`, PX0, CY0 - 12);
      ctx.strokeStyle = C.line;
      ctx.beginPath(); ctx.moveTo(PX0, CY); ctx.lineTo(PX1, CY); ctx.stroke();

      const maxAbs = Math.max(0.0001, ...coeffs.map((c) => Math.abs(c)));
      const barW = Math.min(26, ((PX1 - PX0) / s.d) * 0.55);
      for (let k = 0; k < s.d; k++) {
        const c = coeffs[k];
        const bh = (Math.abs(c) / maxAbs) * ((CY1 - CY0) / 2 - 4);
        const bx = PX0 + ((k + 0.5) / s.d) * (PX1 - PX0);
        ctx.fillStyle = c >= 0 ? C.blue : C.red;
        ctx.fillRect(bx - barW / 2, c >= 0 ? CY - bh : CY, barW, bh);
      }
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('P₀', PX0 + ((0.5 / s.d)) * (PX1 - PX0) - 6, CY1 + 16);
      ctx.fillText('…', PX0 + ((s.d / 2) / s.d) * (PX1 - PX0) - 3, CY1 + 16);
      ctx.fillText(`P${s.d - 1}`, PX0 + (((s.d - 0.5) / s.d)) * (PX1 - PX0) - 10, CY1 + 16);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const changeD = (v: number) => {
    stateRef.current.d = v;
    setD(v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {D_OPTS.map((v) => (
          <button
            type="button"
            key={v}
            className={`chip ${d === v ? 'selected' : ''}`}
            onClick={() => changeD(v)}
          >
            d_state = {v}
          </button>
        ))}
      </div>
      <div className={`feedback ${d >= 8 ? 'good' : ''}`}>{FEEDBACK[d]}</div>
      <p className="forget-note">
        换个说法：隐状态不是「每一步的备份」，而是「整段历史的低维摘要」——摘要的分辨率由 d_state 决定。
      </p>
    </div>
  );
};

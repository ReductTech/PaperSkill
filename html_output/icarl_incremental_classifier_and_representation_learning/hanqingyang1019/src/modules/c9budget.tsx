import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, line, dot, type WidgetProps } from './kit';

// Chapter 9.2 — the memory budget K is fixed; per-class allowance m = floor(K/t) shrinks.
export const C9Budget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [K, setK] = useState(2000);
  const [t, setT] = useState(10);
  const m = Math.floor(K / t);
  const used = m * t;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    // capacity bar
    const bx = 190;
    const bw = 720;
    ctx.fillStyle = 'rgba(215,222,234,0.65)';
    ctx.fillRect(bx, 50, bw, 32);
    ctx.fillStyle = C.green;
    ctx.fillRect(bx, 50, (bw * used) / K, 32);
    txt(ctx, 'K', 160, 66, C.text, 20, 'right', '700');
    txt(ctx, (used / K).toFixed(2), bx + bw + 12, 66, C.muted, 18, 'left', '600');

    // m versus t curve
    const left = 190;
    const right = 910;
    const top = 118;
    const bottom = 232;
    line(ctx, left, bottom, right, bottom, C.border, 2);
    line(ctx, left, top, left, bottom, C.border, 2);
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const tt = 10 + i * 5;
      const mm = Math.floor(K / tt);
      const x = left + ((tt - 10) / 90) * (right - left);
      const y = bottom - (mm / (K / 10)) * (bottom - top);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    ctx.stroke();

    const px = left + ((t - 10) / 90) * (right - left);
    const py = bottom - (m / (K / 10)) * (bottom - top);
    line(ctx, px, bottom, px, py, C.border, 1, [4, 4]);
    dot(ctx, px, py, 8, C.blue, C.white, 3);
    txt(ctx, 'm', 160, 130, C.text, 20, 'right', '700');
    txt(ctx, m.toString(), px + 14, py - 14, C.blue, 22, 'left', '700');
    c.classList.add('is-ready');
  }, [K, t, m, used]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          已学类数 t <span className="val">{t}</span>
        </label>
        <input type="range" min={10} max={100} step={10} value={t} onChange={(e) => setT(Number(e.target.value))} />
        <span className="val">每类 m = {m} · 总占用 {used}/{K}</span>
      </div>
      <div className="ctrl">
        <div className="chip-row">
          <button className={`chip ${K === 2000 ? 'selected' : ''}`} onClick={() => setK(2000)}>
            K=2000（iCIFAR-100）
          </button>
          <button className={`chip ${K === 20000 ? 'selected' : ''}`} onClick={() => setK(20000)}>
            K=20000（iILSVRC）
          </button>
        </div>
      </div>
      <div className={`feedback ${t > 60 ? 'bad' : ''}`}>
        {t > 60
          ? `类数涨到 ${t}，每类只剩 ${m} 个样本：原型估计开始变糙，这是固定预算的真实代价。`
          : `类数 ${t} 时每类可留 ${m} 个样本，总占用 ${used} 始终不超过 K。`}
      </div>
    </div>
  );
};

export default C9Budget;

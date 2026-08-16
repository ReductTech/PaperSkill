import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 480, H = 240;
const BG = '#fffaf1', INK = '#222222', MUTED = '#666666', GREEN = '#33a9d6', ORANGE = '#ff3366';

// P1 滑块：Flow Matching t=0..1，散点噪声收敛为清晰绿色方块。
export const Sec4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ t: 0 });
  const [t, setT] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const cx = W / 2, cy = 128;
    const gridN = 6;               // 6x6 = 36 点
    const cell = 14;
    const gridW = gridN * cell;
    const gx0 = cx - gridW / 2 + cell / 2;
    const gy0 = cy - gridW / 2 + cell / 2;

    // 每个点：目标网格位置 + 固定噪声偏移
    const dots = Array.from({ length: gridN * gridN }, (_, i) => {
      const col = i % gridN, row = Math.floor(i / gridN);
      return {
        tx: gx0 + col * cell,
        ty: gy0 + row * cell,
        ox: Math.cos(i * 2.3 + 1) * 90,
        oy: Math.sin(i * 1.7 + 0.5) * 70,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      const tv = stateRef.current.t;

      // 标题
      ctx.fillStyle = INK; ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('Flow Matching：噪声到清晰', W / 2, 28);

      // 清晰方块（随 t 淡入）
      const side = gridW + 6;
      ctx.fillStyle = `rgba(34,141,92,${tv})`;
      const r = 10;
      const sx = cx - side / 2, sy = cy - side / 2;
      ctx.beginPath();
      ctx.moveTo(sx + r, sy);
      ctx.arcTo(sx + side, sy, sx + side, sy + side, r);
      ctx.arcTo(sx + side, sy + side, sx, sy + side, r);
      ctx.arcTo(sx, sy + side, sx, sy, r);
      ctx.arcTo(sx, sy, sx + side, sy, r);
      ctx.closePath();
      ctx.fill();

      // 散点（随 1-t 淡出，向目标收敛）
      ctx.fillStyle = `rgba(104,119,143,${1 - tv})`;
      for (const d of dots) {
        const x = lerp(d.tx + d.ox, d.tx, tv);
        const y = lerp(d.ty + d.oy, d.ty, tv);
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // 速度场箭头（0.1<t<0.9）
      if (tv > 0.1 && tv < 0.9) {
        ctx.strokeStyle = ORANGE; ctx.fillStyle = ORANGE; ctx.lineWidth = 2;
        const arrows = [
          { a: Math.PI * 0.25 }, { a: Math.PI * 0.75 },
          { a: Math.PI * 1.25 }, { a: Math.PI * 1.75 },
        ];
        const outer = 78, inner = 44;
        arrows.forEach(({ a }) => {
          const x1 = cx + Math.cos(a) * outer, y1 = cy + Math.sin(a) * outer;
          const x2 = cx + Math.cos(a) * inner, y2 = cy + Math.sin(a) * inner;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          // 箭头头（指向内部）
          ctx.save();
          ctx.translate(x2, y2);
          ctx.rotate(a + Math.PI);
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        });
      }

      // t 标签
      ctx.fillStyle = MUTED; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('t = ' + tv.toFixed(2), cx, H - 12);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.t = v; setT(v);
  };

  const fb = t < 0.3
    ? { cls: 'bad', text: 't≈0：纯噪声状态 z₀' }
    : t > 0.7
    ? { cls: 'good', text: 't≈1：清晰图像 z₁ 生成完成' }
    : { cls: '', text: '流动去噪中：沿速度场收敛' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>时间步 t <span className="val">{t.toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={Math.round(t * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Sec4Mod1;

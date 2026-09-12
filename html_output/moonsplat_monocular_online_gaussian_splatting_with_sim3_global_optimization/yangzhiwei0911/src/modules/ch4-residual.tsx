import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, dist, lerp, easeSpring } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 4.1：拖动一个匹配点，看残差平方和是一条有唯一最低点的曲线。

const W = 1080;
const H = 280;

const TX = 540;
const TY = 140;
const XMIN = 140;
const XMAX = 940;
const YMIN = 80;
const YMAX = 200;
const R = 400;
const HIT = 44;

const BX0 = 40;
const BX1 = 1040;
const BY0 = 55;
const BY1 = 205;

const IX = 620;
const IY = 150;
const IW = 420;
const IH = 120;

type Pt = { x: number; y: number };
type Fb = { text: string; cls: '' | 'good' | 'bad' };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawBand(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(x0, y1 - 6, x1 - x0, 6);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 12, 9);
    ctx.fillStyle = '#68778f';
    ctx.fillText(it.label, cx + 17, y);
    cx += 17 + ctx.measureText(it.label).width + 16;
  });
}

function fbOf(d: number): Fb {
  if (d > 200) {
    return { text: '两侧偏差都很大，这个位置会让加权残差明显偏高。', cls: 'bad' };
  }
  if (d > 12) {
    return { text: '正在靠近，残差在下降，但还没到最低点。', cls: '' };
  }
  return {
    text: '落在最低点附近：两侧双向残差之和最小，这就是全局优化要解的位置。',
    cls: 'good',
  };
}

const curveResidual = (x: number) => Math.pow(Math.abs(x - TX) / R, 2);

export const Ch4Residual: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const ptRef = useRef<Pt>({ x: 300, y: 140 });
  const dragRef = useRef(false);
  const hoverRef = useRef(false);
  const markerRef = useRef<Pt | null>(null);
  const settleRef = useRef(-1);

  const [pt, setPt] = useState<Pt>({ x: 300, y: 140 });
  const [feedback, setFeedback] = useState<Fb>(fbOf(dist(300, 140, TX, TY)));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (p: Pt, hovered: boolean, ts: number) => {
      clearScene(ctx, W, H);
      drawBand(ctx, BX0, BX1, BY0, BY1);

      // 两段缝线：模拟双向边的两个投影，略有垂直错位
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(70, 160);
      ctx.lineTo(480, 160);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(600, 120);
      ctx.lineTo(1010, 120);
      ctx.stroke();

      // 残差曲线插片
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(IX, IY, IW, IH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(IX + 0.5, IY + 0.5, IW - 1, IH - 1);

      const px0 = IX + 24;
      const px1 = IX + IW - 18;
      const py0 = IY + 18;
      const py1 = IY + IH - 26;

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px0, py1);
      ctx.lineTo(px1, py1);
      ctx.stroke();

      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const xv = lerp(XMIN, XMAX, t);
        const sx = lerp(px0, px1, t);
        const sy = lerp(py1, py0, clamp(curveResidual(xv), 0, 1));
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      const mx = lerp(px0, px1, (TX - XMIN) / (XMAX - XMIN));
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(mx, py1, 4, 0, Math.PI * 2);
      ctx.fill();

      const cx = clamp(p.x, XMIN, XMAX);
      const sx2 = lerp(px0, px1, (cx - XMIN) / (XMAX - XMIN));
      const sy2 = lerp(py1, py0, clamp(curveResidual(cx), 0, 1));
      if (!markerRef.current) markerRef.current = { x: sx2, y: sy2 };
      const mk = markerRef.current;
      mk.x += (sx2 - mk.x) * 0.25;
      mk.y += (sy2 - mk.y) * 0.25;
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(mk.x, mk.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(Math.pow(dist(p.x, p.y, TX, TY) / R, 2).toFixed(2), IX + 14, IY + 22);

      // 目标标记
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TX - 10, TY);
      ctx.lineTo(TX + 10, TY);
      ctx.moveTo(TX, TY - 10);
      ctx.lineTo(TX, TY + 10);
      ctx.stroke();

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('目标', TX + 16, TY - 14);

      drawLegend(
        ctx,
        [
          { label: '残差', color: '#27446e' },
          { label: '当前', color: '#f07e47' },
        ],
        BX0 + 20,
        BY0 - 18
      );

      // 可拖针脚：非拖拽时轻微脉动，松手后一次很小的落定脉冲
      let bump = 0;
      if (settleRef.current >= 0) {
        const pu = clamp((ts - settleRef.current) / 1000 / 0.45, 0, 1);
        if (pu < 1) bump = pu < 0.5 ? easeSpring(pu * 2) : easeSpring((1 - pu) * 2);
      }
      const pulse = dragRef.current || hovered ? 0 : Math.sin(ts / 480) * 1.6;
      const dotR = 9 * (1 + 0.3 * bump) + pulse;
      if (hovered || dragRef.current) {
        ctx.strokeStyle = '#f07e47';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 17 * (1 + 0.15 * bump), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = (ts: number) => {
      render(ptRef.current, hoverRef.current, ts);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const commit = (nx: number, ny: number) => {
    const x = clamp(nx, XMIN, XMAX);
    const y = clamp(ny, YMIN, YMAX);
    ptRef.current = { x, y };
    setPt({ x, y });
    setFeedback(fbOf(dist(x, y, TX, TY)));
  };

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    if (dist(p.x, p.y, ptRef.current.x, ptRef.current.y) <= HIT) {
      dragRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.style.cursor = 'grabbing';
      commit(p.x, p.y);
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    if (dragRef.current) {
      commit(p.x, p.y);
      return;
    }
    hoverRef.current = dist(p.x, p.y, ptRef.current.x, ptRef.current.y) <= HIT;
    e.currentTarget.style.cursor = hoverRef.current ? 'grab' : 'default';
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    dragRef.current = false;
    settleRef.current = performance.now();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    e.currentTarget.style.cursor = 'grab';
  };

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    commit(Number(e.target.value), ptRef.current.y);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <div className="ctrl">
        <label>
          水平微调 <span className="val">{Math.round(pt.x)}</span>
        </label>
        <input
          type="range"
          min={XMIN}
          max={XMAX}
          step={10}
          value={Math.round(pt.x)}
          onChange={onSlider}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Residual;

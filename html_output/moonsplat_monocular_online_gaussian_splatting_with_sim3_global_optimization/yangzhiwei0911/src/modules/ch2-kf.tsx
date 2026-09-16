import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor, easeSpring } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 2.1：布带上有 6 个刻度位置，点选一个关键帧，
// 右侧固定插片显示它在流程里的角色、焦距收敛条与点图残余。

const W = 1080;
const H = 280;
const BAND_TOP = 150;
const BAND_BOTTOM = 230;
const BASE_Y = 190;
const BAND_X0 = 40;
const BAND_X1 = 766;
const HOT_X0 = 58;
const HOT_W = 118;
const HOT_COUNT = 6;
const CARD_X = 780;
const CARD_Y = 48;
const CARD_W = 290;
const CARD_H = 180;
const PAD = 16;

const BLUE = '#27446e';
const GREEN = '#228d5c';
const MUTED = '#68778f';
const INK = '#21324a';

type Feedback = { text: string; cls: string };

function isInitIndex(kfIndex: number): boolean {
  return kfIndex >= 1 && kfIndex <= 3;
}

function focalErrFor(kfIndex: number): number {
  if (kfIndex === 0) return 0;
  return clamp(0.08 + 0.055 * (kfIndex - 1), 0, 1);
}

function pointResidualFor(kfIndex: number): number {
  if (kfIndex === 0) return 0;
  if (isInitIndex(kfIndex)) return clamp(0.34 - 0.04 * kfIndex, 0, 1);
  return 0.14;
}

function feedbackFor(kfIndex: number): Feedback {
  if (kfIndex === 0) return { text: '点击布带上的任意位置，看它在流程里的角色。', cls: '' };
  if (isInitIndex(kfIndex)) {
    return {
      text: '这一帧参与了前 k_init 个关键帧的 BA，统一焦距与主点就是在这里被解出来的。',
      cls: 'good',
    };
  }
  return {
    text: '这一帧不再做 BA，它的点图会被统一内参按深度重投影校正，避免 BA 复杂度随关键帧数增长。',
    cls: '',
  };
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}

function drawSetting(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(BAND_X0, BAND_TOP, BAND_X1 - BAND_X0, BAND_BOTTOM - BAND_TOP);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(BAND_X0, BAND_BOTTOM - 5, BAND_X1 - BAND_X0, 5);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(BAND_X0 + 0.5, BAND_TOP + 0.5, BAND_X1 - BAND_X0 - 1, BAND_BOTTOM - BAND_TOP - 1);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; label: string }>,
  x: number,
  y: number
) {
  let cx = x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '14px "Segoe UI", sans-serif';
  for (let i = 0; i < items.length; i += 1) {
    ctx.fillStyle = items[i].color;
    ctx.beginPath();
    ctx.arc(cx + 5, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.fillText(items[i].label, cx + 15, y + 1);
    cx += 15 + items[i].label.length * 14 + 18;
  }
  ctx.textBaseline = 'alphabetic';
}

export const Ch2Kf: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const animRef = useRef({ prev: 0, sel: 0, t: 1 });
  const hoverRef = useRef(0);
  const hoverKRef = useRef(0);
  const lastRef = useRef(0);
  const [kfIndex, setKfIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (k: number) => {
      const kf = animRef.current.sel;
      const inInit = isInitIndex(kf);
      const accent = inInit ? GREEN : BLUE;
      const focalErr = focalErrFor(kf);
      const residual = pointResidualFor(kf);

      clearScene(ctx);
      drawSetting(ctx);

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(BAND_X0, BASE_Y);
      ctx.lineTo(BAND_X1, BASE_Y);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < HOT_COUNT; i += 1) {
        const n = i + 1;
        const cx = HOT_X0 + HOT_W / 2 + i * HOT_W;
        const active = kf === n;
        let sc = 1;
        if (n === animRef.current.sel) sc = 1 + 0.3 * k;
        else if (n === animRef.current.prev) sc = 1 + 0.3 * (1 - k);
        if (n === hoverRef.current) sc *= 1 + 0.15 * hoverKRef.current;
        const glow = n === animRef.current.sel ? k : n === animRef.current.prev ? 1 - k : 0;

        ctx.save();
        ctx.translate(cx, (BAND_TOP + BAND_BOTTOM) / 2);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -(BAND_TOP + BAND_BOTTOM) / 2);
        if (glow > 0.01) {
          ctx.save();
          ctx.globalAlpha = 0.2 * glow;
          ctx.fillStyle = accent;
          ctx.fillRect(cx - HOT_W / 2, BAND_TOP, HOT_W, BAND_BOTTOM - BAND_TOP);
          ctx.restore();
        }
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.strokeRect(cx - HOT_W / 2 + 0.5, BAND_TOP + 0.5, HOT_W - 1, BAND_BOTTOM - BAND_TOP - 1);
        ctx.beginPath();
        ctx.moveTo(cx, BASE_Y - 16);
        ctx.lineTo(cx, BASE_Y + 16);
        ctx.stroke();
        ctx.restore();
      }

      drawText(ctx, '基准线', 656, 182, INK, 16, 'left');

      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(CARD_X + 1, CARD_Y + 1, CARD_W - 2, CARD_H - 2);

      ctx.save();
      ctx.globalAlpha = clamp(k, 0, 1);

      const lx = CARD_X + PAD;
      const rx = CARD_X + CARD_W - PAD;
      const barW = rx - lx;

      drawText(ctx, kf === 0 ? '未选中' : `关键帧 ${kf}`, lx, CARD_Y + 28, INK, 16, 'left');
      drawText(
        ctx,
        kf === 0 ? '等待点击' : inInit ? '参与 BA' : '重投影校正',
        lx,
        CARD_Y + 62,
        kf === 0 ? MUTED : accent,
        16,
        'left'
      );

      drawText(ctx, '焦距收敛', lx, CARD_Y + 96, MUTED, 14, 'left');
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(lx, CARD_Y + 104, barW, 10);
      ctx.fillStyle = lerpColor(GREEN, '#c43f52', focalErr);
      ctx.fillRect(lx, CARD_Y + 104, barW * focalErr, 10);

      drawText(ctx, '点图残余', lx, CARD_Y + 140, MUTED, 14, 'left');
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(lx, CARD_Y + 148, barW, 10);
      ctx.fillStyle = lerpColor(GREEN, '#c43f52', residual);
      ctx.fillRect(lx, CARD_Y + 148, barW * residual, 10);
      drawText(ctx, kf === 0 ? '0.00' : residual.toFixed(2), lx, CARD_Y + 174, INK, 14, 'left');

      ctx.restore();

      drawLegend(
        ctx,
        [
          { color: BLUE, label: '前 k_init 内' },
          { color: GREEN, label: '之后校正' },
        ],
        46,
        258
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (ts: number) => {
      const dt = lastRef.current ? Math.min(0.06, (ts - lastRef.current) / 1000) : 0;
      lastRef.current = ts;
      const a = animRef.current;
      if (a.t < 1) a.t = Math.min(1, a.t + dt / 0.3);
      const hTarget = hoverRef.current > 0 ? 1 : 0;
      hoverKRef.current += (hTarget - hoverKRef.current) * 0.25;
      render(easeSpring(clamp(a.t, 0, 1)));
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (n: number) => {
    const a = animRef.current;
    a.prev = a.sel;
    a.sel = n;
    a.t = a.prev === n ? 1 : 0;
    setKfIndex(n);
    setFeedback(feedbackFor(n));
  };

  const hitTick = (x: number, y: number): number => {
    if (y < BAND_TOP - 20 || y > BAND_BOTTOM + 20) return 0;
    return clamp(Math.floor((x - HOT_X0) / HOT_W) + 1, 1, HOT_COUNT);
  };

  const toCanvasXY = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvasXY(e);
    const idx = hitTick(x, y);
    if (idx > 0) select(idx);
  };

  const onCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = toCanvasXY(e);
    hoverRef.current = hitTick(x, y);
    canvas.style.cursor = hoverRef.current > 0 ? 'pointer' : '';
  };

  const onCanvasLeave = () => {
    const canvas = canvasRef.current;
    hoverRef.current = 0;
    if (canvas) canvas.style.cursor = '';
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
        onClick={onCanvasClick}
        onMouseMove={onCanvasMove}
        onMouseLeave={onCanvasLeave}
      />
      <div className="chips">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button key={n} className={kfIndex === n ? 'chip is-active' : 'chip'} onClick={() => select(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Kf;

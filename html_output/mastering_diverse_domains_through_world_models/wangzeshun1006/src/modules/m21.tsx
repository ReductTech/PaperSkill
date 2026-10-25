import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  EMPH,
  INK,
  MUTED,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// m21 — 编码器：像素 → 离散隐码（P5 点击岩壁四个区域）。
const W = 1080;
const H = 280;

const LATENT: number[][] = [
  [3, 7, 11],
  [1, 5, 9, 14],
  [0, 4, 10],
  [2, 6, 8, 13],
];
const REGION_NAMES = ['左上', '右上', '左下', '右下'];

const WALL_X = 40;
const WALL_Y = 44;
const WALL_W = 340;
const WALL_H = 196;
const PAD = 18;
const CW = (WALL_W - 3 * PAD) / 2;
const CH = (WALL_H - 3 * PAD) / 2;
const REGIONS: number[][] = [
  [WALL_X + PAD, WALL_Y + PAD],
  [WALL_X + 2 * PAD + CW, WALL_Y + PAD],
  [WALL_X + PAD, WALL_Y + 2 * PAD + CH],
  [WALL_X + 2 * PAD + CW, WALL_Y + 2 * PAD + CH],
];

const GRID_X = 468;
const GRID_Y = 114;
const CELL_W = 24;
const CELL_H = 24;
const CELL_GAP_X = 3;
const CELL_GAP_Y = 4;

const MEM_X = 760;
const MEM_W = 260;
const MEM_Y = 150;
const FRAME_X = [800, 870, 940, 1000];
const FRAME_S = 18;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const regionRef = useRef<number | null>(null);
  const selAtRef = useRef(0);
  const [region, setRegion] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({
    text: '没有输入帧就没有新的隐码；但 h_t 仍保留上一帧的记忆。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number): void => {
      clearCrag(ctx, W, H);
      const sel = regionRef.current;
      const since = now - selAtRef.current;
      const pulse = 0.5 + 0.5 * Math.sin(now / 300);

      // 左：岩壁 + 四个虚线区域
      drawWall(ctx, WALL_X, WALL_Y, WALL_W, WALL_H, { veins: 3 });
      for (let i = 0; i < 4; i++) {
        const rx = REGIONS[i][0];
        const ry = REGIONS[i][1];
        const isSel = i === sel;
        ctx.save();
        if (isSel) {
          ctx.fillStyle = 'rgba(240,126,71,0.12)';
          ctx.fillRect(rx, ry, CW, CH);
        }
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = isSel ? EMPH : MUTED;
        ctx.lineWidth = isSel ? 3 : 1.5;
        ctx.strokeRect(rx, ry, CW, CH);
        ctx.restore();
      }

      // 编码箭头
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(392, 142);
      ctx.lineTo(448, 142);
      ctx.stroke();
      ctx.fillStyle = GUIDE;
      ctx.beginPath();
      ctx.moveTo(456, 142);
      ctx.lineTo(444, 135);
      ctx.lineTo(444, 149);
      ctx.closePath();
      ctx.fill();

      // 中：2×8 隐码格
      const active = sel === null ? [] : LATENT[sel];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 8; c++) {
          const idx = r * 8 + c;
          const x = GRID_X + c * (CELL_W + CELL_GAP_X);
          const y = GRID_Y + r * (CELL_H + CELL_GAP_Y);
          const order = active.indexOf(idx);
          let g = 0;
          if (order >= 0 && sel !== null) {
            g = clamp((since - order * 150) / 200, 0, 1);
          }
          ctx.fillStyle = order >= 0 ? `rgba(39,68,110,${0.15 + 0.85 * g})` : LINE;
          roundRect(ctx, x, y, CELL_W, CELL_H, 5);
          ctx.fill();
          if (order >= 0) {
            ctx.strokeStyle = GUIDE;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      // 右：记忆带（3 个过去帧 + 当前帧）
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(MEM_X, MEM_Y);
      ctx.lineTo(MEM_X + MEM_W, MEM_Y);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const isCur = i === 3;
        const bob = isCur && sel !== null ? -3 * pulse : 0;
        ctx.save();
        if (isCur && sel !== null) {
          ctx.globalAlpha = 0.2 + 0.25 * pulse;
          ctx.fillStyle = EMPH;
          ctx.beginPath();
          ctx.arc(FRAME_X[i], MEM_Y + bob, FRAME_S, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = isCur ? (sel === null ? MUTED : EMPH) : LINE;
        ctx.strokeStyle = isCur ? EMPH : LINE;
        ctx.lineWidth = 1.5;
        roundRect(ctx, FRAME_X[i] - FRAME_S / 2, MEM_Y + bob - FRAME_S / 2, FRAME_S, FRAME_S, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      drawSceneLabel(ctx, '隐码', GRID_X, 104, GUIDE);
      drawSceneLabel(ctx, '记忆带', MEM_X, 104, INK);
      drawLegend(
        ctx,
        [
          { color: EMPH, text: '当前画面' },
          { color: GUIDE, text: '激活隐码' },
        ],
        WALL_X,
        268
      );
    };

    const tick = (): void => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number | null): void => {
    if (i !== null && i === regionRef.current) {
      regionRef.current = null;
      selAtRef.current = performance.now();
      setRegion(null);
      setFeedback({ text: '没有输入帧就没有新的隐码；但 h_t 仍保留上一帧的记忆。', cls: 'good' });
      return;
    }
    regionRef.current = i;
    selAtRef.current = performance.now();
    setRegion(i);
    if (i === null) {
      setFeedback({ text: '没有输入帧就没有新的隐码；但 h_t 仍保留上一帧的记忆。', cls: 'good' });
    } else {
      const codes = LATENT[i];
      setFeedback({
        text: `这块画面 → z_t 上第 ${codes.join('、')} 号隐码激活；z_t 是当帧的随机表征，h_t 则把上一帧的路线带了过来。`,
        cls: '',
      });
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    for (let i = 0; i < 4; i++) {
      const rx = REGIONS[i][0];
      const ry = REGIONS[i][1];
      if (x >= rx && x <= rx + CW && y >= ry && y <= ry + CH) {
        select(i);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        {REGION_NAMES.map((name, i) => (
          <button
            key={name}
            className={'chip' + (region === i ? ' selected on' : '')}
            onClick={() => select(i)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M21;

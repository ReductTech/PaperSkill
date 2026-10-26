import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawTable,
  drawBall,
  drawShot,
  drawLegend,
  drawSceneLabel,
  seeded,
  GUIDE,
  OK,
  BAD,
  MUTED,
  INK,
  LINE,
  WOOD,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 1.1 三条路线的代价：切换路线，看数据如何被接纳、任务如何被覆盖。
const W = 1080;
const H = 280;

interface DataBall {
  x: number;
  y: number;
  expert: boolean;
}

const DATA: DataBall[] = (() => {
  const rnd = seeded(23);
  const out: DataBall[] = [];
  for (let i = 0; i < 14; i++) {
    out.push({ x: 62 + rnd() * 280, y: 76 + rnd() * 130, expert: i < 4 });
  }
  return out;
})();

const MODES = [
  {
    chip: '行为克隆',
    open: 46,
    fb: {
      text: '行为克隆默认示范接近最优：数据不精修就用不上，换任务往往还得重新收集。',
      cls: 'bad',
    },
  },
  {
    chip: '单任务 RL',
    open: 88,
    fb: {
      text: '一个任务一套权重，还要逐任务调参；任务一多，调参本身就成了瓶颈。',
      cls: '',
    },
  },
  {
    chip: '通用 RL',
    open: 120,
    fb: {
      text: '一套超参吃下大规模非精修多任务数据：104 个任务、4 个领域。代价是决策时要在隐空间里规划。',
      cls: 'good',
    },
  },
];

const TILES = [650, 740, 830, 920];
const TILE_W = 72;
const TILE_Y = 102;
const TILE_H = 72;
const GATE_X = 452;
const GATE_Y = 138;

function drawDial(ctx: CanvasRenderingContext2D, cx: number, cy: number, active: boolean): void {
  ctx.strokeStyle = active ? GUIDE : MUTED;
  ctx.fillStyle = active ? 'rgba(39,68,110,0.10)' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(-0.9) * 6, cy + Math.sin(-0.9) * 6);
  ctx.stroke();
}

function drawTileIcon(ctx: CanvasRenderingContext2D, i: number, cx: number, cy: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (i === 0) {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 16);
    ctx.lineTo(cx + 6, cy + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 6, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (i === 1) {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 12);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.lineTo(cx + 2, cy - 2);
    ctx.lineTo(cx + 10, cy - 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 2);
    ctx.lineTo(cx - 2, cy + 9);
    ctx.moveTo(cx + 2, cy - 2);
    ctx.lineTo(cx + 2, cy + 9);
    ctx.stroke();
  } else if (i === 2) {
    ctx.strokeRect(cx - 11, cy - 2, 12, 12);
    ctx.strokeRect(cx - 3, cy - 10, 12, 12);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy + 3, 11, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy + 3);
    ctx.lineTo(cx - 11, cy - 8);
    ctx.moveTo(cx + 11, cy + 3);
    ctx.lineTo(cx + 11, cy - 8);
    ctx.stroke();
  }
}

function render(ctx: CanvasRenderingContext2D, mode: number, open: number): void {
  clearScene(ctx, W, H);
  drawTable(ctx, 30, 38, 1020, 200);

  // 数据进入闸门的通道
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = GUIDE;
  ctx.beginPath();
  ctx.moveTo(352, 74);
  ctx.lineTo(GATE_X, GATE_Y - open / 2);
  ctx.lineTo(GATE_X, GATE_Y + open / 2);
  ctx.lineTo(352, 206);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // 数据球：四颗近专家、十颗非精修
  for (const b of DATA) {
    const accepted = mode !== 0 || b.expert;
    ctx.globalAlpha = accepted ? 1 : 0.32;
    drawBall(ctx, b.x, b.y, 7, b.expert ? OK : MUTED, b.expert);
    ctx.globalAlpha = 1;
    if (!accepted) {
      ctx.strokeStyle = BAD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + 10, b.y - 5);
      ctx.lineTo(b.x + 20, b.y + 5);
      ctx.moveTo(b.x + 20, b.y - 5);
      ctx.lineTo(b.x + 10, b.y + 5);
      ctx.stroke();
    }
  }

  // 闸门：两根立柱固定，上下夹板随路线开合
  const top = GATE_Y - open / 2;
  const bot = GATE_Y + open / 2;
  ctx.fillStyle = WOOD;
  ctx.fillRect(GATE_X, 78, 8, 124);
  ctx.fillRect(GATE_X + 40, 78, 8, 124);
  ctx.fillRect(GATE_X - 4, top - 4, 56, 5);
  ctx.fillRect(GATE_X - 4, bot - 1, 56, 5);

  if (mode === 0) {
    // 只放行近专家数据的细网
    ctx.strokeStyle = BAD;
    ctx.lineWidth = 1.2;
    for (let y = top + 7; y < bot - 3; y += 8) {
      ctx.beginPath();
      ctx.moveTo(GATE_X + 2, y);
      ctx.lineTo(GATE_X + 46, y);
      ctx.stroke();
    }
  } else if (mode === 1) {
    for (let i = 0; i < TILES.length; i++) drawDial(ctx, TILES[i] + 36, 86, i === 0);
  } else {
    drawDial(ctx, GATE_X + 24, 62, true);
  }

  // 闸门到任务的连接
  const busEnd = mode === 2 ? TILES[3] + 36 : TILES[0] + 36;
  drawShot(ctx, [[GATE_X + 48, GATE_Y], [busEnd, GATE_Y]], GUIDE, 2);

  // 四个领域任务位
  for (let i = 0; i < TILES.length; i++) {
    const covered = mode === 2 || i === 0;
    const x = TILES[i];
    ctx.fillStyle = covered ? '#eef2f8' : '#f7faf3';
    ctx.fillRect(x, TILE_Y, TILE_W, TILE_H);
    ctx.strokeStyle = covered ? GUIDE : LINE;
    ctx.lineWidth = covered ? 2 : 1.2;
    ctx.strokeRect(x + 0.5, TILE_Y + 0.5, TILE_W - 1, TILE_H - 1);
    drawTileIcon(ctx, i, x + TILE_W / 2, TILE_Y + TILE_H / 2, covered ? GUIDE : MUTED);
  }

  drawSceneLabel(ctx, '数据', 58, 30, INK);
  drawSceneLabel(ctx, '任务', 650, 30, INK);
  drawLegend(
    ctx,
    [
      { color: OK, text: '纳入' },
      { color: BAD, text: '被拒' },
      { color: GUIDE, text: '覆盖' },
    ],
    58,
    266
  );
}

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ mode: 0, open: MODES[0].open });
  const [mode, setMode] = useState(0);
  const [feedback, setFeedback] = useState(MODES[0].fb);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const st = stateRef.current;
      st.open = lerp(st.open, MODES[st.mode].open, 0.14);
      if (Math.abs(st.open - MODES[st.mode].open) < 0.5) st.open = MODES[st.mode].open;
      render(ctx, st.mode, clamp(st.open, 30, 120));
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

  const pick = (i: number) => {
    stateRef.current.mode = i;
    setMode(i);
    setFeedback(MODES[i].fb);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" style={{ marginTop: 12 }}>
        {MODES.map((m, i) => (
          <button
            key={m.chip}
            className={'chip' + (mode === i ? ' selected' : '')}
            onClick={() => pick(i)}
          >
            {m.chip}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M11;

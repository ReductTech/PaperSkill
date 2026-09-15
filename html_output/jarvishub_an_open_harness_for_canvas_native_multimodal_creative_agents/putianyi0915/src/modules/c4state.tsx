import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 模块 4.1「一轮创作改变了画布的哪一部分」（1080×280）
// 左侧 scene：织片上新出现的一行（局部修复模式下是重织区间 + 记号扣）
// 右侧 panels：C_t 的五个分量条 Gₜ / Xₜ / Mₜ / Uₜ / Lₜ

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const SLATE = '#68778f';
const INK = '#21324a';
const RED = '#c43f52';

const FX = 40;
const FY = 26;
const CW = 40;
const CH = 32;
const COLS = 6;
const ROWS = 5;

const PANEL_X = 470;
const SLOT = 118;
const BAR_W = 46;
const BASE_Y = 248;
const MAX_H = 148;

const REPAIR_ROWS = 3;

type KindId = 'tool' | 'toolEval' | 'toolHuman' | 'repair';

const KINDS: { id: KindId; label: string }[] = [
  { id: 'tool', label: '仅工具调用' },
  { id: 'toolEval', label: '工具 + 自动评估' },
  { id: 'toolHuman', label: '工具 + 人工反馈' },
  { id: 'repair', label: '反馈触发局部修复' },
];

const BARS: { sym: string; name: string; color: string }[] = [
  { sym: 'G\u209c', name: '产物图', color: BLUE },
  { sym: 'X\u209c', name: '内容', color: BLUE },
  { sym: 'M\u209c', name: '元数据', color: PURPLE },
  { sym: 'U\u209c', name: '交互记录', color: ORANGE },
  { sym: 'L\u209c', name: '布局', color: SLATE },
];

const TOUCHED: Record<KindId, boolean[]> = {
  tool: [true, true, false, false, false],
  toolEval: [true, true, true, false, false],
  toolHuman: [true, true, true, true, false],
  repair: [true, true, true, true, true],
};

const FEEDBACK: Record<KindId, { text: string; cls: string }> = {
  tool: { text: '这一轮只写入产物与内容：画布多了新节点，但没有人知道它好不好。', cls: '' },
  toolEval: { text: '加入了自动评估：运行元数据里多了诊断信息。', cls: '' },
  toolHuman: { text: '人工反馈被记录为交互记录，下一轮可以据此决定继续或修改。', cls: 'good' },
  repair: { text: '这一轮没有重做整件，只回退了受影响的 3 行并重新织好。', cls: 'good' },
};

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const gy = H * 0.74;
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, gy, W, H - gy);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(W, gy);
  ctx.stroke();
}

function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.44);
  ctx.quadraticCurveTo(cx - s * 0.2, cy + s * 0.3, cx, cy + s * 0.46);
  ctx.quadraticCurveTo(cx + s * 0.2, cy + s * 0.3, cx + s * 0.5, cy - s * 0.44);
  ctx.stroke();
  ctx.restore();
}

/** 记号扣：橙色小环 + 一段别针。 */
function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 7);
  ctx.lineTo(x - 11, y + 26);
  ctx.stroke();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, mode: KindId, barH: number[], rowAlpha: number): void {
  clearScene(ctx);

  // 既有织片
  ctx.save();
  ctx.globalAlpha = 0.72;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawKnit(ctx, FX + c * CW + CW / 2, FY + r * CH + CH / 2, 26, BLUE, 3);
    }
  }
  ctx.restore();

  // 本轮新增的一行
  const ny = FY + ROWS * CH + CH / 2;
  ctx.save();
  ctx.globalAlpha = 0.14 * rowAlpha;
  ctx.fillStyle = BLUE;
  roundRectPath(ctx, FX - 8, ny - CH / 2 - 3, COLS * CW + 16, CH + 6, 9);
  ctx.fill();
  ctx.restore();

  const lastRepaired = 1 + REPAIR_ROWS - 1;
  for (let c = 0; c < COLS; c++) {
    const isRepair = mode === 'repair' && c >= 1 && c <= lastRepaired;
    ctx.save();
    ctx.globalAlpha = rowAlpha;
    drawKnit(
      ctx,
      FX + c * CW + CW / 2,
      ny,
      26,
      isRepair ? GREEN : BLUE,
      isRepair ? 4.5 : 3.6
    );
    ctx.restore();
  }

  if (mode === 'repair') {
    drawMarker(ctx, FX + CW, ny, rowAlpha);
  }
  if (mode === 'tool') {
    ctx.save();
    ctx.globalAlpha = rowAlpha;
    ctx.fillStyle = RED;
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('?', FX + COLS * CW + 14, ny + 8);
    ctx.restore();
  }

  // C_t 的五个分量条
  for (let i = 0; i < 5; i++) {
    const cx = PANEL_X + SLOT * (i + 0.5);
    const bx = cx - BAR_W / 2;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = LINE;
    roundRectPath(ctx, bx, BASE_Y - MAX_H, BAR_W, MAX_H, 6);
    ctx.fill();
    ctx.restore();

    const on = barH[i] > 0.5;
    const h = Math.max(6, barH[i] * MAX_H);
    ctx.save();
    ctx.fillStyle = on ? BARS[i].color : LINE;
    roundRectPath(ctx, bx, BASE_Y - h, BAR_W, h, 6);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = on ? BARS[i].color : SLATE;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(BARS[i].sym, cx, BASE_Y + 20);
  }

  // 最多两个短标签
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = '17px "Segoe UI", sans-serif';
  ctx.fillText(mode === 'repair' ? '退回后重织' : '本轮新增一行', 34, 22);
  ctx.fillStyle = SLATE;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.fillText('五个分量', PANEL_X, 30);
}

export const Ch4State: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<KindId>('tool');
  const barHRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const animRef = useRef<{ start: number }>({ start: -1e9 });
  const [mode, setMode] = useState<KindId>('tool');
  const [feedback, setFeedback] = useState(FEEDBACK.tool);

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
      const m = modeRef.current;
      const rowAlpha = easeOutCubic(clamp((performance.now() - animRef.current.start) / 320, 0, 1));
      const touched = TOUCHED[m];
      const hs = barHRef.current;
      for (let i = 0; i < 5; i++) {
        hs[i] += ((touched[i] ? 1 : 0) - hs[i]) * 0.16;
      }
      render(ctx, m, hs, rowAlpha);
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

  const pick = (id: KindId) => {
    if (id === modeRef.current) return;
    modeRef.current = id;
    animRef.current = { start: performance.now() };
    setMode(id);
    setFeedback(FEEDBACK[id]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={k.id === mode ? 'chip selected' : 'chip'}
            onClick={() => pick(k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="hotspot-info">
        {BARS.map((b) => `${b.sym} ${b.name}`).join('　·　')}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4State;

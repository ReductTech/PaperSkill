import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 7.1（1080×280，P1 滑块）：拖动 α，看奖励曲线 Rsem = exp(−α·(1−Sim))
// 从平缓变陡峭，以及四张候选恢复照片的边框随 α 在「可接受」与「被惩罚」之间切换。

const W = 1080;
const H = 280;

const ALPHA_MIN = 0.5;
const ALPHA_MAX = 15;
const ALPHA_STEP = 0.5;
const ALPHA_DEFAULT = 5;
const PUNISH_FROM = 8;

type CandidateKind = 'ok' | 'shift' | 'broken' | 'perfect';

interface Candidate {
  kind: CandidateKind;
  x: number;
}

const CAND_W = 100;
const CAND_H = 100;
const CAND_Y = 70;

// 同一人像的四张候选恢复照片：语义正确 / 偏色 / 结构错误 / 正确且清晰
const CANDIDATES: Candidate[] = [
  { kind: 'ok', x: 530 },
  { kind: 'shift', x: 654 },
  { kind: 'broken', x: 778 },
  { kind: 'perfect', x: 902 },
];

// 左侧白色内衬中的奖励曲线
const PANEL_X = 60;
const PANEL_Y = 20;
const PANEL_W = 420;
const PANEL_H = 216;
const PX0 = 108;
const PX1 = 456;
const PY0 = 50;
const PY1 = 188;

/* ---------------- 绘图工具（局部实现，签名固定） ---------------- */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function speck(i: number): number {
  const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return s - Math.floor(s);
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
) {
  const d = clamp(damage, 0, 1);
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fillStyle = stateColor ? stateColor : '#d7deea';
  ctx.fill();
  const pad = 6;
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + pad, y + pad, cw, ch);
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const px = x + pad + speck(i * 3 + 1) * cw;
    const py = y + pad + speck(i * 3 + 2) * ch;
    const size = 1 + speck(i * 3 + 3) * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(px, py, size, size);
  }
  const cracks = Math.round(clamp(4 * d, 0, 4));
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < cracks; i++) {
    const sx = x + pad + speck(i * 7 + 40) * cw;
    const sy = y + pad + speck(i * 7 + 41) * ch;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 8 + speck(i * 7 + 42) * 16, sy + 6 + speck(i * 7 + 43) * 14);
    ctx.lineTo(sx + 14 + speck(i * 7 + 44) * 22, sy + 16 + speck(i * 7 + 45) * 20);
    ctx.stroke();
  }
}

function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, clarity: number) {
  const alpha = clamp(0.15 + 0.85 * clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.arc(cx - r * 0.38, cy - r * 0.15, Math.max(1, r * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.38, cy - r * 0.15, Math.max(1, r * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.5, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  if (clarity >= 0.95) {
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 8, r * 0.45, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();
}

/** 结构错误：轮廓断开且整体错位。 */
function drawBrokenFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.12, Math.PI * 0.86);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 6, cy + 8, r * 0.85, Math.PI * 1.02, Math.PI * 1.72);
  ctx.stroke();
  ctx.fillStyle = '#21324a';
  ctx.beginPath();
  ctx.arc(cx - r * 0.5, cy - r * 0.3, Math.max(1, r * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.12, cy - r * 0.58, Math.max(1, r * 0.11), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 被惩罚标记：候选下方的红色叉。 */
function drawPenaltyMark(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = '#c43f52';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 7);
  ctx.lineTo(cx + 7, cy + 7);
  ctx.moveTo(cx + 7, cy - 7);
  ctx.lineTo(cx - 7, cy + 7);
  ctx.stroke();
  ctx.restore();
}

function drawPanel(ctx: CanvasRenderingContext2D) {
  roundRectPath(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawCurve(ctx: CanvasRenderingContext2D, alpha: number) {
  // 坐标轴
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PX0, PY0 - 8);
  ctx.lineTo(PX0, PY1);
  ctx.lineTo(PX1 + 8, PY1);
  ctx.stroke();

  // 奖励曲线，实时随 α 重绘
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const sim = lerp(0.9, 1, i / 120);
    const reward = clamp(Math.exp(-alpha * (1 - sim)), 0, 1);
    const px = lerp(PX0, PX1, (sim - 0.9) / 0.1);
    const py = lerp(PY1, PY0, reward);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 刻度：只写裸数字
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillStyle = '#68778f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('0.9', PX0, PY1 + 18);
  ctx.fillText('0.95', (PX0 + PX1) / 2, PY1 + 18);
  ctx.fillText('1', PX1, PY1 + 18);
  ctx.textAlign = 'right';
  ctx.fillText('0', PX0 - 8, PY1 + 4);
  ctx.fillText('0.5', PX0 - 8, (PY0 + PY1) / 2 + 4);
  ctx.fillText('1', PX0 - 8, PY0 + 4);
  // 两条短轴标签
  ctx.fillStyle = '#21324a';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('相似度', (PX0 + PX1) / 2, PY1 + 42);
  ctx.fillText('奖励', PX0 - 26, PY0 - 14);
  ctx.restore();
}

function drawCandidate(ctx: CanvasRenderingContext2D, cand: Candidate, alpha: number) {
  const deviant = cand.kind === 'shift' || cand.kind === 'broken';
  const punished = deviant && alpha >= PUNISH_FROM;
  const border = deviant ? (punished ? '#c43f52' : '#27446e') : '#228d5c';
  const damage = cand.kind === 'broken' ? 0.42 : cand.kind === 'shift' ? 0.04 : cand.kind === 'ok' ? 0.06 : 0;
  drawPhoto(ctx, cand.x, CAND_Y, CAND_W, CAND_H, damage, border);
  const cx = cand.x + CAND_W / 2;
  const cy = CAND_Y + CAND_H / 2;
  if (cand.kind === 'shift') {
    // 语义漂移：内容整体偏色
    ctx.save();
    ctx.fillStyle = 'rgba(196,63,82,0.22)';
    ctx.fillRect(cand.x + 6, CAND_Y + 6, CAND_W - 12, CAND_H - 12);
    ctx.restore();
    drawFace(ctx, cx, cy, 24, 0.9);
  } else if (cand.kind === 'broken') {
    drawBrokenFace(ctx, cx, cy, 24);
  } else if (cand.kind === 'perfect') {
    drawFace(ctx, cx, cy, 24, 1);
  } else {
    drawFace(ctx, cx, cy, 24, 0.8);
  }
  if (punished) drawPenaltyMark(ctx, cx, CAND_Y + CAND_H + 16);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; text: string }>,
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  for (let i = 0; i < items.length; i++) {
    ctx.fillStyle = items[i].color;
    ctx.fillRect(cx, y - 6, 12, 12);
    ctx.fillStyle = '#68778f';
    ctx.fillText(items[i].text, cx + 17, y);
    cx += 37 + ctx.measureText(items[i].text).width;
  }
  ctx.restore();
}

/* ---------------- 反馈文案与数值格式 ---------------- */

function alphaValue(alpha: number): string {
  if (alpha <= 1) return alpha.toFixed(1);
  return Number.isInteger(alpha) ? String(alpha) : alpha.toFixed(1);
}

function feedbackFor(alpha: number): { text: string; cls: string } {
  const v = alphaValue(alpha);
  if (alpha <= 1) {
    return { text: `α = ${v}：曲线过平，语义约束不足`, cls: '' };
  }
  if (alpha <= PUNISH_FROM) {
    return { text: `α = ${v}：温和区间，性能稳定（与最佳差距 < 0.6%）`, cls: 'good' };
  }
  return {
    text: `α = ${v}：曲线过陡，过度惩罚语义偏差，像素细节被牺牲（α=15 时 PSNR 21.49→20.87）`,
    cls: 'bad',
  };
}

/* ---------------- 组件 ---------------- */

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ alpha: ALPHA_DEFAULT, drawn: ALPHA_DEFAULT });
  const rafRef = useRef<number | null>(null);
  const [alpha, setAlpha] = useState<number>(ALPHA_DEFAULT);
  const [feedback, setFeedback] = useState({ text: 'α = 5（默认）：奖励平滑，对轻微语义偏差宽容', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = 0;

    const render = (curveAlpha: number, borderAlpha: number) => {
      clearScene(ctx, W, H);
      drawPanel(ctx);
      drawCurve(ctx, curveAlpha);
      for (let i = 0; i < CANDIDATES.length; i++) {
        drawCandidate(ctx, CANDIDATES[i], borderAlpha);
      }
      drawLegend(
        ctx,
        [
          { color: '#228d5c', text: '正确' },
          { color: '#27446e', text: '偏差' },
          { color: '#c43f52', text: '惩罚' },
        ],
        530,
        44
      );
    };

    const tick = (now: number) => {
      const dt = last ? now - last : 16;
      last = now;
      const s = stateRef.current;
      s.drawn = s.drawn + (s.alpha - s.drawn) * clamp(dt / 220, 0, 1);
      if (Math.abs(s.alpha - s.drawn) < 0.004) s.drawn = s.alpha;
      render(s.drawn, s.alpha);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const go = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, go, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = clamp(Number(e.target.value), ALPHA_MIN, ALPHA_MAX);
    stateRef.current.alpha = a;
    setAlpha(a);
    setFeedback(feedbackFor(a));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          语义奖励 α <span className="val">{alphaValue(alpha)}</span>
        </label>
        <input
          type="range"
          min={ALPHA_MIN}
          max={ALPHA_MAX}
          step={ALPHA_STEP}
          value={alpha}
          onChange={onChange}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;

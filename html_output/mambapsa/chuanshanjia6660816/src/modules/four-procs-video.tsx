import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* §5.2 四种处理器动画（按钮驱动）。
   画布下方放四个按钮，每个按钮绘制一种处理器的独立循环动画：
   卷积(局部窗口滑动) / RNN(顺序递推) / 自注意力(两两打分) / Mamba(线性扫描)。
   同一串 8 个 token，四种算法各自循环演示怎么算。 */

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const F = '"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

const W = 800;
const H = 420;

type Proc = 'conv' | 'rnn' | 'attn' | 'mamba';

const PROC_INFO: Record<Proc, { label: string; title: string; text: string; cls: string }> = {
  conv: {
    label: '卷积',
    title: '卷积 · 局部窗口滑动',
    text: '卷积：滑动窗口只看 k=3 的邻居，参数共享、平移不变；开销 O(N·k)，感受野局部。',
    cls: '',
  },
  rnn: {
    label: 'RNN',
    title: 'RNN · 顺序递推',
    text: 'RNN：沿序列逐步递推，隐状态携带全部历史；每步固定开销，但前后步依赖、难并行。',
    cls: '',
  },
  attn: {
    label: '自注意力',
    title: '自注意力 · 两两打分',
    text: '自注意力：每个 query 与所有 key 各打一次分，覆盖全部位置；信息全局，但开销 O(N²)。',
    cls: '',
  },
  mamba: {
    label: 'Mamba',
    title: 'Mamba · 线性扫描',
    text: 'Mamba：一趟线性扫描加隐状态，每步固定开销；总代价 O(N)，全局且高效。',
    cls: 'good',
  },
};

/* ---------- 基础绘制 ---------- */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.scene;
  ctx.fillRect(0, 0, W, H);
}
function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = C.ink,
  dash = false
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  if (dash) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

/* ---------- 公共：同一串 token ---------- */
const N = 8, TS = 36, PITCH = 56, X0 = 60, Y = 200;
const tokX = (i: number) => X0 + i * PITCH;
function drawTokenRow(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < N; i++) {
    ctx.fillStyle = '#ffffff';
    rr(ctx, tokX(i), Y, TS, TS, 6);
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}
// 每个处理器独立的循环（tp 为周期内秒数）
const fadeOut = (tp: number, cycle: number) => clamp((cycle - 0.12 - tp) / 0.12, 0, 1);

function drawConv(ctx: CanvasRenderingContext2D, tp: number, cycle: number) {
  drawTokenRow(ctx);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('输入序列', X0, Y - 14);

  const fo = fadeOut(tp, cycle);
  // 窗口按步前进：每步停在一个 token 上，出一个输出
  const stepDur = (cycle * 0.72) / N;
  const c = clamp(Math.floor(tp / stepDur), 0, N - 1);
  const inStep = clamp((tp - c * stepDur) / (stepDur * 0.5), 0, 1);

  // 窗口框住 c 及左右邻居
  const lo = Math.max(0, c - 1);
  const hi = Math.min(N - 1, c + 1);
  const wx = tokX(lo) - 4;
  const ww = (hi - lo) * PITCH + TS + 8;
  ctx.globalAlpha = fo;
  ctx.fillStyle = 'rgba(217,119,6,0.18)';
  rr(ctx, wx, Y - 4, ww, TS + 8, 8);
  ctx.fill();
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(217,119,6,0.38)';
  rr(ctx, tokX(c), Y, TS, TS, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 13px ${F}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('x' + (c + 1), tokX(c) + TS / 2, Y + TS / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;

  // 输出 y：窗口走到第 i 个 token 才在它正下方出一个，与窗口一一对应
  const outY = Y + TS + 52;
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('输出序列（每滑一步出一个）', X0, outY - 12);
  for (let i = 0; i < N; i++) {
    const appear = i < c ? 1 : i === c ? inStep : 0;
    const o = appear * fo;
    if (o <= 0) continue;
    ctx.globalAlpha = o;
    ctx.fillStyle = C.orange;
    rr(ctx, tokX(i), outY, TS, TS, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 13px ${F}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('y' + (i + 1), tokX(i) + TS / 2, outY + TS / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = 1;
  }

  ctx.font = `bold 14px ${F}`;
  ctx.fillStyle = C.orange;
  ctx.fillText('窗口 k=3', 620, 96);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('每滑一步出一个 · O(N·k)', 620, 118);
}

function drawRnn(ctx: CanvasRenderingContext2D, tp: number, cycle: number) {
  drawTokenRow(ctx);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('输入序列', X0, Y - 14);

  const fo = fadeOut(tp, cycle);
  const t = clamp(Math.round(lerp(0, N, easeInOutQuad(clamp(tp / (cycle * 0.78), 0, 1)))), 0, N);

  ctx.globalAlpha = fo;
  for (let i = 0; i < N; i++) {
    if (i >= t) continue;
    ctx.fillStyle = C.blue;
    rr(ctx, tokX(i), Y, TS, TS, 6);
    ctx.fill();
  }
  if (t < N) {
    const pulse = 0.5 + 0.5 * Math.sin(tp * 7);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tokX(t) + TS / 2, Y + TS / 2, TS / 2 + 3 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const hx = 660, hy = 218;
  const hr = 12 + (t / N) * 12;
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 15px ${F}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('h', hx, hy + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.blue;
  ctx.font = `bold 13px ${F}`;
  ctx.fillText('隐状态 h（携带全部历史）', hx - 76, hy - hr - 12);

  if (t > 0) {
    const fromX = tokX(t - 1) + TS + 6;
    arrow(ctx, fromX, Y + TS / 2, hx - hr - 4, hy, C.blue);
  }
  const outY = Y + TS + 52;
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('每步读出一个输出', X0, outY - 12);
  for (let i = 0; i < t; i++) {
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(tokX(i) + TS / 2, outY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 11px ${F}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('y', tokX(i) + TS / 2, outY + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = C.ink;
  ctx.font = `bold 14px ${F}`;
  ctx.fillText('前后步依赖 · 难并行', 620, 96);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('训练难以整条并行', 620, 118);
}

function drawAttn(ctx: CanvasRenderingContext2D, tp: number, cycle: number) {
  drawTokenRow(ctx);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('query（当前 token）', X0, Y - 14);

  const perQ = cycle / N;
  const q = clamp(Math.floor(tp / perQ), 0, N - 1);
  const qx = tokX(q) + TS / 2;
  const qy = Y + TS / 2;
  for (let i = 0; i < N; i++) {
    const a = clamp((tp - (q * perQ + 0.14 + i * 0.05)) / 0.2, 0, 1);
    if (a <= 0) continue;
    const tx = tokX(i) + TS / 2;
    ctx.strokeStyle = `rgba(196,63,82,${0.6 * a})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    ctx.lineTo(tx, qy);
    ctx.stroke();
    ctx.setLineDash([]);
    if (i !== q) {
      ctx.fillStyle = `rgba(196,63,82,${0.7 * a})`;
      ctx.beginPath();
      ctx.arc(tx, qy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = C.red;
  rr(ctx, tokX(q), Y, TS, TS, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 13px ${F}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('q' + (q + 1), tokX(q) + TS / 2, Y + TS / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = C.red;
  ctx.font = `bold 14px ${F}`;
  ctx.fillText(`query ${q + 1}/${N} · 打分 N×N`, 620, 96);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('对全部 key 打分 · 全局', 620, 118);
}

function drawMamba(ctx: CanvasRenderingContext2D, tp: number, cycle: number) {
  drawTokenRow(ctx);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('输入序列（一趟扫过）', X0, Y - 14);

  const fo = fadeOut(tp, cycle);
  const p = clamp(tp / (cycle * 0.8), 0, 1);
  const head = X0 + p * (N - 1) * PITCH + TS / 2;
  ctx.globalAlpha = fo;
  for (let i = 0; i < N; i++) {
    const cx = tokX(i) + TS / 2;
    if (cx <= head) {
      ctx.fillStyle = 'rgba(34,141,92,0.28)';
      rr(ctx, tokX(i), Y, TS, TS, 6);
      ctx.fill();
    }
  }
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.arc(head, Y + TS / 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,141,92,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(head, Y + TS / 2, 13 + Math.sin(tp * 9) * 3, 0, Math.PI * 2);
  ctx.stroke();

  const barY = Y + TS + 52;
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('隐状态 h（记忆沿途要点）', X0, barY - 10);
  ctx.fillStyle = '#ffffff';
  rr(ctx, X0, barY, 300, 14, 7);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (p > 0) {
    ctx.fillStyle = C.green;
    rr(ctx, X0, barY, Math.max(3, 300 * p), 14, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = C.ink;
  ctx.font = `bold 14px ${F}`;
  ctx.fillText(`扫描到第 ${Math.round(p * N)}/${N} 个`, 620, 96);
  ctx.fillStyle = C.muted;
  ctx.font = `13px ${F}`;
  ctx.fillText('每步固定开销 · O(N)', 620, 118);
}

const CYCLE: Record<Proc, number> = { conv: 4.8, rnn: 5, attn: 4.4, mamba: 4.5 };

function drawProc(ctx: CanvasRenderingContext2D, proc: Proc, tp: number) {
  const cycle = CYCLE[proc];
  switch (proc) {
    case 'conv': drawConv(ctx, tp, cycle); break;
    case 'rnn': drawRnn(ctx, tp, cycle); break;
    case 'attn': drawAttn(ctx, tp, cycle); break;
    default: drawMamba(ctx, tp, cycle); break;
  }
}

function drawHeader(ctx: CanvasRenderingContext2D, proc: Proc) {
  ctx.font = `bold 16px ${F}`;
  const tw = ctx.measureText(PROC_INFO[proc].title).width;
  rr(ctx, 16, 14, tw + 36, 26, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.fillText(PROC_INFO[proc].title, 32, 32);
}

/* ---------- 组件 ---------- */
export const FourProcsVideo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<Proc>('conv');
  const t0Ref = useRef(performance.now());
  const [proc, setProc] = useState<Proc>('conv');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (p: Proc, t: number) => {
      clearScene(ctx);
      drawHeader(ctx, p);
      drawProc(ctx, p, (t / 1000) % CYCLE[p]);
    };
    const tick = (t: number) => {
      render(stateRef.current, t - t0Ref.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const setState = (p: Proc) => {
    stateRef.current = p;
    setProc(p);
  };

  const order: Proc[] = ['conv', 'rnn', 'attn', 'mamba'];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {order.map((p) => (
          <button
            type="button"
            key={p}
            className={`chip ${proc === p ? 'selected' : ''}`}
            onClick={() => setState(p)}
          >
            {PROC_INFO[p].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${PROC_INFO[proc].cls}`}>{PROC_INFO[proc].text}</div>
    </div>
  );
};

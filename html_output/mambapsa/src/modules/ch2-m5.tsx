import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.5：PSA 的注意力是怎么算的（详细版）。
// 独立的注意力算法讲解：1×1 卷积投影 Q/K/V → 展平 token → 打分 → softmax 归一 → 加权求和。
const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(ang - 0.35), y2 - 9 * Math.sin(ang - 0.35));
  ctx.lineTo(x2 - 9 * Math.cos(ang + 0.35), y2 - 9 * Math.sin(ang + 0.35));
  ctx.closePath(); ctx.fill();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke: string, lw: number) {
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, 7); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

const W = 560, H = 240;
const N_TOK = 6, FOCUS = 2;
const TW = 44, TH = 28, TG = 10;
const TX0 = (W - (N_TOK * TW + (N_TOK - 1) * TG)) / 2; // 123

const STEPS = [
  {
    key: 'qkv',
    title: '投影 + 展平：特征图拆成 Q、K、V 三份',
    desc: 'a 分支先用 1×1 卷积把通道投影成三份：Q（query，想找什么）、K（key，有什么）、V（value，提供什么），再展平成 N 个 token 供注意力打分。它们是注意力计算的原料。',
  },
  {
    key: 'score',
    title: '打分：Q·Kᵀ / √d',
    desc: '每个 token 拿自己的 Q 和所有 token 的 K 做点积，再除以 √d 防止数值过大，得到注意力分数——分数越高，说明这两个位置越相关。',
  },
  {
    key: 'softmax',
    title: 'softmax 归一：分数变成权重',
    desc: '一行分数过 softmax 变成权重，和恒为 1：分数高的权重高，分数低的被压到接近 0。',
  },
  {
    key: 'sum',
    title: '加权求和 → 输出',
    desc: '按权重把所有 V 加权求和，得到这个位置的输出——它把整块特征的信息聚合进来了，这就是全局聚合。',
  },
] as const;

export const Ch2M5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '注意力就三步：1×1 卷积投影出 Q/K/V → 打分 → softmax 归一后加权求和。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawTokenRow = () => {
      for (let i = 0; i < N_TOK; i++) {
        const x = TX0 + i * (TW + TG), y = 30;
        rr(ctx, x, y, TW, TH, 7);
        ctx.fillStyle = i === FOCUS ? 'rgba(124,58,237,0.14)' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = i === FOCUS ? C.purple : C.line;
        ctx.lineWidth = i === FOCUS ? 2 : 1;
        ctx.stroke();
        ctx.fillStyle = i === FOCUS ? C.purple : C.muted;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`t${i}`, x + TW / 2, y + TH / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      ctx.fillStyle = C.purple; ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('聚焦 token：t2', TX0 + FOCUS * (TW + TG), 22);
    };
    const caption = (text: string, y = 208) => {
      ctx.fillStyle = C.muted; ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(text, 24, y);
    };
    const drawWeightBars = () => {
      const weights = [0.05, 0.10, 0.15, 0.28, 0.22, 0.20];
      const bBottom = 158, maxH = 62;
      weights.forEach((w, i) => {
        const x = TX0 + i * (TW + TG);
        const h = Math.round(w * maxH);
        ctx.fillStyle = i === FOCUS ? C.purple : C.blue;
        rr(ctx, x, bBottom - h, TW, h, 4); ctx.fill();
        ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(w.toFixed(2), x + TW / 2, bBottom + 13);
        ctx.textAlign = 'left';
      });
      return { bBottom, maxH };
    };

    const render = (s: { step: number }, t: number) => {
      clearScene(ctx, W, H);
      const active = STEPS[s.step];
      drawTokenRow();

      if (active.key === 'qkv') {
        const fx = TX0 + FOCUS * (TW + TG) + TW / 2, fy = 58;
        const qkv = [
          { x: 148, label: 'Q', sub: '找什么' },
          { x: 248, label: 'K', sub: '有什么' },
          { x: 348, label: 'V', sub: '提供什么' },
        ];
        qkv.forEach((b) => {
          box(ctx, b.x, 98, 78, 42, 'rgba(39,68,110,0.08)', C.blue, 1.6);
          ctx.fillStyle = C.ink; ctx.font = 'bold 17px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, b.x + 39, 116);
          ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
          ctx.fillText(b.sub, b.x + 39, 131);
          ctx.textAlign = 'left';
          arrow(ctx, fx, fy, b.x + 39, 98, C.line);
        });
        caption('先用 1×1 卷积投影出 Q、K、V，再展平成 token——注意力的三份原料。');
      } else if (active.key === 'score') {
        const prog = (t % 1800) / 1800;
        const M = 6, CELL = 10, GAP = 2;
        const total = M * M;
        const filled = Math.floor(prog * total);
        const mx = 92, my = 100;
        ctx.fillStyle = '#ffffff';
        rr(ctx, mx - 8, my - 26, M * CELL + (M - 1) * GAP + 16, 46 + M * CELL + (M - 1) * GAP, 8); ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('注意力分数矩阵（6×6，无 mask）', mx - 4, my - 8);
        ctx.fillStyle = C.ink; ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText('score = q·k / √d', mx + 96, my + 16);
        let cnt = 0;
        for (let r = 0; r < M; r++) {
          for (let c = 0; c < M; c++) {
            ctx.fillStyle = cnt < filled ? C.red : '#e9eef4';
            ctx.fillRect(mx + c * (CELL + GAP), my + r * (CELL + GAP), CELL, CELL);
            cnt++;
          }
        }
        ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(`打分：${filled}/${total}`, mx - 4, my + M * CELL + (M - 1) * GAP + 18);
        caption('每个 token 拿自己的 Q 和所有 token 的 K 点积，除以 √d 防数值过大——逐个两两打分。');
      } else if (active.key === 'softmax') {
        drawWeightBars();
        ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('softmax 归一：一行分数 → 权重（和为 1）', 24, 92);
        ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText('聚焦 token t2 的一行权重', 24, 122);
        caption('分数高 → 权重高；分数低 → 压到接近 0。每行权重之和恒为 1。');
      } else {
        const { bBottom, maxH } = drawWeightBars();
        ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('加权求和：Σ w·V', 24, 92);
        ctx.fillStyle = C.purple; ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('→ 输出', 452, bBottom - maxH / 2 + 4);
        ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('按权重把 V 加权求和', 454, bBottom - maxH / 2 + 22);
        caption('按权重把所有 V 加权求和，得到该位置的输出——整块特征的信息聚合进来了。');
      }
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (i: number) => {
    const s = Math.max(0, Math.min(STEPS.length - 1, i));
    stateRef.current.step = s; setStep(s);
    const st = STEPS[s];
    setFeedback(
      s === STEPS.length - 1
        ? { text: '自注意力 = 投影 Q/K/V → 打分 Q·Kᵀ/√d → softmax 归一 → 加权求和 V。每个位置都这样聚合整块信息，所以是“全局”，也所以是 O(N²)——N 个位置，每个都要和全部 N 个 key 打分。', cls: 'good' }
        : { text: st.desc, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>上一步</button>
        <div className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步
        </div>
        <button className="tiny" disabled={step === STEPS.length - 1} onClick={() => go(step + 1)}>下一步</button>
      </div>
      <div className="step-desc">{STEPS[step].title}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

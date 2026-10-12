import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawShorthand,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
} from './packKit';
import type { WidgetProps } from './registry';

// Module 6.1 — BPE merge stepper (P2). A sparse integer string (lots of 0s)
// shrinks round by round: the frequent adjacent pair is circled (orange ring)
// and replaced by ONE new merged symbol (bigger purple glyph).
const W = 1080;
const H = 280;
const SYM = 1000; // 1001..1006 render as merged symbols ①..⑥
const GAP_C = 7;

const CIRC = ['①', '②', '③', '④', '⑤', '⑥'];

// strings after 0..6 merges (verified by hand: pair counts, greedy left-to-right)
const SEQ: number[][] = [
  [124, -86, 344, -45, 178, 12, 0, 3, 0, 3, 15, -3, 0, 1, 0, 0, 1, 12, 0, 3, 0, 5, -2, 0],
  [124, -86, 344, -45, 178, 12, 1001, 1001, 15, -3, 0, 1, 0, 0, 1, 12, 1001, 0, 5, -2, 0],
  [124, -86, 344, -45, 178, 12, 1001, 1001, 15, -3, 1002, 0, 1002, 12, 1001, 0, 5, -2, 0],
  [124, -86, 344, -45, 178, 1003, 1001, 15, -3, 1002, 0, 1002, 1003, 0, 5, -2, 0],
  [124, -86, 344, -45, 178, 1004, 15, -3, 1002, 0, 1002, 1003, 0, 5, -2, 0],
  [124, -86, 344, -45, 178, 1004, 15, -3, 1005, 1002, 1003, 0, 5, -2, 0],
  [124, -86, 344, -45, 178, 1004, 15, -3, 1005, 1002, 1006, 5, -2, 0],
];
const LEN = [24, 21, 19, 17, 16, 15, 14];

// round r (1-based) merges pair at start indices occ[] inside SEQ[r-1] → symbol ㊀r
const ROUNDS: { pair: string; occ: number[] }[] = [
  { pair: '(0, 3)', occ: [6, 8, 18] },
  { pair: '(0, 1)', occ: [10, 13] },
  { pair: '(12, ①)', occ: [5, 13] },
  { pair: '(③, ①)', occ: [5] },
  { pair: '(②, 0)', occ: [8] },
  { pair: '(③, 0)', occ: [10] },
];

const FB: { text: string; cls: string }[] = [
  { text: '稀疏整数串：24 个元素里 8 个是 0——按「下一步」开始第 1 轮合并。', cls: '' },
  ...ROUNDS.map((r, i) => ({
    text: `第 ${i + 1} 轮合并：高频对 ${r.pair} → 新符号 ${CIRC[i]}，长度 ${LEN[i]}→${LEN[i + 1]}。`,
    cls: '',
  })),
  {
    text: 'BPE 是唯一学习的部件（词表几分钟练成）——没有它，重复的零会稀释学习信号、拖慢自回归推理。',
    cls: 'good',
  },
];

export const Ch6Bpe: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ round: 0, stepTs: 0 });
  const [round, setRound] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const { round: rd, stepTs } = stateRef.current;
      const merged = Math.min(rd, 6);
      const seq = SEQ[merged];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // layout: merged symbols get wider/taller cells; row stays centered
      const widths = seq.map((v) => (v > SYM ? 44 : 34));
      const total = widths.reduce((a, b) => a + b, 0) + GAP_C * (seq.length - 1);
      let cursor = (W - total) / 2;
      const rects = seq.map((v, i) => {
        const r = { x: cursor, y: v > SYM ? 60 : 65, w: widths[i], h: v > SYM ? 50 : 42 };
        cursor += widths[i] + GAP_C;
        return r;
      });

      // the symbol created by the last press pops in
      const grow = easeOutCubic(Math.min(1, (ms - stepTs) / 450));
      const newest = rd >= 1 && rd <= 6 ? rd : -1;

      seq.forEach((v, i) => {
        const r = rects[i];
        const isSym = v > SYM;
        const pop = isSym && v - SYM === newest;
        const s = pop ? 1 + 0.45 * (1 - grow) : 1;
        ctx.save();
        ctx.globalAlpha = pop ? Math.max(0.25, grow) : 1;
        ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
        ctx.scale(s, s);
        ctx.translate(-r.w / 2, -r.h / 2);
        if (isSym) {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.roundRect(0, 0, r.w, r.h, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = C.purple;
          ctx.font = 'bold 19px "Segoe UI", sans-serif';
        } else if (v === 0) {
          ctx.fillStyle = '#e3e9f2';
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(0, 0, r.w, r.h, 5);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = C.muted;
          ctx.font = '13px monospace';
        } else {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(0, 0, r.w, r.h, 5);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = C.purple;
          ctx.font = 'bold 13px monospace';
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isSym ? CIRC[v - SYM - 1] : String(v), r.w / 2, r.h / 2 + 1);
        ctx.restore();
      });

      // orange ring around the pair(s) the NEXT merge will consume
      if (rd < 6) {
        const pulse = 0.55 + 0.4 * Math.sin((ms / 420) * Math.PI * 2);
        ROUNDS[rd].occ.forEach((s0) => {
          const a = rects[s0];
          const b = rects[s0 + 1];
          if (!a || !b) return;
          const cx = (a.x + b.x + b.w) / 2;
          const cy = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
          const rx = (b.x + b.w - a.x) / 2 + 8;
          const ry = Math.max(a.h, b.h) / 2 + 9;
          ctx.save();
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      }

      // round rail
      for (let i = 0; i < 6; i++) {
        const dx = W / 2 - 45 + i * 18;
        const on = i < merged;
        ctx.save();
        ctx.beginPath();
        ctx.arc(dx, 252, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = on ? C.green : C.white;
        ctx.fill();
        ctx.strokeStyle = on ? C.green : C.border;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = on ? C.white : C.muted;
        ctx.font = 'bold 9px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), dx, 252.5);
        ctx.restore();
      }

      // done: the string is dense shorthand
      if (rd >= 7) {
        const n = 8;
        const sw = 22 * 1.05;
        const x0 = W / 2 - ((n - 1) * sw + 12) / 2;
        drawShorthand(ctx, x0, 186, n, { color: C.purple, size: 1.05 });
        drawVerdict(ctx, x0 + (n - 1) * sw + 40, 182, true, { r: 13, pulse: ms / 500 });
      }

      drawSceneLabel(ctx, 'BPE 收纳袋合并', 14, 22, { color: C.text });
      if (rd >= 7) {
        drawSceneLabel(ctx, '稠密短串 · 无损', W - 14, 22, { color: C.green, align: 'right' });
      } else {
        drawSceneLabel(ctx, `待合并：高频对 ${ROUNDS[rd].pair}`, W - 14, 22, {
          color: C.orange,
          align: 'right',
        });
      }
      drawLegend(ctx, [['零', C.muted], ['非零', C.purple], ['待合并对', C.orange]], 14, H - 14);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const next = () => {
    const r = Math.min(7, stateRef.current.round + 1);
    stateRef.current = { round: r, stepTs: performance.now() };
    setRound(r);
  };
  const reset = () => {
    stateRef.current = { round: 0, stepTs: performance.now() };
    setRound(0);
  };

  const fb = FB[round];
  const counter =
    round === 0
      ? '元素数 24'
      : round <= 6
      ? `元素数 ${LEN[round - 1]} → ${LEN[round]}`
      : '元素数 24 → 14';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={next} disabled={round >= 7}>
          下一步
        </button>
        <button className="tiny ghost" onClick={reset}>
          复位
        </button>
        <span className="val">{counter}</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch6Bpe;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawChef, drawOrderCard, drawCheckMark, drawValueChip, drawLegend, drawSceneLabel } from './chefKit';
import type { WidgetProps } from './registry';

// Ch.7 module 7.1 (P2 step, 1080x280): masked next-token chain over the action
// string "1 128 91 241 5 101 127 30" (paper 8-dim format). k = 0..8 tokens
// revealed; the token at
// position k flashes as the model's guess, later ones stay covered. The
// illustrative loss bar in the bottom zone drops one notch per hit
// (= behaviour cloning). The「训练损失（示意）」label lives in the DOM desc only.
const W = 1080;
const H = 280;
const TOKENS = ['1', '128', '91', '241', '5', '101', '127', '30'];
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const X0 = 380;
const GAP = 92;
const TY = 66;

function tok(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  v: string,
  fill: string,
  opts?: { scale?: number; alpha?: number; text?: string }
) {
  const s = opts?.scale ?? 1;
  ctx.save();
  ctx.globalAlpha = opts?.alpha ?? 1;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(-17, -13, 34, 26, 5);
  ctx.fill();
  ctx.fillStyle = opts?.text ?? C.white;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(v, 0, 1);
  ctx.restore();
}

export const Ch7Nexttoken: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ k: 0, kAt: 0 });
  const timerRef = useRef<number | null>(null);
  const [k, setK] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '按「下一步」开始遮词接龙：以图像与指令为上下文，逐词补全动作串。',
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
    let raf = 0;

    const render = (ms: number) => {
      const { k: kk } = stateRef.current;
      const pop = kk > 0 ? clamp((ms - stateRef.current.kAt) / 180, 0, 1) : 1;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { grid: true });

      // --- top 60%: inputs (camera glyph + order card) -> masked token row ---
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(28, 22, 120, 90, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#eef3ea';
      ctx.beginPath();
      ctx.roundRect(34, 28, 108, 78, 3);
      ctx.fill();
      // tiny still-life: counter + a blue cup + a red can
      ctx.fillStyle = C.ground;
      ctx.fillRect(40, 92, 96, 6);
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect(56, 70, 13, 22, 2);
      ctx.fill();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.roundRect(102, 64, 15, 28, 2);
      ctx.fill();
      ctx.restore();
      drawSceneLabel(ctx, '相机', 28, 14, { color: C.muted });
      drawOrderCard(ctx, 205, 66, '拿可乐');
      drawChef(ctx, 300, 156, 1.15, { mode: 'read', t: ms / 600 });
      // arrow: inputs flow into the token row
      ctx.save();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(252, 66);
      ctx.lineTo(340, 66);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(340, 66);
      ctx.lineTo(331, 61);
      ctx.lineTo(331, 71);
      ctx.closePath();
      ctx.fillStyle = C.muted;
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < TOKENS.length; i++) {
        const x = X0 + i * GAP;
        if (i < kk) {
          const s = i === kk - 1 ? 0.7 + 0.3 * pop : 1;
          tok(ctx, x, TY, TOKENS[i], C.purple, { scale: s });
        } else if (i === kk && kk < TOKENS.length) {
          const blink = 0.5 + 0.5 * Math.sin(ms / 130);
          tok(ctx, x, TY, '?', C.orange, { scale: 0.92 + 0.1 * blink, alpha: 0.55 + 0.45 * blink });
        } else {
          tok(ctx, x, TY, '?', C.border, { text: C.muted });
        }
      }
      // brace under the revealed prefix: a₁..aₖ
      if (kk > 0) {
        const bx0 = X0 - 17;
        const bx1 = X0 + (kk - 1) * GAP + 17;
        ctx.save();
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx0, TY + 16);
        ctx.lineTo(bx0, TY + 24);
        ctx.lineTo(bx1, TY + 24);
        ctx.lineTo(bx1, TY + 16);
        ctx.stroke();
        ctx.fillStyle = C.purple;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(kk === 1 ? 'a₁' : `a₁..a${SUBS[kk]}`, (bx0 + bx1) / 2, TY + 28);
        ctx.restore();
      }
      if (kk >= TOKENS.length) drawCheckMark(ctx, 968, TY, 11);

      // --- bottom 40%: illustrative loss bar + "行为克隆" badge ---
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 168);
      ctx.lineTo(W - 24, 168);
      ctx.stroke();
      ctx.restore();
      const loss = 0.9 - 0.78 * (kk / TOKENS.length);
      const trackY = 184;
      const trackH = 72;
      ctx.fillStyle = '#eef0f4';
      ctx.beginPath();
      ctx.roundRect(64, trackY, 32, trackH, 4);
      ctx.fill();
      const barH = trackH * (loss / 0.9);
      ctx.fillStyle = kk >= TOKENS.length ? C.green : C.orange;
      ctx.beginPath();
      ctx.roundRect(64, trackY + trackH - barH, 32, barH, 4);
      ctx.fill();
      drawSceneLabel(ctx, '损失', 80, 270, { align: 'center', color: C.muted });
      drawValueChip(ctx, 150, 200, loss.toFixed(2), kk >= TOKENS.length ? C.green : C.orange);
      ctx.save();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.roundRect(206, 232, 104, 30, 15);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('行为克隆', 258, 248);
      ctx.restore();
      // trend note: one notch down per hit
      ctx.save();
      ctx.strokeStyle = kk >= TOKENS.length ? C.green : C.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(340, 236);
      ctx.lineTo(430, 252);
      ctx.lineTo(520, 240);
      ctx.lineTo(610, 254);
      ctx.stroke();
      ctx.restore();

      drawLegend(ctx, [['动作词', C.purple], ['猜测中', C.orange]], 880, 262);
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
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const applyK = (nk: number) => {
    stateRef.current.k = nk;
    stateRef.current.kAt = performance.now();
    setK(nk);
    setFeedback(
      nk >= TOKENS.length
        ? { text: '整串补全 = 一次完整模仿。RT-2 没有发明新损失——就是语言模型的下一词预测。', cls: 'good' }
        : { text: `模型看到前 ${nk} 个动作词，猜第 ${nk + 1} 个——猜中翻牌，损失随之下降一格。`, cls: '' }
    );
  };

  const stopReplay = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const replay = () => {
    stopReplay();
    applyK(0);
    timerRef.current = window.setInterval(() => {
      if (stateRef.current.k >= TOKENS.length) {
        stopReplay();
      } else {
        applyK(stateRef.current.k + 1);
      }
    }, 520);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          已补全 <span className="val">{k}/7</span>
        </label>
        <button className="tiny ghost" disabled={k === 0} onClick={() => { stopReplay(); applyK(k - 1); }}>
          上一步
        </button>
        <button className="tiny" disabled={k >= TOKENS.length} onClick={() => { stopReplay(); applyK(k + 1); }}>
          下一步
        </button>
        <button className="tiny ghost" onClick={() => { stopReplay(); applyK(0); }}>
          重置
        </button>
        <button className="tiny ghost" onClick={replay}>
          重放
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Nexttoken;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, label, drawCaption, drawBar } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 310;

const TOKENS = ['Yaw', '=', '12', '.', '0', ',', 'Pitch', '=', '-', '3', '.', '2'];

/** 7.2：详细对比回归头连续数值预测 vs 文本下一词预测 */
export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());
  const stateRef = useRef({ mode: 'text' as 'text' | 'reg' });
  const [mode, setMode] = useState<'text' | 'reg'>('text');
  const [feedback, setFeedback] = useState({
    text: '文本 SFT：标准下一词预测，逐步吐出位姿句子；无需专用回归头。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const drawReg = (t: number) => {
      drawWindow(ctx, 20, 28, 50, 42, C.red);
      drawWindow(ctx, 78, 28, 50, 42, C.green);
      label(ctx, '两视图', 42, 22, C.muted, 10);

      ctx.fillStyle = '#fde8eb';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      roundRect(145, 30, 70, 40, 6);
      ctx.fill();
      ctx.stroke();
      label(ctx, '骨干', 162, 55, C.red, 13);

      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(128, 50);
      ctx.lineTo(145, 50);
      ctx.stroke();

      // 权重随时间变化，头内数值同步变化
      const weights = [
        clamp(0.9 + Math.sin(t * 2) * 0.08, 0.05, 1),
        clamp(0.45 + Math.sin(t * 2 + 1.2) * 0.12, 0.05, 1),
        clamp(0.7 + Math.sin(t * 2 + 2.4) * 0.1, 0.05, 1),
      ];
      const preds = [
        (0.55 + weights[0] * 0.4).toFixed(2),
        `(${(0.5 + weights[1] * 0.3).toFixed(2)},${(0.02 + weights[1] * 0.08).toFixed(2)},${(0.55 + weights[1] * 0.25).toFixed(2)})`,
        `(${(8 + weights[2] * 8).toFixed(0)},${(-5 + weights[2] * 4).toFixed(0)},${(weights[2] * 3).toFixed(0)})`,
      ];
      const heads = [
        { name: 'Δt 头', y: 28 },
        { name: '方向头', y: 88 },
        { name: '旋转头', y: 148 },
      ];
      const lossNames = ['L1·Δt', 'MSE·dir', 'L1·rot'];

      heads.forEach((h, i) => {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(215, 50);
        ctx.bezierCurveTo(240, 50, 245, h.y + 18, 260, h.y + 18);
        ctx.stroke();

        ctx.fillStyle = '#fff5f6';
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        roundRect(260, h.y, 108, 42, 5);
        ctx.fill();
        ctx.stroke();
        label(ctx, h.name, 272, h.y + 16, C.red, 11);
        label(ctx, preds[i], 272, h.y + 34, C.text, 11);
      });

      label(ctx, '多损失需调权', 390, 24, C.red, 12);
      lossNames.forEach((n, i) => {
        const y = 40 + i * 50;
        const ww = weights[i];
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        roundRect(385, y, 155, 42, 4);
        ctx.fill();
        ctx.stroke();
        label(ctx, n + '  λ=' + ww.toFixed(2), 395, y + 16, C.text, 11);
        drawBar(ctx, 395, y + 24, 135, 8, ww, C.red);
      });

      drawCaption(ctx, W, H, '回归头：权重 λ 变化时，头内连续预测值同步改变', C.red, 12);
    };

    const drawText = (t: number) => {
      // —— 上行流水线 ——
      drawWindow(ctx, 16, 24, 44, 36, C.blue);
      drawWindow(ctx, 66, 24, 44, 36, C.green);
      label(ctx, '两视图', 36, 18, C.muted, 10);

      ctx.fillStyle = '#e8f7ef';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      roundRect(130, 20, 100, 44, 6);
      ctx.fill();
      ctx.stroke();
      label(ctx, '标准 VLM', 145, 40, C.green, 13);
      label(ctx, '共享骨干', 150, 56, C.muted, 10);

      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(110, 42);
      ctx.lineTo(130, 42);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(230, 42);
      ctx.lineTo(255, 42);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.green;
      roundRect(255, 18, 80, 48, 5);
      ctx.fill();
      ctx.stroke();
      label(ctx, 'Softmax', 268, 40, C.green, 12);
      label(ctx, '词表采样', 268, 56, C.muted, 10);

      ctx.beginPath();
      ctx.moveTo(335, 42);
      ctx.lineTo(360, 42);
      ctx.stroke();
      label(ctx, '下一词 →', 365, 46, C.green, 12);

      // —— 中行：逐步 token（单独区域，不与输出框重叠） ——
      const phase = Math.floor(t * 2.2) % (TOKENS.length + 3);
      const shown = Math.min(TOKENS.length, phase);
      label(ctx, '逐步生成', 16, 88, C.green, 11);

      TOKENS.forEach((tok, i) => {
        const x = 16 + i * 44;
        const y = 96;
        const on = i < shown;
        ctx.fillStyle = on ? C.green : '#e8edf5';
        ctx.strokeStyle = on ? C.green : C.border;
        ctx.lineWidth = on ? 2 : 1;
        roundRect(x, y, 40, 28, 4);
        ctx.fill();
        ctx.stroke();
        if (on) {
          ctx.fillStyle = '#fff';
          ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(tok, x + 20, y + 18);
          ctx.textAlign = 'left';
        }
        if (i === shown && shown < TOKENS.length && Math.sin(t * 8) > 0) {
          ctx.fillStyle = C.green;
          ctx.fillRect(x - 2, y + 5, 2, 18);
        }
      });

      // —— 下行：输出文本（在 token 行下方留足空隙） ——
      const sentence = TOKENS.slice(0, shown).join('');
      ctx.fillStyle = '#e8f7ef';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.5;
      roundRect(16, 140, 528, 48, 6);
      ctx.fill();
      ctx.stroke();
      label(ctx, '输出文本：', 28, 160, C.muted, 12);
      label(ctx, sentence || '…', 110, 160, C.green, 14);
      label(ctx, '完整句示例：Yaw=12.0, Pitch=-3.2, Roll=1.1', 28, 178, C.muted, 10);

      // —— 底栏说明卡 ——
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.green;
      roundRect(16, 200, 250, 44, 5);
      ctx.fill();
      ctx.stroke();
      label(ctx, '单一损失：交叉熵 CE', 28, 220, C.green, 12);
      label(ctx, '无需多头调权', 28, 236, C.muted, 11);

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.green;
      roundRect(284, 200, 260, 44, 5);
      ctx.fill();
      ctx.stroke();
      label(ctx, '接口不变：标准 VLM + SFT', 296, 220, C.green, 12);
      label(ctx, '位姿也走下一词预测', 296, 236, C.muted, 11);

      drawCaption(ctx, W, H, '文本 SFT：逐 token 预测句子，回归 formulism 并非必要条件', C.green, 12);
    };

    const render = (now: number) => {
      const m = stateRef.current.mode;
      const t = (now - t0.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      if (m === 'reg') drawReg(t);
      else drawText(t);
    };

    const tick = (now: number) => {
      render(now);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const pick = (m: 'text' | 'reg') => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(m === 'text'
      ? { text: '文本路径：词表 Softmax → 逐 token 生成位姿句；单一 CE，保持标准 VLM 接口。', cls: 'good' }
      : { text: '回归路径：权重 λ 变化时，各头连续预测值同步改变；多损失需调权。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip ${mode === 'reg' ? 'on' : ''}`} onClick={() => pick('reg')}>回归头</button>
        <button type="button" className={`chip ${mode === 'text' ? 'on' : ''}`} onClick={() => pick('text')}>文本 SFT</button>
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ fontStyle: 'normal' }}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;

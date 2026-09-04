import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawPhotoCard, drawLightTable, drawLabel, drawCheck, roundRect } from './ana-scene';

const W = 560, H = 300;

// stage: 0 init noise · 1..4 predictor steps · 5 inverse transport
const T_MARKS = [1.0, 0.754, 0.509, 0.263, 0.02];
const NOISES = [1.0, 0.75, 0.5, 0.28, 0.1];

const STEP_TEXT: { text: string; cls: string }[] = [
  { text: '从纯噪声出发：在 u 空间里，这就是一团标准高斯 û ∼ N(0, I)。', cls: '' },
  { text: '第 1 步：预测器读入 û_t，输出 (μ_P, σ_P)，抽一个 z，仿射得到下一帧。t: 1.0 → 0.754。', cls: '' },
  { text: '第 2 步：同一个深预测器接着走。注意——始终在 u 空间里，没碰过像素。t: 0.754 → 0.509。', cls: '' },
  { text: '第 3 步：每一步都是一次前向计算 + 一次仿射采样，空间上完全并行。t: 0.509 → 0.263。', cls: '' },
  { text: '第 4 步：到达 t = 0.02，u 空间的轨迹走完了。图像内容已经确定，只是还停留在 u 表示上。', cls: '' },
  { text: '逆搬运只做一次：自回归解码（带 KV 缓存）把 û₀ 变回像素——成品取回，全过程结束。', cls: 'good' },
];

export const M6Sample: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0 });
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState(STEP_TEXT[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { stage: number }) => {
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      const done = s.stage >= 5;
      const uIdx = Math.min(s.stage, 4); // how far along the u-space orbit we are

      // ---- top: u-space orbit (right → left) ----
      drawLabel(ctx, 'u 空间轨道（t: 1 → 0）', 40, 24, K.text, 13);
      const ox = 60, ow = 440, oy = 62;
      ctx.strokeStyle = K.border;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + ow, oy);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const x = ox + ow - (T_MARKS[0] - T_MARKS[i]) / (T_MARKS[0] - T_MARKS[4]) * ow;
        const visited = i <= uIdx;
        const current = i === uIdx && !done;
        if (i > 0 && i <= uIdx) {
          const px = ox + ow - (T_MARKS[0] - T_MARKS[i - 1]) / (T_MARKS[0] - T_MARKS[4]) * ow;
          ctx.strokeStyle = K.blue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, oy);
          ctx.quadraticCurveTo((px + x) / 2, oy - 26, x, oy);
          ctx.stroke();
        }
        ctx.fillStyle = current ? K.orange : visited ? K.blue : K.border;
        ctx.beginPath();
        ctx.arc(x, oy, current ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, `t=${T_MARKS[i]}`, x, oy + 18, current ? K.orange : K.muted, 10, 'center');
      }
      if (done) drawLabel(ctx, '轨迹走完 ✓', ox + ow - 60, oy - 32, K.green, 12);

      // ---- bottom left: the photo on / off the light table ----
      const tableOn = done ? 0 : 1;
      drawLightTable(ctx, 48, 116, 180, 130, tableOn, 0);
      const photoX = done ? 268 : 72, photoY = done ? 132 : 132;
      drawPhotoCard(ctx, photoX, photoY, 130, 98, done ? 0.03 : NOISES[uIdx], 101);
      drawLabel(ctx, done ? '已回到像素空间' : '仍在 u 空间', 52, 262, done ? K.green : K.blue, 12);
      if (done) drawCheck(ctx, 392, 140);

      // ---- bottom right: step readout ----
      roundRect(ctx, 268, 116, 252, done ? 0.01 : 130, 5);
      if (!done) {
        ctx.fillStyle = K.card;
        ctx.fill();
        ctx.strokeStyle = K.border;
        ctx.stroke();
        drawLabel(ctx, '当前操作', 282, 136, K.text, 12);
        if (s.stage === 0) {
          drawLabel(ctx, 'û ← 采样自 N(0, I)', 282, 162, K.blue, 12);
          drawLabel(ctx, '（初始化，还没用到网络）', 282, 184, K.muted, 11);
        } else {
          drawLabel(ctx, `û_s = μ_P + σ_P · z`, 282, 162, K.blue, 13);
          drawLabel(ctx, `t: ${T_MARKS[s.stage - 1]} → ${T_MARKS[s.stage]}`, 282, 184, K.muted, 11);
          drawLabel(ctx, `预测器第 ${s.stage} / 4 次前向`, 282, 206, K.muted, 11);
        }
      } else {
        drawLabel(ctx, 'x₀ = f_T⁻¹(û₀)：唯一一次逆搬运', 268, 262, K.green, 12);
      }
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (ns: number) => {
    const v = Math.max(0, Math.min(5, ns));
    stateRef.current.stage = v;
    setStage(v);
    setFeedback(STEP_TEXT[v]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(stage - 1)} disabled={stage === 0}>← 上一步</button>
        <span className="step-label">
          阶段 <b>{stage === 0 ? '初始化' : stage <= 4 ? `${stage}/4` : '取回'}</b>
        </span>
        <button className="tiny" onClick={() => go(stage + 1)} disabled={stage === 5}>下一步 →</button>
        <button className="tiny ghost" onClick={() => go(0)}>重置</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

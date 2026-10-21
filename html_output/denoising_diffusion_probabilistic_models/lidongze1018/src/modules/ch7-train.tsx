import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { T, noiseCoef, abarAt, fmt, mulberry32, clearField, sceneLabel, roundRect } from './ddpm-common';

// Module 7.1 — one training iteration, step by step, matching Algorithm 1 exactly.
// Pipeline: x₀ → t ~ U{1..T} → ε ~ N(0,I) → xₜ = √ᾱₜx₀+√(1−ᾱₜ)ε → loss ‖ε−εθ(xₜ,t)‖² → update.
// The loss curve is a TEACHING SCHEMATIC (the paper publishes no training logs);
// everything else (noise coefficients, timestep sampling) follows Algorithm 1 as written.

const W = 1080;
const H = 280;

const PHASES = 6;
const PHASE_TITLES = [
  '① 采样 x₀',
  '② 采样 t',
  '③ 采样 ε',
  '④ 构造 xₜ',
  '⑤ 前向 + 损失',
  '⑥ 梯度更新',
];

const PSEUDOCODE: string[] = [
  'repeat',
  '  x₀ ~ q(x₀)                        # 从数据分布采样一张图',
  '  t ~ Uniform({1, …, T})            # 随机时刻',
  '  ε ~ N(0, I)                       # 标准高斯噪声',
  '  xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε          # 闭式构造（Eq. (4)）',
  '  loss = ‖ε − εθ(xₜ, t)‖²           # 简化目标（Eq. (14)）',
  '  θ ← θ − η·∇θ loss                 # 梯度下降更新',
  'until 收敛',
];

function schematicLoss(iter: number, seed: number): number {
  const rnd = mulberry32(seed + iter * 131);
  return 0.52 * Math.exp(-iter / 42) + 0.1 + (rnd() - 0.5) * 0.05;
}

function phaseFeedback(phase: number, iter: number, t: number): string {
  switch (phase) {
    case 0:
      return `第 ${iter + 1} 轮：从数据集采样 x₀（教学用示意数据；论文 Algorithm 1 第 2 行）。`;
    case 1:
      return `随机时刻 t = ${t}，Uniform{{1…T}} 采样（Algorithm 1 第 3 行）；对应 ᾱₜ = ${fmt(abarAt(t))}。`;
    case 2:
      return '采样噪声 ε ~ N(0, I)（第 4 行）。与 t 彼此独立 —— 保证每个噪声尺度都被均匀训练。';
    case 3:
      return `闭式构造 xₜ：噪声系数 √(1−ᾱₜ) = ${fmt(noiseCoef(t))}（精确值，Eq. (4)）。`;
    case 4:
      return '网络预测 εθ(xₜ,t) 并计算损失 ‖ε − εθ‖²（Eq. (14)）：随机 t 上的期望就是 L_simple。';
    default:
      return '按梯度下降更新参数 θ，完成一次迭代 —— 注意 Loss 曲线为教学示意（论文未公开训练日志）。';
  }
}

export const Ch7Train: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    phase: 0,
    iter: 0,
    t: 1 + Math.floor(mulberry32(7)() * T),
    trace: [] as number[],
    seed: 20201126,
  });
  const [phase, setPhase] = useState(0);
  const [iter, setIter] = useState(0);
  const [tState, setTState] = useState(stateRef.current.t);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState(phaseFeedback(0, 0, stateRef.current.t));

  const beginIteration = (s: typeof stateRef.current): void => {
    const rnd = mulberry32(s.seed + s.iter * 977);
    s.t = 1 + Math.floor(rnd() * T);
    s.phase = 0;
  };

  const advance = (): void => {
    const s = stateRef.current;
    if (s.phase < PHASES - 1) {
      s.phase += 1;
    } else {
      s.trace.push(schematicLoss(s.iter, s.seed));
      if (s.trace.length > 60) s.trace.shift();
      s.iter += 1;
      beginIteration(s);
    }
    setPhase(s.phase);
    setIter(s.iter);
    setTState(s.t);
    setFeedback(phaseFeedback(s.phase, s.iter, s.t));
  };

  const reset = (): void => {
    const s = stateRef.current;
    s.phase = 0;
    s.iter = 0;
    s.trace = [];
    beginIteration(s);
    setPhase(s.phase);
    setIter(s.iter);
    setTState(s.t);
    setFeedback(phaseFeedback(s.phase, s.iter, s.t));
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(advance, 620);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const s = stateRef.current;
      clearField(ctx, W, H);

      // ---- pipeline of six stages ----
      const bw = 148;
      const bh = 64;
      const gap = 26;
      const y0 = 44;
      for (let i = 0; i < PHASES; i += 1) {
        const bx = 30 + i * (bw + gap);
        const isCur = i === s.phase;
        const isDone = i < s.phase;
        roundRect(ctx, bx, y0, bw, bh, 10);
        ctx.fillStyle = isCur ? '#fdeedd' : isDone ? '#eaf1fb' : '#f2f5f9';
        ctx.fill();
        ctx.strokeStyle = isCur ? '#d97706' : isDone ? '#27446e' : '#d7deea';
        ctx.lineWidth = isCur ? 3 : 2;
        roundRect(ctx, bx, y0, bw, bh, 10);
        ctx.stroke();
        ctx.fillStyle = isCur ? '#92400e' : isDone ? '#27446e' : '#68778f';
        ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(PHASE_TITLES[i], bx + bw / 2, y0 + 27);
        ctx.font = '500 12px "Segoe UI","PingFang SC",sans-serif';
        const sub = ['x₀ ~ q(x₀)', 't ~ U{1..T}', 'ε ~ N(0, I)', 'Eq. (4)', 'Eq. (14)', 'θ ← θ − η∇'][i];
        ctx.fillText(sub, bx + bw / 2, y0 + 48);
        if (i < PHASES - 1) {
          const ax = bx + bw + 4;
          const ay = y0 + bh / 2;
          ctx.strokeStyle = '#9fb0c8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + gap - 8, ay);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ax + gap - 8, ay);
          ctx.lineTo(ax + gap - 14, ay - 5);
          ctx.lineTo(ax + gap - 14, ay + 5);
          ctx.closePath();
          ctx.fillStyle = '#9fb0c8';
          ctx.fill();
        }
      }
      ctx.textAlign = 'left';

      // ---- info panel ----
      const iy = 140;
      roundRect(ctx, 30, iy, 450, 116, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 30, iy, 450, 116, 10);
      ctx.stroke();

      sceneLabel(ctx, `迭代 i = ${s.iter + 1}`, 48, iy + 30, { size: 17 });
      ctx.font = '600 15px "Cascadia Code","Consolas",monospace';
      ctx.fillStyle = '#21324a';
      ctx.fillText(`t = ${s.t}`, 48, iy + 58);
      ctx.fillText(`√(1−ᾱₜ) = ${fmt(noiseCoef(s.t))}`, 48, iy + 82);
      ctx.fillText(`ᾱₜ = ${fmt(abarAt(s.t))}`, 48, iy + 106);

      // ---- loss curve (teaching schematic) ----
      const lx = 520;
      const lyy = 140;
      const lw = 530;
      const lh = 116;
      roundRect(ctx, lx, lyy, lw, lh, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      roundRect(ctx, lx, lyy, lw, lh, 10);
      ctx.stroke();
      sceneLabel(ctx, '损失曲线（教学示意，非论文数据）', lx + 14, lyy + 24, { size: 14, color: '#68778f' });

      const pts = s.trace;
      const px0 = lx + 16;
      const px1 = lx + lw - 16;
      const py0 = lyy + 36;
      const py1 = lyy + lh - 14;
      if (pts.length >= 2) {
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        pts.forEach((v, i) => {
          const x = map(i, 0, Math.max(pts.length - 1, 1), px0, px1);
          const y = clamp(map(v, 0, 0.7, py1, py0), py0, py1);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else {
        ctx.fillStyle = '#8b97ab';
        ctx.font = '500 13px "Segoe UI","PingFang SC",sans-serif';
        ctx.fillText('每完成一轮迭代，这里会画出一个（示意）损失点', px0, py0 + 30);
      }
    };

    const tick = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const activeLine = phase + 1; // pseudocode line index (0-based) matching the phase

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={advance}>
          单步（下一阶段）
        </button>
        <button type="button" className="tiny ghost" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '连续播放'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => { setPlaying(false); reset(); }}>
          重置
        </button>
        <span className="step-label">
          迭代 <b>{iter + 1}</b> · t = <b>{tState}</b>
        </span>
      </div>
      <pre className="algo-code" aria-label="论文 Algorithm 1（转写与中文注释）">
        {PSEUDOCODE.map((line, i) => (
          <span key={i} className={`algo-line ${i === activeLine ? 'active' : ''} ${i < activeLine ? 'done' : ''}`}>
            {line}
          </span>
        ))}
      </pre>
      <div className="source-note">伪代码转写自论文 Algorithm 1（Training），注释为中文补充；高亮行与上方动画阶段一一对应。</div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default Ch7Train;

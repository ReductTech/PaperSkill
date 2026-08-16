import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', line: '#d7deea', ink: '#21324a', muted: '#68778f',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed', white: '#ffffff',
};

const noiseLevels = [
  { id: 'low', label: '较低噪声', sigma: .18, note: '曲线较尖，局部偏移更容易被看见。' },
  { id: 'mid', label: '中等噪声', sigma: .27, note: '同时保留结构差异与较宽的探索范围。' },
  { id: 'high', label: '较高噪声', sigma: .38, note: '曲线更平，分数方向仍指向各自分布中心。' },
] as const;

function CanvasView({
  draw,
  animationKey,
  duration,
  onAnimationChange,
}: {
  draw: (ctx: CanvasRenderingContext2D, progress: number) => void;
  animationKey: number;
  duration: number;
  onAnimationChange: (running: boolean) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 620, 330); } catch { return; }
    ctxRef.current = ctx;
    const paint = () => { drawRef.current(ctx, 1); canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, paint, () => undefined);
    paint();
    return () => { ctxRef.current = null; disconnect(); };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    const canvas = ref.current;
    if (!ctx || !canvas) return;
    if (animationKey === 0) {
      drawRef.current(ctx, 1);
      onAnimationChange(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawRef.current(ctx, 1);
      onAnimationChange(false);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    onAnimationChange(true);
    const tick = (time: number) => {
      const linear = Math.min(1, (time - startedAt) / duration);
      const eased = 1 - Math.pow(1 - linear, 3);
      drawRef.current(ctx, eased);
      canvas.classList.add('is-ready');
      if (linear < 1) frame = requestAnimationFrame(tick);
      else onAnimationChange(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animationKey, duration, onAnimationChange]);

  return <canvas ref={ref} width={620} height={330} />;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 12, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Segoe UI, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function arrow(ctx: CanvasRenderingContext2D, from: number, to: number, y: number, color: string, caption: string) {
  const direction = Math.sign(to - from) || 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(from, y); ctx.lineTo(to, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(to, y); ctx.lineTo(to - direction * 10, y - 6); ctx.lineTo(to - direction * 10, y + 6); ctx.closePath(); ctx.fill();
  label(ctx, caption, (from + to) / 2, y - 10, color, 10, 'center');
}

type VisualState = { sigma: number; gap: number };
type TransitionKind = 'noise' | 'update' | 'reset';
type DmdTransition = { id: number; from: VisualState; to: VisualState; kind: TransitionKind };

export const HyDmdLab: React.FC<WidgetProps> = () => {
  const [noiseIndex, setNoiseIndex] = useState(1);
  const [gap, setGap] = useState(.78);
  const [updates, setUpdates] = useState(0);
  const [animating, setAnimating] = useState(false);
  const visualRef = useRef<VisualState>({ sigma: noiseLevels[1].sigma, gap: .78 });
  const [transition, setTransition] = useState<DmdTransition>({
    id: 0,
    from: visualRef.current,
    to: visualRef.current,
    kind: 'noise',
  });
  const noise = noiseLevels[noiseIndex];
  const converged = gap < .09;
  const teacherCenter = -.34;
  const scoreGap = gap / (noise.sigma * noise.sigma);

  const transitionTo = (to: VisualState, kind: TransitionKind) => {
    setTransition((current) => ({ id: current.id + 1, from: visualRef.current, to, kind }));
  };

  const selectNoise = (index: number) => {
    const nextNoise = noiseLevels[index];
    setNoiseIndex(index);
    transitionTo({ sigma: nextNoise.sigma, gap }, 'noise');
  };

  const updateStudent = () => {
    if (converged) return;
    const nextGap = Math.max(.055, gap * .58);
    transitionTo({ sigma: noise.sigma, gap: nextGap }, 'update');
    setGap(nextGap);
    setUpdates((value) => value + 1);
  };

  const reset = () => {
    transitionTo({ sigma: noise.sigma, gap: .78 }, 'reset');
    setGap(.78);
    setUpdates(0);
  };

  const duration = transition.kind === 'update' ? 720 : transition.kind === 'reset' ? 480 : 560;

  return <div className={`dmd-lab ${animating ? 'is-transitioning' : ''}`}>
    <div className="learning-contract"><div><span>为什么学</span><p>成熟扩散教师需要多步去噪，沿多条轨迹生成关键帧时成本会被重复放大。</p></div><div><span>本次操作</span><p>先选噪声层级，再执行 DMD 更新，观察少步学生如何沿真实 score 与伪 score 的差靠近教师分布。</p></div><div><span>应得判断</span><p>蒸馏压缩的是 WorldStereo 关键帧生成器；四步不等于完整世界系统只需四步或实时完成。</p></div></div>
    <section className="dmd-primer">
      <header><span>先回答：为什么要蒸馏？</span><strong>把成熟教师的多步生成能力压缩给四步学生</strong></header>
      <div><article><b>1</b><span><strong>教师先学会</strong><small>领域适配和记忆中训先形成可控、跨轨迹一致的目标分布。</small></span></article><i>→</i><article><b>2</b><span><strong>学生少步采样</strong><small>学生用更少扩散步生成带偏差的关键帧样本。</small></span></article><i>→</i><article><b>3</b><span><strong>分数差纠偏</strong><small>s_real - s_fake 把学生分布推向教师，而不是逐像素复制某一帧。</small></span></article></div>
      <p>因此 DMD 必须放在训练课程最后：教师能力尚未成熟时，学生没有稳定目标可继承。</p>
    </section>
    <CanvasView animationKey={transition.id} duration={duration} onAnimationChange={setAnimating} draw={(ctx, progress) => {
      ctx.clearRect(0, 0, 620, 330);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 620, 330);
      const left = 60, right = 575, top = 52, base = 230;
      const xFor = (value: number) => left + (value + 1.1) / 2.2 * (right - left);
      const curve = (center: number, sigma: number, x: number) => Math.exp(-Math.pow(x - center, 2) / (2 * sigma * sigma));
      const sigma = transition.from.sigma + (transition.to.sigma - transition.from.sigma) * progress;
      const currentGap = transition.from.gap + (transition.to.gap - transition.from.gap) * progress;
      const studentCenter = teacherCenter + currentGap;
      visualRef.current = { sigma, gap: currentGap };
      ctx.canvas.dataset.visualSigma = sigma.toFixed(4);
      ctx.canvas.dataset.visualGap = currentGap.toFixed(4);

      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, base); ctx.lineTo(right, base); ctx.stroke();
      [-1, -.5, 0, .5, 1].forEach((tick) => {
        const x = xFor(tick);
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, base); ctx.stroke();
        label(ctx, tick.toFixed(1), x, base + 20, C.muted, 9, 'center');
      });

      const drawCurve = (center: number, color: string, dashed = false) => {
        ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.setLineDash(dashed ? [7, 6] : []);
        ctx.beginPath();
        for (let i = 0; i <= 160; i += 1) {
          const value = -1.1 + i / 160 * 2.2;
          const x = xFor(value);
          const y = base - curve(center, sigma, value) * 145;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.setLineDash([]);
      };

      drawCurve(teacherCenter, C.green);
      drawCurve(studentCenter, C.purple, true);
      label(ctx, '教师真实分布 · 实线', left, 34, C.green, 11);
      label(ctx, '学生伪分布 · 虚线', right, 34, C.purple, 11, 'right');

      const probe = Math.min(.96, studentCenter + sigma * .65);
      const probeX = xFor(probe);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(probeX, 48); ctx.lineTo(probeX, base); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(probeX, base, 7, 0, Math.PI * 2); ctx.fill();
      label(ctx, '带噪样本 xₜ', probeX, 258, C.orange, 10, 'center');

      const realTarget = xFor(teacherCenter + sigma * .2);
      const fakeTarget = xFor(studentCenter + sigma * .2);
      arrow(ctx, probeX, realTarget, 288, C.green, 's_real');
      arrow(ctx, probeX, fakeTarget, 316, C.purple, 's_fake');
      label(ctx, converged ? '分数方向已接近' : '分数差推动学生靠近教师', 600, 324, converged ? C.green : C.blue, 9, 'right');
    }} />

    <div key={transition.id} className={`dmd-motion-status ${transition.kind} ${animating ? 'running' : ''}`} aria-live="polite">
      <span>{transition.id === 0 ? '等待一次可观察的状态变化' : transition.kind === 'noise' ? '噪声层级重塑' : transition.kind === 'update' ? '学生分布沿分数差靠拢' : '恢复初始分布间距'}</span>
      <i aria-hidden="true" />
      <small>{transition.id === 0 ? '切换噪声或执行更新后，这里显示过渡进度' : animating ? `${duration}ms 连续过渡中` : '过渡完成'}</small>
    </div>

    <div className="dmd-noise-tabs" role="tablist" aria-label="选择扩散噪声层级">
      {noiseLevels.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={noiseIndex === index} className={noiseIndex === index ? 'selected' : ''} onClick={() => selectNoise(index)}><strong>{item.label}</strong><small>{item.note}</small></button>)}
    </div>

    <div className="dmd-score-ledger">
      <div><span>教师分数</span><strong>s_real</strong><small>指向论文数据分布的高密度区域</small></div>
      <div><span>学生分数</span><strong>s_fake</strong><small>指向当前学生分布的高密度区域</small></div>
      <div className={converged ? 'ready' : ''}><span>当前分数差</span><strong>{converged ? '很小' : scoreGap > 10 ? '较大' : '正在缩小'}</strong><small>这里只显示定性等级，不冒充论文训练曲线</small></div>
    </div>

    <div className="dmd-update-control">
      <div><span>DMD 教学更新</span><strong>{updates} 次</strong><small>每次点击只演示“沿分数差缩小分布偏移”这一方向。</small></div>
      <button type="button" onClick={updateStudent} disabled={converged}>{converged ? '分布已靠拢' : '执行一次更新'}</button>
      <button type="button" className="ghost" aria-label="重置 DMD 教学实验" title="重置 DMD 教学实验" onClick={reset}>↺</button>
    </div>

    <div className={`feedback ${converged ? 'good' : ''}`} aria-live="polite">{converged ? '学生分布已在示意图中靠近教师分布。真实 DMD 在高维潜空间中优化，教程不会把点击次数解释为论文训练步数。' : `当前选择${noise.label}。继续执行更新，观察 s_real - s_fake 如何缩小学生与教师之间的分布差距。`}</div>

    <section className="dmd-boundary-grid">
      <div><span>论文明确报告</span><strong>WorldStereo 2.0 被蒸馏为四步 DiT</strong><p>四步描述的是关键帧生成器的扩散推理，不是 HY-Pano、轨迹规划、重建、对齐和 3DGS 的总步数。</p></div>
      <div><span>不能外推</span><strong>四步 ≠ 完整世界实时生成</strong><p>论文 Table 10 的完整世界生成总计为 712 秒；WorldLens 的实时交互发生在资产生成之后。</p></div>
    </section>

    <div className="dmd-glossary-grid">
      <details><summary>为什么要比较两个 score？</summary><p>真实 score 描述教师分布在带噪样本附近的方向，伪 score 描述学生当前分布的方向。DMD 用二者差异更新学生，使少步生成结果逐渐贴近教师分布。</p></details>
      <details><summary>J_θ 在公式里做什么？</summary><p>J_θ 表示样本对学生参数的雅可比项。它把潜空间中的分数差传回学生参数；上方一维曲线只画方向，不尝试还原真实网络张量。</p></details>
    </div>

    <PaperTable tableId="table-8" />
  </div>;
};

import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle } from './waterKit';

type VisualState = 'impact' | 'pressure' | 'slice-1' | 'slice-2';

const choices = [
  {
    label: '小 Δt',
    dt: '0.5×',
    left1: 313,
    left2: 300,
    density1: '仍略高于 ρ₀',
    density2: '回到 ρ₀',
    result1: '第一步只完成部分恢复。',
    result2: '第二步正好回到理想间距。',
    color: WATER.good,
  },
  {
    label: '大 Δt',
    dt: '2×',
    left1: 238,
    left2: 330,
    density1: '明显低于 ρ₀',
    density2: '再次高于 ρ₀',
    result1: '第一步排斥过强，粒子远远越过理想位置。',
    result2: '第二步反向合拢也过头，粒子越过理想位置并再次过密。',
    color: WATER.bad,
  },
];

function mix(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function drawStageCard(ctx: CanvasRenderingContext2D, x: number, title: string, active: boolean, accent: string) {
  ctx.fillStyle = active ? '#eaf4ff' : '#ffffff';
  ctx.strokeStyle = active ? accent : WATER.line;
  ctx.lineWidth = active ? 3 : 1.4;
  ctx.beginPath();
  ctx.roundRect(x, 18, 208, 110, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = active ? accent : WATER.ink;
  ctx.font = '800 14px Segoe UI';
  ctx.fillText(title, x + 13, 42);
}

export const TimestepDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [choice, setChoice] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  const [visualState, setVisualState] = useState<VisualState>('impact');
  const visualRef = useRef<VisualState>('impact');
  const elapsedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 700, 390);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const duration = 7600;
    const start = performance.now() - elapsedRef.current;
    let raf = 0;
    let running = false;

    const draw = (now: number) => {
      const elapsed = reduced ? 6600 : paused ? elapsedRef.current : (now - start) % duration;
      elapsedRef.current = elapsed;
      const nextVisual: VisualState = elapsed < 1800 ? 'impact' : elapsed < 3200 ? 'pressure' : elapsed < 5100 ? 'slice-1' : 'slice-2';
      if (nextVisual !== visualRef.current) {
        visualRef.current = nextVisual;
        setVisualState(nextVisual);
      }

      const selected = choices[choice];
      const impactT = clamp01(elapsed / 1800);
      const slice1T = clamp01((elapsed - 3200) / 1600);
      const slice2T = clamp01((elapsed - 5100) / 1600);
      const stage = nextVisual === 'impact' ? 0 : nextVisual === 'pressure' ? 1 : 2;

      ctx.clearRect(0, 0, 700, 390);
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 700, 390);

      drawStageCard(ctx, 18, '① 外力产生预测碰撞', stage === 0, WATER.guide);
      drawStageCard(ctx, 246, '② 过密产生压力加速度', stage === 1, WATER.bad);
      drawStageCard(ctx, 474, '③ 每个时间片积分一次', stage === 2, selected.color);

      const incomingX = mix(54, 160, impactT);
      drawWaterParticle(ctx, incomingX, 83, 10, WATER.bright);
      drawWaterParticle(ctx, 194, 83, 10, WATER.mid);
      drawArrow(ctx, { x: 43, y: 108 }, { x: 118, y: 108 }, WATER.guide, 2.5);
      ctx.fillStyle = WATER.muted;
      ctx.font = '12px Segoe UI';
      ctx.fillText('v* = vⁿ + a_ext Δt', 62, 119);

      drawWaterParticle(ctx, 314, 81, 11, WATER.user);
      drawWaterParticle(ctx, 350, 81, 11, WATER.user);
      drawArrow(ctx, { x: 310, y: 106 }, { x: 276, y: 106 }, WATER.bad, 2.6);
      drawArrow(ctx, { x: 354, y: 106 }, { x: 388, y: 106 }, WATER.bad, 2.6);
      ctx.fillStyle = WATER.bad;
      ctx.font = '700 12px Segoe UI';
      ctx.fillText('ρᵢ > ρ₀ → pᵢ ↑ → aᵢᵖ', 269, 119);

      ctx.fillStyle = WATER.ink;
      ctx.font = '700 12px Segoe UI';
      ctx.fillText('vⁿ⁺¹ = v* + aₚ Δt', 493, 76);
      ctx.fillText('xⁿ⁺¹ = xⁿ + vⁿ⁺¹ Δt', 493, 103);
      ctx.fillStyle = selected.color;
      ctx.font = '800 12px Segoe UI';
      ctx.fillText(`当前档位：Δt = ${selected.dt}`, 513, 121);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = WATER.line;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(18, 146, 664, 224, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = WATER.ink;
      ctx.font = '800 16px Segoe UI';
      ctx.fillText('两次时间片：每次都重新估计密度和压力', 36, 176);

      const slice1Active = nextVisual === 'slice-1';
      const slice2Active = nextVisual === 'slice-2';
      const drawChip = (x: number, text: string, active: boolean) => {
        ctx.fillStyle = active ? '#e8f3ff' : '#f1f4f8';
        ctx.strokeStyle = active ? selected.color : WATER.line;
        ctx.lineWidth = active ? 2.3 : 1.2;
        ctx.beginPath();
        ctx.roundRect(x, 157, 102, 29, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? selected.color : WATER.muted;
        ctx.font = '700 12px Segoe UI';
        ctx.fillText(text, x + 17, 176);
      };
      drawChip(444, '第 1 个时间片', slice1Active);
      drawChip(558, '第 2 个时间片', slice2Active);

      const startLeft = 326;
      const startRight = 374;
      const right1 = 700 - selected.left1;
      const right2 = 700 - selected.left2;
      const leftX = nextVisual === 'slice-1' ? mix(startLeft, selected.left1, slice1T) : nextVisual === 'slice-2' ? mix(selected.left1, selected.left2, slice2T) : startLeft;
      const rightX = nextVisual === 'slice-1' ? mix(startRight, right1, slice1T) : nextVisual === 'slice-2' ? mix(right1, right2, slice2T) : startRight;
      const particleColor = choice === 1 && stage === 2 ? WATER.user : WATER.mid;

      ctx.strokeStyle = WATER.good;
      ctx.lineWidth = 1.7;
      ctx.setLineDash([6, 5]);
      [300, 400].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, 260, 17, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = WATER.good;
      ctx.font = '700 12px Segoe UI';
      ctx.fillText('ρ ≈ ρ₀ 的理想间距', 292, 220);

      drawWaterParticle(ctx, startLeft, 260, 11, WATER.user, 0.18);
      drawWaterParticle(ctx, startRight, 260, 11, WATER.user, 0.18);
      if (stage === 2) {
        if (nextVisual === 'slice-2') {
          drawWaterParticle(ctx, selected.left1, 260, 11, WATER.user, 0.18);
          drawWaterParticle(ctx, right1, 260, 11, WATER.user, 0.18);
          drawArrow(ctx, { x: selected.left1, y: 292 }, { x: leftX, y: 292 }, selected.color, 2.8, true);
          drawArrow(ctx, { x: right1, y: 292 }, { x: rightX, y: 292 }, selected.color, 2.8, true);
        } else {
          drawArrow(ctx, { x: startLeft - 2, y: 292 }, { x: leftX, y: 292 }, selected.color, 2.6, true);
          drawArrow(ctx, { x: startRight + 2, y: 292 }, { x: rightX, y: 292 }, selected.color, 2.6, true);
        }
      } else if (stage === 1) {
        drawArrow(ctx, { x: startLeft - 10, y: 292 }, { x: 284, y: 292 }, WATER.bad, 2.6);
        drawArrow(ctx, { x: startRight + 10, y: 292 }, { x: 416, y: 292 }, WATER.bad, 2.6);
      }
      drawWaterParticle(ctx, leftX, 260, 13, particleColor);
      drawWaterParticle(ctx, rightX, 260, 13, particleColor);

      ctx.fillStyle = stage === 1 ? '#fdecef' : stage === 2 ? '#eef7f3' : '#edf5ff';
      ctx.strokeStyle = stage === 1 ? WATER.bad : stage === 2 ? selected.color : WATER.guide;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(36, 317, 628, 37, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = stage === 1 ? WATER.bad : stage === 2 ? selected.color : WATER.guide;
      ctx.font = '800 13px Segoe UI';
      const status = nextVisual === 'impact'
        ? '预测位置：两个粒子距离过近'
        : nextVisual === 'pressure'
          ? '邻域密度过大：压力加速度把粒子推向两侧'
          : nextVisual === 'slice-1'
            ? `时间片 1 更新后：重新估计密度，${selected.density1}`
            : `时间片 2 更新后：重新估计密度，${selected.density2}`;
      ctx.fillText(status, 53, 341);
      canvas.classList.add('is-ready');
    };

    const loop = (now: number) => {
      if (!running) return;
      draw(now);
      if (!paused) raf = requestAnimationFrame(loop);
    };
    draw(performance.now());
    const disconnect = observeCanvas(canvas, () => {
      running = true;
      raf = requestAnimationFrame(loop);
    }, () => {
      running = false;
      cancelAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, [choice, paused, replay]);

  const selectChoice = (index: number) => {
    elapsedRef.current = 0;
    visualRef.current = 'impact';
    setVisualState('impact');
    setChoice(index);
    setPaused(false);
    setReplay((value) => value + 1);
  };

  const replayAnimation = () => {
    elapsedRef.current = 0;
    visualRef.current = 'impact';
    setVisualState('impact');
    setPaused(false);
    setReplay((value) => value + 1);
  };

  const feedback = visualState === 'impact'
    ? '① 外力先更新速度，粒子 i 撞向邻居 j，产生尚未校正的预测位置。'
    : visualState === 'pressure'
      ? '② 预测位置过近使 ρᵢ > ρ₀；传统 SPH 由状态方程求压力，再得到压力加速度 aₚ。'
      : `${visualState === 'slice-1' ? '③ 第 1 个时间片' : '③ 第 2 个时间片'}：先用 aₚΔt 更新速度，再用新速度乘 Δt 更新位置。${visualState === 'slice-1' ? choices[choice].result1 : choices[choice].result2}`;

  return (
    <div>
      <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}，${choices[choice].label}，${feedback}`} />
      <div className="ctrl talk-chip-row" role="group" aria-label="选择传统 SPH 的时间步">
        {choices.map((item, index) => (
          <button key={item.label} type="button" className={`tiny ${choice === index ? 'primary' : 'ghost'}`} onClick={() => selectChoice(index)}>
            {item.label}
          </button>
        ))}
        <button type="button" className="tiny ghost" onClick={replayAnimation}>重新播放</button>
        <button type="button" className="tiny ghost" onClick={() => setPaused((value) => !value)}>{paused ? '继续' : '暂停'}</button>
        <span className="val">{visualState === 'slice-1' ? '时间片 1' : visualState === 'slice-2' ? '时间片 2' : visualState === 'pressure' ? '压力' : '碰撞'}</span>
      </div>
      <p className={`feedback ${choice === 1 && visualState.startsWith('slice') ? 'bad' : visualState === 'slice-2' && choice === 0 ? 'good' : ''}`} aria-live="polite">{feedback}</p>
    </div>
  );
};

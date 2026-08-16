import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { WATER, drawArrow, drawWaterParticle } from './waterKit';

const X_COLUMNS = Array.from({ length: 8 }, (_, index) => 62 + index * 52);
const LOWER_LAYER_Y = [165, 216, 267];
const IMPACT_START_Y = [132, ...LOWER_LAYER_Y];
const COMPRESSED_LAYER_Y = [154, 193, 232, 271];
const RESTORED_LAYER_Y = [104, 159, 214, 269];

function mixNumber(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function drawLayerBand(ctx: CanvasRenderingContext2D, y: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(44, y - 12, 408, 24, 12);
  ctx.fill();
  ctx.globalAlpha = Math.min(0.68, alpha + 0.18);
  ctx.stroke();
  ctx.restore();
}

export const IncompressibilityDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [replay, setReplay] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 700, 330);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const start = performance.now();
    let raf = 0;
    let running = false;

    const draw = (now: number) => {
      const elapsed = paused ? [900, 3000, 5200][stageRef.current] : reduced ? 5200 : (now - start) % 7200;
      const nextStage = elapsed < 2200 ? 0 : elapsed < 4100 ? 1 : 2;
      if (nextStage !== stageRef.current) {
        stageRef.current = nextStage;
        setStage(nextStage);
      }

      const fallT = Math.max(0, Math.min(1, elapsed / 2200));
      const impactT = Math.max(0, Math.min(1, (elapsed - 2200) / 1900));
      const recoverT = Math.max(0, Math.min(1, (elapsed - 4100) / 1800));
      const densityRatio = nextStage === 0 ? 1 : nextStage === 1 ? 1 + 0.18 * impactT : 1.18 - 0.18 * recoverT;

      ctx.clearRect(0, 0, 700, 330);
      ctx.fillStyle = WATER.page;
      ctx.fillRect(0, 0, 700, 330);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = WATER.line;
      ctx.lineWidth = 1.5;
      ctx.fillRect(22, 34, 482, 274);
      ctx.strokeRect(22, 34, 482, 274);

      ctx.fillStyle = WATER.ink;
      ctx.font = '800 16px Segoe UI';
      ctx.fillText(['① 一层水垂直落向三层水', '② 四层液体共同向下压缩', '③ 压力恢复均匀层间距'][nextStage], 38, 59);

      const layerY = nextStage === 0
        ? [mixNumber(87, IMPACT_START_Y[0], fallT), ...LOWER_LAYER_Y]
        : nextStage === 1
          ? IMPACT_START_Y.map((y, index) => mixNumber(y, COMPRESSED_LAYER_Y[index], impactT))
          : COMPRESSED_LAYER_Y.map((y, index) => mixNumber(y, RESTORED_LAYER_Y[index], recoverT));

      layerY.forEach((y, layerIndex) => {
        const isCompressed = nextStage === 1 && impactT > 0.38;
        const color = isCompressed ? WATER.user : layerIndex === 0 ? WATER.bright : WATER.mid;
        drawLayerBand(ctx, y, color, isCompressed ? 0.15 : 0.11);
        X_COLUMNS.forEach((x) => drawWaterParticle(ctx, x, y, 8, color));
      });

      if (nextStage === 0) {
        drawArrow(ctx, { x: 474, y: 79 }, { x: 474, y: 126 }, WATER.guide, 3.5);
        ctx.fillStyle = WATER.guide;
        ctx.font = '700 13px Segoe UI';
        ctx.fillText('外力（重力等）', 384, 72);
      } else if (nextStage === 1) {
        drawArrow(ctx, { x: 474, y: 112 }, { x: 474, y: 246 }, WATER.bad, 4);
        ctx.fillStyle = WATER.bad;
        ctx.font = '800 13px Segoe UI';
        ctx.fillText('层间距缩小', 386, 128);
      }

      if (nextStage === 2) {
        [1, 2, 3].forEach((layerIndex) => {
          const y = layerY[layerIndex];
          drawArrow(ctx, { x: 474, y: y - 7 }, { x: 474, y: y - 39 }, WATER.good, 3);
        });
        ctx.fillStyle = WATER.good;
        ctx.font = '800 13px Segoe UI';
        ctx.fillText('压力重新拉开竖直层间距', 156, 296);
      }

      ctx.fillStyle = WATER.ink;
      ctx.font = '800 17px Segoe UI';
      ctx.fillText('撞击区密度', 538, 62);
      ctx.fillStyle = '#dfe9f3';
      ctx.fillRect(538, 86, 132, 26);
      ctx.fillStyle = densityRatio > 1.08 ? WATER.bad : WATER.good;
      ctx.fillRect(538, 86, Math.min(132, 76 + (densityRatio - 1) * 300), 26);
      ctx.fillStyle = densityRatio > 1.08 ? WATER.bad : WATER.good;
      ctx.font = '800 26px Segoe UI';
      ctx.fillText(`ρ / ρ₀ = ${densityRatio.toFixed(2)}`, 527, 154);
      ctx.fillStyle = WATER.muted;
      ctx.font = '13px Segoe UI';
      ctx.fillText('静止密度对应 1', 547, 180);

      const cardColor = nextStage === 1 ? WATER.bad : nextStage === 2 ? WATER.good : WATER.guide;
      ctx.fillStyle = nextStage === 1 ? '#fdecef' : nextStage === 2 ? '#e7f6ef' : '#e9f3ff';
      ctx.strokeStyle = cardColor;
      ctx.lineWidth = 1.5;
      ctx.fillRect(526, 205, 154, 82);
      ctx.strokeRect(526, 205, 154, 82);
      ctx.fillStyle = cardColor;
      ctx.font = '800 14px Segoe UI';
      ctx.fillText(['外力预测', '密度误差出现', '压力开始恢复'][nextStage], 544, 231);
      ctx.fillStyle = WATER.ink;
      ctx.font = '12px Segoe UI';
      const lines = [
        ['先不计算压力', '只得到候选位置'],
        ['四层间距缩小', '局部 ρ > ρ₀'],
        ['压力拉开层间距', 'ρ / ρ₀ 回到 1'],
      ][nextStage];
      ctx.fillText(lines[0], 544, 255);
      ctx.fillText(lines[1], 544, 274);
      canvas.classList.add('is-ready');
    };

    const loop = (now: number) => {
      if (!running) return;
      draw(now);
      if (!paused) raf = requestAnimationFrame(loop);
    };
    draw(start);
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
  }, [paused, replay]);

  const feedback = [
    '上层一层水在外力（重力等）作用下，垂直落向下方三层水。',
    '撞击后四层液体继续向下挤压，竖直层间距缩小，ρ / ρ₀ 随之升高。',
    '压力沿竖直方向重新拉开层间距，使 ρ / ρ₀ 准确回到 1。',
  ][stage];

  return (
    <div>
      <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}：${feedback}`} />
      <div className="ctrl talk-chip-row">
        <button type="button" className="tiny primary" onClick={() => { stageRef.current = 0; setStage(0); setPaused(false); setReplay((value) => value + 1); }}>重新播放</button>
        <button type="button" className="tiny ghost" onClick={() => setPaused((value) => !value)}>{paused ? '从头播放' : '暂停'}</button>
        <span className="val">{['预测', '过密', '压力恢复'][stage]}</span>
      </div>
      <p className={`feedback ${stage === 1 ? 'bad' : stage === 2 ? 'good' : ''}`} aria-live="polite">{feedback}</p>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比卡：两段布条对花纹。先只平移，花纹错开明显；退回后边推边缩放，
// 花纹一次对上；末尾缓动复位到初始错开状态，首尾无缝。离屏暂停、无控件。

const W = 560;
const H = 140;
const PERIOD = 4200;
const BAND_TOP = 70;
const BAND_BOTTOM = 116;
const LEFT_X0 = 20;
const LEFT_X1 = 278;
const RIGHT_X0 = 282;
const RIGHT_X1 = 540;
const PITCH = 26;
const STRETCH = 1.4;
const SHIFT = -46;

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}

function drawBand(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x0, BAND_TOP, x1 - x0, BAND_BOTTOM - BAND_TOP);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(x0, BAND_BOTTOM - 4, x1 - x0, 4);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x0 + 0.5, BAND_TOP + 0.5, x1 - x0 - 1, BAND_BOTTOM - BAND_TOP - 1);
}

function drawSetting(ctx: CanvasRenderingContext2D) {
  drawBand(ctx, LEFT_X0, LEFT_X1);
  drawBand(ctx, RIGHT_X0, RIGHT_X1);
  // 布面纹理：稀疏短划线，极低对比度
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1;
  for (let x = 40; x <= 524; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, BAND_TOP + 8);
    ctx.lineTo(x + 7, BAND_TOP + 8);
    ctx.moveTo(x + 12, BAND_BOTTOM - 10);
    ctx.lineTo(x + 19, BAND_BOTTOM - 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#21324a';
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = (now: number) => {
      const phase = ((now - t0) % PERIOD) / PERIOD;
      let shift = 0;
      let scale = STRETCH;
      let colorT = 0;
      let second = false;
      if (phase < 0.28) {
        shift = SHIFT * easeInOutQuad(phase / 0.28);
      } else if (phase < 0.38) {
        shift = SHIFT;
      } else if (phase < 0.44) {
        shift = SHIFT * (1 - easeInOutQuad((phase - 0.38) / 0.06));
      } else if (phase < 0.78) {
        second = true;
        const e = easeInOutQuad((phase - 0.44) / 0.34);
        shift = SHIFT * e;
        scale = lerp(STRETCH, 1, e);
        colorT = e;
      } else if (phase < 0.88) {
        second = true;
        shift = SHIFT;
        scale = 1;
        colorT = 1;
      } else {
        second = true;
        const e = easeInOutQuad((phase - 0.88) / 0.12);
        shift = SHIFT * (1 - e);
        scale = lerp(1, STRETCH, e);
        colorT = 1 - e;
      }

      clearScene(ctx);
      drawSetting(ctx);

      ctx.save();
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 8; i += 1) {
        const x = 34 + i * PITCH;
        ctx.globalAlpha = 0.75 + 0.25 * Math.abs(Math.sin(i * 2.1));
        ctx.beginPath();
        ctx.moveTo(x, BAND_TOP + 8);
        ctx.lineTo(x, BAND_BOTTOM - 8);
        ctx.stroke();
      }
      ctx.restore();

      const aligned = second && scale < 1.02 && shift < SHIFT + 2;
      const glow = aligned ? 0.85 + 0.15 * Math.sin(now / 180) : 1;
      ctx.save();
      ctx.strokeStyle = lerpColor('#c43f52', '#228d5c', colorT);
      ctx.lineWidth = 2;
      for (let i = 0; i <= 6; i += 1) {
        const x = 288 + i * PITCH * scale + shift;
        ctx.globalAlpha = glow * (0.75 + 0.25 * Math.abs(Math.sin(i * 1.7)));
        ctx.beginPath();
        ctx.moveTo(x, BAND_TOP + 8);
        ctx.lineTo(x, BAND_BOTTOM - 8);
        ctx.stroke();
      }
      ctx.restore();

      const labelAlpha = Math.min(clamp(phase / 0.04, 0, 1), clamp((1 - phase) / 0.04, 0, 1));
      drawSceneLabel(ctx, second ? '平移+缩放' : '只平移', 280, 52, labelAlpha);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Ana3;

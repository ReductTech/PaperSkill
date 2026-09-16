import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ana-4-wind-crown — 蒸馏漏斗：~10M token 原始轨迹经漏斗压缩为三层视图
// （总览 / 报告 / 轨迹），输出 ~10K token；点流连续通过，三层依次脉冲
// （560x140，3s 循环，自动播放）

const W = 560;
const H = 140;
const LOOP = 3000;
const N_DOTS = 70;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
};

const LAYERS = [
  { label: '总览', cy: 40 },
  { label: '报告', cy: 70 },
  { label: '轨迹', cy: 100 },
];
const LAYER_X = 275;
const LAYER_W = 160;
const LAYER_H = 22;

const rnd = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const AnaWindCrown: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
    let startTs = 0;

    const render = (now: number) => {
      if (!startTs) startTs = now;
      const t = ((now - startTs) % LOOP) / LOOP;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 输入带宽边界
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, 26);
      ctx.lineTo(140, 26);
      ctx.moveTo(20, 114);
      ctx.lineTo(140, 114);
      ctx.stroke();

      // 漏斗轮廓
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 26);
      ctx.lineTo(270, 54);
      ctx.lineTo(270, 86);
      ctx.lineTo(140, 114);
      ctx.stroke();

      // 输出窄带边界
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(435, 62);
      ctx.lineTo(545, 62);
      ctx.moveTo(435, 78);
      ctx.lineTo(545, 78);
      ctx.stroke();

      // 标注
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = C.steel;
      ctx.fillText('~10M', 24, 18);
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('tokens', 66, 18);
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = C.steel;
      ctx.textAlign = 'right';
      ctx.fillText('~10K', 545, 52);
      ctx.textAlign = 'left';

      // 三层视图
      for (let i = 0; i < 3; i++) {
        const ly = LAYERS[i].cy - LAYER_H / 2;
        const on = t >= i / 3 && t < (i + 1) / 3;
        const pulse = on ? Math.sin(((t - i / 3) * 3) * Math.PI) : 0;
        ctx.save();
        if (pulse > 0) {
          ctx.shadowColor = 'rgba(39,68,110,0.4)';
          ctx.shadowBlur = 10 * pulse;
        }
        ctx.beginPath();
        ctx.roundRect(LAYER_X, ly, LAYER_W, LAYER_H, 5);
        ctx.fillStyle = C.panel;
        ctx.fill();
        ctx.lineWidth = on ? 3 : 2;
        ctx.strokeStyle = on ? C.blue : C.border;
        ctx.stroke();
        ctx.restore();
        if (pulse > 0) {
          ctx.beginPath();
          ctx.roundRect(LAYER_X, ly, LAYER_W, LAYER_H, 5);
          ctx.fillStyle = `rgba(39,68,110,${0.07 * pulse})`;
          ctx.fill();
        }
        ctx.fillStyle = C.text;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(LAYERS[i].label, LAYER_X + LAYER_W / 2, LAYERS[i].cy + 4);
        ctx.textAlign = 'left';
      }

      // 点流：宽输入带 → 漏斗汇聚 → 分配到三层 → 窄输出带
      for (let i = 0; i < N_DOTS; i++) {
        const lat = rnd(i, 1) - 0.5; // 横向偏移系数
        const phase = rnd(i, 2);
        const layer = i % 3;
        const x = 20 + ((t + phase) % 1) * 525;
        let y: number;
        if (x < 140) {
          y = 70 + lat * 84;
        } else if (x < 270) {
          const k = (x - 140) / 130;
          y = 70 + lat * lerp(84, 18, k);
        } else if (x < 435) {
          const k = easeInOutQuad(clamp((x - 270) / 165, 0, 1));
          y = lerp(70 + lat * 18, LAYERS[layer].cy, k);
        } else {
          const k = clamp((x - 435) / 60, 0, 1);
          y = lerp(LAYERS[layer].cy, 70 + lat * 10, k);
        }
        ctx.fillStyle = x >= 270 ? C.blue : C.muted;
        ctx.globalAlpha = x >= 270 ? 0.75 : 0.6;
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default AnaWindCrown;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const S2_SLOTS = 24;
const S1_SLOTS = 12;

const CAL_X = 80;
const CAL_Y = 40;
const CAL_W = 920;
const CAL_H = 110;
const SEG_W = CAL_W / 12;
const OPT_Y = 82;
const RAD_Y = 126;

const BAR_X = 80;
const BAR_Y = 170;
const BAR_W = 620;
const BAR_H = 34;

const INSET_X = 720;
const INSET_Y = 150;
const INSET_W = 300;
const INSET_H = 110;
const AXIS_L = 738;
const AXIS_R = 1006;
const AXIS_Y = 236;
const CURVE_TOP = 188;

const INITIAL_FB = '中等云量：光学观测稀疏，雷达观测不受影响';

const CLOUD_ORDER = [
  1, 13, 7, 19, 4, 16, 10, 22, 2, 14, 8, 20, 5, 17, 11, 23, 0, 12, 6, 18, 3, 15, 9, 21,
];

function feedbackFor(cloud: number): { text: string; cls: string } {
  if (cloud <= 30)
    return {
      text: '观测充足：v2 推理把全部有效观测送入编码器，而 v1 的固定 L=40 会丢弃多余观测',
      cls: 'good',
    };
  if (cloud < 65)
    return { text: '云量中等：光学观测稀疏且不规则，掩码把缺口显式标出，物候不被抹掉', cls: '' };
  return {
    text: '重云区有效观测很少：v1 只能重复观测凑满 L=40，v2 保留掩码并让全部有效观测参与推理',
    cls: 'bad',
  };
}

const slotX = (i: number) =>
  CAL_X + Math.floor(i / 2) * SEG_W + (i % 2 === 0 ? SEG_W * 0.3 : SEG_W * 0.7);
const seriesX = (i: number) => AXIS_L + i * ((AXIS_R - AXIS_L) / (S2_SLOTS - 1));
const seriesY = (i: number) => {
  const v = 0.5 + 0.38 * Math.sin((i / S2_SLOTS) * Math.PI * 2 - Math.PI / 2);
  return map(v, 0, 1, AXIS_Y - 6, CURVE_TOP);
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 24);
  ctx.lineTo(W, H - 24);
  ctx.stroke();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = '#21324a';
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

interface LegendItem {
  label: string;
  color: string;
  shape: 'dot' | 'square' | 'ring';
}

function drawLegend(ctx: CanvasRenderingContext2D, items: LegendItem[], x: number, y: number) {
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const item of items) {
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = 2.5;
    if (item.shape === 'dot') {
      ctx.beginPath();
      ctx.arc(cx + 6, y - 6, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.shape === 'square') {
      ctx.fillRect(cx, y - 11, 11, 11);
    } else {
      ctx.beginPath();
      ctx.arc(cx + 6, y - 6, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 20 + ctx.measureText(item.label).width + 24;
  }
}

export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ cloud: 50 });
  const [cloudCover, setCloudCover] = useState(50);
  const [feedback, setFeedback] = useState({ text: INITIAL_FB, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const render = (t: number) => {
      const s = stateRef.current;
      const nCloudy = Math.round((S2_SLOTS * s.cloud) / 100);
      const cloudy = new Set<number>(CLOUD_ORDER.slice(0, nCloudy));
      const valid = (i: number) => !cloudy.has(i);

      clearScene(ctx);

      for (let seg = 0; seg < 12; seg++) {
        ctx.fillStyle = seg % 2 === 0 ? 'rgba(184, 201, 167, 0.28)' : 'rgba(184, 201, 167, 0.52)';
        ctx.fillRect(CAL_X + seg * SEG_W, CAL_Y, SEG_W, CAL_H);
      }
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      for (let seg = 1; seg < 12; seg++) {
        ctx.beginPath();
        ctx.moveTo(CAL_X + seg * SEG_W, CAL_Y);
        ctx.lineTo(CAL_X + seg * SEG_W, CAL_Y + CAL_H);
        ctx.stroke();
      }
      ctx.lineWidth = 2;
      ctx.strokeRect(CAL_X, CAL_Y, CAL_W, CAL_H);

      for (let i = 0; i < S2_SLOTS; i++) {
        const x = slotX(i);
        if (valid(i)) {
          ctx.fillStyle = '#27446e';
          ctx.beginPath();
          ctx.arc(x, OPT_Y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#c43f52';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, OPT_Y, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = '#27446e';
      for (let j = 0; j < S1_SLOTS; j++) {
        const x = CAL_X + (j + 0.5) * SEG_W;
        ctx.fillRect(x - 4, RAD_Y - 4, 8, 8);
      }

      for (let i = 0; i < S2_SLOTS; i++) {
        const x = BAR_X + i * (BAR_W / S2_SLOTS);
        const w = BAR_W / S2_SLOTS - 3;
        ctx.fillStyle = valid(i) ? '#27446e' : '#d7deea';
        ctx.fillRect(x, BAR_Y + 4, w, BAR_H - 8);
      }

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      roundRect(ctx, INSET_X, INSET_Y, INSET_W, INSET_H, 8);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(AXIS_L, AXIS_Y);
      ctx.lineTo(AXIS_R, AXIS_Y);
      ctx.moveTo(AXIS_L, CURVE_TOP - 10);
      ctx.lineTo(AXIS_L, AXIS_Y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(39, 68, 110, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < S2_SLOTS; i++) {
        if (!valid(i)) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(seriesX(i), seriesY(i));
          started = true;
        } else {
          ctx.lineTo(seriesX(i), seriesY(i));
        }
      }
      ctx.stroke();

      ctx.fillStyle = '#27446e';
      for (let i = 0; i < S2_SLOTS; i++) {
        if (!valid(i)) continue;
        ctx.beginPath();
        ctx.arc(seriesX(i), seriesY(i), 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      const cycle = Math.floor(t / 3);
      const winL = cycle % 2 === 0 ? 8 : 16;
      const candidates: number[] = [];
      for (let i = 0; i < S2_SLOTS; i++) {
        if (valid(i) && i + winL <= S2_SLOTS) candidates.push(i);
      }
      const winStart = candidates.length > 0 ? candidates[cycle % candidates.length] : 0;
      const bx0 = seriesX(winStart);
      const bx1 = seriesX(winStart + winL - 1);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx0, CURVE_TOP - 4);
      ctx.lineTo(bx1, CURVE_TOP - 4);
      ctx.moveTo(bx0, CURVE_TOP - 14);
      ctx.lineTo(bx0, CURVE_TOP + 6);
      ctx.moveTo(bx1, CURVE_TOP - 14);
      ctx.lineTo(bx1, CURVE_TOP + 6);
      ctx.stroke();
      ctx.fillStyle = '#f07e47';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(winL === 8 ? '8' : '16', (bx0 + bx1) / 2, CURVE_TOP - 18);
      ctx.textAlign = 'left';

      drawSceneLabel(ctx, '观测日历', CAL_X + 4, CAL_Y - 10);
      drawSceneLabel(ctx, '稀疏序列', INSET_X + 6, INSET_Y - 6);
      drawLegend(
        ctx,
        [
          { label: '有效光学', color: '#27446e', shape: 'dot' },
          { label: '雷达', color: '#27446e', shape: 'square' },
          { label: '云遮挡', color: '#c43f52', shape: 'ring' },
        ],
        320,
        248
      );
    };

    const tick = (now: number) => {
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const applyCloud = (v: number) => {
    const cv = clamp(v, 0, 90);
    stateRef.current.cloud = cv;
    setCloudCover(cv);
    setFeedback(feedbackFor(cv));
  };

  const onCloud = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyCloud(Number(e.target.value));
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!e.shiftKey) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      applyCloud(cloudCover + (e.key === 'ArrowRight' ? 25 : -25));
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          云量 <span className="val">{cloudCover}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={cloudCover}
          onChange={onCloud}
          onKeyDown={onKey}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;

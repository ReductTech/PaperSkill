import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  seeded,
  CONTOUR,
  ROUTE,
  OK,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m41 — 四种基座：未来住在哪张纸上。点击四个 chip，左面板呈现同一片地形的四种表示，
// 右侧三行信息显示「有没有固定解码器 / 能不能直接看图检查 / 代表方法 + 形状」。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface SubDef {
  chip: string;
  decoder: boolean;
  inspect: boolean;
  methods: string;
  shape: string;
}

const SUBS: SubDef[] = [
  { chip: '像素', decoder: true, inspect: true, methods: 'UniPi / GR-1', shape: 'R^{H×C×H_px×W_px}' },
  { chip: '特征', decoder: false, inspect: false, methods: 'Fast-WAM / FLARE', shape: 'R^{H×N_tok×d_emb}' },
  { chip: '几何', decoder: false, inspect: false, methods: 'PointWorld / TraceGen', shape: 'R^{H×2×H_px×W_px}' },
  { chip: '可供性', decoder: false, inspect: false, methods: 'AIM / PALM / MWM', shape: 'R^{H×C×H_px×W_px}' },
];

const FEEDBACK = [
  '解码视频或可解码隐变量（UniPi、GR-1 一线）：外观、接触痕迹都能查，但要为控制器不需要的细节付账。',
  '无固定解码器的隐藏状态与 token（Fast-WAM、FLARE 一线）：预测便宜、语义稳定，却没有直接的视觉保真度指标可查。',
  '物理坐标：光流、点轨迹、深度、位姿（PointWorld、TraceGen 一线）：更接近控制，前提是任务信息主要在运动与几何里。',
  '任务图谱：价值图、掩码、接触可能（AIM、PALM、MWM 一线）：紧凑且直接可用，但标签要按任务定义。',
];

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6 * Math.cos(a - 0.4), y2 - 6 * Math.sin(a - 0.4));
  ctx.lineTo(x2 - 6 * Math.cos(a + 0.4), y2 - 6 * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
}

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ substrate: 0 });
  const rafRef = useRef<number | null>(null);
  const [substrate, setSubstrate] = useState(0);
  const [feedback, setFeedback] = useState({ text: FEEDBACK[0], cls: '' });

  const select = (i: number): void => {
    const idx = clamp(i, 0, 3);
    stateRef.current.substrate = idx;
    setSubstrate(idx);
    setFeedback({ text: FEEDBACK[idx], cls: '' });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawPixel = (): void => {
      drawContours(ctx, 44, 44, 512, 192, 11, CONTOUR, 5);
      const rnd = seeded(7);
      ctx.fillStyle = 'rgba(118,144,106,0.30)';
      for (let i = 0; i < 150; i++) {
        ctx.fillRect(48 + rnd() * 500, 48 + rnd() * 180, 2, 2);
      }
      ctx.fillStyle = 'rgba(33,50,74,0.05)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(80 + rnd() * 440, 64 + rnd() * 150, 18 + rnd() * 22, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawFeature = (): void => {
      const cols = ['#cfe0c3', '#dbe6f0', '#e8dcc6', '#dfe3ea'];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          ctx.fillStyle = cols[(r + c) % 4];
          ctx.fillRect(48 + c * 84, 48 + r * 46, 78, 40);
        }
      }
      const rnd = seeded(21);
      ctx.fillStyle = ROUTE;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          if (rnd() > 0.55) ctx.fillRect(48 + c * 84 + 32, 48 + r * 46 + 14, 11, 11);
        }
      }
    };

    const drawGeom = (): void => {
      ctx.strokeStyle = ROUTE;
      ctx.fillStyle = ROUTE;
      ctx.lineWidth = 2;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 7; c++) {
          const x = 72 + c * 70;
          const y = 64 + r * 48;
          const a = Math.sin(r * 1.3 + c * 0.7) * 0.7;
          arrow(ctx, x, y, x + Math.cos(a) * 17, y + Math.sin(a) * 17);
        }
      }
      ctx.strokeStyle = AUX;
      ctx.fillStyle = AUX;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const x = 70 + i * 45;
        const y = 120 + Math.sin(i * 0.7) * 44;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i <= 10; i += 2) {
        ctx.beginPath();
        ctx.arc(70 + i * 45, 120 + Math.sin(i * 0.7) * 44, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawAfford = (): void => {
      for (let r = 0; r < 5; r++) {
        const t = r / 4;
        ctx.fillStyle = `rgba(34,141,92,${0.10 + 0.16 * (1 - t)})`;
        ctx.fillRect(44, 44 + r * 38, 512, 38);
      }
      const rnd = seeded(5);
      ctx.fillStyle = EMPH;
      for (let i = 0; i < 11; i++) {
        ctx.beginPath();
        ctx.arc(80 + rnd() * 440, 66 + rnd() * 150, 5 + rnd() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = (): void => {
      const s = stateRef.current.substrate;
      const def = SUBS[s];
      clearField(ctx, W, H);

      drawSheet(ctx, 40, 40, 520, 200);
      if (s === 0) drawPixel();
      else if (s === 1) drawFeature();
      else if (s === 2) drawGeom();
      else drawAfford();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const row = (y: number, tag: string, on: boolean, yes: string, no: string): void => {
        ctx.fillStyle = MUTED;
        ctx.font = '14px ' + FONT;
        ctx.fillText(tag, 600, y);
        ctx.fillStyle = on ? OK : MUTED;
        ctx.beginPath();
        ctx.arc(742, y - 5, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = on ? OK : MUTED;
        ctx.font = 'bold 15px ' + FONT;
        ctx.fillText(on ? yes : no, 758, y);
      };

      row(100, '固定解码器', def.decoder, '有', '无');
      row(158, '可直接检查', def.inspect, '能', '不能');

      ctx.fillStyle = MUTED;
      ctx.font = '14px ' + FONT;
      ctx.fillText('代表方法', 600, 220);
      ctx.fillStyle = INK;
      ctx.font = 'bold 14px ' + FONT;
      ctx.fillText(def.methods, 690, 220);

      ctx.fillStyle = MUTED;
      ctx.font = '13px ' + FONT;
      ctx.fillText('形状', 600, 246);
      ctx.fillStyle = INK;
      ctx.font = '13px ' + FONT;
      ctx.fillText(def.shape, 690, 246);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(600, 178);
      ctx.lineTo(1040, 178);
      ctx.stroke();
    };

    const loop = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(loop);
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
      <div className="ctrl">
        {SUBS.map((d, i) => (
          <button
            key={d.chip}
            type="button"
            className={'chip' + (i === substrate ? ' selected' : '')}
            onClick={() => select(i)}
          >
            {d.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41;

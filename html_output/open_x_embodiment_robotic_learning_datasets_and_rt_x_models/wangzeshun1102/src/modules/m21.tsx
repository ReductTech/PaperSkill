import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  AUX,
  clearScene,
  drawLegend,
  drawSceneLabel,
  drawVehicle,
  EMPH,
  GUIDE,
  LINE,
  MUTED,
  OK,
  PAINT,
} from './drivingKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const STEP_TEXT = [
  '60 个数据集来自 34 个实验室：动作空间、相机数量、是否带深度或点云都不一样。',
  '第一步，把不同机器人的末端执行器动作对齐到同一套表示，消掉维度与量纲差异。',
  '第二步，对齐观测：不同数据集有不同数量的 RGB、深度相机与点云，统一成一致的观测字段。',
  '最后序列化成 RLDS（tfrecord）。60 份来源不同的数据，终于能放进同一条训练管线。',
];

const SRC_Y = [44, 100, 156, 212];
const SRC_CAMS = [1, 2, 3, 0];
const SRC_COLORS = [PAINT, AUX, GUIDE, MUTED];
const NODE_X = [330, 455, 580, 705];
const NODE_Y = 140;

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(STEP_TEXT[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, dash: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dash) {
        ctx.setLineDash([8, 6]);
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    const drawIcon = (i: number, color: string) => {
      const nx = NODE_X[i];
      const ny = NODE_Y;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      if (i === 0) {
        for (let k = 0; k < 3; k++) ctx.fillRect(nx - 13, ny - 12 + k * 9, 26, 6);
      } else if (i === 1) {
        const lens = [12, 20, 26];
        for (let k = 0; k < 3; k++) {
          const y = ny - 9 + k * 9;
          ctx.beginPath();
          ctx.moveTo(nx - 14, y);
          ctx.lineTo(nx - 14 + lens[k], y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(nx - 14 + lens[k], y);
          ctx.lineTo(nx - 19 + lens[k], y - 4);
          ctx.lineTo(nx - 19 + lens[k], y + 4);
          ctx.closePath();
          ctx.fill();
        }
      } else if (i === 2) {
        ctx.strokeRect(nx - 15, ny - 8, 30, 19);
        ctx.beginPath();
        ctx.arc(nx, ny + 2, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(nx - 6, ny - 12, 12, 4);
      } else {
        for (let k = 2; k >= 0; k--) {
          ctx.beginPath();
          ctx.moveTo(nx - 15, ny - 2 + k * 7);
          ctx.lineTo(nx + 3, ny - 2 + k * 7);
          ctx.lineTo(nx + 15, ny - 8 + k * 7);
          ctx.lineTo(nx - 3, ny - 8 + k * 7);
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const render = (now: number) => {
      clearScene(ctx, W, H);
      const s = stateRef.current.step;

      // 来源各异的原始数据
      for (let i = 0; i < 4; i++) {
        const y = SRC_Y[i];
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(40, y, 124, 40);
        ctx.strokeStyle = s === 0 ? EMPH : s > 0 ? OK : MUTED;
        ctx.lineWidth = s === 0 ? 2.5 : 1.5;
        ctx.strokeRect(40.5, y + 0.5, 123, 39);
        ctx.fillStyle = SRC_COLORS[i];
        ctx.fillRect(40, y, 6, 40);
        drawVehicle(ctx, 70, y + 31, i % 2 === 0 ? 'sedan' : 'van', 0.3, PAINT);
        if (SRC_CAMS[i] > 0) {
          for (let c = 0; c < SRC_CAMS[i]; c++) {
            ctx.fillStyle = GUIDE;
            ctx.beginPath();
            ctx.arc(101 + c * 14, y + 15, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = AUX;
          for (let c = 0; c < 7; c++) {
            ctx.beginPath();
            ctx.arc(98 + (c % 3) * 11, y + 10 + Math.floor(c / 3) * 10, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.fillStyle = LINE;
        ctx.fillRect(98, y + 27, 46, 3);
      }

      // 汇聚到统一管线
      for (let i = 0; i < 4; i++) {
        const y = SRC_Y[i] + 20;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(164, y);
        ctx.lineTo(290, NODE_Y);
        ctx.stroke();
      }

      // 四个处理节点
      for (let i = 0; i < 4; i++) {
        const active = i === s;
        const done = i < s;
        const fill = active ? EMPH : done ? OK : '#ffffff';
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(NODE_X[i], NODE_Y, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = active || done ? fill : MUTED;
        ctx.lineWidth = 2;
        ctx.stroke();
        drawIcon(i, active || done ? '#ffffff' : MUTED);
      }

      // 节点之间的流动虚线
      for (let i = 0; i < 3; i++) {
        const active = i + 1 === s;
        ctx.strokeStyle = i < s ? OK : active ? EMPH : LINE;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        const flow = ((now / 30) % 14) / 14;
        ctx.lineDashOffset = -lerp(0, 14, clamp(flow, 0, 1));
        ctx.beginPath();
        ctx.moveTo(NODE_X[i] + 32, NODE_Y);
        ctx.lineTo(NODE_X[i + 1] - 32, NODE_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }

      // 统一后的 RLDS 数据
      const outOn = s === 3;
      ctx.globalAlpha = outOn ? 1 : 0.38;
      for (let i = 0; i < 4; i++) {
        const y = 70 + i * 38;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(830, y, 190, 30);
        ctx.strokeStyle = outOn ? OK : MUTED;
        ctx.lineWidth = outOn ? 2 : 1.5;
        ctx.strokeRect(830.5, y + 0.5, 189, 29);
        ctx.fillStyle = outOn ? OK : LINE;
        ctx.fillRect(842, y + 10, 64, 4);
        ctx.fillRect(842, y + 19, 40, 4);
        ctx.fillStyle = LINE;
        ctx.fillRect(930, y + 12, 76, 6);
      }
      ctx.globalAlpha = 1;
      arrow(738, NODE_Y, 824, NODE_Y, outOn ? OK : LINE, false);

      // 标签（最多两个）
      drawSceneLabel(ctx, '来源各异', 40, 26, s === 0 ? PAINT : MUTED);
      drawSceneLabel(ctx, '统一 RLDS', 850, 26, outOn ? OK : MUTED);

      // 图例（三项）
      drawLegend(
        ctx,
        [
          { color: PAINT, text: '原始数据' },
          { color: OK, text: '统一后' },
          { color: EMPH, text: '当前步骤' },
        ],
        330,
        26
      );
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (i: number) => {
    stateRef.current.step = i;
    setStep(i);
    setFeedback(STEP_TEXT[i]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {['原始数据', '对齐动作空间', '对齐观测模态', '统一成 RLDS'].map((label, i) => (
          <button key={label} className={'chip' + (step === i ? ' selected' : '')} onClick={() => choose(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className={'feedback ' + (step === 3 ? 'good' : '')}>{feedback}</div>
    </div>
  );
};

export default M21;

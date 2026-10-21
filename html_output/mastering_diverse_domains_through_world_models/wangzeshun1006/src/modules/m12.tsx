import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawRope,
  drawFlag,
  drawSceneLabel,
  GUIDE,
  OK,
  EMPH,
  INK,
  MUTED,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// m12 — 核心循环：观察 → 建模 → 想象 → 行动（P2 上一步 / 下一步）。
const W = 1080;
const H = 280;

const POSES: ('reach' | 'hang' | 'rest' | 'flag' | 'topout')[] = [
  'reach',
  'hang',
  'rest',
  'flag',
  'topout',
];
const SHORT = ['真实交互', '存入缓冲', '建模更新', '想象训练', '回到环境'];
const FEEDBACK = [
  '在环境里执行动作，收集观测、奖励与继续标志——这是唯一的真实数据来源。',
  '经历写入重放缓冲；采集时存下的隐状态让后续训练不用反复重算。',
  '从缓冲中采样，用重建与 KL 目标更新世界模型：编码器、序列模型、解码器。',
  '世界模型生成想象轨迹，演员与评论家在其上更新——这一步不消耗环境步数。',
  '用更新后的策略回到环境继续行动，循环往复；三个网络始终同步训练。',
];
const NODE_NAMES = ['行动与观察', '重放缓冲', '世界模型', '想象训练', '回到环境'];
const NODE_X = [130, 330, 530, 730, 930];
const NODE_Y = 197;
const NODE_W = 160;
const NODE_H = 44;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dir * 9, y - 6);
  ctx.lineTo(x - dir * 9, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef(1);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({ text: FEEDBACK[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number): void => {
      clearCrag(ctx, W, H);
      const s = stepRef.current;
      const pulse = 0.5 + 0.5 * Math.sin(now / 320);

      // 上区：攀岩场景
      drawWall(ctx, 90, 36, 280, 80, { veins: 2 });
      drawFlag(ctx, 230, 60, OK);
      drawRope(ctx, [[230, 88], [230, 60]], GUIDE, 2.2);
      drawClimber(ctx, 230, 116, 0.95, EMPH, POSES[s - 1]);

      // 下区：五节点循环图
      const ay = NODE_Y;
      for (let i = 0; i < 4; i++) {
        const x1 = NODE_X[i] + NODE_W / 2;
        const x2 = NODE_X[i + 1] - NODE_W / 2;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, ay);
        ctx.lineTo(x2, ay);
        ctx.stroke();
        arrowHead(ctx, x2, ay, 1, LINE);
      }
      // 回环箭头：从末节点绕回起点
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(NODE_X[4], ay + NODE_H / 2);
      ctx.lineTo(NODE_X[4], 252);
      ctx.lineTo(NODE_X[0], 252);
      ctx.lineTo(NODE_X[0], ay + NODE_H / 2);
      ctx.stroke();
      arrowHead(ctx, NODE_X[0], ay + NODE_H / 2, 0, LINE);

      for (let i = 0; i < 5; i++) {
        const cx = NODE_X[i];
        const x = cx - NODE_W / 2;
        const isCur = i === s - 1;
        const passed = i < s - 1;
        ctx.save();
        if (isCur) {
          ctx.globalAlpha = 0.2 + 0.25 * pulse;
          ctx.fillStyle = EMPH;
          roundRect(ctx, x - 4, NODE_Y - 4, NODE_W + 8, NODE_H + 8, 12);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = isCur ? 'rgba(240,126,71,0.12)' : '#ffffff';
        roundRect(ctx, x, NODE_Y, NODE_W, NODE_H, 10);
        ctx.fill();
        ctx.strokeStyle = isCur ? EMPH : passed ? GUIDE : LINE;
        ctx.lineWidth = isCur ? 3 : passed ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = isCur ? INK : passed ? GUIDE : MUTED;
        ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(NODE_NAMES[i], cx, NODE_Y + NODE_H / 2 + 5);
        ctx.restore();
      }

      drawSceneLabel(ctx, SHORT[s - 1], 400, 52, s === 5 ? OK : GUIDE);
      ctx.save();
      ctx.fillStyle = MUTED;
      ctx.font = '16px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`第 ${s} / 5 步`, 1035, 52);
      ctx.restore();
    };

    const tick = (): void => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const goto = (n: number): void => {
    const v = Math.round(clamp(n, 1, 5));
    stepRef.current = v;
    setStep(v);
    setFeedback({ text: FEEDBACK[v - 1], cls: v === 5 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip' + (step > 1 ? ' selected on' : '')} disabled={step <= 1} onClick={() => goto(step - 1)}>
          上一步
        </button>
        <button className={'chip' + (step < 5 ? ' selected on' : '')} disabled={step >= 5} onClick={() => goto(step + 1)}>
          下一步
        </button>
        <button className="chip" onClick={() => goto(1)}>
          重新开始
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M12;

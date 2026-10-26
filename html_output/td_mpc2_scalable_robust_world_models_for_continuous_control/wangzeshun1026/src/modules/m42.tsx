import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  WOOD,
  GUIDE,
  EMPH,
  AUX,
  INK,
  LINE,
  clearScene,
  drawTable,
  drawBall,
  drawCue,
  drawShot,
  drawPocket,
  drawGauge,
  drawSceneLabel,
  drawLegend,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 4.2 只走一步再重来。
// 分步展示：规划 3 步 → 只执行第 1 个动作 → 重新观测 → 在新局面上重新规划。
const W = 1080;
const H = 280;

interface Pt {
  x: number;
  y: number;
}

interface FeedbackState {
  text: string;
  cls: string;
}

const P0: Pt = { x: 100, y: 135 };
const A: Pt = { x: 300, y: 108 };
const B: Pt = { x: 480, y: 154 };
const C: Pt = { x: 678, y: 135 };
const A2: Pt = { x: 430, y: 104 };
const B2: Pt = { x: 560, y: 158 };
const C2: Pt = { x: 675, y: 135 };

const STAGE_NAMES = ['① 规划', '② 执行首步', '③ 重新观测', '④ 再规划'];

const FEEDBACK: FeedbackState[] = [
  {
    text: '先做 6 次 MPPI 迭代：每轮采样 512 条长度 H=3 的动作序列，用隐空间回报更新对角高斯，得到一条 3 步计划。',
    cls: '',
  },
  {
    text: '只执行计划中的第 1 个动作。后两步虽然算过，但直接丢弃，不执行。',
    cls: 'good',
  },
  {
    text: '动作执行后局面变了：球已到新位置。旧计划基于旧局面，必须重新观测再决策。',
    cls: '',
  },
  {
    text: '在新观测上重新规划，又是 3 步；每执行一步都重复这一循环，这就是滚动时域（receding horizon）。',
    cls: 'good',
  },
];

const STAGE_LABELS: Array<[string, string]> = [
  ['规划三步', '未来 H=3'],
  ['只执行首步', '后两步作废'],
  ['重新观测', '局面已变'],
  ['重新规划', '又是三步'],
];

export const M42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stageRef = useRef({ stage: 0, t: 0 });
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    stageRef.current.t = performance.now();

    const seg = (a: Pt, b: Pt, color: string, width: number, dash?: number[]) => {
      drawShot(ctx, [[a.x, a.y], [b.x, b.y]], color, width, dash);
    };

    const render = (now: number) => {
      const current = stageRef.current.stage;
      const t = (now - stageRef.current.t) / 1000;
      clearScene(ctx, W, H);
      drawTable(ctx, 60, 60, 660, 150);
      drawPocket(ctx, 690, 135, 9);

      let ball: Pt = P0;

      if (current === 0) {
        ctx.globalAlpha = 0.9;
        seg(P0, A, GUIDE, 2, [7, 6]);
        seg(A, B, GUIDE, 2, [7, 6]);
        seg(B, C, GUIDE, 2, [7, 6]);
        ctx.globalAlpha = 1;
        drawBall(ctx, A.x, A.y, 3, GUIDE, false);
        drawBall(ctx, B.x, B.y, 3, GUIDE, false);
        drawCue(ctx, P0.x, P0.y, Math.atan2(A.y - P0.y, A.x - P0.x), 46, WOOD);
      } else if (current === 1) {
        const k = clamp(t / 0.9, 0, 1);
        ball = { x: lerp(P0.x, A.x, k), y: lerp(P0.y, A.y, k) };
        ctx.globalAlpha = 1;
        seg(P0, A, EMPH, 3);
        ctx.globalAlpha = 0.25;
        seg(A, B, GUIDE, 2, [7, 6]);
        seg(B, C, GUIDE, 2, [7, 6]);
        ctx.globalAlpha = 1;
        drawCue(ctx, ball.x, ball.y, Math.atan2(A.y - P0.y, A.x - P0.x), 46, WOOD);
      } else if (current === 2) {
        ball = A;
        const ring = (t % 1.2) / 1.2;
        ctx.globalAlpha = 1 - ring;
        ctx.strokeStyle = GUIDE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(A.x, A.y, 10 + ring * 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ball = A;
        const appear = clamp(t / 0.4, 0, 1);
        ctx.globalAlpha = appear;
        seg(A, A2, AUX, 3);
        seg(A2, B2, AUX, 2, [7, 6]);
        seg(B2, C2, AUX, 2, [7, 6]);
        ctx.globalAlpha = 1;
        drawBall(ctx, A2.x, A2.y, 3, AUX, false);
        drawBall(ctx, B2.x, B2.y, 3, AUX, false);
        drawCue(ctx, ball.x, ball.y, Math.atan2(A2.y - ball.y, A2.x - ball.x), 46, WOOD);
      }

      drawBall(ctx, ball.x, ball.y, 8, '#f3f0e4', true);

      // 右侧：3 步时域 + 已执行进度 + 四阶段指示
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(760, 64, 280, 146);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(760.75, 64.75, 278.5, 144.5);

      for (let i = 0; i < 3; i++) {
        let color = GUIDE;
        let alpha = 0.85;
        if (current === 1) {
          color = i === 0 ? EMPH : GUIDE;
          alpha = i === 0 ? 1 : 0.25;
        } else if (current === 2) {
          color = LINE;
          alpha = 1;
        } else if (current === 3) {
          color = AUX;
          alpha = 0.85;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(780, 76 + i * 40, 220, 16);
      }

      ctx.globalAlpha = 1;
      const executed = current === 1 || current === 2 ? 1 : 0;
      drawGauge(ctx, 780, 180, 220, 10, 3, executed, EMPH);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(790, 204);
      ctx.lineTo(955, 204);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i === current ? EMPH : LINE;
        ctx.beginPath();
        ctx.arc(790 + i * 55, 204, i === current ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const labels = STAGE_LABELS[current];
      drawSceneLabel(ctx, labels[0], 46, 42, INK);
      drawSceneLabel(ctx, labels[1], 760, 42, INK);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '计划轨迹' },
          { color: EMPH, text: '已执行' },
          { color: AUX, text: '新计划' },
        ],
        40,
        262
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  const go = (next: number) => {
    const s = ((next % 4) + 4) % 4;
    stageRef.current = { stage: s, t: performance.now() };
    setStage(s);
    setFeedback(FEEDBACK[s]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {STAGE_NAMES.map((name, i) => (
          <button key={name} className={'chip' + (stage === i ? ' selected' : '')} onClick={() => go(i)}>
            {name}
          </button>
        ))}
        <button className="chip" onClick={() => go(stage + 1)}>
          下一步 ▶
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M42;

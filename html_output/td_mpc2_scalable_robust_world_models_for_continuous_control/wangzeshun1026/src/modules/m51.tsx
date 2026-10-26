import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  GUIDE,
  EMPH,
  AUX,
  INK,
  LINE,
  clearScene,
  drawTable,
  drawBall,
  drawShot,
  drawPocket,
  drawSceneLabel,
  drawLegend,
  seeded,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 5.1 换球台，先看牌。
// 四个示意任务切换：任务嵌入变化、动作维度变化，而共享权重保持不变。
const W = 1080;
const H = 280;

interface BallSpec {
  x: number;
  y: number;
  color: string;
}

interface TaskSpec {
  chip: string;
  dims: number;
  balls: BallSpec[];
  feedback: string;
}

interface FeedbackState {
  text: string;
  cls: string;
}

const TASKS: TaskSpec[] = [
  {
    chip: '行走',
    dims: 6,
    balls: [
      { x: 330, y: 118, color: '#8c7a5f' },
      { x: 380, y: 160, color: '#5f6d7c' },
    ],
    feedback:
      'DMControl 行走：任务嵌入换成这张“球台牌”；同一个网络权重不变，只是条件输入 e 变了。',
  },
  {
    chip: '推块',
    dims: 4,
    balls: [
      { x: 290, y: 100, color: '#c2a878' },
      { x: 340, y: 166, color: '#8c7a5f' },
      { x: 390, y: 120, color: '#e9e2cf' },
    ],
    feedback:
      'Meta-World 推块：嵌入换一种模式；不同任务的动作维度由掩码标出，无效维度不参与采样与 TD 目标。',
  },
  {
    chip: '抓取',
    dims: 8,
    balls: [
      { x: 310, y: 146, color: '#5f6d7c' },
      { x: 350, y: 104, color: '#c2a878' },
      { x: 390, y: 166, color: '#8c7a5f' },
    ],
    feedback:
      'ManiSkill2 抓取：还是同一套权重。嵌入告诉网络当前领域、本体与动作空间是哪一种。',
  },
  {
    chip: '手臂',
    dims: 12,
    balls: [
      { x: 280, y: 126, color: '#e9e2cf' },
      { x: 330, y: 92, color: '#5f6d7c' },
      { x: 380, y: 154, color: '#c2a878' },
      { x: 410, y: 112, color: '#8c7a5f' },
    ],
    feedback:
      'MyoSuite 手臂：跨领域、跨本体、跨动作空间共用一套权重；317M 模型在 80 个任务上训练。',
  },
];

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const taskRef = useRef({ task: 0 });
  const [task, setTask] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>({
    text: '点击任务，观察 96 维任务嵌入与动作空间如何变化；右侧共享权重保持不变。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const embeddings: number[][] = [];
    for (let s = 0; s < TASKS.length; s++) {
      const rnd = seeded(3100 + s * 53);
      const raw: number[] = [];
      for (let i = 0; i < 96; i++) raw.push(rnd() * 2 - 1);
      let norm = 0;
      for (const v of raw) norm += v * v;
      norm = Math.sqrt(norm) || 1;
      embeddings.push(raw.map((v) => v / norm));
    }

    const wrnd = seeded(8128);
    const weightAlpha: number[] = [];
    for (let i = 0; i < 32; i++) weightAlpha.push(0.22 + wrnd() * 0.72);

    const render = (now: number) => {
      const index = taskRef.current.task;
      const spec = TASKS[index];
      clearScene(ctx, W, H);

      // 左：当前任务的球台局面
      drawTable(ctx, 40, 64, 400, 140);
      drawPocket(ctx, 424, 134, 8);
      drawBall(ctx, 76, 134, 8, '#f3f0e4', true);
      for (const b of spec.balls) drawBall(ctx, b.x, b.y, 6.5, b.color, false);

      // 中：96 维任务嵌入
      const vals = embeddings[index];
      let maxAbs = 0.0001;
      for (const v of vals) maxAbs = Math.max(maxAbs, Math.abs(v));
      for (let i = 0; i < 96; i++) {
        const col = i % 16;
        const row = Math.floor(i / 16);
        const v = vals[i];
        ctx.globalAlpha = 0.18 + 0.82 * (Math.abs(v) / maxAbs);
        ctx.fillStyle = v >= 0 ? AUX : GUIDE;
        ctx.fillRect(500 + col * 14, 78 + row * 14, 12, 12);
      }

      // 嵌入 → 权重 的条件箭头
      ctx.globalAlpha = 0.75;
      drawShot(ctx, [[728, 120], [762, 120]], GUIDE, 2);
      ctx.fillStyle = GUIDE;
      ctx.beginPath();
      ctx.moveTo(762, 120);
      ctx.lineTo(753, 115);
      ctx.lineTo(753, 125);
      ctx.closePath();
      ctx.fill();

      // 右：同一套权重（图案固定）
      ctx.globalAlpha = 1;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(770.75, 78.75, 248.5, 82.5);
      for (let i = 0; i < 32; i++) {
        const col = i % 8;
        const row = Math.floor(i / 8);
        ctx.globalAlpha = weightAlpha[i];
        ctx.fillStyle = INK;
        ctx.fillRect(790 + col * 26, 88 + row * 18, 15, 15);
      }

      // 动作维度：有效槽位随任务变化
      ctx.globalAlpha = 1;
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i < spec.dims ? EMPH : LINE;
        ctx.globalAlpha = i < spec.dims ? lerp(0.7, 1, 0.5 + 0.5 * Math.sin(now / 260 + i)) : 1;
        ctx.fillRect(770 + i * 19, 190, 14, 22);
      }
      ctx.globalAlpha = 0.6;
      drawShot(ctx, [[770, 214], [998, 214]], LINE, 1.5);

      ctx.globalAlpha = 1;
      drawSceneLabel(ctx, '嵌入 96 维', 500, 44, INK);
      drawSceneLabel(ctx, '同一套权重', 770, 44, INK);
      drawLegend(
        ctx,
        [
          { color: AUX, text: '嵌入' },
          { color: INK, text: '权重' },
          { color: EMPH, text: '动作维度' },
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

  const pick = (next: number) => {
    const s = clamp(next, 0, TASKS.length - 1);
    taskRef.current.task = s;
    setTask(s);
    setFeedback({ text: TASKS[s].feedback, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {TASKS.map((t, i) => (
          <button key={t.chip} className={'chip' + (task === i ? ' selected' : '')} onClick={() => pick(i)}>
            {t.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51;

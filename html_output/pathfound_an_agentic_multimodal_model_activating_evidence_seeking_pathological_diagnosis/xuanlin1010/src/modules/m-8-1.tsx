import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const COLORS = {
  field: '#f5f8f0',
  board: '#b8c9a7',
  deep: '#76906a',
  edge: '#d7deea',
  guide: '#27446e',
  aux: '#7c3aed',
  pick: '#f07e47',
  text: '#21324a',
  muted: '#68778f',
  face: '#ffffff',
};

type Stage = 'slide' | 'highlight' | 'interpret' | 'reason' | 'reloop';

interface StageDef {
  key: Stage;
  label: string;
  spec: string;
  inTag: string;
  outTag: string;
  trainTag: string;
  inNum: number;
  outNum: number;
  trainNum: number;
  text: string;
  cls: string;
}

const STAGES: StageDef[] = [
  {
    key: 'slide',
    label: '切片',
    spec: '',
    inTag: '全切片',
    outTag: '图像块',
    trainTag: '非训练',
    inNum: 100,
    outNum: 92,
    trainNum: 6,
    text: '十亿像素级的全切片图像，普通视觉语言模型直接吃不下。',
    cls: '',
  },
  {
    key: 'highlight',
    label: '高亮器',
    spec: 'UNI-2',
    inTag: '特征库',
    outTag: '区域',
    trainTag: '冻结',
    inNum: 80,
    outNum: 34,
    trainNum: 4,
    text: '用冻结的视觉基础模型（论文用 UNI-2）把切片压成少数几个代表性区域。',
    cls: '',
  },
  {
    key: 'interpret',
    label: '解读者',
    spec: '7B',
    inTag: '区域',
    outTag: '文字观察',
    trainTag: '全参微调',
    inNum: 70,
    outNum: 42,
    trainNum: 76,
    text: 'Qwen2.5-VL-7B 全参微调 3 个 epoch，把区域翻译成文字观察。',
    cls: '',
  },
  {
    key: 'reason',
    label: '推理器',
    spec: '32B',
    inTag: '观察与鉴别',
    outTag: '取证目标',
    trainTag: '强化学习',
    inNum: 64,
    outNum: 30,
    trainNum: 92,
    text: 'Qwen2.5-32B 基座，用可验证奖励的强化学习训练，决定下一步要什么证据。',
    cls: 'aux',
  },
  {
    key: 'reloop',
    label: '再取证',
    spec: '回环',
    inTag: '新目标',
    outTag: '新区域',
    trainTag: '非训练',
    inNum: 26,
    outNum: 74,
    trainNum: 4,
    text: '带着新目标重新触发高亮器——这就是外层循环回到起点的那条线。',
    cls: 'good',
  },
];

const NODE_W = 170;
const NODE_H = 90;
const NODE_Y = 75;
const CENTERS = [130, 340, 550, 760, 970];
const ROW_LABELS = ['输入', '输出', '训练'];

const FEEDBACK: Record<Stage, { text: string; cls: string }> = {
  slide: { text: '十亿像素级的全切片图像，普通视觉语言模型直接吃不下。', cls: '' },
  highlight: { text: '用冻结的视觉基础模型（论文用 UNI-2）把切片压成少数几个代表性区域。', cls: '' },
  interpret: { text: 'Qwen2.5-VL-7B 全参微调 3 个 epoch，把区域翻译成文字观察。', cls: '' },
  reason: { text: 'Qwen2.5-32B 基座，用可验证奖励的强化学习训练，决定下一步要什么证据。', cls: 'aux' },
  reloop: { text: '带着新目标重新触发高亮器——这就是外层循环回到起点的那条线。', cls: 'good' },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.field;
  ctx.fillRect(0, 0, W, H);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted?: boolean
): void {
  ctx.fillStyle = muted ? COLORS.muted : COLORS.text;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: string[], x: number, y: number): void {
  const shown = items.slice(0, 3);
  let cx = x;
  shown.forEach((item, i) => {
    const color = i === 0 ? COLORS.pick : i === 1 ? COLORS.deep : COLORS.aux;
    if (i === 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, y - 6);
      ctx.lineTo(cx + 18, y - 6);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx + 8, y - 6, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSceneLabel(ctx, item, cx + 24, y, true);
    cx += 24 + item.length * 18 + 24;
  });
}

function drawChainArrow(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number): void {
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 8, y);
  ctx.stroke();
  ctx.fillStyle = COLORS.edge;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 12, y - 7);
  ctx.lineTo(x2 - 12, y + 7);
  ctx.closePath();
  ctx.fill();
}

function drawLoopArrow(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.aux;
  ctx.lineWidth = width;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(430, NODE_Y);
  ctx.quadraticCurveTo(250, 16, 90, NODE_Y - 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.aux;
  ctx.beginPath();
  ctx.moveTo(84, NODE_Y + 4);
  ctx.lineTo(102, NODE_Y - 12);
  ctx.lineTo(104, NODE_Y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const stateRef = useRef<Stage | null>(null);
  const [feedback, setFeedback] = useState({
    text: '点击左边的环节，或使用下面的按钮，看这个环节读什么、写什么。',
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

    const render = (sel: Stage | null, time: number) => {
      clearScene(ctx);
      drawBoard(ctx, 16, 30, W - 32, 222, 0.35);

      const cy = NODE_Y + NODE_H / 2;
      for (let i = 0; i < 4; i++) {
        drawChainArrow(ctx, CENTERS[i] + NODE_W / 2 + 2, CENTERS[i + 1] - NODE_W / 2 - 2, cy);
      }

      drawLoopArrow(ctx, sel === 'reloop' ? 4 : 2);

      STAGES.forEach((s, i) => {
        const cx = CENTERS[i];
        const x = cx - NODE_W / 2;
        const active = sel === s.key;
        ctx.fillStyle = active ? '#fff4ec' : COLORS.face;
        roundRect(ctx, x, NODE_Y, NODE_W, NODE_H, 12);
        ctx.fill();
        ctx.strokeStyle = active ? COLORS.pick : COLORS.edge;
        ctx.lineWidth = active ? 3 : 2;
        roundRect(ctx, x, NODE_Y, NODE_W, NODE_H, 12);
        ctx.stroke();

        if (s.spec.length > 0) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = COLORS.deep;
          roundRect(ctx, x + 10, NODE_Y + 8, 54, 22, 6);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = COLORS.text;
        ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.label, cx, cy - 8);

        if (s.spec.length > 0) {
          ctx.fillStyle = COLORS.muted;
          ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.spec, x + 37, NODE_Y + 21);
        }

        if (active) {
          const pulse = 3 + Math.sin(time / 260) * 1.6;
          ctx.save();
          ctx.globalAlpha = 0.34 + 0.22 * (0.5 + 0.5 * Math.sin(time / 260));
          ctx.strokeStyle = COLORS.pick;
          ctx.lineWidth = pulse;
          roundRect(ctx, x - 6, NODE_Y - 6, NODE_W + 12, NODE_H + 12, 15);
          ctx.stroke();
          ctx.restore();
        }
      });

      ctx.strokeStyle = COLORS.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(700, 196);
      ctx.lineTo(700, 246);
      ctx.stroke();

      if (sel) {
        const s = STAGES.find((it) => it.key === sel);
        if (s) {
          const nums = [s.inNum, s.outNum, s.trainNum];
          const tags = [s.inTag, s.outTag, s.trainTag];
          for (let r = 0; r < 3; r++) {
            const ry = 200 + r * 22;
            drawSceneLabel(ctx, ROW_LABELS[r], 716, ry);
            ctx.fillStyle = r === 2 && s.trainNum > 50 ? COLORS.pick : COLORS.edge;
            roundRect(ctx, 796, ry - 12, nums[r] * 1.6, 12, 5);
            ctx.fill();
            ctx.fillStyle = COLORS.muted;
            ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(tags[r], 968, ry);
          }
        }
      } else {
        drawSceneLabel(ctx, '未选中', 716, 214, true);
        drawSceneLabel(ctx, '点一个环节', 716, 240, true);
      }

      drawSceneLabel(ctx, '证据链', 30, 254);
      drawLegend(ctx, ['选中', '链上流向', '回环'], 142, 254);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current, Date.now());
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

  const select = (s: Stage) => {
    stateRef.current = s;
    setStage(s);
    setFeedback(FEEDBACK[s]);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (let i = 0; i < STAGES.length; i++) {
      const left = CENTERS[i] - NODE_W / 2;
      if (x >= left && x <= left + NODE_W && y >= NODE_Y && y <= NODE_Y + NODE_H) {
        select(STAGES[i].key);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {STAGES.map((s) => (
          <button
            key={s.key}
            className={`chip ${stage === s.key ? 'selected' : ''}`}
            onClick={() => select(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div>输入</div>
          <div>{stage ? STAGES.find((s) => s.key === stage)?.inTag : '—'}</div>
        </div>
        <div className="metric">
          <div>输出</div>
          <div>{stage ? STAGES.find((s) => s.key === stage)?.outTag : '—'}</div>
        </div>
        <div className="metric">
          <div>训练</div>
          <div>{stage ? STAGES.find((s) => s.key === stage)?.trainTag : '—'}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M81;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawAimLine,
  drawSceneLabel,
  AUX,
  BORDER,
  EMPHASIS,
  FELT_DARK,
  GUIDE,
  SUCCESS,
  TEXT,
  TEXT_MUTED,
} from './billiardsKit';

// 模块 8.1：三件家伙的接线图。
// 主导操作只有一个：点四个节点里的一个（Canvas 热区与 DOM 按钮一一对应），
// 再切换「推理模式」开关看世界专家退场。

const W = 1080;
const H = 280;

type NodeId = 'backbone' | 'meta' | 'world' | 'action';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// A 输入列（x 40–200：观测 / 历史 / 指令 / 记忆），只用语义描边区分
const INPUTS: { box: Box; stroke: string }[] = [
  { box: { x: 40, y: 60, w: 160, h: 34 }, stroke: BORDER },
  { box: { x: 40, y: 104, w: 160, h: 34 }, stroke: FELT_DARK },
  { box: { x: 40, y: 148, w: 160, h: 34 }, stroke: GUIDE },
  { box: { x: 40, y: 192, w: 160, h: 34 }, stroke: AUX },
];

const BACKBONE: Box = { x: 250, y: 70, w: 370, h: 130 };
const META_BOX: Box = { x: 266, y: 168, w: 338, h: 36 };
const WORLD: Box = { x: 700, y: 60, w: 180, h: 70 };
const ACTION: Box = { x: 700, y: 170, w: 180, h: 70 };
const OUTPUT: Box = { x: 930, y: 180, w: 110, h: 56 };

const DOT_Y = 186;
const DOT_XS = [285, 345, 405, 465, 525, 585];
const DOT_R = 6;

const HIT_ORDER: { id: NodeId; box: Box }[] = [
  { id: 'meta', box: META_BOX },
  { id: 'backbone', box: BACKBONE },
  { id: 'world', box: WORLD },
  { id: 'action', box: ACTION },
];

interface Feedback {
  text: string;
  cls: string;
  color?: string;
}

const FEEDBACKS: Record<NodeId, Feedback> = {
  backbone: {
    text: '主干 RynnBrain-2B（2.1B）：自回归视觉-语言模型，负责语言与子任务，也是 64 枚元查询的容身处。',
    cls: '',
  },
  meta: {
    text: '64 枚元查询：在这里把上下文压成 h_t；三个专家各自 28 层。',
    cls: '',
  },
  world: {
    text: '世界专家 SANA-600M（含 VAE 共 900M）：只预测目标帧的 VAE 特征；推理时可整块丢弃。',
    cls: '',
    color: AUX,
  },
  action: {
    text: '动作专家 flow-matching 头（390M）：用 h_t 与 q_t 生成动作块。',
    cls: '',
  },
};

const FEEDBACK_START: Feedback = { text: '点一个部件，看它管什么。', cls: '' };
const FEEDBACK_INFERENCE: Feedback = {
  text: '推理模式：世界专家退场，整机约 2B 激活参数（三件合计 3.4B）。',
  cls: 'good',
};
const FEEDBACK_TRAIN: Feedback = { text: '高效推理模式关闭：世界专家重新在线，动作专家照常接收 h_t。', cls: '' };

const NODE_BUTTONS: { id: NodeId; label: string }[] = [
  { id: 'backbone', label: '主干' },
  { id: 'meta', label: '元查询' },
  { id: 'world', label: '世界专家' },
  { id: 'action', label: '动作专家' },
];

/** 选中节点用橙色双描边标出。 */
function drawSelection(ctx: CanvasRenderingContext2D, box: Box): void {
  ctx.save();
  ctx.strokeStyle = EMPHASIS;
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x - 5, box.y - 5, box.w + 10, box.h + 10);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(box.x - 11, box.y - 11, box.w + 22, box.h + 22);
  ctx.restore();
}

function drawRect(ctx: CanvasRenderingContext2D, box: Box, stroke: string, dashed: boolean, weight: number): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = weight;
  if (dashed) ctx.setLineDash([7, 6]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

export const Wla81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ node: 'backbone' as NodeId, inferenceMode: true });
  const rafRef = useRef<number | null>(null);
  const [node, setNode] = useState<NodeId>('backbone');
  const [inferenceMode, setInferenceMode] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(FEEDBACK_START);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { node: NodeId; inferenceMode: boolean }) => {
      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [] });

      // A 输入列
      INPUTS.forEach((input) => {
        drawRect(ctx, input.box, input.stroke, false, 2);
      });

      // B 主干
      drawRect(ctx, BACKBONE, GUIDE, false, s.node === 'backbone' ? 3 : 2);

      // 下沿 6 枚元查询圆点（64 枚元查询的示意）
      ctx.save();
      ctx.fillStyle = GUIDE;
      DOT_XS.forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, DOT_Y, DOT_R, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // h_t 出边
      const retired = s.inferenceMode;
      drawAimLine(ctx, 620, 130, WORLD.x, 95, {
        color: retired ? TEXT_MUTED : GUIDE,
        dashed: retired,
        width: 1.5,
      });
      drawAimLine(ctx, 620, 170, ACTION.x, 205, { color: GUIDE, width: 1.5 });

      // C 世界专家：推理模式下退场（灰虚线）
      drawRect(ctx, WORLD, retired ? TEXT_MUTED : AUX, retired, s.node === 'world' ? 3 : 2.5);
      // D 动作专家
      drawRect(ctx, ACTION, GUIDE, false, s.node === 'action' ? 3 : 2.5);

      // 动作块输出
      drawAimLine(ctx, 880, 205, OUTPUT.x, 205, { color: GUIDE, width: 1.5 });
      drawRect(ctx, OUTPUT, SUCCESS, false, 2);
      ctx.save();
      ctx.fillStyle = SUCCESS;
      for (let i = 0; i < 6; i += 1) {
        ctx.fillRect(946 + i * 14, 194, 8, 28);
      }
      ctx.restore();

      // 退场时主干右下角写裸数字：约 2B 激活参数
      if (retired) {
        drawSceneLabel(ctx, '2.0', 612, 216, { align: 'right', color: TEXT, size: 15 });
      }

      // 选中节点的橙色双描边
      const selected = HIT_ORDER.find((entry) => entry.id === s.node);
      if (selected) drawSelection(ctx, selected.box);

      drawSceneLabel(ctx, '主干', 435, 96, { align: 'center', color: TEXT });
      drawSceneLabel(ctx, '专家', 790, 148, { align: 'center', color: TEXT_MUTED });
    };

    const tick = () => {
      render(stateRef.current);
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

  const selectNode = (next: NodeId) => {
    stateRef.current.node = next;
    setNode(next);
    setFeedback(FEEDBACKS[next]);
  };

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // CSS 像素 → 逻辑绘制坐标（HiDPI 缩放由 setupCanvas 处理）
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const hit = HIT_ORDER.find(
      (entry) =>
        x >= entry.box.x - 5 &&
        x <= entry.box.x + entry.box.w + 5 &&
        y >= entry.box.y - 5 &&
        y <= entry.box.y + entry.box.h + 5,
    );
    if (hit) selectNode(hit.id);
  };

  const onToggleInference = () => {
    const next = !inferenceMode;
    stateRef.current.inferenceMode = next;
    setInferenceMode(next);
    setFeedback(next ? FEEDBACK_INFERENCE : FEEDBACK_TRAIN);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onCanvasPointerDown}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        {NODE_BUTTONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`tiny ${node === entry.id ? '' : 'ghost'}`}
            aria-pressed={node === entry.id}
            onClick={() => selectNode(entry.id)}
            style={{ minHeight: 44 }}
          >
            {entry.label}
          </button>
        ))}
        <button
          type="button"
          className={`tiny ${inferenceMode ? '' : 'ghost'}`}
          aria-pressed={inferenceMode}
          onClick={onToggleInference}
          style={{ minHeight: 44 }}
        >
          高效推理模式：{inferenceMode ? '开（世界专家退场）' : '关（世界专家在线）'}
        </button>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        style={feedback.color ? { color: feedback.color, borderLeftColor: feedback.color } : undefined}
      >
        {feedback.text}
      </div>
    </div>
  );
};

export default Wla81;

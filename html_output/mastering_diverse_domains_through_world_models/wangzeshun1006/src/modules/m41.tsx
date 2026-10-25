import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  clearCrag,
  drawSceneLabel,
  BAD,
  GUIDE,
  OK,
  INK,
  LINE,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// m41 — 三条损失，各训练谁。点击损失块（或 DOM chip）高亮它把梯度送给哪些部件；
// 再点一次取消。权重用裸数字显示，文字说明放在 DOM 反馈里。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type LossKey = 'pred' | 'dyn' | 'rep';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODES: Record<string, Rect & { label: string }> = {
  enc: { x: 330, y: 50, w: 112, h: 40, label: '编码器' },
  seq: { x: 470, y: 50, w: 112, h: 40, label: '序列模型' },
  dynp: { x: 610, y: 50, w: 112, h: 40, label: '动态预测器' },
  state: { x: 452, y: 122, w: 188, h: 46, label: '{h_t,z_t}' },
  dec: { x: 330, y: 204, w: 112, h: 40, label: '解码器' },
  rew: { x: 470, y: 204, w: 112, h: 40, label: '奖励头' },
  cont: { x: 610, y: 204, w: 112, h: 40, label: '继续头' },
};

const LOSSES: Array<Rect & { key: LossKey; label: string; beta: string }> = [
  { key: 'pred', x: 44, y: 48, w: 200, h: 52, label: '预测损失', beta: '1' },
  { key: 'dyn', x: 44, y: 114, w: 200, h: 52, label: '动力学损失', beta: '1' },
  { key: 'rep', x: 44, y: 180, w: 200, h: 52, label: '表征损失', beta: '0.1' },
];

const EDGES: Array<[string, string]> = [
  ['enc', 'state'],
  ['seq', 'state'],
  ['dynp', 'state'],
  ['state', 'dec'],
  ['state', 'rew'],
  ['state', 'cont'],
  ['enc', 'dec'],
];

const HIGHLIGHT: Record<LossKey, { nodes: string[]; q?: boolean; p?: boolean; recon?: boolean }> = {
  pred: { nodes: ['enc', 'state', 'dec', 'rew', 'cont'], recon: true },
  dyn: { nodes: ['seq', 'dynp', 'state'], q: true },
  rep: { nodes: ['enc', 'state'], p: true },
};

const DETAIL: Record<string, string[]> = {
  none: ['世界模型', '可选三条损失'],
  pred: ['L_pred', 'β_pred = 1', '重建·奖励·继续'],
  dyn: ['L_dyn', 'β_dyn = 1', 'sg(q_ϕ)'],
  rep: ['L_rep', 'β_rep = 0.1', 'sg(p_ϕ)'],
};

const FEEDBACK: Record<string, { text: string; cls: string }> = {
  none: { text: '不选择时只看结构；三条损失的梯度方向各有分工。', cls: '' },
  pred: { text: '重建图像、预测奖励与是否继续：把看得见的结果练准，权重 1。', cls: '' },
  dyn: { text: '让序列模型预测下一步隐码；q 侧停止梯度，权重 1。', cls: '' },
  rep: { text: '让编码器输出的隐码更容易被预测；p 侧停止梯度，权重 0.1。', cls: '' },
};

const CHIPS: Array<{ key: LossKey; label: string }> = [
  { key: 'pred', label: '预测损失' },
  { key: 'dyn', label: '动力学损失' },
  { key: 'rep', label: '表征损失' },
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function center(b: Rect): number[] {
  return [b.x + b.w / 2, b.y + b.h / 2];
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  b: Rect,
  label: string,
  active: boolean
): void {
  ctx.fillStyle = active ? GUIDE : '#ffffff';
  ctx.strokeStyle = active ? GUIDE : LINE;
  ctx.lineWidth = active ? 2.5 : 1.5;
  roundRect(ctx, b.x, b.y, b.w, b.h, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = active ? '#ffffff' : INK;
  ctx.font = `15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
}

function drawSg(ctx: CanvasRenderingContext2D, x: number, y: number, side: string): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = BAD;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, 52, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BAD;
  ctx.font = `12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`sg(${side})`, x + 26, y + 12);
}

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef<LossKey | null>(null);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<LossKey | null>(null);
  const [feedback, setFeedback] = useState(FEEDBACK.none);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const cur = selRef.current;
      const hl = cur ? HIGHLIGHT[cur] : null;
      const hot = new Set(hl ? hl.nodes : []);
      clearCrag(ctx, W, H);

      // 结构连线
      for (const [a, b] of EDGES) {
        const na = NODES[a];
        const nb = NODES[b];
        const [ax, ay] = center(na);
        const [bx, by] = center(nb);
        const active = hot.has(a) && hot.has(b);
        drawEdge(ctx, ax, ay, bx, by, active ? GUIDE : LINE, active ? 3 : 1.5);
      }

      // 结构部件
      for (const key of Object.keys(NODES)) {
        drawNode(ctx, NODES[key], NODES[key].label, hot.has(key));
      }

      // 三条损失方块 + 权重
      for (const l of LOSSES) {
        const active = cur === l.key;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = active ? BAD : LINE;
        ctx.lineWidth = active ? 3 : 1.5;
        roundRect(ctx, l.x, l.y, l.w, l.h, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? BAD : INK;
        ctx.font = `16px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.label, l.x + 16, l.y + l.h / 2);
        ctx.fillStyle = OK;
        ctx.font = `bold 16px ${FONT}`;
        ctx.textAlign = 'right';
        ctx.fillText(l.beta, l.x + l.w - 16, l.y + l.h / 2);
      }

      // 停止梯度标记
      if (hl && hl.q) drawSg(ctx, 430, 96, 'q');
      if (hl && hl.p) drawSg(ctx, 558, 96, 'p');

      // 预测损失的重建目标
      if (hl && hl.recon) {
        ctx.fillStyle = OK;
        ctx.beginPath();
        ctx.arc(NODES.dec.x + NODES.dec.w / 2, 250, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 右侧详情区（技术标记，非散文）
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 800, 44, 240, 192, 10);
      ctx.fill();
      ctx.stroke();
      const tokens = DETAIL[cur || 'none'];
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = cur ? BAD : MUTED;
      ctx.font = `bold 20px ${FONT}`;
      ctx.fillText(tokens[0], 824, 96);
      ctx.fillStyle = INK;
      ctx.font = `16px ${FONT}`;
      ctx.fillText(tokens[1], 824, 148);
      if (tokens[2]) {
        ctx.fillStyle = MUTED;
        ctx.font = `15px ${FONT}`;
        ctx.fillText(tokens[2], 824, 186);
      }

      drawSceneLabel(ctx, '梯度去向', 330, 28, MUTED);
    };

    const tick = (): void => {
      render();
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

  const pick = (key: LossKey | null): void => {
    const next = selRef.current === key ? null : key;
    selRef.current = next;
    setSel(next);
    setFeedback(FEEDBACK[next || 'none']);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    for (const l of LOSSES) {
      if (px >= l.x && px <= l.x + l.w && py >= l.y && py <= l.y + l.h) {
        pick(l.key);
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
        {CHIPS.map((c) => (
          <button
            key={c.key}
            className={'chip' + (sel === c.key ? ' selected on' : '')}
            onClick={() => pick(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41;

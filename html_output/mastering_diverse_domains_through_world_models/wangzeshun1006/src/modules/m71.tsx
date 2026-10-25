import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearCrag, drawSceneLabel, GUIDE, EMPH, INK, MUTED, LINE } from './climbkit';
import type { WidgetProps } from './registry';

// m71 — 交互式回路图：数据在哪儿流动。
// 环形布局：环境 → 重放缓冲 → 世界模型 → 想象轨迹 → 演员 → 评论家 → 回到环境。
// 点击部件看高亮与形状详情；「播放回路」沿箭头走一圈。13 个静态标签之外，画布只放裸形状值。

const W = 1080;
const H = 280;
const BOXW = 152;
const BOXH = 48;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type NodeId = 'env' | 'buffer' | 'model' | 'imagine' | 'actor' | 'critic';

interface NodeDef {
  id: NodeId;
  label: string;
  x: number;
  y: number;
}

const NODES: NodeDef[] = [
  { id: 'env', label: '环境', x: 158, y: 74 },
  { id: 'buffer', label: '重放缓冲', x: 405, y: 62 },
  { id: 'model', label: '世界模型', x: 652, y: 74 },
  { id: 'imagine', label: '想象轨迹', x: 700, y: 208 },
  { id: 'actor', label: '演员', x: 430, y: 216 },
  { id: 'critic', label: '评论家', x: 168, y: 208 },
];

const ARROWS: number[][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
];

const SHAPES = ['图像 64×64×3', '批 16×64', 'h 8192=8×1024', 'z 每码 64 类'];
const SHAPE_HL: Record<NodeId, number[]> = {
  env: [0],
  buffer: [1],
  model: [0, 1, 2, 3],
  imagine: [1],
  actor: [3],
  critic: [2],
};

const FB: Record<NodeId, string> = {
  env: '输入：来自 64 个并行环境（Minecraft 设置）；输出：观测、奖励、继续标志——唯一的新数据来源。',
  buffer: '输入：在线经历与采集时的隐状态；输出：训练批次；均匀回放 + 在线队列，采后还会把新隐状态写回。',
  model: '输入：图像 64×64×3 或向量观测；输出：隐码与预测；批 16×64，隐状态 h 在 200M 档为 8192 单元（8 个分块）。',
  imagine: '由世界模型在隐空间生成；演员与评论家都在这条轨迹上更新——不占环境步数。',
  actor: '输入：模型状态；输出：动作分布；交互时直接采样，无前向搜索。',
  critic: '输入：模型状态；输出：回报分布（指数分桶）；EMA 正则与零初始化输出层稳住训练。',
};
const PLAY_TEXT = '数据沿环路走一圈：交互 → 存入 → 建模 → 想象 → 再交互。';
const IDLE_TEXT = '点击回路里的任意部件，看它的输入、输出与在训练中的角色；点击「播放回路」沿箭头走一遍数据流。';

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

const edgePad = (ux: number, uy: number): number =>
  Math.min(
    Math.abs(ux) > 1e-3 ? BOXW / 2 / Math.abs(ux) : Infinity,
    Math.abs(uy) > 1e-3 ? BOXH / 2 / Math.abs(uy) : Infinity
  );

function drawArrow(
  ctx: CanvasRenderingContext2D,
  a: NodeDef,
  b: NodeDef,
  color: string,
  width: number
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const pa = edgePad(ux, uy) + 3;
  const x1 = a.x + ux * pa;
  const y1 = a.y + uy * pa;
  const x2 = b.x - ux * (pa + 6);
  const y2 = b.y - uy * (pa + 6);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(uy, ux);
  const hx = b.x - ux * pa;
  const hy = b.y - uy * pa;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx - Math.cos(ang - 0.42) * 12, hy - Math.sin(ang - 0.42) * 12);
  ctx.lineTo(hx - Math.cos(ang + 0.42) * 12, hy - Math.sin(ang + 0.42) * 12);
  ctx.closePath();
  ctx.fill();
}

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{
    node: NodeId | null;
    playing: boolean;
    playStart: number;
    playIdx: number;
    lastIdx: number;
    prevNode: NodeId | null;
  }>({ node: null, playing: false, playStart: 0, playIdx: -1, lastIdx: -2, prevNode: null });
  const [node, setNode] = useState<NodeId | null>(null);
  const [playing, setPlaying] = useState(false);
  const [fb, setFb] = useState<{ text: string; cls: string }>({ text: IDLE_TEXT, cls: '' });

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
      const s = stateRef.current;
      if (s.playing) {
        const idx = Math.floor((now - s.playStart) / 500);
        if (idx > 5) {
          s.playing = false;
          s.playIdx = -1;
          s.node = s.prevNode;
          setPlaying(false);
          setNode(s.prevNode);
          setFb(s.prevNode ? { text: FB[s.prevNode], cls: '' } : { text: IDLE_TEXT, cls: '' });
        } else if (idx !== s.lastIdx) {
          s.lastIdx = idx;
          s.playIdx = idx;
        }
      }

      clearCrag(ctx, W, H);
      const selIdx = s.node ? NODES.findIndex((n) => n.id === s.node) : -1;

      // 有向箭头
      for (let i = 0; i < ARROWS.length; i++) {
        const [a, b] = ARROWS[i];
        const active = s.playing
          ? i < s.playIdx
          : selIdx >= 0 && (a === selIdx || b === selIdx);
        drawArrow(ctx, NODES[a], NODES[b], active ? GUIDE : LINE, active ? 3.5 : 2);
      }

      // 节点框
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const hi = s.playing ? i <= s.playIdx : NODES[i].id === s.node;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, n.x - BOXW / 2, n.y - BOXH / 2, BOXW, BOXH, 10);
        ctx.fill();
        ctx.strokeStyle = hi ? (s.playing ? GUIDE : EMPH) : MUTED;
        ctx.lineWidth = hi ? 3.5 : 1.8;
        ctx.stroke();
        if (hi) {
          ctx.globalAlpha = 0.16;
          ctx.fillStyle = s.playing ? GUIDE : EMPH;
          roundRect(ctx, n.x - BOXW / 2, n.y - BOXH / 2, BOXW, BOXH, 10);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = hi ? INK : MUTED;
        ctx.font = '17px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x, n.y + 1);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // 固定详情区：形状
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 856, 40, 188, 206, 10);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      drawSceneLabel(ctx, '形状', 872, 68, INK);
      const hl = new Set<number>();
      if (s.playing) {
        const pn = NODES[clampIdx(s.playIdx)];
        for (const r of SHAPE_HL[pn.id]) hl.add(r);
      } else if (s.node) {
        for (const r of SHAPE_HL[s.node]) hl.add(r);
      }
      for (let i = 0; i < SHAPES.length; i++) {
        const y = 104 + i * 34;
        const on = hl.has(i);
        ctx.fillStyle = on ? EMPH : LINE;
        roundRect(ctx, 872, y - 11, 12, 12, 3);
        ctx.fill();
        ctx.fillStyle = on ? INK : MUTED;
        ctx.font = '15px ' + FONT;
        ctx.fillText(SHAPES[i], 892, y);
      }
    };

    const clampIdx = (i: number): number => Math.max(0, Math.min(NODES.length - 1, i));

    const tick = (now: number): void => {
      render(now);
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

  const select = (id: NodeId): void => {
    const s = stateRef.current;
    s.node = id;
    s.playing = false;
    s.playIdx = -1;
    s.lastIdx = -2;
    setNode(id);
    setPlaying(false);
    setFb({ text: FB[id], cls: '' });
  };

  const onPlay = (): void => {
    const s = stateRef.current;
    s.prevNode = s.node;
    s.playing = true;
    s.playStart = performance.now();
    s.playIdx = 0;
    s.lastIdx = -1;
    setPlaying(true);
    setFb({ text: PLAY_TEXT, cls: 'good' });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (const n of NODES) {
      if (Math.abs(x - n.x) <= BOXW / 2 && Math.abs(y - n.y) <= BOXH / 2) {
        select(n.id);
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
        {NODES.map((n) => (
          <button
            key={n.id}
            className={'chip' + (node === n.id ? ' selected' : '')}
            onClick={() => select(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className={'chip' + (playing ? ' selected' : '')} onClick={onPlay}>
          播放回路
        </button>
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default M71;

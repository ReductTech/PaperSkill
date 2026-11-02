import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawSceneLabel,
  drawLegend,
  INK,
  MUTED,
  GUIDE,
  AUX,
  EMPH,
  LINE,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 模块 4.1（P5）：可点击架构图。上排 RT-1-X：输入 → FiLM 条件化 EfficientNet →
// Transformer → 8×256 动作。下排 RT-2-X：输入 → VLM 骨干 → 动作即语言 token →
// 8×256 动作。所有节点均可点击，详情固定显示在画布下方。

const W = 1080;
const H = 280;

type Model = 'rt1' | 'rt2';

interface ArchNode {
  id: string;
  model: Model;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string;
  chip: string;
  title: string;
  desc: string;
}

const TOP = 34;
const BOTTOM = 172;
const NH = 56;

const NODES: ArchNode[] = [
  {
    id: 'rt1-in',
    model: 'rt1',
    x: 24,
    y: TOP,
    w: 168,
    h: NH,
    icon: 'io',
    chip: 'RT-1-X · 输入',
    title: '图像 + 文本指令',
    desc: '当前图像与一句自然语言指令一起进入网络；可选的图像历史会显著影响泛化表现。',
  },
  {
    id: 'rt1-vision',
    model: 'rt1',
    x: 230,
    y: TOP,
    w: 238,
    h: NH,
    icon: 'film',
    chip: 'RT-1-X · 视觉骨干',
    title: 'FiLM 条件化的 EfficientNet',
    desc: '指令通过 FiLM 调制视觉特征的通道，让同一张图在“拿苹果”和“放盘子”下读出不同重点。',
  },
  {
    id: 'rt1-trans',
    model: 'rt1',
    x: 506,
    y: TOP,
    w: 210,
    h: NH,
    icon: 'trans',
    chip: 'RT-1-X · Transformer',
    title: 'Transformer 序列模型',
    desc: '把视觉 token 与指令 token 放进同一序列建模，逐步输出离散的动作 token。',
  },
  {
    id: 'rt1-act',
    model: 'rt1',
    x: 754,
    y: TOP,
    w: 188,
    h: NH,
    icon: 'bins',
    chip: 'RT-1-X · 动作输出',
    title: '8 维 × 256 bins',
    desc: '7 维末端运动加 1 维终止，每维 256 个 bin，用分类的方式逐维预测。',
  },
  {
    id: 'rt2-in',
    model: 'rt2',
    x: 24,
    y: BOTTOM,
    w: 168,
    h: NH,
    icon: 'io',
    chip: 'RT-2-X · 输入',
    title: '图像 + 文本指令',
    desc: '输入形式与 RT-1-X 相同：当前图像加一句自然语言指令，不依赖额外的本体标识。',
  },
  {
    id: 'rt2-vlm',
    model: 'rt2',
    x: 230,
    y: BOTTOM,
    w: 238,
    h: NH,
    icon: 'vlm',
    chip: 'RT-2-X · VLM 骨干',
    title: '视觉语言模型骨干（5B / 55B）',
    desc: '先在大规模图文数据上预训练，把网络世界知识带进机器人控制；论文有 5B 与 55B 两版。',
  },
  {
    id: 'rt2-token',
    model: 'rt2',
    x: 506,
    y: BOTTOM,
    w: 210,
    h: NH,
    icon: 'token',
    chip: 'RT-2-X · 动作 token',
    title: '动作当成另一种语言',
    desc: '把离散动作写成文本 token，与视觉语言数据共同训练，动作和语言落在同一个词表空间。',
  },
  {
    id: 'rt2-act',
    model: 'rt2',
    x: 754,
    y: BOTTOM,
    w: 188,
    h: NH,
    icon: 'bins',
    chip: 'RT-2-X · 动作输出',
    title: '8 维 × 256 bins',
    desc: '输出接口与 RT-1-X 完全一致，所以两条路线能在同一套 3600 次评估里直接比较。',
  },
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

function iconCamera(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 17, y - 11, 34, 22, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(x - 8, y - 14, 11, 3);
}

function iconBubble(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 17, y - 11, 34, 19, 5);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 8);
  ctx.lineTo(x + 2, y + 8);
  ctx.lineTo(x - 3, y + 15);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 11, y - 6, 15, 2);
  ctx.fillRect(x - 11, y - 1, 10, 2);
}

function iconGrid(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.globalAlpha = 0.28 + 0.16 * ((r + c) % 3);
      ctx.fillStyle = color;
      ctx.fillRect(x - 34 + c * 18, y - 17 + r * 12, 13, 9);
    }
  }
  ctx.globalAlpha = 1;
}

function iconFilm(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  iconGrid(ctx, x + 44, y, color);
  // 指令调制：两条短横线 + 箭头，指向特征图。
  ctx.fillStyle = EMPH;
  ctx.fillRect(x - 62, y - 10, 26, 4);
  ctx.fillRect(x - 62, y + 2, 18, 4);
  ctx.strokeStyle = EMPH;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 30, y);
  ctx.lineTo(x - 4, y);
  ctx.stroke();
  ctx.fillStyle = EMPH;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x - 11, y - 5);
  ctx.lineTo(x - 11, y + 5);
  ctx.closePath();
  ctx.fill();
}

function iconTransformer(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.55 + i * 0.18;
    roundRect(ctx, x - 48 + i * 36, y - 18, 24, 36, 5);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 20 + i * 36, y);
    ctx.lineTo(x - 12 + i * 36, y);
    ctx.stroke();
  }
}

function iconBins(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  const hs = [8, 14, 10, 20, 12, 23, 16, 21];
  for (let i = 0; i < hs.length; i++) {
    ctx.fillStyle = i === hs.length - 1 ? EMPH : color;
    ctx.fillRect(x - 44 + i * 12, y + 16 - hs[i], 8, hs[i]);
  }
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 48, y + 17);
  ctx.lineTo(x + 50, y + 17);
  ctx.stroke();
}

function iconVlm(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.35 + i * 0.22;
    ctx.fillStyle = color;
    roundRect(ctx, x - 58 + i * 6, y - 16 + i * 9, 58, 14, 4);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 34, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + 34, y, 8, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 17, y);
  ctx.lineTo(x + 51, y);
  ctx.stroke();
}

function iconToken(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.45 + i * 0.12;
    roundRect(ctx, x - 56 + i * 18, y - 8, 14, 16, 3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = EMPH;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + 36, y);
  ctx.stroke();
  ctx.fillStyle = EMPH;
  ctx.beginPath();
  ctx.moveTo(x + 36, y);
  ctx.lineTo(x + 29, y - 5);
  ctx.lineTo(x + 29, y + 5);
  ctx.closePath();
  ctx.fill();
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  color: string
): void {
  if (kind === 'io') {
    iconCamera(ctx, x - 26, y, color);
    iconBubble(ctx, x + 30, y, color);
  } else if (kind === 'film') {
    iconFilm(ctx, x, y, color);
  } else if (kind === 'trans') {
    iconTransformer(ctx, x, y, color);
  } else if (kind === 'bins') {
    iconBins(ctx, x, y, color);
  } else if (kind === 'vlm') {
    iconVlm(ctx, x, y, color);
  } else if (kind === 'token') {
    iconToken(ctx, x, y, color);
  }
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 8, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 10, y - 6);
  ctx.lineTo(x2 - 10, y + 6);
  ctx.closePath();
  ctx.fill();
}

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef('rt1-vision');
  const [selectedId, setSelectedId] = useState('rt1-vision');

  const choose = (id: string) => {
    selectedRef.current = id;
    setSelectedId(id);
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

    let raf: number | null = null;

    const render = () => {
      clearScene(ctx, W, H);

      drawSceneLabel(ctx, 'RT-1-X', 24, 24, GUIDE);
      drawSceneLabel(ctx, 'RT-2-X', 24, 162, AUX);

      // 当前选中节点所在的路线：在车道下方画一条高亮基线。
      const activeNode = NODES.find((n) => n.id === selectedRef.current);
      const activeModel: Model = activeNode ? activeNode.model : 'rt1';
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const pathY = activeModel === 'rt1' ? TOP + NH + 8 : BOTTOM + NH + 8;
      ctx.moveTo(24, pathY);
      ctx.lineTo(942, pathY);
      ctx.stroke();

      // 连接箭头。
      arrow(ctx, 192, 230, TOP + NH / 2, GUIDE);
      arrow(ctx, 468, 506, TOP + NH / 2, GUIDE);
      arrow(ctx, 716, 754, TOP + NH / 2, GUIDE);
      arrow(ctx, 192, 230, BOTTOM + NH / 2, AUX);
      arrow(ctx, 468, 506, BOTTOM + NH / 2, AUX);
      arrow(ctx, 716, 754, BOTTOM + NH / 2, AUX);

      for (const n of NODES) {
        const color = n.model === 'rt1' ? GUIDE : AUX;
        const active = selectedRef.current === n.id;

        ctx.globalAlpha = active ? 0.18 : 0.09;
        ctx.fillStyle = color;
        roundRect(ctx, n.x, n.y, n.w, n.h, 12);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = active ? EMPH : LINE;
        ctx.lineWidth = active ? 3 : 1.5;
        roundRect(ctx, n.x, n.y, n.w, n.h, 12);
        ctx.stroke();

        drawIcon(ctx, n.icon, n.x + n.w / 2, n.y + n.h / 2, color);

        if (active) {
          ctx.strokeStyle = EMPH;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(n.x + 10, n.y - 6);
          ctx.lineTo(n.x + 10, n.y);
          ctx.lineTo(n.x + 16, n.y);
          ctx.stroke();
        }
      }

      drawLegend(
        ctx,
        [
          { color: GUIDE, text: 'RT-1-X 路线' },
          { color: AUX, text: 'RT-2-X 路线' },
          { color: EMPH, text: '当前选中' },
        ],
        24,
        268
      );
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };

    const localPoint = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = rect.width > 0 ? W / rect.width : 1;
      const sy = rect.height > 0 ? H / rect.height : 1;
      return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
    };
    const hit = (x: number, y: number): ArchNode | undefined =>
      NODES.find((n) => x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h);

    const onClick = (ev: MouseEvent) => {
      const p = localPoint(ev);
      const n = hit(p.x, p.y);
      if (n) {
        selectedRef.current = n.id;
        setSelectedId(n.id);
      }
    };
    const onMove = (ev: MouseEvent) => {
      const p = localPoint(ev);
      canvas.style.cursor = hit(p.x, p.y) ? 'pointer' : 'default';
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMove);

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
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, []);

  const sel = NODES.find((n) => n.id === selectedId) ?? NODES[0];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {NODES.map((n) => (
          <button
            key={n.id}
            className={'chip' + (selectedId === n.id ? ' selected' : '')}
            onClick={() => choose(n.id)}
          >
            {n.chip}
          </button>
        ))}
      </div>
      <div className="feedback" style={{ height: 112, overflowY: 'auto' }}>
        <strong style={{ fontSize: 15 }}>{sel.title}</strong>
        <span style={{ color: MUTED, marginLeft: 10 }}>
          {sel.model === 'rt1' ? 'RT-1-X 路线' : 'RT-2-X 路线'}
        </span>
        <div style={{ marginTop: 6, lineHeight: 1.55 }}>{sel.desc}</div>
      </div>
    </div>
  );
};

export default M41;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* ------------------------------------------------------------------ */
/* Paper-specific drawing kit — duplicated locally in every widget.    */
/* ------------------------------------------------------------------ */

const C = {
  bg: '#f5f8f0',
  bench: '#d7deea',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  inset: '#ffffff',
};

function warpXs(w: number): number[] {
  const count = Math.max(6, Math.round((w - 120) / 24));
  const xs: number[] = [];
  for (let i = 0; i <= count; i += 1) xs.push(60 + ((w - 120) / count) * i);
  return xs;
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.bench;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C.warp;
  ctx.lineWidth = 2;
  warpXs(w).forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: Record<number, 'dim' | 'active'>
) {
  ctx.strokeStyle = C.loom;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, 12);
  ctx.lineTo(w - 20, 12);
  ctx.moveTo(20, h - 32);
  ctx.lineTo(w - 20, h - 32);
  ctx.moveTo(26, 12);
  ctx.lineTo(26, h - 32);
  ctx.moveTo(w - 26, 12);
  ctx.lineTo(w - 26, h - 32);
  ctx.stroke();

  const xs = warpXs(w).slice(0, Math.max(1, warpCount));
  xs.forEach((x, i) => {
    const st = warpState ? warpState[i] : undefined;
    ctx.strokeStyle = st === 'active' ? C.cross : st === 'dim' ? '#e4ead9' : C.warp;
    ctx.lineWidth = st === 'active' ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
) {
  const w = 34 * scale;
  const h = 14 * scale;
  const left = x - w / 2;
  const top = y - h / 2;
  const r = h / 2;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(left + w - r, top);
  ctx.quadraticCurveTo(left + w, top, left + w, top + r);
  ctx.quadraticCurveTo(left + w, top + h, left + w - r, top + h);
  ctx.lineTo(left + r, top + h);
  ctx.quadraticCurveTo(left, top + h, left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left - 24 * scale, y);
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  stateColor: string,
  width: number
) {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'row' | 'selvedge' | 'density'
) {
  if (mode === 'selvedge') {
    ctx.fillStyle = C.done;
    ctx.fillRect(x, y - 9, w, 18);
    return;
  }
  ctx.save();
  ctx.strokeStyle = C.done;
  ctx.lineWidth = 2;
  if (mode === 'row') ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'primary' | 'muted' | 'inverse'
) {
  ctx.fillStyle = variant === 'muted' ? C.muted : variant === 'inverse' ? '#ffffff' : C.ink;
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: Array<{ label: string; color: string }>
) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 8, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 14 + ctx.measureText(it.label).width + 18;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  color: string,
  width: number,
  dashed: boolean
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string
) {
  ctx.fillStyle = C.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 16);
  }
}

/* ------------------------------------------------------------------ */
/* m8-1 · 点开 Pretzel 的每个部件 — 1080×280                          */
/* 可点击架构图：两条流垂直交错，点开部件看它属于哪条流、是否冻结。     */
/* ------------------------------------------------------------------ */

const W = 1080;
const H = 280;

type NodeId = 'none' | 'text' | 'visual' | 'vlm' | 'shallow' | 'deep' | 'skip';
type HotId = Exclude<NodeId, 'none'>;

const HOTSPOTS: Array<{ id: HotId; label: string }> = [
  { id: 'text', label: '文本位置' },
  { id: 'visual', label: '视觉位置' },
  { id: 'vlm', label: 'VLM 流（冻结）' },
  { id: 'shallow', label: '浅层 TARFlows' },
  { id: 'deep', label: '深层 TARFlow' },
  { id: 'skip', label: '垂直跳跃连接' },
];

const REGIONS: Record<HotId, [number, number, number, number]> = {
  text: [28, 52, 62, 38],
  visual: [28, 146, 62, 38],
  vlm: [108, 48, 496, 44],
  skip: [100, 92, 500, 54],
  shallow: [108, 146, 164, 42],
  deep: [268, 146, 336, 42],
};

const HIT_ORDER: HotId[] = ['text', 'visual', 'shallow', 'deep', 'skip', 'vlm'];

const ACTIVE_PATH: Record<NodeId, string[]> = {
  none: [],
  text: ['text-in', 'vlm-band', 'text-head'],
  visual: ['visual-in', 'shallow', 'deep', 'visual-head'],
  vlm: ['text-in', 'visual-in', 'vlm-band', 'skip'],
  shallow: ['visual-in', 'shallow', 'skip'],
  deep: ['shallow', 'deep', 'visual-head', 'skip'],
  skip: ['skip'],
};

const DETAIL: Record<NodeId, { title: string; role: string; shape: string }> = {
  none: {
    title: '未选择部件',
    role: '点开一个部件，看它属于哪条流、是否被冻结。',
    shape: '—',
  },
  text: {
    title: '文本位置',
    role: '语言 token 的位置，走标准因果语言建模路径。',
    shape: '位置集合 M',
  },
  visual: {
    title: '视觉位置',
    role: '连续视觉隐变量的位置，输出头给出高斯。',
    shape: '位置集合 N',
  },
  vlm: {
    title: 'VLM 流（冻结）',
    role: '由 Qwen2.5-VL-7B-Instruct 初始化，全程冻结、只提供表示。',
    shape: '冻结 · 不接收梯度',
  },
  shallow: {
    title: '浅层 TARFlows',
    role: '只作用于视觉隐变量，产出中间表示 u。',
    shape: '2 块 × 4 层 · 宽度 3072',
  },
  deep: {
    title: '深层 TARFlow',
    role: '在完整多模态上下文下建模中间表示 u。',
    shape: '24 层 · 宽度 3072',
  },
  skip: {
    title: '垂直跳跃连接',
    role: '在每个位置交换信息，两条投影都零初始化。',
    shape: 'W_vlm / W_D 零初始化',
  },
};

const FEEDBACK: Record<NodeId, { text: string; cls: string }> = {
  none: { text: '点开一个部件，看它属于哪条流、是否被冻结。', cls: '' },
  text: { text: '文本位置走标准因果语言建模，输出头给出的是词表上的类别分布。', cls: '' },
  visual: { text: '视觉位置的输出头给出高斯的位置与尺度；文本位置给出类别分布。', cls: '' },
  vlm: { text: 'VLM 流全程冻结，只提供表示，不接受梯度。', cls: '' },
  shallow: {
    text: '浅层块只作用于视觉隐变量，产出中间表示 u，不打断从左到右的因果结构。',
    cls: '',
  },
  deep: { text: '深层流在完整多模态上下文下建模 u。', cls: '' },
  skip: {
    text: '垂直跳跃连接在每个位置交换信息，这就是 Pretzel 与 MoT 水平分离的关键差别。',
    cls: 'good',
  },
};

const hitTest = (x: number, y: number): HotId | null => {
  for (const id of HIT_ORDER) {
    const [rx, ry, rw, rh] = REGIONS[id];
    if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) return id;
  }
  return null;
};

export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<NodeId>('none');
  const rafRef = useRef<number | null>(null);
  const [activeNode, setActiveNode] = useState<NodeId>('none');
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

    const draw = () => {
      const node = stateRef.current;
      const path = ACTIVE_PATH[node];
      const bold = (id: string) => path.indexOf(id) >= 0;

      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);

      // 连接线
      drawThread(ctx, [90, 71], [108, 71], C.muted, 2, false);
      drawThread(ctx, [90, 165], [108, 165], C.muted, 2, false);
      drawThread(ctx, [604, 71], [614, 71], C.muted, 2, false);
      drawThread(ctx, [604, 165], [614, 165], C.muted, 2, false);

      // 上带：VLM 流（冻结，带斜纹）
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(110, 52, 490, 40);
      if (node === 'vlm') {
        ctx.fillStyle = 'rgba(240,126,71,0.14)';
        ctx.fillRect(110, 52, 490, 40);
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(110, 52, 490, 40);
      ctx.clip();
      ctx.strokeStyle = C.warpDeep;
      ctx.lineWidth = 1;
      for (let x = 100; x < 620; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 92);
        ctx.lineTo(x + 40, 52);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = C.warpDeep;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(110, 52, 490, 40);

      // 下带：TARFlow 流（左：浅层块，右：深层流）
      ctx.fillStyle = C.cross;
      ctx.fillRect(110, 146, 160, 40);
      ctx.fillStyle = C.weave;
      ctx.fillRect(270, 146, 330, 40);
      ctx.strokeStyle = C.weave;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(110, 146, 490, 40);

      // 交叉的垂直跳跃连接
      const skipColor = node === 'skip' ? C.shuttle : bold('skip') ? C.weave : C.cross;
      const skipWidth = bold('skip') || node === 'skip' ? 3 : 2;
      [208, 306, 404, 502].forEach((cx) => {
        drawThread(ctx, [cx - 12, 92], [cx + 12, 146], skipColor, skipWidth, false);
        drawThread(ctx, [cx + 12, 92], [cx - 12, 146], skipColor, skipWidth, false);
      });

      // 输入节点：文本入口 / 视觉入口
      ctx.fillStyle = C.inset;
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.fillRect(30, 55, 58, 32);
      ctx.strokeRect(30.5, 55.5, 57, 31);
      ctx.fillRect(30, 149, 58, 32);
      ctx.strokeRect(30.5, 149.5, 57, 31);
      drawThread(ctx, [38, 65], [78, 65], C.weave, 2, false);
      drawThread(ctx, [38, 73], [70, 73], C.weave, 2, false);
      ctx.fillStyle = C.weave;
      for (let a = 0; a < 2; a += 1) {
        for (let b = 0; b < 3; b += 1) {
          ctx.beginPath();
          ctx.arc(46 + b * 13, 158 + a * 13, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 输出头：文本位置给类别分布，视觉位置给高斯
      const bars = [12, 22, 30, 18, 9];
      bars.forEach((bh, i) => {
        ctx.fillStyle = C.weave;
        ctx.fillRect(618 + i * 8, 84 - bh, 5, bh);
      });
      ctx.strokeStyle = C.weave;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 614; x <= 656; x += 2) {
        const gx = (x - 636) / 10;
        const gy = 170 - 20 * Math.exp(-0.5 * gx * gx);
        if (x === 614) ctx.moveTo(x, gy);
        else ctx.lineTo(x, gy);
      }
      ctx.stroke();

      // 活动路径加粗
      const pathStroke = (x: number, y: number, w: number, h: number) => {
        ctx.strokeStyle = C.weave;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
      };
      if (bold('vlm-band')) pathStroke(111.5, 53.5, 487, 37);
      if (bold('shallow')) pathStroke(111.5, 147.5, 157, 37);
      if (bold('deep')) pathStroke(271.5, 147.5, 327, 37);
      if (bold('text-in')) pathStroke(31.5, 56.5, 55, 29);
      if (bold('visual-in')) pathStroke(31.5, 150.5, 55, 29);
      if (bold('text-head')) pathStroke(614, 52, 46, 36);
      if (bold('visual-head')) pathStroke(612, 148, 48, 34);

      // 选中节点高亮
      if (node !== 'none') {
        const [rx, ry, rw, rh] = REGIONS[node];
        ctx.strokeStyle = C.shuttle;
        ctx.lineWidth = 3;
        ctx.strokeRect(rx, ry, rw, rh);
      }

      // 详情区边框（文字走 DOM）
      drawInsetFrame(ctx, 690, 40, 360, 210, '');

      drawSceneLabel(ctx, 120, 76, 'VLM 冻结', 'primary');
      drawSceneLabel(ctx, 120, 170, 'TARFlow', 'inverse');
      drawLegend(ctx, 700, 272, [
        { label: '冻结', color: '#b8c9a7' },
        { label: '可训练', color: C.weave },
        { label: '跳跃连接', color: C.cross },
      ]);
    };

    const tick = () => {
      draw();
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

  const select = (next: NodeId) => {
    stateRef.current = next;
    setActiveNode(next);
    setFeedback(FEEDBACK[next]);
  };

  const toggle = (id: HotId) => {
    select(activeNode === id ? 'none' : id);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    const hit = hitTest(x, y);
    if (hit) toggle(hit);
  };

  const detail = DETAIL[activeNode];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div
        style={{
          margin: '8px 0',
          padding: '8px 12px',
          background: '#ffffff',
          border: '1px solid #d7deea',
          borderRadius: '6px',
          fontSize: '13px',
          lineHeight: 1.5,
          color: '#21324a',
        }}
      >
        <div style={{ fontWeight: 600 }}>{detail.title}</div>
        <div style={{ color: '#68778f' }}>{detail.role}</div>
        <div style={{ color: '#27446e', fontFamily: 'ui-monospace, monospace' }}>{detail.shape}</div>
      </div>
      <div className="ctrl">
        {HOTSPOTS.map((h) => {
          const on = activeNode === h.id;
          return (
            <button
              key={h.id}
              type="button"
              className={`chip${on ? ' selected' : ''}`}
              aria-pressed={on}
              onClick={() => toggle(h.id)}
            >
              {h.label}
            </button>
          );
        })}
        <button type="button" className="tiny ghost" onClick={() => select('none')}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M81;

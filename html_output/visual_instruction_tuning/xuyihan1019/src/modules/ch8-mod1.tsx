import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawGuide,
  drawWalker,
  drawPage,
  drawSpeech,
  drawTrail,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/trailKit';

// 第 8 章模块：可点击的导盲链（视觉编码器 → 投影层 → 语言模型 → 输出）。
// 点部件移动橙色高亮环、重着色激活路径、替换右侧固定详情面板；阶段芯片让语言模型在冻结/可训练之间翻转。

const W = 1080;
const H = 280;

type Sel = 'enc' | 'proj' | 'llm' | 'out';
type Stage = 'one' | 'two';
type Status = 'frozen' | 'trainable' | 'auto';

interface ArchState {
  sel: Sel;
  stage: Stage;
}

const BOX_W = 130;
const BOX_H = 96;
const BOX_Y = 72;

const NODES: Array<{ id: Sel; x: number; name: string }> = [
  { id: 'enc', x: 48, name: '视觉编码器' },
  { id: 'proj', x: 196, name: '投影层' },
  { id: 'llm', x: 344, name: '语言模型' },
  { id: 'out', x: 492, name: '输出' },
];

const SEL_INDEX: Record<Sel, number> = { enc: 0, proj: 1, llm: 2, out: 3 };

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function statusOf(sel: Sel, stage: Stage): Status {
  if (sel === 'enc') return 'frozen';
  if (sel === 'proj') return 'trainable';
  if (sel === 'llm') return stage === 'two' ? 'trainable' : 'frozen';
  return 'auto';
}

function statusColor(st: Status): string {
  if (st === 'trainable') return COLORS.aux;
  if (st === 'frozen') return COLORS.muted;
  return COLORS.route;
}

function drawLockMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 3.5, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(cx - 5, cy - 3, 10, 8);
  ctx.fill();
  ctx.restore();
}

function drawIcon(ctx: CanvasRenderingContext2D, id: Sel, cx: number, cy: number, active: boolean): void {
  if (id === 'enc') {
    drawGuide(ctx, cx, cy - 8, { eye: true });
  } else if (id === 'proj') {
    drawPage(ctx, cx - 19, cy - 27, 38, 54, { lines: 3, highlight: active ? 1 : undefined });
  } else if (id === 'llm') {
    drawWalker(ctx, cx, cy - 8);
  } else {
    drawSpeech(ctx, cx - 46, cy - 30, 92, '', { active });
  }
}

const draw = (ctx: CanvasRenderingContext2D, time: number, s: ArchState): void => {
  clearScene(ctx, W, H);
  drawLabel(ctx, '导盲链', 48, 46, { color: COLORS.muted, size: 13 });

  const selIdx = SEL_INDEX[s.sel];
  const midY = BOX_Y + BOX_H / 2;

  // 连线：激活路径从眼睛一路点亮到选中部件
  for (let i = 0; i < NODES.length - 1; i += 1) {
    const a = NODES[i];
    const b = NODES[i + 1];
    drawTrail(ctx, [[a.x + BOX_W, midY], [b.x, midY]], { active: i <= selIdx });
  }

  NODES.forEach((node) => {
    const st = statusOf(node.id, s.stage);
    const color = statusColor(st);
    const selected = node.id === s.sel;

    ctx.save();
    roundRect(ctx, node.x, BOX_Y, BOX_W, BOX_H, 12);
    ctx.fillStyle = tint(COLORS.bg, 0.86);
    ctx.fill();
    ctx.fillStyle =
      st === 'trainable'
        ? tint(COLORS.aux, 0.2)
        : st === 'frozen'
        ? tint(COLORS.muted, 0.18)
        : tint(COLORS.route, 0.1);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    drawIcon(ctx, node.id, node.x + BOX_W / 2, midY, selected);

    if (st === 'frozen') {
      drawLockMark(ctx, node.x + BOX_W - 16, BOX_Y + 16, COLORS.muted);
    }

    if (selected) {
      ctx.save();
      roundRect(ctx, node.x - 6, BOX_Y - 6, BOX_W + 12, BOX_H + 12, 16);
      ctx.strokeStyle = COLORS.fader;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  });

  // 链条到详情面板的细连线
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(NODES[3].x + BOX_W + 6, midY);
  ctx.lineTo(692, midY);
  ctx.stroke();
  ctx.restore();

  // 固定详情面板：随选中部件整体替换
  const px = 700;
  const py = 58;
  const pw = 340;
  const ph = 160;
  const st = statusOf(s.sel, s.stage);
  const color = statusColor(st);

  ctx.save();
  roundRect(ctx, px, py, pw, ph, 14);
  ctx.fillStyle = tint(COLORS.bg, 0.96);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(px + 2, py + 2, pw - 4, 6);
  ctx.restore();

  drawIcon(ctx, s.sel, px + 62, py + 86, true);

  const barX = px + 126;
  const barY = py + 116;
  const barW = 186;
  const barH = 16;
  ctx.save();
  roundRect(ctx, barX, barY, barW, barH, 8);
  ctx.fillStyle = tint(COLORS.axis, 0.5);
  ctx.fill();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (st === 'trainable') {
    roundRect(ctx, barX + 1.5, barY + 1.5, barW - 3, barH - 3, 7);
    ctx.fillStyle = tint(COLORS.aux, 0.85);
    ctx.fill();
  }
  ctx.restore();

  if (st === 'frozen') {
    drawLockMark(ctx, px + 296, py + 62, COLORS.muted);
  }

  drawLegend(ctx, 40, 258, [
    { color: COLORS.muted, text: '冻结' },
    { color: COLORS.aux, text: '可训练' },
    { color: COLORS.fader, text: '选中' },
  ]);
};

function feedbackFor(sel: Sel, stage: Stage): { text: string; cls: string } {
  if (sel === 'enc') {
    return { text: '视觉编码器 CLIP ViT-L/14：两个阶段都冻结。', cls: '' };
  }
  if (sel === 'proj') {
    return { text: '投影层 W：唯一跨模态部件，两个阶段都训练。', cls: '' };
  }
  if (sel === 'llm') {
    return {
      text: `语言模型 Vicuna：${stage === 'one' ? '第一阶段冻结' : '第二阶段解冻'}。`,
      cls: stage === 'one' ? '' : 'good',
    };
  }
  return { text: '输出：自回归逐词生成回答。', cls: '' };
}

export const Ch8Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<ArchState>({ sel: 'proj', stage: 'two' });
  const [sel, setSel] = useState<Sel>('proj');
  const [stage, setStage] = useState<Stage>('two');
  const [fb, setFb] = useState<{ text: string; cls: string }>(feedbackFor('proj', 'two'));
  const { ref } = useCanvas<ArchState>(draw, W, H, stateRef);

  const pick = (next: Sel): void => {
    stateRef.current.sel = next;
    setSel(next);
    setFb(feedbackFor(next, stateRef.current.stage));
  };

  const pickStage = (next: Stage): void => {
    stateRef.current.stage = next;
    setStage(next);
    setFb(feedbackFor(stateRef.current.sel, next));
  };

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    const hit = NODES.find(
      (node) => x >= node.x && x <= node.x + BOX_W && y >= BOX_Y && y <= BOX_Y + BOX_H
    );
    if (hit) pick(hit.id);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} onClick={onCanvasClick} />
      <div className="ctrl">
        {NODES.map((node) => (
          <button
            key={node.id}
            type="button"
            className={`chip ${sel === node.id ? 'selected' : ''}`}
            aria-pressed={sel === node.id}
            onClick={() => pick(node.id)}
          >
            {node.name}
          </button>
        ))}
        <button
          type="button"
          className={`chip ${stage === 'one' ? 'selected' : ''}`}
          aria-pressed={stage === 'one'}
          onClick={() => pickStage('one')}
        >
          第一阶段
        </button>
        <button
          type="button"
          className={`chip ${stage === 'two' ? 'selected' : ''}`}
          aria-pressed={stage === 'two'}
          onClick={() => pickStage('two')}
        >
          第二阶段
        </button>
        <label>
          可训练 <span className="val">{stage === 'one' ? 'W' : 'W + LLM'}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Mod1;

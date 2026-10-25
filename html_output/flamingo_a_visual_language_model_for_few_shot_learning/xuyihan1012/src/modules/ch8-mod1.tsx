import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawChannelStrip,
  drawDeck,
  drawLabel,
  drawLegend,
  drawSignalPath,
  useCanvas,
} from '../lib/consoleKit';

// §8.1 module — 可点击的简化架构链。
// 五个部件热点（视觉编码器 / Perceiver Resampler / GATED XATTN-DENSE / 冻结 LM 层 / 文本输出）
// 共享同一个 `sel` 状态；芯片切换 3B / 9B / 80B 规模。
// 画布内的部件标签受 8 字符上限约束，完整名称放在 DOM 按钮列表与反馈行里。

const W = 1080;
const H = 280;

type Scale = '3B' | '9B' | '80B';
type Part = 'vision' | 'resampler' | 'xattn' | 'lm' | 'out';

interface Entry {
  params: string;
  frozen: boolean;
  insert: string;
  layers: number;
}

const SCALES: Scale[] = ['3B', '9B', '80B'];
const PARTS: Part[] = ['vision', 'resampler', 'xattn', 'lm', 'out'];

/** 画布内的短标签（≤8 字符）。 */
const PART_TAG: Record<Part, string> = {
  vision: '视觉编码器',
  resampler: 'Resamp',
  xattn: 'GATED',
  lm: '冻结 LM',
  out: '文本输出',
};

/** DOM 按钮与反馈里的完整名称。 */
const PART_FULL: Record<Part, string> = {
  vision: '视觉编码器',
  resampler: 'Perceiver Resampler',
  xattn: 'GATED XATTN-DENSE',
  lm: '冻结 LM 层',
  out: '文本输出',
};

const NODE_W = 96;
const NODE_H = 60;
const NODE_CY = 126;
const NODES: Array<{ part: Part; x: number }> = [
  { part: 'vision', x: 88 },
  { part: 'resampler', x: 219 },
  { part: 'xattn', x: 350 },
  { part: 'lm', x: 481 },
  { part: 'out', x: 612 },
];

/** 三个规模的 LM 层（24 / 40 / 80）用密度纹理示意。 */
const LM_DENSITY: Record<Scale, number> = { '3B': 8, '9B': 10, '80B': 12 };

// Table 5 与 Table 4 的记录值。
const TABLE: Record<Scale, Record<Part, Entry>> = {
  '3B': {
    vision: { params: '435M', frozen: true, insert: '—', layers: 0 },
    resampler: { params: '194M', frozen: false, insert: '6 层', layers: 6 },
    xattn: { params: '1.2B', frozen: false, insert: '每层插入', layers: 24 },
    lm: { params: '1.4B', frozen: true, insert: '—', layers: 24 },
    out: { params: '无', frozen: false, insert: '—', layers: 0 },
  },
  '9B': {
    vision: { params: '435M', frozen: true, insert: '—', layers: 0 },
    resampler: { params: '194M', frozen: false, insert: '6 层', layers: 6 },
    xattn: { params: '1.6B', frozen: false, insert: '每四层', layers: 10 },
    lm: { params: '7.1B', frozen: true, insert: '—', layers: 40 },
    out: { params: '无', frozen: false, insert: '—', layers: 0 },
  },
  '80B': {
    vision: { params: '435M', frozen: true, insert: '—', layers: 0 },
    resampler: { params: '194M', frozen: false, insert: '6 层', layers: 6 },
    xattn: { params: '10B', frozen: false, insert: '每七层', layers: 12 },
    lm: { params: '70B', frozen: true, insert: '—', layers: 80 },
    out: { params: '无', frozen: false, insert: '—', layers: 0 },
  },
};

type ModState = { scale: Scale; sel: Part };

function feedbackFor(scale: Scale, sel: Part): { text: string; cls: string } {
  const entry = TABLE[scale][sel];
  if (sel === 'vision') {
    return {
      text: '视觉编码器：三个规模都是 435M，始终冻结；它只提供特征，不参与训练。',
      cls: '',
    };
  }
  if (sel === 'resampler') {
    return {
      text: 'Perceiver Resampler：约 194M，可训练，三个规模共用同一尺寸，把任意数量特征压成 64 个 token。',
      cls: '',
    };
  }
  if (sel === 'xattn') {
    return {
      text: `GATED XATTN-DENSE：唯一新增的跨模态可训练层，${entry.insert}，约 ${entry.params} 参数。`,
      cls: 'aux',
    };
  }
  if (sel === 'lm') {
    return {
      text: `冻结 LM 层：${entry.params}，完全冻结；论文发现微调它反而下降 8.0%，属于灾难性遗忘。`,
      cls: '',
    };
  }
  return {
    text: '文本输出：自回归地逐词生成，开放式任务用束搜索，封闭式任务按对数似然给候选打分。',
    cls: 'good',
  };
}

/** 「已封存」标记：冻结部件使用的小圆点母题。 */
function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.route;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.bg;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.bg;
  ctx.fill();
}

function drawPart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  part: Part,
  entry: Entry,
  density: number,
  selected: boolean
): void {
  const x = cx - NODE_W / 2;
  const y = cy - NODE_H / 2;

  ctx.beginPath();
  ctx.rect(x, y, NODE_W, NODE_H);
  ctx.fillStyle = entry.frozen ? COLORS.deck : COLORS.deckB;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = entry.frozen ? COLORS.platter : COLORS.aux;
  ctx.stroke();

  if (part === 'vision') {
    drawDeck(ctx, cx, cy + 2, 22, { spin: 0, frozen: true, accent: COLORS.platter });
  } else if (part === 'resampler') {
    drawChannelStrip(ctx, cx - 34, cy - 16, 68, 32, { count: 6, active: 6, color: COLORS.aux });
  } else if (part === 'xattn') {
    drawChannelStrip(ctx, cx - 40, cy - 16, 80, 32, {
      count: Math.max(1, entry.layers),
      active: entry.layers,
      color: COLORS.aux,
    });
  } else if (part === 'lm') {
    drawDeck(ctx, cx - 18, cy + 2, 18, { spin: 0, frozen: true, accent: COLORS.platter });
    drawChannelStrip(ctx, cx + 2, cy - 20, 42, 40, { count: density, active: 0, color: COLORS.muted });
  } else {
    [10, 18, 26].forEach((h, i) => {
      ctx.beginPath();
      ctx.rect(cx - 24 + i * 17, cy + 13 - h, 11, h);
      ctx.fillStyle = COLORS.good;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();
    });
  }

  if (entry.frozen) drawSeal(ctx, x + NODE_W - 12, y + 12);

  if (selected) {
    // 线索一：部件自身描边加粗；线索二：橙色选中外环
    ctx.beginPath();
    ctx.rect(x, y, NODE_W, NODE_H);
    ctx.lineWidth = 3;
    ctx.strokeStyle = entry.frozen ? COLORS.platter : COLORS.aux;
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(x - 8, y - 8, NODE_W + 16, NODE_H + 16);
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.fader;
    ctx.stroke();
  }

  drawLabel(ctx, PART_TAG[part], cx, y + NODE_H + 22, {
    color: selected ? COLORS.fader : COLORS.ink,
    size: 15,
    align: 'center',
    bold: selected,
  });
}

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<ModState>({ scale: '80B', sel: 'xattn' });
  const [ui, setUi] = useState<ModState>({ scale: '80B', sel: 'xattn' });

  const applySel = (sel: Part): void => {
    stateRef.current.sel = sel;
    setUi((u) => ({ ...u, sel }));
  };
  const applyScale = (scale: Scale): void => {
    stateRef.current.scale = scale;
    setUi((u) => ({ ...u, scale }));
  };

  const { ref, ready } = useCanvas<ModState>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const table = TABLE[s.scale];
      const density = LM_DENSITY[s.scale];

      // 部件之间的数据流：已到达当前查看部件的那一段用蓝色加粗
      const pts = NODES.map((n) => [n.x, NODE_CY] as [number, number]);
      drawSignalPath(ctx, pts, {});
      const idx = NODES.findIndex((n) => n.part === s.sel);
      const active = pts.slice(0, Math.max(2, idx + 1));
      if (active.length >= 2) drawSignalPath(ctx, active, { active: true });

      NODES.forEach((node) => {
        drawPart(ctx, node.x, NODE_CY, node.part, table[node.part], density, node.part === s.sel);
      });

      // 固定详情区（白色内嵌面板）
      const entry = table[s.sel];
      ctx.beginPath();
      ctx.rect(700, 84, 340, 138);
      ctx.fillStyle = COLORS.bg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.axis;
      ctx.stroke();

      drawLabel(ctx, PART_TAG[s.sel], 720, 112, { color: COLORS.ink, size: 15, bold: true });
      drawLabel(ctx, `参数 ${entry.params}`, 720, 146, { color: COLORS.ink, size: 15 });
      drawLabel(ctx, `状态 ${entry.frozen ? '冻结' : '可训练'}`, 720, 174, {
        color: entry.frozen ? COLORS.muted : COLORS.aux,
        size: 15,
      });
      drawLabel(ctx, `插入 ${entry.insert}`, 720, 202, { color: COLORS.ink, size: 15 });

      drawLegend(ctx, 40, 266, [
        { color: COLORS.aux, text: '可训练' },
        { color: COLORS.platter, text: '已冻结' },
        { color: COLORS.fader, text: '选中' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * W) / rect.width;
    const y = ((event.clientY - rect.top) * H) / rect.height;
    const hit = NODES.find(
      (n) => Math.abs(x - n.x) <= NODE_W / 2 && Math.abs(y - NODE_CY) <= NODE_H / 2
    );
    if (hit) applySel(hit.part);
  };

  const fb = feedbackFor(ui.scale, ui.sel);
  const entry = TABLE[ui.scale][ui.sel];
  const purple = fb.cls === 'aux';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
        aria-label={ready ? '可点击的简化架构信号链' : '加载中'}
      />
      <div className="ctrl">
        <div className="chip-row">
          {PARTS.map((p) => (
            <button
              key={p}
              type="button"
              className={`chip${p === ui.sel ? ' selected' : ''}`}
              aria-pressed={p === ui.sel}
              onClick={() => applySel(p)}
            >
              {PART_FULL[p]}
            </button>
          ))}
        </div>
        <div className="chip-row">
          {SCALES.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip${s === ui.scale ? ' selected' : ''}`}
              aria-pressed={s === ui.scale}
              onClick={() => applyScale(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="step-label">
          规模 <b>{ui.scale}</b>
        </span>
        <span className="step-label">
          参数量 <b>{entry.params}</b>
        </span>
        <span className="step-label">
          状态 <b>{entry.frozen ? '已冻结' : '可训练'}</b>
        </span>
        <span className="step-label">
          插入频率 <b>{entry.insert}</b>
        </span>
      </div>
      <div
        className={`feedback${purple ? '' : ` ${fb.cls}`}`}
        style={purple ? { color: COLORS.aux, borderLeftColor: COLORS.aux } : undefined}
      >
        {fb.text}
      </div>
    </div>
  );
};

export default Ch8Mod1;

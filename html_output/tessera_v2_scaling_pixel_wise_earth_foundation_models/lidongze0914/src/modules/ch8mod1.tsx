import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 Module 8.1 — interactive architecture map. Clicking a canvas node (or the
// equivalent DOM chip) highlights it and its downstream active path, and refreshes
// the fixed detail panel. View chips switch the teacher/student graph; size chips
// switch the student scale N/S/M/L. Training-only parts are dashed and discarded.

const W = 1080;
const H = 280;

type View = 'teacher' | 'student';
type Size = 'N' | 'S' | 'M' | 'L';
type NodeId =
  | 's2'
  | 's1'
  | 'perModality'
  | 'pooling'
  | 'fusion'
  | 'reducer'
  | 'projector'
  | 'teacherEmbed'
  | 'prefixHead';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Feedback {
  text: string;
  cls: '' | 'good' | 'bad';
}

interface SizeInfo {
  deploy: string;
  train: string;
  dmodel: number;
  ffn: number;
  layers: number;
}

interface SceneState {
  view: View;
  size: Size;
  selected: NodeId;
  hovered: NodeId | null;
  visited: NodeId[];
  viewsSeen: { teacher: boolean; student: boolean };
  completed: boolean;
  completedAt: number;
  inactiveAt: number;
}

const NODE_ORDER: NodeId[] = [
  's2',
  's1',
  'perModality',
  'pooling',
  'fusion',
  'reducer',
  'projector',
  'teacherEmbed',
  'prefixHead',
];

const NODE_LABEL: Record<NodeId, string> = {
  s2: 'S2 分支',
  s1: 'S1 分支',
  perModality: '逐模态 Transformer',
  pooling: '注意力池化',
  fusion: '融合 Transformer',
  reducer: '降维器',
  projector: '投影器',
  teacherEmbed: '教师嵌入 dT=1024',
  prefixHead: 'Matryoshka 前缀头',
};

const NAME_PLATE: Record<NodeId, string> = {
  s2: 'S2',
  s1: 'S1',
  perModality: '逐模态',
  pooling: '池化',
  fusion: '融合',
  reducer: '降维',
  projector: '投影',
  teacherEmbed: 'dT',
  prefixHead: '前缀',
};

const SIZE_ORDER: Size[] = ['N', 'S', 'M', 'L'];

const SIZE_INFO: Record<Size, SizeInfo> = {
  N: { deploy: '1.1M', train: '3.4M', dmodel: 144, ffn: 384, layers: 2 },
  S: { deploy: '7.1M', train: '9.5M', dmodel: 256, ffn: 1024, layers: 4 },
  M: { deploy: '21.0M', train: '23.4M', dmodel: 440, ffn: 1792, layers: 4 },
  L: { deploy: '43.8M', train: '46.2M', dmodel: 640, ffn: 2560, layers: 4 },
};

const SIZE_CHIP: Record<Size, string> = {
  N: 'N 1.1M',
  S: 'S 7.1M',
  M: 'M 21.0M',
  L: 'L 43.8M',
};

const INAPPLICABLE =
  '不属于当前视图：教师没有 Matryoshka 前缀头、学生没有融合 Transformer 与投影器，切换视图再查看。';
const COMPLETE =
  '探索完成：教师部署编码器 2.06B、投影器 ~170M 丢弃；学生部署 1.1/7.1/21.0/43.8M、前缀头 ~2.35M 丢弃——服务时只部署编码器。';

const DOWNSTREAM: Record<View, Record<NodeId, NodeId[]>> = {
  teacher: {
    s2: ['perModality', 'pooling', 'fusion', 'reducer', 'teacherEmbed'],
    s1: ['perModality', 'pooling', 'fusion', 'reducer', 'teacherEmbed'],
    perModality: ['pooling', 'fusion', 'reducer', 'teacherEmbed'],
    pooling: ['fusion', 'reducer', 'teacherEmbed'],
    fusion: ['reducer', 'teacherEmbed'],
    reducer: ['teacherEmbed'],
    teacherEmbed: ['projector'],
    projector: [],
    prefixHead: [],
  },
  student: {
    s2: ['perModality', 'pooling', 'reducer', 'teacherEmbed'],
    s1: ['perModality', 'pooling', 'reducer', 'teacherEmbed'],
    perModality: ['pooling', 'reducer', 'teacherEmbed'],
    pooling: ['reducer', 'teacherEmbed'],
    fusion: [],
    reducer: ['teacherEmbed', 'prefixHead'],
    teacherEmbed: ['prefixHead'],
    projector: [],
    prefixHead: [],
  },
};

function isApplicable(id: NodeId, view: View): boolean {
  if (id === 'prefixHead') return view === 'student';
  if (id === 'fusion' || id === 'projector') return view === 'teacher';
  return true;
}

function activePathFor(id: NodeId, view: View): NodeId[] {
  return [id, ...DOWNSTREAM[view][id]].filter((n) => isApplicable(n, view));
}

function rectFor(id: NodeId, view: View): Rect {
  switch (id) {
    case 's2':
      return { x: 44, y: 62, w: 66, h: 34 };
    case 's1':
      return { x: 44, y: 184, w: 66, h: 34 };
    case 'perModality':
      return { x: 130, y: 62, w: 84, h: 34 };
    case 'pooling':
      return { x: 236, y: 62, w: 72, h: 34 };
    case 'fusion':
      return view === 'teacher' ? { x: 366, y: 122, w: 84, h: 36 } : { x: 366, y: 46, w: 84, h: 36 };
    case 'reducer':
      return { x: 502, y: 122, w: 72, h: 36 };
    case 'projector':
      return { x: 806, y: 196, w: 86, h: 36 };
    case 'teacherEmbed':
      return { x: 630, y: 117, w: 120, h: 46 };
    case 'prefixHead':
      return { x: 806, y: 48, w: 86, h: 36 };
    default:
      return { x: 44, y: 62, w: 66, h: 34 };
  }
}

function rectsFor(id: NodeId, view: View): Rect[] {
  const r = rectFor(id, view);
  if (id === 'perModality' || id === 'pooling') {
    return [r, { x: r.x, y: 184, w: r.w, h: r.h }];
  }
  return [r];
}

function hitTest(x: number, y: number, view: View): NodeId | null {
  for (let i = 0; i < NODE_ORDER.length; i += 1) {
    const id = NODE_ORDER[i];
    const rects = rectsFor(id, view);
    for (let j = 0; j < rects.length; j += 1) {
      const r = rects[j];
      if (x >= r.x - 8 && x <= r.x + r.w + 8 && y >= r.y - 8 && y <= r.y + r.h + 8) {
        return id;
      }
    }
  }
  return null;
}

function selectedFeedback(id: NodeId, view: View, size: Size, withSize: boolean): Feedback {
  let text = `已选中「${NODE_LABEL[id]}」：查看其输入、作用与规格，并沿下游路径继续。`;
  if (view === 'student' && withSize) {
    text += `当前学生规模 ${size}（部署编码器 ${SIZE_INFO[size].deploy}）。`;
  }
  return { text, cls: '' };
}

function detailFor(
  id: NodeId,
  view: View,
  size: Size
): { input: string; role: string; why: string; spec: string } {
  const s = SIZE_INFO[size];
  if (!isApplicable(id, view)) {
    return {
      input: '—',
      role: '该组件只出现在另一视图中，当前视图不包含它。',
      why: '—',
      spec:
        id === 'prefixHead'
          ? '应属视图：学生（训练专用，推理时丢弃）。'
          : '应属视图：教师（训练/部署路径）。',
    };
  }
  switch (id) {
    case 's2':
      return {
        input: '该像素全年的 Sentinel-2 光学观测（10 个波段；云遮挡时刻由掩码剔除）。',
        role: '观测嵌入 + 正弦日序编码，进入逐模态 Transformer 做时序建模。',
        why: '保留完整物候而非无云快照；与雷达分支互补，弥补光学受云影响。',
        spec:
          view === 'teacher'
            ? '维度：dmodel=4096（=4×1024）、4 头、FFN 16384；参数计入双分支部署编码器 2.06B。'
            : `维度：dmodel=${s.dmodel}、4 头、FFN=${s.ffn}、${s.layers} 层；部署编码器 ${s.deploy}。`,
      };
    case 's1':
      return {
        input: '该像素全年的 Sentinel-1 VV/VH 观测（升轨与降轨合并为统一编码器）。',
        role: '与 S2 同形态的逐模态独立骨干；两分支按模态各自计算，同一模态的多视图共享权重。',
        why: '雷达观测不受云层遮挡，与光学形成互补。',
        spec:
          view === 'teacher'
            ? '维度：dmodel=4096（=4×1024）、4 头、FFN 16384；参数计入双分支部署编码器 2.06B。'
            : `维度：dmodel=${s.dmodel}、4 头、FFN=${s.ffn}、${s.layers} 层；部署编码器 ${s.deploy}。`,
      };
    case 'perModality':
      return {
        input: '单模态的有效观测 token 序列（训练 L∈{8,16}；推理为全部有效观测）。',
        role: '学习时间序列中的长期依赖（注意力编码）。',
        why: '不规则采样下恢复年度物候；深度、头数与融合形式固定，只在宽度上缩放。',
        spec:
          view === 'teacher'
            ? 'dmodel=4096（=4×1024）、4 层、4 头、FFN 16384；教师部署编码器合计 2.06B。'
            : `dmodel=${s.dmodel}、FFN=${s.ffn}、${s.layers} 层、4 头；部署编码器 ${s.deploy}（训练总计 ${s.train}）。`,
      };
    case 'pooling':
      return {
        input: '逐模态 Transformer 输出的变长 token 序列（长度随有效观测数变化）。',
        role: '学习式注意力池化：把不规则、变长的时间观测压缩为固定维度的摘要 token。',
        why: '同一组权重可处理任意观测数量；推理时可直接使用全部有效观测（§6）。',
        spec: '教师与学生形式固定，参数计入各自的部署编码器。',
      };
    case 'fusion':
      return {
        input: '两模态的摘要 token（附加可学习的模态嵌入）。',
        role: '两层跨模态 Transformer，把两模态融合为一个联合表示（仅教师）。',
        why: '光学与雷达信息互补；学生则直接拼接两路输出。',
        spec: '宽度缩放族 500M/1B/2B 的融合形式固定。',
      };
    case 'reducer':
      return view === 'teacher'
        ? {
            input: '融合 Transformer 输出的联合表示。',
            role: '把联合表示降维到教师嵌入 dT=1024。',
            why: '教师维度 1024 刻意大于学生的 128，为蒸馏压缩留出空间。',
            spec: '参数计入教师部署编码器 2.06B。',
          }
        : {
            input: '两路骨干输出的拼接。',
            role: '经 MLP（Linear→LayerNorm→ReLU→Dropout→Linear）降到 128 维。',
            why: '教师维度 1024 刻意大于学生的 128，为蒸馏压缩留出空间。',
            spec: `末端为无仿射参数的 LayerNorm；部署编码器 ${s.deploy}（训练总计 ${s.train}）。`,
          };
    case 'projector':
      return {
        input: '降维后的表示向量。',
        role: '批归一化 MLP（9 隐藏层、宽 4096）投影到 Barlow Twins 目标空间。',
        why: '冗余缩减目标需要投影器；它是训练脚手架，推理时丢弃。',
        spec: '~170M（500M/1B/2B 约 170/171/172M），占总参数 25%→14%→8%，推理时丢弃。',
      };
    case 'teacherEmbed':
      return view === 'teacher'
        ? {
            input: '降维器输出的联合表示。',
            role: '教师嵌入 dT=1024。',
            why: '作为蒸馏的冻结目标：提供固定目标分布并固定坐标顺序（§9）。',
            spec: '部署编码器 0.52/1.01/2.06B（500M/1B/2B）；2B 为所有报告结果采用的成员。',
          }
        : {
            input: '两路骨干拼接并经降维器后的表示。',
            role: '128 维套娃式嵌入（Matryoshka）。',
            why: '部署时只保留编码器与该嵌入；训练专用部件全部丢弃。',
            spec: `部署编码器 ${s.deploy}（训练总计 ${s.train}）；L 学生更宽而非更深。`,
          };
    case 'prefixHead':
      return {
        input: '学生嵌入的前 d 维（d∈{16,32,64,128}）。',
        role: '训练专用的前缀投影头：把每个前缀重建为完整的教师嵌入。',
        why: '提供自监督缺失的坐标顺序；推理时丢弃，用户直接截断前缀。',
        spec: '约 2.35M、与大小无关；推理时丢弃。',
      };
    default:
      return { input: '—', role: '—', why: '—', spec: '—' };
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, r: Rect, radius: number): void {
  const rad = Math.min(radius, r.w / 2, r.h / 2);
  ctx.beginPath();
  ctx.moveTo(r.x + rad, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, rad);
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, rad);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  dash: boolean,
  arrow: boolean
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (arrow) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const len = 9;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - len * Math.cos(a - 0.45), y2 - len * Math.sin(a - 0.45));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - len * Math.cos(a + 0.45), y2 - len * Math.sin(a + 0.45));
    ctx.stroke();
  }
  ctx.restore();
}

interface NodeStyle {
  active: boolean;
  selected: boolean;
  hovered: boolean;
  now: number;
}

function drawNode(ctx: CanvasRenderingContext2D, r: Rect, label: string, st: NodeStyle): void {
  const base = st.active ? '#7c3aed' : '#68778f';
  roundRectPath(ctx, r, 8);
  ctx.fillStyle = st.active ? 'rgba(124,58,237,0.09)' : 'rgba(104,119,143,0.08)';
  ctx.fill();
  if (st.selected) {
    const pulse = 4 + 1.5 * (0.5 + 0.5 * Math.sin(st.now / 240));
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = pulse;
    ctx.stroke();
  } else {
    ctx.strokeStyle = base;
    ctx.lineWidth = 2;
    if (!st.active) ctx.setLineDash([7, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (st.hovered) {
      roundRectPath(ctx, { x: r.x - 3, y: r.y - 3, w: r.w + 6, h: r.h + 6 }, 10);
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#21324a';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
): void {
  ctx.fillStyle = '#21324a';
  ctx.font = '17px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number,
  highlightIndex: number
): void {
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  items.forEach((item, i) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 9, 14, 9);
    if (i === highlightIndex) {
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 2.5, y - 11.5, 19, 14);
    }
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 44 + ctx.measureText(item.label).width;
  });
}

function renderScene(ctx: CanvasRenderingContext2D, s: SceneState, now: number): void {
  clearScene(ctx);

  drawBeam(ctx, 44, 79, 330, 79, '#d7deea', 2, false, false);
  drawBeam(ctx, 44, 201, 330, 201, '#d7deea', 2, false, false);

  const path = new Set(activePathFor(s.selected, s.view));
  const onEdge = (a: NodeId, b: NodeId): boolean => path.has(a) && path.has(b);

  const solid = (x1: number, y1: number, x2: number, y2: number, a: NodeId, b: NodeId): void => {
    const on = onEdge(a, b);
    drawBeam(ctx, x1, y1, x2, y2, on ? '#f07e47' : '#7c3aed', on ? 3 : 2, false, true);
  };
  const dashed = (x1: number, y1: number, x2: number, y2: number, a: NodeId, b: NodeId): void => {
    const on = onEdge(a, b);
    drawBeam(ctx, x1, y1, x2, y2, on ? '#f07e47' : '#68778f', on ? 3 : 2, true, true);
  };

  solid(110, 79, 130, 79, 's2', 'perModality');
  solid(110, 201, 130, 201, 's1', 'perModality');
  solid(214, 79, 236, 79, 'perModality', 'pooling');
  solid(214, 201, 236, 201, 'perModality', 'pooling');

  if (s.view === 'teacher') {
    solid(308, 79, 366, 140, 'pooling', 'fusion');
    solid(308, 201, 366, 140, 'pooling', 'fusion');
    solid(450, 140, 502, 140, 'fusion', 'reducer');
    solid(574, 140, 630, 140, 'reducer', 'teacherEmbed');
    dashed(690, 163, 690, 214, 'teacherEmbed', 'projector');
    dashed(690, 214, 806, 214, 'teacherEmbed', 'projector');
  } else {
    solid(308, 79, 340, 140, 'pooling', 'reducer');
    solid(308, 201, 340, 140, 'pooling', 'reducer');
    solid(340, 140, 502, 140, 'pooling', 'reducer');
    solid(574, 140, 630, 140, 'reducer', 'teacherEmbed');
    dashed(690, 117, 690, 66, 'teacherEmbed', 'prefixHead');
    dashed(690, 66, 806, 66, 'teacherEmbed', 'prefixHead');
    drawBeam(
      ctx,
      892,
      66,
      930,
      66,
      path.has('prefixHead') ? '#f07e47' : '#68778f',
      path.has('prefixHead') ? 3 : 2,
      true,
      true
    );

    roundRectPath(ctx, { x: 312, y: 128, w: 56, h: 24 }, 12);
    ctx.fillStyle = 'rgba(124,58,237,0.12)';
    ctx.fill();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('拼接', 340, 141);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    roundRectPath(ctx, { x: 930, y: 48, w: 118, h: 36 }, 8);
    ctx.fillStyle = 'rgba(104,119,143,0.10)';
    ctx.fill();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = '#68778f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('冻结教师目标', 989, 67);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  NODE_ORDER.forEach((id) => {
    const active = isApplicable(id, s.view);
    rectsFor(id, s.view).forEach((r) => {
      const label = id === 'teacherEmbed' && s.view === 'student' ? '128' : NAME_PLATE[id];
      drawNode(ctx, r, label, {
        active,
        selected: s.selected === id,
        hovered: s.hovered === id,
        now,
      });
    });
  });

  ctx.fillStyle = '#68778f';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  const dm = s.view === 'teacher' ? '4096' : String(SIZE_INFO[s.size].dmodel);
  const ff = s.view === 'teacher' ? '16384' : String(SIZE_INFO[s.size].ffn);
  ctx.fillText(`d${dm}`, 172, 118);
  ctx.fillText(`F${ff}`, 172, 134);
  ctx.textAlign = 'left';

  drawSceneLabel(ctx, s.view === 'teacher' ? '教师 2B' : `学生 ${s.size}`, 44, 34);
  if (s.view === 'teacher') {
    drawSceneLabel(ctx, '训练用', 902, 218);
  } else {
    drawSceneLabel(ctx, '训练用', 902, 100);
  }

  const discardActive =
    (s.hovered !== null && !isApplicable(s.hovered, s.view)) ||
    s.selected === 'projector' ||
    s.selected === 'prefixHead';
  drawLegend(
    ctx,
    [
      { label: '部署路径', color: '#7c3aed' },
      { label: '推理时丢弃', color: '#68778f' },
    ],
    44,
    266,
    discardActive ? 1 : -1
  );

  if (s.completedAt > 0 && now - s.completedAt < 1000) {
    const t = easeOutCubic(clamp((now - s.completedAt) / 1000, 0, 1));
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.restore();
  }
  if (s.inactiveAt > 0 && now - s.inactiveAt < 650) {
    const t = easeOutCubic(clamp((now - s.inactiveAt) / 650, 0, 1));
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#c43f52';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.restore();
  }
}

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<SceneState>({
    view: 'teacher',
    size: 'L',
    selected: 'perModality',
    hovered: null,
    visited: ['perModality'],
    viewsSeen: { teacher: true, student: false },
    completed: false,
    completedAt: 0,
    inactiveAt: 0,
  });
  const [view, setView] = useState<View>('teacher');
  const [size, setSize] = useState<Size>('L');
  const [selected, setSelected] = useState<NodeId>('perModality');
  const [visitedCount, setVisitedCount] = useState(1);
  const [feedback, setFeedback] = useState<Feedback>(() =>
    selectedFeedback('perModality', 'teacher', 'L', false)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = () => {
      renderScene(ctx, stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const checkComplete = (s: SceneState): boolean => {
    if (!s.completed && s.viewsSeen.teacher && s.viewsSeen.student && s.visited.length === 9) {
      s.completed = true;
      s.completedAt = performance.now();
    }
    return s.completed;
  };

  const selectNode = (id: NodeId) => {
    const s = stateRef.current;
    s.selected = id;
    setSelected(id);
    if (!isApplicable(id, s.view)) {
      s.inactiveAt = performance.now();
      setFeedback({ text: INAPPLICABLE, cls: 'bad' });
      return;
    }
    if (s.visited.indexOf(id) === -1) {
      s.visited.push(id);
      setVisitedCount(s.visited.length);
    }
    const done = checkComplete(s);
    setFeedback(done ? { text: COMPLETE, cls: 'good' } : selectedFeedback(id, s.view, s.size, false));
  };

  const switchView = (v: View) => {
    const s = stateRef.current;
    if (s.view === v) return;
    s.view = v;
    s.viewsSeen[v] = true;
    s.hovered = null;
    if (v === 'student' && (s.selected === 'fusion' || s.selected === 'projector')) {
      s.selected = 'reducer';
    } else if (v === 'teacher' && s.selected === 'prefixHead') {
      s.selected = 'perModality';
    }
    setView(v);
    setSelected(s.selected);
    const done = checkComplete(s);
    setFeedback(
      done ? { text: COMPLETE, cls: 'good' } : selectedFeedback(s.selected, v, s.size, false)
    );
  };

  const switchSize = (sz: Size) => {
    const s = stateRef.current;
    if (s.view !== 'student' || s.size === sz) return;
    s.size = sz;
    setSize(sz);
    const done = checkComplete(s);
    setFeedback(
      done ? { text: COMPLETE, cls: 'good' } : selectedFeedback(s.selected, s.view, sz, true)
    );
  };

  const reset = () => {
    const s = stateRef.current;
    s.view = 'teacher';
    s.size = 'L';
    s.selected = 'perModality';
    s.hovered = null;
    s.visited = ['perModality'];
    s.viewsSeen = { teacher: true, student: false };
    s.completed = false;
    s.completedAt = 0;
    s.inactiveAt = 0;
    setView('teacher');
    setSize('L');
    setSelected('perModality');
    setVisitedCount(1);
    setFeedback(selectedFeedback('perModality', 'teacher', 'L', false));
  };

  const localPos = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = localPos(e);
    if (!p) return;
    stateRef.current.hovered = hitTest(p.x, p.y, stateRef.current.view);
  };

  const onPointerLeave = () => {
    stateRef.current.hovered = null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = localPos(e);
    if (!p) return;
    const id = hitTest(p.x, p.y, stateRef.current.view);
    if (id) selectNode(id);
  };

  const detail = detailFor(selected, view, size);
  const deployText = view === 'teacher' ? '2.06B' : SIZE_INFO[size].deploy;
  const discardText = view === 'teacher' ? '~170M 投影器' : '~2.35M 前缀头';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'manipulation', cursor: 'pointer' }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
        aria-label="交互式架构图：点击节点查看角色、维度与参数，橙色连线为下游活动路径"
      />
      <div className="chip-row">
        {NODE_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip${selected === id ? ' selected' : ''}`}
            style={{ opacity: isApplicable(id, view) ? 1 : 0.55 }}
            onClick={() => selectNode(id)}
          >
            {NODE_LABEL[id]}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip${view === 'teacher' ? ' selected' : ''}`}
          onClick={() => switchView('teacher')}
        >
          教师
        </button>
        <button
          type="button"
          className={`chip${view === 'student' ? ' selected' : ''}`}
          onClick={() => switchView('student')}
        >
          学生
        </button>
        {SIZE_ORDER.map((sz) => (
          <button
            key={sz}
            type="button"
            className={`chip${size === sz ? ' selected' : ''}`}
            disabled={view !== 'student'}
            style={{ opacity: view === 'student' ? 1 : 0.45 }}
            onClick={() => switchSize(sz)}
          >
            {SIZE_CHIP[sz]}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <span className="val">部署编码器 {deployText}</span>
        <span className="val">训练后丢弃 {discardText}</span>
        <span className="val">已探索 {visitedCount}/9</span>
        <button type="button" onClick={reset}>
          重置探索
        </button>
      </div>
      <div
        style={{
          minHeight: 120,
          padding: '10px 14px',
          margin: '8px 0',
          background: 'rgba(215,222,234,0.35)',
          borderLeft: '3px solid #7c3aed',
          borderRadius: '0 8px 8px 0',
        }}
        aria-live="polite"
      >
        <div style={{ fontWeight: 600, color: '#21324a' }}>{NODE_LABEL[selected]}</div>
        <div style={{ color: '#21324a', marginTop: 4 }}>
          <span style={{ fontWeight: 600 }}>输入</span>：{detail.input}
        </div>
        <div style={{ color: '#21324a' }}>
          <span style={{ fontWeight: 600 }}>作用</span>：{detail.role}
        </div>
        <div style={{ color: '#21324a' }}>
          <span style={{ fontWeight: 600 }}>为什么</span>：{detail.why}
        </div>
        <div style={{ color: '#68778f' }}>
          <span style={{ fontWeight: 600 }}>规格</span>：{detail.spec}
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch8Mod1;

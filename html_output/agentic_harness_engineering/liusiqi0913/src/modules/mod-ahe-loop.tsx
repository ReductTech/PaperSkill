import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-ahe-loop — AHE 闭环总览：三层可观测性（第一章 1.2，互动版论文 Figure 2）
// 悬停高亮 + 全节点/三标注可点击 + pill 联动区域光晕；入场按流向错峰，播完静止。

const W = 1080;
const H = 520;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#f07e47',
  purple: '#7c3aed',
};

type NodeId =
  | 'harness'
  | 'coding'
  | 'env'
  | 'trace'
  | 'debugger'
  | 'evidence'
  | 'evolver'
  | 'manifest';
type PillId = 'p1' | 'p2' | 'p3';
type Sel = NodeId | PillId;

interface NodeDef {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  icon: IconKind;
  order: number;
  info: { title: string; text: string; color: string };
}

type IconKind =
  | 'robot'
  | 'globe'
  | 'log'
  | 'bug'
  | 'chart'
  | 'robotLoop'
  | 'checklist'
  | 'doc'
  | 'terminal'
  | 'layers'
  | 'tag'
  | 'miniBot'
  | 'db'
  | 'git'
  | 'code';

const NODES: NodeDef[] = [
  {
    id: 'harness', x: 30, y: 100, w: 190, h: 190, label: 'Harness 工作区', icon: 'doc', order: 0,
    info: {
      title: 'Harness 工作区',
      text: '七类可编辑组件以文件形式解耦存放，是演化智能体的显式动作空间。',
      color: C.blue,
    },
  },
  {
    id: 'coding', x: 280, y: 150, w: 130, h: 64, label: 'Coding Agent', icon: 'robot', order: 1,
    info: {
      title: 'Coding Agent',
      text: '用当前 harness 在基准任务上试运行；基座模型保持不变。',
      color: C.blue,
    },
  },
  {
    id: 'env', x: 280, y: 260, w: 130, h: 44, label: '环境', icon: 'globe', order: 2,
    info: {
      title: '环境',
      text: '任务执行与验证的沙盒环境，试运行在此进行。',
      color: C.steel,
    },
  },
  {
    id: 'trace', x: 460, y: 150, w: 130, h: 64, label: '原始轨迹', sub: '~10M token', icon: 'log', order: 3,
    info: {
      title: '原始轨迹',
      text: '每次试运行的长日志（~10M token），直接阅读会淹没信号。',
      color: C.orange,
    },
  },
  {
    id: 'debugger', x: 460, y: 280, w: 130, h: 64, label: 'Agent Debugger', icon: 'bug', order: 4,
    info: {
      title: 'Agent Debugger',
      text: '把轨迹当作可导航的文件环境逐案分析，提炼失败与成功的根因。',
      color: C.orange,
    },
  },
  {
    id: 'evidence', x: 640, y: 280, w: 130, h: 64, label: '证据语料', sub: '~10K token', icon: 'chart', order: 5,
    info: {
      title: '证据语料',
      text: '蒸馏后的分层证据（~10K token），可下钻，是演化智能体真正读取的输入。',
      color: C.green,
    },
  },
  {
    id: 'evolver', x: 820, y: 150, w: 150, h: 72, label: '演化智能体', icon: 'robotLoop', order: 6,
    info: {
      title: '演化智能体',
      text: '基于证据修改 harness 组件，并为每次编辑写下预测。',
      color: C.purple,
    },
  },
  {
    id: 'manifest', x: 380, y: 400, w: 240, h: 56, label: '变更清单', sub: '编辑+预测 → 验证 → 保留/回滚', icon: 'checklist', order: 7,
    info: {
      title: '变更清单',
      text: '编辑与预测的记录；下一轮任务级结果验证——兑现保留、未兑现回滚。',
      color: C.purple,
    },
  },
];

const PILLS: { id: PillId; cx: number; cy: number; label: string; order: number; info: { title: string; text: string } }[] = [
  {
    id: 'p1', cx: 125, cy: 70, label: 'I · 组件可观测', order: 8,
    info: {
      title: 'I · 组件可观测',
      text: '每个失败模式映射到单一组件类；每次编辑是一个 git 提交，自带文件级 diff 与回滚。',
    },
  },
  {
    id: 'p2', cx: 655, cy: 248, label: 'II · 经验可观测', order: 8,
    info: {
      title: 'II · 经验可观测',
      text: '~10M token 原始轨迹蒸馏为分层、可下钻的证据语料（~10K token），读到根因而非原始日志。',
    },
  },
  {
    id: 'p3', cx: 500, cy: 372, label: 'III · 决策可观测', order: 8,
    info: {
      title: 'III · 决策可观测',
      text: '每次编辑附带自我声明的预测，下一轮验证——每处编辑成为可证伪的契约。',
    },
  },
];

const HALO: Record<PillId, NodeId[]> = {
  p1: ['harness'],
  p2: ['trace', 'debugger', 'evidence'],
  p3: ['manifest'],
};

// Harness 工作区内部 8 行小组件
const HARNESS_ROWS: { name: string; icon: IconKind }[] = [
  { name: '系统提示词', icon: 'doc' },
  { name: '工具描述', icon: 'terminal' },
  { name: '工具实现', icon: 'terminal' },
  { name: '中间件', icon: 'layers' },
  { name: '技能', icon: 'tag' },
  { name: '子智能体配置', icon: 'miniBot' },
  { name: '长期记忆', icon: 'db' },
  { name: 'History（git 历史）', icon: 'git' },
];

export const ModAheLoop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    sel: 'harness' as Sel,
    hover: null as Sel | null,
  });
  // 解释条内容用 ref 传给 rAF 闭包，避免 setState 重跑入场动画
  const infoRef = useRef({ title: NODES[0].info.title, text: NODES[0].info.text, color: C.blue });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let mountTs = 0;

    // ---------- 小图标（线性手绘风） ----------
    const icon = (kind: IconKind, x: number, y: number, s: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      switch (kind) {
        case 'doc': {
          ctx.beginPath();
          ctx.roundRect(x - s * 0.35, y - s * 0.45, s * 0.7, s * 0.9, 2);
          ctx.stroke();
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x - s * 0.2, y - s * 0.2 + i * s * 0.2);
            ctx.lineTo(x + s * 0.2, y - s * 0.2 + i * s * 0.2);
            ctx.stroke();
          }
          break;
        }
        case 'terminal': {
          ctx.beginPath();
          ctx.roundRect(x - s * 0.45, y - s * 0.38, s * 0.9, s * 0.76, 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - s * 0.28, y - s * 0.1);
          ctx.lineTo(x - s * 0.08, y + s * 0.04);
          ctx.lineTo(x - s * 0.28, y + s * 0.18);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + s * 0.02, y + s * 0.18);
          ctx.lineTo(x + s * 0.28, y + s * 0.18);
          ctx.stroke();
          break;
        }
        case 'layers': {
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.roundRect(x - s * 0.4 + i * s * 0.06, y - s * 0.3 + i * s * 0.24, s * 0.8 - i * s * 0.12, s * 0.16, 2);
            ctx.stroke();
          }
          break;
        }
        case 'tag': {
          ctx.beginPath();
          ctx.moveTo(x - s * 0.4, y - s * 0.28);
          ctx.lineTo(x + s * 0.12, y - s * 0.28);
          ctx.lineTo(x + s * 0.4, y);
          ctx.lineTo(x - s * 0.12, y + s * 0.28);
          ctx.lineTo(x - s * 0.4, y);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x - s * 0.24, y, s * 0.05, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'miniBot':
        case 'robot': {
          const k = kind === 'robot' ? 1 : 0.85;
          ctx.beginPath();
          ctx.roundRect(x - s * 0.35 * k, y - s * 0.2 * k, s * 0.7 * k, s * 0.5 * k, 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x - s * 0.14 * k, y + s * 0.05 * k, s * 0.05 * k, 0, Math.PI * 2);
          ctx.arc(x + s * 0.14 * k, y + s * 0.05 * k, s * 0.05 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, y - s * 0.2 * k);
          ctx.lineTo(x, y - s * 0.38 * k);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y - s * 0.44 * k, s * 0.06 * k, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'robotLoop': {
          icon('robot', x - s * 0.18, y, s * 0.85, color);
          // 循环箭头
          ctx.beginPath();
          ctx.arc(x + s * 0.34, y, s * 0.18, -Math.PI * 0.4, Math.PI * 1.1);
          ctx.stroke();
          const ae = Math.PI * 1.1;
          const ax = x + s * 0.34 + s * 0.18 * Math.cos(ae);
          const ay = y + s * 0.18 * Math.sin(ae);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - s * 0.1, ay - s * 0.02);
          ctx.lineTo(ax - s * 0.02, ay - s * 0.1);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'db': {
          const rx = s * 0.38;
          const ry = s * 0.14;
          ctx.beginPath();
          ctx.ellipse(x, y - s * 0.3, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - rx, y - s * 0.3);
          ctx.lineTo(x - rx, y + s * 0.3);
          ctx.ellipse(x, y + s * 0.3, rx, ry, 0, Math.PI, 0, true);
          ctx.lineTo(x + rx, y - s * 0.3);
          ctx.stroke();
          break;
        }
        case 'git': {
          const r = s * 0.09;
          const pts: [number, number][] = [
            [x - s * 0.22, y - s * 0.3],
            [x - s * 0.22, y + s * 0.3],
            [x + s * 0.24, y],
          ];
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          ctx.lineTo(pts[1][0], pts[1][1]);
          ctx.moveTo(pts[1][0], pts[1][1]);
          ctx.quadraticCurveTo(x + s * 0.24, y + s * 0.3, pts[2][0], pts[2][1]);
          ctx.stroke();
          for (const [px, py] of pts) {
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'log': {
          icon('doc', x, y, s, color);
          ctx.beginPath();
          ctx.moveTo(x - s * 0.2, y + s * 0.32);
          ctx.lineTo(x + s * 0.1, y + s * 0.32);
          ctx.stroke();
          break;
        }
        case 'bug': {
          ctx.beginPath();
          ctx.ellipse(x, y + s * 0.08, s * 0.24, s * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y - s * 0.32, s * 0.12, 0, Math.PI * 2);
          ctx.stroke();
          for (const side of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
              const ly = y - s * 0.1 + i * s * 0.18;
              ctx.beginPath();
              ctx.moveTo(x + side * s * 0.22, ly);
              ctx.lineTo(x + side * s * 0.44, ly - s * 0.08);
              ctx.stroke();
            }
          }
          break;
        }
        case 'chart': {
          ctx.beginPath();
          ctx.moveTo(x - s * 0.4, y - s * 0.35);
          ctx.lineTo(x - s * 0.4, y + s * 0.35);
          ctx.lineTo(x + s * 0.42, y + s * 0.35);
          ctx.stroke();
          const hs = [0.3, 0.55, 0.8];
          hs.forEach((h, i) => {
            const bx = x - s * 0.22 + i * s * 0.24;
            ctx.beginPath();
            ctx.roundRect(bx, y + s * 0.35 - s * 0.6 * h, s * 0.14, s * 0.6 * h, 1);
            ctx.fill();
          });
          break;
        }
        case 'checklist': {
          ctx.beginPath();
          ctx.roundRect(x - s * 0.35, y - s * 0.45, s * 0.7, s * 0.9, 2);
          ctx.stroke();
          for (let i = 0; i < 2; i++) {
            const cy = y - s * 0.18 + i * s * 0.34;
            ctx.beginPath();
            ctx.moveTo(x - s * 0.24, cy);
            ctx.lineTo(x - s * 0.16, cy + s * 0.08);
            ctx.lineTo(x - s * 0.04, cy - s * 0.08);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + s * 0.06, cy);
            ctx.lineTo(x + s * 0.24, cy);
            ctx.stroke();
          }
          break;
        }
        case 'code': {
          ctx.beginPath();
          ctx.moveTo(x - s * 0.12, y - s * 0.22);
          ctx.lineTo(x - s * 0.4, y);
          ctx.lineTo(x - s * 0.12, y + s * 0.22);
          ctx.moveTo(x + s * 0.12, y - s * 0.22);
          ctx.lineTo(x + s * 0.4, y);
          ctx.lineTo(x + s * 0.12, y + s * 0.22);
          ctx.moveTo(x + s * 0.04, y - s * 0.3);
          ctx.lineTo(x - s * 0.04, y + s * 0.3);
          ctx.stroke();
          break;
        }
        case 'globe': {
          ctx.beginPath();
          ctx.arc(x, y, s * 0.38, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(x, y, s * 0.18, s * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - s * 0.38, y);
          ctx.lineTo(x + s * 0.38, y);
          ctx.stroke();
          break;
        }
      }
    };

    const arrowHead = (x: number, y: number, angle: number, size: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - size * Math.cos(angle - 0.42), y - size * Math.sin(angle - 0.42));
      ctx.lineTo(x - size * Math.cos(angle + 0.42), y - size * Math.sin(angle + 0.42));
      ctx.closePath();
      ctx.fill();
    };

    const nodeById = (id: NodeId) => NODES.find((n) => n.id === id)!;

    const drawNode = (n: NodeDef, a: number) => {
      if (a <= 0) return;
      const st = stateRef.current;
      const hovered = st.hover === n.id;
      const selected = st.sel === n.id;
      ctx.save();
      ctx.globalAlpha = a;
      const cx = n.x + n.w / 2;

      if (n.id === 'harness') {
        // Harness 工作区：外框 + 标题 + 8 行组件
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, n.w, n.h, 10);
        ctx.fillStyle = selected ? lerpColor(C.blue, '#ffffff', 0.9) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected || hovered ? 3 : 1.8;
        ctx.strokeStyle = selected ? C.blue : hovered ? C.blue : C.border;
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, cx, n.y + 22);
        HARNESS_ROWS.forEach((row, i) => {
          const ry = n.y + 46 + i * 17;
          icon(row.icon, n.x + 20, ry - 3.5, 11, C.steel);
          ctx.fillStyle = C.text;
          ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(row.name, n.x + 34, ry);
        });
      } else {
        const base = n.info.color;
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, n.w, n.h, 10);
        ctx.fillStyle = selected || hovered ? lerpColor(base, '#ffffff', 0.88) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : hovered ? 2.5 : 1.8;
        ctx.strokeStyle = selected || hovered ? base : C.border;
        ctx.stroke();
        const cy = n.y + n.h / 2;
        const hasSub = !!n.sub;
        icon(n.icon, cx, cy - (hasSub ? 12 : 6), n.id === 'env' ? 15 : 17, base);
        ctx.fillStyle = C.text;
        ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, cx, cy + (hasSub ? 10 : 16));
        if (hasSub) {
          ctx.fillStyle = C.muted;
          ctx.font = '10px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText(n.sub!, cx, cy + 24);
        }
      }
      ctx.restore();
    };

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 110) / 260, 0, 1);
      const st = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- 区域光晕（pill 选中时先画在底层） ----
      if (st.sel === 'p1' || st.sel === 'p2' || st.sel === 'p3') {
        const haloColor = lerpColor(C.purple, '#ffffff', 0.82);
        for (const id of HALO[st.sel]) {
          const n = nodeById(id);
          ctx.beginPath();
          ctx.roundRect(n.x - 8, n.y - 8, n.w + 16, n.h + 16, 14);
          ctx.fillStyle = haloColor;
          ctx.fill();
        }
        if (st.sel === 'p3') {
          // 回程箭头也染色
          ctx.save();
          ctx.strokeStyle = lerpColor(C.purple, '#ffffff', 0.35);
          ctx.lineWidth = 6;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(895, 230);
          ctx.lineTo(895, 428);
          ctx.lineTo(388, 428);
          ctx.lineTo(125, 428);
          ctx.lineTo(125, 300);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ---- 边（随目标节点阶次淡入） ----
      const edge = (order: number, fn: () => void) => {
        const a = aIn(order);
        if (a <= 0) return;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = C.steel;
        ctx.lineWidth = 1.8;
        fn();
        ctx.restore();
      };

      // 配置：harness → coding
      edge(1, () => {
        ctx.beginPath();
        ctx.moveTo(224, 182);
        ctx.lineTo(276, 182);
        ctx.stroke();
        arrowHead(278, 182, 0, 6, C.steel);
        ctx.fillStyle = C.muted;
        ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('配置', 250, 172);
      });
      // 试运行：coding → trace
      edge(3, () => {
        ctx.beginPath();
        ctx.moveTo(414, 182);
        ctx.lineTo(456, 182);
        ctx.stroke();
        arrowHead(458, 182, 0, 6, C.steel);
        ctx.fillStyle = C.muted;
        ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('试运行', 435, 172);
      });
      // coding ⇄ env 双向
      edge(2, () => {
        ctx.beginPath();
        ctx.moveTo(345, 216);
        ctx.lineTo(345, 254);
        ctx.stroke();
        arrowHead(345, 256, Math.PI / 2, 5, C.steel);
        arrowHead(345, 214, -Math.PI / 2, 5, C.steel);
      });
      // 蒸馏：trace ↓ debugger
      edge(4, () => {
        ctx.beginPath();
        ctx.moveTo(525, 216);
        ctx.lineTo(525, 274);
        ctx.stroke();
        arrowHead(525, 276, Math.PI / 2, 6, C.steel);
        ctx.fillStyle = C.muted;
        ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('蒸馏', 534, 250);
      });
      // debugger → evidence
      edge(5, () => {
        ctx.beginPath();
        ctx.moveTo(594, 312);
        ctx.lineTo(636, 312);
        ctx.stroke();
        arrowHead(638, 312, 0, 6, C.steel);
      });
      // trace ↗ evolver（直连）
      edge(6, () => {
        ctx.beginPath();
        ctx.moveTo(592, 168);
        ctx.quadraticCurveTo(705, 124, 816, 168);
        ctx.stroke();
        arrowHead(816, 168, Math.PI * 0.08, 6, C.steel);
      });
      // evidence ↗ evolver
      edge(6, () => {
        ctx.beginPath();
        ctx.moveTo(705, 276);
        ctx.quadraticCurveTo(768, 250, 856, 224);
        ctx.stroke();
        arrowHead(856, 224, -Math.PI * 0.14, 6, C.steel);
      });
      // 回程：evolver ↓ → 变更清单 → harness ↑（修改组件）
      edge(7, () => {
        ctx.beginPath();
        ctx.moveTo(895, 226);
        ctx.lineTo(895, 428);
        ctx.lineTo(624, 428);
        ctx.stroke();
        arrowHead(622, 428, Math.PI, 6, C.steel);
        ctx.beginPath();
        ctx.moveTo(376, 428);
        ctx.lineTo(125, 428);
        ctx.lineTo(125, 296);
        ctx.stroke();
        arrowHead(125, 294, -Math.PI / 2, 6, C.steel);
        // 修改组件标注
        icon('code', 236, 414, 13, C.steel);
        ctx.fillStyle = C.muted;
        ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('修改组件', 250, 418);
      });

      // ---- 节点 ----
      for (const n of NODES) drawNode(n, aIn(n.order));

      // ---- 可观测性 pills ----
      for (const p of PILLS) {
        const a = aIn(p.order);
        if (a <= 0) continue;
        const hovered = st.hover === p.id;
        const selected = st.sel === p.id;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
        const pw = ctx.measureText(p.label).width + 28;
        const ph = 26;
        ctx.beginPath();
        ctx.roundRect(p.cx - pw / 2, p.cy - ph / 2, pw, ph, 13);
        ctx.fillStyle = selected ? C.purple : hovered ? lerpColor(C.purple, '#ffffff', 0.75) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected || hovered ? 2.5 : 1.8;
        ctx.strokeStyle = C.purple;
        ctx.stroke();
        ctx.fillStyle = selected ? '#ffffff' : C.purple;
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.cx, p.cy + 4);
        ctx.restore();
      }
      // pill 虚线连接
      ctx.save();
      ctx.globalAlpha = aIn(8);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(125, 84);
      ctx.lineTo(125, 96);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(525, 262);
      ctx.lineTo(705, 262);
      ctx.moveTo(525, 262);
      ctx.lineTo(525, 276);
      ctx.moveTo(705, 262);
      ctx.lineTo(705, 276);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(500, 386);
      ctx.lineTo(500, 396);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ---- 底部解释条 ----
      const info = infoRef.current;
      ctx.save();
      ctx.globalAlpha = aIn(9);
      ctx.beginPath();
      ctx.roundRect(30, 468, 1020, 44, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      ctx.fillStyle = info.color;
      ctx.beginPath();
      ctx.roundRect(46, 483, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = info.color;
      ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(info.title, 70, 494);
      const tw = ctx.measureText(info.title).width;
      ctx.fillStyle = C.text;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(info.text, 70 + tw + 14, 494);
      ctx.restore();
    };

    const tick = (now: number) => {
      render(now);
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

  const hitTest = (x: number, y: number): Sel | null => {
    for (const p of PILLS) {
      const pw = 150;
      if (Math.abs(x - p.cx) <= pw / 2 && Math.abs(y - p.cy) <= 14) return p.id;
    }
    for (const n of NODES) {
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) return n.id;
    }
    return null;
  };

  const toCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  };

  const applySel = (sel: Sel) => {
    stateRef.current.sel = sel;
    const node = NODES.find((n) => n.id === sel);
    if (node) {
      infoRef.current = node.info;
    } else {
      const pill = PILLS.find((p) => p.id === sel)!;
      infoRef.current = { ...pill.info, color: C.purple };
    }
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvas(e);
    const hit = hitTest(x, y);
    if (hit) applySel(hit);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvas(e);
    stateRef.current.hover = hitTest(x, y);
  };

  const onMouseLeave = () => {
    stateRef.current.hover = null;
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      />
      <p style={{ margin: '12px 4px 0', color: 'var(--ink-2, #46536b)', fontSize: 13, lineHeight: 1.8 }}>
        AHE 的设计原则是闭环的每个阶段都必须可观测：组件、试运行经验与编辑决策分别沉淀为结构化产物——文件级组件、分层证据语料、变更清单——供演化智能体读取与行动。每次编辑都成为可证伪的预测并由下一轮验证，闭环因此能无人值守地逐轮运转。
      </p>
    </div>
  );
};

export default ModAheLoop;

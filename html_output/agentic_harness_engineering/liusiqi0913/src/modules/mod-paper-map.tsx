import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-paper-map — 第七章 7.1「论文全景：从问题到结论」（1080x380）
// 横向五节点论文结构地图（§1 问题 → §2 相关工作 → §3 方法 → §4 实验 → §5 结论），
// 点击节点 → 中部解释条；底部为论文结论条。静态，无循环动画。

const W = 1080;
const H = 380;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
};

interface MapNode {
  sec: string;
  title: string;
  kw: string[];
  color: string;
  info: string;
}

const NODES: MapNode[] = [
  {
    sec: '§1',
    title: '问题引入',
    kw: ['人工 harness 工程', '跟不上模型演进'],
    color: C.red,
    info: '编码智能体能力快速演进，但释放能力所需的 harness 依赖人工工程——模型越强，能力缺口越大。（本教程第 1 章）',
  },
  {
    sec: '§2',
    title: '相关工作',
    kw: ['harness 工程与评估', '智能体自动优化'],
    color: C.steel,
    info: '两条已有线索：harness 设计确实显著影响任务表现；而自动优化多停留在提示词层——AHE 把优化对象扩展到整个 harness。',
  },
  {
    sec: '§3',
    title: '方法',
    kw: ['三层可观测性', 'Algorithm 1 外层循环'],
    color: C.blue,
    info: '组件、经验、决策三层可观测性，把每次编辑变成可证伪的文件级契约；外层循环无人值守逐轮迭代。（本教程第 1–2 章）',
  },
  {
    sec: '§4',
    title: '实验',
    kw: ['三个研究问题', 'TB2 + 迁移探测'],
    color: C.orange,
    info: 'RQ1 定位、RQ2 迁移、RQ3 组件价值与自我归因——十轮迭代把 Terminal-Bench 2 pass@1 从 69.7% 提升到 77.0%。（本教程第 3–6 章）',
  },
  {
    sec: '§5',
    title: '结论与局限',
    kw: ['互补轴线', '三条边界'],
    color: C.green,
    info: 'harness 级演化是与模型侧训练互补的轴线；同时给出基准范围、演化操作点、自我修改治理三条局限。（本章 7.2、7.3）',
  },
];

const NODE = { y: 74, w: 176, h: 108, xs: [40, 248, 456, 664, 872] };

const DEFAULT_INFO = '点击上方五个章节节点，回顾论文每一部分做了什么、对应本教程哪里。';

export const ModPaperMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ sel: -1 });

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

    const arrowHead = (x: number, y: number, size: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - size, y - size * 0.55);
      ctx.lineTo(x - size, y + size * 0.55);
      ctx.closePath();
      ctx.fill();
    };

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 130) / 300, 0, 1);
      const st = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 区标题
      ctx.save();
      ctx.globalAlpha = aIn(0);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('论文结构地图（点击节点回顾，括号内为本教程对应章节）', 30, 34);
      ctx.restore();

      // 节点间箭头
      ctx.save();
      ctx.globalAlpha = aIn(1);
      for (let i = 0; i < NODES.length - 1; i++) {
        const x1 = NODE.xs[i] + NODE.w + 6;
        const x2 = NODE.xs[i + 1] - 6;
        const y = NODE.y + NODE.h / 2;
        ctx.strokeStyle = C.steel;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2 - 2, y);
        ctx.stroke();
        arrowHead(x2, y, 7, C.steel);
      }
      ctx.restore();

      // 五个节点
      NODES.forEach((n, i) => {
        const x = NODE.xs[i];
        const selected = st.sel === i;
        ctx.save();
        ctx.globalAlpha = aIn(i + 1);
        ctx.beginPath();
        ctx.roundRect(x, NODE.y, NODE.w, NODE.h, 10);
        ctx.fillStyle = selected ? lerpColor(n.color, '#ffffff', 0.86) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.8;
        ctx.strokeStyle = selected ? n.color : C.border;
        ctx.stroke();
        // 章节号 chip
        ctx.beginPath();
        ctx.roundRect(x + 14, NODE.y + 14, 34, 20, 10);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11.5px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.sec, x + 31, NODE.y + 28);
        // 标题
        ctx.fillStyle = C.text;
        ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(n.title, x + 56, NODE.y + 29);
        // 关键词
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
        n.kw.forEach((k, j) => ctx.fillText(`· ${k}`, x + 14, NODE.y + 58 + j * 20));
        ctx.restore();
      });

      // 中部解释条
      const info = st.sel >= 0 ? NODES[st.sel] : null;
      ctx.save();
      ctx.globalAlpha = aIn(6);
      ctx.beginPath();
      ctx.roundRect(30, 208, 1020, 56, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = info ? info.color : C.border;
      ctx.stroke();
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      if (info) {
        ctx.fillStyle = info.color;
        ctx.font = 'bold 13.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(`${info.sec} ${info.title}`, 52, 232);
        ctx.fillStyle = C.text;
        ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(info.info, 52, 252);
      } else {
        ctx.fillStyle = C.muted;
        ctx.fillText(DEFAULT_INFO, 52, 241);
      }
      ctx.restore();

      // 底部结论条（蓝框）
      ctx.save();
      ctx.globalAlpha = aIn(7);
      ctx.beginPath();
      ctx.roundRect(30, 288, 1020, 64, 10);
      ctx.fillStyle = lerpColor(C.blue, '#ffffff', 0.9);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = C.blue;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('论文结论', 54, 312);
      ctx.fillStyle = C.text;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(
        'harness 级演化是一条与模型侧训练互补的轴线——一个外部化、可审计的表面，编码智能体的经验可以在此累积，而基座模型保持固定。',
        54,
        336
      );
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

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < NODES.length; i++) {
      const nx = NODE.xs[i];
      if (x >= nx && x <= nx + NODE.w && y >= NODE.y && y <= NODE.y + NODE.h) {
        stateRef.current.sel = stateRef.current.sel === i ? -1 : i;
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
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
    </div>
  );
};

export default ModPaperMap;

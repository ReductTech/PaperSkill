import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-fig4 — 第六章 6.2「自我归因有多可靠：Figure 4」（1080x320）
// 忠实复现论文 Figure 4：左右双面板分组柱——深蓝＝跨迭代均值，浅蓝＝随机基线。
// 左：修复预测（33.7/6.5、51.4/10.6，≈5×）；右：回归预测（11.8/5.6、11.1/5.4，≈2×）。
// 点击柱子查看该指标含义；下方为分析。

const W = 1080;
const H = 320;

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

const LIGHT_BLUE = '#a9c3e8';

interface Metric {
  label: string;
  mean: number;
  rand: number;
  fb: string;
}
interface Panel {
  title: string;
  badge: string;
  badgeColor: string;
  max: number;
  ticks: number[];
  metrics: Metric[];
}

const PANELS: Panel[] = [
  {
    title: '修复预测（Fix）',
    badge: '≈5× 随机',
    badgeColor: C.green,
    max: 55,
    ticks: [0, 10, 20, 30, 40, 50],
    metrics: [
      {
        label: '精确率',
        mean: 33.7,
        rand: 6.5,
        fb: '修复精确率 33.7%（随机 6.5%）：清单点名「下一轮会修好」的任务中，真被修好的比例——约为随机的 5 倍，循环瞄准的是证据驱动的真实靶子',
      },
      {
        label: '召回率',
        mean: 51.4,
        rand: 10.6,
        fb: '修复召回率 51.4%（随机 10.6%）：实际被修好的任务中，被清单提前点名的比例——超过一半的修复被提前预见',
      },
    ],
  },
  {
    title: '回归预测（Regression）',
    badge: '≈2× 随机',
    badgeColor: C.red,
    max: 13,
    ticks: [0, 5, 10],
    metrics: [
      {
        label: '精确率',
        mean: 11.8,
        rand: 5.6,
        fb: '回归精确率 11.8%（随机 5.6%）：清单标记「有回归风险」的任务中，真回退的比例——仅为随机的 2 倍',
      },
      {
        label: '召回率',
        mean: 11.1,
        rand: 5.4,
        fb: '回归召回率 11.1%（随机 5.4%）：实际回退的任务中，被提前标记的比例——多数即将发生的回归无法预见，这正是曲线非单调抖动的来源',
      },
    ],
  },
];

const PANEL_X = [50, 570];
const PANEL_W = 460;
const BASE_Y = 246;
const MAX_H = 150;
const BAR_W = 56;
const BAR_GAP = 14;
const GROUP_GAP = 110;

const DEFAULT_FB = '点击任一根柱子，查看该指标的含义；深蓝＝演化智能体自我预测的跨迭代均值，浅蓝＝随机预测基线';

interface BarRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fb: string;
}

export const ModFig4: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const barsRef = useRef<BarRect[]>([]);
  const [feedback, setFeedback] = useState(DEFAULT_FB);

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

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const elapsed = now - mountTs;
      barsRef.current = [];

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 顶部图例（与论文一致）
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      let lx = W / 2 - 150;
      ctx.fillStyle = C.blue;
      ctx.fillRect(lx, 10, 14, 14);
      ctx.fillStyle = C.muted;
      ctx.fillText('跨迭代均值', lx + 20, 22);
      lx += 120;
      ctx.fillStyle = LIGHT_BLUE;
      ctx.fillRect(lx, 10, 14, 14);
      ctx.fillStyle = C.muted;
      ctx.fillText('随机基线', lx + 20, 22);

      PANELS.forEach((panel, pi) => {
        const px = PANEL_X[pi];
        // 面板标题 + 倍数徽章
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(panel.title, px + PANEL_W / 2, 52);
        const bw = 92;
        ctx.beginPath();
        ctx.roundRect(px + PANEL_W - bw, 38, bw, 22, 11);
        ctx.fillStyle = panel.badgeColor;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(panel.badge, px + PANEL_W - bw / 2, 53);

        // y 轴刻度与网格
        ctx.font = '10.5px "Segoe UI", sans-serif';
        panel.ticks.forEach((tv) => {
          const y = BASE_Y - (tv / panel.max) * MAX_H;
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 40, y);
          ctx.lineTo(px + PANEL_W - 10, y);
          ctx.stroke();
          ctx.fillStyle = C.muted;
          ctx.textAlign = 'right';
          ctx.fillText(String(tv), px + 32, y + 4);
        });
        // 基线
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 40, BASE_Y);
        ctx.lineTo(px + PANEL_W - 10, BASE_Y);
        ctx.stroke();

        // 两组柱
        panel.metrics.forEach((m, gi) => {
          const gx = px + 70 + gi * (BAR_W * 2 + BAR_GAP + GROUP_GAP);
          const p = easeOutCubic(clamp((elapsed - 200 - (pi * 2 + gi) * 160) / 600, 0, 1));
          const bars = [
            { v: m.mean, color: C.blue },
            { v: m.rand, color: LIGHT_BLUE },
          ];
          bars.forEach((b, bi) => {
            const bh = (b.v / panel.max) * MAX_H * p;
            const bx = gx + bi * (BAR_W + BAR_GAP);
            ctx.fillStyle = b.color;
            ctx.fillRect(bx, BASE_Y - bh, BAR_W, bh);
            if (p > 0.4) {
              ctx.fillStyle = bi === 0 ? C.text : C.muted;
              ctx.font = `${bi === 0 ? 'bold ' : ''}12.5px "Segoe UI", sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText(`${(b.v * p).toFixed(1)}%`, bx + BAR_W / 2, BASE_Y - bh - 8);
            }
            barsRef.current.push({ x: bx, y: BASE_Y - (b.v / panel.max) * MAX_H, w: BAR_W, h: (b.v / panel.max) * MAX_H, fb: m.fb });
          });
          // 组标签
          ctx.fillStyle = C.text;
          ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.label, gx + BAR_W + BAR_GAP / 2, BASE_Y + 20);
        });
      });

      // 底部脚注
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('9 个评估轮次的跨迭代均值：第 N−1 轮清单的预测 ∩ 第 N 轮 89 个任务的真实结果（Figure 4）', W / 2, H - 12);
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
    for (const b of barsRef.current) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= BASE_Y) {
        setFeedback(b.fb);
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
      <div className="feedback">{feedback}</div>
      <div className="mod-note">
        <p>
          <b>修复一侧≈5× 随机：</b>循环的瞄准是证据驱动而非猜测——每次编辑落在真实、被智能体提前预见的靶子上。
        </p>
        <p>
          <b>回归一侧≈2× 随机：</b>智能体说得出这次编辑为什么有用，却说不清它会破坏什么——多数回归无法预见，这正是
          §4.2 演化曲线非单调抖动的来源。补上回归盲区，是论文点名的未来自演化循环最明确的改进方向。
        </p>
      </div>
    </div>
  );
};

export default ModFig4;

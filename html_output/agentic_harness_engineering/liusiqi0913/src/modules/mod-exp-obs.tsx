import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-exp-obs — 经验可观测性（第二章 2.2）
// 上区：两个 agent 的分工图（Coding Agent 跑 / Agent Debugger 读），节点可点；
// 下区：三层证据钻取（点击层卡展开论文真实案例示例）。静态，无循环动画。

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
  red: '#c43f52',
};

type TopId = 'coding' | 'trace' | 'debugger' | 'evidence';

const TOP_CARDS: { id: TopId; x: number; w: number; title: string; sub: string; color: string; info: string }[] = [
  {
    id: 'coding', x: 30, w: 210, title: 'Coding Agent · 跑', sub: '基准每任务 k 次试运行', color: C.blue,
    info: '对基准每个任务做 k=2 次试运行，产生原始轨迹——经验的来源；基座模型保持不变。',
  },
  {
    id: 'trace', x: 280, w: 180, title: '原始轨迹', sub: '~10M token', color: C.red,
    info: '错误与成功模式散落在上百万 token 的原始消息里，直接阅读会淹没信号。',
  },
  {
    id: 'debugger', x: 530, w: 220, title: 'Agent Debugger · 读', sub: '逐案分析根因', color: C.orange,
    info: '把轨迹当作可导航的文件环境：每条消息一个文件，用通用 shell/脚本工具逐案分析失败根因或成功模式。',
  },
  {
    id: 'evidence', x: 790, w: 180, title: '证据语料', sub: '~10K token', color: C.green,
    info: '单任务报告聚合成基准总览，是每轮迭代的入口文档——演化智能体读结论而非原始日志。',
  },
];

const TOP_Y = 56;
const TOP_H = 140;

const LAYERS = [
  {
    name: '基准总览', tag: '每轮入口',
    lines: ['高频失败模式：以行数自检冒充验证（iter2 案例）', '→ 演化智能体先读这里，锁定失败模式'],
  },
  {
    name: '单任务报告', tag: '含 pass/fail',
    lines: ['db-wal-recovery：失败 · 根因：缓存 stdout、臆造 value = id×100', '→ 逐案给出根因，供演化智能体定位修复点'],
  },
  {
    name: '原始轨迹', tag: '可回查',
    lines: ['[msg] $ wc -l output.txt —— 以行数冒充验证', '→ 报告中的论断可回查原文，避免转述失真'],
  },
];

const LAYER = { y: 268, w: 300, h: 52, xs: [90, 390, 690] };

export const ModExpObs: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ top: 'coding' as TopId, layer: 0 });

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

    // 线性小图标（与 1.2 同风格）
    const drawIcon = (kind: string, x: number, y: number, s: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (kind === 'robot') {
        ctx.beginPath();
        ctx.roundRect(x - s * 0.35, y - s * 0.2, s * 0.7, s * 0.5, 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - s * 0.14, y + s * 0.05, s * 0.05, 0, Math.PI * 2);
        ctx.arc(x + s * 0.14, y + s * 0.05, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.2);
        ctx.lineTo(x, y - s * 0.38);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y - s * 0.44, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 'log') {
        ctx.beginPath();
        ctx.roundRect(x - s * 0.35, y - s * 0.45, s * 0.7, s * 0.9, 2);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x - s * 0.2, y - s * 0.24 + i * s * 0.18);
          ctx.lineTo(x + s * (i % 2 ? 0.1 : 0.2), y - s * 0.24 + i * s * 0.18);
          ctx.stroke();
        }
      } else if (kind === 'bug') {
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
      } else if (kind === 'chart') {
        ctx.beginPath();
        ctx.moveTo(x - s * 0.4, y - s * 0.35);
        ctx.lineTo(x - s * 0.4, y + s * 0.35);
        ctx.lineTo(x + s * 0.42, y + s * 0.35);
        ctx.stroke();
        [0.3, 0.55, 0.8].forEach((h, i) => {
          const bx = x - s * 0.22 + i * s * 0.24;
          ctx.beginPath();
          ctx.roundRect(bx, y + s * 0.35 - s * 0.6 * h, s * 0.14, s * 0.6 * h, 1);
          ctx.fill();
        });
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

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 140) / 280, 0, 1);
      const st = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ===== 上区：两个 agent 的分工 =====
      ctx.save();
      ctx.globalAlpha = aIn(0);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('两个 agent 的分工：一个跑出经验，一个读懂经验（点击卡片查看）', 30, 24);

      const iconOf: Record<TopId, string> = { coding: 'robot', trace: 'log', debugger: 'bug', evidence: 'chart' };
      TOP_CARDS.forEach((card, i) => {
        const selected = st.top === card.id;
        ctx.beginPath();
        ctx.roundRect(card.x, TOP_Y, card.w, TOP_H, 10);
        ctx.fillStyle = selected ? lerpColor(card.color, '#ffffff', 0.88) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.8;
        ctx.strokeStyle = selected ? card.color : C.border;
        ctx.stroke();
        const cx = card.x + card.w / 2;
        drawIcon(iconOf[card.id], cx, TOP_Y + 40, 26, card.color);
        ctx.fillStyle = C.text;
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(card.title, cx, TOP_Y + 84);
        ctx.fillStyle = C.muted;
        ctx.font = '11.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(card.sub, cx, TOP_Y + 106);
        if (card.id === 'trace') {
          ctx.fillStyle = C.red;
          ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('信号淹没在百万 token 中', cx, TOP_Y + 126);
        }
        if (card.id === 'evidence') {
          ctx.fillStyle = C.green;
          ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('每轮迭代的入口', cx, TOP_Y + 126);
        }
        // 箭头
        if (i < TOP_CARDS.length - 1) {
          const ax1 = card.x + card.w + 6;
          const ax2 = TOP_CARDS[i + 1].x - 6;
          ctx.strokeStyle = C.steel;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ax1, TOP_Y + TOP_H / 2);
          ctx.lineTo(ax2 - 2, TOP_Y + TOP_H / 2);
          ctx.stroke();
          arrowHead(ax2, TOP_Y + TOP_H / 2, 0, 6, C.steel);
        }
      });
      // 中间转化标注：轨迹 → 文件环境
      ctx.fillStyle = C.muted;
      ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('轨迹即文件环境', 495, TOP_Y + TOP_H / 2 - 16);
      ctx.fillText('每条消息一个文件', 495, TOP_Y + TOP_H / 2 + 28);
      // 证据语料 → 演化智能体
      ctx.fillStyle = C.green;
      ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
      //ctx.fillText('→ 演化智能体读取', 880, TOP_Y + TOP_H + 18);
      ctx.restore();

      // 上/下分隔线
      ctx.save();
      ctx.globalAlpha = aIn(1) * 0.7;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 232);
      ctx.lineTo(1050, 232);
      ctx.stroke();
      ctx.restore();

      // ===== 下区：三层证据钻取 =====
      ctx.save();
      ctx.globalAlpha = aIn(1);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('三层证据 · 渐进式披露（点击层卡查看论文案例示例）', 30, 254);

      LAYERS.forEach((layer, i) => {
        const lx = LAYER.xs[i];
        const selected = st.layer === i;
        ctx.beginPath();
        ctx.roundRect(lx, LAYER.y, LAYER.w, LAYER.h, 8);
        ctx.fillStyle = selected ? lerpColor(C.blue, '#ffffff', 0.86) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.8;
        ctx.strokeStyle = selected ? C.blue : C.border;
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${layer.name}`, lx + 16, LAYER.y + 24);
        ctx.fillStyle = C.muted;
        ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(layer.tag, lx + 16, LAYER.y + 41);
        if (i >2) {
          const ax1 = lx + LAYER.w + 6;
          const ax2 = LAYER.xs[i + 1] - 6;
          ctx.strokeStyle = C.steel;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ax1, LAYER.y + LAYER.h / 2);
          ctx.lineTo(ax2 - 2, LAYER.y + LAYER.h / 2);
          ctx.stroke();
          arrowHead(ax2, LAYER.y + LAYER.h / 2, 0, 6, C.steel);
          ctx.fillStyle = C.muted;
          ctx.font = '10px "Segoe UI", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('', (ax1 + ax2) / 2, LAYER.y + LAYER.h / 2 - 10);
        }
      });

      // 示例面板
      const layer = LAYERS[st.layer];
      ctx.beginPath();
      ctx.roundRect(90, 344, 900, 84, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 12.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`示例 · ${layer.name}`, 110, 370);
      ctx.fillStyle = C.text;
      ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(layer.lines[0], 110, 394);
      ctx.fillStyle = C.muted;
      ctx.fillText(layer.lines[1], 110, 416);

      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('先读结论、需要时再下钻——token 花在决策点上；每个论断都可回查原文。', W / 2, 452);
      ctx.restore();

      // 底部解释条（上区点击）
      const info = TOP_CARDS.find((c) => c.id === st.top)!;
      ctx.save();
      ctx.globalAlpha = aIn(2);
      ctx.beginPath();
      ctx.roundRect(30, 468, 1020, 40, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      ctx.fillStyle = info.color;
      ctx.beginPath();
      ctx.roundRect(46, 481, 14, 14, 3);
      ctx.fill();
      ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(info.title, 70, 494);
      const tw = ctx.measureText(info.title).width;
      ctx.fillStyle = C.text;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(info.info, 70 + tw + 14, 494);
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
    for (const card of TOP_CARDS) {
      if (x >= card.x && x <= card.x + card.w && y >= TOP_Y && y <= TOP_Y + TOP_H) {
        stateRef.current.top = card.id;
        return;
      }
    }
    for (let i = 0; i < LAYERS.length; i++) {
      const lx = LAYER.xs[i];
      if (x >= lx && x <= lx + LAYER.w && y >= LAYER.y && y <= LAYER.y + LAYER.h) {
        stateRef.current.layer = i;
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

export default ModExpObs;

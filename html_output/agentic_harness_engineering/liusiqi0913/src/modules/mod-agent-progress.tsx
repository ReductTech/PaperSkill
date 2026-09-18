import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-agent-progress — Coding Agent 的进展来源：语言模型 vs 外围工程组件
// （论文 Introduction：进展不仅依赖底层语言模型，也同样依赖外围工程组件；
// 系统提示词/工具/中间件点击查看功能简介。静态图，仅入场一次性淡入）

const W = 1080;
const H = 340;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
};

// 语言模型面板（整块可点击）
const LM = { x: 30, y: 40, w: 300, h: 190 };
// 外围工程组件面板
const COMP = { x: 370, y: 40, w: 680, h: 190 };
// 三个子组件框
const SUB = { y: 110, w: 190, h: 80, xs: [395, 625, 855] };
// 底部详情条
const DETAIL = { x: 30, y: 250, w: 1020, h: 50 };

type Sel = 'lm' | 0 | 1 | 2;

const SUB_NAMES = ['系统提示词', '工具', '中间件'];

const INTROS: Record<string, { title: string; text: string; color: string }> = {
  lm: { title: '语言模型', text: '进展的底层引擎：决定智能体的推理与代码能力。', color: C.blue },
  '0': { title: '系统提示词', text: '塑造智能体的工作方式与风格。', color: C.green },
  '1': { title: '工具', text: '向智能体开放文件系统与 shell。', color: C.green },
  '2': { title: '中间件', text: '控制上下文、执行与故障恢复。', color: C.green },
};

export const ModAgentProgress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ sel: Sel }>({ sel: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let startTs = 0;

    const render = (now: number) => {
      if (!startTs) startTs = now;
      const elapsed = now - startTs;
      const a = (order: number) => clamp((elapsed - order * 70) / 240, 0, 1);
      const sel = stateRef.current.sel;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 左：语言模型面板
      ctx.save();
      ctx.globalAlpha = a(0);
      ctx.beginPath();
      ctx.roundRect(LM.x, LM.y, LM.w, LM.h, 10);
      ctx.fillStyle = sel === 'lm' ? lerpColor(C.blue, '#ffffff', 0.88) : C.panel;
      ctx.fill();
      ctx.lineWidth = sel === 'lm' ? 3 : 2;
      ctx.strokeStyle = C.blue;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 20px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('语言模型', LM.x + LM.w / 2, LM.y + 88);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('点击查看简介', LM.x + LM.w / 2, LM.y + 116);
      ctx.restore();

      // 右：外围工程组件面板
      ctx.save();
      ctx.globalAlpha = a(1);
      ctx.beginPath();
      ctx.roundRect(COMP.x, COMP.y, COMP.w, COMP.h, 10);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.font = 'bold 15px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('外围工程组件', COMP.x + 18, COMP.y + 30);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('模型之外 · 可编辑', COMP.x + 118, COMP.y + 30);
      ctx.restore();

      // 三个子组件框
      for (let i = 0; i < 3; i++) {
        const selected = sel === i;
        ctx.save();
        ctx.globalAlpha = a(2 + i);
        ctx.beginPath();
        ctx.roundRect(SUB.xs[i], SUB.y, SUB.w, SUB.h, 8);
        ctx.fillStyle = selected ? lerpColor(C.green, '#ffffff', 0.88) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 2;
        ctx.strokeStyle = C.green;
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(SUB_NAMES[i], SUB.xs[i] + SUB.w / 2, SUB.y + 36);
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('点击查看简介', SUB.xs[i] + SUB.w / 2, SUB.y + 58);
        ctx.restore();
      }

      // 底部详情条
      const intro = INTROS[String(sel)];
      ctx.save();
      ctx.globalAlpha = a(5);
      ctx.beginPath();
      ctx.roundRect(DETAIL.x, DETAIL.y, DETAIL.w, DETAIL.h, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = intro.color;
      ctx.stroke();
      ctx.fillStyle = intro.color;
      ctx.beginPath();
      ctx.roundRect(DETAIL.x + 14, DETAIL.y + 13, 10, 24, 3);
      ctx.fill();
      ctx.fillStyle = intro.color;
      ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(intro.title, DETAIL.x + 36, DETAIL.y + 31);
      const tw = ctx.measureText(intro.title).width;
      ctx.fillStyle = C.text;
      ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(intro.text, DETAIL.x + 36 + tw + 14, DETAIL.y + 31);
      ctx.restore();

      // 结论行：统称为 harness
      ctx.save();
      ctx.globalAlpha = a(6);
      ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
      const t1 = '这些模型之外、可编辑的组件统称为 agent 的 ';
      const t2 = 'harness';
      const t3 = ' —— 它与语言模型同等重要。';
      const w1 = ctx.measureText(t1).width;
      ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
      const w2 = ctx.measureText(t2).width;
      ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
      const w3 = ctx.measureText(t3).width;
      const sx = (W - w1 - w2 - w3) / 2;
      ctx.textAlign = 'left';
      ctx.fillStyle = C.text;
      ctx.fillText(t1, sx, 326);
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(t2, sx + w1, 326);
      ctx.fillStyle = C.text;
      ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(t3, sx + w1 + w2, 326);
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
    if (x >= LM.x && x <= LM.x + LM.w && y >= LM.y && y <= LM.y + LM.h) {
      stateRef.current.sel = 'lm';
      return;
    }
    for (let i = 0; i < 3; i++) {
      if (x >= SUB.xs[i] && x <= SUB.xs[i] + SUB.w && y >= SUB.y && y <= SUB.y + SUB.h) {
        stateRef.current.sel = i as Sel;
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

export default ModAgentProgress;

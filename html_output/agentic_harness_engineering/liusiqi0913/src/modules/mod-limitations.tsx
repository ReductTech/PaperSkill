import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-limitations — 第七章 7.2「三条局限：论文自己划定的边界」（1080x360）
// 三张大卡横排，点击 → 下方展开面板（是什么 / 对解读结论意味着什么）。静态，无循环动画。

const W = 1080;
const H = 360;

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

interface Limitation {
  title: string;
  gist: string;
  color: string;
  what: string;
  mean: string;
}

const LIMITS: Limitation[] = [
  {
    title: '① 基准范围',
    gist: '演化只在 TB2，迁移只探 SWE-bench-verified',
    color: C.blue,
    what: '更多编程语言、仓库级部署、人在环工作流都还没有测试——目前的证据只覆盖两个基准。',
    mean: '结论不要外推到这些未测场景；论文明确提醒：这是一个有前景但高方差的设置，结论范围应相应解读。',
  },
  {
    title: '② 演化操作点',
    gist: '步数预算与超时按 GPT-5.4 high 拟合',
    color: C.orange,
    what: '跨模型数字同时包含「harness 可移植性」与「操作点耦合」两种效应——同家族三个推理档位的非单调正源于此。',
    mean: '要解开两者，需要在多个操作点下重跑演化循环；在此之前，跨模型增益的读数要保留这个前提。',
  },
  {
    title: '③ 自我修改治理',
    gist: '有边界，但没有完整防护栈',
    color: C.red,
    what: '工作区边界、清单归因、文件级回滚都在，但长程 harness 清理与更强的防滥用机制仍不完整。',
    mean: 'AHE 应被视为受控研究原型，而非成熟的自主自改进系统——这是论文给自己的定位。',
  },
];

const CARD = { y: 64, w: 320, h: 118, xs: [40, 380, 720] };

const DEFAULT_INFO = '点击上方卡片，查看每条局限「是什么」以及「对解读结论意味着什么」。';

export const ModLimitations: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ sel: 0 });

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
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 140) / 300, 0, 1);
      const st = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 区标题
      ctx.save();
      ctx.globalAlpha = aIn(0);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('论文自己划定的三条边界（点击卡片展开）', 30, 34);
      ctx.restore();

      // 三张大卡
      LIMITS.forEach((lim, i) => {
        const x = CARD.xs[i];
        const selected = st.sel === i;
        ctx.save();
        ctx.globalAlpha = aIn(i + 1);
        ctx.beginPath();
        ctx.roundRect(x, CARD.y, CARD.w, CARD.h, 10);
        ctx.fillStyle = selected ? lerpColor(lim.color, '#ffffff', 0.88) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.8;
        ctx.strokeStyle = selected ? lim.color : C.border;
        ctx.stroke();
        ctx.fillStyle = lim.color;
        ctx.font = 'bold 15px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(lim.title, x + 18, CARD.y + 32);
        ctx.fillStyle = C.text;
        ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(lim.gist, x + 18, CARD.y + 58);
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(selected ? '▲ 已展开' : '▼ 点击展开', x + 18, CARD.y + CARD.h - 18);
        ctx.restore();
      });

      // 展开面板
      const lim = LIMITS[st.sel];
      ctx.save();
      ctx.globalAlpha = aIn(4);
      ctx.beginPath();
      ctx.roundRect(40, 208, 1000, 122, 10);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = lim.color;
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = lim.color;
      ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('是什么', 64, 240);
      ctx.fillStyle = C.text;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(lim.what, 64, 262);
      ctx.fillStyle = lim.color;
      ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('对解读结论意味着什么', 64, 292);
      ctx.fillStyle = C.text;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(lim.mean, 64, 314);
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
    for (let i = 0; i < LIMITS.length; i++) {
      const cx = CARD.xs[i];
      if (x >= cx && x <= cx + CARD.w && y >= CARD.y && y <= CARD.y + CARD.h) {
        stateRef.current.sel = i;
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
      <div className="feedback">{DEFAULT_INFO}</div>
    </div>
  );
};

export default ModLimitations;

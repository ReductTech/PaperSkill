import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-setup — 第三章 3.2「实验设置：基准、协议与模型」
// 四张横排设置卡（基准 / 协议 / 模型 / 迁移探测），点击 → 底部解释条。静态，无循环动画。

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

interface SetupCard {
  id: string;
  title: string;
  sub: string;
  color: string;
  info: string;
}

const CARDS: SetupCard[] = [
  {
    id: 'bench',
    title: '基准 · Terminal-Bench 2',
    sub: '89 任务 · 每任务 1 小时超时',
    color: C.blue,
    info: '89 个终端任务：4 easy / 55 medium / 30 hard。每任务超时 1 小时——超时按失败计入 pass@1。',
  },
  {
    id: 'protocol',
    title: '协议 · k=2 + pass@1',
    sub: '严格口径：异常计失败',
    color: C.steel,
    info: '每任务跑 k=2 次试运行，指标为 pass@1 严格口径：超时与基础设施异常一律计失败，不丢样本。',
  },
  {
    id: 'model',
    title: '模型 · GPT-5.4 high',
    sub: '三个角色共用同一底座',
    color: C.orange,
    info: 'Coding Agent、Agent Debugger、演化智能体共用 GPT-5.4 high——增益被隔离到 harness 编辑，而非分析或编辑能力差异。',
  },
  {
    id: 'transfer',
    title: '迁移探测 · 换任务换模型',
    sub: 'SWE-bench-verified + 5 底座',
    color: C.purple,
    info: '冻结 harness 搬到 SWE-bench-verified（500 任务 / 7 仓库），并在 5 个替代底座上复测',
  },
];

const CARD = { y: 64, w: 246, h: 196, xs: [30, 288, 546, 804] };

const DEFAULT_INFO = '点击上方卡片，查看基准构成、评估协议、模型配置与迁移探测的设计理由。';

export const ModSetup: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ sel: 'bench' });

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
      ctx.fillText('实验设置一览（论文 §4.1，点击卡片查看）', 30, 34);
      ctx.restore();

      // 四张设置卡
      CARDS.forEach((card, i) => {
        const x = CARD.xs[i];
        const selected = st.sel === card.id;
        ctx.save();
        ctx.globalAlpha = aIn(i + 1);
        ctx.beginPath();
        ctx.roundRect(x, CARD.y, CARD.w, CARD.h, 10);
        ctx.fillStyle = selected ? lerpColor(card.color, '#ffffff', 0.88) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.8;
        ctx.strokeStyle = selected ? card.color : C.border;
        ctx.stroke();

        ctx.fillStyle = card.color;
        ctx.font = 'bold 13.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(card.title, x + 18, CARD.y + 34);
        ctx.fillStyle = C.muted;
        ctx.font = '11.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(card.sub, x + 18, CARD.y + 56);

        if (card.id === 'bench') {
          // 难度构成比例条：4 / 55 / 30
          const segs = [
            { label: 'easy 4', v: 4, color: C.green },
            { label: 'medium 55', v: 55, color: C.blue },
            { label: 'hard 30', v: 30, color: C.red },
          ];
          const bx = x + 18;
          const bw = CARD.w - 36;
          const by = CARD.y + 84;
          ctx.fillStyle = C.text;
          ctx.font = 'bold 22px "Segoe UI", sans-serif';
          ctx.fillText('89', bx, by - 8);
          ctx.fillStyle = C.muted;
          ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('个任务', bx + 42, by - 8);
          let sx = bx;
          segs.forEach((seg) => {
            const sw = (seg.v / 89) * bw;
            ctx.fillStyle = seg.color;
            ctx.fillRect(sx, by, Math.max(sw - 2, 3), 22);
            sx += sw;
          });
          ctx.font = '10.5px "Segoe UI", sans-serif';
          ctx.fillText('easy 4', bx, by + 40);
          ctx.fillStyle = C.muted;
          ctx.textAlign = 'center';
          ctx.fillText('medium 55', bx + bw / 2, by + 40);
          ctx.textAlign = 'right';
          ctx.fillText('hard 30', bx + bw, by + 40);
          ctx.textAlign = 'left';
          ctx.fillStyle = C.muted;
          ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('聚合指标被 55 个 Medium 主导', bx, by + 62);
          ctx.fillText('——第 6 章还会提到这一点', bx, by + 78);
        } else if (card.id === 'protocol') {
          const bx = x + 18;
          ctx.fillStyle = C.text;
          ctx.font = 'bold 22px "Segoe UI", sans-serif';
          ctx.fillText('k = 2', bx, CARD.y + 100);
          ctx.fillStyle = C.muted;
          ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('次试运行 / 任务', bx + 58, CARD.y + 100);
          // 两个试运行小方块
          for (let j = 0; j < 2; j++) {
            ctx.beginPath();
            ctx.roundRect(bx + j * 30, CARD.y + 118, 22, 22, 4);
            ctx.fillStyle = lerpColor(C.steel, '#ffffff', 0.7);
            ctx.fill();
            ctx.strokeStyle = C.steel;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          ctx.fillStyle = C.muted;
          ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('pass@1 = 全部任务 × 全部试运行', bx, CARD.y + 162);
          ctx.fillText('的二值奖励平均', bx, CARD.y + 178);
        } else if (card.id === 'model') {
          const bx = x + 18;
          const roles = ['Coding Agent', 'Agent Debugger', '演化智能体'];
          roles.forEach((r, j) => {
            ctx.beginPath();
            ctx.roundRect(bx, CARD.y + 78 + j * 30, CARD.w - 36, 24, 6);
            ctx.fillStyle = lerpColor(C.orange, '#ffffff', 0.85);
            ctx.fill();
            ctx.fillStyle = C.text;
            ctx.font = '11.5px "Segoe UI", "PingFang SC", sans-serif';
            ctx.fillText(r, bx + 10, CARD.y + 94 + j * 30);
          });
          ctx.fillStyle = C.muted;
          ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('同一底座 → 增益只可能来自 harness', bx, CARD.y + 186);
        } else {
          const bx = x + 18;
          ctx.fillStyle = C.text;
          ctx.font = 'bold 15px "Segoe UI", sans-serif';
          ctx.fillText('SWE-bench-verified', bx, CARD.y + 92);
          ctx.fillStyle = C.muted;
          ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('500 任务 · 7 仓库 · 冻结迁移', bx, CARD.y + 112);
          ctx.fillStyle = C.text;
          ctx.font = 'bold 15px "Segoe UI", sans-serif';
          ctx.fillText('+ 5 个替代底座', bx, CARD.y + 142);
          ctx.fillStyle = C.muted;
          ctx.font = '10.5px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('GPT-5.4 med/xhigh · qwen-3.6-plus', bx, CARD.y + 162);
          ctx.fillText('gemini-3.1-flash-lite · deepseek-v4-flash', bx, CARD.y + 178);
        }
        ctx.restore();
      });

      // 底部解释条
      const info = CARDS.find((c) => c.id === st.sel);
      ctx.save();
      ctx.globalAlpha = aIn(5);
      ctx.beginPath();
      ctx.roundRect(30, 292, 1020, 48, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.border;
      ctx.stroke();
      if (info) {
        ctx.fillStyle = info.color;
        ctx.beginPath();
        ctx.roundRect(46, 309, 14, 14, 3);
        ctx.fill();
        ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(info.title, 70, 320);
        const tw = ctx.measureText(info.title).width;
        ctx.fillStyle = C.text;
        ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(info.info, 70 + tw + 14, 320);
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(DEFAULT_INFO, 52, 321);
      }
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
    for (let i = 0; i < CARDS.length; i++) {
      const cx = CARD.xs[i];
      if (x >= cx && x <= cx + CARD.w && y >= CARD.y && y <= CARD.y + CARD.h) {
        stateRef.current.sel = CARDS[i].id;
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

export default ModSetup;

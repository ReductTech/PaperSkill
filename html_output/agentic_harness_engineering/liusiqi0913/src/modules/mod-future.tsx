import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-future — 第七章 7.3「未来方向」（1080x320）
// 四张方向卡，点击 → 底部解释条给出论文原话依据；末行为全教程收束句。静态，无循环动画。

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

interface Direction {
  title: string;
  gist: string;
  color: string;
  info: string;
}

const DIRECTIONS: Direction[] = [
  {
    title: '补上回归盲区',
    gist: '让循环能预见「这次编辑会破坏什么」',
    color: C.red,
    info: '论文原文：补上回归预测这一差距，是未来自演化循环「最明确的改进方向」（§4.4.2）——目前回归预测仅为随机的约 2 倍。',
  },
  {
    title: '交互感知的演化',
    gist: '处理组件间的非加性干扰',
    color: C.purple,
    info: '论文在 RQ3a 末尾明确留下 interaction-aware evolution：Hard 上 memory-only 反超完整 AHE 的折中，有待能感知组件交互的演化来解开。',
  },
  {
    title: '多操作点重跑',
    gist: '解开可移植性与超时预算的耦合',
    color: C.orange,
    info: '在多个步数预算 / 超时组合下重跑演化循环，才能把「harness 可移植性」从「操作点耦合」中分离出来（局限②）。',
  },
  {
    title: '更广验证 + 完整治理',
    gist: '更多语言 / 仓库级 / 人在环 + 防护栈',
    color: C.green,
    info: '更多编程语言、仓库级部署、人在环工作流的验证（局限①），以及长程清理与防滥用——从受控原型走向成熟系统（局限③）。',
  },
];

const CARD = { y: 64, w: 240, h: 128, xs: [40, 295, 550, 805] };

const DEFAULT_INFO = '点击上方卡片，查看每个方向在论文中的出处与依据。';

export const ModFuture: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      ctx.fillText('论文点名的改进方向（点击卡片查看依据）', 30, 34);
      ctx.restore();

      // 四张方向卡
      DIRECTIONS.forEach((d, i) => {
        const x = CARD.xs[i];
        const selected = st.sel === i;
        ctx.save();
        ctx.globalAlpha = aIn(i + 1);
        ctx.beginPath();
        ctx.roundRect(x, CARD.y, CARD.w, CARD.h, 10);
        ctx.fillStyle = selected ? lerpColor(d.color, '#ffffff', 0.86) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1.8;
        ctx.strokeStyle = selected ? d.color : C.border;
        ctx.stroke();
        ctx.fillStyle = d.color;
        ctx.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(d.title, x + 16, CARD.y + 32);
        ctx.fillStyle = C.text;
        ctx.font = '11.5px "Segoe UI", "PingFang SC", sans-serif';
        // gist 按宽度折两行
        const gist = d.gist;
        if (ctx.measureText(gist).width > CARD.w - 32) {
          const mid = Math.ceil(gist.length / 2);
          ctx.fillText(gist.slice(0, mid), x + 16, CARD.y + 58);
          ctx.fillText(gist.slice(mid), x + 16, CARD.y + 76);
        } else {
          ctx.fillText(gist, x + 16, CARD.y + 58);
        }
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(selected ? '▲ 已选中' : '▼ 点击查看依据', x + 16, CARD.y + CARD.h - 16);
        ctx.restore();
      });

      // 底部解释条
      const d = DIRECTIONS[st.sel];
      ctx.save();
      ctx.globalAlpha = aIn(5);
      ctx.beginPath();
      ctx.roundRect(40, 216, 1000, 52, 8);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = d.color;
      ctx.stroke();
      ctx.fillStyle = d.color;
      ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(d.title, 62, 240);
      ctx.fillStyle = C.text;
      ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(d.info, 62, 260);
      ctx.restore();

      // 收束句
      ctx.save();
      ctx.globalAlpha = aIn(6);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('教程到此结束：从 harness 的更新之困，到三层可观测性，到三问实证，再到论文自己划定的边界。', W / 2, 300);
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
    for (let i = 0; i < DIRECTIONS.length; i++) {
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

export default ModFuture;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  GUIDE,
  OK,
  BAD,
  EMPH,
  INK,
  MUTED,
  LINE,
  WOOD,
} from './woodKit';
import type { WidgetProps } from './registry';

// Module 10.2 (1080x280): how to read the 46.9% figure honestly. Four single-select
// entries on the left; the long explanation is rendered in the DOM under the canvas
// (a fixed-height detail region), never drawn inside the Canvas.

const W = 1080;
const H = 280;

const CARD_X = 24;
const CARD_W = 416;
const CARD_H = 48;
const CARD_GAP = 12;
const CARD_Y0 = 30;

const FRAME_X = 476;
const FRAME_Y = 30;
const FRAME_W = 580;
const FRAME_H = 228;
const IN_X = FRAME_X + 24;
const IN_Y = FRAME_Y + 24;
const IN_W = FRAME_W - 48;
const IN_H = FRAME_H - 48;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
const ORANGE = '#f07e47';
const ORANGE_SOFT = 'rgba(240, 126, 71, 0.12)';

type ItemId = 'metric' | 'mh' | 'bug' | 'limit';

interface ItemDef {
  id: ItemId;
  title: string;
  chip: string;
  detail: string;
  cls: string;
  orange?: boolean;
}

const ITEMS: ItemDef[] = [
  {
    id: 'metric',
    title: '提升口径',
    chip: '1 提升口径',
    detail:
      '46.9% 是按任务计算 (最强方法 − 最强基线)/最强基线 后再取平均，不是把 15 个任务的成功率直接平均。',
    cls: '',
  },
  {
    id: 'mh',
    title: 'mh 列',
    chip: '2 被忽略的 mh 列',
    detail: '计算时忽略了 mh（多人示教）列，因此这个数字只覆盖 ph 与单列任务。',
    cls: '',
    orange: true,
  },
  {
    id: 'bug',
    title: '评测 bug',
    chip: '3 评测代码 bug',
    detail:
      '作者在致谢中说明评测代码有一个 bug，robomimic 任务实际只用了 22 个初始条件而非 50 个；所有方法同样受影响。',
    cls: '',
    orange: true,
  },
  {
    id: 'limit',
    title: '自陈局限',
    chip: '4 论文自陈局限',
    detail:
      '论文自陈：继承行为克隆的固有问题、计算与推理延迟高于 LSTM-GMM，可能不适合需要高控制频率的任务。',
    cls: 'bad',
  },
];

const IDLE_DETAIL = '点击任意条目，核对这个提升数字的口径与边界。';

function schematic(ctx: CanvasRenderingContext2D, id: ItemId): void {
  if (id === 'metric') {
    // per-task relative improvement, then averaged
    const x0 = IN_X + 14;
    const tw = 240;
    const gaps = [0.34, 0.62, 0.28, 0.58];
    for (let i = 0; i < 4; i++) {
      const y = IN_Y + 6 + i * 20;
      ctx.fillStyle = BAD;
      ctx.fillRect(x0, y, tw * 0.5, 6);
      ctx.fillStyle = OK;
      ctx.fillRect(x0, y + 8, tw * 0.5 * (1 + gaps[i]), 6);
    }
    const bx = IN_X + 300;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - 18, IN_Y + 8);
    ctx.lineTo(bx, IN_Y + 8);
    ctx.lineTo(bx, IN_Y + 70);
    ctx.lineTo(bx - 18, IN_Y + 70);
    ctx.stroke();
    ctx.fillStyle = GUIDE;
    ctx.fillRect(bx + 20, IN_Y + 28, 132, 16);
    ctx.font = '18px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = GUIDE;
    ctx.fillText('46.9', bx + 162, IN_Y + 43);
    return;
  }

  if (id === 'mh') {
    // the mh column is excluded
    const cw = 100;
    const ch = 46;
    const gap = 10;
    const cx0 = IN_X + 60;
    const cy0 = IN_Y + 42;
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        const x = cx0 + col * (cw + gap);
        const y = cy0 + row * (ch + gap);
        ctx.fillStyle = col === 1 ? LINE : '#ffffff';
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = col === 1 ? LINE : GUIDE;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.75, y + 0.75, cw - 1.5, ch - 1.5);
        if (col !== 1) {
          ctx.fillStyle = OK;
          ctx.fillRect(x + 14, y + ch - 18, (cw - 28) * (row === 0 ? 0.72 : 0.5), 6);
        }
      }
    }
    ctx.strokeStyle = BAD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx0 + cw + gap + 8, cy0 + 4);
    ctx.lineTo(cx0 + cw + gap + cw - 8, cy0 + 2 * ch + gap - 4);
    ctx.stroke();
    return;
  }

  if (id === 'bug') {
    // 50 planned initialisations, 22 actually run
    const gx = IN_X + 36;
    const gy = IN_Y + 40;
    const dot = 12;
    for (let i = 0; i < 50; i++) {
      const x = gx + (i % 10) * dot;
      const y = gy + Math.floor(i / 10) * dot;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      if (i < 22) {
        ctx.fillStyle = EMPH;
        ctx.fill();
      } else {
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    const tx = gx + 10 * dot + 34;
    ctx.font = '20px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = MUTED;
    ctx.fillText('50', tx, gy + 10);
    ctx.strokeStyle = BAD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx - 2, gy + 4);
    ctx.lineTo(tx + 34, gy + 4);
    ctx.stroke();
    ctx.fillStyle = EMPH;
    ctx.fillText('22', tx, gy + 48);
    return;
  }

  // limit: compute and inference latency, with the high-rate control budget
  const lx = IN_X + 26;
  const ly = IN_Y + 52;
  ctx.fillStyle = WOOD;
  ctx.fillRect(lx, ly, 128, 14);
  ctx.fillStyle = EMPH;
  ctx.fillRect(lx, ly + 36, 248, 14);
  ctx.strokeStyle = BAD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx + 322, ly - 18);
  ctx.lineTo(lx + 322, ly + 68);
  ctx.stroke();
  ctx.strokeStyle = GUIDE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(lx + 408, ly + 26, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lx + 408, ly + 26);
  ctx.lineTo(lx + 408, ly + 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lx + 408, ly + 26);
  ctx.lineTo(lx + 420, ly + 32);
  ctx.stroke();
}

export const M102: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{
    itemId: ItemId | null;
    alphas: Record<ItemId, number>;
  }>({
    itemId: null,
    alphas: { metric: 0, mh: 0, bug: 0, limit: 0 },
  });
  const [itemId, setItemId] = useState<ItemId | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { itemId: ItemId | null; alphas: Record<ItemId, number> }) => {
      clearScene(ctx, W, H);

      for (let i = 0; i < ITEMS.length; i++) {
        const item = ITEMS[i];
        const cy = CARD_Y0 + i * (CARD_H + CARD_GAP);
        const a = s.alphas[item.id];
        const on = s.itemId === item.id;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(CARD_X, cy, CARD_W, CARD_H);
        if (a > 0.02) {
          ctx.globalAlpha = 0.55 * a;
          ctx.fillStyle = GUIDE;
          ctx.fillRect(CARD_X, cy, CARD_W, CARD_H);
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(CARD_X + 0.75, cy + 0.75, CARD_W - 1.5, CARD_H - 1.5);
        if (a > 0.02) {
          ctx.globalAlpha = a;
          ctx.strokeStyle = GUIDE;
          ctx.lineWidth = 3;
          ctx.strokeRect(CARD_X + 1.5, cy + 1.5, CARD_W - 3, CARD_H - 3);
          ctx.fillStyle = ORANGE;
          ctx.fillRect(CARD_X, cy, 6, CARD_H * a);
          ctx.globalAlpha = 1;
        }

        ctx.font = '20px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillStyle = on ? GUIDE : MUTED;
        ctx.fillText(String(i + 1), CARD_X + 26, cy + 32);

        if (on) {
          ctx.globalAlpha = a;
          ctx.font = '16px ' + FONT;
          ctx.fillStyle = INK;
          ctx.fillText(item.title, CARD_X + 58, cy + 31);
          ctx.globalAlpha = 1;
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(FRAME_X + 0.75, FRAME_Y + 0.75, FRAME_W - 1.5, FRAME_H - 1.5);

      const active = s.itemId;
      if (active) {
        ctx.globalAlpha = s.alphas[active];
        schematic(ctx, active);
        ctx.globalAlpha = 1;
      } else {
        ctx.setLineDash([7, 7]);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.strokeRect(IN_X + 56, IN_Y + 30, IN_W - 112, IN_H - 60);
        ctx.setLineDash([]);
        ctx.fillStyle = GUIDE;
        ctx.beginPath();
        ctx.arc(IN_X + IN_W / 2, IN_Y + IN_H / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      const s = stateRef.current;
      const k = clamp(dt / 90, 0, 1);
      for (const item of ITEMS) {
        const target = s.itemId === item.id ? 1 : 0;
        s.alphas[item.id] = s.alphas[item.id] + (target - s.alphas[item.id]) * k;
      }
      render(s);
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

  const toggle = (id: ItemId) => {
    const next = itemId === id ? null : id;
    stateRef.current.itemId = next;
    setItemId(next);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (let i = 0; i < ITEMS.length; i++) {
      const cy = CARD_Y0 + i * (CARD_H + CARD_GAP);
      if (x >= CARD_X && x <= CARD_X + CARD_W && y >= cy && y <= cy + CARD_H) {
        toggle(ITEMS[i].id);
        return;
      }
    }
  };

  const active = ITEMS.find((it) => it.id === itemId);
  const style: React.CSSProperties = { minHeight: 88 };
  if (active && active.orange) {
    style.color = ORANGE;
    style.background = ORANGE_SOFT;
    style.borderLeftColor = ORANGE;
  }

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className={'chip' + (itemId === item.id ? ' selected' : '')}
            onClick={() => toggle(item.id)}
          >
            {item.chip}
          </button>
        ))}
      </div>
      <div className={'feedback ' + (active ? active.cls : '')} style={style}>
        {active ? active.detail : IDLE_DETAIL}
      </div>
    </div>
  );
};

export default M102;

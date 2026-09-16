import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutBounce, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 module mod-permissions (P6 drag): 六张操作卡拖到绿色「允许」区或红色「禁止」区。
// 正确归属：①②⑤→允许；③④⑥→禁止（runs/ 只读：读允许，写禁止）。1080x300。
const W = 1080;
const H = 300;

const BG = '#f4f6f8';
const TEXT = '#21324a';
const MUTED = '#68778f';
const GREEN = '#228d5c';
const RED = '#c43f52';
const BORDER = '#d7deea';

type PadName = 'allow' | 'deny';

const CW = 170;
const CH = 64;

interface CardDef {
  id: number;
  lines: string[];
  short: string;
  correct: PadName;
  okFeedback: { text: string; cls: string };
  wrongFeedback: { text: string; cls: string };
}

const CARDS: CardDef[] = [
  {
    id: 1,
    lines: ['改 workspace/ 里的', '工具实现'],
    short: '① 改 workspace/ 里的工具实现',
    correct: 'allow',
    okFeedback: { text: '对：工作区内的工具编辑，就是一次可回滚的 commit。', cls: 'good' },
    wrongFeedback: { text: '改工作区里的工具实现是合法编辑——它该去允许区。', cls: 'bad' },
  },
  {
    id: 2,
    lines: ['读取 runs/ 里的', '失败轨迹'],
    short: '② 读取 runs/ 里的失败轨迹',
    correct: 'allow',
    okFeedback: {
      text: '正确：runs/ 只读——读证据是常态操作，写结果才是禁区',
      cls: 'good',
    },
    wrongFeedback: {
      text: 'runs/ 只读：可以读，不能写——读失败轨迹是合法操作，该去允许区。',
      cls: 'bad',
    },
  },
  {
    id: 3,
    lines: ['编辑 runs/ 里的', '运行结果'],
    short: '③ 编辑 runs/ 里的运行结果',
    correct: 'deny',
    okFeedback: { text: '对：运行记录是成绩底账，只读，谁都改不得。', cls: 'good' },
    wrongFeedback: { text: '编辑 runs/ 的结果等于改成绩单——之后所有数字都不再可信。', cls: 'bad' },
  },
  {
    id: 4,
    lines: ['调高模型的', '推理预算'],
    short: '④ 调高模型的推理预算',
    correct: 'deny',
    okFeedback: { text: '对：推理预算属于 LLM 配置，动它会让增益无法归因。', cls: 'good' },
    wrongFeedback: {
      text: '改模型配置是最隐蔽的捷径：分数涨了，但那不是 Harness 的功劳',
      cls: 'bad',
    },
  },
  {
    id: 5,
    lines: ['在 middleware/ 新增', '钩子'],
    short: '⑤ 在 middleware/ 新增钩子',
    correct: 'allow',
    okFeedback: { text: '对：中间件钩子写在工作区，合法且可回滚。', cls: 'good' },
    wrongFeedback: { text: 'middleware/ 在工作区里，加钩子正是进化智能体的本职。', cls: 'bad' },
  },
  {
    id: 6,
    lines: ['删除种子系统提示词', '中的原始规则'],
    short: '⑥ 删除种子系统提示词中的原始规则',
    correct: 'deny',
    okFeedback: { text: '对：种子提示词的原始规则是所有迭代的共同参照系。', cls: 'good' },
    wrongFeedback: { text: '种子规则不可删——它是所有迭代共同的参照系', cls: 'bad' },
  },
];

const PADS: Record<PadName, { x: number; y: number; w: number; h: number; title: string; sub: string }> = {
  allow: { x: 25, y: 110, w: 500, h: 175, title: '允许', sub: 'workspace/ 可写' },
  deny: { x: 555, y: 110, w: 500, h: 175, title: '禁止', sub: '只读 · 不可改' },
};

const slotPos = (pad: PadName, slot: number) => {
  const p = PADS[pad];
  const col = slot % 2;
  const row = Math.floor(slot / 2);
  return { x: p.x + 40 + col * 220, y: p.y + 44 + row * 67 };
};

const homePos = (i: number) => ({ x: 15 + i * 177, y: 16 });

interface CardState {
  x: number;
  y: number;
  state: 'home' | 'drag' | 'anim' | 'placed';
  pad: PadName | null;
  slot: number;
  anim: { fx: number; fy: number; tx: number; ty: number; t0: number; dur: number; bounce: boolean } | null;
  wrongUntil: number;
}

const NUMS = ['①', '②', '③', '④', '⑤', '⑥'];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const DEFAULT_FEEDBACK = {
  text: '把每张操作卡拖到它该去的区域：绿色允许，红色禁止。',
  cls: '',
};
const DONE_FEEDBACK = {
  text: '边界清楚了：增益只能来自 Harness 文件，这就是可归因的工程含义',
  cls: 'good',
};

const hitPad = (cx: number, cy: number): PadName | null => {
  for (const name of Object.keys(PADS) as PadName[]) {
    const r = PADS[name];
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return name;
  }
  return null;
};

export const ModPermissions: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardsRef = useRef<CardState[]>(
    CARDS.map((_, i) => ({
      x: homePos(i).x,
      y: homePos(i).y,
      state: 'home',
      pad: null,
      slot: -1,
      anim: null,
      wrongUntil: 0,
    }))
  );
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const padCountRef = useRef<Record<PadName, number>>({ allow: 0, deny: 0 });
  const rafRef = useRef<number | null>(null);
  const [, setTick] = useState(0);
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const cards = cardsRef.current;
      // advance animations
      cards.forEach((c) => {
        if (c.state === 'anim' && c.anim) {
          const p = clamp((now - c.anim.t0) / c.anim.dur, 0, 1);
          const e = c.anim.bounce ? easeOutBounce(p) : easeInOutQuad(p);
          c.x = c.anim.fx + (c.anim.tx - c.anim.fx) * e;
          c.y = c.anim.fy + (c.anim.ty - c.anim.fy) * e;
          if (p >= 1) {
            if (c.anim.bounce) c.state = 'placed';
            else c.state = 'home';
            c.anim = null;
          }
        }
      });

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // zone panels
      (Object.keys(PADS) as PadName[]).forEach((name) => {
        const p = PADS[name];
        const color = name === 'allow' ? GREEN : RED;
        ctx.fillStyle = name === 'allow' ? 'rgba(34,141,92,0.08)' : 'rgba(196,63,82,0.08)';
        roundRect(ctx, p.x, p.y, p.w, p.h, 10);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.title} · ${p.sub}`, p.x + p.w / 2, p.y + 24);
        ctx.textAlign = 'left';
        // slot outlines
        for (let s = 0; s < 4; s++) {
          const sp = slotPos(name, s);
          ctx.strokeStyle = 'rgba(104,119,143,0.35)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          roundRect(ctx, sp.x, sp.y, CW, CH, 6);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // cards (dragging one last = on top)
      const order = [...cards.keys()].sort((a, b) => {
        const da = cards[a].state === 'drag' ? 1 : 0;
        const db = cards[b].state === 'drag' ? 1 : 0;
        return da - db;
      });
      order.forEach((i) => {
        const c = cards[i];
        const def = CARDS[i];
        const wrong = now < c.wrongUntil;
        ctx.save();
        if (c.state === 'drag') {
          ctx.shadowColor = 'rgba(33,50,74,0.35)';
          ctx.shadowBlur = 14;
          ctx.shadowOffsetY = 5;
        }
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, c.x, c.y, CW, CH, 8);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = wrong ? RED : c.state === 'placed' ? GREEN : BORDER;
        ctx.lineWidth = c.state === 'placed' || wrong ? 3 : 2;
        roundRect(ctx, c.x, c.y, CW, CH, 8);
        ctx.stroke();
        // circled number
        ctx.fillStyle = wrong ? RED : c.state === 'placed' ? GREEN : MUTED;
        ctx.font = 'bold 15px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(NUMS[i], c.x + 10, c.y + 22);
        // card text lines
        ctx.fillStyle = TEXT;
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        def.lines.forEach((ln, li) => {
          ctx.fillText(ln, c.x + 34, c.y + 22 + li * 16);
        });
        // placed check mark
        if (c.state === 'placed') {
          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(c.x + CW - 20, c.y + 12);
          ctx.lineTo(c.x + CW - 14, c.y + 18);
          ctx.lineTo(c.x + CW - 6, c.y + 8);
          ctx.stroke();
        }
        ctx.restore();
      });

      // completion badge (flat check chip)
      if (cards.every((c) => c.state === 'placed' || (c.state === 'anim' && c.anim?.bounce))) {
        ctx.save();
        ctx.translate(W / 2, 98);
        ctx.fillStyle = 'rgba(34,141,92,0.12)';
        roundRect(ctx, -52, -14, 104, 28, 14);
        ctx.fill();
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-34, 6);
        ctx.lineTo(-24, -6);
        ctx.stroke();
        ctx.fillStyle = GREEN;
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('分类完成', -16, 5);
        ctx.restore();
      }
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

  const toCanvas = (ev: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * W,
      y: ((ev.clientY - rect.top) / rect.height) * H,
    };
  };

  const applyVerdict = (idx: number, pad: PadName) => {
    const def = CARDS[idx];
    const c = cardsRef.current[idx];
    if (def.correct === pad) {
      const slot = padCountRef.current[pad]++;
      const sp = slotPos(pad, slot);
      c.state = 'anim';
      c.pad = pad;
      c.slot = slot;
      c.anim = { fx: c.x, fy: c.y, tx: sp.x, ty: sp.y, t0: performance.now(), dur: 320, bounce: true };
      const allPlaced =
        cardsRef.current.filter((cc, ii) => ii !== idx && (cc.state === 'placed' || cc.pad !== null))
          .length +
          1 ===
        CARDS.length;
      setFeedback(allPlaced ? DONE_FEEDBACK : def.okFeedback);
    } else {
      const hp = homePos(idx);
      c.state = 'anim';
      c.anim = { fx: c.x, fy: c.y, tx: hp.x, ty: hp.y, t0: performance.now(), dur: 380, bounce: false };
      c.wrongUntil = performance.now() + 700;
      setFeedback(def.wrongFeedback);
    }
    setTick((v) => v + 1);
  };

  const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(ev);
    for (let i = cardsRef.current.length - 1; i >= 0; i--) {
      const c = cardsRef.current[i];
      if (c.state !== 'home') continue;
      if (p.x >= c.x && p.x <= c.x + CW && p.y >= c.y && p.y <= c.y + CH) {
        c.state = 'drag';
        dragRef.current = { id: i, dx: p.x - c.x, dy: p.y - c.y };
        ev.currentTarget.setPointerCapture(ev.pointerId);
        break;
      }
    }
  };

  const onPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toCanvas(ev);
    const c = cardsRef.current[d.id];
    c.x = clamp(p.x - d.dx, 0, W - CW);
    c.y = clamp(p.y - d.dy, 0, H - CH);
  };

  const onPointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    const c = cardsRef.current[d.id];
    const p = toCanvas(ev);
    const cx = clamp(p.x - d.dx, 0, W - CW) + CW / 2;
    const cy = clamp(p.y - d.dy, 0, H - CH) + CH / 2;
    const pad = hitPad(cx, cy);
    if (pad) {
      applyVerdict(d.id, pad);
    } else {
      const hp = homePos(d.id);
      c.state = 'anim';
      c.anim = { fx: c.x, fy: c.y, tx: hp.x, ty: hp.y, t0: performance.now(), dur: 300, bounce: false };
    }
  };

  const placeByButton = (idx: number, pad: PadName) => {
    const c = cardsRef.current[idx];
    if (c.state === 'placed' || c.pad !== null) return;
    if (c.state === 'anim') return;
    applyVerdict(idx, pad);
  };

  const reset = () => {
    cardsRef.current = CARDS.map((_, i) => ({
      x: homePos(i).x,
      y: homePos(i).y,
      state: 'home',
      pad: null,
      slot: -1,
      anim: null,
      wrongUntil: 0,
    }));
    padCountRef.current = { allow: 0, deny: 0 };
    dragRef.current = null;
    setFeedback(DEFAULT_FEEDBACK);
    setTick((v) => v + 1);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div className="ctrl" style={{ gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {CARDS.map((def, i) => {
          const placed = cardsRef.current[i].state === 'placed' || cardsRef.current[i].pad !== null;
          return (
            <span key={def.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#68778f' }}>{NUMS[i]}</span>
              <button
                type="button"
                className="chip"
                disabled={placed}
                onClick={() => placeByButton(i, 'allow')}
              >
                允许
              </button>
              <button
                type="button"
                className="chip"
                disabled={placed}
                onClick={() => placeByButton(i, 'deny')}
              >
                禁止
              </button>
            </span>
          );
        })}
        <button type="button" className="chip" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModPermissions;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, bar, clearScene, drawBox, drawCard, label } from './scene';

const W = 1080;
const H = 280;

type CardId = 'class' | 'data' | 'domain';
type Feedback = { text: string; cls: string; color?: string };

type SettingsState = {
  placed: { class: boolean; data: boolean; domain: boolean };
  drag: { id: CardId | null; x: number; y: number };
  wrong: { id: string | null; until: number };
};

const TRACK_X = 40;
const TRACK_W = 980;

const TRACKS: { id: CardId; name: string; label: string; y: number; h: number }[] = [
  { id: 'class', name: '类别增量', label: '类增量', y: 8, h: 54 },
  { id: 'data', name: '数据增量', label: '数增量', y: 66, h: 54 },
  { id: 'domain', name: '域增量', label: '域增量', y: 124, h: 54 },
];

const CARDS: { id: CardId; text: string; x: number; y: number; w: number; h: number }[] = [
  { id: 'class', text: '新类别', x: 96, y: 192, w: 176, h: 48 },
  { id: 'data', text: '新样本', x: 452, y: 192, w: 176, h: 48 },
  { id: 'domain', text: '新风格', x: 808, y: 192, w: 176, h: 48 },
];

/* ImageNet100 5 tasks / DomainNet 6 tasks；三组来自不同数据集与协议。 */
const VALUES: Record<CardId, [number, number, number]> = {
  class: [63.1, 68.2, 80.4],
  data: [74.0, 73.3, 80.3],
  domain: [50.3, 55.5, 57.2],
};

// 三根柱始终是「微调 / CaSSLe / 离线」，三种设定用同一套颜色，
// 否则读者没法把同一条轨道的三个数对应到三种策略。
const BAR_COLORS: Record<CardId, [string, string, string]> = {
  class: [C.muted, C.green, C.wood],
  data: [C.muted, C.green, C.wood],
  domain: [C.muted, C.green, C.wood],
};

// 每组结果用的基座方法不同，必须写在界面上，否则读者会当成同一方法的三种设定。
const METHOD: Record<CardId, string> = {
  class: 'Barlow',
  data: 'BYOL',
  domain: 'Barlow',
};

const FB: Record<CardId, Feedback> = {
  class: {
    text: '类别不重叠、旧数据丢弃。图示为 Barlow +5.1；论文六种方法平均 +4%。三组数据来自不同数据集与协议，不可互相比较。',
    cls: 'good',
  },
  data: {
    text: '每个任务都可能含全部类别，记住过去没那么重要。图示 BYOL 为 −0.7，是六种方法里唯一低于微调的。三组数据来自不同数据集与协议，不可互相比较。',
    cls: '',
    color: C.orange,
  },
  domain: {
    text: '数据域变了、类别不变。图示为 Barlow +5.2；论文六种方法平均 +4.4%。三组数据来自不同数据集与协议，不可互相比较。',
    cls: 'good',
  },
};

const WRONG_FB: Feedback = { text: '这张卡说的是另一种划分，再试一次。', cls: 'bad' };
const IDLE_FB: Feedback = { text: '把下方任一张卡拖到它对应的轨道上。', cls: '' };

const CLASS_COLORS = [C.blue, C.purple, C.dark, C.wood, C.muted];

function feedbackStyle(f: Feedback): React.CSSProperties | undefined {
  if (!f.color) return undefined;
  return { color: f.color, borderLeftColor: f.color, fontStyle: 'normal' };
}

/** 域增量：同一轮廓、不同填充纹理。 */
function texture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = C.dark;
  ctx.fillStyle = C.dark;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = 1.5;
  if (kind === 0) {
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * k) / 5, y);
      ctx.lineTo(x + (w * k) / 5, y + h);
      ctx.stroke();
    }
  } else if (kind === 1) {
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x, y + (h * k) / 4);
      ctx.lineTo(x + w, y + (h * k) / 4);
      ctx.stroke();
    }
  } else if (kind === 2) {
    for (let k = -3; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 9, y + h);
      ctx.lineTo(x + k * 9 + h, y);
      ctx.stroke();
    }
  } else if (kind === 3) {
    for (let k = -3; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 9, y);
      ctx.lineTo(x + k * 9 + h, y + h);
      ctx.stroke();
    }
  } else if (kind === 4) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.beginPath();
        ctx.arc(x + 7 + c * ((w - 12) / 3), y + 6 + r * ((h - 10) / 2), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * k) / 4, y);
      ctx.lineTo(x + (w * k) / 4, y + h);
      ctx.stroke();
    }
    for (let k = 1; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x, y + (h * k) / 3);
      ctx.lineTo(x + w, y + (h * k) / 3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** 槽位内的几何图案：暗示该设定的划分方式，不写字。 */
function drawPattern(
  ctx: CanvasRenderingContext2D,
  id: CardId,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): void {
  const n = id === 'domain' ? 6 : 5;
  const gap = id === 'domain' ? 7 : 8;
  const bw = (sw - (n - 1) * gap) / n;
  for (let i = 0; i < n; i++) {
    const bx = sx + i * (bw + gap);
    if (id === 'class') {
      drawBox(ctx, bx, sy, bw, sh, CLASS_COLORS[i], undefined, 4);
    } else if (id === 'data') {
      drawBox(ctx, bx, sy, bw, sh, C.white, C.border, 4);
      for (let k = 0; k < 5; k++) {
        ctx.save();
        ctx.fillStyle = CLASS_COLORS[k];
        ctx.beginPath();
        ctx.arc(bx + bw * ((k + 0.5) / 5), sy + sh / 2, Math.min(4, bw / 10), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      drawBox(ctx, bx, sy, bw, sh, C.white, C.dark, 4);
      texture(ctx, bx + 2, sy + 2, bw - 4, sh - 4, i);
    }
  }
}

function renderSettings(ctx: CanvasRenderingContext2D, s: SettingsState, time: number): void {
  clearScene(ctx, W, H);
  const dragging = s.drag.id !== null;

  for (const tr of TRACKS) {
    const done = s.placed[tr.id];
    const hot = dragging && !done;
    ctx.save();
    ctx.globalAlpha = hot ? 0.3 : 0.16;
    drawBox(ctx, TRACK_X, tr.y, TRACK_W, tr.h, C.light, undefined, 12);
    ctx.restore();
    drawBox(ctx, TRACK_X, tr.y, TRACK_W, tr.h, undefined, hot ? C.orange : C.border, 12);
    label(ctx, tr.label, 48, tr.y + 24, 15, done ? C.green : C.ink);
    label(ctx, METHOD[tr.id], 48, tr.y + 41, 10, C.muted);
    drawBox(ctx, 100, tr.y + 7, 320, 40, C.white, done ? C.green : C.border, 8);
    drawPattern(ctx, tr.id, 112, tr.y + 12, 296, 30);

    if (!done) continue;

    const card = CARDS.find((c) => c.id === tr.id);
    if (card) drawCard(ctx, 430, tr.y + 14, 110, 26, card.text, 'ok');

    const vals = VALUES[tr.id];
    const cols = BAR_COLORS[tr.id];
    for (let i = 0; i < 3; i++) {
      const by = tr.y + 6 + i * 16;
      // 上限取 85 而不是 100：这三组数都在 50–80 之间，用 100 会把差距压平。
      bar(ctx, 570, by, 360, 11, vals[i], 85, cols[i]);
      label(ctx, vals[i].toFixed(1), 940, by + 5.5, 12, C.ink);
    }
  }

  // 图例：每组的三个数依次是微调 / CaSSLe / 离线
  const legend: [string, string][] = [
    ['微调', C.muted],
    ['CaSSLe', C.green],
    ['离线', C.wood],
  ];
  let lx = 44;
  for (const [t, c] of legend) {
    drawBox(ctx, lx, 252, 12, 12, c, undefined, 3);
    label(ctx, t, lx + 18, 262, 12, C.muted);
    lx += 88;
  }

  for (const c of CARDS) {
    if (s.placed[c.id]) continue;
    if (s.drag.id === c.id) {
      drawCard(ctx, s.drag.x - c.w / 2, s.drag.y - c.h / 2, c.w, c.h, c.text, 'drag');
      continue;
    }
    const flashing = s.wrong.id === c.id && time < s.wrong.until;
    const blink = flashing && Math.floor((s.wrong.until - time) / 110) % 2 === 0;
    const shake = flashing ? Math.sin(time / 45) * 4 : 0;
    drawCard(ctx, c.x + shake, c.y, c.w, c.h, c.text, blink ? 'bad' : 'idle');
  }
}

export const Ch7Settings: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<SettingsState>({
    placed: { class: false, data: false, domain: false },
    drag: { id: null, x: 0, y: 0 },
    wrong: { id: null, until: 0 },
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(IDLE_FB);
  const [selCard, setSelCard] = useState<CardId | null>(null);
  const [placed, setPlaced] = useState<{ class: boolean; data: boolean; domain: boolean }>({
    class: false,
    data: false,
    domain: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf: number | null = null;
    const tick = (time: number) => {
      renderSettings(ctx, stateRef.current, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  /** 一次放置：==一次拖放，键盘与指针共用。 */
  const place = (cardId: CardId, trackId: CardId) => {
    const s = stateRef.current;
    if (cardId === trackId) {
      const next = { ...s.placed };
      next[cardId] = true;
      stateRef.current = { ...s, placed: next, drag: { id: null, x: 0, y: 0 } };
      setPlaced(next);
      setFeedback(FB[cardId]);
      setSelCard(null);
    } else {
      stateRef.current = {
        ...s,
        drag: { id: null, x: 0, y: 0 },
        wrong: { id: cardId, until: performance.now() + 520 },
      };
      setFeedback(WRONG_FB);
    }
  };

  const local = (el: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height),
    };
  };

  const endDrag = () => {
    if (!stateRef.current.drag.id) return;
    stateRef.current = { ...stateRef.current, drag: { id: null, x: 0, y: 0 } };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const p = local(canvas, e.clientX, e.clientY);
    const card = CARDS.find(
      (c) =>
        !stateRef.current.placed[c.id] &&
        p.x >= c.x &&
        p.x <= c.x + c.w &&
        p.y >= c.y &&
        p.y <= c.y + c.h
    );
    if (!card) return;
    canvas.setPointerCapture(e.pointerId);
    stateRef.current = { ...stateRef.current, drag: { id: card.id, x: p.x, y: p.y } };
    setSelCard(card.id);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.drag.id) return;
    const p = local(e.currentTarget, e.clientX, e.clientY);
    const cw = 176;
    const ch = 48;
    stateRef.current = {
      ...s,
      drag: { id: s.drag.id, x: clamp(p.x, cw / 2, W - cw / 2), y: clamp(p.y, ch / 2, H - ch / 2) },
    };
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.drag.id) return;
    const id = s.drag.id;
    const p = local(e.currentTarget, e.clientX, e.clientY);
    const track = TRACKS.find(
      (t) => p.x >= TRACK_X && p.x <= TRACK_X + TRACK_W && p.y >= t.y && p.y <= t.y + t.h
    );
    if (track) place(id, track.id);
    else stateRef.current = { ...s, drag: { id: null, x: 0, y: 0 } };
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 指针已被浏览器释放
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="三种增量设定：把下方任务卡拖到对应轨道"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onLostPointerCapture={endDrag}
      />
      <div className="chip-row">
        {CARDS.map((c) => (
          <button
            key={c.id}
            className={`chip ${selCard === c.id ? 'selected' : ''}`}
            onClick={() => setSelCard(selCard === c.id ? null : c.id)}
            aria-pressed={selCard === c.id}
            style={{ opacity: placed[c.id] ? 0.5 : 1 }}
          >
            {c.text}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            className="chip"
            onClick={() => {
              if (selCard) place(selCard, t.id);
            }}
            disabled={!selCard}
            style={{ opacity: selCard ? 1 : 0.55 }}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedbackStyle(feedback)}>
        {feedback.text}
      </div>
    </div>
  );
};

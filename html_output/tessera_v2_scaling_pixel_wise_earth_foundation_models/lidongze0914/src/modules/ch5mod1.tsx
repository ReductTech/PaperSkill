import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const TUBE_X = 56;
const TUBE_Y = 130;
const BX = 560;
const BY = 146;
const CELL = 5;
const BUCKETS = [16, 32, 48, 64, 80, 96];

interface SceneState {
  kObs: number;
  tubePos: number;
  lockedBucket: number | null;
  dragging: boolean;
  lastLocked: number;
}

interface Feedback {
  text: string;
  cls: '' | 'good' | 'bad';
}

const nearestBucket = (v: number): number => clamp(16 * Math.round(v / 16), 16, 96);

const minBucketFor = (k: number): number => clamp(16 * Math.ceil(k / 16), 16, 96);

const sourceIndices = (k: number, m: number): number[] =>
  Array.from({ length: m }, (_, j) => Math.floor(((2 * j + 1) * k) / (2 * m)));

function successText(k: number, b: number): string {
  if (k === 40 && b === 48) {
    return '锁定卡位 48：40 个真实观测全部保留，8 个空位按每 5 帧一取的中点补位（第 2、7、12、17、22、27、32、37 帧）。';
  }
  if (k === 30 && b === 32) {
    return '锁定卡位 32：30 个真实观测全部保留，2 个空位取两半区间的中点（第 7、22 帧）。';
  }
  const m = b - k;
  if (m === 0) return `锁定卡位 ${b}：${k} 个真实观测全部保留，没有空位需要补位。`;
  const list = sourceIndices(k, m).join('、');
  if (m === 2) {
    return `锁定卡位 ${b}：${k} 个真实观测全部保留，2 个空位取两半区间的中点（第 ${list} 帧）。`;
  }
  if (k % m === 0) {
    return `锁定卡位 ${b}：${k} 个真实观测全部保留，${m} 个空位按每 ${k / m} 帧一取的中点补位（第 ${list} 帧）。`;
  }
  return `锁定卡位 ${b}：${k} 个真实观测全部保留，${m} 个空位按均匀间隔的中点补位（第 ${list} 帧）。`;
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 34, W, 34);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 34);
  ctx.lineTo(W, H - 34);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D, count: number): void {
  let s = 19;
  ctx.fillStyle = '#68778f';
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const x = 20 + (s / 233280) * (W - 40);
    s = (s * 9301 + 49297) % 233280;
    const y = 14 + (s / 233280) * 86;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign
): void {
  ctx.fillStyle = '#21324a';
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 10, 14, 10);
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 44 + ctx.measureText(item.label).width;
  });
}

function renderScene(ctx: CanvasRenderingContext2D, s: SceneState): void {
  clearScene(ctx);
  drawSky(ctx, 12);

  const minB = minBucketFor(s.kObs);
  const lock = s.lockedBucket;
  const near = nearestBucket(s.tubePos);

  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 196);
  ctx.lineTo(520, 196);
  ctx.stroke();

  ctx.font = '18px "Segoe UI", sans-serif';
  BUCKETS.forEach((b) => {
    const x = TUBE_X + map(b, 16, 96, 90, 420);
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 188);
    ctx.lineTo(x, 204);
    ctx.stroke();
    if (s.dragging && b === near) {
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 184);
      ctx.lineTo(x, 208);
      ctx.stroke();
    }
    if (lock !== null && b === lock) {
      ctx.strokeStyle = lock < s.kObs ? '#c43f52' : lock === minB ? '#228d5c' : '#f07e47';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, 196, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#68778f';
    ctx.textAlign = 'center';
    ctx.fillText(String(b), x, 226);
  });

  const len = map(s.tubePos, 16, 96, 90, 420);
  const hx = TUBE_X + len;
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(TUBE_X, TUBE_Y - 16);
  ctx.lineTo(hx, TUBE_Y - 16);
  ctx.lineTo(hx, TUBE_Y + 16);
  ctx.lineTo(TUBE_X, TUBE_Y + 16);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(TUBE_X, TUBE_Y - 22);
  ctx.lineTo(TUBE_X, TUBE_Y + 22);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,126,71,0.25)';
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hx, TUBE_Y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawSceneLabel(ctx, '伸缩镜筒', 48, 56, 'left');
  drawSceneLabel(ctx, '观测槽位', 804, 56, 'center');

  const disp = lock !== null ? Math.max(lock, lock < s.kObs ? s.kObs : lock) : minB;
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.strokeRect(BX, BY, disp * CELL, 20);
  for (let i = 0; i < disp; i += 1) {
    const cx = BX + i * CELL;
    if (i < s.kObs) {
      ctx.fillStyle = '#27446e';
      ctx.fillRect(cx + 1, BY + 1, CELL - 2, 18);
      if (lock !== null && i >= lock) {
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 1, BY + 3);
        ctx.lineTo(cx + CELL - 1, BY + 17);
        ctx.moveTo(cx + CELL - 1, BY + 3);
        ctx.lineTo(cx + 1, BY + 17);
        ctx.stroke();
      }
    } else {
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 1, BY + 1, CELL - 2, 18);
      ctx.restore();
    }
  }

  ctx.fillStyle = '#21324a';
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(String(s.kObs), BX, BY - 12);
  ctx.textAlign = 'right';
  ctx.fillText(String(disp), BX + disp * CELL, BY - 12);

  if (lock !== null && lock > s.kObs) {
    const m = lock - s.kObs;
    const idx = sourceIndices(s.kObs, m);
    ctx.strokeStyle = '#68778f';
    ctx.lineWidth = 2;
    idx.forEach((src, t) => {
      const fx = BX + (s.kObs + t + 0.5) * CELL;
      const sx = BX + (src - 0.5) * CELL;
      ctx.beginPath();
      ctx.moveTo(sx, BY - 2);
      ctx.quadraticCurveTo((sx + fx) / 2, BY - 40, fx, BY - 4);
      ctx.stroke();
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(fx - 2.5, BY + 7.5, 5, 5);
    });
    if (m <= 8) {
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      idx.forEach((src, t) => {
        const fx = BX + (s.kObs + t + 0.5) * CELL;
        ctx.fillText(String(src), fx, BY - 48);
      });
    }
  }

  drawLegend(
    ctx,
    [
      { label: '原观测', color: '#27446e' },
      { label: '中点补位', color: '#f07e47' },
      { label: '最小桶', color: '#228d5c' },
    ],
    700,
    262
  );
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<SceneState>({
    kObs: 40,
    tubePos: 16,
    lockedBucket: null,
    dragging: false,
    lastLocked: 16,
  });
  const [kObs, setKObs] = useState(40);
  const [exampleSel, setExampleSel] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({
    text: '卡位 16 装不下 40 个有效观测：固定长度会被迫丢弃或重复观测。',
    cls: 'bad',
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
    const tick = () => {
      renderScene(ctx, stateRef.current);
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

  const lockAt = (b: number) => {
    const s = stateRef.current;
    s.tubePos = b;
    s.lockedBucket = b;
    s.lastLocked = b;
    const minB = minBucketFor(s.kObs);
    if (b < s.kObs) {
      setFeedback({
        text: `卡位 ${b} 装不下 ${s.kObs} 个有效观测：固定长度会被迫丢弃或重复观测。`,
        cls: 'bad',
      });
    } else if (b === minB) {
      setFeedback({ text: successText(s.kObs, b), cls: 'good' });
    } else {
      setFeedback({
        text: `卡位 ${b} 也装得下，但比最小桶多占 ${b - minB} 个槽位，批量算力更贵。`,
        cls: '',
      });
    }
  };

  const applyK = (value: number) => {
    const s = stateRef.current;
    s.kObs = value;
    s.lockedBucket = null;
    s.tubePos = s.lastLocked;
    setKObs(value);
    setFeedback({ text: `k 已改为 ${value}：重新找最小卡位。`, cls: '' });
  };

  const localPos = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const p = localPos(e);
    if (!p) return;
    const hx = TUBE_X + map(s.tubePos, 16, 96, 90, 420);
    if (Math.abs(p.x - hx) > 24 || Math.abs(p.y - TUBE_Y) > 44) return;
    s.dragging = true;
    s.lockedBucket = null;
    e.currentTarget.style.cursor = 'grabbing';
    e.currentTarget.setPointerCapture(e.pointerId);
    setFeedback({ text: `正在拉伸：最近的卡位是 ${nearestBucket(s.tubePos)}。`, cls: '' });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const p = localPos(e);
    if (!p) return;
    s.tubePos = clamp(map(clamp(p.x - TUBE_X, 90, 420), 90, 420, 16, 96), 16, 96);
    setFeedback({ text: `正在拉伸：最近的卡位是 ${nearestBucket(s.tubePos)}。`, cls: '' });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    e.currentTarget.style.cursor = 'grab';
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    lockAt(nearestBucket(s.tubePos));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const idx = BUCKETS.indexOf(nearestBucket(s.tubePos));
    let next: number | null = null;
    if (e.key === 'ArrowLeft') next = BUCKETS[Math.max(0, idx - 1)];
    else if (e.key === 'ArrowRight') next = BUCKETS[Math.min(BUCKETS.length - 1, idx + 1)];
    else if (e.key === 'Home') next = 16;
    else if (e.key === 'End') next = 96;
    if (next === null) return;
    e.preventDefault();
    lockAt(next);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        aria-label="镜筒延长段把手：拖动卡位，或用左右方向键逐卡位移动"
      />
      <div className="ctrl">
        <label>
          有效观测数 k <span className="val">{kObs}</span>
        </label>
        <input
          type="range"
          min={1}
          max={96}
          step={1}
          value={kObs}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setExampleSel(null);
            applyK(Number(e.target.value));
          }}
        />
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip${exampleSel === 40 ? ' selected' : ''}`}
          onClick={() => {
            setExampleSel(40);
            applyK(40);
          }}
        >
          例一 k=40
        </button>
        <button
          type="button"
          className={`chip${exampleSel === 30 ? ' selected' : ''}`}
          onClick={() => {
            setExampleSel(30);
            applyK(30);
          }}
        >
          例二 k=30
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch5Mod1;

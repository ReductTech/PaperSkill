import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import { PAL, clearPanel, drawInset, drawSceneLabel, wrapText, setupCrispCanvas } from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 320;

/**
 * Table 1 read as a capability matrix (page 2).
 *
 * Every column of that table is a CATEGORY, not a measurement, so a growing-bar
 * race would invent a magnitude the paper never reports. Instead the learner
 * toggles one requirement at a time and watches which systems survive: the
 * paper's actual claim is that only its row satisfies all six at once, and that
 * is exactly what elimination makes visible.
 */
type ReqKey = 'duration' | 'domain' | 'dynamic' | 'semantic' | 'realtime' | 'open';

interface Req {
  key: ReqKey;
  label: string;
  short: string;
}

const REQS: Req[] = [
  { key: 'duration', label: '小时级（无限）时长', short: '小时级' },
  { key: 'domain', label: '通用域', short: '通用域' },
  { key: 'dynamic', label: '高动态度', short: '高动态' },
  { key: 'semantic', label: '语义交互', short: '语义交互' },
  { key: 'realtime', label: '实时', short: '实时' },
  { key: 'open', label: '开源', short: '开源' },
];

interface Row {
  name: string;
  ours: boolean;
  /** Category label shown for the duration column. */
  durationTier: string;
  meets: Record<ReqKey, boolean>;
}

// Strictly the categorical entries of Table 1 (page 2).
const ROWS: Row[] = [
  {
    name: 'M-G 3.0',
    ours: false,
    durationTier: '分钟级',
    meets: { duration: false, domain: false, dynamic: true, semantic: false, realtime: false, open: true },
  },
  {
    name: 'DreamX-World',
    ours: false,
    durationTier: '分钟级',
    meets: { duration: false, domain: true, dynamic: true, semantic: false, realtime: false, open: true },
  },
  {
    name: 'LingBot-World 1.0',
    ours: false,
    durationTier: '分钟级',
    meets: { duration: false, domain: true, dynamic: true, semantic: false, realtime: true, open: true },
  },
  {
    name: 'HappyOyster',
    ours: false,
    durationTier: '分钟级',
    meets: { duration: false, domain: true, dynamic: true, semantic: true, realtime: false, open: false },
  },
  {
    name: 'Genie 3',
    ours: false,
    durationTier: '分钟级',
    meets: { duration: false, domain: true, dynamic: true, semantic: true, realtime: false, open: false },
  },
  {
    name: '本文（Infinity）',
    ours: true,
    durationTier: '小时级（无限）',
    meets: { duration: true, domain: true, dynamic: true, semantic: true, realtime: true, open: true },
  },
];

const RX = 34;
const RY = 62;
const ROW_H = 34;
const NAME_W = 150;
const CHIP_W = 62;

export const Ch10M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ active: Set<ReqKey> }>({ active: new Set() });
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState<ReqKey[]>([]);
  const [feedback, setFeedback] = useState({
    text: '还没有勾选任何要求：六个系统都在候选里。逐条勾选下面的能力要求，看谁会被筛掉。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const survives = (r: Row, act: Set<ReqKey>) => {
      for (const k of act) if (!r.meets[k]) return false;
      return true;
    };

    const render = (s: { active: Set<ReqKey> }) => {
      clearPanel(ctx, W, H);

      // column headers: one chip per requirement
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      REQS.forEach((q, i) => {
        const cx = RX + NAME_W + i * CHIP_W + CHIP_W / 2;
        const on = s.active.has(q.key);
        ctx.fillStyle = on ? PAL.blue : PAL.muted;
        ctx.font = on ? '600 12px "Segoe UI", sans-serif' : '12px "Segoe UI", sans-serif';
        ctx.fillText(q.short, cx, RY - 14);
      });
      ctx.textAlign = 'left';

      ROWS.forEach((r, i) => {
        const y = RY + i * ROW_H;
        const alive = survives(r, s.active);

        // row band
        ctx.fillStyle = r.ours
          ? alive
            ? 'rgba(34,141,92,0.12)'
            : 'rgba(196,63,82,0.08)'
          : alive
          ? PAL.paper
          : 'rgba(104,119,143,0.07)';
        ctx.strokeStyle = r.ours && alive ? PAL.green : PAL.axis;
        ctx.lineWidth = r.ours && alive ? 2 : 1;
        ctx.beginPath();
        ctx.rect(RX, y, NAME_W + REQS.length * CHIP_W, ROW_H - 6);
        ctx.fill();
        ctx.stroke();

        // system name; eliminated rows are struck through
        ctx.fillStyle = alive ? (r.ours ? PAL.green : PAL.ink) : PAL.muted;
        ctx.font = r.ours ? '600 13px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.fillText(r.name, RX + 10, y + 19);
        if (!alive) {
          const w = ctx.measureText(r.name).width;
          ctx.strokeStyle = PAL.muted;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(RX + 10, y + 15);
          ctx.lineTo(RX + 10 + w, y + 15);
          ctx.stroke();
        }

        // one mark per requirement
        REQS.forEach((q, j) => {
          const cx = RX + NAME_W + j * CHIP_W + CHIP_W / 2;
          const ok = r.meets[q.key];
          const lit = s.active.has(q.key);
          ctx.globalAlpha = lit ? 1 : 0.42;
          if (ok) {
            ctx.strokeStyle = r.ours ? PAL.green : PAL.blue;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 5, y + 14);
            ctx.lineTo(cx - 1, y + 19);
            ctx.lineTo(cx + 6, y + 8);
            ctx.stroke();
          } else {
            ctx.strokeStyle = lit ? PAL.red : PAL.muted;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 5, y + 8);
            ctx.lineTo(cx + 5, y + 18);
            ctx.moveTo(cx + 5, y + 8);
            ctx.lineTo(cx - 5, y + 18);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        });
      });

      // duration column is categorical: print the tier word, never a length
      ctx.fillStyle = PAL.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('时长这一列是档位：' + ROWS[0].durationTier + ' / ' + ROWS[5].durationTier, RX, RY + 6 * ROW_H + 16);

      // survivor tally
      const alive = ROWS.filter((r) => survives(r, stateRef.current.active));
      drawInset(ctx, 542, 62, 158, 168, '还剩几个');
      ctx.fillStyle = alive.length === 1 ? PAL.green : PAL.ink;
      ctx.font = '600 30px "Segoe UI", sans-serif';
      ctx.fillText(String(alive.length), 558, 116);
      ctx.fillStyle = PAL.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('/ 6 个系统', 592, 116);
      let ty = 146;
      ctx.font = '12px "Segoe UI", sans-serif';
      for (const r of alive) {
        ctx.fillStyle = r.ours ? PAL.green : PAL.ink;
        ty = wrapText(ctx, r.name, 558, ty, 132, 16);
      }

      drawSceneLabel(ctx, RX, 34, 'Table 1 · 能力矩阵（分档记录）');
    };

    const tick = () => {
      render(stateRef.current);
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
      detachCrisp();
    };
  }, []);

  const toggle = (k: ReqKey) => {
    const set = stateRef.current.active;
    if (set.has(k)) set.delete(k);
    else set.add(k);
    const list = REQS.filter((q) => set.has(q.key)).map((q) => q.key);
    setActive(list);

    const alive = ROWS.filter((r) => {
      for (const kk of set) if (!r.meets[kk]) return false;
      return true;
    });
    if (set.size === 0) {
      setFeedback({
        text: '还没有勾选任何要求：六个系统都在候选里。逐条勾选下面的能力要求，看谁会被筛掉。',
        cls: '',
      });
    } else if (alive.length === 1 && alive[0].ours) {
      setFeedback({
        text: `勾了 ${set.size} 条要求后<b>只剩本文一个</b>。这就是 Table 1 的真正结论：不是某一维最强，而是这一组能力<b>同时成立</b>的只有它。注意每一列都是档位标签，论文没有给出量化分数。`,
        cls: 'good',
      });
    } else {
      const names = alive.map((r) => r.name).join('、');
      setFeedback({
        text: `勾了 ${set.size} 条要求，还剩 ${alive.length} 个：${names}。继续加要求看谁先掉队。`,
        cls: '',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {REQS.map((q) => (
          <button
            key={q.key}
            className={`chip${active.includes(q.key) ? ' selected' : ''}`}
            onClick={() => toggle(q.key)}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Ch10M1;

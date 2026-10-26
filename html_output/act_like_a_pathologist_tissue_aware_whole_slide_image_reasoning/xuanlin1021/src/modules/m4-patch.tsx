import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT, clearPlate, drawPhoto, drawTag, usePlate } from './scene-kit';

// §4 模块 4.1：六个名额，你会圈哪几块。
// 规则来自论文：组内按选择概率排序，取前 k_j 块（Eq.4-5）。
// 概率数值为示意；去掉片块选择器的真实代价见 Table 5（92.07 vs 94.57）。

const W = 1080;
const H = 280;
const K = 6;
const COLS = 8;
const ROWS = 3;
const CELL = { x0: 28, y0: 44, w: 72, h: 62, gap: 6 };

const PROBS = [
  0.91, 0.88, 0.86, 0.83, 0.79, 0.77, 0.61, 0.55, 0.52, 0.48, 0.45, 0.44, 0.41, 0.38, 0.35, 0.31, 0.28, 0.25, 0.21, 0.18,
  0.16, 0.12, 0.09, 0.06,
];

const RANK = PROBS.map((p, i) => ({ p, i }))
  .sort((a, b) => b.p - a.p)
  .map((x, idx) => ({ ...x, rank: idx + 1 }));

function rankOf(i: number): number {
  return RANK.find((r) => r.i === i)!.rank;
}

function cellRect(i: number) {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: CELL.x0 + c * (CELL.w + CELL.gap),
    y: CELL.y0 + r * (CELL.h + CELL.gap),
    w: CELL.w,
    h: CELL.h,
  };
}

export const M4Patch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  const [picked, setPicked] = useState<number[]>([]);
  const [warn, setWarn] = useState(false);

  const render = useCallback(() => {
    const canvas = ref.current;
    const ctx = plate(canvas);
    if (!ctx) return;
    clearPlate(ctx, W, H);

    PROBS.forEach((_, i) => {
      const r = cellRect(i);
      const order = picked.indexOf(i);
      const on = order >= 0;
      const inTop = rankOf(i) <= K;
      drawPhoto(ctx, r.x, r.y, r.w, r.h, 30 + i, {
        tone: on ? 'green' : inTop ? 'neutral' : 'muted',
        dim: on ? 1 : inTop ? 0.95 : 0.45,
        blobs: 3,
        border: on ? 2.5 : 1,
        ring: on ? C.green : inTop ? C.orange : C.axis,
        badge: on ? String(order + 1) : undefined,
      });
    });
    drawTag(ctx, '片块', CELL.x0 + 2, 34, { size: 13, color: C.muted });

    // 右侧：概率条（前 12 名足够说明排序）。
    const barX = 700;
    const barW = 250;
    RANK.slice(0, 12).forEach((item, i) => {
      const y = 52 + i * 18;
      const on = picked.includes(item.i);
      ctx.fillStyle = C.muted;
      ctx.font = `12px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(String(item.i + 1), barX - 26, y + 4);
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX + 0.5, y - 7, barW, 12);
      ctx.fillStyle = item.rank <= K ? (on ? C.green : C.orange) : C.light;
      ctx.globalAlpha = item.rank <= K ? 0.9 : 0.5;
      ctx.fillRect(barX + 1, y - 6, Math.max(2, barW * item.p), 10);
      ctx.globalAlpha = 1;
      if (item.rank <= K) {
        ctx.fillStyle = C.muted;
        ctx.font = `11px ${FONT}`;
        ctx.textAlign = 'right';
        ctx.fillText(item.p.toFixed(2), barX + barW - 2, y - 12);
      }
    });
    // 前 6 名的区间标记
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(barX - 6, 46, barW + 12, 6 * 18 + 2);
    ctx.setLineDash([]);
    drawTag(ctx, '概率', barX - 30, 36, { size: 13, color: C.muted });

    if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [picked, plate]);

  useEffect(() => {
    render();
  }, [render]);

  const toggle = (i: number) => {
    setPicked((prev) => {
      if (prev.includes(i)) {
        setWarn(false);
        return prev.filter((v) => v !== i);
      }
      if (prev.length >= K) {
        setWarn(true);
        return prev;
      }
      setWarn(false);
      return [...prev, i];
    });
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (let i = 0; i < PROBS.length; i++) {
      const r = cellRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        toggle(i);
        return;
      }
    }
  };

  const wrongPick = picked.find((i) => rankOf(i) > K);
  const fb =
    picked.length < K
      ? { text: `还差 ${K - picked.length} 个名额：不是越少越好，预算内的名额要留给最该看的证据。`, cls: '' }
      : wrongPick !== undefined
      ? { text: `第 ${rankOf(wrongPick)} 名的块占掉一个名额，就会挤掉一处更有信息量的证据。`, cls: 'bad' }
      : { text: '你圈的正是概率最高的 6 块。去掉这个排序、只按相似度凑数，形态题从 94.57% 掉到 92.07%。', cls: 'good' };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        style={{ touchAction: 'manipulation', cursor: 'pointer' }}
        onClick={onClick}
      />
      <div className="chip-row">
        {PROBS.map((_, i) => (
          <button key={i} type="button" className="chip" onClick={() => toggle(i)} aria-label={`片块 ${i + 1}`}>
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => {
            setPicked([]);
            setWarn(false);
          }}
        >
          清空
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{warn && picked.length >= K ? '名额已满：先点掉一块，再换新的。' : fb.text}</div>
    </div>
  );
};

export default M4Patch;

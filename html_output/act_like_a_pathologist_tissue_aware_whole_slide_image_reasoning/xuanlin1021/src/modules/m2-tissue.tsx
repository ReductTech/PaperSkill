import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT, clearPlate, drawPhoto, drawTag, usePlate } from './scene-kit';

// §2 模块 2.1：这一块贴到哪一行。
// 组织类型来自论文与病理医生共同设计的 13 类提示（Figure 4 图例），
// 这里的相似度数值是「示意」，但归属规则是论文的真实规则：取余弦相似度最大者。

const W = 1080;
const H = 280;
const PHOTO = { x: 30, y: 92, w: 132, h: 132 };
const CARD = { y: 92, w: 96, h: 100, gap: 12, x0: 214 };
const BAR = { x: 828, w: 214, y0: 62, dy: 40 };

const TISSUES = [
  { name: '恶性组织', v: 0.72 },
  { name: '良性组织', v: 0.38 },
  { name: '间质', v: 0.44 },
  { name: '淋巴细胞', v: 0.33 },
  { name: '坏死', v: 0.31 },
];

function cardRect(i: number) {
  return { x: CARD.x0 + i * (CARD.w + CARD.gap), y: CARD.y, w: CARD.w, h: CARD.h };
}

export const M2Tissue: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  const [target, setTarget] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: PHOTO.x, y: PHOTO.y });

  const render = useCallback(() => {
    const canvas = ref.current;
    const ctx = plate(canvas);
    if (!ctx) return;
    clearPlate(ctx, W, H);

    // 五张组织卡片：每张一个小样 + 数字编号。
    TISSUES.forEach((t, i) => {
      const r = cardRect(i);
      const active = target === i;
      ctx.fillStyle = active ? '#eef4ea' : '#fffdf6';
      ctx.strokeStyle = active ? C.blue : C.axis;
      ctx.lineWidth = active ? 2.5 : 1;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      drawPhoto(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 34, 50 + i, {
        tone: 'neutral',
        dim: 0.9,
        blobs: 4,
      });
      ctx.fillStyle = active ? C.blue : C.muted;
      ctx.font = `600 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), r.x + r.w / 2, r.y + r.h - 8);
    });

    // 被拖动的照片（未拖动时停在起点）。
    const px = dragging ? pos.x : PHOTO.x;
    const py = dragging ? pos.y : PHOTO.y;
    drawPhoto(ctx, px, py, PHOTO.w, PHOTO.h, 91, {
      tone: target === null ? 'neutral' : target === 0 ? 'green' : 'red',
      border: 2.5,
      ring: target === null ? C.blue : target === 0 ? C.green : C.red,
      blobs: 5,
    });

    // 相似度条：落点确定后才给出数值（示意）。
    TISSUES.forEach((t, i) => {
      const y = BAR.y0 + i * BAR.dy;
      ctx.fillStyle = C.muted;
      ctx.font = `13px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(String(i + 1), BAR.x - 18, y + 12);
      if (target !== null) {
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1;
        ctx.strokeRect(BAR.x + 0.5, y + 0.5, BAR.w, 14);
        const isMax = i === 0;
        const isWrongPick = i === target && target !== 0;
        ctx.fillStyle = isMax ? C.green : isWrongPick ? C.red : C.light;
        ctx.globalAlpha = isMax || isWrongPick ? 1 : 0.6;
        ctx.fillRect(BAR.x + 1, y + 1, Math.max(2, BAR.w * t.v), 12);
        ctx.globalAlpha = 1;
        ctx.fillStyle = isMax || isWrongPick ? C.text : C.muted;
        ctx.font = `12px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText(t.v.toFixed(2), BAR.x + BAR.w - 30, y + 27);
      }
    });
    drawTag(ctx, '相似度', BAR.x - 12, 44, { size: 13, color: C.muted });

    if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [target, dragging, pos, plate]);

  useEffect(() => {
    render();
  }, [render]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvas(e);
    const inPhoto = x >= PHOTO.x && x <= PHOTO.x + PHOTO.w && y >= PHOTO.y && y <= PHOTO.y + PHOTO.h;
    const inCards =
      y >= CARD.y &&
      y <= CARD.y + CARD.h &&
      x >= CARD.x0 &&
      x <= CARD.x0 + 5 * CARD.w + 4 * CARD.gap;
    if (!inPhoto && !inCards) return;
    ref.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    setPos({ x: x - PHOTO.w / 2, y: y - PHOTO.h / 2 });
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const { x, y } = toCanvas(e);
    setPos({
      x: Math.max(4, Math.min(W - PHOTO.w - 4, x - PHOTO.w / 2)),
      y: Math.max(4, Math.min(H - PHOTO.h - 4, y - PHOTO.h / 2)),
    });
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    setDragging(false);
    const { x, y } = toCanvas(e);
    const cx = x;
    const cy = y;
    let hit: number | null = null;
    TISSUES.forEach((_, i) => {
      const r = cardRect(i);
      if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) hit = i;
    });
    if (hit !== null) setTarget(hit);
    setPos({ x: PHOTO.x, y: PHOTO.y });
  };

  const fb =
    target === null
      ? { text: `${TISSUES.length} 类组织已就位（论文共有 13 类）。把左边的照片拖到一张卡片上，或用下面的按钮选择。`, cls: '' }
      : target === 0
      ? { text: '你把这块判成恶性组织，和分割规则一致：取相似度最大的那一类。', cls: 'good' }
      : { text: '它更像恶性组织（示意相似度 0.72）；贴错一行，后面的检索就从这里开始偏。', cls: 'bad' };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        style={{ touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          setDragging(false);
          setPos({ x: PHOTO.x, y: PHOTO.y });
        }}
      />
      <div className="chip-row">
        {TISSUES.map((t, i) => (
          <button
            key={t.name}
            type="button"
            className={`chip${target === i ? ' selected' : ''}`}
            onClick={() => setTarget(i)}
          >
            {i + 1} {t.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M2Tissue;

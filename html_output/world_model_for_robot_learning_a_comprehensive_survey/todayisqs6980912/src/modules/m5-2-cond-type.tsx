import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PALETTE, drawScene, drawLegend, drawSceneLabel, makeRng, DEFAULT_GLYPH } from './theme-kit';
import type { Pt } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 5.2 条件类型（P4 chips）：无 / 文本 l / 动作 a / l+a 四种条件下
// 生成「永」字的三个样本。none → 随机字形（红）；l → 字形对但位姿漂（蓝+红偏移框）；
// a → 笔位对但间架散（蓝+红色虚线补全）；la → 两者皆对（蓝+绿✓）。

const W = 720;
const H = 280;

type Cond = 'none' | 'l' | 'a' | 'la';

const CONDS: { id: Cond; label: string }[] = [
  { id: 'none', label: '无条件' },
  { id: 'l', label: '文本 l' },
  { id: 'a', label: '动作 a' },
  { id: 'la', label: 'l + a' },
];

const FB: Record<Cond, { text: string; cls: string }> = {
  none: { text: '没有条件：想写什么全靠猜。', cls: 'bad' },
  l: { text: '只有指令：写的是哪个字对了，笔位还漂。', cls: '' },
  a: { text: '给了动作：每一笔的落点都被钉住。', cls: 'good' },
  la: { text: '双条件：内容与轨迹都可控——最实用的组合。', cls: 'good' },
};

const FB_TEXT: Record<Cond, string> = {
  none: '全靠猜',
  l: '位姿漂',
  a: '间架散',
  la: '都可控',
};

function glyphInBox(glyph: Pt[][], x: number, y: number, w: number, h: number): Pt[][] {
  const pad = Math.min(w, h) * 0.14;
  return glyph.map((stroke) =>
    stroke.map((p) => ({
      x: x + pad + p.x * (w - pad * 2),
      y: y + pad + p.y * (h - pad * 2),
    }))
  );
}

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Pt[][], color: string, width: number): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const stroke of glyph) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlyphBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = PALETTE.paper;
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.globalAlpha = 0.6;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.restore();
}

function rotateAround(p: Pt, c: Pt, ang: number): Pt {
  const s = Math.sin(ang);
  const co = Math.cos(ang);
  return { x: c.x + (p.x - c.x) * co - (p.y - c.y) * s, y: c.y + (p.x - c.x) * s + (p.y - c.y) * co };
}

export const M52CondType: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Cond>('a');
  const rafRef = useRef<number | null>(null);
  const [cond, setCond] = useState<Cond>('a');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const TX = 48;
    const TY = 62;
    const TW = 168;
    const TH = 168;
    const SX = [300, 438, 576];
    const SY = 62;
    const SW = 112;
    const SH = 112;

    // 三份确定性随机种子（none 用）
    const rngs = [makeRng(11), makeRng(77), makeRng(303)];
    const noneGlyphs = rngs.map((rng) =>
      DEFAULT_GLYPH.map((stroke) => {
        const cx = stroke.reduce((a, p) => a + p.x, 0) / stroke.length;
        const cy = stroke.reduce((a, p) => a + p.y, 0) / stroke.length;
        const ang = (rng() * 2 - 1) * 0.5;
        const dx = (rng() * 2 - 1) * 0.16;
        const dy = (rng() * 2 - 1) * 0.16;
        return stroke.map((p) => {
          const r = rotateAround(p, { x: cx, y: cy }, ang);
          return { x: r.x + dx, y: r.y + dy };
        });
      })
    );

    const render = () => {
      const c = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 30, [
        { color: PALETTE.guide, text: '目标' },
        { color: PALETTE.blue, text: '样本' },
        { color: PALETTE.red, text: '错误' },
      ]);

      // 中央目标字（淡棕骨架 + 田字格）
      drawSceneLabel(ctx, TX + TW / 2, TY - 12, '目标', { size: 12, align: 'center', color: PALETTE.guide });
      drawGlyphBox(ctx, TX, TY, TW, TH);
      drawGlyph(ctx, glyphInBox(DEFAULT_GLYPH, TX, TY, TW, TH), PALETTE.guide, 2.5);

      // 条件徽标（紫）
      const badge = `条件：${FB_TEXT[c]}`;
      ctx.save();
      ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
      const bw = ctx.measureText(badge).width + 20;
      ctx.fillStyle = PALETTE.purple;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(W - 34 - bw, 44, bw, 24);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = PALETTE.purple;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(W - 34 - bw + 0.5, 44.5, bw - 1, 23);
      ctx.fillStyle = PALETTE.purple;
      ctx.textBaseline = 'middle';
      ctx.fillText(badge, W - 34 - bw + 10, 57);
      ctx.restore();

      // 右侧三样本
      for (let i = 0; i < 3; i++) {
        const x = SX[i];
        const y = SY;
        drawGlyphBox(ctx, x, y, SW, SH);
        drawSceneLabel(ctx, x + SW / 2, y + SH + 14, `样本 ${i + 1}`, {
          size: 11,
          align: 'center',
        });

        if (c === 'none') {
          drawGlyph(ctx, glyphInBox(noneGlyphs[i], x, y, SW, SH), PALETTE.red, 2.5);
        } else if (c === 'l') {
          const g = glyphInBox(DEFAULT_GLYPH, x, y, SW, SH);
          // 整体位姿漂移：旋转 + 平移
          const cx = x + SW / 2;
          const cy = y + SH / 2;
          const drift = g.map((stroke) =>
            stroke.map((p) => {
              const r = rotateAround(p, { x: cx, y: cy }, 0.22);
              return { x: r.x + 12, y: r.y - 9 };
            })
          );
          // 红虚线：应在的位置
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = PALETTE.red;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          for (const stroke of g) {
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let k = 1; k < stroke.length; k++) ctx.lineTo(stroke[k].x, stroke[k].y);
            ctx.stroke();
          }
          ctx.restore();
          drawGlyph(ctx, drift, PALETTE.blue, 2.5);
          // 漂移箭头
          ctx.save();
          ctx.strokeStyle = PALETTE.red;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + 4, cy - 4);
          ctx.lineTo(cx + 14, cy - 12);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + 14, cy - 12);
          ctx.lineTo(cx + 7, cy - 12);
          ctx.moveTo(cx + 14, cy - 12);
          ctx.lineTo(cx + 14, cy - 5);
          ctx.stroke();
          ctx.restore();
        } else if (c === 'a') {
          const g = glyphInBox(DEFAULT_GLYPH, x, y, SW, SH);
          // 笔位对（起点钉住）、间架散（笔画缩短成残段）
          const frag = g.map((stroke) => {
            const s = stroke[0];
            const e = stroke[stroke.length - 1];
            return [s, { x: s.x + (e.x - s.x) * 0.42, y: s.y + (e.y - s.y) * 0.42 }];
          });
          drawGlyph(ctx, frag, PALETTE.blue, 2.5);
          // 红色问号：结构缺位
          ctx.save();
          ctx.fillStyle = PALETTE.red;
          ctx.font = 'bold 15px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText('间架散', x + SW / 2 - 20, y + SH / 2 + 2);
          ctx.restore();
        } else {
          drawGlyph(ctx, glyphInBox(DEFAULT_GLYPH, x, y, SW, SH), PALETTE.blue, 2.5);
          // 绿✓
          ctx.save();
          ctx.strokeStyle = PALETTE.green;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 12);
          ctx.lineTo(x + 12, y + 18);
          ctx.lineTo(x + 21, y + 6);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="条件类型">
        {CONDS.map((c) => (
          <button
            key={c.id}
            className={`chip ${cond === c.id ? 'selected' : ''}`}
            aria-pressed={cond === c.id}
            onClick={() => {
              stateRef.current = c.id;
              setCond(c.id);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${FB[cond].cls}`}>{FB[cond].text}</div>
    </div>
  );
};

export default M52CondType;

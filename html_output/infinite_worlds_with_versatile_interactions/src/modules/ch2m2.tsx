import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import {
  PAL,
  clearScene,
  drawInset,
  drawNeedles,
  drawPatternCard,
  drawSceneLabel,
  wrapText,
  setupCrispCanvas,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 280;

type Tex = 'plain' | 'diag' | 'cable' | 'lace' | 'dot';

interface ChunkInfo {
  prompt: string;
  glyph: string;
  tex: Tex;
}

const CHUNKS: Record<number, ChunkInfo> = {
  1: { prompt: '沿石板路向前走', glyph: '平纹', tex: 'plain' },
  2: { prompt: '抬头看向远处的塔', glyph: '斜纹', tex: 'diag' },
  3: { prompt: '挥剑近战', glyph: '扭花', tex: 'cable' },
  4: { prompt: '抬手施法，掌心亮起', glyph: '镂空', tex: 'lace' },
  5: { prompt: '召来一场雪', glyph: '点子花', tex: 'dot' },
};

const BX = 40;
const BW = 76;
const BY = 132;
const BH = 64;

function drawTexture(
  ctx: CanvasRenderingContext2D,
  tex: Tex,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  const n = 4;
  for (let k = 0; k < n; k++) {
    const cx = x + 9 + k * ((w - 18) / (n - 1));
    if (tex === 'plain') {
      ctx.beginPath();
      ctx.moveTo(cx, y + 8);
      ctx.lineTo(cx, y + h - 8);
      ctx.stroke();
    } else if (tex === 'diag') {
      ctx.beginPath();
      ctx.moveTo(cx - 4, y + h - 8);
      ctx.lineTo(cx + 4, y + 8);
      ctx.stroke();
    } else if (tex === 'cable') {
      ctx.beginPath();
      ctx.moveTo(cx - 4, y + 8);
      ctx.quadraticCurveTo(cx + 5, y + h / 2, cx - 4, y + h - 8);
      ctx.stroke();
    } else if (tex === 'lace') {
      ctx.beginPath();
      ctx.arc(cx, y + h / 2, 3.4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      for (const dy of [-6, 6]) {
        ctx.beginPath();
        ctx.arc(cx, y + h / 2 + dy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export const Ch2M2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ chunk: number }>({ chunk: 1 });
  const rafRef = useRef<number | null>(null);
  const [chunk, setChunk] = useState(1);
  const [feedback, setFeedback] = useState({
    text: `块 1：这一块的提示词是「${CHUNKS[1].prompt}」。只有这一块的纹理跟着变——分块提示词是语义控制，粒度是块，所以语义能随时间局部变化。`,
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

    const render = (s: { chunk: number }) => {
      const info = CHUNKS[s.chunk];
      clearScene(ctx, W, H);

      for (let i = 1; i <= 5; i++) {
        const x = BX + (i - 1) * BW;
        const sel = i === s.chunk;
        ctx.fillStyle = sel ? 'rgba(39,68,110,0.12)' : PAL.envLight;
        ctx.strokeStyle = sel ? PAL.blue : PAL.axis;
        ctx.lineWidth = sel ? 2.5 : 1;
        ctx.beginPath();
        ctx.rect(x, BY, BW - 4, BH);
        ctx.fill();
        ctx.stroke();
        drawTexture(
          ctx,
          CHUNKS[i].tex,
          x,
          BY,
          BW - 4,
          BH,
          sel ? PAL.blue : PAL.envDark
        );
        ctx.fillStyle = sel ? PAL.blue : PAL.muted;
        ctx.font = sel ? '600 14px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.fillText(`块 ${i}`, x + 20, BY + BH + 20);
      }

      drawNeedles(ctx, 424, BY + BH / 2, 0.18, PAL.blue, 3);
      drawPatternCard(ctx, BX, 42, info.glyph, true);
      drawSceneLabel(ctx, BX + 68, 70, '当前花样卡');

      // timeline marker under the strip
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(BX, BY + BH + 34);
      ctx.lineTo(BX + 5 * BW - 4, BY + BH + 34);
      ctx.stroke();
      const mx = BX + (s.chunk - 1) * BW + (BW - 4) / 2;
      ctx.fillStyle = PAL.orange;
      ctx.beginPath();
      ctx.moveTo(mx, BY + BH + 28);
      ctx.lineTo(mx - 5, BY + BH + 38);
      ctx.lineTo(mx + 5, BY + BH + 38);
      ctx.closePath();
      ctx.fill();

      // chunk -> prompt table
      drawInset(ctx, 462, 40, 232, 210, '块 → 分块提示词');
      for (let i = 1; i <= 5; i++) {
        const ry = 84 + (i - 1) * 32;
        const sel = i === s.chunk;
        if (sel) {
          ctx.fillStyle = 'rgba(39,68,110,0.10)';
          ctx.fillRect(470, ry - 15, 216, 30);
        }
        ctx.fillStyle = sel ? PAL.blue : PAL.muted;
        ctx.font = sel ? '600 13px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.fillText(`块 ${i}`, 478, ry);
        ctx.fillStyle = sel ? PAL.ink : PAL.muted;
        ctx.font = '13px "Segoe UI", sans-serif';
        wrapText(ctx, CHUNKS[i].prompt, 516, ry, 168, 15);
      }
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

  const select = (n: number) => {
    stateRef.current.chunk = n;
    setChunk(n);
    setFeedback({
      text: `块 ${n}：这一块的提示词是「${CHUNKS[n].prompt}」。只有这一块的纹理跟着变——分块提示词是语义控制，粒度是块，所以语义能随时间局部变化。`,
      cls: '',
    });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (y < BY || y > BY + BH) return;
    for (let i = 1; i <= 5; i++) {
      const bx = BX + (i - 1) * BW;
      if (x >= bx && x <= bx + BW - 4) {
        select(i);
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
      <div className="chip-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`chip${chunk === n ? ' selected' : ''}`}
            onClick={() => select(n)}
          >
            {CHUNKS[n].glyph}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2M2;

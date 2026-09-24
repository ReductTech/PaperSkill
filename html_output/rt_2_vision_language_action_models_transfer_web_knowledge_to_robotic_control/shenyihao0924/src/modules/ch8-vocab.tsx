import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawLegend } from './chefKit';
import type { WidgetProps } from './registry';

// Ch.8 module 8.2 (P4 chips, 1080x280): vocabulary band vs action string.
// Top half — the long vocabulary band: 整数词区 0-255 / 低频词区 / 普通词区;
// with PaLM-E the 256 low-frequency slots get a purple fill + orange dashed
// outline (requisitioned). Bottom half — the action string "1 128 91 241 5
// 101 127" twice: PaLI-X numeric tokens sit directly on the integer region
// (green frames); PaLM-E tokens land in requisitioned low-freq slots
// (purple chips with a small orange slot index).
const W = 1080;
const H = 280;
const TOKENS = ['1', '128', '91', '241', '5', '101', '127'];

// band geometry
const BY = 36;
const BH = 30;
const INT = { x0: 70, x1: 310 };
const LOW = { x0: 310, x1: 550 };
const NORM = { x0: 550, x1: 1010 };
// rows
const ROW1_Y = 150; // PaLI-X
const ROW2_Y = 208; // PaLM-E
const ROW1_X0 = 100;
const ROW1_GAP = 30;
const ROW2_X0 = 330;
const ROW2_GAP = 33;

type Backbone = 'palix' | 'palme';

function vchip(ctx: CanvasRenderingContext2D, x: number, y: number, v: string, mode: Backbone) {
  ctx.save();
  ctx.translate(x, y);
  if (mode === 'palix') {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -12, 28, 24, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.green;
  } else {
    ctx.fillStyle = C.purple;
    ctx.beginPath();
    ctx.roundRect(-14, -12, 28, 24, 5);
    ctx.fill();
    ctx.fillStyle = C.white;
  }
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(v, 0, 1);
  ctx.restore();
}

function region(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  fill: string,
  stroke: string,
  lw: number,
  dashed: boolean
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  if (dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.roundRect(x0, BY, x1 - x0, BH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function caption(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'center') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function risers(ctx: CanvasRenderingContext2D, xs: number[], fromY: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  xs.forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, BY + BH);
    ctx.lineTo(x, fromY);
    ctx.stroke();
  });
  ctx.restore();
}

export const Ch8Vocab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ bb: 'palix' as Backbone });
  const [bb, setBb] = useState<Backbone>('palix');
  const [feedback, setFeedback] = useState({
    text: 'PaLI-X：每个整数本来就有专属词——档位直接当词用。',
    cls: '',
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
    let raf = 0;

    const render = () => {
      const { bb: backbone } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // --- top 50%: vocabulary band ---
      if (backbone === 'palix') {
        region(ctx, INT.x0, INT.x1, '#d9efe1', C.green, 3, false);
        region(ctx, LOW.x0, LOW.x1, '#e9eaef', C.border, 1.5, false);
      } else {
        region(ctx, INT.x0, INT.x1, '#eceff0', C.border, 1.5, false);
        region(ctx, LOW.x0, LOW.x1, '#e9dcfb', C.orange, 2.5, true); // requisitioned
      }
      region(ctx, NORM.x0, NORM.x1, '#f0f1f4', C.border, 1.5, false);

      caption(ctx, '整数词区', (INT.x0 + INT.x1) / 2 - 18, BY + BH / 2, backbone === 'palix' ? C.green : C.muted);
      caption(ctx, '0-255', INT.x1 - 10, BY + BH / 2, backbone === 'palix' ? C.green : C.muted, 'right');
      caption(ctx, '低频词区', (LOW.x0 + LOW.x1) / 2 - 20, BY + BH / 2, backbone === 'palme' ? C.purple : C.muted);
      caption(ctx, '256 词', LOW.x1 - 10, BY + BH / 2, backbone === 'palme' ? C.orange : C.muted, 'right');
      caption(ctx, '普通词区', (NORM.x0 + NORM.x1) / 2, BY + BH / 2, C.muted);

      const xs1 = TOKENS.map((_, i) => ROW1_X0 + i * ROW1_GAP);
      const xs2 = TOKENS.map((_, i) => ROW2_X0 + i * ROW2_GAP);

      // landing dots on the band bottom edge
      ctx.save();
      ctx.fillStyle = backbone === 'palix' ? C.green : '#9fc7ae';
      xs1.forEach((x) => ctx.fillRect(x - 2.5, BY + BH - 6, 5, 5));
      ctx.fillStyle = backbone === 'palme' ? C.purple : '#bcb3d3';
      xs2.forEach((x) => ctx.fillRect(x - 2.5, BY + BH - 6, 5, 5));
      ctx.restore();

      // --- bottom 50%: the same action string under both vocabularies ---
      // PaLI-X row: numeric tokens on the integer region (green frames)
      ctx.save();
      if (backbone !== 'palix') ctx.globalAlpha = 0.45;
      caption(ctx, 'PaLI-X', 34, ROW1_Y, C.green, 'left');
      risers(ctx, xs1, ROW1_Y - 14, C.green);
      TOKENS.forEach((v, i) => vchip(ctx, xs1[i], ROW1_Y, v, 'palix'));
      ctx.restore();

      // PaLM-E row: tokens land in requisitioned low-freq slots
      ctx.save();
      if (backbone !== 'palme') ctx.globalAlpha = 0.45;
      caption(ctx, 'PaLM-E', 34, ROW2_Y, C.purple, 'left');
      risers(ctx, xs2, ROW2_Y - 24, C.purple);
      TOKENS.forEach((v, i) => {
        vchip(ctx, xs2[i], ROW2_Y, v, 'palme');
        // small orange index: the requisitioned slot this bin now maps to
        ctx.fillStyle = C.orange;
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(v, xs2[i] + 14, ROW2_Y - 13);
      });
      ctx.restore();

      drawLegend(ctx, [['整数词', C.green], ['征用槽', C.purple], ['普通词', C.muted]], 70, 262);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onBackbone = (b: Backbone) => {
    stateRef.current.bb = b;
    setBb(b);
    setFeedback(
      b === 'palix'
        ? { text: 'PaLI-X：每个整数本来就有专属词——档位直接当词用。', cls: '' }
        : { text: 'PaLM-E：数字没有专属词，就征用 256 个最低频词改造成动作词（symbol tuning）。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>骨干词表</label>
        <button className={`chip ${bb === 'palix' ? 'selected' : ''}`} onClick={() => onBackbone('palix')}>
          PaLI-X
        </button>
        <button className={`chip ${bb === 'palme' ? 'selected' : ''}`} onClick={() => onBackbone('palme')}>
          PaLM-E
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Vocab;

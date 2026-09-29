import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPotter,
  drawWheel,
  drawClay,
  drawChunkStrip,
  drawValueChip,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch2 module: a two-master + ablation workbench (P5 hotspots). The canvas
// shows three cards — 掌眼 (blue, magnifier), 巧手 (green, wheel + chunk
// strip) and the small grey π0-small card. Clicking a card or a DOM chip
// selects it; the fixed .hotspot-info region below lists its inputs/outputs.
const W = 1080;
const H = 280;

type Who = 'eye' | 'shape' | 'small';

const CARD: Record<Who, { x: number; y: number; w: number; h: number; color: string }> = {
  eye: { x: 40, y: 44, w: 320, h: 204, color: C.blue },
  shape: { x: 400, y: 44, w: 320, h: 204, color: C.green },
  small: { x: 760, y: 84, w: 280, h: 164, color: C.muted },
};

const DETAIL: Record<Who, string> = {
  eye: '<b>掌眼（PaliGemma 3B）</b>——输入：图像 / 语言 / 关节状态，线性投影进 token 空间；输出：语言 token，由<b>交叉熵</b>监督。',
  shape:
    '<b>巧手（300M 动作专家）</b>——独立权重、从零初始化；动作 token <b>全双向注意</b>；动作由<b>流匹配</b>监督。与掌眼合计 <b>3.3B</b>（Transfusion 式双目标同灶）。',
  small: '<b>π0-small（470M）</b>——无 VLM 的消融版：去掉掌眼、单人独灶；后文实验将用它量出掌眼值多少分。',
};

const FB: Record<Who, { text: string; cls: string }> = {
  eye: { text: '互联网预训练的家底全在这：看图、懂话、认关节状态。', cls: '' },
  shape: {
    text: '独立权重的 300M 专家——语言归交叉熵、动作归流匹配，双目标同灶（Transfusion 式）。',
    cls: '',
  },
  small: { text: '去掉掌眼的 470M 消融版——后文实验将量出掌眼值多少分。', cls: '' },
};

const CHIP_LABEL: Record<Who, string> = { eye: '掌眼', shape: '巧手', small: 'π0-small' };

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(a - 0.45), y2 - 8 * Math.sin(a - 0.45));
  ctx.lineTo(x2 - 8 * Math.cos(a + 0.45), y2 - 8 * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGlyphImage(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 13, y - 10, 26, 20);
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 6);
  ctx.lineTo(x - 2, y - 4);
  ctx.lineTo(x + 3, y + 2);
  ctx.lineTo(x + 7, y - 3);
  ctx.lineTo(x + 10, y + 6);
  ctx.stroke();
}

function drawGlyphLang(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 6);
  ctx.lineTo(x + 12, y - 6);
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 8, y);
  ctx.moveTo(x - 12, y + 6);
  ctx.lineTo(x + 11, y + 6);
  ctx.stroke();
}

function drawGlyphJoints(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.blue;
  [-8, 0, 8].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(x + dx, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

export const Ch2Experts: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ sel: Who }>({ sel: 'eye' });
  const [sel, setSel] = useState<Who>('eye');
  const [feedback, setFeedback] = useState(FB.eye);

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

    const render = (ms: number) => {
      const s = stateRef.current.sel;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      (Object.keys(CARD) as Who[]).forEach((who) => {
        const c = CARD[who];
        const active = who === s;
        ctx.save();
        ctx.fillStyle = C.white;
        ctx.strokeStyle = c.color;
        ctx.lineWidth = active ? 3.5 : 2;
        if (active) {
          ctx.shadowColor = c.color;
          ctx.shadowBlur = 14;
        }
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.w, c.h, 10);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // card floor line
        ctx.save();
        ctx.globalAlpha = active ? 1 : 0.75;
        ctx.strokeStyle = C.ground;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c.x + 16, c.y + c.h - 22);
        ctx.lineTo(c.x + c.w - 16, c.y + c.h - 22);
        ctx.stroke();
        ctx.restore();
      });

      // Card A: eye master + input glyphs + token arrows when selected.
      ctx.save();
      ctx.globalAlpha = s === 'eye' ? 1 : 0.78;
      drawGlyphImage(ctx, 130, 96);
      drawGlyphLang(ctx, 200, 96);
      drawGlyphJoints(ctx, 270, 96);
      drawPotter(ctx, 200, 226, 1.6, { mode: 'eye', t: ms / 700, color: C.blue });
      ctx.restore();
      if (s === 'eye') {
        const a = 0.45 + 0.45 * Math.sin(ms / 280);
        drawArrow(ctx, 130, 112, 182, 166, C.blue, 1.75, a);
        drawArrow(ctx, 200, 112, 200, 164, C.blue, 1.75, a);
        drawArrow(ctx, 270, 112, 218, 166, C.blue, 1.75, a);
      }

      // Card B: shape master at the wheel + purple action-token strip.
      ctx.save();
      ctx.globalAlpha = s === 'shape' ? 1 : 0.78;
      drawWheel(ctx, 600, 214, 22, { spin: ms / 460 });
      drawClay(ctx, 600, 202, 0.55 + 0.1 * Math.sin(ms / 400), {
        color: C.green,
        size: 0.75,
        t: ms / 500,
      });
      drawPotter(ctx, 540, 226, 1.5, { mode: 'shape', t: ms / 280, color: C.green });
      ctx.restore();
      drawChunkStrip(ctx, 420, 240, 260, 12, {
        color: C.purple,
        highlightTo: s === 'shape' ? Math.floor((ms / 160) % 13) : 12,
      });

      // Card C: the lone ablation master beside a grey stove.
      ctx.save();
      ctx.globalAlpha = s === 'small' ? 1 : 0.78;
      ctx.fillStyle = '#d9d4c8';
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(938, 200, 34, 26, 4);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = (s === 'small' ? 1 : 0.78) * (0.5 + 0.4 * Math.sin(ms / 130));
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(955, 190);
      ctx.quadraticCurveTo(948, 198, 955, 206);
      ctx.quadraticCurveTo(962, 198, 955, 190);
      ctx.fill();
      ctx.restore();
      drawPotter(ctx, 880, 226, 1.3, { mode: 'idle', t: ms / 900, color: C.muted });

      drawValueChip(ctx, 334, 68, '3B', C.blue);
      drawValueChip(ctx, 686, 68, '300M', C.green);
      drawValueChip(ctx, 1004, 106, '470M', C.muted);
      drawLegend(
        ctx,
        [['掌眼', C.blue], ['巧手', C.green], ['π0-small', C.muted]],
        40,
        270
      );
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

  const select = (who: Who) => {
    stateRef.current.sel = who;
    setSel(who);
    setFeedback(FB[who]);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    (Object.keys(CARD) as Who[]).forEach((who) => {
      const c = CARD[who];
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) select(who);
    });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl" style={{ justifyContent: 'center' }}>
        {(['eye', 'shape', 'small'] as Who[]).map((who) => (
          <button
            key={who}
            className={`chip ${sel === who ? 'selected' : ''}`}
            onClick={() => select(who)}
          >
            {CHIP_LABEL[who]}
          </button>
        ))}
      </div>
      <div
        className="hotspot-info"
        style={{ minHeight: 56 }}
        dangerouslySetInnerHTML={{ __html: DETAIL[sel] }}
      />
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Experts;

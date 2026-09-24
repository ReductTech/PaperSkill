import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawSceneLabel,
  drawLegend,
  drawValueChip,
} from './chefKit';
import type { WidgetProps } from './registry';

// Module 9.1 「涌现实验室」 — P4 chips, hybrid linked views.
// Left 45%: a scenario vignette for the selected never-trained task category
// (symbol / reasoning / person / all three). Right 55%: success-rate bars with
// the verified Table 5 numbers. RT-2 family bars are green, baselines red/muted.
const W = 1080;
const H = 280;

type Cat = 'symbol' | 'reasoning' | 'person' | 'all';

const CATS: { key: Cat; chip: string; label: string }[] = [
  { key: 'symbol', chip: '符号', label: '把苹果移到3' },
  { key: 'reasoning', chip: '推理', label: '算术与推理' },
  { key: 'person', chip: '人脸', label: '戴眼镜的人' },
  { key: 'all', chip: '总览', label: '三类涌现' },
];

// Verified numbers (Table 5): order fixed VC-1 / RT-1 / PaLI-X-55B / PaLM-E-12B.
const BARS: Record<Cat, { name: string; v: number; kind: 'base' | 'rt1' | 'rt2' }[]> = {
  all: [
    { name: 'VC-1', v: 11, kind: 'base' },
    { name: 'RT-1', v: 17, kind: 'rt1' },
    { name: 'PaLI-X', v: 60, kind: 'rt2' },
    { name: 'PaLM-E', v: 40, kind: 'rt2' },
  ],
  symbol: [
    { name: 'VC-1', v: 11, kind: 'base' },
    { name: 'RT-1', v: 16, kind: 'rt1' },
    { name: 'PaLI-X', v: 82, kind: 'rt2' },
    { name: 'PaLM-E', v: 36, kind: 'rt2' },
  ],
  reasoning: [
    { name: 'VC-1', v: 10, kind: 'base' },
    { name: 'RT-1', v: 16, kind: 'rt1' },
    { name: 'PaLI-X', v: 46, kind: 'rt2' },
    { name: 'PaLM-E', v: 43, kind: 'rt2' },
  ],
  person: [
    { name: 'VC-1', v: 13, kind: 'base' },
    { name: 'RT-1', v: 20, kind: 'rt1' },
    { name: 'PaLI-X', v: 53, kind: 'rt2' },
    { name: 'PaLM-E', v: 43, kind: 'rt2' },
  ],
};

const FEEDBACK: Record<Cat, { text: string; cls: string }> = {
  all: {
    text: '涌现评测平均：PaLI-X-55B 60 vs RT-1 17、VC-1 11——超 3 倍。这些任务全都不在机器人数据里。',
    cls: 'good',
  },
  symbol: {
    text: '『把苹果移到 3』——机器人数据里从没出现过数字牌。符号理解：82% vs RT-1 的 16%。这些知识只能来自网页预训练。',
    cls: 'good',
  },
  reasoning: {
    text: '算术、颜色、多语推理：46% vs RT-1 的 16%。数学子项里 PaLM-E-12B（56）反超 PaLI-X-55B（25）——预训练配方决定长处。',
    cls: 'good',
  },
  person: {
    text: '『把可乐拿给戴眼镜的人』——机器人数据里没有「戴眼镜」这个概念。人脸识别：53% vs RT-1 的 20%。',
    cls: 'good',
  },
};

const barColor = (kind: 'base' | 'rt1' | 'rt2') =>
  kind === 'rt2' ? C.green : kind === 'rt1' ? C.red : C.muted;

// --- vignette glyphs --------------------------------------------------------

function drawNumberPlate(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-15, -22, 30, 44, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.font = 'bold 21px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('3', 0, 1);
  ctx.restore();
}

function drawApple(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = C.red;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(1, -14);
  ctx.stroke();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.ellipse(6, -12, 5.4, 2.8, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCup(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-14, -19);
  ctx.lineTo(14, -19);
  ctx.lineTo(9, 0);
  ctx.lineTo(-9, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-11.5, -13);
  ctx.lineTo(11.5, -13);
  ctx.stroke();
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, withGlasses: boolean) {
  ctx.save();
  ctx.fillStyle = '#f2e3cf';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.text;
  const ex = r * 0.38;
  ctx.beginPath();
  ctx.arc(cx - ex, cy - r * 0.12, 1.6, 0, Math.PI * 2);
  ctx.arc(cx + ex, cy - r * 0.12, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.35, r * 0.4, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();
  if (withGlasses) {
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - ex, cy - r * 0.12, r * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + ex, cy - r * 0.12, r * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - ex + r * 0.34, cy - r * 0.12);
    ctx.lineTo(cx + ex - r * 0.34, cy - r * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, cat: Cat) {
  // vignette table
  ctx.strokeStyle = C.ground;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(40, 214);
  ctx.lineTo(452, 214);
  ctx.stroke();
  if (cat === 'symbol') {
    drawNumberPlate(ctx, 150, 170, 1);
    ctx.save();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(236, 158);
    ctx.lineTo(288, 158);
    ctx.moveTo(278, 150);
    ctx.lineTo(290, 158);
    ctx.lineTo(278, 166);
    ctx.stroke();
    ctx.restore();
    drawApple(ctx, 330, 190, 1.4);
  } else if (cat === 'reasoning') {
    ctx.save();
    ctx.fillStyle = C.blue;
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2+1', 140, 128);
    ctx.restore();
    drawCup(ctx, 250, 214, C.red, 1.4);
    drawCup(ctx, 320, 214, C.green, 1.4);
    drawCup(ctx, 390, 214, C.blue, 1.4);
  } else if (cat === 'person') {
    drawFace(ctx, 160, 140, 30, false);
    drawFace(ctx, 330, 140, 30, true);
  } else {
    // all: three mini vignettes side by side
    drawNumberPlate(ctx, 95, 172, 0.8);
    drawApple(ctx, 148, 190, 1);
    ctx.save();
    ctx.fillStyle = C.blue;
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2+1', 245, 160);
    ctx.restore();
    drawCup(ctx, 300, 214, C.green, 1);
    drawFace(ctx, 390, 165, 22, true);
  }
}

// ---------------------------------------------------------------------------

export const Ch9Emergent: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ cat: Cat; animStart: number }>({ cat: 'all', animStart: 0 });
  const [cat, setCat] = useState<Cat>('all');
  const [feedback, setFeedback] = useState(FEEDBACK.all);

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
      const { cat: c, animStart } = stateRef.current;
      const prog = easeOutCubic(clamp((ms - animStart) / 500, 0, 1));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawVignette(ctx, c);

      // right 55%: bars region x 500..1050, baseline y=236, 100% -> 170px
      const baseY = 236;
      const maxH = 170;
      const bars = BARS[c];
      const bw = 64;
      const gap = (550 - bars.length * bw) / (bars.length + 1);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(500, baseY + 0.5);
      ctx.lineTo(1050, baseY + 0.5);
      ctx.stroke();
      bars.forEach((b, i) => {
        const x = 500 + gap + i * (bw + gap);
        const h = (b.v / 100) * maxH * prog;
        const color = barColor(b.kind);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, baseY - h, bw, h, [4, 4, 0, 0]);
        ctx.fill();
        ctx.fillStyle = C.text;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.name, x + bw / 2, baseY + 16);
        if (prog > 0.35) drawValueChip(ctx, x + bw / 2, baseY - h - 16, String(b.v), color);
      });

      drawSceneLabel(ctx, CATS.find((k) => k.key === c)?.label ?? '', 24, 34, { color: C.text });
      drawSceneLabel(ctx, '成功率%', 1056, 34, { color: C.muted, align: 'right' });
      drawLegend(ctx, [['RT-2 系', C.green], ['RT-1', C.red], ['VC-1', C.muted]], 520, 34);
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

  const select = (key: Cat) => {
    stateRef.current = { cat: key, animStart: performance.now() };
    setCat(key);
    setFeedback(FEEDBACK[key]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step-label">任务类</span>
        {CATS.map((c) => (
          <button
            key={c.key}
            className={'chip' + (cat === c.key ? ' selected' : '')}
            onClick={() => select(c.key)}
          >
            {c.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Emergent;

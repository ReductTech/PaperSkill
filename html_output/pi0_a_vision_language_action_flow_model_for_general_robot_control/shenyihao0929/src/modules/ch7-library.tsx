import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawSceneLabel,
  drawLegend,
  drawValueChip,
  drawVerdict,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch.7 module 7.1 (P2 step-through): four steps of data curation.
// ① pour in open-source data (9.1%) → ② stack the in-house workhorse
// (903M steps: 106M single-arm + 797M dual-arm) → ③ re-weight by n^0.43 and
// zero-pad actions to 18 dims → ④ the two-stage apprenticeship (broad
// pre-training → 5-100+h refinement). A data-composition bar sits at the
// bottom; the shelf accumulates books as steps advance.
const W = 1080;
const H = 280;
const STEPS = 5; // 0 idle, 1-4 steps, 5 done

const GREENS = [C.green, '#39a06e', '#1f7f54'];

interface Tome {
  x: number;
  w: number;
  h: number;
  c: string;
  row: 0 | 1;
}

const OPEN_A: Array<[number, number, number]> = [
  [52, 15, 42], [70, 12, 36], [85, 17, 46], [105, 13, 38], [121, 16, 43],
];
const OWN_A: Array<[number, number, number]> = [
  [150, 17, 45], [170, 13, 37], [186, 19, 48], [208, 14, 40], [225, 16, 44],
  [244, 18, 46], [265, 13, 38],
];
const OWN_B: Array<[number, number, number]> = [
  [52, 14, 39], [69, 17, 46], [89, 12, 35], [104, 18, 47], [125, 15, 41],
  [143, 19, 48], [165, 13, 37], [181, 16, 44], [200, 14, 40], [217, 18, 46],
  [238, 12, 36], [253, 15, 42], [271, 17, 45],
];

const REVEAL: Tome[] = [
  ...OPEN_A.map(([x, w, h], i): Tome => ({ x, w, h, c: i % 2 ? '#5b7ba3' : C.blue, row: 0 })),
  ...OWN_A.map(([x, w, h], i): Tome => ({ x, w, h, c: GREENS[i % 3], row: 0 })),
  ...OWN_B.map(([x, w, h], i): Tome => ({ x, w, h, c: GREENS[(i + 1) % 3], row: 1 })),
];

const BASE_Y = [100, 172];

const FEEDBACK: Array<{ text: string; cls: string }> = [
  { text: '按『下一步』开始：四步攒出机器人操作史上最大的预训练数据混合。', cls: '' },
  { text: '① 倾入：开源数据占 9.1%（OXE Magic Soup、Bridge v2、DROID）——低频 2-10Hz，胜在场景广。', cls: '' },
  { text: '② 自有主力：903M 步（单臂 106M + 双臂 797M），撑起 1 万小时、7 平台、68 任务。', cls: '' },
  { text: '③ 配比：任务-平台组合按 n^0.43 降权防超采样；动作零填充到最大 18 维，缺图槽打掩码。', cls: '' },
  { text: '④ 学徒制：预训练博采众长，后训练 5-100+ 小时精修——类比 LLM 的预/后训练。', cls: '' },
  { text: '史上最大机器人操作预训练混合——而高质后训练才把『会』变成『熟』。', cls: 'good' },
];

function drawTome(
  ctx: CanvasRenderingContext2D,
  b: Tome,
  alpha = 1
) {
  const baseY = BASE_Y[b.row];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = b.c;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(b.x, baseY - b.h, b.w, b.h, 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x + b.w * 0.32, baseY - b.h + 4);
  ctx.lineTo(b.x + b.w * 0.32, baseY - 4);
  ctx.stroke();
  ctx.restore();
}

function drawShelf(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#efe9dc';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(34, 30, 488, 156, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ground;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  for (const by of [100, 172]) {
    ctx.beginPath();
    ctx.roundRect(38, by, 480, 6, 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawOversized(ctx: CanvasRenderingContext2D, shrunk: boolean, ms: number) {
  const k = shrunk ? 0.55 : 1;
  const w = 40 * k;
  const h = 58 * k;
  const x = 300 + (40 - w) / 2;
  const baseY = 172;
  ctx.save();
  ctx.fillStyle = GREENS[1];
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(x, baseY - h, w, h, 2);
  ctx.fill();
  ctx.stroke();
  if (shrunk) {
    // n^0.43 re-weight: orange dashed outline + down arrow + slider knob
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.25;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.roundRect(x - 4, baseY - h - 4, w + 8, h + 8, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    const bob = 1.5 * Math.sin(ms / 260);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, baseY - h - 26 + bob);
    ctx.lineTo(x + w / 2, baseY - h - 10 + bob);
    ctx.moveTo(x + w / 2 - 5, baseY - h - 17 + bob);
    ctx.lineTo(x + w / 2, baseY - h - 10 + bob);
    ctx.lineTo(x + w / 2 + 5, baseY - h - 17 + bob);
    ctx.stroke();
    // vertical slider glyph: knob pushed low = down-weighted
    const sx = 360;
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, baseY - 52);
    ctx.lineTo(sx, baseY - 6);
    ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx, baseY - 52);
    ctx.lineTo(sx, baseY - 14);
    ctx.stroke();
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(sx, baseY - 14, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCompositionBar(ctx: CanvasRenderingContext2D, step: number) {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(40, 206, 1000, 22, 5);
  ctx.fill();
  ctx.stroke();
  if (step >= 1) {
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.roundRect(44, 210, 91, 14, 3);
    ctx.fill();
    drawValueChip(ctx, 90, 217, '9.1%', C.blue);
  }
  if (step >= 2) {
    ctx.fillStyle = C.green;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.roundRect(135, 210, 901, 14, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawValueChip(ctx, 586, 217, '903M', C.green);
  }
  ctx.restore();
}

function drawPourCrate(ctx: CanvasRenderingContext2D, ms: number) {
  ctx.save();
  ctx.translate(612, 84);
  ctx.rotate(-0.35 + 0.03 * Math.sin(ms / 320));
  ctx.fillStyle = '#e9e2d3';
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-38, -24, 76, 48, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // falling open-source tomes with motion dashes
  const falls: Array<[number, number, number]> = [
    [668, 48, 0.3], [696, 76, -0.2], [676, 108, 0.12],
  ];
  falls.forEach(([fx, fy, rot], i) => {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.fillStyle = C.blue;
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(-7, -11, 14, 22, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.25;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(fx - 12, fy - 16 - i * 4);
    ctx.lineTo(fx - 12, fy - 26 - i * 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  // arrow toward the shelf
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(586, 100);
  ctx.lineTo(548, 108);
  ctx.moveTo(556, 100);
  ctx.lineTo(548, 108);
  ctx.lineTo(558, 114);
  ctx.stroke();
  drawValueChip(ctx, 700, 140, '2-10Hz', C.blue);
}

function drawArmSplit(ctx: CanvasRenderingContext2D, withLabels: boolean) {
  if (withLabels) {
    drawSceneLabel(ctx, '单臂', 566, 72, { color: C.text });
    drawSceneLabel(ctx, '双臂', 566, 100, { color: C.text });
  }
  ctx.fillStyle = GREENS[1];
  ctx.beginPath();
  ctx.roundRect(618, 66, 40, 10, 2);
  ctx.fill();
  drawValueChip(ctx, 684, 71, '106M', GREENS[1]);
  ctx.fillStyle = GREENS[2];
  ctx.beginPath();
  ctx.roundRect(618, 94, 300, 10, 2);
  ctx.fill();
  drawValueChip(ctx, 940, 99, '797M', GREENS[2]);
}

function drawBadges(ctx: CanvasRenderingContext2D) {
  drawValueChip(ctx, 770, 40, '1万小时', C.blue);
  drawValueChip(ctx, 864, 40, '7平台', C.blue);
  drawValueChip(ctx, 952, 40, '68任务', C.blue);
}

function drawZeroPadStrip(ctx: CanvasRenderingContext2D) {
  // n^0.43 slider-like glyph above the 18-slot strip
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(566, 124);
  ctx.lineTo(790, 124);
  ctx.stroke();
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(566, 124);
  ctx.lineTo(639, 124);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(639, 124, 4.5, 0, Math.PI * 2);
  ctx.fill();
  drawSceneLabel(ctx, 'n^0.43', 800, 124, { color: C.orange });
  // 18 slots: real dims filled, padded slots grey
  for (let i = 0; i < 18; i++) {
    const sx = 566 + i * 25;
    if (i < 8) {
      ctx.fillStyle = GREENS[1];
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(sx, 148, 22, 18, 3);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#e3e9f2';
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.roundRect(sx, 148, 22, 18, 3);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  drawValueChip(ctx, 1032, 157, '18', C.muted);
}

function drawCourseStrip(ctx: CanvasRenderingContext2D) {
  // stage 1: broad pre-training — many small books
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.roundRect(566, 128, 268, 52, 6);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 10; i++) {
    const bh = 26 + (i % 3) * 4;
    ctx.fillStyle = i % 2 ? '#5b7ba3' : C.blue;
    ctx.fillRect(580 + i * 25, 172 - bh, 15, bh);
  }
  drawSceneLabel(ctx, '预训练', 566, 116, { color: C.blue });
  // arrow
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(844, 154);
  ctx.lineTo(866, 154);
  ctx.moveTo(859, 147);
  ctx.lineTo(866, 154);
  ctx.lineTo(859, 161);
  ctx.stroke();
  // stage 2: refinement — a few gold books
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(874, 128, 158, 52, 6);
  ctx.fill();
  ctx.stroke();
  [894, 926, 958].forEach((gx, i) => {
    ctx.fillStyle = '#d9a441';
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(gx, 172 - 36, 20, 36, 2);
    ctx.fill();
    ctx.stroke();
    if (i === 1) {
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx + 7, 172 - 30);
      ctx.lineTo(gx + 7, 168);
      ctx.stroke();
    }
  });
  drawSceneLabel(ctx, '后训练', 874, 116, { color: C.green });
  drawValueChip(ctx, 992, 116, '5-100+h', C.orange);
}

export const Ch7Library: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ms: number) => {
      const s = stepRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(24, 244);
      ctx.lineTo(1056, 244);
      ctx.stroke();

      // shelf + cumulative tomes
      drawShelf(ctx);
      const openCount = OPEN_A.length;
      const ownCount = OWN_A.length + OWN_B.length;
      const shown = s >= 2 ? openCount + ownCount : s >= 1 ? openCount : 0;
      REVEAL.slice(0, shown).forEach((b) => drawTome(ctx, b));
      if (s >= 2) drawOversized(ctx, s >= 3, ms);

      // right panel, step by step
      if (s === 0 || s === 1) drawPourCrate(ctx, ms);
      if (s >= 2) {
        drawBadges(ctx);
        drawArmSplit(ctx, s === 2);
      }
      if (s >= 3) drawZeroPadStrip(ctx);
      if (s >= 4) drawCourseStrip(ctx);
      if (s === 5) drawVerdict(ctx, 1008, 66, true, { r: 16, pulse: ms / 420 });

      // legend + composition bar
      if (s >= 1) {
        drawLegend(ctx, [['开源', C.blue], ['自有', C.green]], 566, 24);
      }
      drawCompositionBar(ctx, s);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const goto = (v: number) => {
    const nv = clamp(v, 0, STEPS);
    stepRef.current = nv;
    setStep(nv);
  };

  const stepLabel = step <= 4 ? `${step}/4` : '完成';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <span className="step-label">
          步骤 <b>{stepLabel}</b>
        </span>
        <button className="tiny ghost" disabled={step === 0} onClick={() => goto(step - 1)}>
          上一步
        </button>
        <button className="tiny" disabled={step === STEPS} onClick={() => goto(step + 1)}>
          下一步
        </button>
      </div>
      <div className={`feedback ${FEEDBACK[step].cls}`}>{FEEDBACK[step].text}</div>
    </div>
  );
};

export default Ch7Library;

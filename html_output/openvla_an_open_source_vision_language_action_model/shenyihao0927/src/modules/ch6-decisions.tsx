import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawVerdict, drawLegend } from './flatKit';
import type { WidgetProps } from './registry';

// Module 6.1 — the decision lab (P4 chips widget): four design decisions
// (backbone / resolution / vision encoder / epochs). Row 1 chips pick the group,
// row 2 chips pick the option; the canvas shows the paper-verified conclusion.
// 1080x280 canvas + chips + feedback; training scale printed in the ctrl bar.
const W = 1080;
const H = 280;

const GROUPS = ['骨干', '分辨率', '视觉', '轮数'];
const GROUP_TITLES = ['骨干', '分辨率', '视觉编码器', '训练轮数'];
const GROUP_MARKS = ['①', '②', '③', '④'];
const GROUP_QUESTIONS = ['用哪套骨干？', '分辨率多大？', '编码器冻不冻？', '练几轮停？'];
const OPTIONS = [
  ['IDEFICS-1', 'LLaVA', 'Prismatic'],
  ['224px', '384px'],
  ['冻结', '微调'],
  ['1-2 轮', '>95% 停'],
];
// index of the paper's verified pick per group
const PAPER_PICK = [2, 0, 1, 1];

const FB: { text: string; cls: string }[][] = [
  [
    {
      text: 'IDEFICS-1 语言接地最弱：比 LLaVA 低 35 个百分点——接地是 VLA 的地基，起点就输了。',
      cls: 'bad',
    },
    {
      text: 'LLaVA 比 IDEFICS-1 高 35 个百分点（语言接地消融）——明显更好，但还不是终点。',
      cls: '',
    },
    {
      text: '<b>融合双眼的 Prismatic 再 +10 个百分点</b>——OpenVLA 的骨干就选它。',
      cls: 'good',
    },
  ],
  [
    {
      text: '<b>224px：效果与 384px 持平，训练却快 3 倍</b>——OpenVLA 定格 224。',
      cls: 'good',
    },
    {
      text: '384px：效果没有涨，训练时间 ×3——分辨率堆料不等于效果。',
      cls: 'bad',
    },
  ],
  [
    {
      text: '冻结视觉是 VLM 惯例，但 VLA 行不通：预训练特征的空间细节不够，抓不准。',
      cls: 'bad',
    },
    {
      text: '反直觉但关键：视觉编码器必须解冻——预训练特征的空间细节不够精确控制',
      cls: 'good',
    },
  ],
  [
    {
      text: 'LLM 惯例 1-2 轮就收工——但真机性能还在涨，停早了。',
      cls: 'bad',
    },
    {
      text: '<b>练到动作词准确率 >95% 才停</b>：真机性能持续上升，最终跑了 27 轮。',
      cls: 'good',
    },
  ],
];

interface TxtOpts {
  size?: number;
  bold?: boolean;
  color?: string;
  align?: CanvasTextAlign;
}

function txt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, o: TxtOpts = {}): void {
  ctx.save();
  ctx.fillStyle = o.color ?? C.text;
  const weight = o.bold ? 'bold ' : '';
  ctx.font = `${weight}${o.size ?? 13}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Width-aware numeric chip. */
function chip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string
): void {
  ctx.save();
  ctx.font = 'bold 12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - tw / 2 - 8, y - 12, tw + 16, 24, 6);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

/** Left card: which group, which option, verdict against the paper. */
function drawDecisionCard(
  ctx: CanvasRenderingContext2D,
  g: number,
  opt: number,
  p: number,
  now: number
): void {
  ctx.save();
  ctx.translate(0, (1 - easeOutCubic(p)) * 14);
  ctx.globalAlpha = clamp(p * 1.4, 0, 1);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(20, 26, 300, 226, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.roundRect(20, 26, 300, 6, 3);
  ctx.fill();
  // group mark + title
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(56, 66, 15, 0, Math.PI * 2);
  ctx.fill();
  txt(ctx, GROUP_MARKS[g], 56, 67, { size: 14, bold: true, color: C.white, align: 'center' });
  txt(ctx, GROUP_TITLES[g], 82, 66, { size: 21, bold: true });
  txt(ctx, GROUP_QUESTIONS[g], 170, 100, { size: 12, color: C.muted, align: 'center' });
  // selected option chip
  const pick = PAPER_PICK[g] === opt;
  const oc = pick ? C.green : C.red;
  ctx.font = 'bold 17px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const tw = ctx.measureText(OPTIONS[g][opt]).width;
  ctx.fillStyle = C.white;
  ctx.strokeStyle = oc;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(170 - tw / 2 - 16, 128, tw + 32, 38, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = oc;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(OPTIONS[g][opt], 170, 148);
  // verdict against the paper conclusion
  drawVerdict(ctx, 170, 208, pick, { r: 18, pulse: now / 500 });
  ctx.restore();
}

/** ① backbone: three grounding bars, relative heights. */
function drawBackbone(ctx: CanvasRenderingContext2D, opt: number, p: number): void {
  const baseY = 232;
  const e = easeOutCubic(p);
  const vals = [
    { name: 'IDEFICS-1', v: 0, h: 44, color: '#94a7bd', chipText: '基准' },
    { name: 'LLaVA', v: 35, h: 160, color: C.blue, chipText: '+35' },
    { name: 'Prismatic', v: 45, h: 198, color: C.green, chipText: '+10' },
  ];
  txt(ctx, '语言接地', 360, 40, { size: 13, bold: true, color: C.muted });
  vals.forEach((b, i) => {
    const cx = 460 + i * 240;
    const h = b.h * e;
    ctx.save();
    if (i === opt) {
      ctx.shadowColor = 'rgba(39, 68, 110, 0.35)';
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = b.color;
    ctx.globalAlpha = i === opt ? 1 : 0.55 + 0.15 * e;
    ctx.beginPath();
    ctx.roundRect(cx - 62, baseY - h, 124, h, 6);
    ctx.fill();
    ctx.restore();
    if (i === opt) {
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 62, baseY - b.h - 6, 124, b.h + 12, 8);
      ctx.stroke();
      ctx.restore();
    }
    if (e > 0.4) chip(ctx, cx, baseY - b.h - 26, b.chipText, b.color);
    txt(ctx, b.name, cx, baseY + 18, {
      size: 13,
      bold: i === 2 || i === opt,
      color: i === opt ? C.text : C.muted,
      align: 'center',
    });
    if (i === 2) txt(ctx, '✓', cx + 92, baseY - b.h - 26, { size: 15, bold: true, color: C.green });
  });
}

/** ② resolution: two cards, equal accuracy, 384 pays 3x training time. */
function drawResolution(ctx: CanvasRenderingContext2D, opt: number, p: number): void {
  const e = easeOutCubic(p);
  const cards = [
    { x: 380, name: '224px', pick: true, timeW: 62, timeColor: C.green, chip: '1×' },
    { x: 712, name: '384px', pick: false, timeW: 186, timeColor: C.red, chip: '3×' },
  ];
  cards.forEach((cd, i) => {
    const sel = i === opt;
    ctx.save();
    ctx.globalAlpha = (sel ? 1 : 0.6) * clamp(p * 1.4, 0, 1);
    ctx.translate(0, (1 - e) * 14);
    ctx.fillStyle = C.white;
    ctx.strokeStyle = sel ? (cd.pick ? C.green : C.red) : C.border;
    ctx.lineWidth = sel ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(cd.x, 56, 288, 176, 10);
    ctx.fill();
    ctx.stroke();
    txt(ctx, cd.name, cd.x + 144, 88, {
      size: 24,
      bold: true,
      color: cd.pick ? C.green : C.red,
      align: 'center',
    });
    txt(ctx, '效果持平', cd.x + 144, 126, { size: 15, color: C.muted, align: 'center' });
    // training-time bar
    const bx = cd.x + 36;
    const by = 158;
    ctx.fillStyle = '#e8edf4';
    ctx.beginPath();
    ctx.roundRect(bx, by, 216, 18, 4);
    ctx.fill();
    ctx.fillStyle = cd.timeColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(cd.timeW * e, 2), 18, 4);
    ctx.fill();
    txt(ctx, '训练时间', bx, by + 36, { size: 12, color: C.muted });
    chip(ctx, cd.x + 252, by + 36, cd.chip, cd.timeColor);
    drawVerdict(ctx, cd.x + 252, 88, cd.pick, { r: 12, pulse: 0 });
    ctx.restore();
  });
}

/** ③ vision encoder: freeze (VLM habit, fails) vs finetune (must for VLA). */
function drawVision(ctx: CanvasRenderingContext2D, opt: number, p: number, now: number): void {
  const e = easeOutCubic(p);
  const cards = [
    { x: 380, name: '冻结', pick: false, note: '空间细节不够' },
    { x: 712, name: '微调', pick: true, note: 'VLA 必修' },
  ];
  cards.forEach((cd, i) => {
    const sel = i === opt;
    ctx.save();
    ctx.globalAlpha = (sel ? 1 : 0.6) * clamp(p * 1.4, 0, 1);
    ctx.translate(0, (1 - e) * 14);
    ctx.fillStyle = cd.pick ? '#f0f9f4' : '#fdf1f2';
    ctx.strokeStyle = sel ? (cd.pick ? C.green : C.red) : C.border;
    ctx.lineWidth = sel ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(cd.x, 56, 288, 176, 10);
    ctx.fill();
    ctx.stroke();
    txt(ctx, cd.name, cd.x + 144, 90, {
      size: 24,
      bold: true,
      color: cd.pick ? C.green : C.red,
      align: 'center',
    });
    txt(ctx, cd.note, cd.x + 144, 130, { size: 15, color: C.muted, align: 'center' });
    drawVerdict(ctx, cd.x + 144, 186, cd.pick, { r: 20, pulse: sel ? now / 500 : 0 });
    txt(ctx, 'VLM 惯例', cd.x + 40, 186, { size: 11, color: C.muted });
    txt(ctx, '反惯例', cd.x + 248, 186, { size: 11, color: C.orange, align: 'right' });
    ctx.restore();
  });
}

/** ④ epochs: accuracy curve, 95% threshold line, 27-epoch badge. */
function drawEpochs(ctx: CanvasRenderingContext2D, opt: number, p: number, now: number): void {
  const x0 = 400;
  const x1 = 1000;
  const yBase = 224;
  const yTop = 64;
  const accAt = (e: number): number => 95 - 60 * Math.exp(-e / 6);
  const ex = (e: number): number => x0 + (e / 30) * (x1 - x0);
  const ay = (acc: number): number => yBase - (acc / 100) * (yBase - yTop);
  // axes
  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, yTop - 10);
  ctx.lineTo(x0, yBase);
  ctx.lineTo(x1 + 10, yBase);
  ctx.stroke();
  // 95% threshold
  const ty = ay(95);
  ctx.strokeStyle = C.orange;
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, ty);
  ctx.lineTo(x1 + 10, ty);
  ctx.stroke();
  ctx.setLineDash([]);
  txt(ctx, '95%', x1 + 16, ty, { size: 12, bold: true, color: C.orange });
  txt(ctx, '0', x0, yBase + 16, { size: 11, color: C.muted, align: 'center' });
  txt(ctx, '2', ex(2), yBase + 16, { size: 11, color: opt === 0 ? C.red : C.muted, align: 'center' });
  txt(ctx, '27', ex(27), yBase + 16, { size: 11, bold: opt === 1, color: C.green, align: 'center' });
  txt(ctx, 'epoch', x1 + 10, yBase + 32, { size: 11, color: C.muted, align: 'right' });
  txt(ctx, '动作词准确率', x0 + 8, yTop - 18, { size: 12, color: C.muted });
  // the accuracy curve
  const drawCurve = (eEnd: number, color: string, width: number): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let e = 0; e <= eEnd; e += 0.5) {
      const x = ex(e);
      const y = ay(accAt(e));
      if (e === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  if (opt === 0) {
    // LLM habit: stop after 1-2 epochs, well below the threshold
    drawCurve(30, '#e3d6d9', 2);
    drawCurve(2, C.red, 4);
    const exn = ex(2);
    const eyn = ay(accAt(2));
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(exn, eyn, 6, 0, Math.PI * 2);
    ctx.fill();
    drawVerdict(ctx, exn + 44, eyn - 30, false, { r: 12, pulse: now / 500 });
    chip(ctx, exn + 44, eyn + 4, '2 轮', C.red);
  } else {
    // train until action-token accuracy > 95%: 27 epochs
    const pe = 27 * easeOutCubic(p);
    drawCurve(pe, C.green, 4);
    const exn = ex(pe);
    const eyn = ay(accAt(pe));
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(exn, eyn, 6, 0, Math.PI * 2);
    ctx.fill();
    if (p > 0.95) {
      drawVerdict(ctx, exn - 40, eyn - 36, true, { r: 12, pulse: now / 500 });
      chip(ctx, ex(27) + 8, ty - 22, '27', C.green);
    }
  }
  ctx.restore();
}

const LEGENDS: [string, string][][] = [
  [
    ['本文选择', C.green],
    ['当前查看', C.orange],
  ],
  [
    ['本文选择', C.green],
    ['对照', C.red],
  ],
  [
    ['本文选择', C.green],
    ['VLM 惯例', C.red],
  ],
  [
    ['继续训练', C.green],
    ['提前停', C.red],
  ],
];

export const Ch6Decisions: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [group, setGroup] = useState(0);
  const [opts, setOpts] = useState<number[]>(PAPER_PICK.map(() => 0));
  const selRef = useRef({ g: 0, o: 0, at: 0 });

  const select = (g: number, o: number): void => {
    selRef.current = { g, o, at: performance.now() };
    setGroup(g);
    setOpts((prev) => {
      const next = [...prev];
      next[g] = o;
      return next;
    });
  };

  useEffect(() => {
    selRef.current = { g: 0, o: 0, at: performance.now() };
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
      const { g, o, at } = selRef.current;
      const p = clamp((ms - at) / 600, 0, 1);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      drawDecisionCard(ctx, g, o, p, ms);
      if (g === 0) drawBackbone(ctx, o, p);
      else if (g === 1) drawResolution(ctx, o, p);
      else if (g === 2) drawVision(ctx, o, p, ms);
      else drawEpochs(ctx, o, p, ms);
      drawLegend(ctx, LEGENDS[g], 360, 266);
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

  const opt = opts[group];
  const fb = FB[group][opt];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row" style={{ margin: 0, width: '100%' }}>
          {GROUPS.map((gname, i) => (
            <button
              key={gname}
              className={`chip${group === i ? ' selected' : ''}`}
              onClick={() => select(i, opts[i])}
            >
              {GROUP_MARKS[i]} {gname}
            </button>
          ))}
        </div>
        <div className="chip-row" style={{ margin: 0, width: '100%' }}>
          {OPTIONS[group].map((oname, i) => (
            <button
              key={oname}
              className={`chip${opt === i ? ' selected' : ''}`}
              onClick={() => select(group, i)}
            >
              {oname}
            </button>
          ))}
        </div>
        <label style={{ width: '100%' }}>
          训练规模 <span className="val">64×A100 · 14 天 · 21,500 卡时 · batch 2048 · lr 2e-5</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default Ch6Decisions;

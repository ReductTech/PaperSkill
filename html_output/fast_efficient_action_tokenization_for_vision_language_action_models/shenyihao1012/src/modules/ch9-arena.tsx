import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawCheckMark, drawArm } from './packKit';
import type { WidgetProps } from './registry';

// §9.1 — three battle arenas on one board (paper Fig. 6):
//   高频对决  : Bussing 20Hz / ShirtFold 50Hz — naive flat vs FAST/FSQ/FAST+.
//   换骨干    : OpenVLA naive low vs OpenVLA+FAST high (50Hz folding).
//   DROID 零样本 : three unseen-campus cards + "first zero-shot" badge.
// Bars are QUALITATIVE (示意); the DOM footnote points at paper Fig. 6.
const W = 1080;
const H = 340;
const GROW = 650;

interface Fb {
  html: string;
  cls: string;
}

const PANELS: { name: string; fb: Fb }[] = [
  {
    name: '高频对决',
    fb: {
      cls: 'good',
      html:
        'Bussing 20Hz / ShirtFold 50Hz：naive <b>无法取得进展</b>；压缩式 token 化有效训练——FAST ≥ FSQ（学习式量化，无需另训网络），FAST+ 通用版追平专用版。',
    },
  },
  {
    name: '换骨干',
    fb: {
      cls: 'good',
      html:
        'OpenVLA（7B，改多图输入 + 1 秒块）在 50Hz 叠衣上换 FAST+ 后<b>大幅提升</b>——先压缩再记录，不挑骨干。',
    },
  },
  {
    name: 'DROID 零样本',
    fb: {
      cls: 'good',
      html:
        '首个在全量 DROID 上训练、在<b>完全未见环境</b>零样本评测的策略：Berkeley / Stanford / UW 三校园、纯语言提示；失败尝试也行为合理。',
    },
  },
];

function tiny(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { color?: string; size?: number; align?: CanvasTextAlign; bold?: boolean }
) {
  ctx.save();
  ctx.fillStyle = opts?.color ?? C.muted;
  ctx.font = `${opts?.bold ? '600 ' : ''}${opts?.size ?? 12}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = opts?.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function tagChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { fill?: string; color?: string; border?: string; size?: number }
) {
  const size = opts?.size ?? 12;
  ctx.save();
  ctx.font = `600 ${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = 8;
  const h = size + 10;
  ctx.beginPath();
  ctx.roundRect(x, y - h / 2, tw + pad * 2, h, h / 2);
  ctx.fillStyle = opts?.fill ?? '#fbe9ec';
  ctx.fill();
  if (opts?.border) {
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
  ctx.fillStyle = opts?.color ?? C.red;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + 1);
  ctx.restore();
}

function hbar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxLen: number,
  h: number,
  frac: number,
  color: string,
  prog: number
) {
  const len = Math.max(4, maxLen * frac * prog);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y - h / 2, len, h, 6);
  ctx.fill();
  ctx.restore();
}

// ---- task glyphs (simple canvas icons) ----

function glyphPick(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 12, y - 6, 24, 20, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 6);
  ctx.lineTo(x - 7, y - 13);
  ctx.moveTo(x + 7, y - 6);
  ctx.lineTo(x + 7, y - 13);
  ctx.stroke();
  ctx.strokeStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(x, y - 32);
  ctx.lineTo(x, y - 18);
  ctx.moveTo(x - 4, y - 24);
  ctx.lineTo(x, y - 32);
  ctx.lineTo(x + 4, y - 24);
  ctx.stroke();
  ctx.restore();
}

function glyphCupboard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 22, 32, 36, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x, y + 14);
  ctx.stroke();
  ctx.strokeStyle = C.text;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 4);
  ctx.lineTo(x - 5, y + 2);
  ctx.moveTo(x + 5, y - 4);
  ctx.lineTo(x + 5, y + 2);
  ctx.stroke();
  ctx.restore();
}

function glyphFaucet(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 14);
  ctx.lineTo(x - 14, y - 12);
  ctx.lineTo(x + 4, y - 12);
  ctx.lineTo(x + 4, y - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 12);
  ctx.lineTo(x - 14, y - 20);
  ctx.moveTo(x - 18, y - 20);
  ctx.lineTo(x - 10, y - 20);
  ctx.stroke();
  ctx.strokeStyle = C.green;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 2);
  ctx.lineTo(x + 4, y + 6);
  ctx.stroke();
  ctx.restore();
}

// ---- panels ----

function drawHiFreq(ctx: CanvasRenderingContext2D, prog: number) {
  drawSceneLabel(ctx, 'Bussing · 20Hz', 96, 36);
  drawSceneLabel(ctx, 'ShirtFold · 50Hz', 576, 36);
  const rows = [
    { cap: 'naive', frac: 0.015, color: C.red },
    { cap: 'FSQ', frac: 0.62, color: '#7dbb9b' },
    { cap: 'FAST', frac: 0.92, color: C.green },
    { cap: 'FAST+', frac: 0.92, color: '#3ba36f' },
  ];
  [80, 560].forEach((gx) => {
    rows.forEach((r, i) => {
      const y = 66 + i * 60;
      tiny(ctx, r.cap, gx + 6, y, { bold: r.cap === 'naive' });
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(gx + 92, y - 16);
      ctx.lineTo(gx + 92, y + 16);
      ctx.stroke();
      hbar(ctx, gx + 96, y, 326, 26, r.frac, r.color, prog);
      if (r.cap === 'naive') {
        tagChip(ctx, '无法取得进展', gx + 122, y, {
          fill: '#fbe9ec',
          color: C.red,
          border: C.red,
        });
      }
    });
  });
}

function drawBackbone(ctx: CanvasRenderingContext2D, prog: number, t: number) {
  drawSceneLabel(ctx, '50Hz 叠衣 · OpenVLA 骨干（多图输入 + 1 秒块）', 150, 44);
  tiny(ctx, 'OpenVLA naive', 150, 110, { bold: true });
  hbar(ctx, 310, 110, 560, 40, 0.26, C.red, prog);
  tiny(ctx, 'OpenVLA + FAST+', 150, 208, { bold: true, color: C.green });
  hbar(ctx, 310, 208, 560, 40, 0.9, C.green, prog);
  // bridge tag between the two bars
  ctx.save();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(310 + 560 * 0.58, 130);
  ctx.lineTo(310 + 560 * 0.58, 188);
  ctx.stroke();
  ctx.restore();
  tagChip(ctx, '大幅提升', 310 + 560 * 0.58 + 14, 159, {
    fill: '#e2f3ea',
    color: C.green,
    border: C.green,
    size: 13,
  });
  drawArm(ctx, 950, 306, {
    scale: 2.1,
    angle: 0.3 + 0.12 * Math.sin(t * 2 * Math.PI),
    grip: 0.55 + 0.25 * Math.sin(t * 2 * Math.PI + 1),
    color: C.blue,
  });
}

function drawDroid(ctx: CanvasRenderingContext2D, prog: number) {
  tagChip(ctx, '首个零样本', W - 178, 36, {
    fill: C.green,
    color: C.white,
    size: 14,
  });
  const cards = [
    { cx: 212, name: 'Berkeley' },
    { cx: 540, name: 'Stanford' },
    { cx: 868, name: 'U. Washington' },
  ];
  const e = easeOutCubic(prog);
  cards.forEach((cd) => {
    const x = cd.cx - 132;
    const y = 66 - (1 - e) * 12;
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.7 * e;
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, 264, 196, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    tiny(ctx, cd.name, cd.cx, y + 24, { bold: true, size: 14, align: 'center', color: C.text });
    glyphPick(ctx, cd.cx - 78, y + 92);
    glyphCupboard(ctx, cd.cx, y + 92);
    glyphFaucet(ctx, cd.cx + 78, y + 92);
    tiny(ctx, '抓放', cd.cx - 78, y + 156, { size: 11, align: 'center' });
    tiny(ctx, '柜门', cd.cx, y + 156, { size: 11, align: 'center' });
    tiny(ctx, '水龙头', cd.cx + 78, y + 156, { size: 11, align: 'center' });
    drawCheckMark(ctx, x + 264 - 20, y + 20, 8);
  });
  tiny(ctx, '15Hz · 纯语言提示 · 无共训 / 无微调 · 环境完全未见', W / 2, H - 14, {
    align: 'center',
  });
}

export const Ch9Arena: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef(0);
  const startRef = useRef(0);
  const [cur, setCur] = useState(0);
  const [fb, setFb] = useState<Fb>(PANELS[0].fb);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    startRef.current = performance.now();
    let raf = 0;
    const render = (ms: number) => {
      const prog = easeOutCubic(clamp((ms - startRef.current) / GROW, 0, 1));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      if (panelRef.current === 0) drawHiFreq(ctx, prog);
      else if (panelRef.current === 1) drawBackbone(ctx, prog, ms / 1500);
      else drawDroid(ctx, prog);
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

  const select = (i: number) => {
    panelRef.current = i;
    startRef.current = performance.now();
    setCur(i);
    setFb(PANELS[i].fb);
  };

  return (
    <div>
      <div className="chip-row">
        {PANELS.map((p, i) => (
          <button
            key={p.name}
            className={`chip${i === cur ? ' selected' : ''}`}
            onClick={() => select(i)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-desc" style={{ padding: '2px 0 6px' }}>
        柱高为示意，结论以论文图 6 为准 · 10 trials 级
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.html }} />
    </div>
  );
};

export default Ch9Arena;

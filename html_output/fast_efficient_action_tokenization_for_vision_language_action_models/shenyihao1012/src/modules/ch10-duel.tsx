import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawLegend } from './packKit';
import type { WidgetProps } from './registry';

// §10.1 — π0-FAST vs diffusion π0, four accounts (paper Fig. 9):
//   小数据     : LIBERO / folding (<50h) — tied pairs.
//   大数据收敛 : Bussing on a TRAINING-STEPS axis — FAST high at 1×, diffusion 3×.
//   语言跟随   : DROID instruction following — diffusion ignores, FAST obeys.
//   算力账     : 5× GPU-hours hero chip + 1/5-length bar.
// Bars are QUALITATIVE (示意); the DOM footnote points at paper Fig. 9/1/11.
const W = 1080;
const H = 340;
const GROW = 650;

interface Fb {
  html: string;
  cls: string;
}

const PANELS: { name: string; fb: Fb }[] = [
  {
    name: '小数据',
    fb: {
      cls: '',
      html:
        '小数据（&lt;50h：LIBERO / 叠衣）两版<b>打平</b>——换动作 token 化没有拖 π0 的后腿。',
    },
  },
  {
    name: '大数据收敛',
    fb: {
      cls: 'good',
      html:
        '大 Bussing 上 π0-FAST 以 <b>3× 更少训练步数</b>达到高性能——数据越大，高信息 token 越占便宜。',
    },
  },
  {
    name: '语言跟随',
    fb: {
      cls: 'good',
      html:
        'DROID 上自回归版<b>更听语言指令</b>；扩散版常无视指令、上手就抓。',
    },
  },
  {
    name: '算力账',
    fb: {
      cls: 'good',
      html:
        '1 万小时级数据追平扩散 π0（含叠衣），GPU 时只要 <b>1/5</b>——对动辄数千卡时的训练，这是真金白银。',
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
  ctx.fillStyle = opts?.fill ?? '#e9eff8';
  ctx.fill();
  if (opts?.border) {
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
  ctx.fillStyle = opts?.color ?? C.blue;
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

function vbar(
  ctx: CanvasRenderingContext2D,
  x: number,
  axisY: number,
  w: number,
  hMax: number,
  frac: number,
  color: string,
  prog: number,
  alpha?: number
) {
  const h = Math.max(3, hMax * frac * prog);
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, axisY - h, w, h, 5);
  ctx.fill();
  ctx.restore();
}

// ---- panels ----

function drawSmall(ctx: CanvasRenderingContext2D, prog: number) {
  tagChip(ctx, '<50h 打平', W / 2 - 56, 36, {
    fill: '#e9eff8',
    color: C.blue,
    size: 14,
  });
  drawSceneLabel(ctx, 'LIBERO', 150, 86);
  drawSceneLabel(ctx, '叠衣', 630, 86);
  const rows = [
    { cap: 'π0-FAST', frac: 0.85, color: C.green },
    { cap: '扩散 π0', frac: 0.85, color: C.red },
  ];
  [150, 630].forEach((gx) => {
    rows.forEach((r, i) => {
      const y = 116 + i * 74;
      tiny(ctx, r.cap, gx + 6, y, { bold: true });
      hbar(ctx, gx + 100, y, 250, 34, r.frac, r.color, prog);
    });
  });
  tiny(ctx, '=', 546, 158, { size: 30, bold: true, color: C.blue, align: 'center' });
}

function drawBig(ctx: CanvasRenderingContext2D, prog: number) {
  drawSceneLabel(ctx, 'Bussing · 横轴 = 训练步数', 150, 42);
  drawLegend(
    ctx,
    [
      ['π0-FAST', C.green],
      ['扩散 π0', C.red],
    ],
    700,
    42
  );
  const axisY = 288;
  ctx.save();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(230, axisY);
  ctx.lineTo(952, axisY);
  ctx.moveTo(944, axisY - 6);
  ctx.lineTo(954, axisY);
  ctx.lineTo(944, axisY + 6);
  ctx.stroke();
  ctx.restore();
  const hMax = 196;
  vbar(ctx, 396, axisY, 48, hMax, 0.88, C.green, prog);
  vbar(ctx, 450, axisY, 48, hMax, 0.34, C.red, prog, 0.4);
  vbar(ctx, 856, axisY, 48, hMax, 0.86, C.red, prog);
  tiny(ctx, '1×', 422, axisY + 20, { size: 13, bold: true, align: 'center', color: C.green });
  tiny(ctx, '3×', 880, axisY + 20, { size: 13, bold: true, align: 'center', color: C.red });
  tagChip(ctx, '3× 步数', 636, 170, {
    fill: '#e2f3ea',
    color: C.green,
    border: C.green,
    size: 13,
  });
  tiny(ctx, '同一高性能，压缩打包 1× 步即达', 540, 216, { align: 'center' });
}

function drawLang(ctx: CanvasRenderingContext2D, prog: number) {
  drawSceneLabel(ctx, 'DROID · 语言指令跟随', 150, 44);
  tiny(ctx, '扩散 π0', 150, 116, { bold: true });
  hbar(ctx, 270, 116, 600, 38, 0.42, C.red, prog);
  tagChip(ctx, '常无视指令', 270 + 600 * 0.42 * prog + 14, 116, {
    fill: '#fbe9ec',
    color: C.red,
    border: C.red,
  });
  tiny(ctx, 'π0-FAST', 150, 212, { bold: true, color: C.green });
  hbar(ctx, 270, 212, 600, 38, 0.9, C.green, prog);
  tagChip(ctx, '听指令', 270 + 600 * 0.9 * prog + 14, 212, {
    fill: '#e2f3ea',
    color: C.green,
    border: C.green,
  });
}

function drawCompute(ctx: CanvasRenderingContext2D, prog: number, t: number) {
  const pulse = 1 + 0.02 * Math.sin(t * 2 * Math.PI);
  ctx.save();
  ctx.translate(W / 2, 49);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.roundRect(-112, -23, 224, 46, 23);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = '700 20px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('5× GPU 时', 0, 1);
  ctx.restore();
  drawSceneLabel(ctx, '训练算力（GPU 时）', 150, 108);
  tiny(ctx, '扩散 π0', 150, 154, { bold: true });
  hbar(ctx, 270, 154, 640, 38, 1, C.red, prog);
  tiny(ctx, 'π0-FAST', 150, 226, { bold: true, color: C.green });
  hbar(ctx, 270, 226, 640, 38, 0.2, C.green, prog);
  tagChip(ctx, '1/5', 270 + 640 * 0.2 * prog + 14, 226, {
    fill: '#e2f3ea',
    color: C.green,
    border: C.green,
    size: 13,
  });
  tiny(ctx, '同一份 π0 混合数据（903M 自有步 + 9.1% 开源）上训练', W / 2, 288, {
    align: 'center',
  });
}

export const Ch10Duel: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      if (panelRef.current === 0) drawSmall(ctx, prog);
      else if (panelRef.current === 1) drawBig(ctx, prog);
      else if (panelRef.current === 2) drawLang(ctx, prog);
      else drawCompute(ctx, prog, ms / 1200);
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
      {cur === 3 && (
        <div className="step-desc" style={{ padding: '2px 0 4px' }}>
          算力对齐对比同样成立（附录 Fig15）：π0 混合数据 = 903M 自有步 + 9.1% 开源（BRIDGE v2 / DROID / OXE），零样本评测追平扩散 π0（含叠衣）。
        </div>
      )}
      <div className="step-desc" style={{ padding: '2px 0 6px' }}>
        柱高为示意 · 结论以论文图 9/1/11 为准
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.html }} />
    </div>
  );
};

export default Ch10Duel;

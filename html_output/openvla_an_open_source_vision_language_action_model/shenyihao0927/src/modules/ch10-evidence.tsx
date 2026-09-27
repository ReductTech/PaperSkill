import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCheckMark,
  drawSceneLabel,
  drawValueChip,
  drawLegend,
} from './flatKit';
import type { WidgetProps } from './registry';

// §10 module 10.1 — 证据柱状图: four hard-number groups from the paper
// (params, gap vs RT-2-X, LoRA share, quantized VRAM). Direction is
// annotated per metric (params/VRAM: lower is better; success rate: higher
// is better) and the winner bar gets a green outline.
const W = 1080;
const H = 280;
const BX = 210;
const BMAX = 670;

type Metric = 'size' | 'gap' | 'lora' | 'vram';

interface Row {
  name: string;
  frac: number;
  color: string;
  chip?: string;
  wide?: boolean;
  winner?: boolean;
}

interface View {
  dir: string; // direction label
  rows: Row[];
  axis?: number[]; // tick values on a 0..max scale (bare numbers)
  axisMax?: number;
  legend?: [string, string][];
}

const VIEWS: Record<Metric, View> = {
  size: {
    dir: '参数越少越好',
    rows: [
      { name: 'RT-2-X', frac: 1, color: C.red, chip: '55B' },
      { name: 'OpenVLA', frac: 7 / 55, color: C.green, chip: '7B', winner: true },
      { name: 'Octo', frac: 0.093 / 55, color: C.blue, chip: '0.093B', wide: true },
      { name: 'RT-1-X', frac: 0.035 / 55, color: C.blue, chip: '0.035B', wide: true },
    ],
  },
  gap: {
    dir: '越高越好',
    rows: [
      { name: 'vs RT-2-X', frac: 16.5 / 20, color: C.green, chip: '+16.5pp', wide: true, winner: true },
    ],
    axis: [0, 5, 10, 15, 20],
    axisMax: 20,
  },
  lora: {
    dir: '越少越好',
    rows: [
      { name: '全量微调', frac: 1, color: C.blue, chip: '100%', wide: true },
      { name: 'LoRA r=32', frac: 0.014, color: C.green, chip: '1.4%', winner: true },
    ],
    legend: [
      ['LoRA', C.green],
      ['全量', C.blue],
    ],
  },
  vram: {
    dir: '显存越少越好',
    rows: [
      { name: 'bf16', frac: 1, color: C.blue, chip: '16.8GB', wide: true },
      { name: 'int4', frac: 7 / 16.8, color: C.green, chip: '7.0GB', wide: true, winner: true },
    ],
    legend: [
      ['bf16', C.blue],
      ['int4', C.green],
    ],
  },
};

const FEEDBACK: Record<Metric, { text: string; cls: string }> = {
  size: {
    cls: 'good',
    text: '7B 对 55B：OpenVLA 只有 RT-2-X 的 1/7 参数；Octo（0.093B）与 RT-1-X（0.035B）更小，但真机评测被甩开——7B 站在能力与开销的甜点上。',
  },
  gap: {
    cls: 'good',
    text: '以 1/7 参数在 29 项任务上以绝对成功率反超 RT-2-X 16.5 个百分点（WidowX + Google Robot 双本体，A/B 同状态评测）。',
  },
  lora: {
    cls: 'good',
    text: 'LoRA 只训 1.4% 参数（97.6M vs 7188M）：Bridge 微调成功率 68.2% 追平全量 69.7%（33 rollouts，rank 影响可忽略，推荐 r=32）。',
  },
  vram: {
    cls: 'good',
    text: 'int4 量化：71.9% vs bf16 71.3% 不掉点，显存 7.0 vs 16.8GB 砍到一半以下（8 任务 ×80 rollouts）——消费级显卡装得下。',
  },
};

export const Ch10Evidence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<Metric>('size');
  const [fb, setFb] = useState(FEEDBACK.size);
  const metricRef = useRef<Metric>('size');
  const animRef = useRef(performance.now());

  useEffect(() => {
    metricRef.current = metric;
    animRef.current = performance.now();
    setFb(FEEDBACK[metric]);
  }, [metric]);

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

    const wideChip = (x: number, y: number, text: string, color: string) => {
      ctx.save();
      ctx.font = '12px "Segoe UI", sans-serif';
      const w = Math.max(44, ctx.measureText(text).width + 16);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 11, w, 22, 5);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.restore();
      return w / 2;
    };

    const render = (ms: number) => {
      const view = VIEWS[metricRef.current];
      const p = easeOutCubic(clamp((ms - animRef.current) / 500, 0, 1));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      drawSceneLabel(ctx, view.dir, 24, 34, { color: C.orange });

      const n = view.rows.length;
      const top = n === 1 ? 116 : 74;
      const gapY = n === 1 ? 0 : 50;
      view.rows.forEach((r, i) => {
        const y = top + i * gapY;
        const w = Math.max(4, r.frac * BMAX * p);
        drawSceneLabel(ctx, r.name, BX - 18, y, { align: 'right' });
        const bh = n === 1 ? 38 : 30;
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.roundRect(BX, y - bh / 2, w, bh, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
        const chipX = BX + w + 30;
        let half = 22;
        if (r.chip) {
          if (r.wide) half = wideChip(chipX, y, r.chip, r.color);
          else drawValueChip(ctx, chipX, y, r.chip, r.color);
        }
        if (r.winner) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(BX - 4, y - bh / 2 - 4, w + 8, bh + 8, 9);
          ctx.stroke();
          drawCheckMark(ctx, chipX + half + 14, y, 7);
        }
      });

      if (view.axis && view.axisMax) {
        const ay = 196;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(BX, ay);
        ctx.lineTo(BX + BMAX, ay);
        ctx.stroke();
        view.axis.forEach((v) => {
          const x = BX + (v / view.axisMax!) * BMAX;
          ctx.beginPath();
          ctx.moveTo(x, ay - 5);
          ctx.lineTo(x, ay + 5);
          ctx.stroke();
          drawSceneLabel(ctx, String(v), x, ay + 19, { align: 'center', color: C.muted });
        });
      }

      if (view.legend) drawLegend(ctx, view.legend, 24, H - 16);

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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {(
            [
              ['size', '参数量'],
              ['gap', '反超幅度'],
              ['lora', 'LoRA 参数占比'],
              ['vram', '量化显存'],
            ] as [Metric, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              className={`chip${metric === k ? ' selected' : ''}`}
              onClick={() => setMetric(k)}
            >
              {label}
            </button>
          ))}
          <button
            className="tiny ghost"
            onClick={() => {
              animRef.current = performance.now();
            }}
          >
            重播
          </button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <div style={{ fontSize: 12, color: '#68778f', marginTop: 8 }}>
        方向：参数 / 可训练参数 / 显存越少越好；成功率与反超幅度越高越好 · LoRA 对比来自
        Table 1（33 rollouts，Bridge 微调 A/B 同状态）· 量化来自 Table 2（8 任务 ×80
        rollouts）· +16.5pp 为 29 任务总优势（WidowX + Google Robot）
      </div>
    </div>
  );
};

export default Ch10Evidence;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawCabinet, drawLegend, drawSceneLabel } from './flatKit';
import type { WidgetProps } from './registry';

// Ch7 module 7.1 — 微调配方台 (P4 chips): six fine-tuning recipes from paper
// Table 1 (33 rollouts). Three linked bar panels (success % green / trainable
// params M purple / VRAM GB orange) plus the cabinet metaphor on the left:
// LoRA = untouched grey cabinet + bright orange door sticker; full fine-tune =
// the whole cabinet flashing orange.
const W = 1080;
const H = 280;

type Key = 'full' | 'last' | 'frozen' | 'sandwich' | 'lora32' | 'lora64';

interface Row {
  key: Key;
  name: string;
  succ: number;
  params: number;
  vram: number;
  frac: number; // trainable fraction of the 7188.1M cabinet
}

const ROWS: Row[] = [
  { key: 'full', name: '全量微调', succ: 69.7, params: 7188.1, vram: 163.3, frac: 1.0 },
  { key: 'last', name: '只调末层', succ: 30.3, params: 465.1, vram: 51.4, frac: 0.065 },
  { key: 'frozen', name: '冻结视觉', succ: 47.0, params: 6760.4, vram: 156.2, frac: 0.941 },
  { key: 'sandwich', name: '三明治', succ: 62.1, params: 914.2, vram: 64.0, frac: 0.127 },
  { key: 'lora32', name: 'LoRA·r=32', succ: 68.2, params: 97.6, vram: 59.7, frac: 0.014 },
  { key: 'lora64', name: 'LoRA·r=64', succ: 68.2, params: 195.2, vram: 60.5, frac: 0.027 },
];

const METRICS: {
  title: string;
  color: string;
  get: (r: Row) => number;
  max: number;
  fmt: (v: number) => string;
}[] = [
  { title: '成功率 %', color: C.green, get: (r) => r.succ, max: 69.7, fmt: (v) => v.toFixed(1) + '%' },
  { title: '参数 M', color: C.purple, get: (r) => r.params, max: 7188.1, fmt: (v) => v.toFixed(1) + 'M' },
  { title: '显存 GB', color: C.orange, get: (r) => r.vram, max: 163.3, fmt: (v) => v.toFixed(1) + 'GB' },
];

const FEEDBACK: Record<Key, { text: string; cls: string }> = {
  full: { text: '全量微调 69.7%——但要 8 张 A100 跑 5-15 小时、163GB 显存。', cls: '' },
  last: { text: '只调末层 30.3%——视觉特征没适配目标场景，掉惨。', cls: 'bad' },
  frozen: { text: '冻结视觉 47.0%——又一次证明空间细节必须适应。', cls: 'bad' },
  sandwich: { text: '三明治 62.1%——省显存但差点意思。', cls: '' },
  lora32: {
    text: '<b>1.4% 参数（97.6M）追平全量（68.2 vs 69.7）</b>，单卡 A100 十来小时——省 8 倍算力，rank 影响可忽略，推荐 r=32。',
    cls: 'good',
  },
  lora64: {
    text: 'LoRA·r=64 同样 68.2%，参数却翻倍到 195.2M——rank 影响可忽略，r=32 就够。',
    cls: '',
  },
};

const chip = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string
) => {
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  const w = ctx.measureText(text).width + 14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y - 10, w, 20, 5);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 1);
  ctx.restore();
};

export const Ch7Lora: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef<Key>('lora32');
  const [sel, setSel] = useState<Key>('lora32');
  const [fb, setFb] = useState(FEEDBACK.lora32);

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
      const cur = selRef.current;
      const row = ROWS.find((r) => r.key === cur) as Row;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- left: cabinet metaphor ----
      const cbx = 104;
      const cby = 212;
      const s = 1.6;
      drawCabinet(ctx, cbx, cby, s, { assembled: true });
      if (cur === 'full') {
        // whole cabinet flashing = everything is being reworked
        const a = 0.2 + 0.18 * Math.sin(ms / 170);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = C.orange;
        ctx.fillRect(cbx - 24 * s - 3, cby - 52 * s - 3, 48 * s + 6, 52 * s + 3);
        ctx.restore();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3;
        ctx.strokeRect(cbx - 24 * s - 3, cby - 52 * s - 3, 48 * s + 6, 52 * s + 3);
      } else if (cur === 'lora32' || cur === 'lora64') {
        // grey veil: the cabinet body stays untouched...
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = '#8a9099';
        ctx.fillRect(cbx - 24 * s, cby - 52 * s, 48 * s, 52 * s);
        ctx.restore();
        // ...only the door sticker is swapped, pulsing
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.roundRect(cbx - 22 * s, cby - 50 * s, 20 * s, 22 * s, 3);
        ctx.fill();
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 2;
        ctx.strokeRect(cbx - 18 * s, cby - 46 * s, 12 * s, 8 * s);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(ms / 220));
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(cbx - 22 * s - 4, cby - 50 * s - 4, 20 * s + 8, 22 * s + 8, 5);
        ctx.stroke();
        ctx.restore();
      } else {
        // partial rework: orange overlay covers the trainable fraction
        const h = 52 * s * row.frac;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = C.orange;
        ctx.fillRect(cbx - 24 * s, cby - h, 48 * s, h);
        ctx.restore();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(cbx - 24 * s, cby - h, 48 * s, h);
        ctx.setLineDash([]);
      }
      drawSceneLabel(ctx, row.name, 20, 42, { color: C.blue });

      // ---- right: three linked bar panels (rows follow the chip order) ----
      const panelX = [232, 516, 800];
      METRICS.forEach((m, p) => {
        const x0 = panelX[p];
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x0 - 12, 34, 268, 202, 8);
        ctx.fill();
        ctx.stroke();
        ROWS.forEach((r, i) => {
          const y = 48 + i * 30;
          const hot = r.key === cur;
          const len = 24 + (m.get(r) / m.max) * 148;
          ctx.save();
          ctx.globalAlpha = hot ? 1 : 0.3;
          ctx.fillStyle = m.color;
          ctx.beginPath();
          ctx.roundRect(x0, y, len, 16, 3);
          ctx.fill();
          ctx.restore();
          if (hot) {
            chip(ctx, x0 + len + 8, y + 8, m.fmt(m.get(r)), m.color);
          } else {
            ctx.fillStyle = C.muted;
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(m.fmt(m.get(r)), x0 + len + 8, y + 9);
          }
        });
      });

      drawLegend(
        ctx,
        METRICS.map((m) => [m.title, m.color] as [string, string]),
        232,
        262
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

  const pick = (k: Key) => {
    selRef.current = k;
    setSel(k);
    setFb(FEEDBACK[k]);
  };
  const curRow = ROWS.find((r) => r.key === sel) as Row;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          微调方案 <span className="val">{curRow.name}</span>
        </label>
        {ROWS.map((r) => (
          <button
            key={r.key}
            className={`chip${sel === r.key ? ' selected' : ''}`}
            onClick={() => pick(r.key)}
          >
            {r.name}
          </button>
        ))}
        <span className="tiny">Table 1 · 33 次评测</span>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default Ch7Lora;

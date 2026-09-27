import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawLegend,
  drawCheckMark,
  drawCrossMark,
} from './flatKit';
import type { WidgetProps } from './registry';

// Ch8 module 8.2 — 部署配置器 (P4 chips): three inference precisions from paper
// Table 2 (8 tasks x 80 rollouts). Precision cards (success-rate chips + speed
// notes) on the left, VRAM horizontal bars in the middle, and a speed panel on
// the right with the dashed 5Hz control-requirement line. int8 loses to SPEED,
// not precision (1.2Hz on A5000); int4 keeps 71.9% at 7.0GB.
const W = 1080;
const H = 280;

type Key = 'bf16' | 'int8' | 'int4';

interface Prec {
  key: Key;
  name: string;
  succ: number;
  vram: number;
  hz: number;
}

const PRECS: Prec[] = [
  { key: 'bf16', name: 'bf16', succ: 71.3, vram: 16.8, hz: 6.0 },
  { key: 'int8', name: 'int8', succ: 58.1, vram: 10.2, hz: 1.2 },
  { key: 'int4', name: 'int4', succ: 71.9, vram: 7.0, hz: 3.0 },
];

const FEEDBACK: Record<Key, { text: string; cls: string }> = {
  bf16: { text: '默认配置：15-16.8GB，4090 上 6Hz。', cls: '' },
  int8: {
    text: '58.1%——<b>掉分不是精度而是速度</b>：A5000 上只有 1.2Hz，跟不上 5Hz 控制。',
    cls: 'bad',
  },
  int4: {
    text: '<b>4-bit：成功率反而不掉（71.9%），显存砍到 7GB 不到一半</b>——消费级显卡装得下。',
    cls: 'good',
  },
};

const ROW_Y = [64, 134, 204];
const VRAM_X0 = 336;
const VRAM_SCALE = 380 / 16.8; // px per GB
const SPD_X0 = 804;
const SPD_SCALE = 34; // px per Hz
const LINE_HZ = 5;

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
  return w;
};

const mutedText = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
) => {
  ctx.save();
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
};

export const Ch8Deploy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef<Key>('bf16');
  const [sel, setSel] = useState<Key>('bf16');
  const [fb, setFb] = useState(FEEDBACK.bf16);

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
      const cur = selRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // dashed 5Hz control-requirement line in the speed panel
      const lineX = SPD_X0 + LINE_HZ * SPD_SCALE;
      ctx.save();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(lineX, 34);
      ctx.lineTo(lineX, 242);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = C.red;
      ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('5Hz 控制需求线', SPD_X0, 22);

      PRECS.forEach((p, i) => {
        const y = ROW_Y[i];
        const hot = p.key === cur;
        ctx.save();
        if (!hot) ctx.globalAlpha = 0.55;

        // ---- precision card ----
        ctx.fillStyle = C.white;
        ctx.strokeStyle = hot ? C.blue : C.border;
        ctx.lineWidth = hot ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(20, y - 26, 288, 52, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.name, 38, y + 1);
        chip(ctx, 110, y, p.succ.toFixed(1) + '%', p.key === 'int8' ? C.red : C.green);
        // speed note
        const hzColor = p.hz >= LINE_HZ ? C.green : p.key === 'int8' ? C.red : C.orange;
        ctx.fillStyle = hzColor;
        ctx.font = '12px "Segoe UI", sans-serif';
        const note = p.key === 'bf16' ? '4090 上 6Hz' : p.key === 'int8' ? 'A5000 仅 1.2Hz' : 'A5000 3Hz';
        ctx.fillText(note, 178, y + 1);
        if (p.key === 'bf16') drawCheckMark(ctx, 278, y, 7);
        if (p.key === 'int8') drawCrossMark(ctx, 292, y, 7);

        // ---- VRAM horizontal bar ----
        const vlen = p.vram * VRAM_SCALE;
        ctx.save();
        if (!hot) ctx.globalAlpha = 0.35;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.roundRect(VRAM_X0, y - 10, vlen, 20, 3);
        ctx.fill();
        ctx.restore();
        if (hot) chip(ctx, VRAM_X0 + vlen + 8, y, p.vram.toFixed(1) + 'GB', C.orange);
        else mutedText(ctx, VRAM_X0 + vlen + 8, y, p.vram.toFixed(1) + 'GB');

        // ---- speed bar vs the 5Hz line ----
        const slen = p.hz * SPD_SCALE;
        ctx.fillStyle = hzColor;
        ctx.beginPath();
        ctx.roundRect(SPD_X0, y - 7, slen, 14, 3);
        ctx.fill();
        const cw = chip(ctx, SPD_X0 + slen + 8, y, p.hz.toFixed(p.hz % 1 === 0 ? 0 : 1) + 'Hz', hzColor);
        if (p.key === 'int8') drawCrossMark(ctx, SPD_X0 + slen + 8 + cw + 14, y, 7);
        if (p.key === 'bf16') drawCheckMark(ctx, SPD_X0 + slen + 8 + cw + 12, y, 7);

        ctx.restore();
      });

      drawLegend(
        ctx,
        [
          ['成功率 %', C.green],
          ['显存 GB', C.orange],
        ],
        SPD_X0,
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          推理精度 <span className="val">{sel}</span>
        </label>
        {PRECS.map((p) => (
          <button
            key={p.key}
            className={`chip${sel === p.key ? ' selected' : ''}`}
            onClick={() => pick(p.key)}
          >
            {p.name}
          </button>
        ))}
        <span className="tiny">Table 2 · 8 任务 × 80 次评测</span>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default Ch8Deploy;

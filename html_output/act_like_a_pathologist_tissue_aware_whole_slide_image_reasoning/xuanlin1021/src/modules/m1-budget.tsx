import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { easeOutCubic, lerp } from '../lib/canvasKit';
import { C, clearPlate, drawContactSheet, drawTag, usePlate } from './scene-kit';

// §1 模块 1.1：同一道题、同一张片子，只改预算。
// 四档预算与准确率都是论文在 WSI-Bench（Morphology）上的实测值（Table 6）。
// 被点亮的片块格数是示意：按 5k≈全部片块的 30% 推算（Total ≈ 16,667）。

const W = 1080;
const H = 280;

const TOKENS = [1000, 2000, 5000, 10000];
const ACC = [91.19, 93.83, 94.57, 94.12];
const LIT = [1, 3, 7, 14];

const FEEDBACK = [
  { text: '只送 1000 个 token：91.19%，细节不够，答案容易漏。', cls: 'bad' },
  { text: '2000 个 token：93.83%，比 1k 好，但还没到峰值。', cls: '' },
  { text: '5000 个 token：94.57%，论文报告的峰值；5k 约等于全部片块的 30%。', cls: 'good' },
  { text: '10000 个 token：94.12%，比 5k 略低——很可能因为多送进去的片块里冗余更多。', cls: '' },
];

const SHEET = { x: 28, y: 34, w: 470, h: 150 };
const CHART = { x: 620, y: 60, w: 424, h: 168 };
const ACC_MIN = 90.4;
const ACC_MAX = 95.2;

function chartPoint(i: number, acc: number) {
  const x = CHART.x + (i * CHART.w) / 3;
  const y = CHART.y + CHART.h - ((acc - ACC_MIN) / (ACC_MAX - ACC_MIN)) * CHART.h;
  return { x, y };
}

export const M1Budget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  const [idx, setIdx] = useState(0);

  const render = useCallback(() => {
    const canvas = ref.current;
    const ctx = plate(canvas);
    if (!ctx) return;
    clearPlate(ctx, W, H);

    // 印样墙：点亮的格子越多，送进模型的片块越多。
    const lit: number[] = [];
    const order = [5, 6, 11, 12, 13, 17, 18, 19, 23, 4, 10, 16, 22, 3];
    for (let i = 0; i < LIT[idx]; i++) lit.push(order[i]);
    drawContactSheet(ctx, SHEET, 6, 4, lit, { seed: 13, tone: 'green', dimUnlit: 0.22 });
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(SHEET.x - 6, SHEET.y - 6, SHEET.w + 12, SHEET.h + 12);
    drawTag(ctx, '片块', SHEET.x + 2, SHEET.y - 14, { size: 14, color: C.muted });

    // 准确率点图：四个实测点连成折线。
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CHART.x, CHART.y + CHART.h);
    ctx.lineTo(CHART.x + CHART.w, CHART.y + CHART.h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CHART.x, CHART.y);
    ctx.lineTo(CHART.x, CHART.y + CHART.h);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const p = chartPoint(i, ACC[i]);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const peak = chartPoint(2, ACC[2]);
    ctx.strokeStyle = C.green;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(peak.x, CHART.y);
    ctx.lineTo(peak.x, CHART.y + CHART.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const p = chartPoint(i, ACC[i]);
      const active = i === idx;
      const color = i === 2 ? C.green : active ? C.orange : C.muted;
      ctx.fillStyle = active ? color : '#ffffff';
      ctx.strokeStyle = i === 2 ? C.green : active ? C.orange : C.axis;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, active ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = active ? C.text : C.muted;
      ctx.font = `${active ? '600 15px' : '13px'} "Segoe UI","Microsoft YaHei",sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(ACC[i]), p.x, p.y - 14);
      ctx.fillStyle = C.muted;
      ctx.font = `12px "Segoe UI","Microsoft YaHei",sans-serif`;
      ctx.fillText(String(TOKENS[i]), p.x, CHART.y + CHART.h + 16);
    }
    drawTag(ctx, '准确率', CHART.x + 2, CHART.y - 16, { size: 14, color: C.muted });
    if (!canvas) return;
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [idx, plate]);

  useEffect(() => {
    render();
  }, [render]);

  const fb = FEEDBACK[idx];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label htmlFor={`budget-${chapterId}-${moduleId}`}>
          送进模型的视觉 token <span className="val">{TOKENS[idx]}</span>
        </label>
        <input
          id={`budget-${chapterId}-${moduleId}`}
          type="range"
          min={0}
          max={3}
          step={1}
          value={idx}
          aria-valuetext={`${TOKENS[idx]} token`}
          onChange={(e) => setIdx(Number(e.target.value))}
        />
        <div className="chip-row" style={{ marginLeft: 8 }}>
          {TOKENS.map((t, i) => (
            <button
              key={t}
              type="button"
              className={`chip${i === idx ? ' selected' : ''}`}
              onClick={() => setIdx(i)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M1Budget;

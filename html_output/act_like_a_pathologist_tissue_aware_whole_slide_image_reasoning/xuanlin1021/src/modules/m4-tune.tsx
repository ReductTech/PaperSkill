import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT, clearPlate, drawTag, usePlate } from './scene-kit';

// §4 模块 4.2：压缩该压到什么程度。
// 八根柱都是论文的真实数值（Table 9 组级、Table 10 片块级，WSI-Bench Morphology）。

const W = 1080;
const H = 280;
const BG = [0, 0.1, 0.2, 0.3];
const ACC_G = [91.78, 93.39, 94.57, 93.1];
const BP = [0, 0.05, 0.1, 0.15];
const ACC_P = [92.07, 93.25, 94.57, 93.83];
const Y0 = 226;
const Y1 = 74;
const A_MIN = 90.5;
const A_MAX = 95.2;

function barY(acc: number) {
  return Y0 - ((acc - A_MIN) / (A_MAX - A_MIN)) * (Y0 - Y1);
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  x0: number,
  values: number[],
  labels: number[],
  active: number,
  best: number
) {
  values.forEach((v, i) => {
    const x = x0 + i * 96;
    const y = barY(v);
    const on = i === active;
    ctx.fillStyle = on ? C.orange : i === best ? '#cfe3d6' : '#e6e9e2';
    ctx.fillRect(x, y, 62, Y0 - y);
    ctx.strokeStyle = on ? C.orange : C.axis;
    ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 61, Y0 - y - 1);
    ctx.fillStyle = on ? C.text : C.muted;
    ctx.font = `${on ? '600 14px' : '12px'} ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(v), x + 31, y - 8);
    ctx.fillStyle = C.muted;
    ctx.font = `12px ${FONT}`;
    ctx.fillText(String(labels[i]), x + 31, Y0 + 16);
    if (i === best) {
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(x + 31, Y0 + 26, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0 - 16, Y0);
  ctx.lineTo(x0 + 4 * 96 - 18, Y0);
  ctx.stroke();
}

export const M4Tune: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  const [gi, setGi] = useState(0);
  const [pi, setPi] = useState(0);

  const render = useCallback(() => {
    const canvas = ref.current;
    const ctx = plate(canvas);
    if (!ctx) return;
    clearPlate(ctx, W, H);

    drawBars(ctx, 80, ACC_G, BG, gi, 2);
    drawBars(ctx, 590, ACC_P, BP, pi, 2);
    drawTag(ctx, '组级', 56, 40, { size: 13, color: C.muted });
    drawTag(ctx, '片块级', 566, 40, { size: 13, color: C.muted });

    // 两组之间留白：压缩强度只由芯片与柱高表达，不额外堆叠图形。
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(540, 40);
    ctx.lineTo(540, 250);
    ctx.stroke();

    if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [gi, pi, plate]);

  useEffect(() => {
    render();
  }, [render]);

  const best = gi === 2 && pi === 2;
  const fb = best
    ? { text: 'β_g = 0.2、β_p = 0.10：94.57%，这是论文的峰值；压缩刚好压掉背景，没压掉上下文。', cls: 'good' }
    : gi === 3 || pi === 3
    ? { text: '压过头了：带上下文的组织也被砍掉，组级掉到 93.10%，片块级掉到 93.83%。', cls: '' }
    : gi === 0 || pi === 0
    ? { text: '不压缩：冗余片块全留着，组级 91.78%、片块级 92.07%，这是消融表里的下限。', cls: 'bad' }
    : { text: '开始压掉噪声，但还没压到位：组级 0.1 给 93.39%，片块级 0.05 给 93.25%。', cls: '' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl" style={{ flexWrap: 'wrap' }}>
        <label>组级压缩 β_g</label>
        <div className="chip-row">
          {BG.map((b, i) => (
            <button key={b} type="button" className={`chip${gi === i ? ' selected' : ''}`} onClick={() => setGi(i)}>
              {b}
            </button>
          ))}
        </div>
        <label style={{ marginLeft: 12 }}>片块级压缩 β_p</label>
        <div className="chip-row">
          {BP.map((b, i) => (
            <button key={b} type="button" className={`chip${pi === i ? ' selected' : ''}`} onClick={() => setPi(i)}>
              {b.toFixed(2)}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M4Tune;

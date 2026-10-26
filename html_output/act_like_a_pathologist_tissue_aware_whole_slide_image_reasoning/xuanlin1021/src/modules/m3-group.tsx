import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, FONT, clearPlate, drawTag, rnd, usePlate } from './scene-kit';

// §3 模块 3.1：采样率怎么变成块数。
// 结构是论文的：组原型 = 组内片块均值，r_j = σ(两层线性)，k_j = ⌈r_j·N_j⌉。
// 四类的片块数与采样率为示意（合计 16,667，与 5k≈30% 的规模一致）。

const W = 1080;
const H = 280;

const GROUPS = [
  { n: 5000, r: 0.32, k: 1600, color: '#cbb79a' },
  { n: 4000, r: 0.21, k: 840, color: '#a9b79c' },
  { n: 4000, r: 0.09, k: 360, color: '#a8b3c4' },
  { n: 3667, r: 0.06, k: 221, color: '#ded6c4' },
];
const TOTAL = GROUPS.reduce((s, g) => s + g.k, 0);

const ZONE = { x: 32, y: 34, w: 380, h: 196 };
const STEPS = 3;

function zoneRect(i: number) {
  const halfW = ZONE.w / 2;
  const halfH = ZONE.h / 2;
  return {
    x: ZONE.x + (i % 2) * halfW,
    y: ZONE.y + Math.floor(i / 2) * halfH,
    w: halfW,
    h: halfH,
  };
}

export const M3Group: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  const [step, setStep] = useState(0);

  const render = useCallback(() => {
    const canvas = ref.current;
    const ctx = plate(canvas);
    if (!ctx) return;
    clearPlate(ctx, W, H);

    // 局部：一张切片被分成四个组织区。
    ctx.fillStyle = '#fffdf6';
    ctx.fillRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h);
    GROUPS.forEach((g, i) => {
      const r = zoneRect(i);
      ctx.fillStyle = g.color;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
      for (let b = 0; b < 6; b++) {
        const bx = r.x + 12 + rnd(7 + i, b * 3) * (r.w - 24);
        const by = r.y + 10 + rnd(9 + i, b * 3 + 1) * (r.h - 20);
        const br = 6 + rnd(11 + i, b) * 12;
        ctx.fillStyle = C.dark;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.ellipse(bx, by, br, br * 0.62, rnd(i, b) * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    });
    ctx.strokeStyle = C.axis;
    ctx.strokeRect(ZONE.x + 0.5, ZONE.y + 0.5, ZONE.w - 1, ZONE.h - 1);

    // 中：四个组原型 + 采样率。
    GROUPS.forEach((g, i) => {
      const gx = 470;
      const gy = 60 + i * 48;
      const zc = zoneRect(i);
      ctx.strokeStyle = step >= 1 ? C.route : C.axis;
      ctx.lineWidth = step >= 1 ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(zc.x + zc.w + 4, zc.y + zc.h / 2);
      ctx.lineTo(gx - 14, gy);
      ctx.stroke();
      ctx.fillStyle = step >= 1 ? g.color : C.axis;
      ctx.beginPath();
      ctx.arc(gx, gy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.text;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (step >= 1) {
        ctx.fillStyle = C.text;
        ctx.font = `600 14px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText(String(g.r), gx + 16, gy + 5);
      }
    });
    drawTag(ctx, '组原型', 448, 30, { size: 13, color: C.muted });

    // 右：每类名额，条形长度按 k_j。
    const maxK = Math.max(...GROUPS.map((g) => g.k));
    GROUPS.forEach((g, i) => {
      const y = 62 + i * 48;
      const base = 700;
      const len = step >= 2 ? (g.k / maxK) * 210 : 0;
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.strokeRect(base + 0.5, y - 9, 214, 18);
      ctx.fillStyle = step >= 2 ? g.color : C.axis;
      ctx.globalAlpha = step >= 2 ? 0.75 : 0.35;
      ctx.fillRect(base + 1, y - 8, Math.max(2, len), 16);
      ctx.globalAlpha = 1;
      ctx.fillStyle = step >= 2 ? C.text : C.muted;
      ctx.font = `600 14px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(step >= 2 ? String(g.k) : String(g.n), base + 222, y + 5);
    });
    drawTag(ctx, step >= 2 ? '名额' : '块数', 700, 30, { size: 13, color: C.muted });

    if (step >= 2) {
      ctx.fillStyle = C.text;
      ctx.font = `600 16px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(String(TOTAL), 1044, 262);
      ctx.fillStyle = C.muted;
      ctx.font = `13px ${FONT}`;
      ctx.fillText('块', 1044, 278);
    }

    if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [step, plate]);

  useEffect(() => {
    render();
  }, [render]);

  const fb =
    step === 0
      ? { text: '四类组织先各自平均成一个组原型——它代表「这类组织长什么样」。', cls: '' }
      : step === 1
      ? { text: '问题参与进来：越相关的组织拿到越高的采样率；这一步只看类别，还没看具体片块。', cls: '' }
      : { text: '采样率乘以该类块数、向上取整，就是这一类的名额；组级先砍掉大部分搜索空间。', cls: 'good' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="chip" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          上一步
        </button>
        <button
          type="button"
          className="chip"
          disabled={step === STEPS - 1}
          onClick={() => setStep((s) => Math.min(STEPS - 1, s + 1))}
        >
          {step === STEPS - 2 ? '算名额' : '下一步'}
        </button>
        <span className="val" style={{ marginLeft: 4 }}>
          第 {step + 1} / {STEPS} 步
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M3Group;

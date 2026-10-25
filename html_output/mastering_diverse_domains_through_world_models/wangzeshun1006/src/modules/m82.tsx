import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { clearCrag, drawSceneLabel, GUIDE, OK, EMPH, INK, MUTED, LINE } from './climbkit';
import type { WidgetProps } from './registry';

// m82 — 规模接上去，能力跟着涨。
// 拖动 6 档模型规模滑块（12M → 400M）：坐标系里是单调上升的趋势示意曲线，
// 当前档绿色加粗，橙色箭头表示"到达同样回报所需交互更少"。曲线是趋势示意，不是逐点数据。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const SIZE = ['12M', '25M', '50M', '100M', '200M', '400M'];

const X0 = 80;
const X1 = 620;
const Y0 = 220;
const Y1 = 60;

const px = (x: number): number => X0 + x * (X1 - X0);
const py = (v: number): number => Y0 - v * (Y0 - Y1);
const curveV = (i: number, x: number): number => (0.45 + i * 0.09) * (1 - Math.exp(-3 * x));

const FB: string[] = [
  '12M 档也能学，但爬升慢、需要更多交互——论文里两个控制套件就用了这一档。',
  '比 12M 档略快：曲线抬高一点，所需交互相应减少。',
  '中等档：爬升更稳，到达同样的回报需要的交互更少。',
  '接近默认档：趋势继续向上，数据效率继续改善。',
  '默认档：曲线更高、到达同样的回报更早。',
  '最大档：趋势继续单调；论文报告更大模型同时提升性能与数据效率。曲线是趋势示意，逐点数值见论文图 6c。',
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export const M82: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef(4);
  const [size, setSize] = useState(4);
  const [fb, setFb] = useState<{ text: string; cls: string }>({ text: FB[4], cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const cur = sizeRef.current;
      clearCrag(ctx, W, H);

      // 坐标轴
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0, Y0);
      ctx.lineTo(X1, Y0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X0, Y0);
      ctx.lineTo(X0, Y1);
      ctx.stroke();

      // 其他档曲线（灰）
      for (let i = 0; i < SIZE.length; i++) {
        if (i === cur) continue;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k <= 40; k++) {
          const x = k / 40;
          const ex = px(x);
          const ey = py(curveV(i, x));
          if (k === 0) ctx.moveTo(ex, ey);
          else ctx.lineTo(ex, ey);
        }
        ctx.stroke();
      }

      // 当前档曲线（绿）
      ctx.strokeStyle = OK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let k = 0; k <= 40; k++) {
        const x = k / 40;
        const ex = px(x);
        const ey = py(curveV(cur, x));
        if (k === 0) ctx.moveTo(ex, ey);
        else ctx.lineTo(ex, ey);
      }
      ctx.stroke();

      // 高亮点
      const hv = curveV(cur, 0.55);
      ctx.fillStyle = OK;
      ctx.beginPath();
      ctx.arc(px(0.55), py(hv), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 橙色箭头：越大规模，需要的交互越少
      const len = lerp(170, 46, cur / (SIZE.length - 1));
      const ay = 202;
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X0 + 12, ay);
      ctx.lineTo(X0 + 12 + len, ay);
      ctx.stroke();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.moveTo(X0 + 12 + len + 12, ay);
      ctx.lineTo(X0 + 12 + len, ay - 7);
      ctx.lineTo(X0 + 12 + len, ay + 7);
      ctx.closePath();
      ctx.fill();

      drawSceneLabel(ctx, '环境步数', 300, 248, MUTED);
      drawSceneLabel(ctx, '回报', 30, 54, MUTED);

      // 右侧信息块
      const cards: { title: string; value: string; hot: boolean }[] = [
        { title: '当前规模', value: SIZE[cur], hot: false },
        { title: '默认档', value: '200M', hot: cur === 4 },
        { title: '曲线', value: '趋势示意', hot: false },
      ];
      for (let i = 0; i < cards.length; i++) {
        const y = 66 + i * 64;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, 700, y, 320, 52, 10);
        ctx.fill();
        ctx.strokeStyle = cards[i].hot ? EMPH : LINE;
        ctx.lineWidth = cards[i].hot ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.font = '14px ' + FONT;
        ctx.fillText(cards[i].title, 718, y + 22);
        ctx.fillStyle = cards[i].hot ? EMPH : INK;
        ctx.font = 'bold 22px ' + FONT;
        ctx.fillText(cards[i].value, 718, y + 44);
      }
    };

    const tick = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = Math.round(clamp(Number(e.target.value), 0, 5));
    sizeRef.current = v;
    setSize(v);
    setFb({ text: FB[v], cls: v === 4 || v === 5 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          模型规模 <span className="val">{SIZE[size]}</span>
        </label>
        <input type="range" min={0} max={5} step={1} value={size} onChange={onChange} />
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default M82;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const RED = '#c43f52';
const DIM = '#7f8db0';
const STAR = '#dfe7f5';

const AX = 360;
const AY = 150;
const AW = 120;
const AH = 120;
const TX = 520;
const TY = 110;
const TW = 160;
const TH = 100;

const tStar = {
  tx: (TX - AX) / AW,
  ty: (TY - AY) / AH,
  tw: Math.log(TW / AW),
  th: Math.log(TH / AH),
};

function smoothL1(x: number) {
  const a = Math.abs(x);
  return a < 1 ? 0.5 * a * a : a - 0.5;
}

function iouBoxes(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  const aL = ax - aw / 2;
  const aR = ax + aw / 2;
  const aT = ay - ah / 2;
  const aB = ay + ah / 2;
  const bL = bx - bw / 2;
  const bR = bx + bw / 2;
  const bT = by - bh / 2;
  const bB = by + bh / 2;
  const iw = Math.min(aR, bR) - Math.max(aL, bL);
  const ih = Math.min(aB, bB) - Math.max(aT, bT);
  const inter = iw > 0 && ih > 0 ? iw * ih : 0;
  const areaA = aw * ah;
  const areaB = bw * bh;
  return inter / (areaA + areaB - inter);
}

function judge(iou: number) {
  if (iou > 0.9) return { text: `已对准：IoU ${iou.toFixed(2)}，框几乎完全套住目标。`, cls: 'good' };
  if (iou >= 0.7) return { text: `基本套住：IoU ${iou.toFixed(2)}，还可微调让框更贴。`, cls: '' };
  if (iou >= 0.45) return { text: `只套住一部分：IoU ${iou.toFixed(2)}，中心或宽高仍有偏差。`, cls: '' };
  return { text: `偏离较大：IoU ${iou.toFixed(2)}，框还没套住目标。`, cls: 'bad' };
}

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v, setV] = useState({ tx: 0.2, ty: 0.1, tw: 0, th: 0 });
  const [feedback, setFeedback] = useState({
    text: '拖动四个滑块，让预测框贴合绿色真值框。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const px = AX + v.tx * AW;
    const py = AY + v.ty * AH;
    const pw = AW * Math.exp(v.tw);
    const ph = AH * Math.exp(v.th);
    const iou = iouBoxes(px, py, pw, ph, TX, TY, TW, TH);
    const residual =
      smoothL1(v.tx - tStar.tx) +
      smoothL1(v.ty - tStar.ty) +
      smoothL1(v.tw - tStar.tw) +
      smoothL1(v.th - tStar.th);
    const color = iou > 0.9 ? GREEN : iou >= 0.45 ? ORANGE : RED;

    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GLOW;
    ctx.fillRect(0, H - 50, W, 50);
    // anchor
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(AX - AW / 2, AY - AH / 2, AW, AH);
    ctx.setLineDash([]);
    // GT
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
    ctx.strokeRect(TX - TW / 2, TY - TH / 2, TW, TH);
    // predicted (color by IoU)
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
    // readout panel
    ctx.fillStyle = '#122346';
    ctx.fillRect(800, 40, 220, 170);
    ctx.fillStyle = color;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(iou.toFixed(3), 820, 92);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText('IoU（对准程度）', 820, 64);
    ctx.fillStyle = STAR;
    ctx.font = '16px sans-serif';
    ctx.fillText(`smooth L1 残差`, 820, 132);
    ctx.fillText(residual.toFixed(4), 820, 154);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText('蓝=锚框 绿=真值 橙/红=预测', 60, 30);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [v]);

  const set = (k: 'tx' | 'ty' | 'tw' | 'th') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    const nv = { ...v, [k]: val };
    setV(nv);
    const px = AX + nv.tx * AW;
    const py = AY + nv.ty * AH;
    const pw = AW * Math.exp(nv.tw);
    const ph = AH * Math.exp(nv.th);
    const iou = iouBoxes(px, py, pw, ph, TX, TY, TW, TH);
    setFeedback(judge(iou));
  };

  const ranges: { k: 'tx' | 'ty' | 'tw' | 'th'; min: number; max: number; step: number }[] = [
    { k: 'tx', min: -0.6, max: 1.4, step: 0.01 },
    { k: 'ty', min: -0.8, max: 0.8, step: 0.01 },
    { k: 'tw', min: -0.6, max: 0.6, step: 0.01 },
    { k: 'th', min: -0.6, max: 0.6, step: 0.01 },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {ranges.map((r) => (
          <label key={r.k}>
            {r.k}
            <span className="val">{v[r.k].toFixed(2)}</span>
            <input
              type="range"
              min={Math.round(r.min * 100)}
              max={Math.round(r.max * 100)}
              step={Math.round(r.step * 100)}
              value={Math.round(v[r.k] * 100)}
              onChange={set(r.k)}
            />
          </label>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;

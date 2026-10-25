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
const DIM = '#7f8db0';
const BORDER = '#d7deea';

const MAP: Record<string, number> = { '0.1': 67.2, '1': 68.9, '10': 69.9, '100': 69.1 };
const LVALS = ['0.1', '1', '10', '100'] as const;

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [li, setLi] = useState(2); // index of 10
  const [feedback, setFeedback] = useState({
    text: 'λ=10 时两项大致等权，是论文默认值，mAP 69.9%。',
    cls: 'good',
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
    const lam = Number(LVALS[li]);
    const shareCls = 1 / (1 + lam / 10);
    const shareReg = (lam / 10) / (1 + lam / 10);
    const totalPx = 160;
    const baseY = 210;
    const barX = 430;
    const barW = 110;
    const clsPx = totalPx * shareCls;
    const regPx = totalPx * shareReg;

    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GLOW;
    ctx.fillRect(0, H - 50, W, 50);

    // legend
    const legend = [
      { c: BLUE, t: '分类项 L_cls（判断是不是目标）' },
      { c: ORANGE, t: 'λ·回归项 L_reg（框对准）' },
    ];
    legend.forEach((item, i) => {
      const y = 34 + i * 24;
      ctx.fillStyle = item.c;
      ctx.fillRect(40, y - 14, 16, 16);
      ctx.fillStyle = '#dfe7f5';
      ctx.font = '16px sans-serif';
      ctx.fillText(item.t, 66, y);
    });

    // stacked relative-weight bar
    ctx.fillStyle = BLUE;
    ctx.fillRect(barX, baseY - clsPx, barW, clsPx);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(barX, baseY - clsPx - regPx, barW, regPx);
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, baseY - totalPx, barW, totalPx);
    // percentage labels inside the two segments
    ctx.fillStyle = '#dfe7f5';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(shareCls * 100)}%`, barX + barW / 2, baseY - clsPx / 2);
    ctx.fillText(`${Math.round(shareReg * 100)}%`, barX + barW / 2, baseY - clsPx - regPx / 2 + 4);
    ctx.textAlign = 'left';
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText('两项相对权重', barX, baseY + 22);
    ctx.fillStyle = '#dfe7f5';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`λ = ${LVALS[li]}`, barX, baseY + 50);

    // mAP curve
    ctx.fillStyle = '#122346';
    ctx.fillRect(740, 40, 300, 170);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText('mAP 随 λ 变化', 740, 32);
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const pts = LVALS.map((_, i) => [
      760 + (i / 3) * 260,
      200 - ((MAP[LVALS[i]] - 66) / 4) * 120,
    ] as const);
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(pts[li][0], pts[li][1], 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dfe7f5';
    ctx.font = '16px sans-serif';
    ctx.fillText(`mAP ${MAP[LVALS[li]]}%`, 740, 218);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [li]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    setLi(idx);
    const lam = LVALS[idx];
    if (lam === '10') {
      setFeedback({ text: 'λ=10 时两项大致等权（各占约一半），是论文默认值，mAP 69.9%。', cls: 'good' });
    } else if (lam === '0.1') {
      setFeedback({ text: 'λ=0.1：回归几乎被忽略，mAP 约 67.2%。', cls: 'bad' });
    } else if (lam === '100') {
      setFeedback({ text: 'λ=100：回归项主导，mAP 约 69.1%。', cls: '' });
    } else {
      setFeedback({ text: 'λ=1：回归权重偏低，mAP 约 68.9%。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          λ <span className="val">{LVALS[li]}</span>
          <input type="range" min={0} max={3} step={1} value={li} onChange={onChange} />
        </label>
        <span>mAP {MAP[LVALS[li]]}%</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;

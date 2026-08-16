import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BLUE = '#27446e', GREEN = '#228d5c', ORANGE = '#d97706', RED = '#c43f52', PURPLE = '#7c3aed';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

const HEADS = ['Q1', 'Q2', 'Q3'];
const RAW = [0.9, 0.55, 0.3];
const NORM = [1.0, 0.5, -3.0]; // 示意 z-score
const STEPS = ['多个查询头共享一个 KV', '每个头给共享键打分', '各头内部 z-score 归一化', '取最大 → 保留'];

// 8.3：工程优化二 —— GQA：多个查询头共享 KV，先归一化再取最大。
export const M82: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let c: CanvasRenderingContext2D;
    try { c = setupCanvas(canvas, W, H); } catch { return; }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    };

    const render = () => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f5f8f0';
      c.fillRect(0, 0, W, H);
      const s = stepRef.current;

      c.fillStyle = INK;
      c.font = 'bold 14px ' + FONT;
      c.textAlign = 'left';
      c.fillText('GQA：多个查询头共享一个 KV，取最大', 20, 26);

      // 左面板：Q1/Q2/Q3 -> 共享 KV
      const lx = 20, ly = 44, lw = 250, lh = 168;
      c.fillStyle = '#ffffff';
      roundRect(lx, ly, lw, lh, 12);
      c.fill();
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      roundRect(lx, ly, lw, lh, 12);
      c.stroke();
      c.fillStyle = INK;
      c.font = 'bold 13px ' + FONT;
      c.fillText('三个查询头 → 一个 KV 头', lx + 14, ly + 24);
      const qy = ly + 46;
      const kvx = lx + 92, kvy = qy + 60, kvW = 96, kvH = 30;
      const kvLeft = kvx - kvW / 2, kvRight = kvx + kvW / 2;
      HEADS.forEach((h, i) => {
        const qx = lx + 44 + i * 66;
        c.fillStyle = '#eef3fb';
        roundRect(qx - 22, qy, 44, 24, 8);
        c.fill();
        c.strokeStyle = BLUE;
        c.lineWidth = 1.2;
        roundRect(qx - 22, qy, 44, 24, 8);
        c.stroke();
        c.fillStyle = BLUE;
        c.font = 'bold 12px ' + FONT;
        c.textAlign = 'center';
        c.fillText(h, qx, qy + 16);
        // 箭头连到共享 KV 顶部
        const tx = Math.max(kvLeft + 8, Math.min(kvRight - 8, qx));
        const x1 = qx, y1 = qy + 24, x2 = tx, y2 = kvy;
        c.strokeStyle = i === 0 ? ORANGE : '#b9c4d4';
        c.lineWidth = i === 0 ? 2 : 1.2;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        c.fillStyle = i === 0 ? ORANGE : '#b9c4d4';
        c.beginPath();
        c.moveTo(x2, y2);
        c.lineTo(x2 - 4, y2 - 7);
        c.lineTo(x2 + 4, y2 - 7);
        c.closePath();
        c.fill();
      });
      c.textAlign = 'left';
      // 共享 KV
      c.fillStyle = '#eefaf1';
      roundRect(kvLeft, kvy, kvW, kvH, 8);
      c.fill();
      c.strokeStyle = GREEN;
      c.lineWidth = 1.5;
      roundRect(kvLeft, kvy, kvW, kvH, 8);
      c.stroke();
      c.fillStyle = '#1e6b3c';
      c.font = 'bold 13px ' + FONT;
      c.textAlign = 'center';
      c.fillText('共享 K,V', kvx, kvy + 20);
      c.textAlign = 'left';
      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      c.fillText('（GQA：多个查询头共用一组 K/V）', lx + 14, kvy + 50);

      // 右面板：步骤
      const rx = 290, ry = 44, rw = 254, rh = 168;
      c.fillStyle = '#ffffff';
      roundRect(rx, ry, rw, rh, 12);
      c.fill();
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      roundRect(rx, ry, rw, rh, 12);
      c.stroke();
      c.fillStyle = INK;
      c.font = 'bold 13px ' + FONT;
      c.fillText('第 ' + (s + 1) + ' 步 · ' + STEPS[s], rx + 14, ry + 24);

      if (s >= 1) {
        const vals = s === 1 ? RAW : NORM;
        const title = s === 1 ? '原始分（尺度不一）' : 'z-score 归一后';
        c.fillStyle = MUT;
        c.font = '12px ' + FONT;
        c.fillText(title, rx + 14, ry + 48);
        HEADS.forEach((h, i) => {
          const y = ry + 62 + i * 30;
          c.fillStyle = INK;
          c.font = '12px ' + FONT;
          c.fillText(h, rx + 14, y + 10);
          const bw = 150;
          c.fillStyle = '#eef1f5';
          roundRect(rx + 44, y, bw, 14, 5);
          c.fill();
          const v = vals[i];
          const w = Math.max(2, (v / 1.2) * bw);
          c.fillStyle = v >= 0 ? BLUE : RED;
          roundRect(rx + 44, y, w, 14, 5);
          c.fill();
          c.fillStyle = INK;
          c.font = 'bold 11px ' + FONT;
          c.fillText(v.toFixed(1), rx + 44 + bw + 8, y + 12);
        });
      }
      if (s >= 3) {
        c.fillStyle = GREEN;
        c.font = 'bold 13px ' + FONT;
        c.fillText('取最大 = 1.0（来自 Q1）→ 保留 ✓', rx + 14, ry + rh - 14);
        c.fillStyle = MUT;
        c.font = '11px ' + FONT;
        c.fillText('只要有一个头认为重要就留下', rx + 14, ry + rh - 2);
      }
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onStep = (v: number) => { stepRef.current = v; setStep(v); };
  const stepText = STEPS[step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => onStep(Math.min(3, step + 1))} disabled={step >= 3}>下一步 ▶</button>
        <button className="chip" onClick={() => onStep(0)}>重置</button>
      </div>
      <div className="feedback guide">
        {step === 0 ? '三个查询头共享同一个 KV 头，都要判断这个键重不重要。' : step === 1 ? '各头给共享键打分：原始分数尺度不同，不能直接比。' : step === 2 ? '先在各头内部做 z-score 归一化，分数才可比。' : '对共享键取各头归一化分的最大值：Q1 觉得它重要，就保留它。'}
      </div>
    </div>
  );
};

export default M82;
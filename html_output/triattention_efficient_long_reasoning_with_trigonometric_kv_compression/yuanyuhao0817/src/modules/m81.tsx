import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BLUE = '#27446e', GREEN = '#228d5c', RED = '#c43f52', ORANGE = '#d97706';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';
// 示意参数：每 128 token 一个窗口，预算 1024，共 10 步（第 8 步到预算，之后每步剪枝）
const WINDOW = 128, BUDGET = 1024, MAXSTEP = 10;

// 8.2：工程优化一 —— 窗口剪枝：每 128 token 打分一次，保留 top-B，剪掉其余。
export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const playRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

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
      c.fillStyle = INK;
      c.font = 'bold 14px ' + FONT;
      c.textAlign = 'left';
      c.fillText('窗口剪枝：每 128 token 打分，保留 top-B，剪掉其余', 20, 26);

      const s = stepRef.current;
      const grow = s * WINDOW;
      const pruned = grow > BUDGET;
      const cur = pruned ? BUDGET : grow;

      // 左面板：当前缓存
      const lx = 20, ly = 44, lw = 200, lh = 168;
      c.fillStyle = '#ffffff';
      roundRect(lx, ly, lw, lh, 12);
      c.fill();
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      roundRect(lx, ly, lw, lh, 12);
      c.stroke();
      c.fillStyle = INK;
      c.font = 'bold 13px ' + FONT;
      c.fillText('当前缓存', lx + 14, ly + 24);
      c.fillStyle = pruned ? GREEN : BLUE;
      c.font = 'bold 24px ' + FONT;
      c.fillText(String(cur), lx + 14, ly + 56);
      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      c.fillText('条（KV）', lx + 84, ly + 56);
      const barW = lw - 28, maxH = 84;
      const hh = Math.min(maxH, (cur / (BUDGET * 1.3)) * maxH);
      c.fillStyle = '#eef1f5';
      roundRect(lx + 14, ly + 66, barW, maxH, 6);
      c.fill();
      c.fillStyle = pruned ? GREEN : BLUE;
      roundRect(lx + 14, ly + 66 + maxH - hh, barW, hh, 6);
      c.fill();
      c.strokeStyle = ORANGE;
      c.lineWidth = 1.5;
      c.setLineDash([5, 4]);
      const bY = ly + 66 + maxH - Math.min(maxH, (BUDGET / (BUDGET * 1.3)) * maxH);
      c.beginPath(); c.moveTo(lx + 10, bY); c.lineTo(lx + lw - 10, bY); c.stroke();
      c.setLineDash([]);
      c.fillStyle = ORANGE;
      c.font = '11px ' + FONT;
      c.fillText('预算 ' + BUDGET, lx + 14, bY - 6);
      c.fillStyle = pruned ? GREEN : grow === BUDGET ? ORANGE : MUT;
      c.font = 'bold 12px ' + FONT;
      c.fillText(pruned ? '✓ 已剪枝（保留 top-B）' : grow === BUDGET ? '到达预算' : '预算内', lx + 14, ly + lh - 14);

      // 右面板：阶梯图
      const rx = 240, ry = 198, rw = 300, rh = 140;
      c.fillStyle = '#ffffff';
      roundRect(rx - 10, ry - rh - 14, rw + 20, rh + 32, 12);
      c.fill();
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      roundRect(rx - 10, ry - rh - 14, rw + 20, rh + 32, 12);
      c.stroke();
      c.fillStyle = INK;
      c.font = 'bold 13px ' + FONT;
      c.fillText('KV 缓存条数 · 步进', rx + 6, ry - rh - 20);
      const maxV = BUDGET * 1.4;
      // 预算线
      c.strokeStyle = ORANGE;
      c.lineWidth = 1.5;
      c.setLineDash([5, 4]);
      const bY2 = ry - (BUDGET / maxV) * rh;
      c.beginPath(); c.moveTo(rx, bY2); c.lineTo(rx + rw, bY2); c.stroke();
      c.setLineDash([]);
      c.fillStyle = ORANGE;
      c.font = '10px ' + FONT;
      c.fillText('预算 1024', rx + 6, bY2 - 5);
      // 阶梯：上升段截断在预算线（不越过），剪枝处标绿色标记
      let cur2 = 0;
      for (let w = 0; w < MAXSTEP; w++) {
        const x0 = rx + (w / MAXSTEP) * rw;
        const x1 = rx + ((w + 1) / MAXSTEP) * rw;
        const endVal = cur2 + WINDOW;
        const over = endVal > BUDGET;
        const drawnEnd = over ? BUDGET : endVal;
        if (w <= s) {
          const y0 = ry - (cur2 / maxV) * rh;
          const y1 = ry - (drawnEnd / maxV) * rh;
          c.strokeStyle = BLUE;
          c.lineWidth = 2.5;
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
          if (over) {
            c.fillStyle = GREEN;
            c.font = 'bold 10px ' + FONT;
            c.fillText('剪枝', Math.max(x1 - 12, rx + 2), y1 - 7);
            cur2 = BUDGET;
          } else {
            cur2 = endVal;
          }
        } else {
          cur2 = over ? BUDGET : endVal;
        }
      }
      // 当前步橙色点（与预算线对齐）
      const curVal = Math.min(grow, BUDGET);
      const px = rx + (s / MAXSTEP) * rw;
      const py2 = ry - (curVal / maxV) * rh;
      c.fillStyle = ORANGE;
      c.beginPath(); c.arc(px, py2, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = MUT;
      c.font = '11px ' + FONT;
      c.fillText('蓝 = 缓存增长，绿 = 剪枝（保持在预算）', rx + 6, ry + 16);
      c.fillText('x 轴：解码窗口（每 128 token）', rx + 6, ry + 32);

      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      c.fillText('步骤 ' + s + '/' + MAXSTEP + ' · 缓存 ' + (pruned ? cur + '（已剪）' : cur) + ' 条', 20, H - 10);
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

  const onPlay = () => {
    if (playRef.current) return;
    playRef.current = true;
    setPlaying(true);
    setStep(0);
    timerRef.current = window.setInterval(() => {
      const next = stepRef.current + 1;
      if (next > MAXSTEP) {
        window.clearInterval(timerRef.current!);
        timerRef.current = null;
        playRef.current = false;
        setPlaying(false);
        return;
      }
      stepRef.current = next;
      setStep(next);
    }, 450);
  };
  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const grow = step * WINDOW;
  const pruned = grow > BUDGET;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={onPlay} disabled={playing}>一键运行 ▶</button>
        <button className="chip" onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0 || playing}>◀ 上一步</button>
        <button className="chip" onClick={() => onStep(Math.min(MAXSTEP, step + 1))} disabled={step === MAXSTEP || playing}>下一步 ▶</button>
        <button className="chip" onClick={() => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = null; playRef.current = false; setPlaying(false); onStep(0); }}>重置</button>
      </div>
      <div className={`feedback ${pruned ? 'good' : grow === BUDGET ? 'guide' : 'guide'}`}>
        {step === 0 ? '开始解码：缓存为空。' : pruned ? '第 ' + step + ' 个窗口：缓存 ' + grow + ' 条超过预算 ' + BUDGET + '，按分数给全部键打分，保留 top-B（' + BUDGET + '），把其余剪掉，缓存回到预算。' : '第 ' + step + ' 个窗口：缓存 ' + grow + ' 条，仍在预算内。'}
      </div>
    </div>
  );
};

export default M81;
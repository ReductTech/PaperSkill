import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 720, H = 380;
const MIN = 512, MAX = 2048, STEP = 256;

function snap(v: number) { return clamp(Math.round(v / STEP) * STEP, MIN, MAX); }
function posterBox(width: number, height: number) {
  const maxW = 390, maxH = 260, ratio = width / height;
  let w = maxW, h = w / ratio;
  if (h > maxH) { h = maxH; w = h * ratio; }
  return { x: 32 + (maxW - w) / 2, y: 72 + (maxH - h) / 2, w, h };
}

export const NativePackLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, width: 1024, height: 1024 });
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const extreme = (width === 512 && height === 2048) || (width === 2048 && height === 512);
  const feedback = extreme ? '4:1 比例在论文展示范围内；范围外不能由本教程外推。' : '保留原生网格，再用累计偏移隔离样本注意力。';
  const box = useMemo(() => posterBox(width, height), [width, height]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.maxWidth = '100%'; canvas.style.height = 'auto';
    ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#6c6a64'; ctx.setLineDash([5, 5]); ctx.strokeRect(32, 72, 390, 260); ctx.setLineDash([]);
    ctx.fillStyle = '#faf9f5'; ctx.strokeStyle = '#cc785c'; ctx.lineWidth = 2.5; ctx.fillRect(box.x, box.y, box.w, box.h); ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); ctx.strokeStyle = '#d8c9b0'; ctx.lineWidth = 1;
    const cellsX = Math.max(3, Math.round(width / 256)), cellsY = Math.max(3, Math.round(height / 256));
    for (let i = 1; i < cellsX; i++) { const x = box.x + box.w * i / cellsX; ctx.beginPath(); ctx.moveTo(x, box.y); ctx.lineTo(x, box.y + box.h); ctx.stroke(); }
    for (let i = 1; i < cellsY; i++) { const y = box.y + box.h * i / cellsY; ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#e8a55a'; ctx.fillRect(box.x + box.w - 9, box.y + box.h - 9, 18, 18);
    ctx.fillStyle = '#252523'; ctx.font = '600 15px "Segoe UI", sans-serif'; ctx.fillText(`${width} × ${height}`, 32, 38); ctx.fillStyle = '#6c6a64'; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('网格密度为方向示意，不是精确 token 数', 32, 58);
    ctx.fillStyle = '#f0eadd'; ctx.fillRect(470, 72, 220, 190); ctx.fillStyle = '#252523'; ctx.font = '600 14px "Segoe UI", sans-serif'; ctx.fillText('固定 token 预算 · 示意批次', 486, 100);
    const areaRatio = width * height / (MAX * MAX); const current = 34 + areaRatio * 82; const peer = [38, 31]; let x = 486;
    [peer[0], current, peer[1]].forEach((len, i) => { ctx.fillStyle = i === 1 ? '#cc785c' : '#cfc6b8'; ctx.fillRect(x, 126, len, 36); x += len; ctx.fillStyle = '#8a5a33'; ctx.fillRect(x, 120, 2, 48); x += 4; });
    ctx.strokeStyle = '#5db8a6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(500 + peer[0], 200); ctx.lineTo(540 + peer[0], 200); ctx.lineTo(540 + peer[0], 178); ctx.stroke();
    ctx.fillStyle = '#6c6a64'; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('累计偏移隔离样本', 486, 224); ctx.fillText('逐样本 2D RoPE 保留位置', 486, 244);
    ctx.fillStyle = '#6c6a64'; ctx.fillText('当前单图 token 不因打包而减少', 470, 292); ctx.fillText('同一总预算中的变长序列', 470, 312);
    canvas.classList.add('is-ready');
  }, [width, height, box]);
  const updateFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStart.current.x) * W / r.width;
    const dy = (e.clientY - dragStart.current.y) * H / r.height;
    setWidth(snap(dragStart.current.width + dx * (MAX - MIN) / 390));
    setHeight(snap(dragStart.current.height + dy * (MAX - MIN) / 260));
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); const px = (e.clientX - r.left) * W / r.width; const py = (e.clientY - r.top) * H / r.height; if (Math.abs(px - (box.x + box.w)) <= 28 && Math.abs(py - (box.y + box.h)) <= 28) { dragging.current = true; dragStart.current = { x: e.clientX, y: e.clientY, width, height }; e.currentTarget.setPointerCapture(e.pointerId); } };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => { if (dragging.current) updateFromPointer(e); };
  const stopDrag = (e: React.PointerEvent<HTMLCanvasElement>) => { dragging.current = false; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); };
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%', touchAction: 'none' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} aria-label={`当前原生画布宽 ${width}，高 ${height}；珊瑚色变长序列位于示意打包预算内`} />
    <div className="ctrl-grid">
      <div className="ctrl"><label htmlFor={`width-${moduleId}`}>宽度 <span className="val">{width}</span></label><input id={`width-${moduleId}`} type="range" min={MIN} max={MAX} step={STEP} value={width} onChange={(e) => setWidth(Number(e.target.value))} /></div>
      <div className="ctrl"><label htmlFor={`height-${moduleId}`}>高度 <span className="val">{height}</span></label><input id={`height-${moduleId}`} type="range" min={MIN} max={MAX} step={STEP} value={height} onChange={(e) => setHeight(Number(e.target.value))} /></div>
    </div>
    <div className={`feedback ${extreme ? '' : 'good'}`} aria-live="polite">当前画布：宽 {width}，高 {height}。{feedback}</div>
    <p className="module-note">累计偏移和逐样本 2D RoPE 分别保持样本边界与空间位置。论文报告每边 512–2048，并展示 512×2048 与 2048×512；不能据此推断范围外的生成能力。</p>
  </div>;
};

export default NativePackLab;

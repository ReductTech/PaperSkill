import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch8.1 — DeepStack architecture map (P5 clickable hotspots + keyboard buttons).
const W = 1080;
const H = 280;

const ITEMS = [
  { id: 1, label: '编码器末层', detail: '末层特征经主适配器投影到解码器空间，提供主要语义表征。' },
  { id: 2, label: '编码器中间层', detail: '中间层保留低/中层声学与说话人线索，供合并适配器聚合。' },
  { id: 3, label: '主适配器', detail: 'GatedMLP 投影，把最终编码器输出映射到解码器隐藏空间。' },
  { id: 4, label: '合并适配器', detail: '聚合多层特征并注入解码器早期层，两条路径共用 GatedMLP。' },
];

export const C4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const boxes = [
      { x: 80, y: 60, w: 120, h: 150 },
      { x: 80, y: 60, w: 120, h: 150 },
      { x: 420, y: 90, w: 150, h: 70 },
      { x: 420, y: 170, w: 150, h: 70 },
    ];
    const render = (s: { sel: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // encoder stack
      for (let i = 0; i < 4; i++) {
        const active = (s.sel === 1 && i === 3) || (s.sel === 2 && i === 1);
        ctx.fillStyle = active ? '#27446e' : '#b8c9a7';
        ctx.fillRect(80, 70 + i * 36, 120, 26);
      }
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('音频编码器', 80, 50);
      // adapters
      ctx.fillStyle = s.sel === 3 ? '#27446e' : '#7c3aed';
      ctx.fillRect(420, 90, 150, 70);
      ctx.fillStyle = s.sel === 4 ? '#27446e' : '#7c3aed';
      ctx.fillRect(420, 170, 150, 70);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('主适配器', 445, 130);
      ctx.fillText('合并适配器', 440, 210);
      // decoder
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(760, 70, 200, 150);
      ctx.fillStyle = '#21324a';
      ctx.fillText('解码器早期层', 790, 60);
      // arrows
      ctx.strokeStyle = s.sel === 3 ? '#27446e' : '#d7deea';
      ctx.lineWidth = s.sel === 3 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(200, 100);
      ctx.lineTo(420, 125);
      ctx.stroke();
      ctx.strokeStyle = s.sel === 4 ? '#27446e' : '#d7deea';
      ctx.lineWidth = s.sel === 4 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(200, 140);
      ctx.lineTo(420, 205);
      ctx.stroke();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(570, 125);
      ctx.lineTo(760, 140);
      ctx.moveTo(570, 205);
      ctx.lineTo(760, 160);
      ctx.stroke();
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      boxes.forEach((b, i) => {
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          const id = i + 1;
          stateRef.current.sel = id;
          setSel(id);
        }
      });
    };
    canvas.addEventListener('click', onClick);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  const pick = (id: number) => {
    stateRef.current.sel = id;
    setSel(id);
  };

  const detail = ITEMS.find((i) => i.id === sel);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {ITEMS.map((it) => (
          <button key={it.id} type="button" className={sel === it.id ? 'chip active' : 'chip'} onClick={() => pick(it.id)}>
            {it.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${sel ? 'good' : ''}`}>
        {detail ? detail.detail : '点击图中组件或按钮，查看它在 DeepStack 中的作用。'}
      </div>
    </div>
  );
};

export default C4Mod1;

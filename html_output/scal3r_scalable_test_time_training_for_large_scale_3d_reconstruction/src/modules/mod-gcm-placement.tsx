import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 模块 8.2 —— 切换 GCM 数量变体，看参数量与（示意）精度权衡。
// P4 chips variant∈{g1,g2,g4}（默认 g4）；24 层主干条 + 插点标记。
const W = 560;
const H = 220;

type Variant = 'g1' | 'g2' | 'g4';

interface PlaceState {
  t: number;
  variant: Variant;
}

const CHIPS: { id: Variant; label: string }[] = [
  { id: 'g1', label: '1 个' },
  { id: 'g2', label: '2 个' },
  { id: 'g4', label: '4 个（本文）' },
];

const LAYERS = 24;
// full paper config places GCM after layers 4/11/17/24
const POS_G4 = [4, 11, 17, 24];
const POS_G2 = [11, 24];
const POS_G1 = [24];

function positions(v: Variant): number[] {
  return v === 'g4' ? POS_G4 : v === 'g2' ? POS_G2 : POS_G1;
}

// readout per variant: params (M) and 示意 accuracy fraction
function readout(v: Variant): { params: string; acc: number } {
  switch (v) {
    case 'g1':
      return { params: '≈18.9M', acc: 0.5 };
    case 'g2':
      return { params: '≈37.8M', acc: 0.72 };
    case 'g4':
    default:
      return { params: '75.55M', acc: 0.95 };
  }
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#eef3ea';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.72, w * 0.6, h * 0.84);
  ctx.quadraticCurveTo(w * 0.85, h * 0.92, w, h * 0.8);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export const ModGcmPlacement: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PlaceState>({ t: 0, variant: 'g4' });
  const rafRef = useRef<number | null>(null);
  const [variant, setVariant] = useState<Variant>('g4');
  const [feedback, setFeedback] = useState({
    text: '本文配置：4 个（第 4/11/17/24 层后），75.55M。',
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

    const render = (s: PlaceState) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('24 层主干上的 GCM 插入位置', 20, 28);

      // backbone bar
      const barX = 30;
      const barY = 66;
      const barW = W - 60;
      const barH = 26;
      ctx.fillStyle = '#dfe6ea';
      ctx.fillRect(barX, barY, barW, barH);
      // layer ticks
      ctx.strokeStyle = '#c3ccd8';
      ctx.lineWidth = 1;
      for (let i = 1; i < LAYERS; i++) {
        const lx = barX + (barW * i) / LAYERS;
        ctx.beginPath();
        ctx.moveTo(lx, barY);
        ctx.lineTo(lx, barY + barH);
        ctx.stroke();
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('第 1 层', barX, barY + barH + 16);
      ctx.textAlign = 'right';
      ctx.fillText('第 24 层', barX + barW, barY + barH + 16);
      ctx.textAlign = 'left';

      // insertion marks (purple) at layer positions
      const pos = positions(s.variant);
      const isBest = s.variant === 'g4';
      for (const p of pos) {
        const mx = barX + (barW * p) / LAYERS;
        const pulse = 0.5 + 0.5 * Math.sin(s.t * 0.08 + p);
        // marker stem
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx, barY - 6);
        ctx.lineTo(mx, barY + barH + 6);
        ctx.stroke();
        // diamond mark
        ctx.fillStyle = `rgba(124,58,237,${0.7 + 0.3 * pulse})`;
        ctx.beginPath();
        ctx.moveTo(mx, barY - 14);
        ctx.lineTo(mx + 6, barY - 8);
        ctx.lineTo(mx, barY - 2);
        ctx.lineTo(mx - 6, barY - 8);
        ctx.closePath();
        ctx.fill();
        // layer number label
        ctx.fillStyle = '#7c3aed';
        ctx.font = '10px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(p), mx, barY - 18);
        ctx.textAlign = 'left';
      }

      // readout
      const r = readout(s.variant);
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`GCM 数量：${pos.length}    参数量：${r.params}`, 30, 138);

      // accuracy bar (示意)
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('精度（示意）', 30, 168);
      const accX = 120;
      const accY = 158;
      const accW = 320;
      const accH = 14;
      ctx.fillStyle = '#e7ece3';
      ctx.fillRect(accX, accY, accW, accH);
      ctx.fillStyle = isBest ? '#228d5c' : '#27446e';
      ctx.fillRect(accX, accY, accW * r.acc, accH);
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('论文只报告到 4 个', 30, 196);
    };

    const tick = () => {
      stateRef.current.t += 1;
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
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: Variant) => {
    stateRef.current.variant = id;
    setVariant(id);
    if (id === 'g4') {
      setFeedback({ text: '本文配置：4 个（第 4/11/17/24 层后），75.55M。', cls: 'good' });
    } else {
      setFeedback({ text: '更少记忆模块：容量与精度下降。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            className={`chip ${variant === c.id ? 'selected' : ''}`}
            onClick={() => pick(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModGcmPlacement;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const CONFIGS = [
  { id: 'low', label: '低 λ：N=128, M=192', bits: 0.3, psnr: 31.5, desc: '隐变量更少、超先验更窄：省比特，但重建质量上限较低。' },
  { id: 'high', label: '高 λ：N=192, M=320', bits: 0.8, psnr: 35.0, desc: '隐变量更多、超先验更宽：吃更多比特，换取更高的重建质量。' },
];

export const ModCapacity: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ cfg: 'low' });
  const raf = useRef<number | null>(null);
  const [cfg, setCfg] = useState('low');
  const [fb, setFb] = useState({ text: `当前 ${CONFIGS[0].label}：${CONFIGS[0].desc}`, cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      const conf = CONFIGS.find((x) => x.id === s.cfg) || CONFIGS[0];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // latent channel capacity (left): N
      const n = conf.id === 'low' ? 128 : 192;
      const m = conf.id === 'low' ? 192 : 320;
      const nCount = conf.id === 'low' ? 10 : 15;
      const mCount = conf.id === 'low' ? 14 : 22;

      ctx.fillStyle = '#68778f';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`隐变量通道 N=${n}`, 60, 60);
      ctx.fillText(`超先验通道 M=${m}`, 60, 180);

      const drawRow = (y: number, count: number, color: string) => {
        const bw = 26;
        const gap = 12;
        const startX = 320;
        for (let i = 0; i < count; i += 1) {
          ctx.fillStyle = color;
          ctx.fillRect(startX + i * (bw + gap), y, bw, 40);
        }
      };
      drawRow(40, nCount, '#27446e');
      drawRow(160, mCount, '#7c3aed');

      // rate-quality tradeoff bar (right)
      const barX = 820;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, 60, 200, 160);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(barX, 60 + 160 - conf.bits * 160, 200, conf.bits * 160);
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(barX + 100, 60 + 160 - conf.psnr / 38 * 160, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.textAlign = 'center';
      ctx.fillText(`码率 ${conf.bits.toFixed(1)} bpp`, barX + 100, 240);
      ctx.fillText(`PSNR ${conf.psnr.toFixed(1)} dB`, barX + 100, 40);
    };

    const tick = () => {
      render();
      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    const conf = CONFIGS.find((x) => x.id === id);
    if (!conf) return;
    stateRef.current.cfg = id;
    setCfg(id);
    setFb({ text: `当前 ${conf.label}：${conf.desc}`, cls: id === 'high' ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row">
        {CONFIGS.map((conf) => (
          <button key={conf.id} className={`chip ${cfg === conf.id ? 'selected' : ''}`} onClick={() => pick(conf.id)}>
            {conf.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModCapacity;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch6 Module 2：特征对比（论文 Fig.6）—— 点击模型看失败模式 + NYU RMSE
const W = 460;
const H = 180;

type Model = 'dino' | 'siglip' | 'vjepa' | 'ling';

const MODELS: Record<Model, { label: string; note: string; rmse: number; color: string; good: boolean }> = {
  dino: { label: 'DINOv2', note: '每 token 出现斑点噪声，物体内部特征不连贯。', rmse: 0.372, color: '#c43f52', good: false },
  siglip: { label: 'SigLIP2', note: '远离显著物体处退化为块状噪声。', rmse: 0.494, color: '#c43f52', good: false },
  vjepa: { label: 'V-JEPA2.1', note: '背景纹理渗入前景区域，边界处特征混淆。', rmse: 0.350, color: '#d97706', good: false },
  ling: { label: 'LingBot-Vision', note: '物体内部连贯、边界锐利——正是深度/分割要的特征。', rmse: 0.296, color: '#228d5c', good: true },
};

export const M62: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [model, setModel] = useState<Model>('ling');
  const [feedback, setFeedback] = useState({
    text: '点击各模型，对比冻结 patch 特征的 PCA 表现；柱状图显示 NYUv2 深度 RMSE（越低越好）。',
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
    const render = (m: Model) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const gx = 40;
      const gy = 20;
      const gw = 380;
      const gh = 130;
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('NYUv2 深度 RMSE ↓（越低越好）', gx, gy - 6);

      const maxR = 0.55;
      const bar = (label: string, rmse: number, color: string, x: number, w: number) => {
        const h = (rmse / maxR) * (gh - 30);
        ctx.fillStyle = color;
        ctx.fillRect(x, gy + gh - h, w, h);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillText(rmse.toFixed(3), x, gy + gh - h - 4);
        ctx.fillStyle = '#68778f';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(label, x - 4, gy + gh + 14);
      };
      bar('DINOv2', MODELS.dino.rmse, '#c43f52', gx + 20, 56);
      bar('SigLIP', MODELS.siglip.rmse, '#c43f52', gx + 108, 56);
      bar('V-JEPA', MODELS.vjepa.rmse, '#d97706', gx + 196, 56);
      bar('LingBot', MODELS.ling.rmse, '#228d5c', gx + 284, 56);

      // 高亮选中
      const sel = { dino: 0, siglip: 1, vjepa: 2, ling: 3 }[m];
      ctx.strokeStyle = MODELS[m].color;
      ctx.lineWidth = 3;
      ctx.strokeRect(gx + 20 + sel * 88 - 6, gy - 3, 68, gh + 20);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef<Model>('ling');
  stateRef.current = model;

  const setModelState = (m: Model) => {
    stateRef.current = m;
    setModel(m);
    setFeedback({ text: `${MODELS[m].label}：${MODELS[m].note}`, cls: MODELS[m].good ? 'good' : 'bad' });
  };

  return (
    <div className="split-60-40">
      <div className="split-left">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
      <div className="split-right">
        <button className={`chip ${model === 'dino' ? 'active' : ''}`} onClick={() => setModelState('dino')}>
          DINOv2
        </button>
        <button className={`chip ${model === 'siglip' ? 'active' : ''}`} onClick={() => setModelState('siglip')}>
          SigLIP2
        </button>
        <button className={`chip ${model === 'vjepa' ? 'active' : ''}`} onClick={() => setModelState('vjepa')}>
          V-JEPA2.1
        </button>
        <button className={`chip ${model === 'ling' ? 'active' : ''}`} onClick={() => setModelState('ling')}>
          LingBot-Vision
        </button>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
    </div>
  );
};

export default M62;

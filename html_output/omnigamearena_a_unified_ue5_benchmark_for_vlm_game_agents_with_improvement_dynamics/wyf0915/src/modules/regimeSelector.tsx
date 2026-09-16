import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
type Regime = 'Solo' | 'PvP' | 'Coop';

const REGIMES: Record<Regime, { games: number; desc: string; color: string }> = {
  Solo: { games: 7, desc: '单智能体独自完成关卡，考察感知、导航与反应。', color: '#27446e' },
  PvP: { games: 3, desc: '1v1 对抗，考察对手建模、博弈策略与角色分配。', color: '#c43f52' },
  Coop: { games: 2, desc: '双人协作，考察信息共享、分工与队友失误恢复。', color: '#228d5c' },
};

export const RegimeSelector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [regime, setRegime] = useState<Regime>('Solo');
  const [feedback, setFeedback] = useState('点击下方三种交互模式，查看对应的游戏数量与设计动机。');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (r: Regime) => {
      ctx.clearRect(0, 0, W, H);
      const cellW = (W - 80) / 3;
      const cellH = H - 80;
      const x0 = 40;
      const y0 = 40;
      (Object.keys(REGIMES) as Regime[]).forEach((k, i) => {
        const x = x0 + i * cellW;
        const active = k === r;
        ctx.fillStyle = active ? REGIMES[k].color : '#f5f8f0';
        ctx.strokeStyle = active ? REGIMES[k].color : '#d7deea';
        ctx.lineWidth = active ? 3 : 1;
        ctx.fillRect(x + 10, y0, cellW - 20, cellH);
        ctx.strokeRect(x + 10, y0, cellW - 20, cellH);
        ctx.fillStyle = active ? '#fff' : '#21324a';
        ctx.font = 'bold 28px "Segoe UI", sans-serif';
        ctx.fillText(k, x + 24, y0 + 38);
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillStyle = active ? 'rgba(255,255,255,0.85)' : '#68778f';
        ctx.fillText(REGIMES[k].games + ' games', x + 24, y0 + 72);
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText(REGIMES[k].desc.slice(0, 28), x + 24, y0 + 100);
        if (REGIMES[k].desc.length > 28) ctx.fillText(REGIMES[k].desc.slice(28, 56), x + 24, y0 + 122);
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const rafRef = { current: 0 };
    const tick = () => {
      render(regime);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [regime]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {(['Solo', 'PvP', 'Coop'] as Regime[]).map((k) => (
          <button
            key={k}
            className={regime === k ? 'on' : ''}
            onClick={() => {
              setRegime(k);
              setFeedback(`已切换到 ${k} 模式：${REGIMES[k].desc}`);
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default RegimeSelector;

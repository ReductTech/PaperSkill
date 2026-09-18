import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

export const CoreInsightAnimation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const playingRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);

    const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
    };

    const render = () => {
      const progress = (Math.sin(frameRef.current * 0.035) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f7fbff';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#183153';
      ctx.font = '600 23px Arial, "Segoe UI", sans-serif';
      ctx.fillText('完整未来画面', 48, 38);
      ctx.fillText('场景变化特征', 650, 38);
      ctx.fillStyle = '#5c6f86';
      ctx.font = '18px Arial, "Segoe UI", sans-serif';
      ctx.fillText('成本高：还要生成许多与动作无关的细节', 48, 66);
      ctx.fillText('更紧凑：只保留“哪里会变、如何变”', 650, 66);

      ctx.fillStyle = '#e8f0f8';
      roundRect(36, 88, 470, 160, 16);
      ctx.fill();
      ctx.strokeStyle = '#cbd9e8';
      ctx.stroke();
      ctx.fillStyle = '#d8e2ec';
      ctx.fillRect(64, 160, 110, 56);
      ctx.fillStyle = '#bdd0e2';
      ctx.beginPath();
      ctx.arc(330, 164, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9db6ca';
      ctx.fillRect(196 + progress * 90, 188, 64, 28);
      ctx.fillStyle = '#637f98';
      ctx.font = '16px Arial, "Segoe UI", sans-serif';
      ctx.fillText('未来帧 1', 58, 275);
      ctx.fillText('未来帧 2', 208, 275);
      ctx.fillText('未来帧 3', 358, 275);

      ctx.strokeStyle = '#2f6fed';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(536, 168);
      ctx.lineTo(618, 168);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(618, 168);
      ctx.lineTo(602, 158);
      ctx.moveTo(618, 168);
      ctx.lineTo(602, 178);
      ctx.stroke();

      ctx.fillStyle = '#e6f6ef';
      roundRect(642, 88, 402, 160, 16);
      ctx.fill();
      ctx.strokeStyle = '#9dd4bb';
      ctx.stroke();
      const nodes = [
        [720, 150],
        [820, 128 + progress * 34],
        [918, 166],
        [820, 204 - progress * 34],
      ];
      ctx.strokeStyle = '#62b58e';
      ctx.lineWidth = 2;
      nodes.slice(1).forEach(([x, y], index) => {
        ctx.beginPath();
        ctx.moveTo(nodes[0][0], nodes[0][1]);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (index > 0) {
          ctx.beginPath();
          ctx.moveTo(nodes[index][0], nodes[index][1]);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      });
      nodes.forEach(([x, y], index) => {
        ctx.fillStyle = index === 2 ? '#ff8f3d' : '#2eb67d';
        ctx.beginPath();
        ctx.arc(x, y, index === 2 ? 12 : 9, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#276a4d';
      ctx.font = '600 16px Arial, "Segoe UI", sans-serif';
      ctx.fillText('变化特征', 760, 236);
      ctx.fillStyle = '#2f6fed';
      ctx.fillText('→ 动作', 920, 236);

      if (playingRef.current) {
        frameRef.current += 1;
        rafRef.current = requestAnimationFrame(render);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    startRef.current = () => {
      if (!rafRef.current && playingRef.current) {
        rafRef.current = requestAnimationFrame(render);
      }
    };
    render();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, []);

  const toggle = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
    if (playingRef.current) {
      startRef.current?.();
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  return (
    <div className="core-insight-animation">
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="core-insight-caption">
        <span>概念化演示：模型提取场景变化的中间特征，再交给动作策略推理。</span>
        <button type="button" onClick={toggle} aria-pressed={playing}>
          {playing ? '暂停动画' : '播放动画'}
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 320;

// Illustrative 7-game × 4-agent Solo cold-start scores (subset of Table 3 in the paper).
const GAMES = ['ObstacleRun2D', 'ObstacleRun3D', 'LastStand', 'MonsterShoot', 'SceneEscape', 'CueChase', 'SoloCraft'];
const AGENTS = [
  { name: 'GPT-5.5', color: '#228d5c', data: [0.473, 0.133, 0.416, 0.464, 0.720, 0.580, 0.252] },
  { name: 'Claude Opus 4.6', color: '#27446e', data: [0.338, 0.172, 0.147, 0.362, 0.540, 0.840, 0.228] },
  { name: 'Gemini 3.1 Pro', color: '#f07e47', data: [0.102, 0.165, 0.230, 0.710, 0.660, 0.600, 0.148] },
  { name: 'Qwen3.5-397B', color: '#c43f52', data: [0.114, 0.112, 0.106, 0.072, 0.200, 0.040, 0.000] },
];

export const ColdStartBars: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (g: number) => {
      ctx.clearRect(0, 0, W, H);
      const left = 60;
      const right = W - 40;
      const top = 40;
      const bottom = H - 60;
      const max = 1.0;
      // axis
      ctx.strokeStyle = '#d7deea';
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      // grid + labels
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      for (let i = 0; i <= 4; i++) {
        const y = lerp(bottom, top, i / 4);
        const v = ((1 - i / 4) * max).toFixed(2);
        ctx.fillText(v, 16, y + 4);
      }
      // bars
      const groupW = (right - left) / AGENTS.length;
      AGENTS.forEach((a, i) => {
        const x = left + i * groupW + 18;
        const v = a.data[g];
        const h = ((bottom - top) * v) / max;
        const y = bottom - h;
        ctx.fillStyle = a.color;
        ctx.fillRect(x, y, groupW - 36, h);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.fillText(v.toFixed(3), x + 4, y - 6);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = '#68778f';
        ctx.fillText(a.name, x, bottom + 18);
      });
      // title
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('Game: ' + GAMES[g] + '   (Solo cold-start score)', 60, 24);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const rafRef = { current: 0 };
    const tick = () => {
      render(game);
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
  }, [game]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          切换游戏：<span className="val">{GAMES[game]}</span>
        </label>
        <input
          type="range"
          min={0}
          max={GAMES.length - 1}
          value={game}
          onChange={(e) => setGame(Number(e.target.value))}
        />
      </div>
      <div className="feedback">
        单一游戏第一名不等于全榜第一——在 ObstacleRun2D / LastStand / SceneEscape / SoloCraft 上 GPT-5.5 领先，
        而 CueChase 由 Claude Opus 4.6 拿下 0.840，MonsterShoot 由 Gemini 3.1 Pro 拿下 0.710。
      </div>
    </div>
  );
};

export default ColdStartBars;

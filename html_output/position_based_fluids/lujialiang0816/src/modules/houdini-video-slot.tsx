import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';
import { WATER, drawWaterDrop, drawWaterParticle, drawWaterSurface } from './waterKit';

type ViewMode = 'particles' | 'surface' | 'render';

const modes: Record<ViewMode, { label: string; note: string }> = {
  particles: { label: '① PBF 粒子', note: '输入：逐帧 P、稳定 id、v 与 pscale。' },
  surface: { label: '② 连续网格', note: 'Particle Fluid Surface / VDB：重建 SDF 并提取表面。' },
  render: { label: '③ 最终渲染', note: 'Karma：透射、折射、吸收、灯光与运动模糊。' },
};

export const HoudiniVideoSlot: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ViewMode>('render');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 720, 260);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, 720, 260);
    ctx.fillStyle = '#071d38';
    ctx.fillRect(0, 0, 720, 260);
    const surface = [
      { x: 40, y: 146 }, { x: 110, y: 134 }, { x: 180, y: 148 }, { x: 250, y: 118 },
      { x: 320, y: 139 }, { x: 390, y: 111 }, { x: 470, y: 142 }, { x: 560, y: 124 }, { x: 680, y: 145 },
    ];
    if (mode === 'particles') {
      for (let index = 0; index < 48; index += 1) {
        const x = 60 + (index % 12) * 49 + Math.sin(index * 1.7) * 6;
        const y = 78 + Math.floor(index / 12) * 42 + Math.sin(index) * 7;
        drawWaterParticle(ctx, x, y, 6, WATER.bright);
      }
    } else if (mode === 'surface') {
      drawWaterSurface(ctx, surface, 238, '#33bff0', 0.85);
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1;
      for (let x = 45; x < 680; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 144 + Math.sin(x * 0.04) * 12);
        ctx.lineTo(x + 18, 232);
        ctx.stroke();
      }
    } else {
      drawWaterSurface(ctx, surface, 244, '#159bd6', 0.82);
      drawWaterDrop(ctx, 390, 76, 18, 0.8, WATER.bright);
      drawWaterDrop(ctx, 445, 98, 10, 0.9, WATER.bright);
      const glow = ctx.createRadialGradient(545, 42, 8, 545, 42, 180);
      glow.addColorStop(0, 'rgba(255,255,255,.75)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(360, 0, 360, 210);
    }
    ctx.fillStyle = 'rgba(3,17,33,.72)';
    ctx.fillRect(22, 18, 320, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 19px Segoe UI';
    ctx.fillText(modes[mode].label, 40, 48);
    ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.font = '13px Segoe UI';
    ctx.fillText('同一帧：点 → 面 → 光学表现', 430, 239);
    canvas.classList.add('is-ready');
  }, [mode]);

  return (
    <div>
      <div className="talk-stage-switch" role="group" aria-label="Houdini 渲染阶段">
        {(Object.keys(modes) as ViewMode[]).map((key) => (
          <button key={key} type="button" className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{modes[key].label}</button>
        ))}
      </div>
      <canvas ref={canvasRef} role="img" aria-label={`第 ${chapterId} 章模块 ${moduleId}，Houdini 结果预览：${modes[mode].label}`} />
      <p className="feedback good" aria-live="polite">{modes[mode].note}</p>
      <div className="talk-video-slot" role="img" aria-label="Houdini 最终渲染视频预留区，十六比九">
        <div className="talk-video-play">▶</div>
        <div>
          <strong>Houdini 最终渲染视频预留区</strong>
          <span>16:9 · 建议 15–25 秒 · 粒子视图 → 网格视图 → 最终水面</span>
        </div>
        <span className="talk-video-badge">VIDEO</span>
      </div>
    </div>
  );
};

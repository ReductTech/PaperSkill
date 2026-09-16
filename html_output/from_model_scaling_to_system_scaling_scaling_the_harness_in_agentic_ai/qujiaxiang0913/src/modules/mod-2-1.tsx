import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawSea,
  drawTower,
  drawLamp,
  drawBeam,
  drawShip,
  drawSceneLabel,
  drawBars,
  C,
} from './lighthouseKit';

// §2 Module 2.1 — 转动透镜，看 𝒞 的四个子轴如何变化（P6 拖拽）。
// 左右拖改 beamAngle(-0.55~0.55)，上下拖改 spread(0.12~0.70)；船固定在 +0.18 rad。

const W = 1080;
const H = 300;
const SHIP_ANGLE = 0.18;
const SHIP_REACH = 300;
const LAMP_X = 150;
const LAMP_Y = 150;
const SEA_Y = 200;

interface S2 {
  beamAngle: number;
  spread: number;
}

function isHit(s: S2): boolean {
  return Math.abs(s.beamAngle - SHIP_ANGLE) < s.spread / 2;
}

function computeFeedback(s: S2): { text: string; cls: '' | 'good' | 'bad' } {
  if (isHit(s)) {
    return { text: '四个子轴同时改善，这一束光才是**最小充分**的上下文。', cls: 'good' };
  }
  if (s.spread >= 0.4) {
    return { text: '光铺得很宽，曝光多但命中低——曝光不等于访问。', cls: 'bad' };
  }
  return { text: '光很集中却照错了方向：相关性不够。', cls: '' };
}

export const Mod21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<S2>({ beamAngle: 0.0, spread: 0.45 });
  const stateRef = useRef<S2>(state);
  const [feedback, setFeedback] = useState(computeFeedback(state));
  const dragRef = useRef<{ x: number; y: number; ba: number; sp: number } | null>(null);

  const update = (s: S2) => {
    stateRef.current = s;
    setState(s);
    setFeedback(computeFeedback(s));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: S2) => {
      clearScene(ctx, W, H);
      drawSea(ctx, W, H, SEA_Y);
      drawTower(ctx, LAMP_X, H, 150);
      drawLamp(ctx, LAMP_X, LAMP_Y, 0.6);

      const hit = isHit(s);
      const reach = clamp(560 * (0.41 / s.spread), 320, 800);
      drawBeam(ctx, LAMP_X, LAMP_Y, s.beamAngle, s.spread, reach, hit ? C.hit : C.beam);

      const sx = LAMP_X + Math.cos(SHIP_ANGLE) * SHIP_REACH;
      const sy = LAMP_Y + Math.sin(SHIP_ANGLE) * SHIP_REACH;
      drawShip(ctx, sx, sy, hit ? 'safe' : 'dark');
      drawSceneLabel(ctx, sx + 22, sy, '船');

      const relevance = 1 - Math.min(1, Math.abs(s.beamAngle - SHIP_ANGLE) / 0.6);
      const compactness = 1 - (s.spread - 0.12) / (0.7 - 0.12);
      const traceability = hit ? 0.8 : 0.35;
      const freshness = 0.5 + (hit ? 0.3 : 0);

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillRect(588, 140, 474, 126);
      drawBars(ctx, 600, 150, 450, [
        { label: '相关性', value: relevance, color: C.aux },
        { label: '紧凑性', value: compactness, color: C.mark },
        { label: '可追溯性', value: traceability, color: C.beam },
        { label: '刷新', value: freshness, color: C.hit },
      ]);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const rafRef = { current: 0 as number };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
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

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ba: stateRef.current.beamAngle,
      sp: stateRef.current.spread,
    };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const ba = clamp(dragRef.current.ba + dx / 300, -0.55, 0.55);
    const sp = clamp(dragRef.current.sp + dy / 300, 0.12, 0.7);
    update({ beamAngle: ba, spread: sp });
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const nudge = (d: number) => {
    const ba = clamp(stateRef.current.beamAngle + d, -0.55, 0.55);
    update({ ...stateRef.current, beamAngle: ba });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <div className="ctrl">
        <span>光束角度 {state.beamAngle.toFixed(2)} rad　光束宽度 {state.spread.toFixed(2)} rad</span>
        <div>
          <button type="button" onClick={() => nudge(-0.05)}>光束左移</button>
          <button type="button" onClick={() => nudge(0.05)}>光束右移</button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod21;

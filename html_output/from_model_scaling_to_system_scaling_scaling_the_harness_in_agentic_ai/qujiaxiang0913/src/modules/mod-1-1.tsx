import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawSea,
  drawTower,
  drawLamp,
  drawBeam,
  drawShip,
  drawBars,
  drawSceneLabel,
} from './lighthouseKit';

// §1 Module 1.1 — 只升级灯泡会发生什么
// P1 实时滑块：拖动「灯光功率（模型规模）」，光束 spread 固定 1.15 rad，
// 船判定为 dark / lit；右侧 drawBars 显示「已曝光海面」与「船被照到」。

const W = 1080;
const H = 300;
const LEVEL = 185;
const LAMP_X = 160;
const LAMP_Y = 45;
const SHIP_X = 880;
const SHIP_Y = 250;
const SHIP_ANGLE = Math.atan2(SHIP_Y - LAMP_Y, SHIP_X - LAMP_X);
// 光束中心线指向海面近塔处（较陡向下），让 1.15 rad 的宽扇区始终扫不到远处的船。
const BEAM_ANGLE = 0.95;

export const Mod11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ value: 40 });
  const rafRef = useRef<number | null>(null);
  const [value, setValue] = useState(40);
  const [feedback, setFeedback] = useState({
    text: '拖动滑块，看只加大灯泡会不会让船被照到。',
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

    const render = (s: { value: number }) => {
      const intensity = clamp(s.value, 0, 100) / 100;
      clearScene(ctx, W, H);
      drawSea(ctx, W, H, LEVEL);
      drawTower(ctx, LAMP_X, LEVEL, 150);
      drawLamp(ctx, LAMP_X, LAMP_Y, intensity);
      // reach 随 intensity 略增，但覆盖角度不变
      const reach = 360 + intensity * 260;
      drawBeam(ctx, LAMP_X, LAMP_Y, BEAM_ANGLE, 1.15, reach, C.beam);
      // 中心线到船的角度差 > spread/2 → 船始终 dark
      const gap = Math.abs(BEAM_ANGLE - SHIP_ANGLE);
      const shipState = gap > 1.15 / 2 ? 'dark' : 'lit';
      drawShip(ctx, SHIP_X, SHIP_Y, shipState);
      drawSceneLabel(ctx, LAMP_X - 18, LAMP_Y - 22, '塔灯');
      drawSceneLabel(ctx, SHIP_X - 14, SHIP_Y - 28, '远处船');
      drawBars(ctx, 560, 120, 480, [
        { label: '已曝光海面', value: 0.15 + 0.8 * intensity, color: C.beam },
        { label: '船被照到', value: 0, color: C.miss },
      ]);
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
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.value = v;
    setValue(v);
    setFeedback(
      v < 60
        ? { text: '光更亮了，但散开的角度没变，船仍在暗处。', cls: 'bad' }
        : { text: '功率已经很高，船还是没被照到——问题不在灯泡。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          灯光功率（模型规模） <span className="val">{value}</span>
        </label>
        <input type="range" min={0} max={100} value={value} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod11;

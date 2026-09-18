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
  panelStroke,
} from './lighthouseKit';

// §1 Module 1.2 — 只升级模型 vs 同时治理系统
// P3 同步对比：一个「开始对比」按钮，左右两块 520x260 子画面（中间留白），
// 共用同一时间戳同时推进 3.2 秒；反馈按 SKILL.md 两档文案（未开始 / 结束后）。

const W = 1080;
const H = 300;
const PANEL_W = 520;
const PANEL_TOP = 10;
const PANEL_H = 250;
const LEFT_X = 0;
const RIGHT_X = 560;

interface PanelLayout {
  px: number;
  lampX: number;
  lampY: number;
  seaLevel: number;
  shipX: number;
  shipY: number;
}
function panel(px: number): PanelLayout {
  const seaLevel = PANEL_TOP + 175; // 185
  const lampX = px + 90;
  const lampY = seaLevel - 120 * 0.93; // ~68
  const shipX = px + 410;
  const shipY = seaLevel + 45; // ~230
  return { px, lampX, lampY, seaLevel, shipX, shipY };
}

export const Mod12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0, running: false });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const [feedback, setFeedback] = useState({
    text: '点击开始，从相同状态对比两种做法。',
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

    const L = panel(LEFT_X);
    const R = panel(RIGHT_X);
    const shipAngleL = Math.atan2(L.shipY - L.lampY, L.shipX - L.lampX);
    const shipAngleR = Math.atan2(R.shipY - R.lampY, R.shipX - R.lampX);

    const render = (s: { t: number; running: boolean }) => {
      clearScene(ctx, W, H);
      const reach = 150 + s.t * 230;

      // 左：只加功率，宽束 1.15 rad，船 dark，红框
      drawSea(ctx, W, H, L.seaLevel);
      drawTower(ctx, L.lampX, L.seaLevel, 120);
      drawLamp(ctx, L.lampX, L.lampY, 0.9);
      drawBeam(ctx, L.lampX, L.lampY, shipAngleL + 0.7, 1.15, reach, C.beam);
      drawShip(ctx, L.shipX, L.shipY, 'dark');
      panelStroke(ctx, L.px + 4, PANEL_TOP, PANEL_W - 8, PANEL_H, C.miss);
      drawSceneLabel(ctx, L.px + 16, PANEL_TOP + 18, '只加功率');

      // 右：同功率 + 透镜遮光板，窄束 0.30 对准船，船 safe，绿框
      drawTower(ctx, R.lampX, R.seaLevel, 120);
      drawLamp(ctx, R.lampX, R.lampY, 0.9);
      drawBeam(ctx, R.lampX, R.lampY, shipAngleR, 0.30, reach, C.hit);
      drawShip(ctx, R.shipX, R.shipY, 'safe');
      panelStroke(ctx, R.px + 4, PANEL_TOP, PANEL_W - 8, PANEL_H, C.hit);
      drawSceneLabel(ctx, R.px + 16, PANEL_TOP + 18, '加透镜');

      // 底部各一条 drawBars：有效命中（左低右高）
      const leftHit = 0.12 + 0.05 * s.t;
      const rightHit = 0.85 * s.t;
      drawBars(ctx, L.px + 24, 268, PANEL_W - 60, [
        { label: '有效命中', value: leftHit, color: C.miss },
      ]);
      drawBars(ctx, R.px + 24, 268, PANEL_W - 60, [
        { label: '有效命中', value: rightHit, color: C.hit },
      ]);
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.running) {
        const elapsed = (performance.now() - startRef.current) / 1000;
        s.t = clamp(elapsed / 3.2, 0, 1);
        if (s.t >= 1) {
          s.running = false;
          setFeedback({
            text: '同样的灯泡，装上透镜后船被稳定照住——这就是把 harness 当一等对象。',
            cls: 'good',
          });
        }
      }
      render(s);
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

  const onStart = () => {
    stateRef.current.running = true;
    stateRef.current.t = 0;
    startRef.current = performance.now();
    setFeedback({ text: '两侧从相同状态同时推进，对比两种做法……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onStart}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod12;

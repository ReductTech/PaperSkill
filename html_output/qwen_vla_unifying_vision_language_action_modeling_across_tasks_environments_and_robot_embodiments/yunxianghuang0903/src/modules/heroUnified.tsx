import React, { useRef, useState, useEffect } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { prefersReducedMotion } from '../lib/motion';
import { CanvasStage, PsChip } from '../components/ps-controls';
import {
  EMB_DATA,
  ROBOT_ORDER,
  RobotTransition,
} from './robotMorph';
import type { WidgetProps } from './registry';

export const HeroUnified: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const coreRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [manual, setManual] = useState(false);
  const kind = ROBOT_ORDER[idx];
  const e = EMB_DATA[kind];

  useResponsiveCanvas(
    coreRef,
    canvasRef,
    1,
    (ctx, w, h) => {
      fillBg(ctx, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.42;
      ctx.fillStyle = C.blue;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.stroke();
      const t = performance.now() * 0.0015;
      ctx.strokeStyle = C.blue;
      ctx.globalAlpha = 0.22 + 0.08 * Math.sin(t);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    [],
    { animate: true }
  );

  useEffect(() => {
    if (manual || prefersReducedMotion()) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % ROBOT_ORDER.length), 2200);
    return () => clearInterval(id);
  }, [manual]);

  const pick = (i: number) => {
    setManual(true);
    setIdx(i);
  };

  return (
    <div className="hero-panel-widget">
      <CanvasStage aspectW={460} aspectH={160}>
        <div className="hero-unified-stage">
          <div className="hus-prompt-strip">
            <span className="hus-strip-label">本体感知提示</span>
            <span className="hus-strip-val">
              {e.label} · {e.prompt}
            </span>
          </div>
          <div className="hus-row-main">
            <div className="hus-core-slot" ref={coreRef}>
              <div className="hus-core-graphic">
                <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} className="hus-core-canvas" />
                <div className="hus-core-label">Qwen-VLA</div>
              </div>
              <span className="hus-lock-tag">LOCKED</span>
            </div>
            <span className="hus-flow-arrow" aria-hidden="true">→</span>
            <div className="hus-robot-slot">
              <RobotTransition kind={kind} />
            </div>
            <span className="hus-flow-arrow" aria-hidden="true">→</span>
            <div className="hus-action-slot">
              <span className="hus-action-label">动作语义</span>
              <span className="hus-action-text">{e.sem}</span>
            </div>
          </div>
          <div className="hus-note">切换本体 / 控制配置 · 核心不变</div>
        </div>
      </CanvasStage>
      <div className="ps-controls-row hero-emb-ctrl">
        {ROBOT_ORDER.map((k, i) => (
          <PsChip key={k} selected={idx === i} onClick={() => pick(i)}>
            {EMB_DATA[k].label}
          </PsChip>
        ))}
      </div>
    </div>
  );
};
export default HeroUnified;

import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeOutCubic,
  lerpColor,
} from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawBall,
  drawCue,
  GUIDE,
  TEXT_MUTED,
} from './billiardsKit';

// §9 analogy card (560×140) — 擦拭球杆。
// 纯时间驱动的环境循环（3.2 s），没有任何控件与操作提示：
// 绒布沿杆身从杆尾擦到杆头，杆身由亚光变亮；随后绒布收起、杆身重新蒙灰，
// 无缝进入下一轮。球与球台始终不动。离屏时由 observeCanvas 暂停。

const W = 560;
const H = 140;
const BAND_TOP = 58;
const BAND_BOTTOM = 96;
const MID_Y = (BAND_TOP + BAND_BOTTOM) / 2;
const BUTT_X = 150;
const TIP_X = 430;
const CLOTH_W = 16;
const CLOTH_H = 26;
const LOOP_SECONDS = 3.2;
/** 0 → 0.62：绒布从杆尾擦到杆头 */
const WIPE_END = 0.62;
/** 0.62 → 0.80：绒布向右收起并淡出 */
const EXIT_END = 0.8;
/** 0.80 → 1：杆身重新蒙灰，回到循环起点 */

interface Scene {
  /** 环境循环相位 0→1 */
  phase: number;
  /** 高光微光相位 0→1 */
  shine: number;
}

export const Ana9: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<Scene>({ phase: 0, shine: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const renderScene = (c: CanvasRenderingContext2D, s: Scene) => {
      const u = clamp(s.phase, 0, 1);

      // 擦杆阶段：亚光只盖住还没擦到的一段；重新蒙灰阶段：整根一起变回亚光
      let brightEnd = BUTT_X;
      let brightness = 1;
      let matteFrom = BUTT_X;
      let matteTo = TIP_X;
      let matteAlpha = 0;
      let clothX = BUTT_X;
      let clothAlpha = 1;

      if (u < WIPE_END) {
        brightEnd = lerp(BUTT_X, TIP_X, easeOutCubic(clamp(u / WIPE_END, 0, 1)));
        matteFrom = brightEnd;
        matteTo = TIP_X;
        matteAlpha = 0.55;
        clothX = brightEnd;
      } else if (u < EXIT_END) {
        const p = (u - WIPE_END) / (EXIT_END - WIPE_END);
        brightEnd = TIP_X;
        matteAlpha = 0;
        clothX = lerp(TIP_X, TIP_X + 44, p);
        clothAlpha = 1 - p;
      } else {
        const p = (u - EXIT_END) / (1 - EXIT_END);
        brightEnd = TIP_X;
        brightness = 1 - p;
        matteFrom = BUTT_X;
        matteTo = TIP_X;
        matteAlpha = 0.55 * p;
        clothAlpha = 0;
      }

      clearScene(c, W, H);
      drawTable(c, W, H, {
        bandTop: BAND_TOP,
        bandBottom: BAND_BOTTOM,
        pockets: [W - 60],
      });

      // 球杆本体（已擦亮的颜色）
      drawCue(c, TIP_X, MID_Y, 0, TIP_X - BUTT_X, { tipColor: GUIDE, width: 7 });

      // 亚光覆盖（同一根杆，只是脏了）
      if (matteAlpha > 0.01 && matteTo - matteFrom > 1) {
        c.save();
        c.globalAlpha = clamp(matteAlpha, 0, 1);
        c.strokeStyle = '#dfe6ee';
        c.lineWidth = 7;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(matteFrom, MID_Y);
        c.lineTo(matteTo, MID_Y);
        c.stroke();
        c.restore();
      }

      // 擦过的地方有一道抛光高光（环境微光，不改变任何状态）
      if (brightEnd > BUTT_X + 4 && brightness > 0.02) {
        const shimmer = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(s.shine * Math.PI * 2));
        c.save();
        c.globalAlpha = clamp(shimmer * brightness, 0, 1);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(BUTT_X + 3, MID_Y - 2.5);
        c.lineTo(brightEnd - 3, MID_Y - 2.5);
        c.stroke();
        c.restore();
      }

      // 绒布本体
      if (clothAlpha > 0.02) {
        c.save();
        c.globalAlpha = clamp(clothAlpha, 0, 1);
        c.fillStyle = lerpColor(TEXT_MUTED, '#ffffff', 0.45);
        c.strokeStyle = TEXT_MUTED;
        c.lineWidth = 1.5;
        c.beginPath();
        c.rect(clothX - CLOTH_W / 2, MID_Y - CLOTH_H / 2, CLOTH_W, CLOTH_H);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(clothX - CLOTH_W / 2 + 3, MID_Y);
        c.lineTo(clothX + CLOTH_W / 2 - 3, MID_Y);
        c.stroke();
        c.restore();
      }

      // 母球与球台始终不动
      drawBall(c, 468, MID_Y, 10, GUIDE);
    };

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const s = stateRef.current;
      s.phase = (s.phase + dt / LOOP_SECONDS) % 1;
      s.shine = (s.shine + dt / 2.8) % 1;

      renderScene(ctx, s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        last = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default Ana9;

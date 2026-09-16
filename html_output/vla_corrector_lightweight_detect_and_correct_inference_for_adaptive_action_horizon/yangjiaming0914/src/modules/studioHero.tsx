import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawActionTokens,
  drawBowl,
  drawObject,
  drawRobotArm,
  drawText,
  drawWorkbench,
  easeInOutCubic,
  segmentProgress,
  useResponsiveCanvas,
  useTutorialRuntime,
} from './shared';

export function StudioHero({ chapterId, moduleId }: WidgetProps) {
  const adaptive = moduleId === 'new';
  const started = useRef(performance.now() / 1000);
  useTutorialRuntime(chapterId);
  const ref = useResponsiveCanvas((ctx, w, h, time) => {
    clearScene(ctx, w, h);
    drawWorkbench(ctx, w, h);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elapsed = Math.max(0, time - started.current);
    const phase = elapsed % 7.4;
    const linear = reduced ? 1 : phase < 5.2 ? phase / 5.2 : phase < 6.2 ? 1 : 1 - (phase - 6.2) / 1.2;
    const progress = easeInOutCubic(linear);
    const tableY = h * 0.77;
    const baseX = w * 0.13;
    const oldBowlX = w * 0.78;
    const movedBowlX = w * 0.66;
    const bowlY = tableY - 6;
    const bowlMove = segmentProgress(progress, 0.23, 0.39);
    const disturbed = bowlMove > 0.02;
    const targetX = oldBowlX + (movedBowlX - oldBowlX) * bowlMove;
    drawBowl(ctx, targetX, bowlY, w < 480 ? 0.72 : 0.86, COLORS.recovery);
    if (disturbed) {
      ctx.save(); ctx.globalAlpha = 0.12 + 0.22 * bowlMove; drawBowl(ctx, oldBowlX, bowlY, w < 480 ? 0.72 : 0.86, COLORS.anomaly); ctx.restore();
    }

    const reach = Math.min(1, progress / 0.88);
    const driftPhase = Math.max(0, (progress - 0.31) / 0.69);
    let x = w * 0.3 + (oldBowlX - w * 0.3) * reach;
    let y = tableY - 72 + 42 * reach;
    let armColor: string = COLORS.normal;
    if (adaptive && disturbed) {
      const corrected = segmentProgress(driftPhase, 0.32, 0.84);
      x -= (oldBowlX - movedBowlX) * corrected;
      y -= Math.sin(corrected * Math.PI) * 18;
      armColor = corrected > 0.84 ? COLORS.recovery : corrected > 0.02 ? COLORS.emphasis : COLORS.prediction;
      ctx.strokeStyle = COLORS.recovery; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w * 0.47, tableY - 56); ctx.quadraticCurveTo(w * 0.57, tableY - 100, movedBowlX, bowlY - 15); ctx.stroke();
    } else if (!adaptive && disturbed) {
      armColor = driftPhase > 0.42 ? COLORS.anomaly : COLORS.normal;
      ctx.strokeStyle = COLORS.anomaly; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(w * 0.45, tableY - 54); ctx.lineTo(oldBowlX, bowlY - 14); ctx.stroke(); ctx.setLineDash([]);
    }
    drawRobotArm(ctx, baseX, tableY, x, y, w < 480 ? 0.76 : 0.9, armColor);
    drawObject(ctx, x, y + 17, w < 480 ? 0.72 : 0.84, armColor === COLORS.anomaly ? COLORS.anomaly : COLORS.actual);

    const executed = Math.min(8, Math.floor(progress * 9));
    const truncated = adaptive && progress > 0.56 ? Math.max(executed, 5) : Infinity;
    drawActionTokens(ctx, w * 0.2, 25, 8, executed, truncated, Math.min(24, w * 0.065));
    if (adaptive && progress > 0.38 && progress < 0.78) {
      ctx.strokeStyle = COLORS.prediction; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y - 20, 10 + 8 * Math.sin(progress * Math.PI * 4) ** 2, 0, Math.PI * 2); ctx.stroke();
    }
    const label = !disturbed ? '正常执行' : adaptive ? progress < 0.56 ? '发现偏差' : progress < 0.78 ? 'OGG 纠正一次' : '恢复普通推理' : '继续旧动作';
    const tone = !disturbed ? COLORS.normal : adaptive ? progress > 0.78 ? COLORS.recovery : progress > 0.56 ? COLORS.emphasis : COLORS.prediction : COLORS.anomaly;
    drawText(ctx, label, w - 16, 25, tone, w < 480 ? 11 : 13, 'right');
  }, [adaptive], { animate: true, mobileHeight: 184, desktopRatio: 0.4, minDesktopHeight: 174, maxDesktopHeight: 210 });

  return <canvas ref={ref} className="v2-canvas studio-hero-canvas" aria-label={adaptive ? '机械臂检测目标碗移动、截断旧动作并恢复' : '固定动作时域机械臂继续朝目标碗旧位置移动'} />;
}

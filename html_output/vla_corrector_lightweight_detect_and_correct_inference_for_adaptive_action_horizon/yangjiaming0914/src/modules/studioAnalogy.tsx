import React from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  animationCycle,
  clearScene,
  drawActionTokens,
  drawBowl,
  drawCamera,
  drawObject,
  drawRobotArm,
  drawText,
  drawWorkbench,
  useResponsiveCanvas,
  useTutorialRuntime,
} from './shared';

/** One robot-placement journey; each chapter changes the arm's single visible action. */
export function StudioAnalogy({ chapterId }: WidgetProps) {
  const chapter = Number(chapterId.replace('chap-', '')) || 1;
  useTutorialRuntime(chapterId);
  const ref = useResponsiveCanvas((ctx, w, h, time) => {
    clearScene(ctx, w, h);
    drawWorkbench(ctx, w, h);
    const p = animationCycle(time + chapter * 0.13, 3.2, 1.05);
    const compact = w < 520;
    const tableY = h * 0.77;
    const baseX = w * 0.12;
    const bowlX = w * 0.78;
    const bowlScale = compact ? 0.64 : 0.78;
    drawBowl(ctx, bowlX, tableY - 4, bowlScale, COLORS.recovery);

    let x = w * 0.29 + (bowlX - w * 0.29) * p;
    let y = tableY - 63 + 35 * p;
    let color: string = COLORS.normal;
    let label = '连续执行';
    let labelX = w - 14;
    let labelY = 22;
    let labelAlign: CanvasTextAlign = 'right';

    if (chapter === 1) {
      const oldX = w * 0.67;
      ctx.save(); ctx.globalAlpha = 0.34; drawBowl(ctx, oldX, tableY - 4, bowlScale, COLORS.anomaly); ctx.restore();
      x = w * 0.29 + (oldX - w * 0.29) * p;
      color = p > 0.66 ? COLORS.anomaly : COLORS.normal;
      label = '旧计划未变';
    } else if (chapter === 2) {
      const stop = Math.min(p, 0.62);
      x = w * 0.29 + (bowlX - w * 0.29) * stop;
      y = tableY - 63 + 35 * stop;
      drawActionTokens(ctx, w * 0.25, 24, 8, Math.round(stop * 8), Infinity, Math.min(25, w * 0.07));
      // The token strip itself shows the executed prefix. The long state label used
      // to overlap it at narrow analogy-card widths, so Chapter 2 leaves that copy
      // to the adjacent explanation instead of drawing it over the scene.
      label = '';
    } else if (chapter === 3) {
      drawCamera(ctx, w * 0.77, 31, compact ? 0.45 : 0.55, COLORS.prediction);
      ctx.save();
      ctx.strokeStyle = `${COLORS.prediction}55`; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(w * 0.74, 47); ctx.lineTo(x, y - 8); ctx.stroke();
      ctx.restore();
      color = COLORS.prediction;
      label = '相机记录前后变化';
    } else if (chapter === 4) {
      const drift = p > 0.45 ? Math.sin((p - 0.45) * Math.PI) * 34 : 0;
      y -= drift;
      color = drift > 10 ? COLORS.anomaly : COLORS.normal;
      ctx.strokeStyle = COLORS.prediction; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y - 21, 10 + 7 * Math.sin(time * 3) ** 2, 0, Math.PI * 2); ctx.stroke();
      label = drift > 10 ? '持续偏差' : 'LVM 监控';
    } else if (chapter === 5) {
      y -= Math.sin(p * Math.PI) * 22;
      color = p < 0.5 ? COLORS.emphasis : COLORS.recovery;
      ctx.strokeStyle = COLORS.recovery; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(w * 0.3, tableY - 60); ctx.quadraticCurveTo(w * 0.56, tableY - 116, bowlX, tableY - 18); ctx.stroke();
      label = p < 0.82 ? '一次 OGG' : 'OGG 已关闭';
    } else if (chapter === 6) {
      const detour = Math.sin(p * Math.PI) * 26;
      y -= detour;
      color = p < 0.38 ? COLORS.normal : p < 0.72 ? COLORS.emphasis : COLORS.recovery;
      label = p < 0.38 ? '正常执行' : p < 0.72 ? '截断并纠正' : '恢复';
    } else {
      color = p > 0.84 ? COLORS.recovery : COLORS.normal;
      label = p > 0.84 ? '放置完成' : '评估任务';
    }

    drawRobotArm(ctx, baseX, tableY, x, y, compact ? 0.73 : 0.82, color);
    drawObject(ctx, x, y + 17, compact ? 0.66 : 0.78, COLORS.actual);
    if (label) drawText(ctx, label, labelX, labelY, color, compact ? 10 : 12, labelAlign);
  }, [chapter], { animate: true, mobileHeight: 170, desktopRatio: 0.25, minDesktopHeight: 150, maxDesktopHeight: 170 });

  return <canvas ref={ref} className="v2-canvas v2-analogy-canvas" aria-label={`第${chapter}章机械臂放置任务动画`} />;
}

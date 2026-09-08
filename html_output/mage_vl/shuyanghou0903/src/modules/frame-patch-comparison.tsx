import React from 'react';
import type { WidgetProps } from './registry';
import { MATCH_BEATS, drawLabSurface, sampleMatch } from './match-story';
import { LabPlayback } from './lab-controls';
import { useAutoplayOnce } from './use-autoplay-once';
import {
  MVL,
  drawCommentator,
  drawHeatCells,
  drawPitch,
  drawSceneLabel,
  useCanvasSurface,
} from './football-analogy';

const FRAME_SAMPLES = new Set([0, 2, 5, 7]);

function drawMoment(ctx: CanvasRenderingContext2D, pitch: { x: number; y: number; width: number; height: number }, beatIndex: number, sparse: boolean) {
  const beat = MATCH_BEATS[beatIndex];
  drawPitch(ctx, pitch.x, pitch.y, pitch.width, pitch.height, true);
  drawCommentator(ctx, pitch.x + beat.runner.x * pitch.width, pitch.y + beat.runner.y * pitch.height, 'scan', .6);
  ctx.fillStyle = MVL.white; ctx.strokeStyle = MVL.ink; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(pitch.x + beat.ball.x * pitch.width, pitch.y + beat.ball.y * pitch.height, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (sparse) drawHeatCells(ctx, beat.importance, pitch, '34,141,92');
}

export const FramePatchComparison: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(6200);
  const story = sampleMatch(autoplay.progress);
  const rawIndex = story.beatIndex;
  const lastFrameSample = [...FRAME_SAMPLES].filter((index) => index <= rawIndex).pop() ?? 0;
  const frameMissesCurrent = !FRAME_SAMPLES.has(rawIndex) && rawIndex >= 3 && rawIndex <= 4;

  const ref = useCanvasSurface(820, 390, (ctx) => {
    drawLabSurface(ctx, 820, 390);
    drawSceneLabel(ctx, '同一名义视觉容量', 328, 30, MVL.blue);
    drawSceneLabel(ctx, 'Frame-level · 每个采样帧完整编码', 34, 58, MVL.red);
    drawSceneLabel(ctx, 'Patch-level · 变化区域优先', 448, 58, MVL.green);
    const left = { x: 26, y: 82, width: 364, height: 214 };
    const right = { x: 430, y: 82, width: 364, height: 214 };
    drawMoment(ctx, left, lastFrameSample, false);
    drawMoment(ctx, right, rawIndex, true);

    if (frameMissesCurrent) {
      ctx.fillStyle = 'rgba(196,63,82,.30)'; ctx.fillRect(left.x, left.y, left.width, left.height);
      drawSceneLabel(ctx, '采样间隔：当前时刻未进入模型', 82, 196, MVL.red);
    }

    ctx.strokeStyle = MVL.line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(54, 337); ctx.lineTo(766, 337); ctx.stroke();
    MATCH_BEATS.forEach((beat, index) => {
      const x = 54 + index * (712 / 7);
      const active = index === rawIndex;
      ctx.fillStyle = active ? MVL.blue : MVL.line;
      ctx.beginPath(); ctx.arc(x, 337, active ? 7 : 4, 0, Math.PI * 2); ctx.fill();
      if (FRAME_SAMPLES.has(index)) {
        ctx.strokeStyle = MVL.red; ctx.lineWidth = 2; ctx.strokeRect(x - 7, 321, 14, 32);
      }
      ctx.fillStyle = MVL.muted; ctx.font = '10px "Segoe UI"'; ctx.textAlign = 'center';
      ctx.fillText(`${index + 1}`, x, 370);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = MVL.red; ctx.fillRect(36, 318, 10, 10); ctx.fillStyle = MVL.muted; ctx.font = '11px "Segoe UI"';
    ctx.fillText('Frame-level 取样时刻', 51, 327);
  }, [rawIndex, lastFrameSample, frameMissesCurrent]);

  return (
    <div className="mvl-widget mvl-lab" ref={autoplay.hostRef}>
      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas"
          width={820}
          height={390}
          role="img"
          aria-label={`同步比较第 ${rawIndex + 1} 个时刻；Frame-level 显示第 ${lastFrameSample + 1} 个采样时刻，Patch-level 显示当前变化区域`}
        >同一名义视觉容量下，整帧采样与 patch-level 稀疏选择的时间覆盖对比。</canvas>
      </div>
      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label={`事件时间轴 · ${story.beat.label}`}
        onToggle={autoplay.toggle}
        onReplay={autoplay.replay}
        onScrub={autoplay.setProgress}
      />
      <div className={`mvl-lab-narration ${frameMissesCurrent ? 'warn' : ''}`} aria-live="polite">
        <b>{frameMissesCurrent ? '当前时刻落在整帧采样间隔内' : '两条路线正在读取同一事件'}</b>
        <span>Patch selection 不会恢复未读取的画面；它通过稀疏编码，把同一名义容量分配给更多实际读取的时刻与局部变化。</span>
      </div>
    </div>
  );
};

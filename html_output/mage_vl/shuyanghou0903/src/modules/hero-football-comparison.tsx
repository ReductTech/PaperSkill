import React from 'react';
import type { WidgetProps } from './registry';
import { sampleMatch } from './match-story';
import {
  MVL,
  clearPitchScene,
  drawCommentator,
  drawFocusCone,
  drawMic,
  drawPitch,
  drawTargetMarker,
  roundRect,
  useCanvasSurface,
} from './football-analogy';

function drawHeroLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tone: string,
  compact = false,
) {
  ctx.save();
  const fontSize = compact ? 10 : 12;
  const paddingX = compact ? 6 : 8;
  const height = compact ? 18 : 21;
  ctx.font = `${compact ? 600 : 700} ${fontSize}px "Segoe UI", sans-serif`;
  const width = ctx.measureText(text).width + paddingX * 2;
  roundRect(ctx, x, y - height + 5, width, height, 6);
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.fill();
  ctx.fillStyle = tone;
  ctx.fillText(text, x + paddingX, y);
  ctx.restore();
}

export const HeroFootballComparison: React.FC<WidgetProps> = ({ moduleId }) => {
  const old = moduleId === 'old';
  const ref = useCanvasSurface(360, 220, (ctx, seconds) => {
    const phase = (seconds % 6.4) / 6.4;
    const story = sampleMatch(phase * .82);
    const pitch = { x: 28, y: 35, width: 304, height: 126 };
    const ballX = pitch.x + story.ball.x * pitch.width;
    const ballY = pitch.y + story.ball.y * pitch.height;
    const runnerX = pitch.x + story.runner.x * pitch.width;
    const runnerY = pitch.y + story.runner.y * pitch.height;

    clearPitchScene(ctx, 360, 220);
    drawPitch(ctx, pitch.x, pitch.y, pitch.width, pitch.height, true);
    drawCommentator(ctx, 44, 175, old ? 'scan' : 'focus', 1.05);
    drawCommentator(ctx, runnerX, runnerY, 'scan', .5);
    ctx.fillStyle = MVL.white;
    ctx.strokeStyle = MVL.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(ballX, ballY, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    if (old) {
      const scanX = pitch.x + 22 + phase * (pitch.width - 44);
      drawFocusCone(ctx, 53, 142, scanX, 48, 43);
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 8; column += 1) {
          drawTargetMarker(ctx, 36 + column * 37, 44 + row * 27, 30, 22, 'discarded');
        }
      }
      drawHeroLabel(ctx, '均匀采帧 · Dense Encoding', 126, 198, MVL.red);
    } else {
      drawFocusCone(ctx, 55, 140, ballX, Math.max(50, ballY - 28), 20);
      const cellWidth = pitch.width / 16;
      const cellHeight = pitch.height / 16;
      story.beat.importance.forEach(([column, row, level], index) => {
        if (phase < .12 + index * .035) return;
        ctx.fillStyle = `rgba(34,141,92,${level === 3 ? .55 : level === 2 ? .34 : .18})`;
        ctx.fillRect(pitch.x + column * cellWidth, pitch.y + row * cellHeight, cellWidth, cellHeight);
      });
      ctx.save();
      ctx.strokeStyle = MVL.green;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(Math.max(pitch.x + 18, ballX - 46), ballY);
      ctx.lineTo(ballX - 8, ballY);
      ctx.stroke();
      ctx.restore();
      drawMic(ctx, 57, 151, false);
      drawHeroLabel(ctx, 'Codec-Native Patch Selection', 116, 56, MVL.green);
      drawHeroLabel(ctx, 'Cognition Gate · SILENT', 216, 208, MVL.purple, true);
    }
  }, [old], true);

  const label = old
    ? '传统 Video VLM：均匀采样若干帧，并对每个采样帧进行稠密编码'
    : 'Mage-VL：Codec-Native Patch Selection 决定看哪里，Cognition Gate 当前保持 SILENT';

  return <canvas ref={ref} width={360} height={220} role="img" aria-label={label}>{label}</canvas>;
};

import { useState } from 'react';
import { C, SceneCanvas, Chips, Feedback, clearScene, drawSceneLabel } from './kit-anchor';

function insect(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = color;
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(side * 24, -7, 32, 21, side * .45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(side * 20, 22, 23, 18, -side * .35, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(0, 8, 5, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

export function Zoom1() {
  const [mode, setMode] = useState(0);
  const names = ['纹理相近', '小目标', '遮挡'];
  const feedback = [
    '颜色和纹理都很像：仅凭局部外观容易把目标混入背景。输出仍应是逐像素掩膜。',
    '目标缩小后，可见细节更少。小目标是任务难点，不能据此推断某个模型必然失败。',
    '遮挡让可见轮廓不完整。图中掩膜只标出示意的可见目标，不替模型猜测隐藏部分。',
  ];
  return <>
    <SceneCanvas role="img" aria-label={`${names[mode]}：左侧输入示意，右侧可见目标的二值掩膜`} draw={ctx => {
      clearScene(ctx, 1080, 280);
      ctx.lineWidth = 2;
      for (const x of [30, 565]) {
        ctx.fillStyle = x === 30 ? '#edf2e6' : '#e3e8ed';
        ctx.beginPath(); ctx.roundRect(x, 48, 485, 208, 18); ctx.fill();
      }
      ctx.save(); ctx.translate(274, 150); ctx.rotate(-.28);
      ctx.fillStyle = C.light; ctx.beginPath(); ctx.moveTo(-158, 0);
      ctx.bezierCurveTo(-60, -118, 83, -112, 165, 0); ctx.bezierCurveTo(72, 110, -65, 111, -158, 0); ctx.fill();
      ctx.strokeStyle = C.dark; ctx.beginPath(); ctx.moveTo(-140, 0); ctx.lineTo(147, 0);
      for (let x = -100; x <= 110; x += 42) { ctx.moveTo(x, 0); ctx.lineTo(x + 22, -48); ctx.moveTo(x, 0); ctx.lineTo(x + 20, 48); }
      ctx.stroke(); ctx.restore();
      const size = mode === 1 ? .48 : 1;
      ctx.save(); ctx.globalAlpha = mode === 0 ? .35 : .8; insect(ctx, 280, 142, size, C.dark); ctx.restore();
      insect(ctx, 815, 142, size, C.text);
      if (mode === 2) {
        ctx.save(); ctx.translate(303, 168); ctx.rotate(-.2); ctx.fillStyle = C.light; ctx.fillRect(-15, -4, 135, 34); ctx.strokeStyle = C.dark; ctx.beginPath(); ctx.moveTo(-15, 11); ctx.lineTo(120, 11); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(838, 168); ctx.rotate(-.2); ctx.fillStyle = '#e3e8ed'; ctx.fillRect(-15, -4, 135, 34); ctx.restore();
      }
      drawSceneLabel(ctx, '输入示意', 205, 31);
      drawSceneLabel(ctx, '目标掩膜', 742, 31);
    }} />
    <Chips options={names} value={mode} onChange={setMode} />
    <Feedback tone="neutral">{feedback[mode]}</Feedback>
  </>;
}

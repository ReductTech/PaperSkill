import { useRef, useState, type PointerEvent } from 'react';
import { C, SceneCanvas, Chips, Feedback, clearScene, drawLeaf, drawLens } from './kit-anchor';

export function Zoom2() {
  const [scaleIndex, setScaleIndex] = useState(1);
  const dragging = useRef(false);
  const sizes = [192, 384, 576];
  const scales = [.5, 1, 1.5];
  const chooseAt = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * 1080 / bounds.width;
    setScaleIndex(Math.max(0, Math.min(2, Math.round((x - 100) / 440))));
  };
  const stop = (event: PointerEvent<HTMLCanvasElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const descriptions = [
    '192 × 192 的整图输入提供更粗的采样表达；没有裁掉任何区域，也没有扩大原图的视野。',
    '384 × 384 是论文主尺度。三条分支共享编码器参数，输出各自的五级特征。',
    '576 × 576 的整图输入提供另一种细节表达；三次计算仍然存在，共享权重不代表计算免费。',
  ];
  return <>
    <SceneCanvas role="img" aria-label={`当前选择 ${scales[scaleIndex]} 倍，${sizes[scaleIndex]} 乘 ${sizes[scaleIndex]}；拖动下方镜头或使用等效按钮选择尺度`}
      style={{ touchAction: 'pan-y', cursor: 'ew-resize' }}
      onPointerDown={event => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); chooseAt(event); }}
      onPointerMove={event => { if (dragging.current) chooseAt(event); }}
      onPointerUp={stop} onPointerCancel={stop}
      draw={ctx => {
        clearScene(ctx, 1080, 280);
        [230, 540, 850].forEach((center, index) => {
          const frameSize = [96, 144, 180][index];
          const top = 116 - frameSize / 2;
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = scaleIndex === index ? C.orange : C.border;
          ctx.lineWidth = scaleIndex === index ? 3 : 2;
          ctx.beginPath(); ctx.roundRect(center - frameSize / 2, top, frameSize, frameSize, 10); ctx.fill(); ctx.stroke();
          drawLeaf(ctx, center, 116, frameSize / 260);
          ctx.save(); ctx.globalAlpha = .18; ctx.strokeStyle = C.blue; ctx.lineWidth = .7;
          const count = [4, 8, 12][index];
          for (let n = 1; n < count; n++) {
            const offset = n * frameSize / count;
            ctx.beginPath(); ctx.moveTo(center - frameSize / 2 + offset, top + 5); ctx.lineTo(center - frameSize / 2 + offset, top + frameSize - 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(center - frameSize / 2 + 5, top + offset); ctx.lineTo(center + frameSize / 2 - 5, top + offset); ctx.stroke();
          }
          ctx.restore();
        });
        ctx.strokeStyle = C.border; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(100, 242); ctx.lineTo(980, 242); ctx.stroke();
        for (const x of [100, 540, 980]) { ctx.strokeStyle = C.dark; ctx.beginPath(); ctx.moveTo(x, 233); ctx.lineTo(x, 251); ctx.stroke(); }
        drawLens(ctx, 100 + scaleIndex * 440, 240, 16, C.orange);
      }} />
    <Chips options={['缩小 0.5×', '原图 1×', '放大 1.5×']} value={scaleIndex} onChange={setScaleIndex} />
    <div className="ctrl" aria-live="polite">
      <strong>当前输入：{sizes[scaleIndex]} × {sizes[scaleIndex]}</strong>
      <span>主尺度：384 × 384</span><span>共享表示：5 个层级，每级 64 通道</span>
    </div>
    <Feedback tone={scaleIndex === 1 ? 'good' : 'neutral'}>{descriptions[scaleIndex]}</Feedback>
  </>;
}

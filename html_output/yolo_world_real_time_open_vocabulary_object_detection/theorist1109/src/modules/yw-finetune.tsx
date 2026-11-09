import React, { useEffect, useRef, useState } from 'react';
import { blue, drawBloom, drawMarket, drawPot, drawRing, green, orange, paint, red } from './flowerKit';

export const YwFinetune: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [allModules, setAllModules] = useState(false);
  const w = 900;
  const h = 622;
  const maskAp = allModules ? 28.7 : 19.1;
  const boxApr = allModules ? 17.4 : 18.0;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, 'crate');
    drawPot(ctx, 460, 450, 1.05);
    drawBloom(ctx, 460, 392, 'pitcher', 1.05, allModules ? 0.35 : 0.9, allModules ? 0.12 : 0);
    ctx.save();
    ctx.strokeStyle = allModules ? green : orange;
    ctx.lineWidth = allModules ? 6 : 3;
    ctx.setLineDash(allModules ? [] : [8, 8]);
    ctx.beginPath();
    ctx.ellipse(460, 360, allModules ? 54 : 78, allModules ? 70 : 96, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawRing(ctx, 460, 430, allModules ? orange : green, 1.05);
    ctx.fillStyle = '#21324a';
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(allModules ? '掩码贴紧，稀有框稍弱' : '只练轮廓，稀有框还在', 220, 86);
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#68778f';
    ctx.fillText('表 8 · LVIS-base 掩码微调', 280, 126);
  }, [allModules]);

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">掩码贴合，还是保住稀有框</h3>
      <p className="yw-p">YOLO-World-L 在 LVIS-base 上微调。实线是掩码，圆圈是框。只看表 8 的两个数一起变。</p>
      <div className="yw-row">
        <button className={!allModules ? 'yw-btn is-good' : 'yw-btn'} onClick={() => setAllModules(false)}>只微调分割头</button>
        <button className={allModules ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setAllModules(true)}>微调整个模型</button>
      </div>
      <p className="yw-em" style={{ color: allModules ? blue : green }}>{maskAp.toFixed(1)}</p>
      <p className="yw-note" style={{ color: allModules ? red : green }}>
        {allModules
          ? `掩码 AP 升到 28.7，框的稀有类 AP 降到 17.4。论文记下大模型约 9.6 的掩码提升，以及 0.6 的框稀有类下降。若要留住预训练的框，就回到只微调分割头。`
          : `掩码 AP ${maskAp.toFixed(1)}，框的稀有类 AP ${boxApr.toFixed(1)}。检测器保持预训练时的零样本能力，轮廓学得粗一些。`}
      </p>
    </div>
  </div>;
};

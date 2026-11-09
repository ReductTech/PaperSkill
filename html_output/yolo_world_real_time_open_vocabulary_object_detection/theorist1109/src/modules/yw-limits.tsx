import React, { useEffect, useRef, useState } from 'react';
import { blue, drawBloom, drawBook, drawMarket, drawPot, drawRing, drawTag, green, orange, paint, red } from './flowerKit';

type Mode = 'clip' | 'flood' | 'stale';

export const YwLimits: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('clip');
  const [flooded, setFlooded] = useState(false);
  const [changed, setChanged] = useState(false);
  const w = 900;
  const h = 622;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, mode === 'flood' ? 'crate' : mode === 'stale' ? 'pack' : 'scale');
    if (mode === 'clip') {
      drawBook(ctx, 160, 180, 0.9, 'CLIP 被微调');
      drawPot(ctx, 560, 450, 1);
      drawBloom(ctx, 560, 396, 'pitcher', 1, 0.15, 0.55);
      drawTag(ctx, 560, 250, '稀有类 8.6', red);
      ctx.fillStyle = '#21324a';
      ctx.font = '700 28px "Microsoft YaHei", sans-serif';
      ctx.fillText('365 个常见类把词典拽偏', 250, 90);
    } else if (mode === 'flood') {
      for (let i = 0; i < (flooded ? 6 : 3); i += 1) {
        ctx.fillStyle = flooded ? '#e7d3a1' : '#d7c4a3';
        ctx.fillRect(80 + (i % 3) * 150, 300 + Math.floor(i / 3) * 90, 120, 40);
        drawPot(ctx, 140 + (i % 3) * 150, 280 + Math.floor(i / 3) * 90, 0.4);
      }
      drawPot(ctx, 700, 450, 0.9);
      drawBloom(ctx, 700, 404, 'pitcher', 0.85, flooded ? 0.45 : 0.2, flooded ? 0.05 : 0.2);
      drawTag(ctx, 700, 250, flooded ? '总体 18.2' : '总体 19.2', flooded ? red : green);
    } else {
      drawBook(ctx, 150, 170, changed ? 0.05 : 1, changed ? '编码器已合上' : '可以重编码');
      drawPot(ctx, 560, 450, 1);
      drawBloom(ctx, 560, 396, 'pitcher', 1, changed ? 0 : 0.9, 0);
      if (changed) drawRing(ctx, 560, 430, red, 1);
      else drawRing(ctx, 560, 430, green, 1);
      drawTag(ctx, 560, 240, changed ? '新说法对不上旧权重' : '猪笼草', changed ? red : green);
    }
  }, [changed, flooded, mode]);

  const note = mode === 'clip'
    ? '表 5：冻结 CLIP 是 22.4 AP、稀有类 14.5；在 Objects365 上微调后变成 19.3 和 8.6。论文把下降归因于这 365 类太窄。修复办法是保持文本编码器冻结，这正是默认预训练的做法。'
    : mode === 'flood'
      ? (flooded
        ? '表 9 的 YOLO-World-S：CC3M 加到 75 万时总体 AP 18.2，稀有类 11.2。比 52 万张时的 19.2 更低。伪标注阈值是经验值，且没有人工复核。'
        : '同一张表里，52 万张 CC3M 时总体 AP 是 19.2、稀有类 10.7。再往上加，小模型的总体精度会回落。')
      : (changed
        ? '离线词表已经写进 RepVL-PAN。顾客改口之后，旧权重对不上新说法。按下重新编码，才回到可以检测的状态。'
        : '提示先编码，再重参数化。只要说法不变，新图片不必再跑文本编码器。');

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">三种情况下会失手</h3>
      <p className="yw-p">每一种失手都对应论文里的条件。前两种用表中的数，第三种演示部署后改提示必须重编码。</p>
      <div className="yw-row">
        <button className={mode === 'clip' ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setMode('clip')}>微调 CLIP</button>
        <button className={mode === 'flood' ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setMode('flood')}>伪标注过多</button>
        <button className={mode === 'stale' ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setMode('stale')}>部署后改口</button>
      </div>
      {mode === 'flood' && <div className="yw-row">
        <button className={!flooded ? 'yw-btn is-good' : 'yw-btn'} onClick={() => setFlooded(false)}>52 万张</button>
        <button className={flooded ? 'yw-btn is-bad' : 'yw-btn'} onClick={() => setFlooded(true)}>加到 75 万</button>
      </div>}
      {mode === 'stale' && <div className="yw-row">
        <button className="yw-btn is-bad" onClick={() => setChanged(true)}>改口令</button>
        <button className="yw-btn is-good" onClick={() => setChanged(false)}>重新编码</button>
      </div>}
      <p className="yw-note" style={{ color: mode === 'stale' && !changed ? green : (mode === 'flood' && !flooded ? blue : red) }}>{note}</p>
    </div>
  </div>;
};

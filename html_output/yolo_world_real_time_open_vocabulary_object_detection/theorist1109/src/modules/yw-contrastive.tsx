import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { Bloom, blooms, blue, dot, drawBloom, drawMarket, drawPot, green, localPoint, orange, paint, phrases, red, softmax } from './flowerKit';

const order: Bloom[] = ['rose', 'fern', 'sun', 'pitcher'];

export const YwContrastive: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [positive, setPositive] = useState<Bloom>('rose');
  const [fromImageText, setFromImageText] = useState(false);
  const [overlap, setOverlap] = useState(0.45);
  const w = 900;
  const h = 622;
  const dragging = useRef(false);
  const spots = [220, 420, 620, 800].map((x, i) => ({ x, kind: order[i], y: 390 }));
  const vocab = order.map((kind) => blooms[kind].name);
  const scores = useMemo(() => vocab.map((name) => dot(blooms[positive].vec, phrases[name])), [positive, vocab]);
  const probs = softmax(scores);
  const lcon = -Math.log(Math.max(probs[order.indexOf(positive)], 1e-6));
  const lbox = 1 - overlap;
  const lambda = fromImageText ? 0 : 1;
  const total = lcon + lambda * lbox;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h);
    const spot = spots[order.indexOf(positive)];
    spots.forEach((item) => {
      drawPot(ctx, item.x, item.y, 0.82);
      drawBloom(ctx, item.x, item.y - 44, item.kind, 0.74, item.kind === positive ? 0.8 : 0.05, 0);
    });
    const boxW = 150;
    const boxH = 170;
    const boxX = spot.x - boxW / 2 + (1 - overlap) * 70;
    const boxY = spot.y - 120;
    ctx.strokeStyle = lambda === 1 ? orange : blue;
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = '#21324a';
    ctx.font = '700 26px "Microsoft YaHei", sans-serif';
    ctx.fillText('拖动预测框', boxX, boxY - 12);
    ctx.fillText(fromImageText ? '图文数据：框的损失关掉' : '检测数据：框越准，总损失越低', 36, 78);
    ctx.fillStyle = orange;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('演示代理损失，非论文数值', 36, 118);
    ctx.fillStyle = '#68778f';
    ctx.font = '700 20px "Microsoft YaHei", sans-serif';
    ctx.fillText('论文框项 = IoU + DFL；此处用 1−重叠', 36, 148);
  }, [fromImageText, lambda, overlap, positive, spots]);

  const setFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const point = localPoint(canvas, event.clientX, event.clientY, w, h);
    const spot = spots[order.indexOf(positive)];
    const gap = Math.min(120, Math.abs(point.x - spot.x));
    setOverlap(Math.max(0.2, Math.min(0.98, 1 - gap / 140)));
  };

  return <div className="yw-split">
    <canvas
      ref={ref}
      style={{ width: w, height: h, display: 'block', touchAction: 'none' }}
      onPointerDown={(event) => { dragging.current = true; setFromPointer(event); }}
      onPointerMove={(event) => { if (dragging.current) setFromPointer(event); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerLeave={() => { dragging.current = false; }}
    />
    <div className="yw-side">
      <h3 className="yw-h">对比损失什么时候管框</h3>
      <p className="yw-formula">
        <SymbolHint meaning="L：一张图上的总训练损失。">L</SymbolHint>
        {' = '}
        <SymbolHint meaning="Lcon：区域-文本对比损失，由相似度对正确名词做交叉熵。">Lcon</SymbolHint>
        {' + '}
        <SymbolHint meaning="λI：检测或定位数据为 1，图文数据为 0。">λ</SymbolHint>
        {' · '}
        <SymbolHint meaning="框回归项。论文使用 IoU 损失和 distributed focal loss。这里用 1 减重叠做演示。">Lbox</SymbolHint>
      </p>
      <div className="yw-row">
        {order.map((kind) => <button key={kind} className={positive === kind ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setPositive(kind)}>{blooms[kind].name}</button>)}
      </div>
      <div className="yw-row">
        <button className={!fromImageText ? 'yw-btn is-good' : 'yw-btn'} onClick={() => setFromImageText(false)}>检测 / 定位</button>
        <button className={fromImageText ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setFromImageText(true)}>图文伪框</button>
      </div>
      <p className="yw-em">{total.toFixed(2)}</p>
      <p className="yw-note" style={{ color: lambda === 0 ? blue : (overlap > 0.8 ? green : red) }}>
        {lambda === 0
          ? `λ = 0，总损失只剩对比项 ${lcon.toFixed(2)}。拖框不会改变它，因为图文伪框太吵，论文不在这些样本上算框回归。`
          : `λ = 1，对比项 ${lcon.toFixed(2)}，框项 ${lbox.toFixed(2)}。把框拖近这盆花，总损失下降。画面上的代理损失不是论文测得值。`}
      </p>
    </div>
  </div>;
};

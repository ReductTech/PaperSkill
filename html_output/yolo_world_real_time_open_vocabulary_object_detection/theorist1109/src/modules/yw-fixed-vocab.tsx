import React, { useEffect, useRef, useState } from 'react';
import { Bloom, blooms, drawBloom, drawCard, drawMarket, drawPot, drawRing, drawTag, drawVendor, green, localPoint, paint, red } from './flowerKit';

const order: Bloom[] = ['rose', 'fern', 'sun', 'pitcher'];
const card = new Set(['玫瑰', '蕨', '向日葵']);
const described: Record<Bloom, string> = {
  rose: '红瓣带刺',
  fern: '细长叶子',
  sun: '黄瓣圆盘',
  pitcher: '管状捕虫叶',
};

export const YwFixedVocab: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [picked, setPicked] = useState<Bloom>('rose');
  const [mode, setMode] = useState<'name' | 'phrase'>('name');
  const said = mode === 'name' ? blooms[picked].name : described[picked];
  const hit = card.has(said);
  const w = 900;
  const h = 622;
  const spots = [190, 370, 550, 740].map((x, i) => ({ x, kind: order[i], y: 430 }));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h);
    drawVendor(ctx, 92, 470);
    drawCard(ctx, 24, 70, ['印刷词表', '玫瑰', '蕨', '向日葵']);
    spots.forEach((spot) => {
      const active = spot.kind === picked;
      if (active) drawRing(ctx, spot.x, spot.y - 18, hit ? green : red, 1);
      drawPot(ctx, spot.x, spot.y, 1);
      drawBloom(ctx, spot.x, spot.y - 48, spot.kind, 0.92, 0, active && !hit ? 0.35 : 0);
    });
    drawTag(ctx, spots[order.indexOf(picked)].x, 250, said, hit ? green : red);
    ctx.fillStyle = '#21324a';
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(hit ? '印在卡片上，圈得中' : '这句话不在卡片上', 220, 92);
  }, [picked, mode, hit, said]);

  const onPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const point = localPoint(canvas, event.clientX, event.clientY, w, h);
    const found = spots.find((spot) => Math.hypot(point.x - spot.x, point.y - spot.y) < 70);
    if (found) setPicked(found.kind);
  };

  return <div className="yw-split">
    <canvas ref={ref} width={w} height={h} style={{ width: w, height: h, display: 'block' }} onPointerDown={onPointer} />
    <div className="yw-side">
      <h3 className="yw-h">顾客指着哪一盆</h3>
      <p className="yw-p">固定词表只认得训练时印好的类名。点花盆，再决定顾客是报类名，还是改用外形说法。</p>
      <div className="yw-row">
        {order.map((kind) => <button key={kind} className={picked === kind ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setPicked(kind)}>{blooms[kind].name}</button>)}
      </div>
      <div className="yw-row">
        <button className={mode === 'name' ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setMode('name')}>只报类名</button>
        <button className={mode === 'phrase' ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setMode('phrase')}>改说外形</button>
      </div>
      <p className={hit ? 'yw-note' : 'yw-note'} style={{ color: hit ? green : red }}>
        {hit
          ? `「${said}」就在印刷词表里，这一盆被圈中。论文里的例子是 COCO 的 80 类，这里用三张卡片演示同一限制。`
          : `「${said}」没有印在卡片上。即便它指的就是眼前这盆花，固定词表检测器也不会输出这个说法。`}
      </p>
    </div>
  </div>;
};

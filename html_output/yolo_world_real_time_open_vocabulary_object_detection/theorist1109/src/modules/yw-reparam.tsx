import React, { useEffect, useRef, useState } from 'react';
import { blue, drawBloom, drawBook, drawMarket, drawPot, drawRing, drawSeal, drawTag, green, paint, red } from './flowerKit';

const options = ['玫瑰', '猪笼草', '黄瓣高茎'];

export const YwReparam: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string[]>(['玫瑰', '猪笼草']);
  const [baked, setBaked] = useState<string[] | null>(null);
  const [passes, setPasses] = useState(0);
  const [seen, setSeen] = useState(0);
  const [seal, setSeal] = useState(0);
  const w = 900;
  const h = 622;
  const stale = baked !== null && (baked.length !== selected.length || baked.some((item) => !selected.includes(item)));
  const folded = baked !== null;

  useEffect(() => {
    if (seal <= 0 || seal >= 1) return;
    const id = window.requestAnimationFrame(() => setSeal((value) => Math.min(1, value + 0.06)));
    return () => window.cancelAnimationFrame(id);
  }, [seal]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, 'pack');
    drawBook(ctx, 130, 150, folded && !stale ? 0.05 : 1, folded && !stale ? '编码器离开' : '文本编码器');
    drawPot(ctx, 470, 450, 1);
    drawBloom(ctx, 470, 398, 'pitcher', 1, folded && !stale && baked.includes('猪笼草') ? 1 : 0, 0);
    drawPot(ctx, 700, 460, 0.9);
    drawBloom(ctx, 700, 414, 'rose', 0.9, folded && !stale && baked.includes('玫瑰') ? 0.8 : 0, 0);
    if (folded && !stale) {
      if (baked.includes('猪笼草')) drawRing(ctx, 470, 432, green, 1);
      if (baked.includes('玫瑰')) drawRing(ctx, 700, 442, green, 0.9);
      drawTag(ctx, 560, 250, '权重里的词表', blue);
    }
    if (stale) {
      drawRing(ctx, 470, 432, red, 1);
      drawTag(ctx, 560, 250, '说法已变，需重编码', red);
    }
    if (seal > 0 && seal < 1) drawSeal(ctx, 580, 320, seal, '烙进权重');
    if (seal >= 1 && folded && !stale) drawSeal(ctx, 580, 320, 1, '已封箱');
    ctx.fillStyle = '#21324a';
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(`编码 ${passes} 次 · 新图片 ${seen} 张`, 280, 86);
    ctx.fillStyle = '#68778f';
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('封箱台 · 先写说法再圈花', 300, 124);
  }, [baked, folded, passes, seal, seen, stale]);

  const toggle = (name: string) => {
    setSelected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  const bake = () => {
    setBaked([...selected]);
    setPasses((value) => value + 1);
    setSeal(0.08);
  };

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">先写好词表，再看新图</h3>
      <p className="yw-p">选好要认的说法，编码一次并烙进摊位。之后每来一盆新花，都不必再翻开文本编码器。</p>
      <div className="yw-row">
        {options.map((name) => <button key={name} className={selected.includes(name) ? 'yw-btn is-on' : 'yw-btn'} onClick={() => toggle(name)}>{name}</button>)}
      </div>
      <div className="yw-row">
        <button className="yw-btn is-good" onClick={bake}>编码并封箱</button>
        <button className="yw-btn" onClick={() => { if (baked && !stale) setSeen((value) => value + 1); }}>再来一张图</button>
      </div>
      <p className="yw-note" style={{ color: stale ? red : green }}>
        {stale
          ? '离线词表已经写进权重。说法变了，必须重新编码，不能沿用刚才的权重。'
          : folded
            ? `当前离线词表是「${baked.join('、')}」。重参数化后的 YOLO-World-L 在表 2 里是 48M 参数、52.0 FPS；括号中带文本编码器的是 110M、17.6 FPS。测量用一张 V100，不用 TensorRT。`
            : '还没有写入。训练时词表可以在线更换；部署时论文走的是先编码、再重参数化——和封面「先写说法再圈花」同一件事。'}
      </p>
    </div>
  </div>;
};

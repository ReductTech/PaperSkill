import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { Bloom, blooms, blue, dot, drawBloom, drawMarket, drawPot, drawRing, drawTag, green, localPoint, muted, orange, paint, phrases, softmax } from './flowerKit';

const order: Bloom[] = ['rose', 'fern', 'sun', 'pitcher'];
const choices = ['红瓣带刺', '细长叶子', '黄瓣圆盘', '管状捕虫叶'];

export const YwRegionText: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phrase, setPhrase] = useState(choices[0]);
  const [alpha, setAlpha] = useState(1);
  const w = 760;
  const h = 622;
  const spots = [140, 300, 460, 640].map((x, i) => ({ x, kind: order[i], y: 430 }));
  const scores = useMemo(() => order.map((kind) => alpha * dot(blooms[kind].vec, phrases[phrase]) + 0), [alpha, phrase]);
  const probs = softmax(scores);
  const best = scores.indexOf(Math.max(...scores));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h);
    spots.forEach((spot, i) => {
      if (i === best) drawRing(ctx, spot.x, spot.y - 16, green, 0.92);
      drawPot(ctx, spot.x, spot.y, 0.9);
      drawBloom(ctx, spot.x, spot.y - 46, spot.kind, 0.82, probs[i], 0);
      ctx.fillStyle = i === best ? green : muted;
      ctx.font = '700 24px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(probs[i].toFixed(2), spot.x, spot.y + 62);
    });
    drawTag(ctx, spots[best].x, 168, phrase, orange);
    ctx.textAlign = 'left';
    ctx.fillStyle = blue;
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText('演示相似度，不是测得的 AP', 24, 78);
  }, [best, phrase, probs]);

  const onPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const point = localPoint(canvas, event.clientX, event.clientY, w, h);
    const docks = choices.map((name, i) => ({ name, x: 120 + i * 160, y: 168 }));
    const hit = docks.find((dock) => Math.abs(point.x - dock.x) < 70 && Math.abs(point.y - dock.y) < 36);
    if (hit) setPhrase(hit.name);
  };

  return <div className="yw-wide">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} onPointerDown={onPointer} />
    <div className="yw-side">
      <h3 className="yw-h">区域嵌入对上哪句名词</h3>
      <p className="yw-formula">
        <SymbolHint meaning="s：第 k 个预测区域与第 j 个名词的相似度。">s</SymbolHint>
        {' = '}
        <SymbolHint meaning="α：可学习缩放。论文没有公布具体数值，滑块只演示它把相似度拉开的程度。">α</SymbolHint>
        {' · cos + '}
        <SymbolHint meaning="β：可学习平移。本页演示固定为 0。">β</SymbolHint>
      </p>
      <p className="yw-p">先把区域嵌入和文本嵌入做 L2 归一化，点积就是余弦。点一种说法，看哪一盆的演示概率最高。</p>
      <div className="yw-row">
        {choices.map((name) => <button key={name} className={phrase === name ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setPhrase(name)}>{name}</button>)}
      </div>
      <label className="yw-p">α = {alpha.toFixed(1)}
        <input type="range" min={0.4} max={2.2} step={0.2} value={alpha} onChange={(event) => setAlpha(Number(event.target.value))} style={{ width: '100%', accentColor: orange }} />
      </label>
      <p className="yw-note" style={{ color: alpha < 0.7 ? muted : green }}>
        {alpha < 0.7
          ? 'α 很小，四盆的演示概率挤在一起，最像的那盆也不突出。'
          : `「${phrase}」最接近${blooms[order[best]].name}，演示概率 ${probs[best].toFixed(2)}。换一句短语，最高的盆会跟着变。`}
      </p>
    </div>
  </div>;
};

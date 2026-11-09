import React, { useEffect, useMemo, useRef, useState } from 'react';
import { drawBloom, drawCard, drawMarket, drawPot, drawVendor, green, muted, paint, purple } from './flowerKit';

type Cell = { ap: number; apr: number } | null;

function lookup(gqa: boolean, textToImage: boolean, imageToText: boolean): Cell {
  if (!gqa && !textToImage && !imageToText) return { ap: 22.4, apr: 14.5 };
  if (!gqa && textToImage && !imageToText) return { ap: 23.2, apr: 15.2 };
  if (!gqa && textToImage && imageToText) return { ap: 23.5, apr: 16.2 };
  if (gqa && !textToImage && !imageToText) return { ap: 29.7, apr: 21.0 };
  if (gqa && textToImage && imageToText) return { ap: 31.9, apr: 22.5 };
  return null;
}

export const YwRepvl: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [gqa, setGqa] = useState(false);
  const [textToImage, setTextToImage] = useState(true);
  const [imageToText, setImageToText] = useState(false);
  const cell = useMemo(() => lookup(gqa, textToImage, imageToText), [gqa, textToImage, imageToText]);
  const w = 900;
  const h = 622;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, 'front');
    drawVendor(ctx, 90, 470);
    drawPot(ctx, 430, 430, 1);
    drawBloom(ctx, 430, 378, 'sun', 1, textToImage ? 1 : 0, 0);
    drawPot(ctx, 680, 450, 0.82);
    drawBloom(ctx, 680, 406, 'pitcher', 0.82, textToImage && imageToText ? 0.7 : 0.05, textToImage && imageToText ? 0 : 0.25);
    const lines = imageToText
      ? ['说法卡片', gqa ? '名词短语' : '向日葵', '补上：画面有黄瓣']
      : ['说法卡片', gqa ? '名词短语' : '向日葵'];
    drawCard(ctx, 40, 78, lines, imageToText ? purple : '#92400e');
    ctx.fillStyle = textToImage ? '#f07e47' : muted;
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(textToImage ? '文字照亮了匹配的花' : '文字还没有照进花', 250, 92);
  }, [gqa, imageToText, textToImage]);

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">两个方向怎么接通</h3>
      <p className="yw-p">T→I 用 max-sigmoid 把文本写进图像特征。I→T 先把三个尺度各池化成 3×3，共 27 块，再更新文本嵌入。</p>
      <div className="yw-row">
        <button className={textToImage ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setTextToImage((value) => !value)}>文字照亮花</button>
        <button className={imageToText ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setImageToText((value) => !value)}>花改写说法</button>
        <button className={gqa ? 'yw-btn is-good' : 'yw-btn'} onClick={() => setGqa((value) => !value)}>{gqa ? '带上 GQA 短语' : '只有类别名'}</button>
      </div>
      <p className="yw-em" style={{ color: cell ? green : muted }}>{cell ? cell.ap.toFixed(1) : '—'}</p>
      <p className="yw-note">
        {cell
          ? `表 4 这一格是 ${cell.ap.toFixed(1)} AP，稀有类 ${cell.apr.toFixed(1)}。这是消融设定，不是表 2 里 35.4 的完整模型。`
          : '表 4 没有报告这个开关组合，所以这里不显示 AP。花的亮暗仍然只演示融合方向。'}
      </p>
    </div>
  </div>;
};

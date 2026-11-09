import React, { useEffect, useRef, useState } from 'react';
import { blue, drawBloom, drawMarket, drawPot, drawTag, green, muted, orange, paint, red, wood } from './flowerKit';

const largeRows = [
  { name: 'Objects365', ap: 23.5, apr: 16.2, note: '只有检测类别名' },
  { name: '再加 GQA', ap: 31.9, apr: 22.5, note: '短语更丰富，稀有类明显上升' },
  { name: '换成 GoldG', ap: 32.5, apr: 22.3, note: 'GQA 加 Flickr30k，并去掉其中的 COCO 图像' },
  { name: '再加 CC3M†', ap: 33.0, apr: 23.6, note: '伪标注带来 0.5 AP。这仍是表 3，不是表 2 的 35.4' },
];
const smallRows = [
  { name: 'O365', ap: 16.3, apr: 9.2, note: '小模型，61 万样本', amount: 61 },
  { name: 'O365+GoldG', ap: 24.2, apr: 16.4, note: '表 9 的 24.2，不要写成表 2 的 26.2', amount: 61 },
  { name: 'CC3M 52 万', ap: 19.2, apr: 10.7, note: '伪标注加到这里，总体 AP 升到 19.2', amount: 52 },
  { name: 'CC3M 75 万', ap: 18.2, apr: 11.2, note: '再加伪标注，总体降到 18.2，稀有类升到 11.2', amount: 75 },
];

export const YwPretrain: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [small, setSmall] = useState(false);
  const [index, setIndex] = useState(0);
  const rows = small ? smallRows : largeRows;
  const row = rows[Math.min(index, rows.length - 1)];
  const w = 900;
  const h = 622;
  const sliderValue = small ? (index <= 1 ? 0 : index === 2 ? 52 : 75) : index;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, 'crate');
    const count = index + 1;
    for (let i = 0; i < count; i += 1) {
      const x = 180 + i * 170;
      ctx.fillStyle = i === count - 1 && index === 3 ? '#e7d3a1' : '#d7c4a3';
      ctx.fillRect(x, 470, 120, 46);
      ctx.fillStyle = wood;
      ctx.fillRect(x + 10, 458, 100, 14);
      drawPot(ctx, x + 60, 430, 0.55);
      drawBloom(ctx, x + 60, 400, i % 2 === 0 ? 'sun' : 'fern', 0.5, 0, 0);
    }
    drawPot(ctx, 760, 390, 0.85);
    const rareDown = small && index === 3;
    drawBloom(ctx, 760, 342, 'pitcher', 0.8, row.apr > 20 ? 0.8 : 0.2, rareDown ? 0.15 : Math.max(0, 0.45 - row.apr / 40));
    if (index === 3) drawTag(ctx, 760, 250, small ? '伪标签过多' : '伪标签', small ? red : orange);
    const maxAp = 36;
    ctx.fillStyle = lineColor(row.ap, small);
    ctx.fillRect(80, 520 - (row.ap / maxAp) * 180, 70, (row.ap / maxAp) * 180);
    ctx.fillStyle = '#21324a';
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(`${row.ap.toFixed(1)} AP`, 80, 150);
    ctx.fillStyle = '#68778f';
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText(small ? '货箱视角 · 表 9 离散点' : '货箱视角 · 表 3 配方', 280, 86);
  }, [index, row, small]);

  const onSlider = (raw: number) => {
    if (!small) {
      setIndex(Math.max(0, Math.min(3, Math.round(raw))));
      return;
    }
    if (raw < 26) setIndex(1);
    else if (raw < 64) setIndex(2);
    else setIndex(3);
  };

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">{small ? '小模型能吃多少伪标注' : '多加一筐标注'}</h3>
      <p className="yw-p">{small ? '拖滑块只跳到表 9 已报告的点，不会在 52 万与 75 万之间插值。' : '点下一筐，只切换论文已经报告的配方。柱高就是该行的 AP。'}</p>
      <div className="yw-row">
        <button className={!small ? 'yw-btn is-on' : 'yw-btn'} onClick={() => { setSmall(false); setIndex(0); }}>表 3 · 大模型消融</button>
        <button className={small ? 'yw-btn is-on' : 'yw-btn'} onClick={() => { setSmall(true); setIndex(2); }}>表 9 · 小模型</button>
      </div>
      {small ? (
        <label className="yw-slider">
          <span>伪标注量（万）· 离散点 {sliderValue === 0 ? 'GoldG' : sliderValue}</span>
          <input
            type="range"
            min={0}
            max={75}
            step={1}
            value={sliderValue === 0 ? 0 : sliderValue}
            onChange={(event) => onSlider(Number(event.target.value))}
          />
          <div className="yw-row">
            <button className={index === 1 ? 'yw-btn is-good' : 'yw-btn'} onClick={() => setIndex(1)}>GoldG</button>
            <button className={index === 2 ? 'yw-btn is-good' : 'yw-btn'} onClick={() => setIndex(2)}>52 万</button>
            <button className={index === 3 ? 'yw-btn is-bad' : 'yw-btn'} onClick={() => setIndex(3)}>75 万</button>
          </div>
        </label>
      ) : (
        <div className="yw-row">
          {rows.map((item, i) => <button key={item.name} className={i === index ? 'yw-btn is-good' : 'yw-btn'} onClick={() => setIndex(i)}>{item.name}</button>)}
        </div>
      )}
      <p className="yw-em" style={{ color: small && index === 3 ? red : green }}>{row.ap.toFixed(1)}</p>
      <p className="yw-note">{`${row.note}。稀有类 ${row.apr.toFixed(1)}。零样本 LVIS，AP 越高越好。`}</p>
    </div>
  </div>;
};

function lineColor(ap: number, small: boolean) {
  if (small && ap < 19) return red;
  if (ap >= 31) return green;
  if (ap >= 23) return blue;
  return muted;
}

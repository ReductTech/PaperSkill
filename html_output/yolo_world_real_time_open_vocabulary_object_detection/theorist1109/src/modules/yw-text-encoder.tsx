import React, { useEffect, useRef, useState } from 'react';
import { blue, drawBloom, drawBook, drawMarket, drawPot, green, muted, paint, red } from './flowerKit';

const rows = [
  { id: 'bert-frozen', name: 'BERT 冻结', ap: 14.6, apr: 3.4, clip: false, tuned: false },
  { id: 'bert-tune', name: 'BERT 微调', ap: 18.3, apr: 6.6, clip: false, tuned: true },
  { id: 'clip-frozen', name: 'CLIP 冻结', ap: 22.4, apr: 14.5, clip: true, tuned: false },
  { id: 'clip-tune', name: 'CLIP 微调', ap: 19.3, apr: 8.6, clip: true, tuned: true },
];

export const YwTextEncoder: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [id, setId] = useState('clip-frozen');
  const row = rows.find((item) => item.id === id) || rows[2];
  const wilt = 1 - row.apr / 14.5;
  const w = 900;
  const h = 622;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, 'scale');
    drawBook(ctx, 150, 170, 0.85, row.clip ? 'CLIP 图文词典' : 'BERT 纯文本');
    drawPot(ctx, 520, 450, 1);
    drawBloom(ctx, 520, 396, 'pitcher', 1, row.apr > 12 ? 0.85 : 0.1, wilt);
    ctx.fillStyle = row.tuned ? red : blue;
    ctx.font = '700 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(row.tuned ? '词典被 365 个类名拽偏' : '词典保持预训练时的位置', 250, 86);
    ctx.fillStyle = muted;
    ctx.font = '700 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('秤台视角 · 词表称重', 300, 126);
    if (row.tuned) {
      ctx.fillStyle = muted;
      ctx.font = '700 24px "Microsoft YaHei", sans-serif';
      ctx.fillText('常见花名挤在一起', 300, 250);
    }
  }, [row, wilt]);

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">用哪本词典认稀有花</h3>
      <p className="yw-p">CLIP 带着图文对齐来，稀有类更高。在只有 365 类的 Objects365 上微调 CLIP，论文观察到精度下降。</p>
      <div className="yw-row">
        {rows.map((item) => <button key={item.id} className={item.id === id ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setId(item.id)}>{item.name}</button>)}
      </div>
      <p className="yw-em" style={{ color: row.id === 'clip-frozen' ? green : (row.tuned && row.clip ? red : blue) }}>{row.ap.toFixed(1)}</p>
      <p className="yw-note">
        {`表 5：${row.name} 为 ${row.ap.toFixed(1)} AP，稀有类 ${row.apr.toFixed(1)}。微调学习率是基础学习率的 0.01 倍。花的萎靡只对照稀有类 AP，坐标不是论文给出的嵌入。这一表不是 35.4 的完整模型。`}
      </p>
    </div>
  </div>;
};

import React, { useEffect, useRef, useState } from 'react';
import { blue, drawBloom, drawMarket, drawPot, drawSpeech, drawVendor, green, orange, paint, red } from './flowerKit';

const base = [
  { id: 'glip', name: 'GLIP-T', short: 'GLIP', ap: 24.9, fps: 0.12, params: '232M' },
  { id: 'glipv2', name: 'GLIPv2-T', short: 'GLIPv2', ap: 26.9, fps: 0.12, params: '232M' },
  { id: 'gdino', name: 'Grounding DINO-T', short: 'DINO-T', ap: 25.6, fps: 1.5, params: '172M' },
  { id: 'detclip', name: 'DetCLIP-T', short: 'DetCLIP', ap: 34.4, fps: 2.3, params: '155M' },
  { id: 's', name: 'YOLO-World-S', short: 'YW-S', ap: 26.2, fps: 74.1, params: '13M' },
  { id: 'm', name: 'YOLO-World-M', short: 'YW-M', ap: 31.0, fps: 58.1, params: '29M' },
  { id: 'l', name: 'YOLO-World-L', short: 'YW-L', ap: 35.0, fps: 52.0, params: '48M' },
];
const extra = { id: 'lcc', name: 'YOLO-World-L + CC3M†', short: 'YW-L†', ap: 35.4, fps: 52.0, params: '48M' };

export const YwLvis: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [id, setId] = useState('l');
  const [showExtra, setShowExtra] = useState(false);
  const rows = showExtra ? [...base, extra] : base;
  const row = rows.find((item) => item.id === id) || rows[6];
  const w = 900;
  const h = 622;
  const sameDataBeat = row.id === 'l';
  const pseudoPoint = row.id === 'lcc';
  const quality = Math.min(1, (row.ap - 24) / 12) * 0.55 + Math.min(1, Math.log10(Math.max(row.fps, 0.1)) / Math.log10(80)) * 0.45;
  const wilt = Math.max(0, 1 - quality);
  const glow = Math.max(0.05, quality);
  const vendorLine = sameDataBeat
    ? '同数据比看 35.0'
    : pseudoPoint
      ? '35.4 多了伪标注'
      : row.fps >= 50
        ? '准又快的摊位'
        : row.ap >= 34
          ? '准，但排队慢'
          : '这摊还差点意思';

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = paint(canvas, w, h);
    drawMarket(ctx, w, h, 'plot');
    const x0 = 90;
    const y0 = 500;
    const plotW = 760;
    const plotH = 340;
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - plotH);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + plotW, y0);
    ctx.stroke();
    ctx.fillStyle = '#68778f';
    ctx.font = '700 24px "Microsoft YaHei", sans-serif';
    ctx.fillText('FPS 取对数', x0 + 300, 560);
    ctx.fillText('Fixed AP', 16, 150);
    const log = (fps: number) => Math.log10(fps);
    const minL = log(0.1);
    const maxL = log(80);
    rows.forEach((item) => {
      const x = x0 + ((log(item.fps) - minL) / (maxL - minL)) * plotW;
      const y = y0 - ((item.ap - 20) / 20) * plotH;
      const mine = item.name.startsWith('YOLO-World');
      ctx.fillStyle = item.id === row.id ? orange : (mine ? green : blue);
      ctx.beginPath();
      ctx.arc(x, y, item.id === row.id ? 14 : 9, 0, Math.PI * 2);
      ctx.fill();
    });
    drawVendor(ctx, 120, 120);
    drawSpeech(ctx, 250, 78, vendorLine, sameDataBeat || pseudoPoint ? green : blue);
    drawPot(ctx, 790, 130, 0.42);
    drawBloom(ctx, 790, 104, 'sun', 0.38, glow, wilt);
    if (pseudoPoint) {
      ctx.fillStyle = orange;
      ctx.font = '700 22px "Microsoft YaHei", sans-serif';
      ctx.fillText('† 另加 CC3M', 700, 56);
    }
  }, [glow, pseudoPoint, row, rows, sameDataBeat, vendorLine, wilt]);

  return <div className="yw-split">
    <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />
    <div className="yw-side">
      <h3 className="yw-h">同一套测速下谁又准又快</h3>
      <p className="yw-p">同数据比看 35.0；35.4 是加伪标注后的点。LVIS Fixed AP，V100，无 TensorRT。</p>
      <div className="yw-row">
        {rows.map((item) => <button key={item.id} className={item.id === row.id ? 'yw-btn is-on' : 'yw-btn'} onClick={() => setId(item.id)}>{item.short}</button>)}
        <button className={showExtra ? 'yw-btn is-good' : 'yw-btn'} onClick={() => { setShowExtra((value) => !value); setId(showExtra ? 'l' : 'lcc'); }}>
          {showExtra ? '隐藏 35.4' : '另看 35.4'}
        </button>
      </div>
      <p className="yw-em" style={{ color: sameDataBeat || pseudoPoint ? green : (row.fps < 3 ? red : blue) }}>{row.ap.toFixed(1)} AP</p>
      <p className="yw-note">
        {sameDataBeat
          ? `YW-L 与 DetCLIP 都是 O365+GoldG：35.0 AP、52.0 FPS 对 34.4 AP、2.3 FPS，约 20×。花的亮暗跟 AP·FPS 一起走。`
          : pseudoPoint
            ? `35.4 多了伪标注 CC3M，不能和别人当成同一份数据。速度仍是 52.0 FPS、48M。`
            : `${row.name}：${row.fps.toFixed(1)} FPS，${row.params}。除 35.4 外都是 O365+GoldG。`}
      </p>
    </div>
  </div>;
};

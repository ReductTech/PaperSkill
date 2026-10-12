import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text } from './kit';

const W = 680;
const H = 300;

// 12 个通道的激活幅度（概念示意）；通道 4、8 是离群通道
const CHANNELS = [0.9, 1.1, 0.8, 6.2, 1.0, 0.7, 1.2, 5.4, 0.9, 1.3, 0.8, 1.1];
const X0 = 60;
const CW = 34;
const GAP = 13;
const BASE_Y = 232;

const cx = (i: number) => X0 + i * (CW + GAP);
const OUTLIERS = CHANNELS.filter((v) => v > 3);
const MAX = Math.max(...CHANNELS);
const sMax = MAX / 7;
const cleanMax = Math.max(...CHANNELS.filter((v) => v <= 3));
const sClean = cleanMax / 7;

export const Ch2Channels: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState(3);

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 幅度轴刻度
    for (const v of [0, 3, 6]) {
      const y = BASE_Y - (v / MAX) * 170;
      ctx.strokeStyle = 'rgba(118,144,106,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X0 - 14, y);
      ctx.lineTo(W - 40, y);
      ctx.stroke();
      text(ctx, String(v), X0 - 22, y + 4, C.muted, 12, 'right');
    }

    // 均值线
    const mean = CHANNELS.reduce((a, b) => a + b, 0) / CHANNELS.length;
    const my = BASE_Y - (mean / MAX) * 170;
    ctx.strokeStyle = C.blue;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X0 - 14, my);
    ctx.lineTo(W - 40, my);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, `均值 ${mean.toFixed(2)}`, W - 44, my - 8, C.blue, 12, 'right');

    // 通道柱
    for (let i = 0; i < CHANNELS.length; i++) {
      const h = (CHANNELS[i] / MAX) * 170;
      const x = cx(i);
      const outlier = CHANNELS[i] > 3;
      ctx.fillStyle = outlier ? C.red : C.green;
      ctx.beginPath();
      ctx.roundRect(x, BASE_Y - h, CW, h, 5);
      ctx.fill();
      text(ctx, CHANNELS[i].toFixed(1), x + CW / 2, BASE_Y - h - 10, outlier ? C.red : C.muted, outlier ? 13 : 11.5, 'center');
      text(ctx, String(i + 1), x + CW / 2, BASE_Y + 16, C.muted, 11.5, 'center');
      if (i === sel) {
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(x - 4, BASE_Y - h - 4, CW + 8, h + 8, 8);
        ctx.stroke();
      }
    }
    text(ctx, '通道编号（点击选择）', X0 + (W - X0 - 40) / 2, BASE_Y + 34, C.muted, 12, 'center');
    text(ctx, '激活幅度（示意）', 24, 30, C.muted, 12);
  });

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    for (let i = 0; i < CHANNELS.length; i++) {
      if (x >= cx(i) - GAP / 2 && x <= cx(i) + CW + GAP / 2) {
        setSel(i);
        break;
      }
    }
  };

  const outlier = CHANNELS[sel] > 3;
  const mean = CHANNELS.reduce((a, b) => a + b, 0) / CHANNELS.length;
  const times = CHANNELS[sel] / mean;

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
        <div className="svq-side">
          <h6>实时读数</h6>
          <div className="svq-readout">
            <span>通道 {sel + 1} 幅度</span>
            <b className={outlier ? 'bad' : 'good'}>{CHANNELS[sel].toFixed(1)}</b>
          </div>
          <div className="svq-readout">
            <span>相对均值</span>
            <b className={outlier ? 'bad' : ''}>{times.toFixed(1)}×</b>
          </div>
          <div className="svq-readout">
            <span>离群通道</span>
            <b className="bad">{OUTLIERS.length} / {CHANNELS.length}</b>
          </div>
          <h6>它决定的 4-bit 步长</h6>
          <div className="svq-meter-row">
            <span>含离群</span>
            <div className="svq-meter">
              <i style={{ width: '100%', background: C.red }} />
            </div>
            <b>{sMax.toFixed(2)}</b>
          </div>
          <div className="svq-meter-row">
            <span>剔除后</span>
            <div className="svq-meter">
              <i style={{ width: `${(sClean / sMax) * 100}%`, background: C.green }} />
            </div>
            <b>{sClean.toFixed(2)}</b>
          </div>
          <div className="svq-readout">
            <span>粒度可细 ×</span>
            <b className="good">{(sMax / sClean).toFixed(1)}×</b>
          </div>
        </div>
      </div>
      <div className="ctrl">
        <button className="tiny ghost" onClick={() => setSel((sel + CHANNELS.length - 1) % CHANNELS.length)}>
          上一个通道
        </button>
        <button className="tiny ghost" onClick={() => setSel((sel + 1) % CHANNELS.length)}>
          下一个通道
        </button>
        <label style={{ marginLeft: 'auto' }}>
          通道 <span className="val">{sel + 1}</span>
        </label>
      </div>
      <div className={`feedback ${outlier ? 'bad' : 'good'}`}>
        {outlier
          ? `通道 ${sel + 1} 幅度 ${CHANNELS[sel].toFixed(1)}，是均值的 ${times.toFixed(1)} 倍——离群值集中在少数固定通道（红色），不是随机散布，这才让「单独拎出去」成为可能。`
          : `通道 ${sel + 1} 幅度 ${CHANNELS[sel].toFixed(1)}，接近均值 ${mean.toFixed(2)}——正常通道占 ${CHANNELS.length - OUTLIERS.length}/${CHANNELS.length}，量化难只难在少数通道。`}
      </div>
      <p className="concept-note">
        <b>读图方式：</b>红色 = 离群通道（示意排布）。若剔除 2 个离群通道，所有通道的最大值从 {MAX.toFixed(1)} 降到 {cleanMax.toFixed(1)}，
        4-bit 步长可细 {(sMax / sClean).toFixed(1)} 倍——「离群值集中在少数固定通道」是低秩分支方案的前提（论文激活离群值分析）。
      </p>
    </div>
  );
};

export default Ch2Channels;

import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, FACTS } from './kit';

const W = 680;
const H = 300;

// 16 格数值带，每格代表 4 个通道（group 64 / 16 等比缩小示意）；第 11 格是离群值
const CELLS = [0.9, 1.1, 0.8, 1.0, 1.2, 0.9, 1.1, 0.8, 1.0, 0.8, 6.2, 0.9, 1.1, 0.8, 1.2, 1.0];
const OUT_IDX = 10;
const NGroups = 4; // NVFP4 示意分组数（64/16 = 4 组）
const X0 = 36;
const CW = 32;
const GAP = 6;
const STRIP_Y = 66;
const STRIP_H = 52;

const gMax = (g: number) => {
  const cells = CELLS.slice(g * NGroups, g * NGroups + NGroups);
  return Math.max(...cells);
};
const S_ALL = Math.max(...CELLS) / 7;
const S_LOCAL = Math.max(...CELLS.filter((_, i) => i !== OUT_IDX)) / 7;

export const Ch9Nvfp4: React.FC<WidgetProps> = () => {
  const [nv, setNv] = useState(false);

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 数值带
    for (let i = 0; i < CELLS.length; i++) {
      const x = X0 + i * (CW + GAP);
      const outlier = i === OUT_IDX;
      ctx.fillStyle = outlier ? C.red : C.light;
      ctx.beginPath();
      ctx.roundRect(x, STRIP_Y, CW, STRIP_H, 5);
      ctx.fill();
      ctx.strokeStyle = nv && !outlier ? C.green : C.axis;
      ctx.lineWidth = outlier ? 2 : 1.5;
      ctx.stroke();
      text(ctx, CELLS[i].toFixed(1), x + CW / 2, STRIP_Y + STRIP_H / 2 + 4, outlier ? C.white : C.ink, 12, 'center');
    }
    text(ctx, '每格 = 4 个通道（等比缩小示意）', X0, STRIP_Y - 12, C.muted, 12);

    // 分组括线 + 每组 scale 柱
    const groups = nv ? NGroups : 1;
    const gw = (CELLS.length / groups) * (CW + GAP) - GAP;
    for (let g = 0; g < groups; g++) {
      const gx = X0 + g * (gw + GAP);
      const s = (nv ? gMax(g) : S_ALL) / 7;
      const hot = nv && g === Math.floor(OUT_IDX / NGroups);
      const col = hot ? C.red : C.green;
      // 括线
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(gx, STRIP_Y + STRIP_H + 6);
      ctx.lineTo(gx, STRIP_Y + STRIP_H + 14);
      ctx.lineTo(gx + gw, STRIP_Y + STRIP_H + 14);
      ctx.lineTo(gx + gw, STRIP_Y + STRIP_H + 6);
      ctx.stroke();
      // scale 柱（高度 ∝ 步长）
      const bh = Math.max(6, (s / S_ALL) * 46);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(gx + gw / 2 - 16, 228 - bh, 32, bh, 3);
      ctx.fill();
      text(ctx, `s=${s.toFixed(2)}`, gx + gw / 2, 244, col, 11.5, 'center');
    }
    // scale 基准线
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X0 - 10, 228);
    ctx.lineTo(X0 + CELLS.length * (CW + GAP), 228);
    ctx.stroke();
    text(
      ctx,
      nv ? 'NVFP4：group=16，每组独立 scale（更细）' : 'INT4：group=64，全组共用一个 scale',
      X0 + (CELLS.length * (CW + GAP)) / 2,
      270,
      nv ? C.green : C.red,
      14,
      'center'
    );
  });

  const hurt = nv ? FACTS.nvfp4Group - 1 : FACTS.int4Group - 1;

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} />
        <div className="svq-side">
          <h6>分组读数</h6>
          <div className="svq-readout">
            <span>组大小</span>
            <b className={nv ? 'good' : 'bad'}>{nv ? FACTS.nvfp4Group : FACTS.int4Group}</b>
          </div>
          <div className="svq-readout">
            <span>被离群拖累的正常值</span>
            <b className={nv ? 'good' : 'bad'}>{hurt} 个/组</b>
          </div>
          <div className="svq-readout">
            <span>两级 scale</span>
            <b className={nv ? 'good' : 'bad'}>{nv ? '✓（更细）' : '✗'}</b>
          </div>
          <div className="svq-readout">
            <span>正常组步长</span>
            <b className={nv ? 'good' : 'bad'}>{nv ? S_LOCAL.toFixed(2) : S_ALL.toFixed(2)}</b>
          </div>
          <h6>低秩收益（相对，示意）</h6>
          <div className="svq-meter-row">
            <span>INT4</span>
            <div className="svq-meter">
              <i style={{ width: '100%', background: C.green }} />
            </div>
            <b>1.0</b>
          </div>
          <div className="svq-meter-row">
            <span>NVFP4</span>
            <div className="svq-meter">
              <i style={{ width: '22%', background: C.orange }} />
            </div>
            <b>0.22</b>
          </div>
        </div>
      </div>
      <div className="chip-row">
        <button className={`chip ${!nv ? 'selected' : ''}`} onClick={() => setNv(false)}>
          INT4（group {FACTS.int4Group}）
        </button>
        <button className={`chip ${nv ? 'selected' : ''}`} onClick={() => setNv(true)}>
          NVFP4（group {FACTS.nvfp4Group} + 两级 scale）
        </button>
      </div>
      <div className={`feedback ${nv ? 'bad' : 'good'}`}>
        {nv
          ? `NVFP4 每组只有 ${FACTS.nvfp4Group} 个值且两级 scale：离群值只拖累同组 ${hurt} 个正常值（红色格），硬件自己就把离群处理了大半——smooth 的「按列集中」前提被削弱，低秩分支收益缩水到约 0.22（示意）。`
          : `INT4 每组 ${FACTS.int4Group} 个值共用一个 scale：1 个离群值拖累同组 ${hurt} 个正常值，步长被钉在 ${S_ALL.toFixed(2)}——必须靠 smooth + 低秩分支把离群拎出去，这正是 SVDQuant 的主场。`}
      </div>
      <p className="concept-note">
        <b>收益边界：</b>硬件格式进化（group 更细）会稀释算法层 outlier 处理的收益——与 SpinQuant「per-group 无提升」是同一类现象
        （快手作者实测反馈）。数值带与收益比例为教学示意，group 大小为论文设定。
      </p>
    </div>
  );
};

export default Ch9Nvfp4;

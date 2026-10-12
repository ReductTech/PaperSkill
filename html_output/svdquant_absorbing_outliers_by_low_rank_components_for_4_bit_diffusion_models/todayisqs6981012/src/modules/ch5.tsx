import React, { useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, rrect, clamp } from './kit';
import type { WidgetProps } from './registry';

const W = 680;
const H = 300;

// 总误差（概念示意）：U 形，甜点在中部
function totalError(a: number): number {
  return 0.4 + 1.4 * Math.pow(a - 0.5, 2);
}

export const Ch5Alpha: React.FC<WidgetProps> = () => {
  const [a, setA] = useState(0.5);

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 左半：两条难度 bar（激活 vs 权重，零和迁移）
    const bx = 66;
    const maxW = 190;
    const actW = (1 - a) * maxW;
    const wgtW = a * maxW;
    text(ctx, '激活侧离群值', bx, 74, C.red, 14);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, 86, maxW, 26);
    rrect(ctx, bx, 86, actW, 26, C.red, C.red, 1, 5);
    text(ctx, `${((1 - a) * 100).toFixed(0)}%`, bx + maxW + 10, 103, C.red, 13);
    text(ctx, '权重侧离群值', bx, 152, C.orange, 14);
    ctx.strokeRect(bx, 164, maxW, 26);
    rrect(ctx, bx, 164, wgtW, 26, C.orange, C.orange, 1, 5);
    text(ctx, `${(a * 100).toFixed(0)}%`, bx + maxW + 10, 181, C.orange, 13);
    text(ctx, 'X̃ = X·D⁻¹,  W̃ = D·W', bx, 218, C.ink, 13);
    text(ctx, '零和迁移：输出不变，难度搬家', bx, 238, C.muted, 12);

    // 右半：误差曲线（U 形）+ 甜点标记
    const ex = 330;
    const ew = 300;
    const ey = 226;
    for (const v of [0.5, 1.0, 1.5, 2.0]) {
      const y = ey - v * 70;
      ctx.strokeStyle = 'rgba(118,144,106,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex, y);
      ctx.lineTo(ex + ew, y);
      ctx.stroke();
      text(ctx, v.toFixed(1), ex - 10, y + 4, C.muted, 11, 'right');
    }
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + ew, ey);
    ctx.stroke();

    const optX = ex + 0.5 * ew;
    ctx.strokeStyle = C.green;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(optX, ey - totalError(0.5) * 70 - 14);
    ctx.lineTo(optX, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'α* = 0.50', optX, ey - totalError(0.5) * 70 - 22, C.green, 12, 'center');

    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const px = ex + t * ew;
      const py = ey - totalError(t) * 70;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(ex + a * ew, ey - totalError(a) * 70, 8, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '总量化误差（示意）', ex + ew / 2, 34, C.blue, 14, 'center');
    text(ctx, 'α →', ex + ew + 14, ey, C.muted, 12);
  });

  const e = totalError(a);
  const fb =
    a < 0.25
      ? { t: `α = ${a.toFixed(2)} 太小：${((1 - a) * 100).toFixed(0)}% 难度仍压在激活侧，激活离群值还在拉爆刻度。`, c: 'bad' }
      : a > 0.75
      ? { t: `α = ${a.toFixed(2)} 太大：${(a * 100).toFixed(0)}% 难度搬到权重侧，权重被放大出新的离群列。`, c: 'bad' }
      : a > 0.4 && a < 0.6
      ? { t: `α = ${a.toFixed(2)}：两侧难度平衡，总误差 ${e.toFixed(2)} 接近最低点——论文逐层搜索 α，用的正是这条曲线。`, c: 'good' }
      : { t: `α = ${a.toFixed(2)}：难度在两侧迁移（激活 ${(100 - a * 100).toFixed(0)}% / 权重 ${(a * 100).toFixed(0)}%），总误差 ${e.toFixed(2)}。`, c: '' };

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} />
        <div className="svq-side">
          <h6>实时读数</h6>
          <div className="svq-readout">
            <span>平滑强度 α</span>
            <b className="blue">{a.toFixed(2)}</b>
          </div>
          <div className="svq-readout">
            <span>激活侧难度</span>
            <b style={{ color: C.red }}>{((1 - a) * 100).toFixed(0)}%</b>
          </div>
          <div className="svq-meter">
            <i style={{ width: `${(1 - a) * 100}%`, background: C.red }} />
          </div>
          <div className="svq-readout">
            <span>权重侧难度</span>
            <b style={{ color: C.orange }}>{(a * 100).toFixed(0)}%</b>
          </div>
          <div className="svq-meter">
            <i style={{ width: `${a * 100}%`, background: C.orange }} />
          </div>
          <div className="svq-readout">
            <span>总误差（示意）</span>
            <b className={e < 0.55 ? 'good' : 'bad'}>{e.toFixed(2)}</b>
          </div>
          <div className="svq-readout">
            <span>离甜点距离</span>
            <b className={Math.abs(a - 0.5) < 0.1 ? 'good' : ''}>
              {clamp(Math.abs(a - 0.5) * 2, 0, 1) < 0.1 ? '已到达' : `${Math.abs(a - 0.5).toFixed(2)}`}
            </b>
          </div>
        </div>
      </div>
      <div className="ctrl">
        <label>
          平滑强度 α <span className="val">{a.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(a * 100)} onChange={(e) => setA(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
      <p className="concept-note">
        <b>平滑是零和迁移：</b>X̃=X·D⁻¹、W̃=D·W，输出 X̃W̃=XW 不变，但难度从激活搬到权重。
        α 逐层搜索，用「做完 SVD 后的层输出 MSE」选择最优值（示意曲线，非论文实测）。
      </p>
    </div>
  );
};

export default Ch5Alpha;

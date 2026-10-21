import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, SIGMAS, tailRatio, clamp, legend } from './kit';

const W = 680;
const H = 300;
const X0 = 70;
const BW = 23;
const GAP = 6;
const BASE_Y = 252;
const N = SIGMAS.length;
const SMAX = SIGMAS[0];

export const Ch4Svd: React.FC<WidgetProps> = () => {
  const [r, setR] = useState(5);
  const dragging = useRef(false);

  const tail = tailRatio(r);
  const sigmaNext = r < N ? SIGMAS[r] : null;
  const improve = sigmaNext ? SMAX / sigmaNext : null;
  const errPct = sigmaNext ? (sigmaNext / SMAX) * 100 : 4;

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 奇异值谱
    for (let i = 0; i < N; i++) {
      const h = Math.max(10, (SIGMAS[i] / SMAX) * 185);
      const x = X0 + i * (BW + GAP);
      ctx.fillStyle = i < r ? C.green : C.light;
      ctx.beginPath();
      ctx.roundRect(x, BASE_Y - h, BW, h, 4);
      ctx.fill();
      if (i === 0) text(ctx, `σ₁=${SIGMAS[i]}`, x + BW / 2, BASE_Y - h - 14, C.ink, 12, 'center');
    }
    text(ctx, 'σ₁', X0 + BW / 2, BASE_Y + 16, C.muted, 12, 'center');
    text(ctx, `σ${N}`, X0 + (N - 1) * (BW + GAP) + BW / 2, BASE_Y + 16, C.muted, 12, 'center');
    text(ctx, '奇异值幅度（示意谱，非论文实测）', 24, 30, C.muted, 12);

    // 可拖动秩线
    const lx = X0 + r * (BW + GAP) - GAP / 2;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 48);
    ctx.lineTo(lx, BASE_Y + 6);
    ctx.stroke();
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(lx, 48, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `r = ${r}`, lx + (r > N / 2 ? -16 : 16), 48, C.orange, 14, r > N / 2 ? 'right' : 'left');

    legend(
      ctx,
      [
        { label: '低秩分支（16-bit，撑住大方向）', color: C.green },
        { label: '残差（4-bit 量化）', color: C.light },
      ],
      36,
      284,
      12
    );
  });

  const setRState = (nr: number) => setR(clamp(nr, 0, N));

  const pointerToR = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    setRState(Math.round((x - X0) / (BW + GAP)));
  };

  const fb =
    r === 0
    ? { t: '秩为 0：整层直接 4-bit，步长由 σ₁=160 决定——离群方向把整张量化表拉爆，正是第一章的崩溃场景。', c: 'bad' }
    : r < 3
    ? { t: `秩太小：残差能量仍占 ${(tail * 100).toFixed(1)}%，σᵣ₊₁ = ${sigmaNext} 还很大，步长只改善 ${improve?.toFixed(1)}×——低秩分支还没撑住关键方向。`, c: 'bad' }
    : r < 7
    ? { t: `前 ${r} 个方向捕获 ${((1 - tail) * 100).toFixed(1)}% 能量，残差步长改善 ${improve?.toFixed(1)}×，估算量化误差降至基线的 ${errPct.toFixed(0)}%。`, c: '' }
    : r < N
    ? { t: `残差最大值降到 σᵣ₊₁ = ${sigmaNext}：步长改善 ${improve?.toFixed(1)}×，估算误差只剩基线的 ${errPct.toFixed(0)}%——4-bit 只需处理「平坦残差」。`, c: 'good' }
    : { t: '残差为空：等效整层 16-bit（零量化误差的上限）。论文在 512 通道上取 r=32（约 6% 参数）换取质量与速度的平衡。', c: 'good' };

  return (
    <div>
      <div className="svq-lab">
        <canvas
          ref={ref}
          width={W}
          height={H}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            pointerToR(e);
          }}
          onPointerMove={(e) => dragging.current && pointerToR(e)}
          onPointerUp={() => (dragging.current = false)}
          style={{ cursor: 'ew-resize', touchAction: 'none' }}
        />
        <div className="svq-side">
          <h6>误差分解（实时）</h6>
          <div className="svq-readout">
            <span>秩 r</span>
            <b className="blue">{r} / {N}</b>
          </div>
          <div className="svq-readout">
            <span>低秩捕获能量</span>
            <b className="good">{((1 - tail) * 100).toFixed(1)}%</b>
          </div>
          <div className="svq-readout">
            <span>残差能量占比</span>
            <b className={tail > 0.4 ? 'bad' : tail < 0.15 ? 'good' : ''}>
              {(tail * 100).toFixed(1)}%
            </b>
          </div>
          <div className="svq-readout">
            <span>残差最大奇异值 σᵣ₊₁</span>
            <b>{sigmaNext ?? '—（空）'}</b>
          </div>
          <div className="svq-readout">
            <span>步长改善 σ₁/σᵣ₊₁</span>
            <b className={improve && improve > 4 ? 'good' : ''}>
              {improve ? `${improve.toFixed(1)}×` : '∞'}
            </b>
          </div>
          <h6>4-bit 量化误差（估算）</h6>
          <div className="svq-meter-row">
            <span>全量 4-bit</span>
            <div className="svq-meter">
              <i style={{ width: '100%', background: C.red }} />
            </div>
            <b>100%</b>
          </div>
          <div className="svq-meter-row">
            <span>残差 4-bit</span>
            <div className="svq-meter">
              <i style={{ width: `${errPct}%`, background: C.green }} />
            </div>
            <b>{errPct.toFixed(0)}%</b>
          </div>
        </div>
      </div>
      <div className="ctrl">
        <label>
          秩 r <span className="val">{r}</span>
        </label>
        <input
          type="range"
          min={0}
          max={N}
          value={r}
          onChange={(e) => setRState(Number(e.target.value))}
        />
        <span style={{ color: 'var(--slate)', fontSize: 'var(--ui-type-body-small-size)' }}>
          也可直接拖动谱线
        </span>
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
      <p className="concept-note">
        <b>为什么误差只剩残差那一支：</b>残差能量 ‖R‖ = √(Σ σᵢ²)，前 r 个大奇异值（平方和很大）被低秩分支拿走后，
        残差幅度骤降，量化它的误差自然变小。右侧「量化误差估算」用均匀量化误差 ∝ 步长（s = max/7）的简化模型，
        <b>是示意估算，不是论文实测</b>；论文 Prop 4.2 把「找最优低秩分支」归结为 SVD（Eckart–Young 定理）。
      </p>
    </div>
  );
};

export default Ch4Svd;

import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, SIGMAS, tailRatio, legend } from './kit';

const W = 680;
const H = 300;
const R = 5; // 低秩秩（示意）
const X0 = 56;
const BW = 22;
const GAP = 7;
const BASE_Y = 236;

export const Ch3Protect: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'compress' | 'protect'>('compress');

  const kept = 1 - tailRatio(R);
  const lost = tailRatio(R);
  const sResid = SIGMAS[R] / 7;
  const sFull = SIGMAS[0] / 7;

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    for (let i = 0; i < SIGMAS.length; i++) {
      const h = Math.max(10, (SIGMAS[i] / SIGMAS[0]) * 170);
      const x = X0 + i * (BW + GAP);
      const head = i < R;
      if (head) {
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.roundRect(x, BASE_Y - h, BW, h, 4);
        ctx.fill();
      } else if (mode === 'compress') {
        ctx.fillStyle = '#e5e9ee';
        ctx.beginPath();
        ctx.roundRect(x, BASE_Y - h, BW, h, 4);
        ctx.fill();
        // 红叉：被丢弃
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 3, BASE_Y - h - 3);
        ctx.lineTo(x + BW + 3, BASE_Y + 3);
        ctx.moveTo(x + BW + 3, BASE_Y - h - 3);
        ctx.lineTo(x - 3, BASE_Y + 3);
        ctx.stroke();
      } else {
        ctx.fillStyle = C.light;
        ctx.beginPath();
        ctx.roundRect(x, BASE_Y - h, BW, h, 4);
        ctx.fill();
        ctx.strokeStyle = C.green;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, BASE_Y - h, BW, h, 4);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    text(ctx, 'σ₁', X0 + BW / 2, BASE_Y + 16, C.muted, 12, 'center');
    text(ctx, `σ${SIGMAS.length}`, X0 + (SIGMAS.length - 1) * (BW + GAP) + BW / 2, BASE_Y + 16, C.muted, 12, 'center');
    text(ctx, '奇异值幅度（示意谱）', 24, 30, C.muted, 12);
    text(
      ctx,
      mode === 'compress' ? '尾部方向被丢弃：信息没了' : '尾部残差保留：只量化得粗一点',
      X0 + (SIGMAS.length * (BW + GAP)) / 2,
      46,
      mode === 'compress' ? C.red : C.green,
      14,
      'center'
    );
    legend(
      ctx,
      [
        { label: '低秩分支（16-bit）', color: C.green },
        mode === 'compress'
          ? { label: '被截断丢弃', color: '#e5e9ee' }
          : { label: '残差（4-bit 保留）', color: C.light },
      ],
      X0 - 20,
      284,
      12
    );
  });

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} />
        <div className="svq-side">
          <h6>两种低秩的命运</h6>
          <div className="svq-readout">
            <span>保留参数</span>
            <b className="blue">{R} / {SIGMAS.length}</b>
          </div>
          <div className="svq-readout">
            <span>能量保留</span>
            <b className={mode === 'protect' ? 'good' : ''}>
              {mode === 'protect' ? '100%' : `${(kept * 100).toFixed(1)}%`}
            </b>
          </div>
          <div className="svq-readout">
            <span>信息丢失</span>
            <b className={mode === 'compress' ? 'bad' : 'good'}>
              {mode === 'compress' ? `${(lost * 100).toFixed(1)}%` : '0%'}
            </b>
          </div>
          <h6>尾部 4-bit 步长</h6>
          <div className="svq-meter-row">
            <span>全量 4-bit</span>
            <div className="svq-meter">
              <i style={{ width: '100%', background: C.red }} />
            </div>
            <b>{sFull.toFixed(1)}</b>
          </div>
          <div className="svq-meter-row">
            <span>残差 4-bit</span>
            <div className="svq-meter">
              <i style={{ width: `${(sResid / sFull) * 100}%`, background: mode === 'protect' ? C.green : 'transparent' }} />
            </div>
            <b>{mode === 'protect' ? sResid.toFixed(1) : '—'}</b>
          </div>
        </div>
      </div>
      <div className="chip-row">
        <button className={`chip ${mode === 'compress' ? 'selected' : ''}`} onClick={() => setMode('compress')}>
          截断压缩（丢掉方向）
        </button>
        <button className={`chip ${mode === 'protect' ? 'selected' : ''}`} onClick={() => setMode('protect')}>
          SVDQuant 保护（撑住方向）
        </button>
      </div>
      <div className={`feedback ${mode === 'protect' ? 'good' : 'bad'}`}>
        {mode === 'protect'
          ? `所有方向都保留：前 ${R} 个大方向用 16-bit 高精度「撑住」，尾部残差幅度降到 σᵣ₊₁=${SIGMAS[R]}，4-bit 步长只有全量量化的 ${(100 * (1 - sResid / sFull)).toFixed(0)}% 水位——信息不丢，只是残差量化得粗。`
          : `截断压缩丢掉 ${((lost) * 100).toFixed(1)}% 能量：${SIGMAS.length - R} 个方向直接消失（红叉），输出结构会明显受损——降维近似不是量化。`}
      </div>
      <p className="concept-note">
        <b>关键区别：</b>低秩<b>压缩</b>是降维近似（丢方向、损质量）；SVDQuant 的低秩<b>保护</b>是「把难量化的少数方向单独用高精度算」，
        其余方向照样保留、只是用 4-bit。两者参数量相同（同样只留 {R} 个秩），命运完全不同。
      </p>
    </div>
  );
};

export default Ch3Protect;

import React, { useState } from 'react';
import { C, useScene, txt, line, rr, dot, bar, clamp, ring } from './scene';

// 第5章：样板同学选择（PSM）
// 拖阈值 σ：相似度高于 σ 的新同学去蒸馏，低于 σ 的专心学新类。
// 下方三条曲线是论文 Fig.4 的真实数据（CIFAR-100，5/10/20 批）。

const W = 1000;
const H = 300;

const PHASES = [
  { p: 5, color: C.blue, pts: [[0.5, 61.5], [0.6, 61.8], [0.7, 64.25], [0.8, 65.88], [0.85, 65.45]] },
  { p: 10, color: C.green, pts: [[0.5, 61.8], [0.6, 62.05], [0.7, 63.63], [0.8, 65.04], [0.85, 64.18]] },
  { p: 20, color: C.purple, pts: [[0.5, 58.56], [0.6, 58.57], [0.7, 60.16], [0.8, 61.7], [0.85, 60.21]] },
] as const;

function interp(pts: readonly (readonly [number, number])[], s: number) {
  const k = clamp(s, 0.5, 0.85);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (k >= x1 && k <= x2) return y1 + ((k - x1) / (x2 - x1)) * (y2 - y1);
  }
  return pts[pts.length - 1][1];
}

// 20 个新同学的相似度（固定，便于观察阈值切在哪里）
const SIMS = [0.34, 0.41, 0.46, 0.52, 0.58, 0.63, 0.66, 0.69, 0.72, 0.75, 0.78, 0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.92, 0.94, 0.96];

export default function ThresholdSelect() {
  const [sigma, setSigma] = useState(0.8);
  const [phase, setPhase] = useState(5);
  const [touched, setTouched] = useState(false);

  const selected = PHASES.find((x) => x.p === phase)!;
  const acc = interp(selected.pts as unknown as readonly (readonly [number, number])[], sigma);

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const ax0 = 70;
    const ax1 = 930;
    const ay = 82;
    const sx = (s: number) => ax0 + s * (ax1 - ax0);

    line(ctx, ax0, ay, ax1, ay, C.line, 1.6);
    for (let s = 0; s <= 1.001; s += 0.1) {
      line(ctx, sx(s), ay - 5, sx(s), ay + 5, C.line, 1.4);
      txt(ctx, s.toFixed(1), sx(s), ay + 20, 10, C.muted, 'center', 500);
    }
    txt(ctx, '相似度', ax0, 26, 12, C.muted, 'left', 600);

    // 蒸馏区底色
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = 'rgba(34,141,92,0.5)';
    ctx.fillRect(sx(sigma), ay - 40, ax1 - sx(sigma), 40);
    ctx.fillStyle = 'rgba(39,68,110,0.35)';
    ctx.fillRect(ax0, ay - 40, sx(sigma) - ax0, 40);
    ctx.restore();

    // 样本点
    SIMS.forEach((s, i) => {
      const y = 54 + (i % 4) * 8;
      const on = s >= sigma;
      dot(ctx, sx(s), y, 4.6, on ? C.green : C.blue);
      if (on) ring(ctx, sx(s), y, 8, C.green, t + i * 0.3);
    });

    // 阈值线
    line(ctx, sx(sigma), ay - 46, sx(sigma), ay + 8, C.orange, 2);
    txt(ctx, sigma.toFixed(2), sx(sigma), ay + 38, 12, C.orange, 'center', 700);

    // 三条真实曲线
    const gx = 90;
    const gy = 150;
    const gw = 560;
    const gh = 110;
    const minY = 57;
    const maxY = 67;
    const cx = (s: number) => gx + ((clamp(s, 0.5, 0.85) - 0.5) / 0.35) * gw;
    const cy = (v: number) => gy + gh - ((v - minY) / (maxY - minY)) * gh;

    line(ctx, gx, gy + gh, gx + gw, gy + gh, C.line, 1.2);
    line(ctx, gx, gy, gx, gy + gh, C.line, 1.2);
    [58, 61, 64, 67].forEach((v) => {
      line(ctx, gx - 4, cy(v), gx, cy(v), C.line, 1.2);
      txt(ctx, String(v), gx - 8, cy(v) + 4, 10, C.muted, 'right', 500);
    });
    PHASES.forEach((ph) => {
      ctx.save();
      ctx.strokeStyle = ph.color;
      ctx.lineWidth = ph.p === phase ? 2.6 : 1.4;
      ctx.globalAlpha = ph.p === phase ? 1 : 0.45;
      ctx.beginPath();
      (ph.pts as unknown as [number, number][]).forEach(([s, v], i) => {
        const x = cx(s);
        const y = cy(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
      // 每点标记
      (ph.pts as unknown as [number, number][]).forEach(([s, v]) => {
        if (ph.p === phase) dot(ctx, cx(s), cy(v), 3.4, ph.color);
      });
    });
    // 当前 σ 的读数
    const mx = cx(sigma);
    const my = cy(acc);
    line(ctx, mx, gy, mx, gy + gh, C.orange, 1.2, [4, 3]);
    dot(ctx, mx, my, 5.4, C.orange);
    ring(ctx, mx, my, 10, C.orange, t);
    txt(ctx, '准确率', gx, gy - 10, 12, C.muted, 'left', 600);
    txt(ctx, '阈值', gx + gw, gy + gh + 18, 11, C.muted, 'right', 500);

    // 图例（数字）
    [5, 10, 20].forEach((p, i) => {
      const x = 700;
      const y = 170 + i * 26;
      const c = PHASES[i].color;
      line(ctx, x, y - 4, x + 18, y - 4, c, p === phase ? 3 : 1.6);
      txt(ctx, String(p), x + 26, y, 12, p === phase ? C.ink : C.muted, 'left', 700);
    });
  });

  const distilled = SIMS.filter((s) => s >= sigma).length;
  const peak = 65.88;
  const fb =
    sigma < 0.7
      ? {
          cls: 'bad',
          text: `σ=${sigma.toFixed(2)} 太松：${distilled}/20 个新同学被拉去蒸馏，里面混着本来就不像老同学的样本，旧特征被带偏，准确率只有 ${acc.toFixed(2)}%。`,
        }
      : sigma <= 0.85
      ? {
          cls: 'good',
          text: `σ=${sigma.toFixed(2)}：${distilled}/20 个最像老同学的新同学去蒸馏，其余 ${20 - distilled} 个专心学新类。论文三条曲线都在 0.8 处到顶（5 批 65.88%）。`,
        }
      : {
          cls: 'bad',
          text: `σ=${sigma.toFixed(2)} 太紧：只剩 ${distilled} 个样本参与蒸馏，等于把 MBD 关掉一半，准确率掉回 ${acc.toFixed(2)}%。`,
        };

  return (
    <div>
      <canvas ref={ref} />
      <div className="ctrl">
        <label>
          相似度阈值 σ <span className="val">{sigma.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={0.9}
          step={0.05}
          value={sigma}
          onChange={(e) => {
            setSigma(Number(e.target.value));
            setTouched(true);
          }}
        />
        <div className="chip-row" style={{ margin: 0 }}>
          {[5, 10, 20].map((p) => (
            <button
              key={p}
              className={`chip ${phase === p ? 'selected' : ''}`}
              onClick={() => setPhase(p)}
            >
              {p} 批
            </button>
          ))}
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">参与蒸馏 / 总数</div>
          <div className="v">
            {distilled}/{SIMS.length}
          </div>
        </div>
        <div className="metric">
          <div className="l">CIFAR-100 准确率（{phase} 批）</div>
          <div className="v" style={{ color: acc >= peak - 0.2 ? C.green : C.orange }}>
            {acc.toFixed(2)}%
          </div>
        </div>
        <div className="metric">
          <div className="l">论文最佳（σ=0.8）</div>
          <div className="v" style={{ color: C.green }}>65.88%</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>
        {touched ? fb.text : '拖动阈值，看哪些新同学被分去"保旧"，哪些去"学新"。曲线数据来自论文 Fig.4。'}
      </div>
    </div>
  );
}

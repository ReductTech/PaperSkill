import React, { useState } from 'react';
import { Console, ConsoleBody, C, FONT, T, fmt, Slider, Verdict } from './ewcKit';
import { A_ANCHOR, F_A, Vec } from './ewcMath';

// Fig. 3C perturbs trained weights with Gaussian noise of three shapes:
//   uniform (all weights equally), inverse Fisher (F + λI)^-1, and uniform inside the Fisher null-space.
type Dir = 'uniform' | 'inv' | 'null';
const Z: Vec = [1.0, -1.1, 0.8, -0.9];             // one fixed noise draw, for display only
const LAM0 = 1;                                    // the λ in (F + λI)^-1
const SCALE: Record<Dir, Vec> = {
  uniform: [1, 1, 1, 1],
  inv: F_A.map(f => 1 / Math.sqrt(f + LAM0)),
  // A true Fisher nullspace direction has F = 0. This toy approximates it with
  // the least-important fader (F = 0.5), because a diagonal toy has no exact
  // zero-curvature direction. The UI labels this "近似零空间" and states the
  // true-nullspace baseline (ΔL = 0) explicitly.
  null: [0, 0, 0, 1],
};
const NAME: Record<Dir, string> = { uniform: '均匀', inv: '逆 Fisher', null: '近似零空间' };
const W = 700, H = 288;

/** Expected loss increase ½ tr(F Σ) for the noise covariance Σ of each shape. */
function expectedDelta(dir: Dir, sigma: number): number {
  return 0.5 * sigma * sigma * F_A.reduce((s, f, i) => s + f * SCALE[dir][i] ** 2, 0);
}

export function EwcLimits() {
  const [dir, setDir] = useState<Dir>('uniform');
  const [sigma, setSigma] = useState(0.25);
  const theta: Vec = A_ANCHOR.map((a, i) => Math.min(1.2, Math.max(0, a + sigma * Z[i] * SCALE[dir][i])));
  const dl = expectedDelta(dir, sigma);
  const dlUniform = expectedDelta('uniform', sigma);
  return <div className="ewc-page">
    <div className="ewc-side" style={{ flex: '0 0 700px' }}>
      <div className="ewc-scene" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`对歌 A 的推子位置加${NAME[dir]}噪声，噪声强度 ${fmt(sigma)}`}>
          <ConsoleBody x={10} y={10} w={W - 20} h={H - 20} />
          <Console theta={theta} anchors={A_ANCHOR} left={120} top={46} h={160} gap={150} />
        </svg>
      </div>
      <div className="ewc-btns" role="group" aria-label="选择扰动形状">
        {(Object.keys(NAME) as Dir[]).map(d => <button key={d} className={`ewc-btn ${dir === d ? 'is-on' : ''}`} onClick={() => setDir(d)}>{NAME[d]}</button>)}
      </div>
      <Slider label="噪声强度 σ" value={sigma} min={0} max={0.5} step={0.01} onChange={setSigma} display={fmt(sigma)} />
      <div className={`ewc-kpi ${dl > 0.3 ? 'is-red' : dl > 0.08 ? '' : 'is-green'}`}>玩具模型预测的歌 A 损失增量 <b>{fmt(dl)}</b></div>
      <p className="ewc-muted">{dir === 'uniform' ? '均匀噪声同时打到重要的推子上，损失最大。'
        : dir === 'inv' ? `只沿弹簧软的方向扰动，损失仅为均匀的 ${fmt(dl / (dlUniform || 1) * 100, 0)}%。`
        : '用最不重要方向近似零空间（见右图）。'}</p>
    </div>
    <div className="ewc-side">
      <figure className="ewc-fig" style={{ height: 470 }}>
        <img src="./images/fig3c.png" alt="原论文 Figure 3C：在 Breakout 上对权重加三种扰动后的得分随扰动幅度的变化" style={{ maxHeight: 450 }} />
      </figure>
      <Verdict tone="bad">实测：近似零空间（橙）和逆 Fisher（蓝）一样掉分。真正的 Fisher 零空间应 ΔL = 0；这说明 Fisher 对不确定性过于自信。</Verdict>
    </div>
  </div>;
}

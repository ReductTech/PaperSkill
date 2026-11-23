import React, { useMemo, useState } from 'react';

const A = [-1.05, -0.82, -0.58, -0.34, -0.1, 0.14, 0.38, 0.62, 0.86, 1.1];
const NX = [0.85, -0.6, 0.75, -0.9, 0.5, -0.7, 0.95, -0.55, 0.8, -0.85];
const NY = [-0.7, 0.9, -0.55, 0.8, -0.85, 0.65, -0.75, 0.9, -0.6, 0.7];
const E = [0.18, -0.24, 0.1, 0.08, -0.15, 0.21, -0.08, 0.14, -0.19, 0.04];

const AX = (34 * Math.PI) / 180;
const AY = (42 * Math.PI) / 180;
const CX = 400;
const CY = 310;
const R = 170;

/** 两团点云：沿各自方向排开，并带独立横向噪声（常量偏移不改变相关系数）。 */
const pts = A.map((a, k) => {
  const ux = Math.cos(AX);
  const uy = Math.sin(AX);
  const px = -Math.sin(AX);
  const py = Math.cos(AX);
  const x = {
    x: CX - 46 + (a * ux + NX[k] * px) * R,
    y: CY + 20 + (a * uy + NX[k] * py) * R * 0.62,
  };
  const vx = Math.cos(AY);
  const vy = Math.sin(AY);
  const qx = -Math.sin(AY);
  const qy = Math.cos(AY);
  const b = 0.82 * a + E[k];
  const y = {
    x: CX + 46 + (b * vx + NY[k] * qx) * R,
    y: CY - 20 + (b * vy + NY[k] * qy) * R * 0.62,
  };
  return { x, y };
});

function corr(theta: number): number {
  const ex = Math.cos(theta);
  const ey = Math.sin(theta);
  const px = pts.map((p) => p.x.x * ex + p.x.y * ey);
  const py = pts.map((p) => p.y.x * ex + p.y.y * ey);
  const mx = px.reduce((s, v) => s + v, 0) / px.length;
  const my = py.reduce((s, v) => s + v, 0) / py.length;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < px.length; i += 1) {
    sxy += (px[i] - mx) * (py[i] - my);
    sxx += (px[i] - mx) ** 2;
    syy += (py[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

/** 典型方向：转动测量方向，ρ 在某个角度最大。 */
export function CcaAxis({ moduleId }: { moduleId: string }) {
  const [deg, setDeg] = useState(8);
  const theta = (deg * Math.PI) / 180;
  const rho = corr(theta);

  const curve = useMemo(() => {
    const out: { d: number; r: number }[] = [];
    for (let d = 0; d <= 180; d += 2) out.push({ d, r: corr((d * Math.PI) / 180) });
    return out;
  }, []);
  const best = useMemo(() => curve.reduce((m, p) => (Math.abs(p.r) > Math.abs(m.r) ? p : m), curve[0]), [curve]);

  const chartX = (d: number) => 96 + (d / 180) * 500;
  const chartY = (r: number) => 330 - ((r + 1) / 2) * 250;

  return (
    <div className="rs">
      <div className="rs-field rs-sheet-lines" style={{ left: 0, top: 0, width: 800, height: 622 }}>
        <svg viewBox="0 0 800 622" width="100%" height="100%" role="img" aria-label="两模态散点与可旋转方向轴">
          <rect x="24" y="24" width="752" height="574" rx="10" fill="#fdfdf8" stroke="#d7deea" strokeWidth="2" />
          <path d="M400 54V566M56 310H744" stroke="#e8edf4" strokeWidth="1.5" />
          {pts.map((p, k) => (
            <path key={`l${k}`} d={`M${p.x.x.toFixed(1)} ${p.x.y.toFixed(1)}L${p.y.x.toFixed(1)} ${p.y.y.toFixed(1)}`}
              stroke="#c9d3e2" strokeWidth="1.5" strokeDasharray="5 5" />
          ))}
          {pts.map((p, k) => (
            <circle key={`x${k}`} cx={p.x.x} cy={p.x.y} r="8" fill="#27446e" opacity="0.9" />
          ))}
          {pts.map((p, k) => (
            <circle key={`y${k}`} cx={p.y.x} cy={p.y.y} r="8" fill="#228d5c" opacity="0.9" />
          ))}

          <path d={`M${CX - Math.cos(theta) * 290} ${CY - Math.sin(theta) * 290}L${CX + Math.cos(theta) * 290} ${CY + Math.sin(theta) * 290}`}
            stroke="#f07e47" strokeWidth="4" />
          <circle cx={CX + Math.cos(theta) * 290} cy={CY + Math.sin(theta) * 290} r="13" fill="#f07e47" stroke="#fff" strokeWidth="3" />

          <text x="56" y="66" fontSize="28" fill="#27446e">画版 A（图像）</text>
          <text x="56" y="102" fontSize="28" fill="#228d5c">字版 B（文本）</text>
          <text x={CX + Math.cos(theta) * 290 - 8} y={CY + Math.sin(theta) * 290 + 44} textAnchor="middle" fontSize="26" fill="#f07e47" fontWeight="700">
            方向 θ
          </text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 824, top: 0, width: 648, height: 622 }}>
        <div className="rs-readout"><span>θ</span><b>{deg}°</b><span style={{ marginLeft: 16 }}>ρ(θ)</span>
          <b className={rho > 0.75 ? 'rs-green' : 'rs-orange'}>{rho.toFixed(2)}</b>
          <span className="rs-t muted" style={{ marginLeft: 12 }}>演示数据</span></div>
        <svg viewBox="0 0 640 380" width="100%" height="330" role="img" aria-label="相关系数随方向变化">
          <path d="M96 330H596" stroke="#b9c4d4" strokeWidth="2" />
          <path d="M96 330V56" stroke="#b9c4d4" strokeWidth="2" />
          {[-1, -0.5, 0, 0.5, 1].map((r) => (
            <g key={r}>
              <path d={`M96 ${chartY(r)}H596`} stroke="#eef2f8" strokeWidth="1.5" />
              <text x="88" y={chartY(r) + 7} textAnchor="end" className="rs-tick">{r.toFixed(1)}</text>
            </g>
          ))}
          {[0, 45, 90, 135, 180].map((d) => (
            <text key={d} x={chartX(d)} y="354" textAnchor="middle" className="rs-tick">{d}°</text>
          ))}
          <path d={curve.map((p, k) => `${k === 0 ? 'M' : 'L'}${chartX(p.d)} ${chartY(p.r)}`).join(' ')}
            fill="none" stroke="#7c3aed" strokeWidth="3.5" />
          <circle cx={chartX(best.d)} cy={chartY(best.r)} r="9" fill="#7c3aed" />
          <text x={chartX(best.d)} y={chartY(best.r) - 16} textAnchor="middle" fontSize="26" fill="#7c3aed" fontWeight="700">
            峰值 {best.r.toFixed(2)}
          </text>
          <path d={`M${chartX(deg)} 56V330`} stroke="#f07e47" strokeWidth="2.5" strokeDasharray="6 5" />
        </svg>
        <input className="rs-range" type="range" min={0} max={180} step={1} value={deg}
          onChange={(e) => setDeg(Number(e.target.value))} aria-label="测量方向" />

        <div className={`rs-feedback ${Math.abs(rho) > 0.75 ? 'good' : 'warn'}`} style={{ marginTop: 12 }}>
          {Math.abs(rho) > 0.75
            ? '两版在这条方向上高度同步——这就是典型方向。'
            : '换个方向，两版投影后的相关就掉下来了。'}
        </div>
        <p className="rs-t muted" style={{ marginTop: 10 }}>
          完整 CCA 允许两模态各用一条方向 A、B；本页简化为共用方向 θ。
        </p>
      </div>
    </div>
  );
}

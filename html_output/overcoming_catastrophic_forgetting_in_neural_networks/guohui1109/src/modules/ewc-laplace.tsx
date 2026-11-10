import React, { useState } from 'react';
import { C, FONT, T, S, fmt, clamp, curvePath, dragHandle, Verdict } from './ewcKit';

const W = 900, H = 532;
const STAR = 0.6;               // old solution θ*_A for this fader
const X_L = 70, X_R = 500, PW = 350, PT = 70, PB = 420, PHH = PB - PT;
const T0 = 0, T1 = 1.2;
const mapX = (off: number) => (t: number) => off + ((t - T0) / (T1 - T0)) * PW;
const lossY = (l: number) => PB - (l / 1.0) * PHH;
const densY = (d: number) => PB - (d / 1.6) * PHH;
const HANDLE_T = STAR + 0.3;

export function EwcLaplace() {
  const [F, setF] = useState(8);
  // Start the blue θ handle well away from the orange curvature handle (θ=0.9),
  // so the two draggable targets are visually separated and easy to grab.
  const [th, setTh] = useState(0.72);
  const sigma = 1 / Math.sqrt(F);
  const delta = th - STAR;
  const pen = 0.5 * F * delta * delta;
  const loss = (t: number) => 0.5 * F * (t - STAR) ** 2;
  const dens = (t: number) => Math.sqrt(F / (2 * Math.PI)) * Math.exp(-0.5 * F * (t - STAR) ** 2);
  const mxL = mapX(X_L), mxR = mapX(X_R);
  const setFFromY = (y: number) => setF(clamp((2 * ((PB - y) / PHH)) / ((HANDLE_T - STAR) ** 2), 0.5, 14));
  const setThFromX = (x: number) => setTh(clamp(T0 + ((x - X_L) / PW) * (T1 - T0), 0, 1.2));
  // Keep the ±σ ruler inside the posterior panel even when σ is wider than
  // the plotted θ range (low F). The density curve is clipped to the same panel.
  const sigmaPx = Math.min(sigma * PW / (T1 - T0), PW / 2 - 6);
  let verdict: React.ReactNode;
  if (F >= 8) verdict = <Verdict tone="bad">曲率大、后验窄：弹簧很硬，这个推子对旧任务很重要。</Verdict>;
  else if (F <= 2) verdict = <Verdict tone="good">曲率小、后验宽：弹簧很软，这个推子可以自由挪动。</Verdict>;
  else verdict = <Verdict tone="info">曲率居中：偏离 θ*_A 会付出适中的代价。</Verdict>;
  return <div className="ewc-page is-col" style={{ gap: 14 }}>
    <div className="ewc-formula" style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flex: 'none' }}>
      <span>log <S m="p(θ|D)：看过全部数据后参数 θ 的后验概率。">p</S>(θ|D) = log <S m="p(D_B|θ)：新任务数据的似然，等于 −L_B(θ)。">p</S>(D<sub>B</sub>|θ) + log <S m="p(θ|D_A)：只看旧任务 A 后的后验，旧任务的全部信息都压缩在它里面。">p</S>(θ|D<sub>A</sub>) − log p(D<sub>B</sub>)</span>
      <span className="ewc-formula-sub" style={{ whiteSpace: 'nowrap' }}>p(θ|D<sub>A</sub>) ≈ 高斯，精度 = <S m="F：Fisher 信息矩阵的对角元素，近似该方向上损失的曲率（二阶导）。">F</S></span>
    </div>
    <div className="ewc-page" style={{ flex: 1, minHeight: 0 }}>
      <div className="ewc-scene" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="左：旧任务损失曲线；右：近似后验。拖动橙色手柄改变曲率，拖动蓝点改变推子位置。">
          <text x={X_L} y={42} fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>旧任务损失 L_A</text>
          <text x={X_R} y={42} fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>近似后验 p(θ|D_A)</text>
          {[X_L, X_R].map(x0 => <g key={x0}>
            <line x1={x0} x2={x0 + PW} y1={PB} y2={PB} stroke={C.muted} strokeWidth="3" />
            <line x1={x0} x2={x0} y1={PT - 10} y2={PB} stroke={C.border} strokeWidth="3" />
            <text x={x0 + PW / 2} y={PB + 46} textAnchor="middle" fontSize={T.body} fill={C.muted} fontFamily={FONT}>推子位置 θᵢ</text>
            <line x1={mapX(x0)(STAR)} x2={mapX(x0)(STAR)} y1={PT} y2={PB + 8} stroke={C.blue} strokeWidth="3" strokeDasharray="8 6" />
          </g>)}
          <text x={mxL(STAR)} y={PB + 80} textAnchor="middle" fontSize={T.body} fill={C.blue} fontWeight="700" fontFamily={FONT}>θ*_A</text>
          <clipPath id="ewc-lap-l"><rect x={X_L} y={PT - 10} width={PW} height={PHH + 10} /></clipPath>
          <clipPath id="ewc-lap-r"><rect x={X_R} y={PT - 10} width={PW} height={PHH + 10} /></clipPath>
          <path d={curvePath(loss, T0, T1, 90, mxL, lossY)} fill="none" stroke={C.blue} strokeWidth="6" clipPath="url(#ewc-lap-l)" />
          <path d={curvePath(dens, T0, T1, 90, mxR, densY) + `L${mxR(T1)} ${PB} L${mxR(T0)} ${PB} Z`} fill="#228d5c33" stroke={C.green} strokeWidth="6" clipPath="url(#ewc-lap-r)" />
          {/* Clip the ±σ ruler to the posterior panel: at low F, σ can be wider
              than the panel and would otherwise draw across the loss plot and side KPIs. */}
          <line x1={mxR(STAR) - sigmaPx} x2={mxR(STAR) + sigmaPx} y1={PB - 26} y2={PB - 26}
            stroke={C.orange} strokeWidth="6" strokeLinecap="round" clipPath="url(#ewc-lap-r)" />
          <text x={mxR(STAR)} y={PB - 38} textAnchor="middle" fontSize={T.body} fontWeight="700" fill={C.orange} fontFamily={FONT}>±σ</text>
          {/* penalty guide */}
          <line x1={mxL(STAR)} x2={mxL(th)} y1={lossY(0)} y2={lossY(0)} stroke={C.orange} strokeWidth="8" strokeLinecap="round" />
          <line x1={mxL(th)} x2={mxL(th)} y1={lossY(0)} y2={Math.max(lossY(loss(th)), PT - 10)} stroke={C.orange} strokeWidth="4" strokeDasharray="6 5" />
          <circle cx={mxL(th)} cy={Math.max(lossY(loss(th)), PT - 10)} r="17" fill={C.blue} stroke="#fff" strokeWidth="4" role="slider" aria-label="推子位置 θi"
            aria-valuemin={0} aria-valuemax={1.2} aria-valuenow={Number(th.toFixed(2))}
            {...dragHandle(p => setThFromX(p.x), (k, sh) => { const s = sh ? 0.1 : 0.02; if (k === 'ArrowLeft' || k === 'ArrowDown') setTh(v => clamp(v - s, 0, 1.2)); if (k === 'ArrowRight' || k === 'ArrowUp') setTh(v => clamp(v + s, 0, 1.2)); })} />
          <circle cx={mxR(th)} cy={densY(dens(th))} r="11" fill={C.blue} stroke="#fff" strokeWidth="3" aria-hidden="true" />
          <circle cx={mxL(HANDLE_T)} cy={lossY(loss(HANDLE_T))} r="18" fill={C.orange} stroke="#fff" strokeWidth="4" role="slider" aria-label="损失曲线的曲率 F"
            aria-valuemin={0.5} aria-valuemax={14} aria-valuenow={Number(F.toFixed(1))}
            {...dragHandle(p => setFFromY(p.y), (k, sh) => { const s = sh ? 2 : 0.5; if (k === 'ArrowUp' || k === 'ArrowRight') setF(v => clamp(v + s, 0.5, 14)); if (k === 'ArrowDown' || k === 'ArrowLeft') setF(v => clamp(v - s, 0.5, 14)); })} />
          <text x={mxL(HANDLE_T) + 26} y={lossY(loss(HANDLE_T)) - 14} fontSize={T.body} fontWeight="700" fill={C.orange} fontFamily={FONT}>拖我</text>
        </svg>
      </div>
      <div className="ewc-side">
        <div className="ewc-kpis">
          <div className="ewc-kpi">曲率 F <b>{fmt(F, 1)}</b></div>
          <div className="ewc-kpi">后验宽度 σ = 1/√F <b>{fmt(sigma)}</b></div>
          <div className="ewc-kpi is-blue">弹簧势能 ½Fδ² <b>{fmt(pen)}</b></div>
        </div>
        {verdict}
      </div>
    </div>
  </div>;
}

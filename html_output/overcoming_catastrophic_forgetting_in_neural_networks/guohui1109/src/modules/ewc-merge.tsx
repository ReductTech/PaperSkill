import React, { useState } from 'react';
import { C, FONT, T, S, fmt, clamp, curvePath, dragHandle, Slider, Verdict } from './ewcKit';
import { A_ANCHOR, CHANNELS, F_A, TASK_B, fisherOf } from './ewcMath';

const W = 900, H = 580;
const X0 = 80, PW = 780, PT = 40, PB = 470, PHH = PB - PT;
const T0 = 0, T1 = 1.2, YMAX = 2.4;
const mapX = (t: number) => X0 + ((t - T0) / (T1 - T0)) * PW;
const mapY = (y: number) => PB - (clamp(y, 0, YMAX * 1.05) / YMAX) * PHH;

export function EwcMerge() {
  const [ch, setCh] = useState(0);
  const [thB, setThB] = useState(0.2);
  const [FB, setFB] = useState(fisherOf(TASK_B)[0]);
  const a = A_ANCHOR[ch], FA = F_A[ch];
  const FS = FA + FB;
  const center = (FA * a + FB * thB) / FS;
  const pa = (t: number) => 0.5 * FA * (t - a) ** 2;
  const pb = (t: number) => 0.5 * FB * (t - thB) ** 2;
  const ps = (t: number) => pa(t) + pb(t);
  const stiffer = FA > FB ? '旧任务 A（蓝）更硬，合并中心更靠近 θ*_A。' : FA < FB ? '新任务 B（橙）更硬，合并中心更靠近 θ*_B。' : '两条弹簧一样硬，合并中心在正中。';
  return <div className="ewc-page">
    <div className="ewc-scene" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="两条二次惩罚曲线与它们的和；拖动橙色顶点改变任务 B 的锚点">
        <clipPath id="ewc-merge-clip"><rect x={X0} y={PT - 6} width={PW} height={PHH + 6} /></clipPath>
        <line x1={X0} x2={X0 + PW} y1={PB} y2={PB} stroke={C.muted} strokeWidth="3" />
        <line x1={X0} x2={X0} y1={PT} y2={PB} stroke={C.border} strokeWidth="3" />
        <g clipPath="url(#ewc-merge-clip)">
          <path d={curvePath(pa, T0, T1, 120, mapX, mapY)} fill="none" stroke={C.blue} strokeWidth="6" />
          <path d={curvePath(pb, T0, T1, 120, mapX, mapY)} fill="none" stroke={C.orange} strokeWidth="6" />
          <path d={curvePath(ps, T0, T1, 120, mapX, mapY)} fill="none" stroke={C.green} strokeWidth="9" />
        </g>
        <line x1={mapX(center)} x2={mapX(center)} y1={mapY(ps(center))} y2={PB + 10} stroke={C.green} strokeWidth="4" strokeDasharray="7 6" />
        <circle cx={mapX(center)} cy={mapY(ps(center))} r="12" fill={C.green} stroke="#fff" strokeWidth="3" />
        <circle cx={mapX(a)} cy={PB} r="12" fill={C.blue} stroke="#fff" strokeWidth="3" aria-hidden="true" />
        <text x={mapX(a)} y={PB + 46} textAnchor="middle" fontSize={T.body} fontWeight="800" fill={C.blue} fontFamily={FONT}>θ*_A</text>
        <circle cx={mapX(thB)} cy={PB} r="19" fill={C.orange} stroke="#fff" strokeWidth="4" role="slider" aria-label="任务 B 的锚点 θ*_B"
          aria-valuemin={0} aria-valuemax={1.2} aria-valuenow={Number(thB.toFixed(2))}
          {...dragHandle(p => setThB(clamp(T0 + ((p.x - X0) / PW) * (T1 - T0), 0, 1.2)), (k, sh) => { const s = sh ? 0.1 : 0.02; if (k === 'ArrowLeft' || k === 'ArrowDown') setThB(v => clamp(v - s, 0, 1.2)); if (k === 'ArrowRight' || k === 'ArrowUp') setThB(v => clamp(v + s, 0, 1.2)); })} />
        <text x={mapX(thB)} y={PB + 46} textAnchor="middle" fontSize={T.body} fontWeight="800" fill={C.orange} fontFamily={FONT}>θ*_B</text>
        {[['A 的弹簧', C.blue], ['B 的弹簧', C.orange], ['两条之和', C.green]].map(([n, col], i) => <g key={n} transform={`translate(${X0 + i * 250} ${H - 24})`}>
          <line x1="0" x2="40" y1="-9" y2="-9" stroke={col} strokeWidth="7" strokeLinecap="round" />
          <text x="52" y="0" fontSize={T.body} fontWeight="700" fill={col} fontFamily={FONT}>{n}</text>
        </g>)}
      </svg>
    </div>
    <div className="ewc-side">
      <div className="ewc-btns" role="group" aria-label="选择推子">
        {CHANNELS.map((c, i) => <button key={c} className={`ewc-btn ${ch === i ? 'is-on' : ''}`}
          onClick={() => { setCh(i); setFB(fisherOf(TASK_B)[i]); }}>{c}</button>)}
      </div>
      <Slider label="任务 B 的刚度 F_B" value={FB} min={0.5} max={14} step={0.5} onChange={setFB} display={fmt(FB, 1)} color={C.orange} />
      <div className="ewc-formula" style={{ fontSize: 'var(--ppt-body-text)' }}>
        <S m="F_A+B：合并后弹簧的刚度，等于两条弹簧刚度相加。">F</S><sub>A+B</sub> = {fmt(FA, 1)} + {fmt(FB, 1)} = <b>{fmt(FS, 1)}</b><br />
        <S m="θ̄：合并弹簧的中心，是两个锚点按刚度加权的平均。">θ̄</S> = (F<sub>A</sub>θ*<sub>A</sub> + F<sub>B</sub>θ*<sub>B</sub>) / F<sub>A+B</sub> = <b>{fmt(center)}</b>
      </div>
      <Verdict tone="info">{stiffer}和仍是一条抛物线：不必为每个旧任务单独存一条弹簧。</Verdict>
    </div>
  </div>;
}

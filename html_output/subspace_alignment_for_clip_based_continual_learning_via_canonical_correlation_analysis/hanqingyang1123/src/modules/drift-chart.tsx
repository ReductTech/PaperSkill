import React, { useState } from 'react';

// 第 1 个任务两条漂移同从 0 起步（论文图 3a）；末段准确率小幅回升（图 3b）。
const DV = [0, 0.16, 0.24, 0.31, 0.37, 0.43, 0.48, 0.53, 0.57, 0.62];
const DT = [0, 0.05, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.15];
const DIST = [0.3, 0.35, 0.4, 0.45, 0.5, 0.56, 0.62, 0.68, 0.73, 0.78];
const ACC = [84.5, 82.6, 80.7, 78.6, 76.4, 74.6, 73.1, 71.6, 70.4, 70.9];

/** 漂移与距离：游标选任务，两图同步读数。曲线按论文 Fig.3 的定性形状重绘。 */
export function DriftChart({ moduleId }: { moduleId: string }) {
  const [t, setT] = useState(5);
  const i = t - 1;

  const px = (k: number) => 78 + (k * 664) / 9;
  const pyDrift = (v: number) => 392 - (v / 0.7) * 348;
  const pyAcc = (v: number) => 392 - ((v - 60) / 30) * 348;

  const line = (vals: number[], f: (v: number) => number) =>
    vals.map((v, k) => `${k === 0 ? 'M' : 'L'}${px(k).toFixed(1)} ${f(v).toFixed(1)}`).join(' ');

  return (
    <div className="rs">
      <div className="rs-panel" style={{ left: 0, top: 0, width: 820, height: 622 }}>
        <div className="rs-legend" style={{ marginBottom: 4 }}>
          <span><i className="rs-dot" style={{ background: '#27446e' }} />视觉漂移 Δv</span>
          <span><i className="rs-dot" style={{ background: '#228d5c' }} />文本漂移 Δt</span>
          <span><i className="rs-dot" style={{ background: '#c43f52' }} />模态距离</span>
        </div>
        <svg viewBox="0 0 780 430" width="100%" height="430" role="img" aria-label="漂移随时间变化曲线">
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7].map((v) => (
            <g key={v}>
              <path d={`M78 ${pyDrift(v)}H742`} stroke="#e8edf4" strokeWidth="1.5" />
              <text x="66" y={pyDrift(v) + 7} textAnchor="end" className="rs-tick">{v.toFixed(1)}</text>
            </g>
          ))}
          <path d={`M78 392H742`} stroke="#b9c4d4" strokeWidth="2" />
          <path d="M78 34V392" stroke="#b9c4d4" strokeWidth="2" />
          {DV.map((_, k) => (
            <text key={k} x={px(k)} y="416" textAnchor="middle" className="rs-tick">{k + 1}</text>
          ))}
          <path d={line(DV, pyDrift)} fill="none" stroke="#27446e" strokeWidth="4" strokeLinejoin="round" />
          <path d={line(DT, pyDrift)} fill="none" stroke="#228d5c" strokeWidth="4" strokeLinejoin="round" />
          <path d={line(DIST, pyDrift)} fill="none" stroke="#c43f52" strokeWidth="3" strokeDasharray="10 7" strokeLinejoin="round" />
          {DV.map((v, k) => (
            <circle key={`dv${k}`} cx={px(k)} cy={pyDrift(v)} r={k === i ? 9 : 5} fill={k === i ? '#27446e' : '#fff'} stroke="#27446e" strokeWidth="2" />
          ))}
          {DT.map((v, k) => (
            <circle key={`dt${k}`} cx={px(k)} cy={pyDrift(v)} r={k === i ? 9 : 5} fill={k === i ? '#228d5c' : '#fff'} stroke="#228d5c" strokeWidth="2" />
          ))}
          <path d={`M${px(i)} 34V392`} stroke="#f07e47" strokeWidth="2.5" strokeDasharray="6 5" />
          <text x={px(i)} y="24" textAnchor="middle" fontSize="26" fill="#f07e47" fontWeight="700">t={t}</text>
        </svg>
        <input className="rs-range" type="range" min={1} max={10} step={1} value={t}
          onChange={(e) => setT(Number(e.target.value))} aria-label="选择任务" />
      </div>

      <div className="rs-panel" style={{ left: 852, top: 0, width: 620, height: 622 }}>
        <div className="rs-readout"><span>Δv</span><b className="rs-blue">{DV[i].toFixed(2)}</b>
          <span style={{ marginLeft: 12 }}>Δt</span><b className="rs-green">{DT[i].toFixed(2)}</b></div>
        <div className="rs-readout" style={{ marginTop: 10 }}><span>模态距离</span><b className="rs-red">{DIST[i].toFixed(2)}</b></div>
        <div className="rs-readout" style={{ marginTop: 6 }}><span>该任务后准确率</span><b>{ACC[i].toFixed(1)}%</b></div>

        <div className={`rs-feedback ${DV[i] - DT[i] > 0.3 ? 'bad' : 'warn'}`} style={{ marginTop: 18 }}>
          第 2 个任务起 Δv 高于 Δt：两版不是一起走，而是画版在跑。
        </div>
        <p className="rs-t muted" style={{ marginTop: 16 }}>
          距离持续上升，准确率总体下降（末段略有回升）。论文把这种同步变化作为非对称漂移有害的证据。
        </p>
        <p className="rs-t muted" style={{ marginTop: 12 }}>
          度量定义：Δv、Δt 为相邻任务平均特征均值的 L2 变化；距离为任务内图文对的平均 L2 距离。
        </p>
        <p className="rs-t muted" style={{ marginTop: 12, opacity: 0.75 }}>
          曲线按 Fig.3 的定性形状重绘，读数为示意值。
        </p>
      </div>
    </div>
  );
}

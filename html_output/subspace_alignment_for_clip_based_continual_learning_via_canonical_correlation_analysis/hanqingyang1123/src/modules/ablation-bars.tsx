import React, { useState } from 'react';

const W = [2048, 4096, 6144, 8192, 10240];
const W_ACC = [79.7, 80.3, 81.0, 80.6, 80.2];
const W_MEM = [3.1, 4.3, 6.3, 8.8, 11.9];
const ETA = ['0.9', '0.95', '0.99', '0.999', '1'];
const ETA_ACC = [76.5, 80.3, 81.0, 80.9, 80.8];

/** 消融与代价：三组件增益、RFP 宽度折中、η 饱和、总时长。 */
export function AblationBars({ moduleId }: { moduleId: string }) {
  const [cca, setCca] = useState(true);
  const [rfp, setRfp] = useState(true);
  const [ftt, setFtt] = useState(true);

  const level = !cca ? 0 : !rfp ? 1 : !ftt ? 2 : 3;
  const acc = [66.7, 76.5, 81.0, 83.0][level];
  const label = ['仅冻结 CLIP', 'CCA', 'CCA + RFP', 'CCA + RFP + FTT'][level];

  const toggle = (setter: (v: boolean) => void, value: boolean, disabled: boolean) => {
    if (disabled) return;
    setter(!value);
  };

  // 表 2 只报告了 CCA、CCA+RFP、CCA+RFP+FTT 三种组合：撤掉 RFP 时 FTT 必须一并取消。
  const toggleRfp = () => {
    if (!cca) return;
    const next = !rfp;
    setRfp(next);
    if (!next) setFtt(false);
  };

  const bars = [
    { name: '基线', v: 66.7 },
    { name: '+CCA', v: 76.5 },
    { name: '+RFP', v: 81.0 },
    { name: '+FTT', v: 83.0 },
  ];

  return (
    <div className="rs">
      <div className="rs-panel" style={{ left: 0, top: 0, width: 700, height: 622 }}>
        <div className="rs-readout">
          <span>当前配置</span><b>{label}</b>
          <span style={{ marginLeft: 12 }}>Last</span><b className="rs-green">{acc.toFixed(1)}%</b>
        </div>
        <svg viewBox="0 0 660 420" width="100%" height="400" role="img" aria-label="组件消融柱状图">
          <path d="M70 360H630" stroke="#b9c4d4" strokeWidth="2" />
          {bars.map((b, i) => {
            const h = ((b.v - 60) / 25) * 300;
            const x = 110 + i * 130;
            const on = i <= level;
            return (
              <g key={b.name}>
                <rect x={x} y={360 - h} width="86" height={h} rx="6"
                  fill={on ? '#27446e' : '#e2e8f1'} opacity={on ? 0.9 : 1} />
                <text x={x + 43} y={360 - h - 14} textAnchor="middle" fontSize="28" fontWeight={on ? 700 : 400}
                  fill={on ? '#21324a' : '#8b97ab'}>{b.v.toFixed(1)}</text>
                <text x={x + 43} y="392" textAnchor="middle" className="rs-tag">{b.name}</text>
              </g>
            );
          })}
          {[70, 75, 80, 85].map((v) => (
            <text key={v} x="60" y={360 - ((v - 60) / 25) * 300 + 7} textAnchor="end" className="rs-tick">{v}</text>
          ))}
        </svg>
        <div className="rs-choices" style={{ marginTop: 4 }}>
          <button className={`rs-choice ${cca ? 'is-on' : ''}`} onClick={() => toggle(setCca, cca, false)}>CCA</button>
          <button className={`rs-choice ${rfp ? 'is-on alt' : ''} ${!cca ? 'is-off' : ''}`}
            onClick={toggleRfp}>RFP</button>
          <button className={`rs-choice ${ftt ? 'is-on alt' : ''} ${!cca || !rfp ? 'is-off' : ''}`}
            onClick={() => toggle(setFtt, ftt, !cca || !rfp)}>FTT</button>
        </div>
        <p className="rs-t muted" style={{ marginTop: 6 }}>
          取消 CCA 后表 2 没有对应组合，所以 RFP 与 FTT 置灰。
        </p>
      </div>

      <div className="rs-panel" style={{ left: 724, top: 0, width: 380, height: 622 }}>
        <p className="rs-t muted">RFP 宽度 W（显存 / 精度）</p>
        <svg viewBox="0 0 340 250" width="100%" height="240" role="img" aria-label="RFP 宽度与显存">
          {W.map((w, i) => {
            const h = (W_MEM[i] / 12) * 170;
            const x = 30 + i * 62;
            const best = i === 2;
            return (
              <g key={w}>
                <rect x={x} y={200 - h} width="40" height={h} rx="5" fill={best ? '#f07e47' : '#c9d3e2'} />
                <text x={x + 20} y={200 - h - 8} textAnchor="middle" fontSize="22" fill={best ? '#8a4416' : '#68778f'}>
                  {W_ACC[i].toFixed(1)}
                </text>
                <text x={x + 20} y="220" textAnchor="middle" className="rs-tick">{w / 1024}k</text>
              </g>
            );
          })}
        </svg>
        <p className="rs-t muted">W=6144 时 6.3 GB、81.0%，是折中点。</p>
        <p className="rs-t muted" style={{ marginTop: 10 }}>总时长（CIFAR-100）</p>
        <p className="rs-num rs-green">5.8<span style={{ fontSize: 28 }}> 分钟</span></p>
        <p className="rs-t muted">图 4：RAPF 13.9、ENGINE 85.8、SLCA 79.2 分钟。</p>
      </div>

      <div className="rs-panel" style={{ left: 1128, top: 0, width: 344, height: 622 }}>
        <p className="rs-t muted">能量阈值 η（Last %）</p>
        <svg viewBox="0 0 300 230" width="100%" height="220" role="img" aria-label="能量阈值敏感性">
          {ETA_ACC.map((v, i) => {
            const h = ((v - 74) / 8) * 150;
            const x = 20 + i * 54;
            const best = i === 2;
            return (
              <g key={i}>
                <rect x={x} y={190 - h} width="38" height={h} rx="4" fill={best ? '#228d5c' : '#c9d3e2'} />
                <text x={x + 19} y={190 - h - 8} textAnchor="middle" fontSize="22" fill={best ? '#175f3d' : '#68778f'}>{v.toFixed(1)}</text>
                <text x={x + 19} y="210" textAnchor="middle" className="rs-tick">{ETA[i]}</text>
              </g>
            );
          })}
        </svg>
        <p className="rs-t muted">0.99 之后饱和，全保留反而降到 80.8%。</p>
        <div className="rs-feedback good" style={{ marginTop: 12 }}>
          三个组件各管一件事：对齐、补非线性、补下游适配。
        </div>
      </div>
    </div>
  );
}

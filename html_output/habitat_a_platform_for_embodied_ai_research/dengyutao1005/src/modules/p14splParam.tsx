import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// P14 多参数联动：成功 S（开关）× 实际轨迹 p（滑块）× 固定 l，联动输出 SPL 与拆解。
export const P14SplParam: React.FC<WidgetProps> = () => {
  const [S, setS] = useState(1);
  const [p, setP] = useState(14);
  const l = 10;
  const spl = (S * l) / Math.max(p, l);
  return (
    <div className="spl-mod">
      <div className="spl-params">
        <div className={`spl-stat ${S ? 'good' : 'bad'}`}><span className="spl-num">S = {S}</span><span>成功指示</span></div>
        <div className="spl-stat"><span className="spl-num">p = {p}</span><span>实际轨迹</span></div>
        <div className="spl-stat hero"><span className="spl-num">{spl.toFixed(2)}</span><span>SPL</span></div>
      </div>
      <div className="ctrl">
        <label>成功与否 S</label>
        <button className={`spl-sbtn ${S ? 'on' : 'off'}`} onClick={() => setS(S ? 0 : 1)}>
          {S ? '✓ 已送达（S=1）' : '✗ 未送达（S=0）'}
        </button>
      </div>
      <div className="ctrl">
        <label>实际轨迹长度 p <span className="val">{p}</span></label>
        <input type="range" min={6} max={24} value={p} onChange={(e) => setP(Number(e.target.value))} />
      </div>
      <div className="spl-formula">
        SPL = {S} × {l} / max({p}, {l}) = <strong>{spl.toFixed(2)}</strong>
      </div>
      <div className={`feedback ${S ? 'good' : 'bad'}`}>
        {S === 0
          ? '未送达 → S=0 → SPL 恒为 0：SPL 同时惩罚“没送到”与“绕路”（§4）。'
          : p <= l
          ? 'S=1 且走最短路线 → SPL=1（满分）。'
          : `S=1 但绕路 → SPL = 10/${p} = ${spl.toFixed(2)}，比单纯成功率严格得多。`}
      </div>
    </div>
  );
};

export default P14SplParam;

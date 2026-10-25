import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// P1 滑块：固定成功(S=1)、最短路径 l=10，拖动实际轨迹 p，看 SPL = S·l/max(p,l) 变化。
export const P1SplSlider: React.FC<WidgetProps> = () => {
  const [p, setP] = useState(10);
  const l = 10;
  const spl = (1 * l) / Math.max(p, l);
  return (
    <div className="spl-mod">
      <div className="spl-params">
        <div className="spl-stat"><span className="spl-num">l = {l}</span><span>最短路径</span></div>
        <div className="spl-stat"><span className="spl-num">p = {p}</span><span>实际轨迹</span></div>
        <div className="spl-stat hero"><span className="spl-num">{spl.toFixed(2)}</span><span>SPL</span></div>
      </div>
      <div className="ctrl">
        <label>实际轨迹长度 p <span className="val">{p}</span></label>
        <input type="range" min={5} max={25} value={p} onChange={(e) => setP(Number(e.target.value))} />
      </div>
      <div className="spl-bar">
        <div className="spl-bar-fill" style={{ width: `${spl * 100}%` }} />
      </div>
      <div className="feedback good">
        {p <= l
          ? '走得比最短路径还短？不可能——SPL 封顶为 1（走最短路线满分）。'
          : `绕路！p=${p} > l=${l}，SPL = 10/${p} = ${spl.toFixed(2)}，越绕越低（§4 Evaluation）。`}
      </div>
    </div>
  );
};

export default P1SplSlider;

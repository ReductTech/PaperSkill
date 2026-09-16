import { useState } from 'react';
export function ExtremityGate() {
  const [e, setE] = useState(0.35);
  return (
    <div className="module">
      <label>极端图 E：<strong>{e.toFixed(2)}</strong>
        <input type="range" min="0" max="1" step="0.01" value={e} onChange={ev => setE(+ev.target.value)} />
      </label>
      <p>{e < 0.5 ? '以 Q_base 为主，保留可信局部结构。' : '以 Q_ref 补充极端曝光区域。'}</p>
    </div>
  );
}
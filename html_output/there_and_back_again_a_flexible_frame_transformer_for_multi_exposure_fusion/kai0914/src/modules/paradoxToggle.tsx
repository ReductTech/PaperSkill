import { useState } from 'react';
export function ParadoxToggle() {
  const [eaha, setEaha] = useState(false);
  return (
    <div className="module">
      <label><input type="checkbox" checked={eaha} onChange={e => setEaha(e.target.checked)} /> 启用 EAHA</label>
      <p>{eaha ? 'EAHA 在饱和区域切换到 Q_ref。' : '传统交叉注意力在饱和区域权重低。'}</p>
    </div>
  );
}
import { useState } from 'react';
export function DcnAlign() {
  const [aligned, setAligned] = useState(false);
  return (
    <div className="module">
      <button onClick={() => setAligned(a => !a)}>{aligned ? '已对齐' : '点击对齐'}</button>
      <p>{aligned ? 'DCN 已完成特征空间对齐。' : '当前特征与历史状态错位。'}</p>
    </div>
  );
}
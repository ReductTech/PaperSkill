import { useState } from 'react';
export function FrameCountSlider() {
  const [frames, setFrames] = useState(3);
  return (
    <div className="module">
      <label>总帧数：<strong>{frames} 帧</strong>
        <input type="range" min="2" max="5" value={frames} onChange={e => setFrames(+e.target.value)} />
      </label>
      <p>FreeMEF 用同一模型处理 {frames} 帧输入。</p>
    </div>
  );
}
import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export const SecTwnvReconstruction: React.FC<WidgetProps> = () => {
  const [mode,setMode] = useState<'single'|'novel'>('single');
  const novel = mode === 'novel';
  return <div className="reconstruction-check">
    <div className="recon-tabs">
      <button className={!novel ? 'active' : ''} onClick={() => setMode('single')}><b>INPUT</b><span>只用单张原图</span></button>
      <button className={novel ? 'active' : ''} onClick={() => setMode('novel')}><b>INPUT + NOVEL VIEWS</b><span>加入生成的新视角</span></button>
    </div>
    <div className="recon-logic">
      <div><b>01 · GENERATE</b><span>{novel ? 'JoyAI-Image-Edit 改变相机视角，生成多张观察图。' : '只有原始输入 I₀，没有补充观察。'}</span></div><i>→</i>
      <div><b>02 · RECONSTRUCT</b><span>{novel ? 'VGGT 联合原图与新视角恢复点云及相机姿态。' : 'VGGT 只能从单图推测不可见区域。'}</span></div><i>→</i>
      <div className={novel ? 'positive' : 'limited'}><b>03 · CHECK</b><span>{novel ? '点云更稠密，布局、表面与物体位置更完整。' : '重建稀疏且不完整。'}</span></div>
    </div>
    <div className={`recon-verdict ${novel ? 'positive' : ''}`}>
      <b>{novel ? '几何一致性得到间接支持' : '单图证据不足'}</b>
      <p>{novel ? '如果新视角只有局部照片真实感，却在相机运动、物体位置或场景几何上互相矛盾，加入它们通常会让重建更差；Figure 15 中重建反而明显改善。' : '单图无法覆盖遮挡面，稀疏重建本身不能检验生成视角是否可靠。'}</p>
    </div>
    <div className="feedback">注意：这是下游重建的定性验证，不是论文报告的独立数值指标，也不能证明生成视角在所有像素上严格满足真实投影。</div>
  </div>;
};

export default SecTwnvReconstruction;

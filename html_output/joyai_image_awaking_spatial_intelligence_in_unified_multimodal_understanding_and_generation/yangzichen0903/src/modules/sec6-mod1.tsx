import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type View = 'aside' | 'center';

function ViewScene({ kind, active, onClick }: { kind: View; active: boolean; onClick: () => void }) {
  const center = kind === 'center';
  return <button className={`tw-fixed-view ${center ? 'center-view' : 'a-side-view'} ${active ? 'active' : ''}`} onClick={onClick}>
    <header><b>{center ? 'VIEW I₁ · 从侧面中间看' : 'VIEW I₀ · 从 A 那面看'}</b><span>{center ? '补充视角' : '原始视角'}</span></header>
    <div className="tw-fixed-scene">
      <div className="tw-fixed-floor" />
      <div className="tw-fixed-a"><b>A</b><span>物体 A</span></div>
      <div className="tw-fixed-obstacle">障碍物</div>
      <div className="tw-fixed-b"><b>B</b><span>物体 B</span></div>
      <div className="tw-view-camera">⌾<span>{center ? '中间机位 C₁' : 'A 侧机位 C₀'}</span></div>
      <div className={`tw-view-status ${center ? 'visible' : ''}`}>{center ? '✓ 三者投影分离' : '? B 被遮挡'}</div>
    </div>
  </button>;
}

export const Sec6Mod1: React.FC<WidgetProps> = () => {
  const [view,setView] = useState<View>('aside');
  const center = view === 'center';
  return <div className="twnv-two-view">
    <div className="tw-two-view-intro"><b>同一场景 · 两个观察位置</b><span>A—障碍物—B 位于同一直线上且始终不动，只改变相机站位。</span></div>
    <div className="tw-fixed-grid">
      <ViewScene kind="aside" active={!center} onClick={() => setView('aside')} />
      <ViewScene kind="center" active={center} onClick={() => setView('center')} />
    </div>
    <div className="twnv-pipeline-state">
      <div className={center ? 'done' : ''}><b>PLANNER</b><span>{center ? '选择侧向机位 C₁' : '发现 B 被遮挡'}</span></div><i>→</i>
      <div className={center ? 'done' : ''}><b>SYNTHESIZER</b><span>{center ? '生成中间视角 I₁' : '等待视角指令'}</span></div><i>→</i>
      <div className={center ? 'done' : ''}><b>REASONER</b><span>{center ? '联合 {I₀, I₁} 作答' : '仅凭 I₀ 证据不足'}</span></div>
    </div>
    <div className={`feedback ${center ? 'good' : 'bad'}`}>{center ? '从侧面中间看时，投影顺序为 A—障碍物—B，三个对象都能被区分。' : '从 A 那面看时，视线依次经过 A、障碍物和 B；障碍物在 A 的纵深后方，而不是 A 的右边。'}</div>
  </div>;
};

export default Sec6Mod1;

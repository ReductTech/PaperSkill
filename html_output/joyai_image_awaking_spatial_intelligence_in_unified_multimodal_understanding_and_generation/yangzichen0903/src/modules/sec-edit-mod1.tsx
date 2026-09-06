import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const MODES = [
  {
    id:'attribute', label:'属性修改', instruction:'把蓝色花瓶改成粉色',
    change:'花瓶颜色', preserve:['花瓶位置与轮廓','桌面、窗户和背景','相机视角与光照'],
    failure:'如果花瓶移动或房间被重画，即使颜色正确也不算成功。'
  },
  {
    id:'object', label:'物体变换', instruction:'把花瓶移动到桌面左侧',
    change:'花瓶空间位置', preserve:['花瓶身份、颜色与尺寸','桌面和窗户布局','相机视角与背景'],
    failure:'如果只在左侧新画一个花瓶、旧花瓶仍存在，就不是“移动”。'
  },
  {
    id:'camera', label:'相机变换', instruction:'相机向右环绕并轻微拉近',
    change:'观察视角与画面 framing', preserve:['同一花瓶与同一房间','物体之间的 3D 关系','场景内容与对象身份'],
    failure:'如果得到另一间相似房间，而非同一场景的新视角，几何控制就失败。'
  }
] as const;

function Room({ edited, mode }: { edited: boolean; mode: string }) {
  const isCamera = mode === 'camera';
  const moved = edited && mode === 'object';
  const recolored = edited && mode === 'attribute';
  return <div className={`edit-room ${edited ? 'edited' : 'source'} ${isCamera && edited ? 'camera-shift' : ''}`}>
    <div className="edit-window"><i /><i /><i /><i /></div>
    <div className="edit-picture" />
    <div className="edit-table">
      <div className={`edit-vase ${moved ? 'moved' : ''} ${recolored ? 'recolored' : ''}`}><i /></div>
      <div className="edit-book" />
    </div>
    {edited ? <div className={`edit-change-ring ${mode}`}><span>CHANGE</span></div> : null}
    <div className="edit-lock lock-bg">▣<span>背景</span></div>
    <div className="edit-lock lock-id">▣<span>身份</span></div>
    {isCamera ? <div className="edit-camera-mark">⌖<span>{edited ? '新视角' : '原视角'}</span></div> : null}
  </div>;
}

export const SecEditMod1: React.FC<WidgetProps> = () => {
  const [mode,setMode] = useState(0);
  const current = MODES[mode];
  return <div className="edit-constraint-checker">
    <div className="edit-mode-tabs">
      {MODES.map((item,index) => <button key={item.id} className={mode === index ? 'active' : ''} onClick={() => setMode(index)}><b>0{index + 1}</b><span>{item.label}</span></button>)}
    </div>
    <div className="edit-instruction"><b>INSTRUCTION</b><span>“{current.instruction}”</span></div>
    <div className="edit-compare">
      <section><header><b>SOURCE</b><span>输入图像</span></header><Room edited={false} mode={current.id} /></section>
      <div className="edit-operation"><span>→</span><b>{current.label}</b></div>
      <section><header><b>EDITED</b><span>目标结果</span></header><Room edited mode={current.id} /></section>
    </div>
    <div className="edit-constraint-row">
      <article className="change"><b>CHANGE · 允许变化</b><strong>{current.change}</strong></article>
      <article className="preserve"><b>PRESERVE · 必须锁定</b><div>{current.preserve.map(item => <span key={item}>✓ {item}</span>)}</div></article>
    </div>
    <div className="feedback bad"><b>失败条件：</b>{current.failure}</div>
  </div>;
};

export default SecEditMod1;

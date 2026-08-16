import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const CASES = [
  { short:'颜色', instruction:'衣服改成红色', change:'衣服颜色', preserve:'人物 · 姿态 · 背景', icon:'●' },
  { short:'移动', instruction:'花瓶移到左侧', change:'花瓶位置', preserve:'身份 · 相机 · 其他物体', icon:'↔' },
  { short:'视角', instruction:'相机向右环绕', change:'视角与构图', preserve:'同一场景 · 3D 关系', icon:'◒' }
] as const;

export const Sec6Ana: React.FC<WidgetProps> = () => {
  const [active,setActive] = useState(0);
  const item = CASES[active];
  return <div className="edit-contract-mini">
    <div className="contract-tabs">
      {CASES.map((entry,index) => <button key={entry.short} className={active === index ? 'active' : ''} onClick={() => setActive(index)}>{entry.short}</button>)}
    </div>
    <div className="contract-prompt"><b>指令</b><span>{item.instruction}</span></div>
    <div className="contract-subject"><i>{item.icon}</i><span>编辑边界随指令变化</span></div>
    <div className="contract-split">
      <div className="change"><b>CHANGE</b><span>{item.change}</span></div>
      <div className="keep"><b>PRESERVE</b><span>{item.preserve}</span></div>
    </div>
  </div>;
};

export default Sec6Ana;

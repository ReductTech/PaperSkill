import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const CASES = [
  {
    tab:'Case 1 · 高度比较', question:'钟塔上的时钟与房屋，哪一个位置更高？', answer:'GT：House',
    motion:'T=(0.0, −2.3, 0.0)m；pitch 20°，yaw 0°，roll 0°',
    reading:'Planner 选择俯仰并调整观察位置，使钟塔与房屋的垂直排序更容易直接核对。'
  },
  {
    tab:'Case 2 · 垂直关系', question:'交通灯是否正好位于雨伞上方？', answer:'GT：No',
    motion:'T=(1.5, 0.0, 0.0)m；pitch 0°，yaw −20°，roll 0°',
    reading:'Planner 选择横向移动与旋转，使交通灯和雨伞不再因单视角投影而呈现“似乎上下对齐”。'
  }
] as const;

export const SecTwnvCases: React.FC<WidgetProps> = () => {
  const [active,setActive] = useState(0);
  const item = CASES[active];
  return <div className="twnv-case-reader">
    <div className="case-reader-tabs">{CASES.map((entry,index) => <button className={active === index ? 'active' : ''} key={entry.tab} onClick={() => setActive(index)}>{entry.tab}</button>)}</div>
    <div className="case-reader-card">
      <div><b>QUESTION</b><span>{item.question}</span></div>
      <div><b>CAMERA MOTION</b><span>{item.motion}</span></div>
      <div><b>GROUND TRUTH</b><strong>{item.answer}</strong></div>
    </div>
    <div className="feedback good">{item.reading}</div>
  </div>;
};

export default SecTwnvCases;

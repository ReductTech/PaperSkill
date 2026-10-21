import React, {useState} from 'react';

export const HeroTimeline: React.FC<{chapterId:string;moduleId:string}> = ({moduleId}) => {
  const isNew=moduleId==='new';
  const [filled,setFilled]=useState(false);
  const marks=isNew&&filled?[5,13,22,31,40,49,58,67,76,85,94]:[12,76];
  return <div className="lv-hero-timeline">
    <div className="lv-hero-film" aria-label="视频片段的时间轴"><span>00:00</span><span>00:20</span><span>00:40</span><span>01:00</span></div>
    <div className="lv-hero-track">{marks.map((x,i)=><span key={i} className={isNew&&filled?'lv-mark new':'lv-mark'} style={{left:`${x}%`}} title={isNew&&filled?'Narrator 示意描述':'人工描述'}/>)}</div>
    <div className="lv-hero-label">{isNew&&filled?'Narrator 生成的密集描述（教学示意）':'稀疏人工描述'}</div>
    {isNew&&<><button className="lv-action" onClick={()=>setFilled(!filled)}>{filled?'收起生成示意':'让 LLM 补全时间轴'}</button>{filled&&<div className="lv-hero-keywords"><span>Dense</span><span>Aligned</span><span>Diverse</span></div>}</>}
  </div>;
};

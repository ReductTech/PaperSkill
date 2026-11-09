/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsTask: React.FC<WidgetProps> = () => {
 const [mode,setMode]=useState<'what'|'when'>('when');
 return <div className="ts-widget"><div className="ts-toolbar" role="group" aria-label="任务类型"><Chip active={mode==='what'} onClick={()=>setMode('what')}>What · 发生了什么</Chip><Chip active={mode==='when'} onClick={()=>setMode('when')}>When · 什么时候</Chip></div><Tag kind="paper">论文 Figure 1 示例</Tag><div className="ts-split"><div className="ts-card"><b>Query / 查询</b><p>“person turns on the light”<br/>一个人打开了灯</p><Timeline target={mode==='when'} candidate={1}/><small>真值区间：13.9–22.4 秒（论文图示）</small></div><div className="ts-card ts-answer"><b>{mode==='what'?'内容答案':'定位结果'}</b><h3>{mode==='what'?'一个人打开了灯':'13.9–22.4 秒'}</h3><p>{mode==='what'?'说出了事件内容，但还没有给出时间边界。':'内容与时间区间都要对上，才完成时序定位。'}</p></div></div><Feedback>{mode==='what'?'Video QA 回答内容；时序定位还必须指出事件发生的时间段。':'现在答案包含起点和终点：模型需要在长视频中找到对应片段。'}</Feedback></div>;
};

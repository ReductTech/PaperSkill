import React, { useState } from 'react';
import { Canvas, Chips, Steps, Feedback, Detail, clearScene, drawPhoto, drawCard, drawBars, drawPen, colors, softmax, projectionStep } from './llava-kit';
const practice=[
 {q:'船在房屋哪一侧？',a:'船在房屋右侧。',note:'对话关注具体问题，也可以多轮追问。',count:58000,highlight:'boat' as const},
 {q:'请详细描述画面。',a:'画面左侧是一座带屋顶和窗户的房屋，右侧有一艘船；两者都在这张图里。',note:'详细描述把类别名展开成屋顶、窗户和相对位置，让回答包含更多画面细节。',count:23000,highlight:'all' as const},
 {q:'只看到三角形，能确定它是屋顶还是船帆吗？',a:'要看三角形周围有什么：下方有墙和窗时更像屋顶，连着桅杆和船身时更像船帆。',note:'三角形配上墙和窗，更像屋顶；配上桅杆和船身，更像船帆。推理把这些线索连成判断的理由。',count:77000,highlight:'house' as const}
];
export function M5B(){const [type,setType]=useState(0);const p=practice[type];return <>
 <Canvas label="同一场景的练习类型与论文数据数量" draw={ctx=>{clearScene(ctx);drawPhoto(ctx,30,30,410,220,{highlight:p.highlight});drawBars(ctx,practice.map(x=>x.count),{x:550,y:35,width:470,height:205,max:80000,colors:practice.map((_,i)=>i===type?colors.orange:colors.light)});}}/>
 <Chips labels={['对话','详细描述','复杂推理']} value={type} onChange={setType} label="训练题类型"/>
 <Detail><b>本教程编写的问答示意</b><div>问题：{p.q}</div><div>参考回答：{p.a}</div><div>论文对应类型：{p.count.toLocaleString()} 条。三类总计158,000条，柱高使用相同的0—80,000尺度。</div></Detail><Feedback>{p.note}</Feedback></>}

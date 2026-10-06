import React, {useState,useEffect,useRef} from 'react';
import {Controls,Button,Feedback} from './scene-kit';
import {Novelty,Grounding,Review,Request,Skills,Dialogue,Training,System,Compose,Results,metrics} from './WideScenes';
import {usePlayback} from './revised/visuals';
export {RevisedPrelude,RevisedHero} from './motion/Preludes';
import type {WidgetProps} from './registry';

const options=[["文字与操作", "检测再分割", "组合技能"], ["苹果", "梨", "背景"], ["直接复述", "看图复核"], ["读取发车时间", "读取站台", "直接判断底色"], ["招牌识字", "雨伞分割", "城市夜景", "地标检索"], ["完整回路", "返回上下文"], ["角色与损失", "构建风筝示例"], ["规划与执行", "服务调度"], ["主帆修补", "布局生成雪景", "生成图片与配文", "错误选区"], []];
const feedback=[
 '能力扩展来自视觉规划、工具使用训练与专家技能的组合：不仅描述对象，还能得到可操作的结果。',
 '在图上拖动位置，或选择上方目标。坐标表达意图，掩码贴合对应物体轮廓；这里演示预设区域。',
 '狗的形象在工具候选中先出现，视觉复核后被划除并移入撤销区；原图始终只有汽车，不发生图像擦除。',
 'thoughts 说明决策；actions 组织 API_name 与 API_params；工具返回后，value 给出回复。无需工具时 actions 为 []。',
 '工具职责与参数共同决定输出：OCR 返回文字，分割返回区域，编辑返回新图像，检索返回相关信息。',
 '工具结果不是最终回复。结果与原问题重新进入对话，助手结合原图给出回答，再以空 actions 结束调用。',
 '只监督助手需要生成的调用与回答；用户、图像和工具返回作为条件。点击对话行，检查可用前文、角色掩码与单位置损失；不计入损失的内容仍作为后续条件。',
 '规划器理解图像与请求，执行器调度专家；结果沿返回路径参与回答。服务控制器负责进程协调。',
 '中间条件决定后续操作的位置与方式。选择错误区域会修改水面；布局生成则保留位置关系并改变场景。',
 ''
];
export function RevisedWidget({chapterId,moduleId}:WidgetProps){
 const chapter=Number(chapterId.replace('chap-',''));
 const config=moduleId==='8.2';
 const host=useRef<HTMLDivElement>(null);
 const [zoom,setZoom]=useState(0);
 const [selection,setSelection]=useState(chapter===3?1:0),[point,setPoint]=useState({x:.29,y:.56}),[prob,setProb]=useState(.5);
 const mode=config?selection+1:chapter===8?(selection?3:0):selection;
 const playback=usePlayback(`${moduleId}:${mode}`,chapter===10?10:chapter===3||chapter===7?20:14);
 const Component=[Novelty,Grounding,Review,Request,Skills,Dialogue,Training,System,Compose,Results][chapter-1];
 const choose=(i:number)=>{setSelection(i);if(chapter===2)setPoint(i===0?{x:.29,y:.56}:i===1?{x:.75,y:.57}:{x:.50,y:.18});};
 useEffect(()=>{const svg=host.current?.querySelector('.revised-stage>.scene-svg');const h=svg?.getAttribute('data-scene-height')||'340';svg?.setAttribute('viewBox',zoom?`${(zoom-1)*330} 0 360 ${h}`:`0 0 1020 ${h}`);},[zoom,mode,moduleId]);
 const explanation=chapter===10?metrics[mode].conclusion:config?(selection?'All Tools 在训练和评测中汇集除分割外的视觉理解工具结果。':'Fly 只选与当前问题有关的工具；读取停车招牌时间时使用 OCR。'):chapter===7&&mode===1?'本例采用类别改写路线：图像标注提供构造上下文，GPT-4 改写请求；执行工具后，再结合返回构造答案。画面使用预设示例。':feedback[chapter-1];
 return <div ref={host} className="revised-widget" data-module={moduleId}>
   <div className="revised-stage"><Component mode={mode} p={playback.p} t={playback.time} point={point} setPoint={setPoint} prob={prob} seek={playback.seek}/></div>
   <div className="animation-focus">{['全景','左侧细节','中部细节','右侧细节'].map((v,i)=><button className={`chip${zoom===i?' selected':''}`} key={v} onClick={()=>setZoom(i)}>{v}</button>)}</div>
   <Controls>
    {chapter===10?<label>比较任务 <select aria-label="比较任务" value={selection} onChange={e=>choose(Number(e.target.value))}>{metrics.map((m,i)=><option value={i} key={m.name}>{m.name}</option>)}</select></label>:(config?['按需 Fly','All Tools']:options[chapter-1]).map((label,i)=><Button key={label} active={selection===i} onClick={()=>choose(i)}>{label}</Button>)}
    <span className="animation-actions"><button className="tiny ghost" onClick={playback.toggle} aria-label={playback.playing?'暂停动画':'播放动画'}>{playback.playing?'暂停':'播放'}</button><button className="tiny ghost" onClick={playback.replay}>重播</button></span>
   </Controls>
   <div className="ctrl animation-timeline"><label htmlFor={`timeline-${moduleId}`}>演示进度</label><input id={`timeline-${moduleId}`} aria-label="演示进度" type="range" min="0" max="100" step="1" value={Math.round(playback.p*100)} onChange={e=>playback.seek(Number(e.target.value)/100)}/><output>{Math.round(playback.p*100)}%</output></div>
   {chapter===7&&mode===0&&<div className="ctrl probability"><label htmlFor="loss-probability">目标词元概率</label><input id="loss-probability" type="range" min="0.05" max="0.95" step="0.05" value={prob} onChange={e=>setProb(Number(e.target.value))}/><output>{prob.toFixed(2)} → −ln(p) = {(-Math.log(prob)).toFixed(3)}</output></div>}
   <Feedback>{explanation}</Feedback>
 </div>;
}

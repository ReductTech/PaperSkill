import React, { useState } from 'react';
import { EvidenceMediaDrawer, PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type MissionId = 'camera' | 'surface' | 'asset';
type PriorId = 'pose' | 'intrinsics' | 'depth';

const missions: Record<MissionId, { title:string; question:string; output:string; need:string; result:string; color:string }> = {
  camera: { title:'相机未知：先找拍摄位置', question:'这些照片分别从哪里拍摄？', output:'Camera head', need:'RGB 必需；已知位姿可作为先验，但没有位姿也必须能估计。', result:'恢复相机参数并把多视图放进同一坐标系。', color:'#7c3aed' },
  surface: { title:'几何检查：恢复表面', question:'每个像素对应空间中的哪里，表面朝向如何？', output:'Pointmap + Depth + Normal heads', need:'RGB 必需；深度先验可减少歧义，有效掩码过滤天空与断裂区域。', result:'形成点图、深度、法线和有效区域。', color:'#228d5c' },
  asset: { title:'资产交付：生成可渲染表示', question:'怎样把共享几何变成可实时渲染的 3DGS？', output:'3DGS head', need:'先由共享骨干建立稳定几何，再在第二阶段冻结几何参数训练 3DGS 头。', result:'输出像素级高斯属性，连接重建与 WorldLens。', color:'#d97706' },
};
const priors: Array<{id:PriorId;label:string;short:string}> = [{id:'pose',label:'位姿',short:'Pose'},{id:'intrinsics',label:'内参',short:'K'},{id:'depth',label:'深度',short:'D'}];

export const HyArchitecture:React.FC<WidgetProps>=()=>{
  const[mission,setMission]=useState<MissionId>('camera');const[activePriors,setActivePriors]=useState<PriorId[]>([]);
  const m=missions[mission];const toggle=(id:PriorId)=>setActivePriors((current)=>current.includes(id)?current.filter((item)=>item!==id):[...current,id]);
  const outputNodes=mission==='camera'?['Camera']:mission==='surface'?['Pointmap','Depth','Normal']:['3DGS'];
  return <div className="architecture-rebuild">
    <div className="learning-contract"><div><span>为什么学</span><p>WorldMirror 必须同时处理不同输入条件与多种几何任务；为每种组合训练一套模型会重复计算且难以共享空间理解。</p></div><div><span>本次操作</span><p>选择一个真实重建问题，再接入可用先验，观察共享骨干与对应任务头如何组成有效路径。</p></div><div><span>应得判断</span><p>共享骨干负责跨视图空间理解，专用输出头负责不同预测格式；Any-Modal 指规定先验可选，不是任意传感器。</p></div></div>
    <div className="architecture-mission-tabs" role="tablist" aria-label="选择重建任务">{(Object.keys(missions) as MissionId[]).map((id)=><button key={id} type="button" role="tab" aria-selected={mission===id} className={mission===id?'selected':''} onClick={()=>setMission(id)}><strong>{missions[id].title}</strong><small>{missions[id].question}</small></button>)}</div>
    <section className="architecture-flow" aria-live="polite">
      <div className="architecture-flow-input"><span>必需输入</span><strong>多视图 RGB</strong><div><i>V1</i><i>V2</i><i>V3+</i></div><small>图像永远不能关闭</small></div>
      <i className="architecture-flow-arrow">→</i>
      <div className="architecture-flow-priors"><span>可选先验</span>{priors.map((prior)=><button key={prior.id} type="button" className={activePriors.includes(prior.id)?'selected':''} aria-pressed={activePriors.includes(prior.id)} onClick={()=>toggle(prior.id)}><b>{prior.short}</b><small>{prior.label}</small></button>)}</div>
      <i className="architecture-flow-arrow">→</i>
      <div className="architecture-flow-backbone"><span>统一 token</span><strong>共享 Transformer</strong><small>global-local attention 聚合跨视图特征</small></div>
      <i className="architecture-flow-arrow">→</i>
      <div className="architecture-flow-heads" style={{'--mission-color':m.color} as React.CSSProperties}><span>本次激活</span>{outputNodes.map((node)=><strong key={node}>{node}</strong>)}<small>其它输出头仍存在，只是本次不展开</small></div>
    </section>
    <div className="architecture-reconstruction-scene">
      <section><span>你要解决的问题</span><strong>{m.question}</strong><p>{m.need}</p></section>
      <div className={`architecture-scene-object ${mission}`}><i/><b/><em>{m.output}</em></div>
      <section><span>路径产出</span><strong>{m.result}</strong><p>{activePriors.length===0?'无先验仍是合法输入；训练时每种先验以 0.5 概率独立丢弃。':'当前接入：'+activePriors.map((id)=>priors.find((item)=>item.id===id)?.label).join(' + ')+'。它们提供条件，不会关闭任何任务头。'}</p></section>
    </div>
    <div className={`feedback ${activePriors.length===3?'good':''}`}>共享骨干的意义是让相机、点图、深度、法线与 3DGS 使用同一份跨视图空间特征；任务头分开，是因为这些输出的格式、监督和训练阶段不同。</div>
    <section className="architecture-evidence-strip"><header><span>Table 11 · 7-Scenes 高分辨率端点</span><strong>Acc. / Comp. 越低越好</strong></header><div className="architecture-evidence-pair"><div className={activePriors.length===0?'active':''}><span>仅图像</span><strong>Acc. 0.037 · Comp. 0.040</strong><small>WorldMirror 2.0，H</small></div><i>→</i><div className={activePriors.length===3?'active':''}><span>图像 + 全部先验</span><strong>Acc. 0.012 · Comp. 0.016</strong><small>Pose + K + Depth</small></div></div><p>论文没有在 Table 11 报告所有部分先验组合，不能对中间组合插值出数字。</p></section>
    <div className="architecture-glossary-grid"><details><summary>为什么共享骨干？</summary><p>相机、深度与点图都依赖同一跨视图对应关系，共享特征可避免每个任务重复学习空间匹配。</p></details><details><summary>为什么还要多个头？</summary><p>相机是全局参数，点图/深度/法线是像素级几何，3DGS 是可渲染属性，它们需要不同解码形式和监督。</p></details><details><summary>3DGS 为何第二阶段训练？</summary><p>论文先联合训练几何头，再冻结几何参数单独训练 3DGS 头，以解耦几何学习与外观建模。</p></details></div>
    <div className="evidence-media-stack"><EvidenceMediaDrawer mediaType="论文原图" src="/images/figure-12-worldmirror.png" title="论文 Figure 12：WorldMirror 2.0 架构" caption="用于核对 Any-Modal 输入、共享骨干和多输出头的真实连接。" alt="WorldMirror 2.0 架构原图"/><EvidenceMediaDrawer mediaType="官方 GIF" src="/images/official-reconstruction.gif" title="多图与视频重建演示" caption="官方演示帮助理解最终任务流程，不替代论文指标。" alt="官方多视图重建演示" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗"/></div>
    <PaperTable tableId="table-11"/>
  </div>;
};

export default HyArchitecture;

import React,{useState} from 'react';
import type {WidgetProps} from './registry';

const fig2=[
 {key:'hierarchy',tab:'(a) Hierarchical-B',title:'逐帧层次编码',text:'蓝色帧编码与橙色运动编码按预先规定的层次顺序执行。帧之间存在参考依赖，显式运动操作与逐帧处理限制了并行吞吐。'},
 {key:'chunk',tab:'(b) Chunk coding',title:'并行块编码',text:'一组帧作为一个 chunk 联合编码；块内帧由同一块潜变量共同表示并并行重建，跨块上下文继续向后传播，框架不再执行显式运动编码。'},
 {key:'contrast',tab:'核心差异',title:'论文 Figure 2 的核心对照',text:'变化的不是“把帧排成一排”，而是编码单位从单帧提升为帧块：固定层次依赖被块内联合建模替代，显式运动链被隐式时空相关性学习替代。'}
] as const;

export const FigureTwoExplorer:React.FC<WidgetProps>=()=>{
 const [sel,setSel]=useState(0);const x=fig2[sel];
 return <div className="paper-figure-explorer">
  <div className="figure-guide-tabs" role="tablist" aria-label="Figure 2 阅读视角">{fig2.map((s,i)=><button key={s.key} type="button" className={sel===i?'active':''} onClick={()=>setSel(i)}>{s.tab}</button>)}</div>
  <div className={`figure-2-stage focus-${x.key}`}>
   <img src="/images/figure-2.png" alt="论文 Figure 2：Hierarchical-B 逐帧编码与 DCVC-UF 并行块编码对比"/>
   {x.key!=='contrast'&&<span className="figure-2-focus" aria-hidden="true"/>}
  </div>
  <div className="figure-reading-card"><span>当前聚焦</span><strong>{x.title}</strong><p>{x.text}</p></div>
  <p className="paper-source-note">论文 Figure 2 原图；交互层仅用于聚焦与导读，不改变图中方法关系。</p>
 </div>;
};

const fig3=[
 {tab:'① 输入与条件',path:'Xᵢ → Patchify；Cᵢ → Chunk Encoder',text:'第 i 个非重叠视频块 Xᵢ 包含 N 帧。Patchify 降采样后的块表示与来自上一块的时序上下文 Cᵢ 一同进入块编码器。',boxes:[{x:1,y:56,w:31,h:42}]},
 {tab:'② 块编码',path:'Chunk Encoder → yᵢ → Q → ŷᵢ',text:'块编码器联合读取块内 N 帧，生成一份包含整块时空信息的潜变量 yᵢ；量化后得到 ŷᵢ。',boxes:[{x:14,y:55,w:40,h:43}]},
 {tab:'③ 熵编解码',path:'ŷᵢ ↔ AE / AD；SEM 估计概率参数',text:'精简熵模型为算术编码与解码提供概率参数。论文把需要码流交互的残差恢复合并为一步，均值路径仍逐步传播。',boxes:[{x:1,y:1,w:38,h:43},{x:34,y:42,w:29,h:39}]},
 {tab:'④ 公共特征',path:'ŷᵢ → Chunk Decoder → Fᵢ',text:'块解码器从量化潜变量恢复公共特征 Fᵢ。Fᵢ 同时包含块内全部 N 帧的时空信息。',boxes:[{x:53,y:55,w:27,h:43}]},
 {tab:'⑤ 两条输出支路',path:'Fᵢ → N 个帧专属解码器；Fᵢ → Cᵢ₊₁',text:'一条支路由 N 个时间位置专属解码器并行重建 N 帧；另一条支路生成下一块的时序上下文 Cᵢ₊₁。',boxes:[{x:43,y:1,w:31,h:40},{x:72,y:54,w:27,h:44}]}
] as const;

export const FigureThreeExplorer:React.FC<WidgetProps>=()=>{
 const [sel,setSel]=useState(0);const x=fig3[sel];
 return <div className="paper-figure-explorer framework-explorer">
  <div className="framework-steps" role="tablist" aria-label="Figure 3 数据流步骤">{fig3.map((s,i)=><button key={s.tab} type="button" className={sel===i?'active':''} onClick={()=>setSel(i)}><small>STEP {i+1}</small><b>{s.tab.slice(2)}</b></button>)}</div>
  <div className="framework-path" aria-live="polite"><span>当前路径</span><strong>{x.path}</strong><p>{x.text}</p></div>
  <figure className="paper-framework-figure"><div className="framework-image-stage"><img src="/images/figure-3.svg" alt="论文 Figure 3：DCVC-UF 总体框架图"/>{x.boxes.map((b,i)=><span key={i} className="framework-focus-box" style={{left:`${b.x}%`,top:`${b.y}%`,width:`${b.w}%`,height:`${b.h}%`}} aria-hidden="true"/>)}</div><figcaption>论文 Figure 3 原图。点击上方 STEP，青色高亮会定位到原图中的对应模块与数据路径。</figcaption></figure>
 </div>;
};

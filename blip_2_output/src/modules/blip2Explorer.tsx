import React,{useState} from 'react';
import type {WidgetProps} from './registry';

type Info={options:string[]; question:string; explain:string; detail:string};
const info:Record<string,Info>={
 '1.1':{options:['直接连接','先学接口'],question:'图片特征能直接变成语言吗？',explain:'两种模态的表示空间不同，需要一个可学习的接口。',detail:'视觉 token 不是文字 token；Q-Former 的任务是学习跨模态映射，而不是重训两端。'},
 '2.1':{options:['端到端微调','冻结 + 桥'],question:'预算有限时，哪条路线更稳？',explain:'冻结已有模型能复用能力，并把训练集中在跨模态接口。',detail:'论文动机包含计算成本和 catastrophic forgetting；冻结是条件化的工程选择。'},
 '3.1':{options:['局部孤立','Self-attention 全局读'],question:'一个 patch 如何知道它旁边是什么？',explain:'self-attention 让视觉 token 互相读取上下文。',detail:'ViT 把图像切成 patch token，再用 Transformer 编码；本教程用简化示意帮助建立直觉。'},
 '4.1':{options:['只看图','Cross-attention 读图','Self + Cross'],question:'查询向量应该看向谁？',explain:'Q-Former 用查询的 self-attention 整合线索，再用 cross-attention 读取视觉特征。',detail:'learnable queries 是信息瓶颈；输出长度固定，便于接入 LLM。'},
 '5.1':{options:['图片 token','文字 token','视觉软提示'],question:'冻结 LLM 仍能读图的关键是什么？',explain:'Q-Former 输出连续向量，作为 LLM 的视觉前缀，而非伪装成文字。',detail:'第二阶段最大化冻结 LLM 对目标文本的条件概率，只更新桥接部分。'},
 '6.1':{options:['ITC 对比','ITM 匹配','ITG 生成'],question:'这个损失先解决什么问题？',explain:'ITC 拉近匹配图文，ITM 判断真假配对，ITG 学图像条件生成。',detail:'第一阶段三项目标共同塑造视觉语言表示；第二阶段再进行 vision-to-language generation。'},
 '6.2':{options:['对齐阶段','生成阶段'],question:'为什么要分两阶段？',explain:'先把视觉表示对齐到文字空间，再让 LLM 学会把视觉提示解释成句子。',detail:'把两个目标混在一起会让“对齐”和“生成”责任不清；论文明确采用 sequential pre-training。'},
 '7.1':{options:['VQAv2','COCO Caption','视觉对话','指令跟随'],question:'看到一个更高的数字，能直接说泛化更好吗？',explain:'先检查数据集、split、baseline 和指标方向，才可比较。',detail:'论文展示多任务能力与 zero-shot instructed image-to-text generation；协议不同的数字不能直接相加。'},
 '8.1':{options:['更大端到端','只训练桥','冻结 + 瓶颈 + 两阶段'],question:'哪条解释同时回答提出动机、结构和评测？',explain:'第三个选择把成本、接口、训练流程和迁移评测串成因果链。',detail:'论文报告 BLIP-2 在 zero-shot VQAv2 超过 Flamingo80B 8.7%，且 trainable parameters 少 54 倍；该比较依赖论文给定协议。'},
};

export const Blip2Explorer:React.FC<WidgetProps>=({moduleId})=>{
 const d=info[moduleId]||info['1.1']; const [choice,setChoice]=useState(0); const [open,setOpen]=useState(false); const success=choice===d.options.length-1;
 return <div className="blip-widget">
  <div className="blip-question"><span>你来判断</span><strong>{d.question}</strong></div>
  <div className="blip-scene"><div className="scene-orbit"><span className="scene-core">{success?'✓':'?'}</span><i className="scene-dot dot-a"/><i className="scene-dot dot-b"/><i className="scene-dot dot-c"/></div><div className="scene-readout"><small>当前空间</small><strong>{success?'出口信号':'回声信号'}</strong><em>{success?'路径已解锁':'等待你的下注'}</em></div></div>
  <div className="blip-controls">{d.options.map((x,n)=><button key={x} className={n===choice?'is-selected':''} onClick={()=>{setChoice(n);setOpen(false)}}>{x}</button>)}</div>
  <div className={`blip-feedback ${success?'good':''}`}><span>{success?'判断成立':'再观察'}</span>{success?d.explain:'这个选择还不能解释全部现象。试着比较它是否同时解决了“为什么”和“怎么做”。'}</div>
  <button className="detail-toggle" onClick={()=>setOpen(!open)}>{open?'收起技术细节':'展开技术细节'}</button>{open&&<div className="blip-detail">{d.detail}</div>}
 </div>;
};

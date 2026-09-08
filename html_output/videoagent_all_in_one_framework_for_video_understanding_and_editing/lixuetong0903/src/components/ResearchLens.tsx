import React from 'react';

export function ResearchOverview(){return <section className="research-overview"><div><small>研究问题</small><b>长视频编辑为什么难？</b><p>系统必须同时理解全局叙事、定位精确镜头，并可靠协调多种编辑工具。</p></div><div className="key-idea"><small>核心思想</small><b>把视频编辑建模为可检查、可修改的智能体工作流</b><p>VideoAgent 将分镜规划（Storyboard Planning）、检索与裁剪（Retrieval + Trimming）和智能体图优化（Agent Graph Optimization）统一起来。</p></div><div><small>主要贡献</small><ol><li>全局上下文感知的分镜规划</li><li>检索与细粒度裁剪</li><li>智能体图与文本梯度优化</li></ol></div></section>}

const lenses:Record<string,{what:string;why:string;how:string}>={
  'chap-3':{what:'分镜（Storyboard）是按镜头组织的文本规划序列。',why:'直接从长视频检索容易只匹配局部语义，无法保证最终故事在全局上连贯。',how:'压缩全部素材形成全局上下文 C，再结合指令 I 和目标镜头数生成分镜 S。'},
  'chap-7':{what:'智能体图（Agent Graph）用节点表示编辑智能体，用有向边表示数据与参数依赖。',why:'复杂任务同时包含串行、并行和跨模态依赖，单一线性工具序列难以表达和验证。',how:'检查拓扑序、连通分量、能力覆盖与边兼容性，再按当前图的拓扑序执行。'},
  'chap-8':{what:'文本梯度（Textual Gradient）是自然语言形式的图修改方向。',why:'大模型一次生成的工作流可能有环路、缺失能力或参数流错误。',how:'智能体图 → 质量检查 → 语言反馈 → 离散图更新 → 重新评估。'},
};
export function ResearchLens({chapterId}:{chapterId:string}){const x=lenses[chapterId];if(!x)return null;return <div className="research-lens"><div><small>是什么</small><p>{x.what}</p></div><div><small>为什么需要</small><p>{x.why}</p></div><div><small>如何实现</small><p>{x.how}</p></div></div>}

export function MethodComparison(){return <div className="method-comparison"><h3>为什么不能用更简单的方法？</h3><div><span><b>直接生成成片</b>难以稳定操作真实文件与复杂工具</span><span><b>线性工具序列</b>难以表达并行和跨模态依赖</span><span><b>只做跨模态检索</b>找到素材但无法确定精确动作边界</span><span className="chosen"><b>VideoAgent</b>理解、规划、编排、优化与执行形成闭环</span></div></div>}

export function ResearchTakeaways(){return <section className="research-take"><span className="evidence-chip simulation">个人分析 · 李雪彤</span><h3>我的研究思考</h3><blockquote>VideoAgent 的主要价值，是把视频编辑从一次不可检查的工具调用，转化为一个可验证、可修改的智能体工作流。</blockquote><div><article><b>我看到的局限</b><ul><li>能力上限受源素材和智能体工具库约束</li><li>语言反馈可能提出错误的离散修改</li><li>有效的有向无环图不保证视觉结果一定优质</li><li>文本梯度不保证全局最优或严格收敛</li></ul></article><article><b>可能的研究延伸</b><p>引入类型化智能体接口、真实执行反馈与不确定性估计，使图更新同时依据语言评价和工具执行结果。</p></article></div></section>}

import React from 'react';
import type { WidgetProps } from './registry';

export const ModConclusion: React.FC<WidgetProps> = () => (
  <div className="paper-conclusion">
    <header><small>PAPER TAKE-HOME</small><h3>长程能力取决于有限预算中的信息密度，而不是名义 Context 长度。</h3><p>GenericAgent 的贡献不是一个孤立技巧，而是一组围绕信息生命周期协同设计的系统机制。</p></header>
    <div className="conclusion-mechanisms">
      <div><b>1</b><span>Minimal Tools</span><p>减少常驻接口开销与动作选择歧义。</p></div>
      <div><b>2</b><span>Hierarchical Memory</span><p>轻量索引常驻，深层事实和 SOP 按需读取。</p></div>
      <div><b>3</b><span>Self-Evolution</span><p>把验证轨迹巩固为可复用 SOP、代码和技能。</p></div>
      <div><b>4</b><span>Context Compression</span><p>截断、压缩、淘汰和锚定共同维持当前状态。</p></div>
    </div>
    <div className="conclusion-grid">
      <section><small>WHAT THE EVIDENCE SUPPORTS</small><h4>在论文测试协议内，GA兼顾任务完成和较低交互成本</h4><p>优势出现在任务完成、工具效率、记忆控制、自进化和网页浏览五个维度；具体数字必须连同 benchmark、模型和指标方向一起读取。</p></section>
      <section><small>WHAT THE PAPER DOES NOT PROVE</small><h4>结果不意味着所有任务都固定节省同一比例</h4><p>权重自适应尚未充分验证；CJK 字符预算存在误差；30 轮上限、人工日志维护和高级技能树整理仍是明确边界。</p></section>
    </div>
    <blockquote><span>FINAL ANSWER</span><b>The goal is not more context. The goal is denser, reusable context.</b></blockquote>
  </div>
);

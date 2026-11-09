import React from 'react';
import type { WidgetProps } from './registry';

const GLOSSARY: { term: string; full: string; desc: string; color: string }[] = [
  {
    term: 'PaLM-E',
    full: 'PaLM-Embodied · 本论文模型',
    desc: '论文提出的具身多模态语言模型：把图像、状态、3D 场景表示编码成 token，与文本交错送入预训练 LLM，再自回归输出答案或高层子步骤。',
    color: '#27446e',
  },
  {
    term: 'LLM',
    full: 'Large Language Model · 大语言模型',
    desc: '论文底座是预训练的 decoder-only PaLM；PaLM-E 在其上接入多模态观测，而不是从零训练一个新语言模型。',
    color: '#27446e',
  },
  {
    term: 'VLM',
    full: 'Vision-Language Model · 视觉语言模型',
    desc: '同时读取图像与文本，可做视觉问答或图像描述的模型；现成 SOTA VLM 零样本难以完成具身推理。',
    color: '#7c3aed',
  },
  {
    term: 'TAMP',
    full: 'Task and Motion Planning · 任务与运动规划',
    desc: '把高层目标拆成有先后约束的子步骤，再落到机器人可执行的动作序列；论文在这类具身规划与问答上做对照。',
    color: '#228d5c',
  },
  {
    term: 'VQA',
    full: 'Visual Question Answering · 视觉问答',
    desc: '依据给定图像回答自然语言问题，是论文评测的一类任务，与机器人规划共用同一个联合模型。',
    color: '#7c3aed',
  },
  {
    term: 'PaLI',
    full: '视觉语言基线（论文对照）',
    desc: '未在机器人数据上训练的对照模型；零样本搬到具身任务上时，词汇锚不到现场物体，答非所问。',
    color: '#68778f',
  },
  {
    term: 'SayCan',
    full: '可行动性打分式方法（论文对照）',
    desc: '语言模型给候选动作打分，可行动性模型判断当下能否执行；它只约束当前一步，排不出有先后约束的长程计划。',
    color: '#f07e47',
  },
];

const ROADMAP: { no: string; title: string; desc: string }[] = [
  { no: '§1', title: '问题动机', desc: '旧路径缺感知锚定与长程规划约束' },
  { no: '§2', title: '架构总览', desc: '观测从哪进入、经过什么、从哪输出' },
  { no: '§3', title: '多模态句子', desc: '观测嵌入与文本交错成同一条序列' },
  { no: '§4', title: '编码器路线', desc: '状态 / ViT / GT 物体中心 / OSRT 槽位' },
  { no: '§5', title: '实体引用与训练', desc: '物体指代、前缀条件与训练配方' },
  { no: '§6', title: '迁移与表示', desc: '跨域迁移与不同表示的低数据表现' },
  { no: '§7', title: '规模与能力', desc: '通用视觉语言评测、规模与抗遗忘' },
  { no: '§8', title: '真机与局限', desc: '机器人实操、涌现能力与边界' },
  { no: '§9', title: '真机样例对照', desc: '真机多步样例与基线对照图解' },
  { no: '§10', title: '评测明细收束', desc: '规模—语言能力评测与全章复盘' },
];

/**
 * §1 术语速览 + 全文脉络：先解释反复出现的英文缩写与对照方法，
 * 再用一条路线串起后续章节，帮助读者在进入机制前建立全局地图。
 */
export const GlossaryOverview: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <div>
      <div className="glossary-section-label">关键英文名称</div>
      <div className="glossary-grid">
        {GLOSSARY.map((g) => (
          <div key={g.term} className="glossary-card">
            <div className="glossary-head">
              <span className="glossary-term" style={{ color: g.color }}>{g.term}</span>
              <span className="glossary-full">{g.full}</span>
            </div>
            <div className="glossary-desc">{g.desc}</div>
          </div>
        ))}
      </div>

      <div className="glossary-section-label" style={{ marginTop: 18 }}>全文脉络</div>
      <div className="roadmap">
        {ROADMAP.map((r) => (
          <div key={r.no} className="roadmap-step">
            <span className="roadmap-no">{r.no}</span>
            <div className="roadmap-body">
              <div className="roadmap-title">{r.title}</div>
              <div className="roadmap-desc">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="module-desc" style={{ marginTop: 10 }}>
        这条路线先讲清“缺了什么”，再展开模型如何把观测写进语言序列、用哪些编码器接入，最后用迁移、规模与真机证据检验这套方案。
      </p>
    </div>
  );
};

export default GlossaryOverview;

import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Branch = 'understanding' | 'generation';

type Slice = {
  name: string;
  value: number;
  derived?: boolean;
};

type DataItem = {
  id: string;
  label: string;
  title: string;
  purpose: string;
  mix: Slice[];
  ratioNote: string;
  subgroups?: string[];
  pipeline: Array<{ title: string; detail: string }>;
  checks: string[];
  use: string;
  boundary: string;
  locator: string;
};

const DATA: Record<Branch, DataItem[]> = {
  understanding: [
    {
      id: 'pre',
      label: '预训练',
      title: '理解预训练语料',
      purpose: '建立广覆盖的文本与视觉基础能力。',
      mix: [
        { name: '图文对', value: 32 },
        { name: '图像描述', value: 17 },
        { name: '信息图理解', value: 14 },
        { name: '纯文本', value: 37 },
      ],
      ratioNote: '四类比例均为论文直接报告，合计 100%。',
      pipeline: [
        { title: '跨来源去重', detail: '移除不同来源之间的重复样本。' },
        { title: '内容与安全过滤', detail: '过滤低价值、不安全或不适宜内容。' },
        { title: '图像质量过滤', detail: '排除视觉质量不足的样本。' },
        { title: '平衡式重描述', detail: '按 CLIP ratio 平衡进行 re-caption，改善跨模态对齐。' },
      ],
      checks: ['文本与图像语义对齐', '图像基础质量', '内容与安全边界'],
      use: '形成后续理解中训与生成条件建模所依赖的基础语义能力。',
      boundary: '这里描述语料构成，不等同于 Table 2 中某个训练 Stage 的数据采样比例。',
      locator: '论文 §4.1 · Pre-training Stage',
    },
    {
      id: 'mid',
      label: '中训',
      title: '理解中训语料',
      purpose: '从内部 SenseNova V6.5 数据中构造高质量、多领域的多模态指令语料。',
      mix: [
        { name: '通用', value: 39.2 },
        { name: '智能体与空间', value: 22.3 },
        { name: '知识推理', value: 19.3 },
        { name: '纯文本', value: 19.2 },
      ],
      ratioNote: '顶层四类比例为论文直接报告。',
      subgroups: [
        '通用内部：VQA 26.6% · 多轮对话 26.4% · 图像描述 20.3% · OCR 18.6% · 多图理解 8.2%',
        '知识/推理子类：知识型 12.0% · 推理型 7.2%（原文存在四舍五入）',
      ],
      pipeline: [
        { title: '分布平衡采样', detail: '先对 CLIP 视觉嵌入做 K-means 并跨簇均匀采样，再按感知与语义属性分层取样。' },
        { title: 'Prompt 增强', detail: '沿语义表达、格式结构、角色场景、任务复杂度四个维度增强，并统一重写答案。' },
        { title: '多标准过滤', detail: '检查正确性、视觉幻觉和指令遵循，拒绝不可靠 QA 对。' },
      ],
      checks: ['Ground-truth 正确性', '视觉幻觉检测', '格式、角色与约束遵循'],
      use: '用于 Stage 1 的理解延续训练，并作为 SFT 数据进一步筛选与重构的候选池。',
      boundary: 'Figure 7 描述的是理解中训语料加工流程，不是模型推理流程。',
      locator: '论文 §4.1 · Mid-training Stage · Figure 7',
    },
    {
      id: 'sft',
      label: 'SFT',
      title: '理解 SFT 语料',
      purpose: '在中训候选池上进一步提高质量，并把监督难度调整到更有效的区间。',
      mix: [
        { name: '空间智能', value: 15 },
        { name: '通用多模态', value: 13 },
        { name: '推理', value: 12 },
        { name: '通用 NLP', value: 11 },
        { name: 'OCR/文档', value: 11 },
        { name: '智能体调用', value: 10 },
        { name: '长上下文', value: 8 },
        { name: '代码', value: 6 },
        { name: '多轮对话', value: 4 },
        { name: '复杂组合理解', value: 4 },
        { name: '补充数据', value: 6, derived: true },
      ],
      ratioNote: '“补充数据 6%”由论文所列类别合计 94% 后的剩余比例得到。',
      pipeline: [
        { title: '质量导向筛选', detail: '按视觉保真、指令清晰度、回答正确性、推理质量与安全性评分，提高高分样本占比。' },
        { title: '构造长难样本', detail: '把短样本拼接成长上下文、多图和多轮对话实例。' },
        { title: '控制推理难度', detail: '对推理密集领域做拒绝采样，保留中等难度样本。' },
        { title: '补全显式约束', detail: '重写信息不足的问题，补充输出格式、风格属性与目标粒度。' },
      ],
      checks: ['高质量样本优先', '难度不是越高越好', '约束表达必须充分'],
      use: '用于统一 SFT，提升指令遵循、推理、OCR、空间智能与智能体能力。',
      boundary: 'SFT 语料不是重新收集的一套独立数据，而是对中训候选池的质量和难度重构。',
      locator: '论文 §4.1 · Supervised Fine-Tuning',
    },
  ],
  generation: [
    {
      id: 't2i',
      label: '文生图',
      title: 'Text-to-Image 数据',
      purpose: '同时覆盖自然视觉、设计内容、人物以及文字密集的长尾场景。',
      mix: [
        { name: 'Nature', value: 40.5 },
        { name: 'People', value: 26.7 },
        { name: 'Design', value: 20.7 },
        { name: 'Synthetic/其他', value: 12.1, derived: true },
      ],
      ratioNote: '前三类为论文直接报告；12.1% 是按总量 100% 计算的余量，不是论文单独给出的数字。',
      subgroups: ['额外覆盖：复杂信息图、双语文字渲染、海报、图表、城市景观等细粒度长尾类别。'],
      pipeline: [
        { title: '低层质量过滤', detail: '先排除基础视觉质量不足的图像。' },
        { title: '去重', detail: '减少近重复内容造成的分布偏斜。' },
        { title: 'VLM Captioning', detail: '重新生成更完整的图像描述。' },
        { title: '质量感知过滤', detail: '按最终生成训练所需的质量与多样性再次筛选。' },
      ],
      checks: ['视觉质量与美学', 'Caption 对齐', '文字密集场景覆盖'],
      use: '为一般生成、提示遵循、结构化版式和中英文文字渲染提供监督。',
      boundary: 'Figure 8 的内环是顶层类别，外环才是细粒度子类；两层比例不能混为一层。',
      locator: '论文 §4.2 · Text-to-Image Data · Figures 8–9',
    },
    {
      id: 'edit',
      label: '图像编辑',
      title: 'Image Editing 数据',
      purpose: '不仅学习“改什么”，还必须显式约束“什么不能改”。',
      mix: [
        { name: '自然场景', value: 52.3 },
        { name: '人物', value: 14.7 },
        { name: '信息图/合成等', value: 33, derived: true },
      ],
      ratioNote: '自然场景和人物为论文直接报告；33% 是按剩余比例归纳的信息图与合成编辑。',
      subgroups: ['操作覆盖：主体增删、背景/颜色变化、身份迁移、运动操控、人像编辑、合成与推理驱动变换。'],
      pipeline: [
        { title: '统一生成清洗', detail: '先经过低层过滤、去重、VLM captioning 与质量感知过滤。' },
        { title: '分解改变目标', detail: '把指令拆成必须发生的动态变化。' },
        { title: '分解保持目标', detail: '同时列出必须保持不变的主体、属性与背景。' },
        { title: '物理一致性验证', detail: '将动态目标与源图的静态物理一致性约束联合检查。' },
      ],
      checks: ['目标变化是否完成', '非目标区域是否保持', '源图物理一致性'],
      use: '为统一模型提供局部编辑、身份与属性保持、组合编辑和推理编辑监督。',
      boundary: '编辑数据的关键不只是操作类别，而是 change/preserve 双目标与源图一致性联合验证。',
      locator: '论文 §4.2 · Image Editing Data · Figure 9',
    },
    {
      id: 'interleaved',
      label: '图文交错',
      title: 'Interleaved 图文数据',
      purpose: '让文本与图像交替组成连贯多模态叙事，并训练跨步骤生成与推理。',
      mix: [
        { name: '生活方式', value: 44 },
        { name: '信息图', value: 29 },
        { name: '视频', value: 19 },
        { name: '推理', value: 8 },
      ],
      ratioNote: '四类比例均为论文直接报告，合计 100%。',
      subgroups: ['生活方式内部：教程 26% · 日常场景 14% · 绘本 4%。', '推理子集约 8%，每个样本包含显式 chain-of-thought 轨迹。'],
      pipeline: [
        { title: '预处理', detail: '整理原始文本、图像或视频片段及其顺序关系。' },
        { title: '按任务合成', detail: '根据教程、生活叙事、信息图、视频或推理任务构造交错序列。' },
        { title: '后处理', detail: '统一格式并修正序列级噪声。' },
        { title: '轨迹级验证', detail: '联合检查文本、图像、图文一致性与整条生成轨迹的正确性。' },
      ],
      checks: ['文本质量', '图像质量', '图文一致性', '轨迹级正确性'],
      use: '训练文本 → 图像 → 反馈 → 继续文本的交错生成，并覆盖时间连续性和显式推理。',
      boundary: '推理子集占比最小，但论文将其定义为推理要求最高的子集；占比不能直接代表重要性。',
      locator: '论文 §4.2 · Interleaved Data · Figure 8',
    },
  ],
};

const branchCopy = {
  understanding: {
    title: '理解数据组织',
    summary: '按训练阶段组织：预训练 → 中训 → SFT',
  },
  generation: {
    title: '生成数据组织',
    summary: '按任务能力组织：T2I → 编辑 → 图文交错',
  },
} satisfies Record<Branch, { title: string; summary: string }>;

export const DataConstructionMap: React.FC<WidgetProps> = () => {
  const [branch, setBranch] = useState<Branch>('understanding');
  const [index, setIndex] = useState(0);
  const item = DATA[branch][index];

  const chooseBranch = (next: Branch) => {
    setBranch(next);
    setIndex(0);
  };

  return (
    <div className="data-construction">
      <div className="data-construction-head">
        <div>
          <p className="training-map-kicker">论文 Section 4 · Data Construction</p>
          <h4>先区分数据组织方式，再查看构造与验证流程</h4>
        </div>
        <p>理解侧按训练阶段划分；生成侧按任务类型划分。百分比、训练采样比和损失权重是三类不同数字。</p>
      </div>

      <div className="data-level-guide">
        <div className={branch === 'understanding' ? 'is-active' : ''}>
          <span>理解侧</span>
          <strong>预训练 → 中训 → SFT</strong>
        </div>
        <i aria-hidden="true">≠</i>
        <div className={branch === 'generation' ? 'is-active' : ''}>
          <span>生成侧</span>
          <strong>T2I → 编辑 → 图文交错</strong>
        </div>
        <i aria-hidden="true">→</i>
        <div>
          <span>训练阶段</span>
          <strong>由 Table 2 再决定采样比例</strong>
        </div>
      </div>

      <div className="ctrl" role="radiogroup" aria-label="选择数据组织分支">
        <button type="button" role="radio" aria-checked={branch === 'understanding'} onClick={() => chooseBranch('understanding')}>理解数据组织</button>
        <button type="button" role="radio" aria-checked={branch === 'generation'} onClick={() => chooseBranch('generation')}>生成数据组织</button>
      </div>

      <div className="data-item-tabs" role="tablist" aria-label={branchCopy[branch].summary}>
        {DATA[branch].map((entry, itemIndex) => (
          <button key={entry.id} type="button" role="tab" aria-selected={index === itemIndex} onClick={() => setIndex(itemIndex)}>
            <strong>{entry.label}</strong>
            <span>{entry.title}</span>
          </button>
        ))}
      </div>

      <article className="data-item-detail" key={item.id}>
        <header>
          <div>
            <p>{branchCopy[branch].title} · {item.locator}</p>
            <h4>{item.title}</h4>
          </div>
          <strong>{item.purpose}</strong>
        </header>

        <section className="data-composition">
          <h5>① 数据组成</h5>
          <div className="data-stack-bar" aria-label={item.title + '数据比例'}>
            {item.mix.map((slice, sliceIndex) => (
              <span
                key={slice.name}
                className={'slice-' + (sliceIndex % 8)}
                style={{ width: slice.value + '%' }}
                title={slice.name + ' ' + (slice.derived ? '约 ' : '') + slice.value + '%'}
              />
            ))}
          </div>
          <div className="data-slice-list">
            {item.mix.map((slice, sliceIndex) => (
              <div key={slice.name}>
                <i className={'slice-' + (sliceIndex % 8)} />
                <span>{slice.name}</span>
                <strong>{slice.derived ? '≈' : ''}{slice.value}%</strong>
              </div>
            ))}
          </div>
          <p className="data-ratio-note">{item.ratioNote}</p>
          {item.subgroups ? (
            <div className="data-subgroups">
              {item.subgroups.map((group) => <span key={group}>{group}</span>)}
            </div>
          ) : null}
        </section>

        <section className="data-pipeline">
          <h5>② 构造流程</h5>
          <ol>
            {item.pipeline.map((step, stepIndex) => (
              <li key={step.title}>
                <span>{stepIndex + 1}</span>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="data-bottom-grid">
          <section>
            <h5>③ 质量验证重点</h5>
            <div className="data-checks">
              {item.checks.map((check) => <span key={check}>✓ {check}</span>)}
            </div>
          </section>
          <section>
            <h5>④ 进入训练后的作用</h5>
            <p>{item.use}</p>
          </section>
        </div>

        <footer>
          <span>证据边界</span>
          <p>{item.boundary}</p>
        </footer>
      </article>

      <div className="feedback good" aria-live="polite">{item.title}：{item.purpose}</div>
      <p className="note">数据构造回答“样本从哪里来、怎样筛选”；Table 2 的数据采样比例回答“训练时怎样混合”；CE:MSE 则是损失权重。三者不能互相替代。</p>
    </div>
  );
};

export default DataConstructionMap;

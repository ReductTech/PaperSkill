import React, { useState } from 'react';
import { PaperTable } from './hy-paper-evidence';
import type { PaperTableId } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type EvidenceLevel = 'paper' | 'official';

type BoundaryCard = {
  id: string;
  title: string;
  claim: string;
  verdict: string;
  level: EvidenceLevel;
  source: string;
  explanation: string;
  conditions: string[];
  tableId?: PaperTableId;
  media?: string;
  mediaAlt?: string;
  href?: string;
  linkLabel?: string;
};

const levelMeta: Record<EvidenceLevel, { label: string; desc: string }> = {
  paper: { label: '论文证据', desc: '公式、表格、消融和正文直接支持的结论' },
  official: { label: '官方功能展示', desc: '项目页、仓库、使用文档与官方图像展示的真实能力' },
};

const cards: BoundaryCard[] = [
  {
    id: 'metric', title: '全景质量', level: 'paper',
    claim: 'HY-Pano 2.0 在 Table 4 的 I2P CLIP-I 上达到 0.844，高于 CubeDiff 与 GenEx。',
    verdict: '可以作为全景子任务结果陈述，不能写成完整三维世界系统总排名。', source: '论文 Table 4',
    explanation: 'I2P 衡量图像到全景的兼容指标。它证明全景初始化环节改进有效，但不覆盖后续规划、关键帧、几何恢复与运行时。',
    conditions: ['I2P 子协议', 'CLIP-I 越高越好', '不外推到几何与交互'], tableId: 'table-4',
  },
  {
    id: 'memory', title: '跨轨迹一致性', level: 'paper',
    claim: 'WorldStereo 2.0 的完整空间拼接配置达到 PSNR 21.63、SSIM 0.669、PSNRm 30.76。',
    verdict: '消融支持 GGM、SSM++ 与空间对应的组合价值，但不保证任意长度轨迹绝不漂移。', source: '论文 Table 8',
    explanation: '全局几何记忆守住粗结构，局部记忆检索相关历史视角，空间拼接避免把跨视角对应误当成普通视频时间顺序。',
    conditions: ['论文记忆消融协议', '完整配置包含多项训练改动', '不能归因于单个开关'], tableId: 'table-8',
  },
  {
    id: 'reconstruction-result', title: '重建与资产效率', level: 'paper',
    claim: 'WorldMirror 2.0 在 7-Scenes 高分辨率仅图像设置达到 Acc. 0.037；完整 3DGS 配方把高斯从 6.000M 压到 1.381M。',
    verdict: '两组结果分别证明重建精度与资产压缩有效，但属于不同实验表，不能合成一个分数。', source: '论文 Tables 9、11、14',
    explanation: 'Table 11 的 Acc. 越低越好；Table 9 的数量下降伴随 PSNR 从 25.176 变为 25.023。Table 14 的 5.60 秒只对应 H20 四卡、128 视图重建子步骤。',
    conditions: ['保留数据集与分辨率', '保留画质损失', '子步骤速度不等于完整生成速度'], tableId: 'table-11',
  },
  {
    id: 'official-scope', title: '两条输入路线与四阶段系统', level: 'official',
    claim: '官方项目页展示文本/单图世界生成与多图/视频世界重建两条入口，最终可交付 3DGS、Mesh、点云和视频。',
    verdict: '这说明官方当前展示的系统范围；具体性能和开放状态仍应分别核对论文与仓库。', source: '腾讯混元项目主页与官方 GitHub',
    explanation: '稀疏输入走 HY-Pano、WorldNav、WorldStereo、WorldMirror 四阶段生成链；丰富观察可直接进入 WorldMirror 2.0 重建。',
    conditions: ['功能范围看官方页面', '实验数字看论文', '不同输入走不同路径'],
    media: './images/figure-2-architecture.png', mediaAlt: 'HY-World 2.0 两条输入路线与四阶段系统图',
    href: 'https://3d-models.hunyuan.tencent.com/world/', linkLabel: '打开腾讯混元项目主页 ↗',
  },
  {
    id: 'official-planning', title: 'WorldNav 场景感知规划', level: 'official',
    claim: '官方说明图把常规、环绕、重建感知、漫游和航拍五类轨迹叠加在真实三维场景上。',
    verdict: '它展示规划功能与观察覆盖思路，不表示路线由端到端网络学到全局最优解。', source: '腾讯混元官方 WorldNav 说明图',
    explanation: 'WorldNav 结合全景点云、语义、NavMesh 与碰撞条件，把有限相机预算投向背面、远端、空洞和顶部盲区。',
    conditions: ['五类轨迹互补', '规划受可达区域约束', '教学筛选步骤含第三方工程解释'],
    media: './images/official-stage-nav.webp', mediaAlt: 'WorldNav 五类相机轨迹官方说明图',
    href: 'https://3d-models.hunyuan.tencent.com/world/', linkLabel: '查看官方四阶段介绍 ↗',
  },
  {
    id: 'official-reconstruction', title: 'WorldMirror 多图与视频重建', level: 'official',
    claim: '官方仓库展示多视图照片或视频进入 WorldMirror 2.0 后，可查看 3DGS、点云、深度、法线和相机参数。',
    verdict: 'GIF 证明功能流程和输出形态存在，不代表所有输入都达到同一质量或耗时。', source: '官方 GitHub、中文文档与 recon 演示 GIF',
    explanation: '这一展示与论文 Figure 12 的 Any-Modal 输入、共享骨干和多输出头对应：一次空间理解服务多类几何产物。',
    conditions: ['RGB 始终必需', '先验按可用性接入', '演示不是统一指标'],
    media: './images/official-reconstruction.gif', mediaAlt: 'HY-World 2.0 官方多视图重建演示',
    href: 'https://github.com/Tencent-Hunyuan/HY-World-2.0', linkLabel: '打开官方 GitHub ↗',
  },
  {
    id: 'official-runtime', title: 'WorldLens 资产运行时', level: 'official',
    claim: '官方演示展示 Mesh 漫游、IBL 光照、碰撞代理与角色在生成后资产中的移动。',
    verdict: '它证明资产可以进入运行时探索；不能据此声称完整世界正在随角色动作实时生成。', source: '官方项目页与 interactive GIF',
    explanation: 'HY-World 2.0 先离线生成或重建显式资产，WorldLens 再负责实时渲染和交互。两个生命周期必须分开表述。',
    conditions: ['资产已经生成完成', '碰撞效果是功能展示', '不推导统一帧率或物理准确率'],
    media: './images/official-interactive.gif', mediaAlt: 'HY-World 2.0 官方角色漫游与碰撞演示',
    href: 'https://3d-models.hunyuan.tencent.com/world/', linkLabel: '查看官方交互展示 ↗',
  },
];

const synthesis = [
  { icon: '🧭', title: '按输入丰富度分流', body: '文本与单图需要生成补观察；多图与视频已有几何证据，可以直接进入 WorldMirror 2.0。' },
  { icon: '🌐', title: '主动扩展缺失观察', body: '全景、规划、关键帧与双记忆逐步补足盲区，同时控制跨路线结构和局部纹理漂移。' },
  { icon: '🏗️', title: '把新视图凝结成资产', body: '共享前馈重建、深度对齐与 3DGS 压缩把观察转换为可保存、可渲染和可运行的显式世界。' },
  { icon: '📊', title: '每一环都回到对应证据', body: '全景、记忆、重建、规模与效率分别使用各自协议验证，不能拼接成一个跨任务总分。' },
];

const articleReviews = [
  {
    title: '《HY-World 2.0：生成辅助重建的完整开源》', author: '微卷的大白', date: '2026-04-20',
    href: 'https://zhuanlan.zhihu.com/p/2028273802144936616',
    thesis: '文章把“视频生成补观察、Forward 3DGS 拉回几何”视为 HY-World 2.0 最重要的系统主线，并强调四阶段完整开放带来的工程价值。',
    useful: '它的长处是技术拆解清晰：从视频生成与传统 3DGS 的互补缺陷出发，再依次解释 HY-Pano、WorldNav、WorldStereo、WorldMirror 与 3DGS 交付，适合建立模块之间的因果关系。',
    caution: '文章涉及 Marble 观感、本地运行体验与工程评价时带有作者判断；这些内容适合作为评论阅读，不能替代论文的统一协议或官方承诺。',
    tags: ['技术拆解', '生成辅助重建', '开源工程视角'],
  },
  {
    title: '《HY-World 2.0：完整的 3D 物理世界生成与模拟系统》', author: 'Loster', date: '2026-04-18',
    href: 'https://zhuanlan.zhihu.com/p/2028634721966367663',
    thesis: '文章把 HY-World 2.0 评价为面向游戏、设计与具身智能的完整三维世界生产系统，重点讨论“为什么显式 3D 比逐帧视频更适合作为空间基础设施”。',
    useful: '它的价值在应用视角：把持久资产、可编辑几何、运行时漫游与行业需求连接起来，帮助读者理解这项工作为什么不仅是一个画面生成模型。',
    caution: '“完整物理世界”“完美重建”等表述具有概括或宣传色彩。是否物理正确、长期稳定或优于闭源产品，仍需回到论文、官方功能范围和兼容协议下的实测。',
    tags: ['应用评论', '游戏与具身', '系统价值视角'],
  },
];

const referenceGroups = [
  {
    title: '论文与官方方法入口', hint: '核对架构、公式、训练与实验数字',
    links: [
      ['HY-World 2.0 论文', 'https://arxiv.org/abs/2604.14268', '方法、公式、实验协议、消融与局限的最终依据'],
      ['腾讯混元项目主页', 'https://3d-models.hunyuan.tencent.com/world/', '四阶段功能、案例、输入路线与输出形态'],
      ['官方 GitHub', 'https://github.com/Tencent-Hunyuan/HY-World-2.0', '代码、模型、开放进度与官方演示素材'],
      ['中文 README', 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/README_zh.md', '中文项目总览、模型列表和快速入口'],
    ],
  },
  {
    title: '运行、权重与在线体验', hint: '继续复现或体验官方功能',
    links: [
      ['中文使用文档', 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/DOCUMENTATION_zh.md', '环境、推理、多 GPU、Python Pipeline 与 Gradio'],
      ['Hugging Face 权重', 'https://huggingface.co/tencent/HY-World-2.0', '官方模型卡与权重文件入口'],
      ['ModelScope 权重', 'https://modelscope.cn/models/Tencent-Hunyuan/HY-World-2.0', '国内模型镜像与文件入口'],
      ['腾讯在线体验', 'https://3d.hunyuan.tencent.com/sceneTo3D', '登录后体验产品流程；产品设置不等于论文协议'],
    ],
  },
  {
    title: '前代与相关研究', hint: '理解世界模型和前馈重建谱系',
    links: [
      ['HY-World 1.0', 'https://github.com/Tencent-Hunyuan/HunyuanWorld-1.0', '从文字或图像生成可探索显式三维世界的前代'],
      ['HY-WorldPlay / 1.5', 'https://github.com/Tencent-Hunyuan/HY-WorldPlay', '动作驱动在线视频世界路线'],
      ['World Models', 'https://arxiv.org/abs/1803.10122', '经典潜在状态、动力学与控制器路线'],
      ['Fast3R', 'https://arxiv.org/abs/2501.13928', '多视图前馈三维重建参照'],
      ['VGGT', 'https://arxiv.org/abs/2503.11651', '视觉几何 Transformer 参照'],
      ['Genie 2', 'https://deepmind.google/discover/blog/genie-2-a-large-scale-foundation-world-model/', '动作条件像素世界模型参照'],
    ],
  },
];

export const HyEvidenceCourt: React.FC<WidgetProps> = () => {
  const [level, setLevel] = useState<EvidenceLevel>('paper');
  const visible = cards.filter((card) => card.level === level);
  const [selectedId, setSelectedId] = useState(cards[0].id);
  const selected = cards.find((card) => card.id === selectedId && card.level === level) ?? visible[0];

  const chooseLevel = (next: EvidenceLevel) => {
    setLevel(next);
    const first = cards.find((card) => card.level === next);
    if (first) setSelectedId(first.id);
  };

  return <div id="quick-conclusion" className="evidence-dashboard">
    <section className="chapter-synthesis">
      <header><span>沿系统数据流回看</span><strong>从输入分流到可运行资产，每一步都对应一个瓶颈与一组证据</strong></header>
      <div>{synthesis.map((item) => <article key={item.title}><i>{item.icon}</i><strong>{item.title}</strong><p>{item.body}</p></article>)}</div>
    </section>

    <div className="evidence-level-tabs evidence-level-tabs-compact" role="tablist" aria-label="选择资料层级">
      {(Object.keys(levelMeta) as EvidenceLevel[]).map((key) => {
        const count = cards.filter((card) => card.level === key).length;
        return <button key={key} type="button" role="tab" aria-selected={level === key} className={level === key ? 'selected' : ''} onClick={() => chooseLevel(key)}>
          <strong>{levelMeta[key].label}</strong><span>{levelMeta[key].desc}</span><b>{count}</b>
        </button>;
      })}
    </div>

    <div className="evidence-dashboard-body">
      <nav aria-label="当前资料层级的结论切片">
        {visible.map((card) => <button key={card.id} type="button" className={selected.id === card.id ? 'selected' : ''} onClick={() => setSelectedId(card.id)}><span>{card.title}</span><strong>{card.claim}</strong></button>)}
      </nav>
      <section aria-live="polite">
        <header><span>{levelMeta[selected.level].label}</span><h5>{selected.title}</h5><b>{selected.source}</b></header>
        <blockquote>{selected.claim}</blockquote>
        <div className="evidence-verdict"><strong>阅读结论</strong><p>{selected.verdict}</p></div>
        <p>{selected.explanation}</p>
        <div className="evidence-condition-list">{selected.conditions.map((item) => <span key={item}>{item}</span>)}</div>
      </section>
    </div>

    {selected.tableId ? <PaperTable tableId={selected.tableId} /> : null}
    {selected.media ? <figure className="official-evidence-media"><img src={selected.media} alt={selected.mediaAlt ?? selected.title} /><figcaption><span>官方功能展示</span><p>图片或 GIF 用于确认功能、流程与输出形态，不替代论文定量实验。</p>{selected.href ? <a href={selected.href} target="_blank" rel="noreferrer">{selected.linkLabel ?? '打开官方来源 ↗'}</a> : null}</figcaption></figure> : null}

    <section className="conclusion-boundary-strip">
      <article><span>完整系统</span><strong>约 712 秒</strong><p>论文报告的完整世界生成链仍是分钟级离线流程。</p></article>
      <article><span>WorldMirror 子步骤</span><strong>5.60 秒</strong><p>只对应 H20 四卡、128 视图、518×378 的重建设置。</p></article>
      <article><span>官方 GIF</span><strong>功能证据</strong><p>证明规划、重建或运行时能力存在，不自动产生质量、帧率或物理准确率。</p></article>
    </section>

    <section className="third-party-review-section">
      <header><span>第三方解读 · 逐篇评论</span><strong>每篇文章保留自己的主张，不合并成“第三方共识”</strong><small>以下均为文章观点概括，不是原文引语，也不替代论文事实。</small></header>
      <div>{articleReviews.map((review) => <details key={review.href} className="third-party-review-card"><summary><div><span>{review.author} · {review.date}</span><strong>{review.title}</strong><small>{review.tags.join(' · ')}</small></div><b>展开评论</b></summary><div className="third-party-review-body"><blockquote>{review.thesis}</blockquote><article><span>这篇文章值得读什么</span><p>{review.useful}</p></article><article><span>阅读时保留什么边界</span><p>{review.caution}</p></article><a href={review.href} target="_blank" rel="noreferrer">阅读原文 ↗</a></div></details>)}</div>
    </section>

    <section className="reference-library">
      <header><span>继续阅读与复现</span><strong>官方功能、运行入口与相关研究按用途收纳</strong><small>灰色提示：点击任一栏展开链接；第三方评论已在上方逐篇单列。</small></header>
      <div>{referenceGroups.map((group) => <details key={group.title} className="reference-drawer"><summary><div><strong>{group.title}</strong><small>{group.hint}</small></div><b>点击展开</b></summary><ul>{group.links.map(([title, href, desc]) => <li key={href}><a href={href} target="_blank" rel="noreferrer"><strong>{title}</strong><span>{desc}</span><b>打开 ↗</b></a></li>)}</ul></details>)}</div>
    </section>

    <p className="evidence-dashboard-hint">灰色提示：论文层回答“作者报告了什么”，官方层回答“当前展示了什么功能”，第三方评论回答“别人如何理解这项工作的意义”。三者不互相替代。</p>
  </div>;
};

export default HyEvidenceCourt;

import React, { useState } from 'react';
import { PaperTable } from './hy-paper-evidence';
import type { PaperTableId } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type EvidenceLevel = 'paper' | 'official' | 'thirdparty' | 'unreported';

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
};

const levelMeta: Record<EvidenceLevel, { label: string; desc: string }> = {
  paper: { label: '论文报告', desc: '公式、表格、消融或正文直接支持' },
  official: { label: '官方展示', desc: '项目页、GitHub、产品页或官方 GIF' },
  thirdparty: { label: '第三方解读', desc: '帮助建立直觉，但不是论文证据' },
  unreported: { label: '未报告', desc: '现有资料不能支持该结论' },
};

const cards: BoundaryCard[] = [
  {
    id: 'metric', title: '协议内性能', level: 'paper',
    claim: 'HY-Pano 2.0 在表 4 的 I2P CLIP-I 上高于 CubeDiff 与 GenEx。',
    verdict: '可陈述，但只能限定在表 4 的 I2P 子协议。', source: '论文 Table 4',
    explanation: '0.844 高于 0.828 与 0.831；它衡量图像到全景的兼容指标，不是完整世界系统总排名。',
    conditions: ['同一 I2P 子协议', 'CLIP-I 越高越好', '不能外推到三维几何与运行时'], tableId: 'table-4',
  },
  {
    id: 'runtime', title: '局部效率', level: 'paper',
    claim: 'WorldMirror 2.0 在 H20 四卡、128 视图设置下报告 5.60 秒。',
    verdict: '可陈述，但不能改写为完整世界实时生成。', source: '论文 Table 14 与系统耗时汇总',
    explanation: '5.60 秒对应重建子步骤；论文完整生成链路仍约 712 秒，二者任务范围不同。',
    conditions: ['H20 四卡', 'SP + BF16 + FSDP', '128 视图、518×378'], tableId: 'table-14',
  },
  {
    id: 'marble', title: 'Marble 比较', level: 'unreported',
    claim: 'HY-World 2.0 已在统一定量协议下超过 Marble。', verdict: '不能陈述。', source: '论文只提供定性案例比较',
    explanation: '可以讨论同输入案例的纹理、忠实度与几何观感，但没有可合并的统一定量表格。',
    conditions: ['不虚构分数', '不生成胜率', '第三方体验只标个人判断'],
  },
  {
    id: 'interaction', title: '运行时交互', level: 'official',
    claim: '生成后的资产可接入 IBL、碰撞代理和角色漫游。',
    verdict: '官方资料支持能力存在，但没有统一帧率或物理准确率基准。', source: '官方项目页、GitHub 与演示 GIF',
    explanation: 'WorldLens 处理生成完成后的资产运行时；这不代表世界生成本身实时，也不证明碰撞完全物理正确。',
    conditions: ['资产已生成完成', 'GIF 是演示而非指标', '运行时和生成阶段分开'],
  },
  {
    id: 'zhihu', title: '工程直觉', level: 'thirdparty',
    claim: '视频扩散负责补未观测区域，前馈 3DGS 负责把多视图拉回显式几何。',
    verdict: '可作为署名教学概括，关键机制仍需回到论文核对。', source: '两篇已核验知乎文章',
    explanation: '两篇文章都强调“先扩展观察、再恢复显式三维”的系统价值，但 Marble 观感、应用前景和工程评价不能升级为论文结论。',
    conditions: ['术语回到论文', '体验判断明确署名', '数字不用第三方文章替代'],
  },
  {
    id: 'license', title: '开源与许可', level: 'official',
    claim: '仓库公开不等于可以按 MIT 许可证任意部署和再分发。',
    verdict: '应阅读 Tencent HY-WORLD 2.0 Community License。', source: '官方 GitHub 与 License.txt',
    explanation: '当前许可证包含地域、百万月活、分发通知与用途限制；教程只作风险提示，不构成法律意见。',
    conditions: ['核对当前版本', '部署前阅读全文', '输出权利不等于模型再分发权'],
  },
];

const synthesis = [
  { icon: '🧭', title: '系统价值', body: '最值得记住的不是某个孤立网络，而是稀疏输入生成、丰富输入重建、显式资产与运行时被接成一条可交付链路。' },
  { icon: '🧱', title: '技术抓手', body: 'HY-Pano 建上下文，WorldNav 找盲区，WorldStereo 用双记忆扩展观察，WorldMirror 把结果拉回统一几何。' },
  { icon: '⏱️', title: '现实边界', body: 'WorldMirror 子步骤可以很快，但完整世界生产仍是分钟级离线流程；生成完成后的实时漫游不能替代端到端耗时。' },
  { icon: '🔬', title: '审慎判断', body: '第三方文章普遍认可系统完整性与工程价值，但跨模型效果、闭源产品比较和长期稳定性仍需要兼容协议与更多实测。' },
];

const quickChecks = [
  { id: 'realtime', claim: '“演示里角色能实时走动，所以 HY-World 2.0 能实时生成完整世界。”', correct: false, answer: '不成立。角色漫游发生在资产生成后的 WorldLens 运行时；完整生成链路约 712 秒。' },
  { id: 'hybrid', claim: '“生成负责补观察，重建负责恢复几何”可以作为理解全系统的主线。', correct: true, answer: '可以，但要记得它是系统级教学概括，不表示所有组件共享同一网络或同一训练目标。' },
];

const referenceGroups = [
  {
    title: '论文与官方总入口', hint: '核对方法、当前开放状态与真实演示',
    links: [
      ['HY-World 2.0 论文', 'https://arxiv.org/abs/2604.14268', '公式、架构、实验与局限的最终依据'],
      ['腾讯混元项目主页', 'https://3d-models.hunyuan.tencent.com/world/', '四阶段说明、案例与输出形态'],
      ['官方 GitHub', 'https://github.com/Tencent-Hunyuan/HY-World-2.0', '代码、模型、演示素材与开放进度'],
      ['中文 README', 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/README_zh.md', '中文项目概览与快速入口'],
      ['中文使用文档', 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/DOCUMENTATION_zh.md', '环境、推理、多 GPU 与 Gradio'],
    ],
  },
  {
    title: '权重、体验与许可证', hint: '真正运行或部署前必须检查',
    links: [
      ['Hugging Face 权重', 'https://huggingface.co/tencent/HY-World-2.0', '官方模型卡与文件入口'],
      ['ModelScope 权重', 'https://modelscope.cn/models/Tencent-Hunyuan/HY-World-2.0', '国内模型镜像入口'],
      ['腾讯在线体验', 'https://3d.hunyuan.tencent.com/sceneTo3D', '当前需要登录，产品设置不等于论文协议'],
      ['Community License', 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/License.txt', '地域、月活、分发与用途限制'],
    ],
  },
  {
    title: '相关文章与中文讲解', hint: '建立工程直觉，不能替代论文证据',
    links: [
      ['生成辅助重建的完整开源', 'https://zhuanlan.zhihu.com/p/2028273802144936616', '四阶段管线、生成与前馈重建的互补关系'],
      ['完整的 3D 物理世界生成与模拟系统', 'https://zhuanlan.zhihu.com/p/2028634721966367663', '模块细节、应用方向与整体系统视角'],
      ['HY-World 1.0 官方仓库', 'https://github.com/Tencent-Hunyuan/HunyuanWorld-1.0', '显式三维世界生成前代'],
      ['HY-WorldPlay / 1.5', 'https://github.com/Tencent-Hunyuan/HY-WorldPlay', '动作驱动在线视频世界路线'],
    ],
  },
  {
    title: '相关论文与比较模型', hint: '用于理解世界模型和多视图重建谱系',
    links: [
      ['World Models', 'https://arxiv.org/abs/1803.10122', '经典潜在状态、动力学与控制器路线'],
      ['Fast3R', 'https://arxiv.org/abs/2501.13928', '多视图前馈三维重建'],
      ['VGGT', 'https://arxiv.org/abs/2503.11651', '视觉几何 Transformer'],
      ['CUT3R', 'https://arxiv.org/abs/2501.12387', '连续三维重建'],
      ['π³', 'https://arxiv.org/abs/2507.13347', '置换等变视觉几何模型'],
      ['Genie 2', 'https://deepmind.google/discover/blog/genie-2-a-large-scale-foundation-world-model/', '动作条件像素世界模型参照'],
      ['Marble 体验页', 'https://marble.worldlabs.ai/', '论文中的闭源定性参照，不能构造统一分数'],
    ],
  },
];

export const HyEvidenceCourt: React.FC<WidgetProps> = () => {
  const [level, setLevel] = useState<EvidenceLevel>('paper');
  const visible = cards.filter((card) => card.level === level);
  const [selectedId, setSelectedId] = useState(cards[0].id);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const selected = cards.find((card) => card.id === selectedId && card.level === level) ?? visible[0];

  const chooseLevel = (next: EvidenceLevel) => {
    setLevel(next);
    const first = cards.find((card) => card.level === next);
    if (first) setSelectedId(first.id);
  };

  return <div className="evidence-dashboard">
    <section className="chapter-synthesis">
      <header><span>贯穿全文后的最终地图</span><strong>四句话带走 HY-World 2.0</strong></header>
      <div>{synthesis.map((item) => <article key={item.title}><i>{item.icon}</i><strong>{item.title}</strong><p>{item.body}</p></article>)}</div>
    </section>

    <div className="evidence-level-tabs" role="tablist" aria-label="选择证据层级">
      {(Object.keys(levelMeta) as EvidenceLevel[]).map((key) => {
        const count = cards.filter((card) => card.level === key).length;
        return <button key={key} type="button" role="tab" aria-selected={level === key} className={level === key ? 'selected' : ''} onClick={() => chooseLevel(key)}>
          <strong>{levelMeta[key].label}</strong><span>{levelMeta[key].desc}</span><b>{count}</b>
        </button>;
      })}
    </div>

    <div className="evidence-dashboard-body">
      <nav aria-label="当前证据层级的结论切片">
        {visible.map((card) => <button key={card.id} type="button" className={selected.id === card.id ? 'selected' : ''} onClick={() => setSelectedId(card.id)}><span>{card.title}</span><strong>{card.claim}</strong></button>)}
      </nav>
      <section aria-live="polite">
        <header><span>{levelMeta[selected.level].label}</span><h5>{selected.title}</h5><b>{selected.source}</b></header>
        <blockquote>{selected.claim}</blockquote>
        <div className="evidence-verdict"><strong>边界结论</strong><p>{selected.verdict}</p></div>
        <p>{selected.explanation}</p>
        <div className="evidence-condition-list">{selected.conditions.map((item) => <span key={item}>{item}</span>)}</div>
      </section>
    </div>

    {selected.tableId ? <PaperTable tableId={selected.tableId} /> : null}

    <section className="boundary-quick-checks">
      <header><span>两道边界快问 · 不计分</span><strong>只检查是否把不同生命周期或证据层级混在一起</strong></header>
      <div>{quickChecks.map((item) => {
        const answer = answers[item.id];
        return <article key={item.id}><p>{item.claim}</p><div><button type="button" className={answer === true ? 'selected' : ''} onClick={() => setAnswers((current) => ({ ...current, [item.id]: true }))}>可以这样说</button><button type="button" className={answer === false ? 'selected' : ''} onClick={() => setAnswers((current) => ({ ...current, [item.id]: false }))}>不能这样说</button></div>{answer !== undefined && answer !== null ? <span className={answer === item.correct ? 'good' : 'bad'}>{answer === item.correct ? '判断准确。' : '还差一个限定。'} {item.answer}</span> : null}</article>;
      })}</div>
    </section>

    <section className="reference-library">
      <header><span>继续阅读与复现</span><strong>所有外部资料按用途收进下拉框</strong><small>灰色提示：点击任一栏展开链接；第三方文章用于理解，论文与官方资料用于核验。</small></header>
      <div>{referenceGroups.map((group) => <details key={group.title} className="reference-drawer"><summary><div><strong>{group.title}</strong><small>{group.hint}</small></div><b>点击展开</b></summary><ul>{group.links.map(([title, href, desc]) => <li key={href}><a href={href} target="_blank" rel="noreferrer"><strong>{title}</strong><span>{desc}</span><b>打开 ↗</b></a></li>)}</ul></details>)}</div>
    </section>

    <p className="evidence-dashboard-hint">灰色提示：末章不追求“答题通关”，而是让每个结论带着来源、协议、条件和仍未知的部分离开页面。</p>
  </div>;
};

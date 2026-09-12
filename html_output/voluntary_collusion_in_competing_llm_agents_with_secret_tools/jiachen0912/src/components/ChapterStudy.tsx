import React from 'react';
import { Collapsible } from './Collapsible';

// 章末学习区（折叠）：新手卡点（#7）+ 思考任务（#9）+ 设计考量（#5）。

interface StudyData {
  pitfall: { q: string; a: string };
  task: string;
  design?: { considerations: string[]; alternatives: string[]; verdict: string };
}

const STUDY: Record<string, StudyData> = {
  'chap-1': {
    pitfall: {
      q: '「智能体」到底是什么、怎么「玩」？',
      a: '智能体＝LLM 按提示词读状态、生成一段动作文字（如「出一张牌」）。它没有手，只输出文字，环境再解析成动作。',
    },
    task: '如果你是设计者，会给智能体递一件「明显不公平但有利」的工具吗？论文为什么非要这么做？',
  },
  'chap-2': {
    pitfall: {
      q: '为什么用游戏研究现实合谋，不是直接用金融/拍卖？',
      a: '游戏可复现、可精确测量、可归因；现实合谋无法控制变量、也难取证。用游戏先建立「可观测的脆弱性」。',
    },
    task: '找一个你熟悉的游戏，判断它更像 Liar’s Bar（欺骗）还是 Cleanup（公共资源），并说为什么。',
    design: {
      considerations: ['需要两种不同激励结构（欺骗 vs 公共资源）检验稳健性', '既要够复杂（多轮、策略推理），又要可归因'],
      alternatives: ['单一环境（更简单，但只有一种激励）', '囚徒困境（太简单，无策略深度）', '真实场景（真实但不可控、不可复现）'],
      verdict: '论文选「两个结构不同的战略游戏」，是在「真实性」与「可控性」之间取平衡。',
    },
  },
  'chap-3': {
    pitfall: {
      q: '「认账」是真懂，还是背答案？',
      a: '论文只能观测到「输出里写了不公平」，是否「真懂」不可知——这是它的诚实边界；它只证明「识别与行动脱节」。',
    },
    task: '假设你是 GPT-4.1，收到「不公平但能赢」的工具，用两句话写一段你的推理，再对比 Claude 会怎么写。',
    design: {
      considerations: ['为什么选 Claude vs GPT 做对照（都识别不公平、决策却相反）', '为什么各取 40 条轨迹（匹配每个批次的样本量）'],
      alternatives: ['只看接受率（看不到「认账」这一步）', '只看单个模型（无法对比「权衡方向」的差别）'],
      verdict: '用「识别率 vs 决策」的对照，把「识别」和「行动」两个环节隔离开。',
    },
  },
  'chap-4': {
    pitfall: {
      q: '「弱合谋」和「强合谋」差在哪？',
      a: '弱合谋只看效用结果（合谋者升、受害者降）；强合谋还要求双方都在纳什均衡。论文不假设纳什，所以只主张弱。',
    },
    task: '把「合谋者/受害者」换成你身边一个例子（如小组作业搭便车），写出谁效用升、谁效用降。',
  },
  'chap-5': {
    pitfall: {
      q: '「秘密工具」和「信息不对称」到底差在哪？',
      a: '单方面偷看是「信息不对称」；只有「接受＋提名同伙＋对方互惠回应」才升级为「合谋」。',
    },
    task: '「秘密通信」和「秘密提示」，哪个更接近「信息不对称」？论文为什么仍把两者都归为「合谋工具」？',
    design: {
      considerations: ['为什么把「提示」也算作合谋工具（需提名同伙＋互惠回应）', '为什么工具要明码标价「不公平」'],
      alternatives: ['只给通信不给提示（少测一种机制）', '把工具描述成中性（就测不到「自愿性」了）'],
      verdict: '工具设计同时隔离了「自愿性」和「信息不对称」两个变量。',
    },
  },
  'chap-6': {
    pitfall: {
      q: '「接受率 100%」是不是太干净、反而可疑？',
      a: '确实是 500/500（σ=0）；论文专门说明这是采样集中，并用良性工具对照排除了「默认服从」。',
    },
    task: '如果被选中的同伙拒绝了邀请，会发生什么？这对应论文里的「单边 vs 双边」哪个数据？',
  },
  'chap-7': {
    pitfall: {
      q: '「公平性 E 0.74→0.60」差 0.14 重要吗？',
      a: 'E∈[0,1]，0.14 是明显的分布集中；且论文还给了 p＜0.001 和中等以上效应量，不只是「看起来」。',
    },
    task: 'Cleanup 里清理（φ_env）和 zap（φ_str）都不直接给分——为什么智能体还会做？用价值函数解释。',
  },
  'chap-8': {
    pitfall: {
      q: '为什么要 12 个模型、6 种提示，不嫌多吗？',
      a: '跨尺度、跨厂商、跨措辞重复，是为了证明结论不是「某个模型」或「某句话」的偶然。',
    },
    task: '如果只测一个模型、一种提示，会漏掉什么？用论文里的一个反例说明。',
    design: {
      considerations: ['排除位置偏差（打乱伙伴列表）', '排除默认服从（良性工具对照）', '排除措辞触发（V1–V5 变体）', '控制推理成本（7B 500 次 vs 闭源 100 次）'],
      alternatives: ['仅单一批次（噪声大）', '不给对照（无法归因）', '固定伙伴顺序（位置偏差）'],
      verdict: '每个「控制」都对应一个潜在混淆因素；实验设计＝对混淆因素的逐个封堵。',
    },
  },
  'chap-9': {
    pitfall: {
      q: 'Claude/GPT 决策相反，能说明什么？',
      a: '说明拒绝是「权衡」而非「无意识」——两者都识别了不公平，只是权衡方向不同（原则优先 vs 获胜优先）。',
    },
    task: '一个对手要给你递合谋工具，会不会加「不公平」警告？这解释了论文为什么用 V1 当真实威胁模型。',
    design: {
      considerations: ['V1–V3 逐条剥离关键词、V4/V5 反向加伦理', '为什么额外加「良性工具对照」'],
      alternatives: ['只测 V0（无法排除措辞触发）', '只测 V4/V5（会高估安全）'],
      verdict: '六种变体＝对「拒绝到底由什么触发」的逐因素消融。',
    },
  },
  'chap-10': {
    pitfall: {
      q: 'p＜0.001、Cliff’s δ 是什么？',
      a: 'p＜0.001≈「极不可能是偶然」；Cliff’s δ 是效应大小，中等以上＝不只是统计显著，也有实际意义。',
    },
    task: '只看「接受率」会高估合谋吗？回顾 Claude 拒绝的情况，说说「单边 vs 双边」的差别。',
    design: {
      considerations: ['为什么用挑战率/清理率等「行为率」而非只看输赢', '为什么用公平性 E 汇总分布', '为什么用 Mann–Whitney U + Cliff’s δ'],
      alternatives: ['只看累计得分（看不到机制）', '只看均值（看不到分布集中）', '只报 p 值（看不到效应大小）'],
      verdict: '三层度量（采纳/行为/后果）分别回答「会不会做 / 做了什么 / 造成什么」。',
    },
  },
};

export function ChapterStudy({ chapterId }: { chapterId: string }) {
  const d = STUDY[chapterId];
  if (!d) return null;
  return (
    <Collapsible
      summary={
        <>
          💡 新手卡点 · 🧠 思考任务{d.design ? ' · 🧭 设计考量' : ''}
          <span className="collapsible-hint">（点击展开）</span>
        </>
      }
    >
      <div className="csy-pitfall">
        <span className="csy-tag">💡 新手卡点</span>
        <span className="csy-q">{d.pitfall.q}</span>
        <span className="csy-a">{d.pitfall.a}</span>
      </div>
      <div className="csy-task">
        <span className="csy-tag">🧠 思考任务</span>
        <span>{d.task}</span>
      </div>
      {d.design ? (
        <div className="csy-design">
          <div className="csy-tag">🧭 设计考量</div>
          <div className="csy-line">
            <b>考量了什么</b>：{d.design.considerations.join('；')}。
          </div>
          <div className="csy-line">
            <b>同类问题的其它方法</b>：{d.design.alternatives.join('；')}。
          </div>
          <div className="csy-line">
            <b>小结</b>：{d.design.verdict}
          </div>
        </div>
      ) : null}
    </Collapsible>
  );
}

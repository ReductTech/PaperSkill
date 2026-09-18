import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: {
    titleEn: "GigaAM Multilingual: Foundation Model for Underrepresented Languages",
    titleZh: "让代表性不足的语言被语音模型听见",
    venue: "arXiv 2026",
    authors: "Andrei Kuzmenko、Alexandr Maximenko、Aleksandr Kutsakov 等",
    affiliation: "SaluteDevices",
    domain: "多语言自动语音识别",
    coreProblem: "大规模多语言预训练数据分布严重不均，头部语言会淹没代表性不足语言的训练信号。",
    coreInsight: "在语言簇层面重加权，并在微调阶段同时平衡语言与数据域，可稳定改善目标中亚语言。",
    keywords: ["多语言 ASR", "语言簇采样", "领域感知微调"],
  },
  hero: {
    oldMethod: { desc: "直接沿用自然数据分布时，头部语言获得大部分训练预算，长尾语言难以形成稳健表征。" },
    newMethod: { desc: "先按语言共现关系形成语言簇，再调整簇权重，并在微调时控制不同数据来源。" },
  },
  chapters: [
    {
      kind: "chapter",
      id: "problem",
      title: "为什么有些语言听不见",
      badge: "inf",
      badgeLabel: "研究问题",
      bridge: "先观察训练数据的不平衡，再判断单纯扩大数据规模为什么无法自动照顾长尾语言。",
      analogy: { title: "合唱中的弱声部", text: "当一个声部人数过多时，继续扩大合唱团只会让它更响；必须重新安排各声部的音量。" },
      modules: [
        { kind: "module", id: "1.1", title: "数据不平衡对比", desc: "切换自然分布与重加权视图，观察五个语言簇获得的训练份额。", componentId: "imbalance-comparison" },
      ],
      insight: "规模不是公平覆盖的保证，采样策略决定每种语言实际得到多少学习机会。",
      takeaways: [
        { icon: "📊", title: "分布偏斜", desc: "E0 中头部语言簇占据主要预训练权重。" },
        { icon: "🎧", title: "长尾受损", desc: "目标中亚语言得到的有效训练信号较少。" },
        { icon: "⚖️", title: "需要重配", desc: "问题的关键是重新分配训练预算。" },
      ],
    },
    {
      kind: "chapter",
      id: "method",
      title: "从识别语言到训练模型",
      badge: "both",
      badgeLabel: "方法流程",
      bridge: "论文把海量未标注音频转化为可控训练数据，并用连续四步完成筛选、聚类、预训练和微调。",
      analogy: { title: "调音师逐轨检查", text: "调音师先辨认每条声轨，再按声音关系分组，最后调整各组音量并完成混音。" },
      modules: [
        { kind: "module", id: "2.1", title: "四步方法导览", desc: "点击步骤查看 VAD、语言识别、语言簇、自监督目标与领域感知微调。", componentId: "method-stepper" },
      ],
      formula: {
        lead: "语言共现边权按两种语言的总体频次归一化，避免高频语言天然占据图中心。",
        unicode: "wᵢⱼ = cᵢⱼ / √(nᵢnⱼ)",
        symbols: [
          { sym: "cᵢⱼ", desc: "语言 i 与 j 的共现次数" },
          { sym: "nᵢ", desc: "语言 i 的总体出现次数" },
        ],
      },
      takeaways: [
        { icon: "🔎", title: "可靠筛选", desc: "VAD 与语言识别门槛减少错误语料。" },
        { icon: "🕸️", title: "语言成簇", desc: "共现关系提供比单语言更稳定的采样粒度。" },
        { icon: "🧠", title: "共享表征", desc: "自监督预训练让相关语言共享声学知识。" },
      ],
    },
    {
      kind: "chapter",
      id: "data",
      title: "数据多并不等于数据好",
      badge: "trn",
      badgeLabel: "数据配方",
      bridge: "相同语言内部也存在公开、众包、弱监督和合成等不同数据域，数量最大的来源未必最接近真实场景。",
      analogy: { title: "调音时区分录音环境", text: "同一位歌手在录音棚与嘈杂现场的声音不同，混合时需要分别控制比例。" },
      modules: [
        { kind: "module", id: "3.1", title: "语言簇关系", desc: "查看目标语言所在的 C3 簇及其在不同实验中的采样份额。", componentId: "language-clusters" },
        { kind: "module", id: "3.2", title: "数据来源切换", desc: "切换五种语言，比较各类微调数据的小时数和主要风险。", componentId: "language-data-tabs" },
      ],
      insight: "哈萨克语与吉尔吉斯语的大量合成语音需要分域控制，乌兹别克语则没有相同的数据条件。",
      takeaways: [
        { icon: "🗂️", title: "来源不同", desc: "真实、朗读、弱监督和合成语音不能视为同一分布。" },
        { icon: "🧪", title: "合成主导", desc: "部分语言的合成时长远高于公开真实语料。" },
        { icon: "🎚️", title: "分域采样", desc: "微调需要同时平衡语言和数据来源。" },
      ],
    },
    {
      kind: "chapter",
      id: "experiments",
      title: "亲自比较 E0 到 E3",
      badge: "both",
      badgeLabel: "消融实验",
      bridge: "四种方案改变语言簇权重，读者可以同时观察目标语言改善与英语性能回退。",
      analogy: { title: "重新推高弱声部", text: "调高弱声部能让它被听见，但过度调整也会破坏整体平衡。" },
      modules: [
        { kind: "module", id: "4.1", title: "采样权重实验台", desc: "切换 E0–E3，观察五个语言簇的权重和说明同步变化。", componentId: "sampling-lab" },
        { kind: "module", id: "4.2", title: "WER 变化比较", desc: "查看各语言相对 E0 上升或下降的百分点；WER 越低越好。", componentId: "wer-comparison" },
      ],
      insight: "E2 把 C3 从 8% 提高到 25%，三个目标语言均改善，因此被论文采用。",
      takeaways: [
        { icon: "✅", title: "E2 被采用", desc: "目标语言整体表现达到论文选定的平衡点。" },
        { icon: "↘️", title: "长尾改善", desc: "哈萨克语、吉尔吉斯语和乌兹别克语的 WER 均下降。" },
        { icon: "↗️", title: "存在代价", desc: "英语 WER 有所上升，说明优化包含取舍。" },
      ],
    },
    {
      kind: "chapter",
      id: "takeaways",
      title: "论文证明了什么",
      badge: "both",
      badgeLabel: "结论与局限",
      bridge: "把实验结果收束成可迁移的判断，同时保留数据公开性、适用范围和性能取舍的边界。",
      analogy: { title: "听完整场混音", text: "最终判断不能只听一个声部，还要检查整体平衡和没有被展示的录音条件。" },
      modules: [
        { kind: "module", id: "5.1", title: "关键结论与限制", desc: "展开三条结论和四项限制，区分论文证据与网页解释。", componentId: "conclusion-cards" },
      ],
      insight: "语言簇重加权和领域感知采样有效，但内部数据与测试集限制了完整复现。",
      takeaways: [
        { icon: "🧭", title: "策略重要", desc: "数据采样方式与模型规模同样影响长尾语言。" },
        { icon: "🔒", title: "复现受限", desc: "内部预训练数据和测试集没有完整公开。" },
        { icon: "🌍", title: "范围有限", desc: "结论仍需在更多代表性不足语言上验证。" },
      ],
    },
    {
      kind: "chapter",
      id: "quiz",
      title: "检查你的理解",
      badge: "both",
      badgeLabel: "即时测验",
      bridge: "通过三道问题重新判断语言簇、领域感知采样和 E2 方案的作用。",
      analogy: { title: "完成一次试听验收", text: "真正理解意味着能解释为什么要调、调了什么，以及为此付出了什么。" },
      modules: [
        { kind: "module", id: "6.1", title: "三题即时反馈", desc: "选择答案后立即显示正确选项和原因解释。", componentId: "quiz-feedback" },
      ],
      takeaways: [
        { icon: "🧩", title: "理解机制", desc: "语言簇提供稳定的中间采样粒度。" },
        { icon: "📉", title: "读懂指标", desc: "WER 越低越好，变化必须在相同协议下比较。" },
        { icon: "💡", title: "看到取舍", desc: "提升长尾语言可能伴随头部语言回退。" },
      ],
    },
  ],
};

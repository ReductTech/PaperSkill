import type { TutorialData } from "../types";

/**
 * PaperSkill submission manifest.
 *
 * The public presentation is implemented by the six purpose-built sections in
 * `src/presentation/`. This typed record mirrors those sections so the project
 * also satisfies the collection's data-contract and remains indexable by the
 * shared PaperSkill tooling.
 */
export const tutorial: TutorialData = {
  meta: {
    titleEn: "ABot-M0.5: Unified Mobility-and-Manipulation World Action Model",
    titleZh: "ABot-M0.5：统一移动与操作的世界动作模型",
    venue: "arXiv 2026",
    authors: "Ronghan Chen 等",
    affiliation: "AMAP CV Lab",
    domain: "具身智能 · 世界动作模型 · 移动操作",
    coreProblem: "世界预测与机器人真实控制之间存在时间粒度、动作空间和训练—部署条件三重错配。",
    coreInsight: "在同一条世界预测到真实行动的因果链上，分别修复三种结构性错配。",
    keywords: ["Temporal Alignment", "Dual-Level MoT", "Dream Forcing"],
  },
  hero: {
    oldMethod: {
      desc: "粗粒度视频、混合动作动力学和完美未来监督，使世界模型难以稳定落到真实控制。",
    },
    newMethod: {
      desc: "以潜在动作、动作解耦和自生成未来训练，完成时间、动作空间与训练部署三次对齐。",
    },
  },
  chapters: [
    {
      kind: "chapter",
      id: "scene-01",
      title: "三重结构错配",
      badge: "both",
      badgeLabel: "问题",
      bridge: "先判断瓶颈来自模型规模，还是世界预测与真实控制的接口。",
      analogy: { title: "三个失败现场", text: "用变脸过程、手脚协同与彩排条件分别看见三类错配。" },
      modules: [
        { kind: "module", id: "1.1", title: "时间粒度错配", desc: "切换两条终点相同但过程不同的运动路径。", componentId: "example-slider" },
        { kind: "module", id: "1.2", title: "动作与条件错配", desc: "比较手脚混控以及训练部署条件改变后的后果。", componentId: "example-slider" },
      ],
      takeaways: [
        { icon: "①", title: "时间粒度", desc: "粗视频无法直接说明连续控制过程。" },
        { icon: "②", title: "动作空间", desc: "移动与操作具有不同动力学。" },
        { icon: "③", title: "训练—部署", desc: "完美未来与自预测未来的条件分布不同。" },
      ],
    },
    {
      kind: "chapter",
      id: "scene-02",
      title: "一条因果链上的三次对齐",
      badge: "both",
      badgeLabel: "总体思路",
      bridge: "用机器人接高速羽毛球，把三个创新放回同一个任务目标。",
      analogy: { title: "一次羽毛球回合", text: "看准时机、协调手脚，并在风与触球偏差后继续回球。" },
      modules: [
        { kind: "module", id: "2.1", title: "看未来", desc: "逐步查看未来视频提供的整体结果。", componentId: "example-slider" },
        { kind: "module", id: "2.2", title: "三次对齐", desc: "依次点亮时间、动作空间和训练部署对应关系。", componentId: "example-slider" },
      ],
      takeaways: [
        { icon: "z", title: "先预测", desc: "Future Video 描述未来状态。" },
        { icon: "m", title: "再理解", desc: "Latent Action 表示局部运动变化。" },
        { icon: "a", title: "后控制", desc: "Robot Action 才是最终执行信号。" },
      ],
    },
    {
      kind: "chapter",
      id: "scene-03",
      title: "Temporal Alignment",
      badge: "inf",
      badgeLabel: "Innovation 1",
      bridge: "看到跳跃终点，不等于知道每一时刻该怎样越过深坑。",
      analogy: { title: "横版游戏过坑", text: "从终点关键帧反推助跑、起跳、腾空和落地的局部运动过程。" },
      modules: [
        { kind: "module", id: "3.1", title: "只看未来", desc: "先体验粗粒度未来直接控制的缺失信息。", componentId: "example-slider" },
        { kind: "module", id: "3.2", title: "潜在动作桥梁", desc: "逐步揭示 z → m → a 的时间粒度翻译。", componentId: "example-slider" },
      ],
      insight: "Latent Action 不是电机命令，而是相邻视觉状态之间的局部运动语义。",
      takeaways: [
        { icon: "🎞", title: "视频较粗", desc: "Future Video 给出未来状态。" },
        { icon: "↝", title: "运动居中", desc: "m 补充局部状态转移。" },
        { icon: "🎮", title: "控制更细", desc: "动作解码器输出连续控制。" },
      ],
    },
    {
      kind: "chapter",
      id: "scene-04",
      title: "Action-Space Alignment",
      badge: "inf",
      badgeLabel: "Innovation 2",
      bridge: "移动和操作需要分别专业化，同时共享同一个任务与场景。",
      analogy: { title: "风火轮与火尖枪", text: "先一起看战场，再分别决定怎样移动和怎样精细操作。" },
      modules: [
        { kind: "module", id: "4.1", title: "三种学习方式", desc: "比较混合学习、完全隔离与分工协作。", componentId: "example-slider" },
        { kind: "module", id: "4.2", title: "Dual-Level", desc: "展开模态层和动作层两级对齐的论文形式。", componentId: "example-slider" },
      ],
      insight: "Attention 负责共享信息，专用 Experts 负责异质动作动力学。",
      takeaways: [
        { icon: "◉", title: "一起看", desc: "Joint Attention 交换任务与场景信息。" },
        { icon: "◫", title: "分别学", desc: "Mobility 与 Manipulation 使用专用分支。" },
        { icon: "⇄", title: "保持协同", desc: "分工不等于隔离。" },
      ],
    },
    {
      kind: "chapter",
      id: "scene-05",
      title: "Train-Test Alignment",
      badge: "trn",
      badgeLabel: "Innovation 3",
      bridge: "部署时只能从模型自己预测出的未来继续，因此训练也要见过这种条件。",
      analogy: { title: "棋谱与实战", text: "只背标准棋谱不够，还要学会从自己刚走出的不完美局面继续。" },
      modules: [
        { kind: "module", id: "5.1", title: "Teacher Forcing 错配", desc: "对比标准未来与自预测未来的条件变化。", componentId: "example-slider" },
        { kind: "module", id: "5.2", title: "Dream Forcing 两阶段", desc: "先生成 dreamed future，再在该条件下预测动作。", componentId: "example-slider" },
      ],
      insight: "Dream Forcing 不保证永不犯错，而是提高面对自身预测误差时的稳健性。",
      takeaways: [
        { icon: "●", title: "标准未来", desc: "Teacher Forcing 始终提供正确条件。" },
        { icon: "◌", title: "自生成未来", desc: "部署条件包含模型自身误差。" },
        { icon: "→", title: "继续行动", desc: "训练动作模型从不完美未来继续。" },
      ],
    },
    {
      kind: "chapter",
      id: "scene-06",
      title: "三个创新，一件事",
      badge: "both",
      badgeLabel: "总结",
      bridge: "三把钥匙分别修复同一条因果链上的三种错配。",
      analogy: { title: "三把钥匙开同一把锁", text: "时间、动作空间和训练部署对齐共同打通从预测到行动的链路。" },
      modules: [
        { kind: "module", id: "6.1", title: "召回三段故事", desc: "逐把点亮钥匙并召回前三页核心视觉。", componentId: "example-slider" },
        { kind: "module", id: "6.2", title: "打开对齐之锁", desc: "让世界预测、运动抽象、真实控制与部署条件形成闭环。", componentId: "example-slider" },
      ],
      insight: "ABot-M0.5 的核心不是更大的模型，而是更少的错配。",
      takeaways: [
        { icon: "1", title: "Temporal", desc: "视频粒度对齐控制粒度。" },
        { icon: "2", title: "Action-Space", desc: "移动与操作各自专业化并保持协同。" },
        { icon: "3", title: "Train-Test", desc: "训练条件对齐部署条件。" },
      ],
    },
  ],
};

export default tutorial;

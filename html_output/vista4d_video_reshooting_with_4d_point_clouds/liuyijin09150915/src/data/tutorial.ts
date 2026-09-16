import type { TutorialData } from "../types";

// PaperSkill validation/catalog metadata only.
// The live page continues to render from App.tsx -> vista4d.ts -> TutorialChapters.tsx.
export const tutorial: TutorialData = {
  meta: {
    titleEn: "Vista4D: Video Reshooting with 4D Point Clouds",
    titleZh: "Vista4D：基于 4D 点云的视频重拍",
    summary: "给定一段已拍摄的源视频，Vista4D 以 4D 点云显式约束场景内容与目标摄影机，并结合视频扩散先验，在用户指定的新轨迹和视点下合成保持原动态的重拍视频。",
    keywords: ["视频重拍", "4D 点云", "摄影机控制", "视频扩散模型", "动态场景"],
  },
  landing: {
    id: "hero",
    title: "Vista4D: Video Reshooting with 4D Point Clouds",
    modules: [
      {
        kind: "module",
        id: "hero-method-comparison",
        title: "现有方法与 Vista4D 的换机位生成对比",
        componentId: "hero-method-comparison",
      },
    ],
  },
  chapters: [
    {
      kind: "chapter",
      id: "section-1",
      title: "摄影机已经停机，镜头还能重新拍吗？",
      badge: "inf",
      badgeLabel: "重拍之前 · 为何重拍",
      bridge: "先理解视频重拍（Video Reshooting）为什么比普通视频生成更难：既要保留已有内容，又要补全未见区域，还要精确控制摄影机。",
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "什么是视频重拍",
          description: "给定已经拍摄完成的源视频，在保持同一场景内容与动态事件的前提下，根据用户指定的新摄影机轨迹或视点，重新合成同一动态场景的新机位视频。",
          componentId: "hero-camera-lab",
        },
        {
          kind: "module",
          id: "1.2",
          title: "Vista4D 能实现什么",
          componentId: "hero-official-demo",
        },
        {
          kind: "module",
          id: "1.3",
          title: "视频重拍为什么困难",
          description: "依次点击三个难题，看看一次可信的视频重拍为什么同时受到这三类约束。",
          componentId: "problem-monitor",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-2",
      title: "Vista4D 的 4D 点云从哪里来？",
      badge: "inf",
      badgeLabel: "4D 点云构建",
      bridge: "把二维源视频提升到统一世界坐标，并理解 Vista4D 如何构建时间持久性 4D 点云。",
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "一个视频像素如何变成三维点",
          description: "点云中的点，最初来自视频画面中的像素。选择一个像素，再逐步观察它如何获得距离、沿射线进入空间。",
          componentId: "point-cloud-lab",
        },
        {
          kind: "module",
          id: "2.2",
          title: "一帧 3D 点云如何变成随时间变化的 4D 场景",
          description: "一帧点云只有空间坐标 (x, y, z)。加入帧时间 t，并区分静态与动态内容，才能表达同一场景如何随时间变化。",
          componentId: "point-cloud-lab",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-3",
      title: "让静态场景跨时间存在",
      badge: "inf",
      badgeLabel: "时间持久性 4D 点云",
      bridge: "理解为什么静态像素需要跨帧持续存在，以及这种设计如何帮助内容保持和摄影机控制。",
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "时间持续性",
          description: "理解为什么静态像素需要跨帧持续存在，以及这种设计如何帮助内容保持和摄影机控制。",
          componentId: "temporal-persistence-lab",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-4",
      title: "目标摄影机越偏离，几何问题越容易暴露",
      badge: "both",
      badgeLabel: "摄影机偏离与几何伪影",
      bridge: "观察目标摄影机偏离原始视角后，为什么不完美的 4D 重建会暴露几何伪影。",
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "偏离源视角时会发生什么",
          description: "观察目标摄影机偏离原始视角后，为什么不完美的 4D 重建会暴露几何伪影。",
          componentId: "camera-deviation-lab",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-5",
      title: "训练时，主动看见推理时的不完美",
      badge: "trn",
      badgeLabel: "训练对构建",
      bridge: "比较双重重投影（Double Reprojection）与 Vista4D 的多视角训练方式，理解模型为什么要在训练时见到真实重建伪影。",
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "Double Reprojection vs Vista4D Multiview",
          description: "比较双重重投影（Double Reprojection）与 Vista4D 的多视角训练方式，理解模型为什么要在训练时见到真实重建伪影。",
          componentId: "training-comparison",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-6",
      title: "点云、原视频与 DiT 如何协同？",
      badge: "both",
      badgeLabel: "联合条件与训练目标",
      bridge: "用两个核心交互理解为什么点云仍需要源视频，以及 Vista4D 最终给 DiT 哪些条件。",
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "为什么点云还不够？",
          description: "已经有 4D 点云了，为什么还需要原视频？",
          componentId: "point-cloud-source-comparison",
        },
        {
          kind: "module",
          id: "6.2",
          title: "Vista4D 最终给模型什么条件？",
          description: "选择任意一种条件，查看它在生成目标视频时提供什么信息。",
          componentId: "conditioning-overview",
        },
        {
          kind: "module",
          id: "6.3",
          title: "模型如何学习？",
          description: "这些条件告诉模型依据什么生成，而 Flow Matching 决定模型如何学习。",
          componentId: "formula-explorer",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-7",
      title: "数据如何穿过 Vista4D 完整流程",
      badge: "both",
      badgeLabel: "完整流程",
      bridge: "把前面学过的模块重新连接起来，看看源视频如何一步步变成目标视角视频。",
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "Full Pipeline",
          description: "把前面学过的模块重新连接起来，看看源视频如何一步步变成目标视角视频。",
          componentId: "full-pipeline-overview",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-8",
      title: "实验结果与消融",
      badge: "both",
      badgeLabel: "实验与消融",
      bridge: "通过定量实验、用户研究和消融实验，检查 Vista4D 的摄影机控制、几何一致性与视频质量。",
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "实验结果与消融",
          description: "通过定量实验、用户研究和消融实验，检查 Vista4D 的摄影机控制、几何一致性与视频质量。",
          componentId: "playback-review",
        },
      ],
    },
    {
      kind: "chapter",
      id: "section-9",
      title: "显式 4D 场景还能做什么？",
      badge: "both",
      badgeLabel: "应用与局限",
      bridge: "理解 Vista4D 如何进一步扩展到动态场景扩展、4D 场景重组和带记忆的长视频推理。",
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "显式 4D 场景还能做什么？",
          description: "Vista4D 的显式 4D 表示还可以进一步支持场景扩展、场景重组和长视频生成。",
          componentId: "application-cards",
        },
      ],
    },
  ],
  final: {
    id: "final",
    title: "最终回顾",
    modules: [
      {
        kind: "module",
        id: "final",
        title: "掌握度检查",
        description: "这里不再引入新知识。用三个问题重建整篇论文的因果链，再回顾完整流程。",
        componentId: "final-quiz",
      },
    ],
  },
};

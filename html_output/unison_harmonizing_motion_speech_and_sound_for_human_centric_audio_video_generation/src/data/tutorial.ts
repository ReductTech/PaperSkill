import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: {
    titleEn:
      "Unison: Harmonizing Motion, Speech, and Sound for Human-Centric Audio-Video Generation",
    titleZh: "Unison：面向人物音视频生成的动作、语音与音效协同",
    venue: "arXiv:2605.08729v2 · 2026",
    authors:
      "Shihao Cheng, Jiaxu Zhang, Quanyue Song, Shansong Liu, Zhizhi Guo, Xiao-Lei Zhang, Chi Zhang, Xuelong Li, Zhigang Tu",
    affiliation: "武汉大学 · 字节跳动 · 西安交通大学 · 中国电信 AI / TeleAI",
    domain: "人物联合音视频生成 · Flow Matching · 跨模态对齐",
    coreProblem:
      "人物音视频联合生成同时面临两类失配：语音遮蔽环境音，以及动作与声音的时间错位。",
    coreInsight:
      "Unison 将语音与音效表示为可独立监督且可双向交换上下文的两条流；训练时由噪声水平较低的模态引导噪声水平较高的分支，并以渐进课程稳定这种非对称学习。",
    keywords: ["语音-音效调和", "跨模态强迫", "渐进训练", "Flow Matching"],
  },
  hero: {
    oldMethod: {
      desc: "<b>传统隐式融合：</b>语音可能遮蔽环境音，动作事件与声学事件也可能发生时间偏移。",
      componentId: "stage-scenes",
    },
    newMethod: {
      desc: "<b>Unison：</b>双流语义调和负责声学层次，渐进跨模态强迫负责时间对齐。",
      componentId: "stage-scenes",
    },
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "人物音视频生成中的两类失配",
      badge: "inf",
      badgeLabel: "核心直觉",
      bridge:
        "首先区分两类性质不同的失配：音频内部的语音—音效层次失衡，以及动作事件与声学事件之间的时间偏移。",
      analogy: {
        title: "两类失配的观测证据",
        text: "声学层次失配表现为语音遮蔽音效；跨模态时间失配表现为视觉事件与声学事件偏移。<b>两类问题需要分别建模。</b>",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "两类失配的证据诊断",
          desc: "切换两类失配，分别观察语音—音效能量比例与视觉—音频事件偏移。二者都降低生成质量，但对应的机制不同。",
          componentId: "unison-active",
        },
        {
          kind: "module",
          id: "1.2",
          title: "同条件方法对比",
          desc: "比较传统隐式融合与 Unison 在相同初始状态下的变化。图中的可闻度和偏差为<b>归一化概念示意</b>，并非论文报告的评价指标。",
          componentId: "unison-active",
        },
      ],
      insight: "Unison 分别以语音—音效协调机制处理声学层次，以跨模态强迫机制处理时间对齐。",
      takeaways: [
        {
          icon: "01",
          title: "机制区分",
          desc: "语音—音效遮蔽属于音频内部协调问题；事件偏移属于跨模态时间问题。",
        },
        {
          icon: "02",
          title: "对应机制",
          desc: "SGHS 负责语音—音效协调，CMFS 负责动作—音频对齐。",
        },
        {
          icon: "03",
          title: "适用范围",
          desc: "论文聚焦人物联合音视频生成，不代表所有音视频任务。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "双流音频表示：身份分离与时间共享",
      badge: "inf",
      badgeLabel: "表示",
      bridge:
        "为避免语音与音效在同一潜变量中相互干扰，Unison 首先显式保留两类音频成分的流身份。",
      analogy: {
        title: "双流表示的结构关系",
        text: "语音流与音效流分别建模，同时共享时间索引，从而在保留<b>模态身份</b>的条件下维持时序对应。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "双流张量视图",
          desc: "选择语音流、音效流或联合视图，检查流身份、共享时间索引和张量维度之间的对应关系。",
          componentId: "unison-active",
        },
      ],
      formula: {
        lead: "双流维度把两种音频成分放在同一批次与时间长度中。",
        unicode: "h ∈ ℝ<sup>B×2×N×D</sup>",
        symbols: [
          {
            sym: "h",
            desc: "音频双流潜变量。",
          },
          {
            sym: "B",
            desc: "批大小。",
          },
          {
            sym: "2",
            desc: "语音流与音效流。",
          },
          {
            sym: "N",
            desc: "每条流的序列长度。",
          },
          {
            sym: "D",
            desc: "特征宽度。",
          },
        ],
      },
      takeaways: [
        {
          icon: "01",
          title: "身份显式保留",
          desc: "语音与音效在双流维度中分别表示。",
        },
        {
          icon: "02",
          title: "共享时间索引",
          desc: "两条流共享 RoPE 时间索引以维持时序对应。",
        },
        {
          icon: "03",
          title: "独立监督",
          desc: "各自的流匹配损失减少源间歧义。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "双向声学交互：Bi-ACA",
      badge: "inf",
      badgeLabel: "核心机制",
      bridge:
        "双流表示保留了成分身份，但完全独立的建模会削弱语音与环境音之间的声学协调，因此需要受控的跨流上下文交换。",
      analogy: {
        title: "双向声学上下文交换",
        text: "<b>Bi-ACA</b> 让语音流与音效流互相提供注意力上下文，同时保持双流结构不变。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "Bi-ACA 信息流向",
          desc: "从隔离、单向到双向，观察注意力路径与反馈如何变化。",
          componentId: "unison-active",
        },
      ],
      insight: "双流表示负责区分音频成分，Bi-ACA 负责在保持身份的同时交换跨流声学信息。",
      formula: {
        lead: "每条流把另一条流作为注意力上下文，再以残差方式更新。",
        unicode:
          "h̃<sup>[sp|sfx]</sup> = h<sup>[sp|sfx]</sup> + Attn(LN(h<sup>[sp|sfx]</sup>), LN(h<sup>[sfx|sp]</sup>))",
        symbols: [
          {
            sym: "h̃",
            desc: "交换跨流上下文后的特征。",
          },
          {
            sym: "Attn",
            desc: "标准多头交叉注意力。",
          },
          {
            sym: "LN",
            desc: "层归一化。",
          },
          {
            sym: "sp",
            desc: "语音流。",
          },
          {
            sym: "sfx",
            desc: "音效流。",
          },
        ],
      },
      takeaways: [
        {
          icon: "01",
          title: "身份保持",
          desc: "双向上下文交换不会取消语音流与音效流的结构区分。",
        },
        {
          icon: "02",
          title: "时间对应",
          desc: "共享 RoPE 时间索引维持跨流的时序对应关系。",
        },
        {
          icon: "03",
          title: "门控需求",
          desc: "无约束的跨流更新可能损害任一音频成分，因此需要 SCG。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "语义条件门控：内容自适应的信息交换",
      badge: "both",
      badgeLabel: "门控",
      bridge:
        "Bi-ACA 建立了双向信息通路，但不同语义场景不应采用相同的跨流更新强度。SCG 根据转录与描述语义预测门值。",
      analogy: {
        title: "语义条件决定门控强度",
        text: "语音主导与音效主导场景对应不同的跨流门值；SCG 的作用对象是<b>注意力更新量</b>，而非最终混音音量。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "语义条件与门值响应",
          desc: "在语音主导、均衡与音效主导之间调节语义条件，观察两类门值的联动变化。中间状态为基于论文锚点的<b>图示插值</b>。",
          componentId: "unison-active",
          figure: "/images/unison-gates.png",
        },
      ],
      formula: {
        lead: "[c<sub>s</sub>; c<sub>a</sub>] 表示转录与描述的平均池化向量拼接；MLP 预测两门值，sigmoid 将其限制在 [0,1]。",
        unicode:
          "[<span class=\"sym fe-formula-sym\" data-sym=\"gˢᵖ\">g<sup>sp</sup></span>, <span class=\"sym fe-formula-sym\" data-sym=\"gˢᶠˣ\">g<sup>sfx</sup></span>] = σ(MLP([<span class=\"sym fe-formula-sym\" data-sym=\"cₛ\">c<sub>s</sub></span>; <span class=\"sym fe-formula-sym\" data-sym=\"cₐ\">c<sub>a</sub></span>]))",
        symbols: [
          {
            sym: "gˢᵖ",
            desc: "语音流跨流更新的门控系数；它调节从音效流注入语音流的注意力增量，范围为 [0,1]。",
          },
          {
            sym: "gˢᶠˣ",
            desc: "音效流跨流更新的门控系数；它调节从语音流注入音效流的注意力增量，范围为 [0,1]。",
          },
          {
            sym: "cₛ",
            desc: "由转录文本序列平均池化得到的语义向量；下标 s 表示 speech / transcription 条件。",
          },
          {
            sym: "cₐ",
            desc: "由场景描述文本序列平均池化得到的语义向量；下标 a 表示 audio-caption 条件。",
          },
          {
            sym: "MLP",
            desc: "多层感知机：接收拼接后的语义向量并预测语音门与音效门的两个门控量。",
          },
          {
            sym: "σ",
            desc: "sigmoid 激活函数：将 MLP 输出映射到 [0,1]，形成可解释的门值。",
          },
        ],
      },
      takeaways: [
        {
          icon: "01",
          title: "作用对象",
          desc: "SCG 调节跨流注意力增量，而非最终混音音量。",
        },
        {
          icon: "02",
          title: "条件依赖",
          desc: "门值随语义内容、网络层和时间步变化。",
        },
        {
          icon: "03",
          title: "消融有证据",
          desc: "移除 SCG 后 PQ 与 LSE-C 均下降，但幅度要按同协议解读。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "跨模态强迫：构造非对称噪声状态",
      badge: "both",
      badgeLabel: "跨模态强迫",
      bridge:
        "音频内部协调并不能直接保证动作—音频对齐。CMFS 在训练中为音频与视频采样不同时间步，以建立有方向的跨模态引导。",
      analogy: {
        title: "不同噪声水平形成引导方向",
        text: "当两种模态处于不同噪声水平时，较低噪声的一侧可为较高噪声的一侧提供条件；差异需要受训练阶段约束。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "联合时间步空间与方向变量",
          desc: "在二维时间步平面中移动状态点，观察领先方向、第二阶段允许区域与受加权分支的变化。",
          componentId: "unison-active",
          figure: "/images/unison-forcing.png",
        },
      ],
      formula: {
        lead: "方向变量只比较两个时间步；本文约定较小时间步对应较低噪声水平。",
        unicode: "d = 𝕀[t<sub>a</sub> &lt; t<sub>v</sub>]",
        symbols: [
          {
            sym: "d",
            desc: "领先模态方向指示量，取 0 或 1。",
          },
          {
            sym: "tₐ",
            desc: "音频噪声时间步。",
          },
          {
            sym: "tᵥ",
            desc: "视频噪声时间步。",
          },
          {
            sym: "𝕀",
            desc: "条件成立时为 1 的指示函数。",
          },
        ],
      },
      takeaways: [
        {
          icon: "01",
          title: "方向判定",
          desc: "较小时间步对应较低噪声，并决定跨模态条件方向。",
        },
        {
          icon: "02",
          title: "阶段约束",
          desc: "第二阶段将最大时间步差限制为 0.25。",
        },
        {
          icon: "03",
          title: "训练专用",
          desc: "CMFS 用于训练阶段，不应解释为推理阶段的交替教师机制。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "渐进训练日程：从同步到独立",
      badge: "inf",
      badgeLabel: "课程",
      bridge:
        "若从训练初期直接采用完全独立的音频与视频时间步，较大的噪声差会增加优化不稳定性，因此论文采用渐进式训练日程。",
      analogy: {
        title: "三阶段噪声时间步日程",
        text: "训练依次经历同步时间步、受限差异和完全独立三个阶段，使模型在稳定基础上逐步适应非对称条件。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "三阶段训练课程",
          desc: "依次检查同步热身、渐进解耦与完全独立阶段，并对照相同实验设置下的训练日程消融结果。",
          componentId: "unison-active",
        },
      ],
      takeaways: [
        {
          icon: "01",
          title: "单一模型",
          desc: "三个阶段构成同一模型的训练课程，而非三套独立模型。",
        },
        {
          icon: "02",
          title: "稳定性策略",
          desc: "先建立基础对齐，再逐步扩大跨模态噪声差。",
        },
        {
          icon: "03",
          title: "实验支持",
          desc: "PF 在本文训练日程消融中获得最低 DS。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "方向加权的流匹配目标",
      badge: "trn",
      badgeLabel: "目标函数",
      bridge:
        "时间步差异确定了跨模态引导方向，方向加权进一步将较大的优化权重分配给噪声水平更高的分支。",
      analogy: {
        title: "噪声方向决定损失权重",
        text: "噪声水平较低的模态提供条件，噪声水平较高的模态获得更大的流匹配损失权重。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "方向变量与分支权重",
          desc: "切换噪声水平较低的模态，观察 wᵥ 与 wₐ 的互补变化。根据本文定义，两个权重不会同时取 1.5。",
          componentId: "unison-active",
        },
      ],
      formula: {
        lead: "TI2AV 总目标由一个视频 CFM 损失和两个分流音频 CFM 损失组成；每个带上下标的损失项均作为一个完整符号解释。",
        unicode:
          "<span class=\"sym fe-formula-sym\" data-sym=\"Lₜᵢ₂ₐᵥ\">L<sub>TI2AV</sub></span> = <span class=\"sym fe-formula-sym\" data-sym=\"wᵥ\">w<sub>v</sub></span> · <span class=\"sym fe-formula-sym\" data-sym=\"L₍CFM₎ᵛ\">L<sub>CFM</sub><sup>v</sup></span> + <span class=\"sym fe-formula-sym\" data-sym=\"wₐ\">w<sub>a</sub></span> · (<span class=\"sym fe-formula-sym\" data-sym=\"L₍CFM₎ˢᵖ\">L<sub>CFM</sub><sup>sp</sup></span> + <span class=\"sym fe-formula-sym\" data-sym=\"L₍CFM₎ˢᶠˣ\">L<sub>CFM</sub><sup>sfx</sup></span>)",
        symbols: [
          {
            sym: "Lₜᵢ₂ₐᵥ",
            desc: "Text-and-Image-to-Audio-Video 联合训练的总损失。",
          },
          {
            sym: "wᵥ",
            desc: "视频分支权重，定义为 1+λd；音频噪声较低、d=1 时取较大值。",
          },
          {
            sym: "L₍CFM₎ᵛ",
            desc: "视频分支的 Conditional Flow Matching（条件流匹配）损失；下标 CFM 指损失类型，上标 v 指 video。",
          },
          {
            sym: "wₐ",
            desc: "音频分支权重，定义为 1+λ(1-d)；视频噪声较低、d=0 时取较大值。本文 λ=0.5。",
          },
          {
            sym: "L₍CFM₎ˢᵖ",
            desc: "语音流的条件流匹配损失；下标 CFM 指损失类型，上标 sp 指 speech stream。",
          },
          {
            sym: "L₍CFM₎ˢᶠˣ",
            desc: "音效流的条件流匹配损失；下标 CFM 指损失类型，上标 sfx 指 sound-effects stream。",
          },
        ],
      },
      takeaways: [
        {
          icon: "01",
          title: "方向加权",
          desc: "权重随噪声方向变化，不固定偏向某一模态。",
        },
        {
          icon: "02",
          title: "音频含两项",
          desc: "语音与音效的 CFM 损失共同组成音频目标。",
        },
        {
          icon: "03",
          title: "超参数边界",
          desc: "0.5 来自本文设置下的消融折中。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "Unison 的双分支架构",
      badge: "trn",
      badgeLabel: "架构",
      bridge:
        "在分别理解 SGHS 与 CMFS 后，可以将这些机制映射回完整网络，并检查各组件的连接路径、层数和联合训练状态。",
      analogy: {
        title: "架构组件与活动路径",
        text: "将系统视为具有可选择路由的双分支结构：选中一个组件时，只突出与其相关的节点、下游路径和训练状态。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "双分支架构与训练状态",
          desc: "选择视频、融合或音频组件，查看本文实现中的 29/23 层配置、双流位置、活动路径以及冻结或可训练状态。",
          componentId: "unison-active",
          figure: "/images/unison-architecture.png",
        },
      ],
      takeaways: [
        {
          icon: "01",
          title: "双分支耦合",
          desc: "视频与音频通过帧级双向交叉注意力互为条件。",
        },
        {
          icon: "02",
          title: "音频双流",
          desc: "Bi-ACA 与 SCG 位于音频分支内部。",
        },
        {
          icon: "03",
          title: "训练条件",
          desc: "联合阶段冻结视频骨干，只训练音频与融合模块。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "统一系统下的多方向生成",
      badge: "trn",
      badgeLabel: "推理",
      bridge:
        "CMFS 是训练策略。推理阶段根据任务提供文本、图像、音频或视频条件，并由同一双分支系统执行相应生成路径。",
      analogy: {
        title: "条件与输出方向的切换",
        text: "不同任务改变输入条件和目标输出，但共享的双分支结构与采样框架保持不变。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "生成任务与证据类型",
          desc: "切换 T2AV、TI2AV、A2V 与 V2A，检查输入—输出关系，并区分论文中的定量评估与定性样例。",
          componentId: "unison-active",
        },
      ],
      takeaways: [
        {
          icon: "01",
          title: "任务方向",
          desc: "对称依赖支持多种条件生成方向。",
        },
        {
          icon: "02",
          title: "推理配置明确",
          desc: "论文报告 50 步、CFG 6.0、25 FPS。",
        },
        {
          icon: "03",
          title: "证据分级",
          desc: "T2AV/TI2AV 定量基准与 A2V/V2A 定性样例不能混报。",
        },
      ],
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "同协议实验比较与结论边界",
      badge: "both",
      badgeLabel: "结果与边界",
      bridge:
        "实验结论必须限定在相同任务、评估协议与指标方向内。最后结合主结果、消融实验和用户研究判断方法优势及其边界。",
      analogy: {
        title: "比较前统一协议与指标方向",
        text: "只有相同任务与评估协议下的同一指标可以直接比较；同时必须区分数值越高越好与越低越好。",
        componentId: "stage-scenes",
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "同协议指标比较",
          desc: "选择 PQ↑、DS↓、LSE-C↑ 或用户总体排名↓，再启动同协议比较；图中始终保留论文报告的原始数值。",
          componentId: "unison-active",
          figure: "/images/unison-audio-ablation.png",
        },
      ],
      insight:
        "Unison 的主要优势体现在音频层次与整体对齐；在视觉、文本和唇音同步指标上尚未全面超过所有基线。",
      takeaways: [
        {
          icon: "01",
          title: "领先范围",
          desc: "音频质量与整体对齐突出，视觉和唇音并非全胜。",
        },
        {
          icon: "02",
          title: "消融互补",
          desc: "SGHS 更影响 PQ，CMFS 更影响 DS 与 LSE-C。",
        },
        {
          icon: "03",
          title: "复现边界",
          desc: "内部数据、大算力、作者基准与待发布代码限制外推。",
        },
      ],
    },
  ],
  bilibili: [
    {
      bvid: "BV1Wv3xeNEds",
      title: "你一定能听懂的 Flow Matching 基本原理",
      reason: "先修：理解本文视频与音频分支共同使用的流匹配目标。",
      views: "7.2万播放",
    },
    {
      bvid: "BV1cRwJeREgk",
      title: "NeurIPS 2024 Tutorial：Flow Matching for Generative Modeling",
      reason: "进阶先修：从基本路径到高级设计，帮助补足第 5—7 章的数学背景。",
      views: "2.6万播放",
    },
    {
      bvid: "BV1sJJVz1EVn",
      title: "扩散模型 Flow Matching 复现",
      reason: "实现先修：从代码视角观察速度回归与采样。",
      views: "1.2万播放",
    },
  ],
};

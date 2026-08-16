import type { TutorialData } from "../types";

export const tutorial: TutorialData = {
  meta: {
    titleEn: "PE-Field 4D: Video Generation Models as Canvas",
    titleZh: "PE-Field 4D：把视频生成模型当作画布",
    venue: "arXiv:2607.15667 · 2026",
    authors: "Yunpeng Bai · Haoxiang Li · Qixing Huang",
    affiliation: "University of Texas at Austin · Pixocial Technology",
    domain: "视频生成 · 几何控制 · 相机重定轨 · 4D编辑",
    coreProblem:
      "预训练视频模型已经能生成逼真、连贯的视频，却缺少与指定参考视频逐点对应的几何控制接口；换机位时，物体结构、遮挡和局部位置仍可能漂移。",
    coreInsight:
      "生成模型直接修改视频的<b>摄像机视角或物体位置</b>时，参考内容在目标画面中的落点容易失去几何对齐。PE-Field 4D通过为参考Token写入<b>目标视角下的投影位置编码</b>，引导生成视频保持内容与几何结构一致。",
    keywords: ["研究背景", "现有问题", "提出方法", "具体实现", "最终效果", "总结与思考"],
  },
  hero: {
    oldMethod: {
      desc: "只给相机运动时，模型知道镜头大致怎么走，却仍要猜参考内容在新画面中的<b>具体落点</b>。",
      componentId: "hero-camera",
    },
    newMethod: {
      desc: "PE-Field 4D把每个参考token的目标投影位置写进地址，让Wan按<b>几何对应</b>读取内容并完成生成。",
      componentId: "hero-camera",
    },
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "背景",
      badge: "inf",
      badgeLabel: "研究背景",
      bridge:
        "Diffsuion生成模型中，在图像编辑已经可以较好的根据需求生成修改后的图像，PE-Field把参考token的位置编码改成目标视角下的投影位置，能够引导模型完成单张图像的新视角合成。这说明位置编码不仅记录token原来在哪里，还可以成为注入几何控制的接口。",
      analogy: {
        title: "",
        text: "",
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "体验一下：生成相同不同角度的图像",
          desc: "左侧为预设的输入图像，在底部设定旋转角度进行不同角度的图像生成。",
          componentId: "image-viewpoint-demo",
        },
      ],
      insight:
        "<span class=\"insight-line insight-line-left\">思考：如何将图像编辑的能力拓展到视频编辑能力？</span><span class=\"insight-line insight-line-right\">————如果直接将变化的视觉条件输入给视频生成模型？</span>",
      takeaways: [],
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "现有问题：视角移动后模型不能保持空间结构对齐",
      badge: "inf",
      badgeLabel: "现有问题",
      bridge:
        "下面沿用首页汽车例子，观察直接将视觉条件送入模型后的效果。",
      analogy: {
        title: "",
        text: "",
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "",
          desc: "",
          componentId: "control-gap",
        },
      ],
      insight:
        "思考：那能否通过空间几何建模，由视角变化条件推导变化后物体的空间几何位置，通过对齐空间Token位置的方式确保生成不会错位？",
      takeaways: [],
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "提出方案：PE-Field 4D",
      badge: "both",
      badgeLabel: "提出方法",
      bridge:
        "本章先用图像重建换视角建立完整直觉：3.1把干净原图编码为不含可见图像的Latent特征，并分出Kᵧ/Vᵧ；随后用三维场景逐步展示ViPE建模、用户相机改变与Pᵧ投影，最后从噪声状态去噪生成新视角；3.2联动展示同一参考Token在目标视角中的落点。",
      analogy: {
        title: "",
        text: "",
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "PE-Field：几何对齐的图像生成",
          desc: "要将输入图像旋转一个角度后生成，PE-Field的设计是如何实现Token的几何对齐的？",
          componentId: "temporal-unmix",
        },
        {
          kind: "module",
          id: "3.2",
          title: "PE-Field 4D：迁移到视频生成如何实现？",
          desc: "从图像处理拓展到视频处理，主要区别有2点：",
          componentId: "token-grid",
        },
      ],
      insight: "PE-Field 4D通过对Token根据反投影在对应位置重新位置编码的方式，引导生成模型保持内容与几何结构的一致性。更进一步，我们接下来从数据流的角度在更高的抽象层梳理一下作者的修改内容。",
      takeaways: [],
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "完整实现：从Baseline逐步搭建PE-Field 4D",
      badge: "both",
      badgeLabel: "完整实现",
      bridge:
        "第三章已经分别得到参考内容yᵢ与目标地址Pᵧ,ᵢ。本章用一张放大的交互流程图把它们放回生成主干：从形状为[B,N,D]的目标噪声Latent开始，逐步加入参考内容、同源几何、视频消歧、联合注意力与LoRA。",
      analogy: {
        title: "",
        text: "",
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "在同一张图上，从Baseline逐层添加作者设计",
          desc: "从单张目标噪声Latent开始，参考帧送入逐帧复制与Wan VAE；随后继续加入同源ViPE几何、投影地址、视频消歧、联合注意力与LoRA。",
          componentId: "system-pipeline",
        },
        {
          kind: "module",
          id: "4.2",
          title: "模型如何区分前景后景？",
          desc: "目标视角下，前景与背景Token可能落到相同或相近的二维位置。只使用(h̃,w̃)时，它们会得到近乎相同的RoPE地址；作者把归一化深度写入时间维，为同一二维落点保留可区分的前后顺序。",
          componentId: "implementation-problems",
        },
      ],
      takeaways: [],
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "最终效果",
      badge: "both",
      badgeLabel: "结果与局限",
      bridge: "",
      analogy: {
        title: "",
        text: "",
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "总体评估",
          desc: "",
          componentId: "metric-race",
          figure: "/images/pe-field-comparison.png",
        },
        {
          kind: "module",
          id: "5.2",
          title: "消融实验",
          desc: "分别移除深度消歧和时间消歧，在同一DAVIS评测协议下观察几何一致性与相机精度的变化。",
          componentId: "ablation-lab",
          figure: "/images/pe-field-ablation.png",
        },
      ],
      insight: "",
      takeaways: [],
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "总结与思考",
      badge: "both",
      badgeLabel: "总结与思考",
      bridge: "回顾全文的核心问题、方法与实现，并进一步思考PE-Field 4D的价值、适用边界和后续方向。",
      analogy: {
        title: "",
        text: "",
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "总结",
          desc: "",
          componentId: "pros-cons",
        },
        {
          kind: "module",
          id: "6.2",
          title: "思考",
          desc: "",
          componentId: "reflection",
        },
      ],
      insight: "",
      takeaways: [],
    },
  ],
  bilibili: [
    {
      bvid: "BV1eiNTzzE4L",
      title: "可视化直观地理解Diffusion（扩散模型）",
      reason: "先补齐扩散去噪的直觉，再进入视频中的几何控制。",
      cover: "https://i2.hdslb.com/bfs/archive/c892c19d1d3beac4f4fd6b8f1450e83e82fb6d93.jpg",
      views: "3.7万播放",
    },
    {
      bvid: "BV1Y8mtBpEUi",
      title: "扩散模型核心架构解析：从U-Net到Diffusion Transformer",
      reason: "理解论文为什么把几何控制插进DiT注意力，而不是另建完整生成器。",
      cover: "https://i2.hdslb.com/bfs/archive/38aaa7e167aad2f1901005927ecea12a58822f4b.jpg",
      views: "6456播放",
    },
    {
      bvid: "BV1AD421g7hs",
      title: "如何理解Transformer的位置编码",
      reason: "帮助区分token的内容与地址，这是全文最关键的认知台阶。",
      cover: "https://i0.hdslb.com/bfs/archive/0a0efc32e66d7c9f18af1dc2a08bd7ce7e5bcfb2.jpg",
      views: "3.4万播放",
    },
    {
      bvid: "BV1FjrCBdESo",
      title: "手撕RoPE旋转位置编码推导",
      reason: "进一步理解论文在Q、K上使用的旋转位置编码如何影响匹配。",
      cover: "https://i0.hdslb.com/bfs/archive/3f7255c58977c2fd5a1be790a829241606dffc36.jpg",
      views: "4.6万播放",
    },
  ],
};

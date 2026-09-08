import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "From Pixels to Words – Towards Native One-Vision Models at Scale",
    titleZh: "从像素到文字：迈向规模化的原生统一视觉模型",
    venue: "",
    authors: "Haiwen Diao 等",
    affiliation: "S-Lab, NTU · SenseTime Research · DLUT",
    domain: "视觉语言模型 · 单图/多图/视频 · 空间智能",
    coreProblem: "",
    coreInsight: "",
    keywords: [
      "NEO-ov",
      "无独立视觉编码器",
      "统一视觉建模",
      "单图 · 多图 · 视频"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<b>先由独立视觉编码器“看”，再交给语言模型理解和表达。</b>",
      componentId: "neo-hero-old"
    },
    newMethod: {
      desc: "<b>不再设置同等级的独立视觉编码器，视觉与语言在统一主干中共同建模。</b>",
      componentId: "neo-hero-new"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "AI 要回答一张图片，究竟需要知道什么？",
      badge: "inf",
      badgeLabel: "导入",
      bridge: "<b>先不谈模型架构，给 AI 一张街景，再问它一个问题，看看“回答”之前究竟要完成哪些判断。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "互动实验",
          desc: "点击下面的步骤，看看同一个问题需要哪些不同证据。",
          componentId: "neo-ch1-main"
        }
      ],
      insight: "<b>看图问答不只是“识别图片”。模型还需要理解空间关系，并根据用户的问题选择相关视觉证据，最后把这些信息组织成语言回答。</b>",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "传统 VLM 的分工",
      badge: "inf",
      badgeLabel: "背景",
      bridge: "<b>上一节我们看到，一次看图回答需要同时处理视觉内容、空间关系和语言问题。一个很自然的做法，就是让不同模块分别完成自己擅长的部分。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "一张图怎样穿过传统 VLM？",
          desc: "点击 pipeline 中的节点，看看视觉信息和用户问题分别经过哪里，又在哪里汇合。",
          componentId: "neo-ch2-main"
        },
        {
          kind: "module",
          id: "2.2",
          title: "论文真正质疑的是哪一步？",
          desc: "<b>刚才这条 pipeline 很合理。现在保持图片不变，只换一个问题，看看哪些部分会变化。</b>",
          componentId: "neo-ch2-boundary"
        }
      ],
      insight: "<b>论文并不是在证明 modular VLM“错误”，而是在重新追问：视觉是否必须先经过独立编码，再与语言进行后续推理？</b>",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "拿掉 Vision Encoder 后，视觉信息怎么进入模型？",
      badge: "inf",
      badgeLabel: "核心问题 · 视觉入口",
      bridge: "<b>取消独立视觉编码器，并不等于“不再处理视觉”。真正改变的是：视觉表示在哪里形成，以及由谁学习。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "Encoder-Free 到底去掉了什么？",
          desc: "<b>传统 Modular VLM 与 NEO-ov 的结构边界发生了什么变化？</b>",
          componentId: "neo-ch3-main"
        },
        {
          kind: "module",
          id: "3.2",
          title: "没有独立 Encoder，图片怎样变成模型输入？",
          desc: "<b>一张二维图片不能直接等同于一个文字 token。即使没有独立 Vision Encoder，也仍然需要一种轻量方式把视觉输入变成模型可以处理的表示。</b>",
          componentId: "neo-ch3-tokens"
        }
      ],
      insight: "💡 <b>NEO-ov 的 Encoder-Free 并不是跳过视觉处理，而是取消独立视觉编码器：图像先通过轻量视觉入口变成 visual tokens，视觉与语言随后在统一主干中继续学习和建模。</b>",
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "单图、多图和视频，如何统一组织为视觉序列？",
      badge: "both",
      badgeLabel: "核心机制 · 统一视觉序列化",
      bridge: "<b>模型不仅要知道“有哪些 visual tokens”，还要知道它们属于哪张图、以什么顺序出现，以及视频中的帧发生在什么时刻。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "序列构造器",
          desc: "",
          componentId: "neo-ch4-main"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "排成序列后，哪些 token 可以互相“看见”？",
      badge: "both",
      badgeLabel: "核心机制 · 统一时空注意力",
      bridge: "<b>把所有 token 放进同一条 sequence 还不够：图片内部需要充分理解空间结构，而多张图片和视频帧之间又存在先后关系。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "",
          desc: "",
          componentId: "neo-ch5-main"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "NEO-ov 怎样分别建模时序与二维空间？",
      badge: "both",
      badgeLabel: "核心机制 · THW + Native-RoPE",
      bridge: "<b>上一节决定了哪些 token 可以互相交互。但允许交互之后，Attention 还要区分：哪些关系来自序列 / 时间，哪些来自二维空间。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "",
          desc: "",
          componentId: "neo-ch6-main"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "把这些机制拼起来：完整的 NEO-ov 怎样工作？",
      badge: "both",
      badgeLabel: "方法收束 · 架构 + 训练",
      bridge: "<b>前几节我们把 NEO-ov 拆开来看。现在把这些零件重新装回去，看看一张图片、一段视频和文字究竟怎样穿过整套模型。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "",
          desc: "",
          componentId: "neo-ch7-main"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "实验：这套 Native One-Vision 真的有效吗？",
      badge: "trn",
      badgeLabel: "实验",
      bridge: "<b>前面回答的是“NEO-ov 怎么做”，这一节只回答一件事：这样做到底有没有用。</b>",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "",
          desc: "",
          componentId: "neo-ch8-main"
        }
      ],
      takeaways: []
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "总结：从 Pixels to Words 到 Native One-Vision",
      badge: "both",
      badgeLabel: "总结",
      bridge: "",
      analogy: {
        title: "",
        text: ""
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "",
          desc: "",
          componentId: "neo-ch9-main"
        }
      ],
      takeaways: []
    }
  ],
  bilibili: [
    {
      bvid: "BV13mn9zkECe",
      title: "直观了解 VLM 视觉语言模型核心原理",
      reason: "补足传统 VLM 与高效视觉前端背景。",
      views: "9357播放"
    },
    {
      bvid: "BV1NP8xzrEDa",
      title: "VLM 视觉大模型：工作原理篇",
      reason: "适合作为第 1–2 章的入门补充。",
      views: "2.0万播放"
    },
    {
      bvid: "BV1ZeT2zcEee",
      title: "从零实现多模态大模型：多图场景",
      reason: "关联多图输入、视觉段边界与训练实践。",
      views: "3.3万播放"
    },
    {
      bvid: "BV1vgpBzzEh5",
      title: "零基础 10 分钟学透 RoPE",
      reason: "补充位置编码直觉；不替代 NEO-ov 的 T/H/W 专属机制。",
      views: "1.4万播放"
    }
  ]
};

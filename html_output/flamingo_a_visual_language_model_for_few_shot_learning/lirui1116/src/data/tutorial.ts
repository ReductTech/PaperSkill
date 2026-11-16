import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Flamingo: a Visual Language Model for Few-Shot Learning",
    "titleZh": "Flamingo：面向少样本学习的视觉语言模型",
    "venue": "NeurIPS 2022",
    "authors": "Jean-Baptiste Alayrac、Jeff Donahue、Pauline Luc、Antoine Miech 等",
    "affiliation": "DeepMind",
    "domain": "视觉语言模型 · 上下文学习",
    "coreProblem": "怎样只给几个图文示例，就让同一个模型适应新的视觉任务？",
    "coreInsight": "冻结视觉与语言骨干，用重采样和门控交叉注意力连接它们，再从交错图文提示中续写。",
    "keywords": [
      "少样本学习",
      "Perceiver Resampler",
      "门控交叉注意力",
      "多模态提示"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "对比式图文模型",
      "desc": "图像、文字分别编码，比相似度，选出已有候选。",
      "componentId": "flamingo-cover-old"
    },
    "newMethod": {
      "title": "Flamingo",
      "desc": "冻结骨干、学习连接；读图文示例，逐词生成新回答。",
      "componentId": "flamingo-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 任务适应",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "上下文少样本学习",
          "desc": "示例传达任务和输出格式；下游适应时无需更新模型参数。",
          "componentId": "flamingo-prompt"
        }
      ],
      "scenes": [
        {
          "id": "prompt",
          "title": "上下文少样本学习",
          "goal": "示例怎样指定任务？比较同一张图片的两种回答格式。",
          "summary": "示例传达任务和输出格式；下游适应时无需更新模型参数。",
          "interaction": "选择颜色问答或图注示例；取走并放回示例，比较任务约束。",
          "next": "冻结骨干与可训练桥接",
          "notes": "PDF page 6 §2.5。无例时为开放描述，有例时采用问答或短标签；规则演示不模拟模型推理。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：选择颜色问答或图注示例；取走并放回示例，比较任务约束。 示例传达任务和输出格式；下游适应时无需更新模型参数。",
          "componentId": "flamingo-prompt",
          "moduleId": "1.1",
          "thumbnail": "./thumbnails/prompt.jpg?v=141f42781f"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 连接骨干",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "冻结骨干与可训练桥接",
          "desc": "冻结预训练骨干，只训练新增连接；教学更新不是实际模型训练。",
          "componentId": "flamingo-frozen"
        }
      ],
      "scenes": [
        {
          "id": "frozen",
          "title": "冻结骨干与可训练桥接",
          "goal": "哪些参数学习新任务，哪些保留已有能力？",
          "summary": "冻结预训练骨干，只训练新增连接；教学更新不是实际模型训练。",
          "interaction": "点击训练桥接组件，观察连接权重与目标词概率变化；两端骨干保持不变。",
          "next": "Perceiver Resampler",
          "notes": "PDF page 5 §2.1–2.2。旧页内容保持不变，新增桥接批注移动；展示预训练与桥接范围。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：点击训练桥接组件，观察连接权重与目标词概率变化；两端骨干保持不变。 冻结预训练骨干，只训练新增连接；教学更新不是实际模型训练。",
          "componentId": "flamingo-frozen",
          "moduleId": "2.1",
          "thumbnail": "./thumbnails/frozen.jpg?v=b1961a7e2f"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 视觉压缩",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "Perceiver Resampler",
          "desc": "输入数量可变，摘要槽数固定；真实配置为64个视觉token。",
          "componentId": "flamingo-resampler"
        }
      ],
      "scenes": [
        {
          "id": "resampler",
          "title": "Perceiver Resampler",
          "goal": "固定数量的摘要，怎样读取长短不一的图像输入？",
          "summary": "输入数量可变，摘要槽数固定；真实配置为64个视觉token。",
          "interaction": "改变输入数量和图片颜色，点摘要追踪加权汇聚。",
          "next": "语言查询与视觉交叉注意力",
          "notes": "PDF page 5 §2.1; Appendix A.1.1。小型演示4个latent，真实配置64；查询同时读取视觉与latent键值，输出槽数不变。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：改变输入特征数量，再点选一个输出摘要槽，追踪被读取的线索。 输入数量可变，摘要槽数固定；真实配置为64个视觉token。 本轮优化：可学习查询读取视觉输入与latent自身，输出槽数固定。教学用4个槽，真实64个token；槽语义与颜色为示意。",
          "componentId": "flamingo-resampler",
          "moduleId": "3.1",
          "thumbnail": "./thumbnails/resampler.jpg?v=2f69ce1573"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 按需读取",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "语言查询与视觉交叉注意力",
          "desc": "语言查询决定怎样加权读取视觉表示；权重与回答均为教学示意。",
          "componentId": "flamingo-attention"
        }
      ],
      "scenes": [
        {
          "id": "attention",
          "title": "语言查询与视觉交叉注意力",
          "goal": "查询改变后，注意力权重怎样重新分配？",
          "summary": "语言查询决定怎样加权读取视觉表示；权重与回答均为教学示意。",
          "interaction": "切换问题或拖动查询方向，观察Q、匹配分、softmax权重和关注区域同步变化。",
          "next": "零初始化 tanh 门控",
          "notes": "PDF page 5 Figure 4。q=-2时首区域权重大，q=2时尾区域权重大；均标注教学向量。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：选择颜色、喙形状或位置问题，观察被强调的区域、权重与回答。 语言查询决定怎样加权读取视觉表示；权重与回答均为教学示意。 本轮优化：三维Q、K是教学设定；实际Q来自语言状态，K和V来自视觉表示。区域圈选是加权读取的示意，并非硬裁切。",
          "componentId": "flamingo-attention",
          "moduleId": "4.1",
          "thumbnail": "./thumbnails/attention.jpg?v=32f3ad02eb"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 稳定连接",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "零初始化 tanh 门控",
          "desc": "零初始化使新增残差分支起初不改变原模型；门控由训练学习。",
          "componentId": "flamingo-gate"
        }
      ],
      "scenes": [
        {
          "id": "gate",
          "title": "零初始化 tanh 门控",
          "goal": "怎样接入视觉修正，同时保留原语言表示？",
          "summary": "零初始化使新增残差分支起初不改变原模型；门控由训练学习。",
          "interaction": "转动门控，观察原稿直达、视觉批注放行和融合；回零对照。",
          "next": "最近前置图像掩码",
          "notes": "PDF page 5 Figure 4。alpha=0时输出2，alpha=1时约4.28；图上批注高度和显式算式同步变化。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：从α=0开始打开门，比较原表示、视觉修正与两者之和。 零初始化使新增残差分支起初不改变原模型；门控由训练学习。 本轮优化：原稿批注类比残差相加，不是生成句子或文字长度。教学h=3,c=2；alpha可正可负，实际由训练学习。",
          "componentId": "flamingo-gate",
          "moduleId": "5.1",
          "thumbnail": "./thumbnails/gate.jpg?v=c93d456eeb"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 多图上下文",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "最近前置图像掩码",
          "desc": "直接视觉来源只取最近前置图像；早期信息仍可经文字历史传递。",
          "componentId": "flamingo-mask"
        }
      ],
      "scenes": [
        {
          "id": "mask",
          "title": "最近前置图像掩码",
          "goal": "阅读位置前移时，哪些图能直接读取？",
          "summary": "直接视觉来源只取最近前置图像；早期信息仍可经文字历史传递。",
          "interaction": "选文字A、B或C，观察前置图连线与遮罩；临时取消规则作对照。",
          "next": "视频时序表示",
          "notes": "PDF page 6 §2.3。图A—文字A—图B—文字B—图C—查询；显示直接视觉读取、语言历史、尚未出现图片。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：点选文字A和文字B，比较最近前置图片、未来图片和文字历史。 直接视觉来源只取最近前置图像；早期信息仍可经文字历史传递。 本轮优化：最近前置图掩码只限制跨模态读取，文字自注意力历史仍可承载旧图信息。取消遮罩是反事实比较，不是论文默认。",
          "componentId": "flamingo-mask",
          "moduleId": "6.1",
          "thumbnail": "./thumbnails/mask.jpg?v=2f438a3f7d"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "07 · 视频输入",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "视频时序表示",
          "desc": "固定1FPS抽帧可能漏掉间隙动作；时间嵌入不能还原未采到的画面。",
          "componentId": "flamingo-video"
        }
      ],
      "scenes": [
        {
          "id": "video",
          "title": "视频时序表示",
          "goal": "连续视频变成离散帧后，哪些信息能被保留？",
          "summary": "固定1FPS抽帧可能漏掉间隙动作；时间嵌入不能还原未采到的画面。",
          "interaction": "在1.0秒与1.5秒放置短暂展翅，观察固定采样帧是否包含动作。",
          "next": "多源数据与训练目标",
          "notes": "PDF page 5 §2.1。时间嵌入区分帧顺序；事件可在抽帧间隔被漏采为采样解释，非测量结论。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：在1.0秒与1.5秒放置短暂展翅，观察固定采样帧是否包含动作。 固定1FPS抽帧可能漏掉间隙动作；时间嵌入不能还原未采到的画面。",
          "componentId": "flamingo-video",
          "moduleId": "7.1",
          "thumbnail": "./thumbnails/video.jpg?v=ab123314f8"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "08 · 多源训练",
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "多源数据与训练目标",
          "desc": "各数据源按权重汇总梯度；更新方向不是准确率或性能评价。",
          "componentId": "flamingo-training"
        }
      ],
      "scenes": [
        {
          "id": "training",
          "title": "多源数据与训练目标",
          "goal": "不同格式的数据，怎样共同完成一次更新？",
          "summary": "各数据源按权重汇总梯度；更新方向不是准确率或性能评价。",
          "interaction": "逐一积累网页、图文对和视频的信号，再共同更新；改权重看合力。",
          "next": "自回归预测与任务接口",
          "notes": "PDF page 6 §2.4 Equation 2。权重变化改变loss而非声称性能变化；展示真实数据规模与跨数据集梯度累积。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：调整交错数据权重，观察两组教学梯度的合成方向。 各数据源按权重汇总梯度；更新方向不是准确率或性能评价。 以一维教学梯度贡献说明跨数据集加权累积；实际梯度为高维向量。 本轮优化：二维负梯度方向(0.8,-0.2)、(-0.4,0.6)、(0.2,0.4)为教学设定。累计后更新一次；实际目标为加权文本负对数似然。",
          "componentId": "flamingo-training",
          "moduleId": "8.1",
          "thumbnail": "./thumbnails/training.jpg?v=eaa40a2a6d"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "09 · 生成回答",
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "自回归预测与任务接口",
          "desc": "自回归生成逐token以先前文字和视觉信息为条件；演示不运行真实模型。",
          "componentId": "flamingo-inference"
        }
      ],
      "scenes": [
        {
          "id": "inference",
          "title": "自回归预测与任务接口",
          "goal": "一段回答怎样从图片与已有文字中逐步产生？",
          "summary": "自回归生成逐token以先前文字和视觉信息为条件；演示不运行真实模型。",
          "interaction": "逐次生成一个token，观察已写文字和序列条件概率如何累积。",
          "next": "少样本评估与模型规模",
          "notes": "PDF page 4 Equation 1; page 7 §2.5。乘积p1*0.8与0.36比较；输出是教学候选，不是Flamingo实测预测。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：逐次生成一个token，观察已写文字和序列条件概率如何累积。 自回归生成逐token以先前文字和视觉信息为条件；演示不运行真实模型。",
          "componentId": "flamingo-inference",
          "moduleId": "9.1",
          "thumbnail": "./thumbnails/inference.jpg?v=a0971e0c57"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "10 · 评估结果",
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "少样本评估与模型规模",
          "desc": "所示3B和9B在32个示例下准确率更高；不推断所有任务均单调提高。",
          "componentId": "flamingo-results"
        }
      ],
      "scenes": [
        {
          "id": "results",
          "title": "少样本评估与模型规模",
          "goal": "锁住一个条件，再看增加示例或模型规模的影响。",
          "summary": "所示3B和9B在32个示例下准确率更高；不推断所有任务均单调提高。",
          "interaction": "固定模型或固定示例，观察提示条件，再比较两组实测。",
          "next": "消融实验与设计取舍",
          "notes": "PDF page 7 Table 1。准确率%，越高越好；不连线无序模型；0到100同轴；0shot两条纯文字示例特殊协议写入注释。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。零视觉示例设定还包含两条纯文字示例；表1图注与正文对胜过微调任务总数有不一致，教程不采用该总数。 教学优化：切换4与32个示例，比较VQAv2同一模型的准确率。 所示3B和9B在32个示例下准确率更高；不推断所有任务均单调提高。 本轮优化：VQAv2 Table1准确率：3B4/32-shot为53.2/57.1，9B为56.3/60.4。提示画面仅解释条件，不是评测样本；规模对照为不同已训练模型。",
          "componentId": "flamingo-results",
          "moduleId": "10.1",
          "thumbnail": "./thumbnails/results.jpg?v=f7bbb2fe3a"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-11",
      "title": "11 · 验证设计",
      "modules": [],
      "scenes": [
        {
          "id": "ablation",
          "title": "消融实验与设计取舍",
          "goal": "移除关键设计后，论文报告的结果怎样变化？",
          "summary": "M3W、门控与Resampler的消融支持其在该设置中的作用。",
          "interaction": "阅读相同消融协议下各模型与基线的对照。",
          "next": "视觉依据与适用边界",
          "notes": "PDF page 8 Table 3; page 9 §3.3。3B四示例5个DEV验证集归一化聚合分数；不解释为正确率。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：阅读相同消融协议下各模型与基线的对照。 M3W、门控与Resampler的消融支持其在该设置中的作用。",
          "componentId": "flamingo-ablation",
          "thumbnail": "./thumbnails/ablation.jpg?v=f2c670ee12"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-12",
      "title": "12 · 适用边界",
      "modules": [
        {
          "kind": "module",
          "id": "12.1",
          "title": "视觉依据与适用边界",
          "desc": "视觉输入不保证消除幻觉；将可见事实与无依据猜测分开。",
          "componentId": "flamingo-limits"
        }
      ],
      "scenes": [
        {
          "id": "limits",
          "title": "视觉依据与适用边界",
          "goal": "一句回答很流畅，就一定有图像依据吗？",
          "summary": "视觉输入不保证消除幻觉；将可见事实与无依据猜测分开。",
          "interaction": "选一条观察记录，对照图片判断它有没有可见依据。",
          "next": "回到图文提示，重新检查适用条件",
          "notes": "PDF page 6 §2.3; page 10 §5。修复直接图片绑定展示掩码原则；不保证消除幻觉；写清长上下文、提示敏感、分类劣势。手绘画面与玩具计算仅为教学示意；实测图表保留论文数值。 教学优化：选一条观察记录，对照图片判断它有没有可见依据。 视觉输入不保证消除幻觉；将可见事实与无依据猜测分开。",
          "componentId": "flamingo-limits",
          "moduleId": "12.1",
          "thumbnail": "./thumbnails/limits.jpg?v=8c75882d5d"
        }
      ]
    }
  ],
  "thumbnails": {
    "ablation": "./thumbnails/ablation.jpg?v=f2c670ee12",
    "attention": "./thumbnails/attention.jpg?v=32f3ad02eb",
    "cover": "./thumbnails/cover.jpg?v=d79a49581d",
    "frozen": "./thumbnails/frozen.jpg?v=b1961a7e2f",
    "gate": "./thumbnails/gate.jpg?v=c93d456eeb",
    "inference": "./thumbnails/inference.jpg?v=a0971e0c57",
    "limits": "./thumbnails/limits.jpg?v=8c75882d5d",
    "mask": "./thumbnails/mask.jpg?v=2f438a3f7d",
    "prompt": "./thumbnails/prompt.jpg?v=141f42781f",
    "resampler": "./thumbnails/resampler.jpg?v=2f69ce1573",
    "results": "./thumbnails/results.jpg?v=f7bbb2fe3a",
    "training": "./thumbnails/training.jpg?v=eaa40a2a6d",
    "video": "./thumbnails/video.jpg?v=ab123314f8"
  }
};

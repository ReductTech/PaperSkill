import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "BLIP: Bootstrapping Language-Image Pre-training for Unified Vision-Language Understanding and Generation",
    "titleZh": "BLIP：统一视觉语言理解与生成的自举预训练",
    "venue": "arXiv · 2022",
    "authors": "Junnan Li · Dongxu Li · Caiming Xiong · Steven Hoi",
    "affiliation": "Salesforce Research",
    "domain": "视觉语言预训练",
    "coreProblem": "网页文字常与视觉内容错位；理解与生成也需要不同的文本处理方式。",
    "coreInsight": "MED 兼顾理解与生成，CapFilt 通过生成描述和过滤噪声改进训练文本。",
    "keywords": [
      "MED",
      "CapFilt",
      "图文对齐",
      "图像描述",
      "多任务预训练"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "原始网页图文对",
      "desc": "同一照片配网页文字；有的描述画面，有的并不匹配。",
      "componentId": "blip-cover"
    },
    "newMethod": {
      "title": "CapFilt 自举图文对",
      "desc": "补写候选描述，再逐对过滤错配。",
      "componentId": "blip-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "视觉噪声与全局对齐",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "图文监督的视觉对应",
          "desc": "替照片选择便签，区分网页相关文字与可见内容描述。",
          "componentId": "blip-noise"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "ITC 的相对相似度",
          "desc": "调整正对相似度，计算与其他候选共同归一化后的概率。",
          "componentId": "blip-contrastive"
        }
      ],
      "scenes": [
        {
          "id": "s-noise",
          "title": "网页文本中的视觉噪声",
          "goal": "给同一张蛋糕照片选便签，检查它是否说到了可见内容。",
          "summary": "与照片相关的网页文字，不一定提供直接的视觉监督。",
          "interaction": "点原网页便签或看图写的描述；便签、事实对应与反馈同步变化。",
          "next": "先让真正对应的图文，在全局表征空间更接近。",
          "notes": "来源：用户PDF第1页Introduction、Figure1；第3页§3.3。论文指出alt-text可能不能准确描述图像。封面以同一图片配原文及生成文字：蛋糕的网页背景文字不直接描述画面，Captioner补出的蛋糕描述匹配；雨伞例子保留匹配原文、拒绝错误合成颜色。每对的勾叉是已知画面事实演示，不是真实ITM运行结果或论文指标。网页文字可能真实但缺少视觉对应；不能把所有背景文字都判成错误。",
          "componentId": "blip-noise",
          "moduleId": "1.1",
          "thumbnail": "./thumbnails/s-noise.jpg"
        },
        {
          "id": "s-itc",
          "title": "ITC：对齐全局图文表征",
          "goal": "提高蛋糕描述的相似度，观察它与其余候选的相对差距。",
          "summary": "ITC鼓励正图文对的表征比负对更相似。",
          "interaction": "调整蛋糕描述的相似度，重算三个候选的softmax概率。",
          "next": "相似度负责找候选；MED还需要能看细节和逐词生成的工作模式。",
          "notes": "来源：用户PDF第3页§3.2 Image-Text Contrastive Loss。实际BLIP使用动量编码器产生特征和软标签，以应对负例中潜在的正例。本页只演示softmax相对归一化：三个教学分数[s,0.6,0.2]、固定温度0.2；不是论文编号公式、真实特征或模型推理。s=0.4时正对概率约24.47%，s=1时约86.68%；分母随所有候选共同变化。相册放大镜象征匹配关注，不是模型注意力权重。",
          "componentId": "blip-contrastive",
          "moduleId": "1.2",
          "thumbnail": "./thumbnails/s-itc.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "MED：理解与生成的三种功能",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "MED 的注意力约束",
          "desc": "切换三种功能并观察输入词可关注的位置和视觉接入状态。",
          "componentId": "blip-architecture"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "ITM 的细粒度匹配",
          "desc": "修改伞色词条，区分主题相似与细节匹配。",
          "componentId": "blip-matching"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "LM 的自回归生成",
          "desc": "逐词贴入描述，计算教学链概率。",
          "componentId": "blip-language"
        }
      ],
      "scenes": [
        {
          "id": "s-med",
          "title": "MED：三种功能与注意力约束",
          "goal": "切换 ITC、ITM、LM，看输入与输出的区别。",
          "summary": "独立编码用于ITC，图像引导的编码与解码分别支持ITM和LM。",
          "interaction": "点模式和词块：比较相似度排序、图文判配与逐词生成。",
          "next": "有了融合图像的文本编码器，就能检查相似候选中的局部不一致。",
          "notes": "来源：用户PDF第2页Figure2，第3页§3.1–3.2。ITC分别编码图像和文本；ITM文本采用双向自注意力并增加视觉跨注意力；LM把双向SA替换为因果SA，同时保留视觉CA。预训练文本编码器与解码器共享词嵌入、CA、FFN等参数，SA不共享。三种功能不是三个完全独立模型，而是共享主体的不同预训练模式。当前连线、匹配判断、下一词和候选排序都是机制示意，不是模型注意力权重或实际输出。因果掩码允许当前位置和已写前缀，不会读取未来词。",
          "componentId": "blip-architecture",
          "moduleId": "2.1",
          "thumbnail": "./thumbnails/s-med.jpg"
        },
        {
          "id": "s-itm",
          "title": "ITM：检查细粒度图文对应",
          "goal": "改动一个词，图文还匹配吗？",
          "summary": "融合图文后做匹配二分类，补充全局相似度未能分清的细节。",
          "interaction": "替换人物、动作或颜色；查看对应区域和匹配结果。",
          "next": "理解图文对应还不够；描述生成必须按时间顺序写出新词。",
          "notes": "来源：用户PDF第3页§3.2 Image-Text Matching Loss。真实ITM用图像引导文本编码器的多模态表征和ITM线性分类头判断正对或负对；高ITC相似度负例更可能被采样。本页人物、动作、颜色按钮只按已知插图事实制作教学判定；连线与高亮帮助定位矛盾，不是BLIP注意力权重或分类器输出。训练中用难负例学习区分相似候选，匹配头用于二分类。",
          "componentId": "blip-matching",
          "moduleId": "2.2",
          "thumbnail": "./thumbnails/s-itm.jpg"
        },
        {
          "id": "s-lm",
          "title": "LM：图像条件下的逐词生成",
          "goal": "把词卡依次贴进相册说明，看看哪些信息能进入下一步。",
          "summary": "因果自注意力阻止偷看未来，LM逐词预测并优化文本似然。",
          "interaction": "每一步选择一张候选词卡；已有前缀、铅笔位置和链概率同步更新。可取回最后一个词重新选择。",
          "next": "Captioner可以生成描述；接下来还要决定如何采样和过滤。",
          "notes": "来源：用户PDF第3页§3.2 Language Modeling Loss、第2页Figure2。BLIP使用图像引导文本解码器，自回归交叉熵，并在真实训练中用0.1标签平滑。本页以两个候选的人工条件概率展示链式分解，不是BLIP预测或完整训练损失。第一步游客/孩子为0.8/0.2；第二步撑着在游客前缀下0.75、孩子前缀下0.6；第三步红伞在游客撑着/游客拿着/孩子撑着/孩子拿着前缀下分别0.9/0.65/0.8/0.55，另一个候选为余数。全选第一项为0.8×0.75×0.9=0.54；全选第二项为0.2×0.4×0.45=0.036。更改前缀后候选分布、逐项概率和总乘积一起改变。可见输入只有图像和已选词，不使用尚未选出的词；空前缀的乘积按1定义。概率大不保证视觉事实正确，后续需要Filter。",
          "componentId": "blip-language",
          "moduleId": "2.3",
          "thumbnail": "./thumbnails/s-lm.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "CapFilt：生成、过滤与重新预训练",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "Captioner 的核采样",
          "desc": "改变累计概率阈值，计算候选集合和归一化概率。",
          "componentId": "blip-sampling"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "Filter 的双来源校验",
          "desc": "模拟对原网页文字和合成文字的接受决策，观察训练集合。",
          "componentId": "blip-filtering"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "组合自举训练集",
          "desc": "放入或取出清洗后的两类网页图文对，人标对固定保留。",
          "componentId": "blip-bootstrap"
        }
      ],
      "scenes": [
        {
          "id": "s-sampling",
          "title": "Captioner：核采样与描述多样性",
          "goal": "转动候选词拨盘，看累计概率阈值如何改变可选词集合。",
          "summary": "CapFilt 用图像引导文本解码器生成描述；核采样保留达到阈值的最小候选集合。",
          "interaction": "调节 p，观察词卡展开、入选数量、累计概率和归一化概率同时变化。",
          "next": "更多生成选择不等于更准确；下一页检查原文和合成描述。",
          "notes": "来源：PDF p4 §3.3；p5 §4.3、Table2。Captioner由预训练MED初始化，并在COCO上用LM单独微调；每张网页图像生成一条描述。本文采用p=0.9。Table2在14M图像设置下，Beam的过滤噪声比例19%、NoCaps CIDEr103.5，Nucleus为25%、105.1；多样性带来更多信息是作者假设，不是已证因果定律。页面使用[0.5,0.25,0.15,0.1]透明教学分布，而非BLIP实际输出；词只是简化词表，不代表真实tokenizer。p=0.50时保留1词、归一化概率100%；p=0.90时保留3词、累计0.90，归一化为55.6%、27.8%、16.7%。所有词卡位置和概率派生于同一p。",
          "componentId": "blip-sampling",
          "moduleId": "3.1",
          "thumbnail": "./thumbnails/s-sampling.jpg"
        },
        {
          "id": "s-filter",
          "title": "Filter：原文与合成文本都要校验",
          "goal": "分别打开两份文字的审核夹，检查留下的是哪些图文对。",
          "summary": "Filter用ITM判断图文是否匹配，筛选范围包括原网页文字和Captioner生成的文字。",
          "interaction": "切换两份文字的保留或拒绝决策，观察网页图像贡献的训练对数量与噪声反馈。",
          "next": "筛选后还要与人标样本组合，构成新的预训练数据。",
          "notes": "来源：PDF p4 §3.3、Fig3。Filter是图像引导文本编码器，在COCO上用ITC与ITM单独微调；ITM预测不匹配的文字被移除。人标图文对保留，同一网页图像的原文与合成文字可都通过过滤。此页的审核夹是可操作的Filter决策教学替身，不运行实际ITM，也不暗示Filter总能识别真伪。默认拒绝背景随笔、接受蛋糕视觉描述，网页图像贡献1对；若两夹均保留，贡献2对并显示引入背景噪声的红色反馈；两夹均拒绝贡献0对。所有计数来自两个布尔状态，人标样本始终另外保留。",
          "componentId": "blip-filtering",
          "moduleId": "3.2",
          "thumbnail": "./thumbnails/s-filter.jpg"
        },
        {
          "id": "s-bootstrap",
          "title": "CapFilt：把清洗结果交给新模型",
          "goal": "把清洗后的图文对交给新模型。",
          "summary": "完整训练集包含人标对、筛选后的网页原文对和筛选后的合成描述对，随后预训练新模型。",
          "interaction": "交接三类图文对，再启动预训练演示。",
          "next": "接下来用论文的控制实验检查收益，而不是根据玩具样本数猜分数。",
          "notes": "来源：PDF p4 §3.3、Fig3；p8–9 §6、Tables12–13。人标图文对、清洗网页原文对和清洗合成描述对组合后交给新模型预训练；不是在推理时反复运行Captioner和Filter。新模型仍可按论文设定用ViT/BERT初始化，不等于所有参数随机初始化。此页的三条图文卡片代表三类数据，数量不代表论文数据规模；按钮只演示数据交接和训练流程，不运行真实训练，也不预测性能。Table13中续训COCO CIDEr为129.9、新训129.7；NoCaps续训104.5、新训105.1，不能声称新训所有指标都更高。",
          "componentId": "blip-bootstrap",
          "moduleId": "3.3",
          "thumbnail": "./thumbnails/s-bootstrap.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "消融与下游证据",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "参数共享与解耦",
          "desc": "区分模型内部层共享与 Captioner、Filter 之间的共享，查看相应消融结果。",
          "componentId": "blip-sharing"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "下游任务比较",
          "desc": "在各自评测协议内比较检索和问答，单独记录图像描述指标。",
          "componentId": "blip-results"
        }
      ],
      "scenes": [
        {
          "id": "s-ablation",
          "title": "CapFilt 消融：收益来自哪里",
          "goal": "在相同图像规模与视觉骨干下，分别观察生成和过滤的作用。",
          "summary": "生成和过滤各有增益，组合的 COCO CIDEr 达到 129.7；复制文本的对照不能复现该收益。",
          "interaction": "阅读从零起点绘制的精确柱图；这是固定实测结果，不由控制器改写。",
          "next": "同样是共享参数，为什么在 MED 与 CapFilt 中结论不同？",
          "componentId": "blip-ablation",
          "notes": "来源：用户 PDF p5 Table 1 的14M/ViT-B/16组，COCO Karpathy微调测试 CIDEr（越高越好）：原始127.8、仅F128.2、仅C128.9、C+F129.7；p9 Table 12复制网页文本从15.3M到24.7M样本，CIDEr127.7，而CapFilt为129.7。柱图横轴0至140，未截断基线，论文未给不确定性，故不虚构误差条。照片册插图只是呼应“加入有效描述”，不能证明因果；实验结论仅适用于论文对照。此页为静态证据，下一页恢复有操作的共享策略对比。",
          "thumbnail": "./thumbnails/s-ablation.jpg"
        },
        {
          "id": "s-sharing",
          "title": "参数共享的两种不同语境",
          "goal": "先确认“谁与谁共享”，再解读消融。",
          "summary": "MED 在预训练时除 SA 之外共享；CapFilt 的两个模块则分别微调。",
          "interaction": "选择模型内部或两模块，再切换共享策略，观察纸页、共享部件与原论文数值。",
          "next": "结构与数据的改变，是否同时反映在理解和生成任务中？",
          "componentId": "blip-sharing",
          "notes": "来源：p3 §3.2及p5 Table3，MED编码/解码共享所有参数时224M、COCO Caption FT CIDEr125.9；除SA共享252M、127.8；不共享361M、127.4。预训练均14M原始图文。页面没有展示“除CA共享”的额外行。p6 Table4中CapFilt两个模块共享时Filter拒绝比例8%、NoCaps ZS CIDEr103.5；分别微调时25%、105.1。NoCaps来自COCO图像描述模型迁移且越高越好。拒绝比例是Filter判为不匹配的占比，不是人工标注真噪声率。作者将共享模块的性能下降主要归因为确认偏差，不能把这个解释说成普遍定律。相册工具页的分开或重合仅表示参数所有权；真实网络不是两个人。",
          "thumbnail": "./thumbnails/s-sharing.jpg",
          "moduleId": "4.1"
        },
        {
          "id": "s-transfer",
          "title": "下游任务：理解与生成分别验证",
          "goal": "比较的前提是数据拆分、微调方式与指标一致。",
          "summary": "BLIP 14M 在 COCO 检索和 VQA2.0 的所选结果上优于 ALBEF，并能完成图像描述。",
          "interaction": "选择相册检索或看图问答；查看相应的固定指标与评测条件。",
          "next": "迁移到视频之后，静态视觉表示还能解释时间先后吗？",
          "componentId": "blip-results",
          "notes": "来源：p6 Table5，COCO Karpathy 5K test、两模型均14M预训练且经检索微调：ALBEF TR/IR R@1为77.6/60.7，BLIP80.6/63.1，单位%且越高越好，两个方向平均提升2.7个百分点。p7 Table8 VQA2.0 test-std ALBEF76.04、BLIP14M77.62；p12 Appendix A 说明VQA评测用解码器对3128候选答案排序，不能把生成式结构等同于完全开放自由输出的该组评测。p7 Table7 COCO Karpathy test图像描述BLIP14M CIDEr129.7。图表均零至100，但切换后指标语义与标题同步更新；CIDEr另列，不能混轴。照片仅为相册任务线索，非实际推理输出。",
          "thumbnail": "./thumbnails/s-transfer.jpg",
          "moduleId": "4.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "迁移与适用边界",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "视频抽帧的时间边界",
          "desc": "交换连拍顺序，区分静态内容与显式时序建模。",
          "componentId": "blip-video"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "生成描述的失败与修复",
          "desc": "更正或拒绝一条不符图像的描述，检查教学训练集是否仍含错误对。",
          "componentId": "blip-boundary"
        }
      ],
      "scenes": [
        {
          "id": "s-video",
          "title": "视频零样本迁移的时间边界",
          "goal": "同样画面，倒放后方向相反。",
          "summary": "BLIP 均匀抽帧并拼接帧特征，直接迁移到视频任务；原文明确未建模时序。",
          "interaction": "切换正放 / 倒放，对比画面内容与动作方向。",
          "next": "最后回到图文对：如果生成和过滤都可能出错，应怎样处理？",
          "componentId": "blip-video",
          "notes": "来源：p8 §5.6、Tables10–11。检索均匀抽8帧，QA抽16帧，帧特征拼为单序列；检索用COCO-retrieval微调模型、QA用VQA微调模型，零样本指没有目标视频任务训练。MSRVTT 1K test零样本检索 R@1=43.3%（越高越好）。小船三帧可倒序，教学集合计数恒为3，显示“只计内容”无法表达驶向或驶离；该集合操作不是BLIP数值前向，不据此宣称真实BLIP对帧调序严格置换不变。所有数值保持固定，不把倒序后的玩具画面说成测得的检索得分。",
          "thumbnail": "./thumbnails/s-video.jpg",
          "moduleId": "5.1"
        },
        {
          "id": "s-boundary",
          "title": "生成噪声：过滤也需要独立校验",
          "goal": "先核对视觉事实，再决定一条描述是否进入训练集。",
          "summary": "合成文本与Filter都可能出错；更正或拒绝错误对，能在教学例子中修复集合。",
          "interaction": "切换红伞/蓝伞说明，再切换保留/拒绝；观察样本数量、错误对数量和反馈。",
          "next": "理解了机制与证据后，下一步应对照原论文进行人工内容核验。",
          "componentId": "blip-boundary",
          "notes": "来源：p5 Table2，核采样合成文本的Filter拒绝比例25%，并非人工标注的真实错误率；p6 Table4说明共享Captioner和Filter可能有确认偏差；p9 Conclusion将多轮自举、每图多合成描述、多个模型集成列为未来方向。主实验为每图生成一条。教学照片伞色固定红色；初态文字蓝伞且保留，3条基准人标+1条描述=4对，其中1错误；改红伞且保留时4对0错误；拒绝时3对0错误。此判定是已知事实规则，不调用真正BLIP或ITM；3条人标是玩具常量而非真实训练规模。人工核验是当前教程工作流要求，不声称论文提出了人工审核步骤。",
          "thumbnail": "./thumbnails/s-boundary.jpg",
          "moduleId": "5.2"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg"
  }
};

import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Detect Anything via Next Point Prediction",
    "titleZh": "用下一个点预测检测任意目标：Rex-Omni",
    "venue": "arXiv 2510.12798 · IDEA Research · 2025",
    "authors": "Qing Jiang, Junan Huo, Xingyu Chen, Yuda Xiong, Zhaoyang Zeng, Yihao Chen, Tianhe Ren, Junzhi Yu, Lei Zhang",
    "affiliation": "International Digital Economy Academy (IDEA)",
    "domain": "多模态大模型 · 目标检测",
    "coreProblem": "多模态大模型能听懂复杂描述，可让它直接写出框的坐标时，常常漏框、重复、框不准。",
    "coreInsight": "Rex-Omni 把坐标写成 1000 个格子词，先照着答案学会写，再让模型自己写完、按方框好坏打分，从而减少漏框和重复。",
    "keywords": [
      "坐标词元",
      "下一个词元预测",
      "数据引擎",
      "SFT",
      "GRPO",
      "几何奖励"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "常规 MLLM 的坐标生成",
      "desc": "坐标拆成一串数字写：更慢，还会漏框、重复。",
      "componentId": "cover-compare"
    },
    "newMethod": {
      "title": "Rex-Omni：下一个点预测",
      "desc": "每个坐标一个专用词元：5 个框，然后结束。",
      "componentId": "cover-compare"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "提出问题",
      "modules": [
        {
          "kind": "module",
          "id": "n-t1-box-iou",
          "title": "找物体就是画方框，和标准答案重合得越多越好",
          "desc": "拖动预测框，按格数计算重叠、合并与 IoU。",
          "componentId": "t1-box-iou"
        },
        {
          "kind": "module",
          "id": "m1",
          "title": "检测模型框得准，大模型更懂描述，各有短板",
          "desc": "分四步对比回归检测器、通用 MLLM 与本文目标在同一指令下的输出。",
          "componentId": "s1-two-gaps"
        },
        {
          "kind": "module",
          "id": "m0",
          "title": "自己试一试：你也会漏框、重复和框歪",
          "desc": "读者扮演 MLLM：逐个画框、自己决定何时写结束标记，页面实时判定命中、重复、偏移与漏检。",
          "componentId": "s0-write"
        }
      ],
      "scenes": [
        {
          "id": "t1-box-iou",
          "title": "找物体就是画方框，和标准答案重合得越多越好",
          "goal": "一个方框用左上角和右下角两个点、共四个数来表示。衡量方框好不好，看它和标准答案的重合程度（IoU）。",
          "summary": "框用四个数表示，IoU 用重叠面积除以合并面积衡量框的好坏",
          "interaction": "拖动蓝色预测框或右下角手柄，方向键也可移动",
          "next": "会说话的大模型也能画框吗？画得怎样？",
          "notes": "背景知识：目标检测、真值（GT）、IoU 是本领域的基础概念，这里先讲清楚。论文用 IoU 阈值 0.5 到 0.95 评测，步长 0.05，并报告 0.5、0.95 和均值（第 14 页 5.1 节）。\n页面的方格是计算示例，所有数字都是格数。回归检测器用 L1、GIoU 这类几何损失（第 2 页第 1 节）。",
          "componentId": "t1-box-iou",
          "moduleId": "n-t1-box-iou"
        },
        {
          "id": "s1-two-gaps",
          "title": "检测模型框得准，大模型更懂描述，各有短板",
          "goal": "同一个指令下，传统检测模型能把目标框准，却分不清复杂描述；多模态大模型能理解描述，却常常漏框、重复或框歪。",
          "summary": "检测器定位准但不懂描述；MLLM 懂描述但漏框、重复、偏移",
          "interaction": "点 ① 到 ④ 或“下一步”，看两类模型的框和计数怎样变化",
          "next": "大模型那一侧的错误到底怎么来的？你来当一次大模型。",
          "notes": "依据：论文第 2 页图 2 与第 1 节。图 2 左：Grounding DINO 收到 “red apple” 时框出了所有苹果（语言理解浅）；Qwen2.5-VL-7B 收到 “detect apple” 只给出很少的框。正文列出 MLLM 检测的三种典型问题：低召回、坐标漂移、重复预测。\n本页的湖面白鹭场景是按图 2 的现象重新编排的教学示意，框的位置与计数不是任何模型的实测输出；第 ③ 步偏移框与真值的 IoU 由页面实时计算。第 ④ 步是论文要达到的目标，不是实验结果。",
          "componentId": "s1-two-gaps",
          "moduleId": "m1"
        },
        {
          "id": "s0-write",
          "title": "自己试一试：你也会漏框、重复和框歪",
          "goal": "在照片上一个个画框，觉得够了就写“结束”。页面会实时告诉你哪些框画对了，哪些漏了、重复了或画歪了。",
          "summary": "读者亲手写框，自己造出漏检、重复和坐标漂移",
          "interaction": "在照片上拖动画框；点“写结束标记”；可擦掉或重来",
          "next": "为什么大模型会犯这些错？论文给了两个原因，先看第一个：坐标是怎么写出来的。",
          "notes": "依据：第 2–3 页第 1 节列出 MLLM 检测的三种典型问题：低召回（漏检）、坐标漂移、重复预测；第 5–6 页 2.3 节：框按 x0 排列，写完坐标后以结束标记收尾。\n本页没有任何模型输出：所有框都由读者自己画，判定规则是页面的教学定义——与某只白鹭 IoU ≥ 0.5 且这只还没被框过算命中；已经框过再框算重复；IoU 在 0.1–0.5 之间算偏移；写下结束标记后仍未被命中的白鹭算漏检。论文评测用的是 IoU 0.5–0.95 多个阈值的 F1，见第九步。\n页面中的白鹭照片只是示意图，不代表论文的测试图像。",
          "componentId": "s0-write",
          "moduleId": "m0"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "分析：方框为何画歪",
      "modules": [
        {
          "kind": "module",
          "id": "n-t2-next-token",
          "title": "大模型一次只能写一个词，坐标也要一位一位地写",
          "desc": "逐个写 token，并决定继续还是结束。",
          "componentId": "t2-next-token"
        },
        {
          "kind": "module",
          "id": "m6",
          "title": "原因一：训练时，坐标差一点和差很多算同样的错",
          "desc": "调整预测框的坐标词元，比较相邻值与远处值的 L1 和 IoU。",
          "componentId": "s6-ce-geometry"
        }
      ],
      "scenes": [
        {
          "id": "t2-next-token",
          "title": "大模型一次只能写一个词，坐标也要一位一位地写",
          "goal": "多模态大模型把坐标当成文字来写：比如 1921 要拆成 1、9、2、1 四个数字，一个接一个生成。",
          "summary": "MLLM 每步预测一个 token，写完一个框后还要判断继续还是结束",
          "interaction": "点“预测下一个 token”，框写完后选择继续或结束",
          "next": "这样写，错一位数字代价有多大？",
          "notes": "依据：第 2 页第 1 节（把坐标表示为离散 token，通过 next-token prediction 预测框）、第 4 页 2.1 节（绝对坐标如 1921 拆成 1、9、2、1，代表模型 Qwen2.5-VL）。“token 是词表里的一项”是背景知识。\n页面中继续或结束由读者决定，不是模型输出。页面用逐位写法示范生成过程，鸟的坐标是教学数值。",
          "componentId": "t2-next-token",
          "moduleId": "n-t2-next-token"
        },
        {
          "id": "s6-ce-geometry",
          "title": "原因一：训练时，坐标差一点和差很多算同样的错",
          "goal": "训练用的交叉熵损失只看“写得对不对”，不看“差了多远”：写成 34 和写成 900，在它看来是一样的错误。",
          "summary": "交叉熵把坐标当类别，差 1 格与差几百格同样算错",
          "interaction": "点三个典型情形，或用 ±1、±50 调整四个坐标",
          "next": "第二个原因出在训练方式上。",
          "notes": "依据：第 2 页图 2 右、第 11 页 4.2.1 节“Geometric Discretization Issue”。SFT 用标准交叉熵在 2200 万数据上训练（64 张 A100 约 8 天，视觉编码器学习率 2e-6，投影层与 LLM 2e-5，第 10–11 页 4.1 节）。论文例子：真值 <33> 预测 <32> 几何上几乎无差，交叉熵却判为完全错误；真值 <0><0><100><100> 预测 <0><0><100><1000> 只错 1 个词元，框却严重偏离。原文写的 <1000> 超出 0–999 范围，应为笔误，本页改用 <999>。\n页面只对比论文论证中出现的量：预测词元是否等于真值类别（交叉熵的监督目标），以及 L1 与 IoU（实时计算）。检测器使用 L1、GIoU 等几何损失。",
          "componentId": "s6-ce-geometry",
          "moduleId": "m6"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "分析：为何漏框重复",
      "modules": [
        {
          "kind": "module",
          "id": "m7",
          "title": "原因二：总有答案带路，模型没学会何时停",
          "desc": "同步推进训练与推理两侧，比较框数与重复。",
          "componentId": "s7-teacher-forcing"
        }
      ],
      "scenes": [
        {
          "id": "s7-teacher-forcing",
          "title": "原因二：总有答案带路，模型没学会何时停",
          "goal": "训练时，模型每写一步都拿到正确的前文，框的个数也由答案决定；真正使用时只能自己往下写，于是不知道什么时候该停。",
          "summary": "SFT 训练时框数由标注决定，推理时模型自己写容易重复和漏检",
          "interaction": "点“两边各写下一个框”，比较两侧的框数与反馈",
          "next": "知道了病因，Rex-Omni 先改坐标的写法。",
          "notes": "依据：第 2–3 页第 1 节、第 11 页 4.2.1 节“Behavioral Regulation Deficiency”、第 16–17 页 5.3 节。teacher forcing 下每一步的输入都是真值前缀，模型从未看到自己写错的内容；框的个数固定为真值个数，模型没有学会自己控制数量，推理时会少写（漏检）或多写（坐标相同或略有偏移的重复框）。论文在 SFT 模型上观察到了这些重复。\n右侧是按论文描述编排的教学重放，不是记录下来的模型输出。",
          "componentId": "s7-teacher-forcing",
          "moduleId": "m7"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "改进一：坐标格子",
      "modules": [
        {
          "kind": "module",
          "id": "m2",
          "title": "把宽和高各分成 1000 格，每格一个专用词",
          "desc": "拖动坐标点、切换图像宽度，观察像素坐标如何变成 0–999 的坐标词元。",
          "componentId": "s2-quantize"
        },
        {
          "kind": "module",
          "id": "m3",
          "title": "点、框、多边形都用“名称 + 坐标”输出",
          "desc": "选择任务，查看点、框、多边形、关键点和视觉提示对应的词元序列。",
          "componentId": "s3-formats"
        },
        {
          "kind": "module",
          "id": "m4",
          "title": "写一个方框只需要 4 个词，写完再决定要不要继续",
          "desc": "一次写一个词元，看框的四条边如何依次确定、序列何时结束。",
          "componentId": "s4-decode"
        }
      ],
      "scenes": [
        {
          "id": "s2-quantize",
          "title": "把宽和高各分成 1000 格，每格一个专用词",
          "goal": "Rex-Omni 先把坐标换算成图片宽、高的比例，再分成 1000 格，每一格对应词表里一个专门的坐标词。",
          "summary": "坐标除以图像宽高再量化成 1000 格，每个值一个专用词元",
          "interaction": "拖动橙色点；切换图像宽度，比较三种写法的词元数",
          "next": "有了格子词元，点、框、多边形都能用同一种格式写。",
          "notes": "依据：第 4–5 页 2.1 节与图 3。论文比较了三种写法：相对坐标+专用词元（Pix2Seq）、相对坐标+普通数字（SEED1.5-VL）、绝对坐标（Qwen2.5-VL，把 1921 拆成 1、9、2、1）。Rex-Omni 选第一种：①把分类范围限制在 1000 类，降低学习难度；②一个框只要 4 个词元，而不用专用词元约要 15 个（含分隔符），推理更快。第 6 页 2.4 节：复用 Qwen2.5-VL 词表最后 1000 个词元，不新增参数。\n论文没有写取整细节，本页用 round(x/W×999) 示范；图 3 中 2240 宽图像上 1164 对应 <518>，与本页算法可能差 1，属取整方式不同。",
          "componentId": "s2-quantize",
          "moduleId": "m2"
        },
        {
          "id": "s3-formats",
          "title": "点、框、多边形都用“名称 + 坐标”输出",
          "goal": "无论是找一个点、画一个框还是勾一个轮廓，输出都是一个名称加一串坐标词，区别只是坐标的个数。",
          "summary": "所有任务都输出“短语 + 坐标词元序列”，只是点的个数不同",
          "interaction": "点左侧任务卡，观察照片上的几何与下方词元序列",
          "next": "放进生成过程里看看：一个框要写几步？",
          "notes": "依据：第 5–6 页 2.2–2.3 节。基本格式 <|object_ref_start|>短语<|object_ref_end|><|box_start|>坐标<|box_end|>，页面按论文图 4 简写为 P、P/、C、C/。点 = 1 对坐标；框 = [x0,y0,x1,y1]，多框按 x0 升序；多边形 ≥4 个点；关键点用 JSON；多个短语用逗号连接；图中不存在的短语坐标写 None。视觉提示：示例框先量化成坐标词元写进指令（2.2 节）。\n视觉提示的输出短语写法论文没有展示，本页用 object1 示意；照片里的坐标为教学场景数值。论文实际指令多为英文，这里用中文便于阅读。",
          "componentId": "s3-formats",
          "moduleId": "m3"
        },
        {
          "id": "s4-decode",
          "title": "写一个方框只需要 4 个词，写完再决定要不要继续",
          "goal": "每个坐标只占一个词，方框按从左到右的顺序写；全部写完后，模型写出结束标记。",
          "summary": "框的四条边依次由 4 个坐标词元确定，何时结束也是一次预测",
          "interaction": "点“写下一个词元”，或“写完这个框”“连续写”",
          "next": "要学会 1000 个格子和像素的对应，需要海量标注数据。",
          "notes": "依据：第 1 页摘要“next token prediction”、第 5–6 页 2.3 节输出格式（框按 x0 升序）、第 11 页图 6（序列以 <EOS> 结束）。模型每一步只预测下一个词元：短语、坐标、逗号、结束标记都一样。\n页面只展示词元的生成顺序，不展示概率（论文未给出模型的输出分布）。“写逗号继续还是写 C/ 收尾”决定了框的数量，与 4.2.1 节行为调控缺陷所说的漏检、重复相关。\n效率：论文表 17 统计 COCO 上每个框平均 7.6 个输出词元，SEED1.5-VL 为 148.8 个。",
          "componentId": "s4-decode",
          "moduleId": "m4"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "背景：训练数据",
      "modules": [
        {
          "kind": "module",
          "id": "m5",
          "title": "作者用现有模型自动标注了约 2200 万张图片",
          "desc": "拖动 Molmo 给出的点，观察指代数据怎样关联；切换形容词过滤。",
          "componentId": "s5-data"
        }
      ],
      "scenes": [
        {
          "id": "s5-data",
          "title": "作者用现有模型自动标注了约 2200 万张图片",
          "goal": "先用现成的模型自动画框、写描述，再用规则把标错的去掉，最后和公开数据集合在一起。",
          "summary": "指代引擎靠“点落在掩码内”关联框；定位引擎去掉带形容词的短语",
          "interaction": "拖动橙色点；切换形容词过滤开关",
          "next": "数据有了，训练分两步。",
          "notes": "依据：第 7–10 页 3.1–3.2 节、图 5。公开数据约 890 万条。定位引擎：Qwen2.5-VL-7B 写描述 → SpaCy 抽名词短语 → 去掉带形容词等描述属性的短语（论文例：green lemon 会让检测器框出所有柠檬）→ DINO-X 标框，约 300 万张。指代引擎：Qwen2.5-VL-7B 按类别生成指代描述 → Molmo 给出一个点 → SAM 为每个真值框求掩码 → 点落在哪个掩码内就把那个框配给该描述，约 300 万张。指点引擎：SAM 掩码的最小外接旋转矩形对角线交点，若在掩码内则作为点标注，约 500 万。OCR 引擎：PaddleOCR，约 200 万。合计约 2200 万张图（各项均为约数）。\n本页的白鹭掩码用画出的鸟形近似，描述与短语是中文教学例子。",
          "componentId": "s5-data",
          "moduleId": "m5"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "改进二：自己写再打分",
      "modules": [
        {
          "kind": "module",
          "id": "n-t7-two-stage",
          "title": "训练分两步：先照答案学，再自己写完打分",
          "desc": "切换两个阶段，对比四项条件。",
          "componentId": "t7-two-stage"
        },
        {
          "kind": "module",
          "id": "m9",
          "title": "重合越多分越高，多画、漏画都扣分",
          "desc": "拖动、添加、删除预测框或改类别，实时计算召回、精确与 F1 奖励。",
          "componentId": "s9-box-reward"
        },
        {
          "kind": "module",
          "id": "m8",
          "title": "同一张图写 8 份答案，比平均分高的写法会被加强",
          "desc": "采样 8 个回答、计算奖励与组内优势，并按优势更新行为概率。",
          "componentId": "s8-grpo-group"
        }
      ],
      "scenes": [
        {
          "id": "t7-two-stage",
          "title": "训练分两步：先照答案学，再自己写完打分",
          "goal": "第一步（SFT）照着标准答案学会写坐标；第二步（GRPO）让模型自己写出完整答案，再按方框的好坏打分。",
          "summary": "SFT 用真值前文和交叉熵学基本能力，GRPO 让模型自己写完并按几何奖励调整",
          "interaction": "点两个阶段，对比前文来源、监督信号、数据量和算力",
          "next": "第二步的分数是怎么算的？",
          "notes": "依据：第 10–11 页 4.1 节（SFT：约 2200 万数据，交叉熵，8 节点各 8 张 A100，约 8 天）；第 13 页 4.2.4 节（GRPO：6.6 万条，8 张 A100，约 24 小时，rollout 8，β=0.01，batch 64）；第 11 页图 6 为原图（CC BY 4.0）。GRPO 是强化学习方法，出处为论文引用 [92]。",
          "componentId": "t7-two-stage",
          "moduleId": "n-t7-two-stage"
        },
        {
          "id": "s9-box-reward",
          "title": "重合越多分越高，多画、漏画都扣分",
          "goal": "每个标准方框去找重合最多的预测框，类别对了才得分；再综合“有没有漏”和“有没有多”算出总分。",
          "summary": "每个真值框取 IoU 最大的预测框、类别对才得分，再用 F1 平衡多框与漏框",
          "interaction": "拖动或缩放蓝框；添加重复框、换成大框、切换类别、删除",
          "next": "有了分数，模型怎样据此改进？",
          "notes": "依据：第 12–13 页 4.2.3 节式 (3)(4)。对每个真值框 b_j，找与它 IoU 最大的预测框（真值引导匹配，同一个预测框可以被多个真值选中）；类别一致则 r_j = IoU，否则为 0。Recall = Σr_j / n，Precision = Σr_j / m，奖励 = 2PR/(P+R+ε)。该奖励用于检测、定位、指代和 OCR。点类任务用“点落在 SAM 掩码内”（指点）或“点落在框内”（GUI 定位）给 1/0 分，再用相同公式计算。\n本页所有数值由页面按上述公式实时计算，场景坐标为教学数值。",
          "componentId": "s9-box-reward",
          "moduleId": "m9"
        },
        {
          "id": "s8-grpo-group",
          "title": "同一张图写 8 份答案，比平均分高的写法会被加强",
          "goal": "模型对同一张图写 8 份答案，每份和这一组的平均分比较：高于平均的被加强，低于平均的被减弱。",
          "summary": "奖励在组内标准化成优势：高于平均的回答被加强，低于平均的被压低",
          "interaction": "点“再采样一组”“按优势更新一步”；点某根柱子查看该回答",
          "next": "这两步真的治好了两个病吗？看实验。",
          "notes": "依据：第 12 页 4.2.2 节式 (1)(2)、第 13 页 4.2.4 节、第 11 页图 6 右。对图像与问题 (I, x)，从当前策略采样 G 个完整回答，奖励 r_i 在组内标准化：A_i = (r_i − mean)/std。目标函数是带裁剪的策略梯度，并用 β·KL 约束不偏离冻结的 SFT 模型 π_ref。实现：从 SFT 数据中抽 6.6 万条，8 张 A100 约 24 小时，rollout 数 8，β = 0.01，batch 64，全部参数更新。\n本页的奖励用下一页同一个框 IoU 奖励函数真实计算；“5 种行为及其概率、按 exp(0.8·平均优势) 更新”是为了看清方向的玩具模型，真实 GRPO 更新的是网络参数 θ。若一组奖励全部相同，标准差为 0，本页把优势记为 0。",
          "componentId": "s8-grpo-group",
          "moduleId": "m8"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "检验：改进有没有用",
      "modules": [
        {
          "kind": "module",
          "id": "m10",
          "title": "第二步训练后，重复的框和过大的框几乎消失了",
          "desc": "切换“去掉重复框/大框”，比较 SFT 与 GRPO 的分数变化。",
          "componentId": "s10-behavior"
        },
        {
          "kind": "module",
          "id": "m11",
          "title": "坐标本身只准了一点，主要是更容易写出好答案",
          "desc": "切换数据集，比较 SFT、GRPO 与 SFT 高温采样。",
          "componentId": "s11-precision"
        },
        {
          "kind": "module",
          "id": "n-t8-chain",
          "title": "实验结论：改进主要减少了重复框和过大的框",
          "desc": "逐条查看现象、假设、实验与结论。",
          "componentId": "t8-chain"
        }
      ],
      "scenes": [
        {
          "id": "s10-behavior",
          "title": "第二步训练后，重复的框和过大的框几乎消失了",
          "goal": "把重复框、过大的框删掉再重新评分：只做第一步的模型分数大涨，说明它原来问题很多；做完第二步的模型几乎不变。",
          "summary": "SFT 模型删掉重复框、大框后分数大涨，GRPO 模型几乎不变",
          "interaction": "点上方按钮，在原始输出与清理后输出之间切换",
          "next": "那坐标本身变准了吗？",
          "notes": "依据：第 27 页表 13、第 28 页表 14 与图 17。重复预测定义：同一数值连续出现至少 10 次，且预测框数超过真值两倍。表 13（F1@IoU0.5）：SFT COCO 68.2→70.1、LVIS 60.3→61.3、VisDrone 55.6→62.3；GRPO 72.0→72.6、64.3→64.7、61.6→62.1。“删”后的百分数是表中 Remov. 列，即被删除预测所占比例；论文正文把它写成“+1.23%”等提升，与表格 F1 差值不同，本页按表格分别展示。大框定义：整张图只预测一个框且面积超过图像 95%。表 14（Dense200 F1@mIoU）：SFT 44.9→56.7（大框占 20.5%），GRPO 58.3→60.0（3.5%）。注意表 14 的 SFT 行（F1@0.5 为 59.1）与表 4（60.2）略有出入。\n图 17 为论文原图（CC BY 4.0）。",
          "componentId": "s10-behavior",
          "moduleId": "m10"
        },
        {
          "id": "s11-precision",
          "title": "坐标本身只准了一点，主要是更容易写出好答案",
          "goal": "只看框数和配对都一致的样本，坐标精度只略有提高；在简单数据上，第二步主要是让模型更容易写出好答案。",
          "summary": "坐标精度只略有提升；简单数据上主要提高采到好答案的概率，复杂数据上带来 SFT 采样达不到的质量",
          "interaction": "切换 COCO、LVIS、Dense200，比较四根柱子",
          "next": "把这几条证据放在一起看。",
          "notes": "依据：第 28–30 页 6.1.3–6.1.4 节、表 15、表 16，第 26–27 页图 16。表 15 只统计两模型框数都与真值一致、且每个框 IoU 都超过阈值的样本：F1@mIoU COCO 63.0→63.5，LVIS 56.6→56.9，HumanRef 60.0→61.2。表 16：用 SFT 模型高温采样（温度 1.2，top-k 50，top-p 0.99）每题 8 个结果；“最好一轮”= 8 次全量测试中最高的一次，“逐题挑最好”= 每题按真值挑出最好的结果再汇总，相当于理想上限，无法实际部署。图 16 没有给出表格数值，本页只描述趋势。",
          "componentId": "s11-precision",
          "moduleId": "m11"
        },
        {
          "id": "t8-chain",
          "title": "实验结论：改进主要减少了重复框和过大的框",
          "goal": "减少重复框、减少过大框这两点得到支持；坐标精度提升很小；更容易写出好答案这一点因任务而异。",
          "summary": "四条论证：重复预测、大框预测获支持，坐标精度提升很小，采样概率因任务而异",
          "interaction": "点左侧四条论证，查看现象、假设、实验、数据和结论",
          "next": "最后看总体效果和代价。",
          "notes": "依据：表 13（第 27 页）、表 14（第 28 页）、表 15、16（第 29 页）与 6.1.2–6.1.4 节。第三条值得单独提：作者原本假设 GRPO 靠几何奖励提高坐标精度，表 15 显示提升很小，于是把主要作用归到行为纠正（第 29 页）。“逐题挑最好”需要真值，不可部署。",
          "componentId": "t8-chain",
          "moduleId": "n-t8-chain"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "效果、代价与总结",
      "modules": [
        {
          "kind": "module",
          "id": "m12",
          "title": "宽松标准下追上检测模型，严格标准下仍落后",
          "desc": "切换数据集与 IoU 阈值，观察排名变化。",
          "componentId": "s12-results"
        },
        {
          "kind": "module",
          "id": "m13",
          "title": "代价：物体越多越慢，部分任务不如专门模型",
          "desc": "拖动预测框数量，观察坐标词元、输出词元与估计时间。",
          "componentId": "s13-limits"
        },
        {
          "kind": "module",
          "id": "m14",
          "title": "总结：用格子写坐标，再自己写完打分",
          "desc": "拖动同一个框，量化、序列、交叉熵监督、GRPO 奖励四格同时更新。",
          "componentId": "s14-recap"
        }
      ],
      "scenes": [
        {
          "id": "s12-results",
          "title": "宽松标准下追上检测模型，严格标准下仍落后",
          "goal": "在 COCO 数据集上，按重合度 0.5 判对时，Rex-Omni 超过了 DINO-R50；按 0.95 判对时仍低于它。",
          "summary": "IoU 0.5 时零样本追上检测器，IoU 0.95 时仍落后",
          "interaction": "切换数据集和 IoU 阈值，查看柱状图排序与结论",
          "next": "效果之外还有什么代价？",
          "notes": "依据：第 14 页表 2（COCO）、第 16 页表 3（LVIS）、第 17 页表 4（Dense200）、第 18 页表 5（HumanRef）。评测方式（第 14 页 5.1 节）：因 MLLM 没有可靠置信度，用 Recall、Precision、F1；IoU 阈值 0.5–0.95，报告 0.5、0.95 和均值；闭集与开集检测器取 0–1 置信度阈值中最好的 F1；除 SEED1.5-VL 与 Rex-Omni 一次查询全部类别外，其他 MLLM 每次只查一个类别；Rex-Omni 温度为 0。COCO 闭集检测器在 COCO 上训练过，Rex-Omni 与 Grounding DINO 为零样本。HumanRef 每次查询一句描述，Grounding DINO 用官方阈值 0.25。\n论文其他任务（指点、GUI、版面、OCR、空间指代、关键点）见表 7–12，未在本页展开。",
          "componentId": "s12-results",
          "moduleId": "m12"
        },
        {
          "id": "s13-limits",
          "title": "代价：物体越多越慢，部分任务不如专门模型",
          "goal": "生成时间随方框数量大致线性增长；在要求极高精度、按示例找物体和人体关键点等任务上，仍落后于专门模型。",
          "summary": "生成时间随框数近似线性增长；极高 IoU、视觉提示、人体关键点仍落后专用模型",
          "interaction": "拖动“预测框数量”滑块，观察词元数与估计时间",
          "next": "最后用同一个框把全程串起来。",
          "notes": "依据：第 30–31 页 6.2 节与图 18（单张 A100、vLLM、BF16、无加速）：生成时间和输出词元数随预测框数近似线性增长，0–29 个框不到 2 秒，410–419 个框超过 16 秒；论文认为可通过量化或蒸馏加速。表 17：每框平均 7.6（COCO）/ 5.1（Dense200）个输出词元。本页时间是用这两个端点做的粗略线性估计，只示意趋势。\n其他局限：表 2 COCO F1@0.95 15.9 vs DINO-R50 21.1；表 6 FSC147 F1@0.5 86.0 vs T-Rex2 91.5；表 12 COCO 关键点 F1@OKS0.5 44.4 vs X-Pose 66.3，AP10K 上 30.1 vs 17.0；表 5 HumanRef 85.4 vs SEED1.5-VL 88.2；表 10 多边形 OCR 结果有升有降。论文结论（第 31 页）也把推理速度列为主要局限。",
          "componentId": "s13-limits",
          "moduleId": "m13"
        },
        {
          "id": "s14-recap",
          "title": "总结：用格子写坐标，再自己写完打分",
          "goal": "用同一个方框，把量化成格子、写成序列、照答案学习、自己写完打分四步串起来。",
          "summary": "同一个框依次经过量化、序列、SFT 交叉熵和 GRPO 奖励",
          "interaction": "拖动或缩放蓝框；切换“多写一个重复框”",
          "next": "",
          "notes": "回顾全文主线：①坐标量化为 0–999 词元（第 4–5 页 2.1 节）；②与短语、标记一起组成序列（第 5–6 页 2.3 节）；③SFT 用交叉熵逐词元比对，错一格与错几百格同样算错（第 11 页 4.2.1 节）；④GRPO 用框 IoU 奖励，召回 Σr/n、精确 Σr/m、类 F1 组合（第 12–13 页式 3–4），重复框会拉低精确率。\n③只标出与真值类别不同的词元位置，说明交叉熵的监督方式，不计算交叉熵数值（需要模型输出的概率分布）；④按论文公式实时计算。场景坐标为教学数值。\n\n原“原文对不上的数据”页内容：\n这一页是本教程的核算结果，不是论文作者的说明。逐项：第 11 页 <1000>；表 13 与第 27 页正文；表 14 与表 4；表 2 Deformable-DETR 行；表 10 与 5.9 节；表 8 与 5.7 节；表 7 与 5.6 节；图 3 与算式。\n\n原“例会问答”页内容：\n依据见各条。“零样本”一条中对表 1 的观察、“为何不用 L1”一条的解释不是论文原文，已在页面标明。",
          "componentId": "s14-recap",
          "moduleId": "m14"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "t1-box-iou": "./thumbnails/t1-box-iou.jpg",
    "t2-next-token": "./thumbnails/t2-next-token.jpg",
    "s1-two-gaps": "./thumbnails/s1-two-gaps.jpg",
    "s0-write": "./thumbnails/s0-write.jpg",
    "s6-ce-geometry": "./thumbnails/s6-ce-geometry.jpg",
    "s7-teacher-forcing": "./thumbnails/s7-teacher-forcing.jpg",
    "s2-quantize": "./thumbnails/s2-quantize.jpg",
    "s3-formats": "./thumbnails/s3-formats.jpg",
    "s4-decode": "./thumbnails/s4-decode.jpg",
    "s5-data": "./thumbnails/s5-data.jpg",
    "t7-two-stage": "./thumbnails/t7-two-stage.jpg",
    "s9-box-reward": "./thumbnails/s9-box-reward.jpg",
    "s8-grpo-group": "./thumbnails/s8-grpo-group.jpg",
    "s10-behavior": "./thumbnails/s10-behavior.jpg",
    "s11-precision": "./thumbnails/s11-precision.jpg",
    "t8-chain": "./thumbnails/t8-chain.jpg",
    "s12-results": "./thumbnails/s12-results.jpg",
    "s13-limits": "./thumbnails/s13-limits.jpg",
    "t9-mismatch": "./thumbnails/t9-mismatch.jpg",
    "t9-qa": "./thumbnails/t9-qa.jpg",
    "s14-recap": "./thumbnails/s14-recap.jpg"
  }
};

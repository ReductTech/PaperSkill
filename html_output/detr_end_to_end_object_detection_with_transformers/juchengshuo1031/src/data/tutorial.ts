import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "End-to-End Object Detection with Transformers",
    "titleZh": "使用 Transformer 的端到端目标检测",
    "venue": "ECCV 2020",
    "authors": "Nicolas Carion · Francisco Massa · Gabriel Synnaeve · Nicolas Usunier · Alexander Kirillov · Sergey Zagoruyko",
    "affiliation": "Facebook AI",
    "domain": "计算机视觉 · 目标检测",
    "coreProblem": "如何直接预测无重复的目标集合，减少检测中的手工组件？",
    "coreInsight": "用 Transformer 并行预测集合，通过匈牙利一对一匹配学习唯一对应。",
    "keywords": [
      "DETR",
      "集合预测",
      "Object query",
      "匈牙利匹配"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "候选预测与去重",
      "desc": "合影登记类比：先产生重复标记，再去重。",
      "componentId": "cover-old"
    },
    "newMethod": {
      "title": "DETR 集合预测",
      "desc": "合影登记类比：学习唯一对应，直接给出预测集合。",
      "componentId": "cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "端到端动机",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "集合预测直接处理重复检测",
          "desc": "从合影重复登记理解一对一集合预测",
          "componentId": "motivation"
        }
      ],
      "scenes": [
        {
          "id": "scene-1",
          "title": "集合预测直接处理重复检测",
          "goal": "从合影重复登记理解一对一集合预测",
          "summary": "从合影重复登记理解一对一集合预测",
          "interaction": "点击登记规则，比较重复候选与唯一对应。",
          "next": "整体架构如何支持全局推理？",
          "notes": "pp.1–2 §1；图像仅为合成概念示意，不模拟训练，不将理想匹配视为实际检测保证。",
          "componentId": "motivation",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "整体架构",
      "modules": [],
      "scenes": [
        {
          "id": "scene-2",
          "title": "CNN 与 Transformer 的协作",
          "goal": "标准 DETR 如何从图像生成类别与边界框？",
          "summary": "CNN 提取特征，编码器建模上下文，解码器并行处理 queries，共享预测头输出类别与框。",
          "interaction": "阅读自绘结构关系图与简短中文说明。",
          "next": "固定槽位如何同时预测不同目标？",
          "notes": "原论文第7页 Figure 2，§3.2。架构图为本项目自绘，仅依据结构关系，未使用原图像素、照片或图形元素。中文说明概括该图图注及§3.2，配色为本项目自行设计。",
          "componentId": "architecture"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "object query 与并行解码",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "固定槽位，预测可变大小的集合",
          "desc": "展开示意槽位，查看类别与边界框或无目标输出。",
          "componentId": "queries"
        }
      ],
      "scenes": [
        {
          "id": "scene-3",
          "title": "固定槽位，预测可变大小的集合",
          "goal": "100 个 query 不等于 100 个真实目标",
          "summary": "100 个 query 不等于 100 个真实目标",
          "interaction": "点击槽位 A、B、C，展开其示意输出并查看对应框。",
          "next": "训练时怎样确定预测与真实目标的对应？",
          "notes": "原论文p.7 §3.2、p.14 §4.3及Fig.7、附录A.4。原论文实验使用100个query；不同query是可学习输出位置编码，每层并行解码。合影与A/B/C槽位映射均为教学合成示意，不是实测输出或固定槽位职责。其余槽位输出未展示，不用颜色暗示其为无目标。训练时未匹配到真实目标的槽位接受空类别监督。",
          "componentId": "queries",
          "moduleId": "3.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "匈牙利匹配",
      "modules": [
        {
          "kind": "module",
          "id": "matching",
          "title": "最小成本的一对一对应",
          "desc": "改变合成位置，比较全部合法排列。",
          "componentId": "matching"
        }
      ],
      "scenes": [
        {
          "id": "scene-4",
          "title": "匈牙利匹配：全局最优的一对一指派",
          "goal": "真实目标只能分配给一个预测；预测也不能重复领取目标。",
          "summary": "真实目标只能分配给一个预测；预测也不能重复领取目标。",
          "interaction": "移动预测B并切换独立最近与全局一对一，观察成本矩阵、冲突和未匹配槽位。",
          "next": "继续查看下一页的机制或证据。",
          "notes": "原论文p.5 §3.1式(1)。三个真实目标和四个预测是教学合成示例，所有坐标及成本均非实测。穷举全部合法单射得到与匈牙利优化目标一致的小例最优分配，并非匈牙利算法实现。仅比较加权L1横向距离，类别与尺寸固定，省略GIoU，不代表完整DETR匹配成本。未匹配预测接受空类别分类监督。",
          "componentId": "matching",
          "moduleId": "matching"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "集合预测损失",
      "modules": [
        {
          "kind": "module",
          "id": "objective",
          "title": "分类与定位的监督分工",
          "desc": "观察目标类型或框位置对损失的作用。",
          "componentId": "objective"
        },
        {
          "kind": "module",
          "id": "boxloss",
          "title": "L1 与 GIoU",
          "desc": "观察目标类型或框位置对损失的作用。",
          "componentId": "boxloss"
        }
      ],
      "scenes": [
        {
          "id": "scene-5a",
          "title": "集合损失：分类 + L1 + GIoU",
          "goal": "先匹配，再监督；空类别仍然学习分类。",
          "summary": "先匹配，再监督；空类别仍然学习分类。",
          "interaction": "操作页面中的控制，观察对应图形与计算同步变化。",
          "next": "继续查看下一页的机制或证据。",
          "notes": "原论文pp.5–8 §3.1式(2)、§3.2辅助损失。显示式(2)未加入类别权重的原始形式，实际空类别下分类项乘0.1。匹配使用负概率，训练使用负对数。",
          "componentId": "objective",
          "moduleId": "objective"
        },
        {
          "id": "scene-5b",
          "title": "框损失：位置距离与几何重叠",
          "goal": "移动预测框，观察 L1、IoU、GIoU 和加权损失。",
          "summary": "移动预测框，观察 L1、IoU、GIoU 和加权损失。",
          "interaction": "操作页面中的控制，观察对应图形与计算同步变化。",
          "next": "继续查看下一页的机制或证据。",
          "notes": "原论文p.6 §3.1，附录A.2式(9–10)，A.4权重5与2。教学合成几何数据，不是论文实验。框定义为归一化中心与宽高；这里只改变横向位置，左边界位移等于中心位移。单个匹配框的损失尚未按batch目标数归一化。",
          "componentId": "boxloss",
          "moduleId": "boxloss"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "实验结果",
      "modules": [],
      "scenes": [
        {
          "id": "scene-6a",
          "title": "COCO 对比：相同总体 AP，不同尺度表现",
          "goal": "按目标尺度比较 DETR 与增强 Faster R-CNN 基线。",
          "summary": "DETR 与 Faster R-CNN-FPN+ 总体 AP 均为 42.0；小目标较弱，大目标较强。",
          "interaction": "选择总体、小目标或大目标 AP，查看原论文报告值。",
          "next": "拆开损失项，观察它们的贡献。",
          "notes": "原论文 p.9 Table 1、p.10 §4.1。COCO2017 val，ResNet-50，最终epoch bbox AP，越高越好。DETR AP/APS/APL=42.0/20.5/61.1；增强Faster R-CNN-FPN+=42.0/26.6/53.4。DETR训练500epochs，增强基线109epochs，非同等训练预算。选择器只切换报告指标，不模拟训练。",
          "componentId": "results-comparison"
        },
        {
          "id": "scene-6b",
          "title": "损失消融：分类、L1 与 GIoU",
          "goal": "理解为何集合预测同时需要分类与框监督。",
          "summary": "分类+L1 为35.8 AP；分类+GIoU 为39.9 AP；三项联合为40.6 AP。",
          "interaction": "阅读同一消融协议下的三组原论文数据。",
          "next": "将性能收益与训练、尺度局限一起考虑。",
          "notes": "原论文 p.13 Table4、p.8 Dataset、p.9训练协议。COCO2017val bbox AP，越高越好。300epoch消融，最后10epoch验证结果中位数；分类项必需。此处不是Table1的500epoch协议。论文仅研究固定权重的简单移除，不能推断其他加权方式必然更差。",
          "componentId": "loss-ablation"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "局限性",
      "modules": [],
      "scenes": [
        {
          "id": "scene-7",
          "title": "局限性：收敛慢，小目标弱",
          "goal": "把端到端设计的简洁性与实际训练成本分开判断。",
          "summary": "原论文要求较长训练；小目标AP弱于增强Faster R-CNN基线。",
          "interaction": "对照训练长度与小目标AP证据。",
          "next": "初版导读结束，等待人工核验。",
          "notes": "原论文p.2引言、p.8–10 §4及Table1、p.17结论。DETR长schedule500epochs，400epoch降学习率；Faster R-CNN+109epochs。训练epoch不能直接当作等比例墙钟耗时。R50小目标AP20.5 vs26.6。DC5分辨率增加改善小目标但增加计算；无后续论文内容。",
          "componentId": "limitations"
        }
      ]
    }
  ]
};

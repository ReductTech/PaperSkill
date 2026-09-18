import type { TutorialData } from '../types';
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "LabVLA: Grounding Vision-Language-Action Models in Scientific Laboratories",
    "titleZh": "",
    "venue": "",
    "authors": "Baochang Ren 等",
    "affiliation": "浙江大学 · 上海人工智能实验室等",
    "domain": "实验室具身智能",
    "coreProblem": "实验室数据、机器人形态与模型设计共同制约从书面流程到物理操作的转化。",
    "coreInsight": "让机器人完成实验，既要有<b>合适的数据</b>，也要适应<b>不同的机器人</b>，还要学会<b>怎样行动</b>。RoboGenesis 负责生成经过检查的实验室示范，LabVLA 再用这些示范和通用数据，把看懂指令接到连续操作。",
    "keywords": []
  },
  "hero": {
    "oldMethod": {
      "desc": "通用数据缺少实验器具、物理状态变化与流程监督，真实采集又受到仪器、标定、专业监督和安全成本约束；不同机器人的相机、末端与动作空间也难以直接共用控制。",
      "componentId": "hero-problem"
    },
    "newMethod": {
      "desc": "RoboGenesis 构建可执行环境、生成并验证工作流、导出带结构标注的 LabEmbodied-Data；LabVLA 再结合通用先验，通过 FAST 预训练与知识隔离下的流匹配后训练学习实验室动作。",
      "componentId": "hero-solution"
    }
  },
  "chapters": [
    {
      "title": "研究问题：实验计划，怎样变成机器人操作？",
      "badge": "inf",
      "badgeLabel": "背景与瓶颈",
      "bridge": "AI 已经能帮助读文献、提假设和安排实验，但拿起器皿、转移试剂和操作仪器，仍主要靠人完成。要跨过这一步，模型能力、实验室数据和机器人本身的差异都需要考虑。",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "数据、机器人形态与控制学习，缺一不可",
          "desc": "切换三个问题，观察同一实验流程为何不能直接由通用数据和单一机器人控制方案解决。",
          "componentId": "problems"
        }
      ],
      "insight": "<b>方法的出发点：</b>先补齐实验室示范，并让同一流程能适配不同机器人，再让模型从这些示范中学习操作。",
      "takeaways": [
        {
          "icon": "①",
          "title": "领域数据",
          "desc": "通用操作语料很少覆盖实验仪器、透明液体和实验流程。"
        },
        {
          "icon": "②",
          "title": "机器人形态",
          "desc": "相机、末端执行器、工作空间与动作维度存在差异。"
        },
        {
          "icon": "③",
          "title": "整体方法",
          "desc": "RoboGenesis 补充结构化示范，LabVLA 学习实验室动作策略。"
        }
      ],
      "kind": "chapter",
      "id": "chap-1"
    },
    {
      "title": "RoboGenesis：从可执行环境到结构化示范",
      "badge": "inf",
      "badgeLabel": "数据引擎",
      "bridge": "RoboGenesis 先搭建可以操作的实验场景，再把任务拆成有顺序的步骤，最后记录成功完成的示范。记录的不只有“机器人怎么动”，还有“正在做哪一步、操作哪个对象”。",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "环境验证：可达性与碰撞约束",
          "desc": "拖动烧杯，或使用方向按钮，检查器具摆放是否适合机械臂执行。这里展示场景验证的两个条件。",
          "componentId": "placement"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "RoboGenesis 的三个相连环节",
          "desc": "选择一个环节，查看资产如何组成场景、指令如何变成可执行步骤，以及标注如何跟随动作更新。每段动画都可以暂停或拖动进度。",
          "componentId": "genesis"
        }
      ],
      "takeaways": [
        {
          "icon": "①",
          "title": "环境构建",
          "desc": "实验资产组成场景，布局与物理检查先于数据采集。"
        },
        {
          "icon": "②",
          "title": "工作流生成",
          "desc": "原子技能组成有序流程，候选流程需要验证和人工审阅。"
        },
        {
          "icon": "③",
          "title": "数据导出",
          "desc": "观察、指令、状态、动作与流程标注共同构成监督。"
        }
      ],
      "kind": "chapter",
      "id": "chap-2"
    },
    {
      "title": "LabVLA：先认识动作，再学习连续操作",
      "badge": "trn",
      "badgeLabel": "策略 · 预训练",
      "bridge": "LabVLA 分两步学习：先用 FAST 让视觉语言模型认识动作的表达，再加入 DiT 动作专家学习连续操作。第二步还用知识隔离，让动作学习尽量不干扰已经学到的视觉语言理解。",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "整体训练关系：两阶段连接数据与策略",
          "desc": "先看两阶段的关系图，再播放对应动画：预训练学习动作编码，后训练加入连续动作专家。知识隔离在后训练时限制动作反馈的影响范围。",
          "componentId": "recipe"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "FAST：让模型认识动作的表达",
          "desc": "动作 token 是连续动作压缩后的一串离散编码。点击下一步，看看动作示范怎样变成模型可以学习的表达。",
          "componentId": "fast"
        }
      ],
      "takeaways": [
        {
          "icon": "①",
          "title": "前置语义对齐",
          "desc": "先让视觉语言骨干接触动作监督，再接入连续动作专家。"
        },
        {
          "icon": "②",
          "title": "训练数据分工",
          "desc": "通用数据提供基础先验，实验室数据补充流程与器具监督。"
        },
        {
          "icon": "③",
          "title": "阶段关系",
          "desc": "FAST、流匹配与知识隔离共同组成训练配方，不是三个独立模型。"
        }
      ],
      "kind": "chapter",
      "id": "chap-3"
    },
    {
      "title": "LabVLA：怎样生成动作，又不干扰理解？",
      "badge": "both",
      "badgeLabel": "策略 · 后训练与推理",
      "bridge": "动作专家先读取画面、指令和机器人状态，再逐步生成一段动作。流匹配帮助它学习怎样更新动作；知识隔离则规定：哪些学习信号可以更新动作专家，哪些可以更新视觉语言模型。",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "Flow Matching：更新的是动作表示",
          "desc": "训练用已知示范教模型预测更新方向；推理没有示范答案，模型需要从随机起点逐次生成动作。切换模式查看两种不同过程，或暂停在某一步观察。",
          "componentId": "flow"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "Knowledge Insulation：动作学习与理解各有分工",
          "desc": "VLM 负责视觉语言理解，DiT 负责生成动作，投影层连接两者。切换三条信息路径，看看理解怎样支持动作、学习反馈又传到哪里。",
          "componentId": "insulation"
        }
      ],
      "takeaways": [
        {
          "icon": "①",
          "title": "连续动作",
          "desc": "推理从噪声动作出发，经过多次更新生成待执行片段。"
        },
        {
          "icon": "②",
          "title": "知识隔离",
          "desc": "动作损失更新投影层和 DiT，token 监督仍可更新 VLM。"
        },
        {
          "icon": "③",
          "title": "执行边界",
          "desc": "动作生成与物理执行是不同环节，生成时当前观测保持固定。"
        }
      ],
      "kind": "chapter",
      "id": "chap-4"
    },
    {
      "title": "讨论：四层能力定位",
      "badge": "both",
      "badgeLabel": "定位与边界",
      "bridge": "“能按步骤完成实验”和“能自己判断怎样做实验”不是同一种能力。论文用四种实验室角色说明这条边界，把 LabVLA 放在能够执行固定多步流程的“技术员”层级。",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "从学徒到科学家：能力要求逐层增加",
          "desc": "选择一个角色，查看其典型操作。专家需要精密仪器与测量记录，科学家还要根据测量改变流程；这两层展示的是能力要求。",
          "componentId": "positioning"
        }
      ],
      "takeaways": [],
      "kind": "chapter",
      "id": "chap-5"
    },
    {
      "title": "研究局限",
      "badge": "both",
      "badgeLabel": "定位与边界",
      "bridge": "",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "Limitations：距离真实实验室仍有三类缺口",
          "desc": "切换论文提出的三类局限，观察受控验证、固定流程和协作能力各自留下的边界。",
          "componentId": "limitations"
        }
      ],
      "insight": "<b>研究方向：</b>在人的监督下辅助实验流程执行，同时保留人对假设、安全与结果解释的判断。连接流程、数据和动作学习，是走向这一方向的基础。",
      "takeaways": [
        {
          "icon": "①",
          "title": "验证范围",
          "desc": "主要在仿真中验证，真机研究限于单一 Franka 平台的四项台面任务。"
        },
        {
          "icon": "②",
          "title": "自主性边界",
          "desc": "尚不能自主选择条件、据测量修改流程、替换试剂或判断科学目标。"
        },
        {
          "icon": "③",
          "title": "协作与解释",
          "desc": "自然协作、中间观察沟通和失败识别解释仍未得到展示。"
        }
      ],
      "kind": "chapter",
      "id": "chap-6"
    }
  ]
};

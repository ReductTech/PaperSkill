import type {TutorialData} from '../types';
export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "ByteTrack: Multi-Object Tracking by Associating Every Detection Box",
    "titleZh": "ByteTrack：从检测框到连续轨迹",
    "venue": "ECCV 2022",
    "authors": "Yifu Zhang、Peize Sun、Yi Jiang 等",
    "affiliation": "华中科技大学 · 香港大学 · 字节跳动",
    "domain": "多目标跟踪 · 行人遮挡",
    "coreProblem": "行人走过公交站，检测分数降低。已有身份能否接着跟下去？",
    "coreInsight": "先用高分框关联，再让未匹配的活跃轨迹尝试接续低分框。",
    "keywords": [
      "多目标跟踪",
      "两阶段关联",
      "IoU",
      "轨迹管理"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "只用高分框",
      "desc": "遮挡时低分观测被过滤",
      "componentId": "bt-cover"
    },
    "newMethod": {
      "title": "ByteTrack 两阶段关联",
      "desc": "在预测位置附近找回低分观测",
      "componentId": "bt-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "从检测到跟踪",
      "modules": [
        {
          "kind": "module",
          "id": "detections-module",
          "title": "低分检测框从哪里来",
          "desc": "切换帧和高分阈值，观察框池如何变化。",
          "componentId": "bt-detections"
        },
        {
          "kind": "module",
          "id": "motion-module",
          "title": "运动预测与 IoU",
          "desc": "拖动预测位置，观察交并比与匹配门槛。",
          "componentId": "bt-motion"
        },
        {
          "kind": "module",
          "id": "pipeline-module",
          "title": "拆开一帧的五步流程",
          "desc": "切换帧与处理步骤，对照框池、预测和状态更新。",
          "componentId": "bt-pipeline"
        }
      ],
      "scenes": [
        {
          "id": "detections",
          "title": "低分检测框从哪里来",
          "goal": "遮挡行人和背景误检，为什么可能同在低分池？",
          "summary": "切换帧和高分阈值，观察框池如何变化。",
          "interaction": "切换帧和高分阈值，观察框池如何变化。",
          "next": "从检测器输出到轨迹状态，依次发生了什么？",
          "notes": "论文图 2。A、B、C 及分数均为教学构造，C 是背景误检。演示将高分边界归入高分池。",
          "componentId": "bt-detections",
          "moduleId": "detections-module"
        },
        {
          "id": "pipeline",
          "title": "拆开一帧的五步流程",
          "goal": "从检测器输出到轨迹状态，依次发生了什么？",
          "summary": "切换帧与处理步骤，对照框池、预测和状态更新。",
          "interaction": "切换帧与处理步骤，对照框池、预测和状态更新。",
          "next": "如何用上一段轨迹的位置预测检验一个检测框？",
          "notes": "对应论文算法 1。示意中的运动模型使用匀速外推，预测框高亮 ID 1。实际方法还处理未确认轨迹和独立的建轨条件。",
          "componentId": "bt-pipeline",
          "moduleId": "pipeline-module"
        },
        {
          "id": "motion",
          "title": "运动预测与 IoU",
          "goal": "如何用上一段轨迹的位置预测检验一个检测框？",
          "summary": "拖动预测位置，观察交并比与匹配门槛。",
          "interaction": "拖动预测位置，观察交并比与匹配门槛。",
          "next": "低分框在什么条件下可以参与关联？",
          "notes": "论文第 3 节。原方法使用 Kalman Filter。本页用可调偏移说明 IoU，序列实验用匀速外推；0.35 是教学门槛。",
          "componentId": "bt-motion",
          "moduleId": "motion-module"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "两阶段关联",
      "modules": [
        {
          "kind": "module",
          "id": "matching-module",
          "title": "两轮关联与候选约束",
          "desc": "切换两轮、选择候选框、调整 IoU 门槛。",
          "componentId": "bt-matching"
        },
        {
          "kind": "module",
          "id": "timeline-module",
          "title": "同一组检测框的逐帧对照",
          "desc": "播放或定位任一帧，同步查看两套输出。",
          "componentId": "bt-timeline"
        },
        {
          "kind": "module",
          "id": "buffer-module",
          "title": "丢失缓存与高分重关联",
          "desc": "调整缓存并切到第 7 帧，看原 ID 是否恢复。",
          "componentId": "bt-buffer"
        },
        {
          "kind": "module",
          "id": "failure-module",
          "title": "低分关联的失败条件",
          "desc": "移除 A 真框并移动 C 误检，观察 ID 1。",
          "componentId": "bt-failure"
        },
        {
          "kind": "module",
          "id": "assignment-module",
          "title": "IoU 矩阵与一对一分配",
          "desc": "移动检测框 B，切换逐对贪心和整体分配。",
          "componentId": "bt-assignment"
        },
        {
          "kind": "module",
          "id": "lifecycle-module",
          "title": "追踪同一个 ID 的生命周期",
          "desc": "切换缓存与帧号，看 ID 1 的状态卡片和预测框。",
          "componentId": "bt-lifecycle"
        }
      ],
      "scenes": [
        {
          "id": "matching",
          "title": "两轮关联与候选约束",
          "goal": "低分框在什么条件下可以参与关联？",
          "summary": "切换两轮、选择候选框、调整 IoU 门槛。",
          "interaction": "切换两轮、选择候选框、调整 IoU 门槛。",
          "next": "两个轨迹都想要同一个框时，怎样分配？",
          "notes": "论文算法 1。高分关联先执行；第二轮仅匹配第一轮剩余的活跃轨迹。教学分配用枚举最大化总 IoU，原系统采用线性分配，且部分设置融合检测分数。",
          "componentId": "bt-matching",
          "moduleId": "matching-module"
        },
        {
          "id": "assignment",
          "title": "IoU 矩阵与一对一分配",
          "goal": "两个轨迹都想要同一个框时，怎样分配？",
          "summary": "移动检测框 B，切换逐对贪心和整体分配。",
          "interaction": "移动检测框 B，切换逐对贪心和整体分配。",
          "next": "关联策略会怎样改变遮挡期间的观测历史？",
          "notes": "论文第 3 节使用线性分配。本页枚举小矩阵，采用 0.30 的教学门槛与最大总 IoU 目标。",
          "componentId": "bt-assignment",
          "moduleId": "assignment-module"
        },
        {
          "id": "timeline",
          "title": "同一组检测框的逐帧对照",
          "goal": "关联策略会怎样改变遮挡期间的观测历史？",
          "summary": "播放或定位任一帧，同步查看两套输出。",
          "interaction": "播放或定位任一帧，同步查看两套输出。",
          "next": "连续漏检后，原来的 ID 还能找回来吗？",
          "notes": "论文图 2 的问题设置。本页只切换低分关联，检测输入与教学运动模型相同，脚印表示当前帧有位置观测。",
          "componentId": "bt-timeline",
          "moduleId": "timeline-module"
        },
        {
          "id": "buffer",
          "title": "丢失缓存与高分重关联",
          "goal": "连续漏检后，原来的 ID 还能找回来吗？",
          "summary": "调整缓存并切到第 7 帧，看原 ID 是否恢复。",
          "interaction": "调整缓存并切到第 7 帧，看原 ID 是否恢复。",
          "next": "失配、暂存、找回和移除怎样区分？",
          "notes": "论文第 3 节与官方实现的 tracked/lost/removed 状态。缓存长度为教学参数，实际代码按帧率换算。低分框不启动新轨迹。本页简化新轨迹确认步骤。",
          "componentId": "bt-buffer",
          "moduleId": "buffer-module"
        },
        {
          "id": "lifecycle",
          "title": "追踪同一个 ID 的生命周期",
          "goal": "失配、暂存、找回和移除怎样区分？",
          "summary": "切换缓存与帧号，看 ID 1 的状态卡片和预测框。",
          "interaction": "切换缓存与帧号，看 ID 1 的状态卡片和预测框。",
          "next": "如果真实检测消失，而误检又靠近预测位置会怎样？",
          "notes": "论文算法 1 及官方实现。页面折叠了未确认的新轨迹步骤。找回发生在高分关联，第二轮低分关联只使用剩余活跃轨迹。",
          "componentId": "bt-lifecycle",
          "moduleId": "lifecycle-module"
        },
        {
          "id": "failure",
          "title": "低分关联的失败条件",
          "goal": "如果真实检测消失，而误检又靠近预测位置会怎样？",
          "summary": "移除 A 真框并移动 C 误检，观察 ID 1。",
          "interaction": "移除 A 真框并移动 C 误检，观察 ID 1。",
          "next": "检测误差和身份一致性分别该看什么指标？",
          "notes": "该反例是教学实验。关联只使用位置线索时可能错配，不能把低分匹配视为身份正确的保证。",
          "componentId": "bt-failure",
          "moduleId": "failure-module"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "结果与下一步",
      "modules": [
        {
          "kind": "module",
          "id": "evidence-module",
          "title": "MOT17 上的跟踪结果",
          "desc": "切换 MOTA、IDF1、HOTA，查看含义和协议。",
          "componentId": "bt-evidence"
        },
        {
          "kind": "module",
          "id": "handoff-module",
          "title": "从跟踪历史到轨迹预测",
          "desc": "切换关联策略与截止帧，对比同一 ID 的历史。",
          "componentId": "bt-handoff"
        },
        {
          "kind": "module",
          "id": "ablation-module",
          "title": "第二轮相似度的消融实验",
          "desc": "固定第一轮 IoU，比较第二轮 Re-ID 与 IoU。",
          "componentId": "bt-ablation"
        },
        {
          "kind": "module",
          "id": "threshold-module",
          "title": "高分阈值怎样改变遮挡期结果",
          "desc": "调整共同阈值，比较正确接续和误检输出帧。",
          "componentId": "bt-threshold"
        }
      ],
      "scenes": [
        {
          "id": "evidence",
          "title": "MOT17 上的跟踪结果",
          "goal": "检测误差和身份一致性分别该看什么指标？",
          "summary": "切换 MOTA、IDF1、HOTA，查看含义和协议。",
          "interaction": "切换 MOTA、IDF1、HOTA，查看含义和协议。",
          "next": "只换第二轮相似度，结果会怎样？",
          "notes": "原论文表 4，MOT17 test、私有检测器协议，完整 ByteTrack 系统 80.3 MOTA、77.3 IDF1、63.1 HOTA。算法贡献参见第 4.2 节消融。",
          "componentId": "bt-evidence",
          "moduleId": "evidence-module"
        },
        {
          "id": "ablation",
          "title": "第二轮相似度的消融实验",
          "goal": "只换第二轮相似度，结果会怎样？",
          "summary": "固定第一轮 IoU，比较第二轮 Re-ID 与 IoU。",
          "interaction": "固定第一轮 IoU，比较第二轮 Re-ID 与 IoU。",
          "next": "阈值降得很低时，新增的观测里有哪些误检？",
          "notes": "论文表 1 的前两行。MOT17 和 BDD100K 分别在各自验证集上比较。",
          "componentId": "bt-ablation",
          "moduleId": "ablation-module"
        },
        {
          "id": "threshold",
          "title": "高分阈值怎样改变遮挡期结果",
          "goal": "阈值降得很低时，新增的观测里有哪些误检？",
          "summary": "调整共同阈值，比较正确接续和误检输出帧。",
          "interaction": "调整共同阈值，比较正确接续和误检输出帧。",
          "next": "跟踪中留下的观测缺口会交给下游什么输入？",
          "notes": "本页为教学模拟，统计第 3–6 帧。论文图 3 则在 MOT17 验证集对比 BYTE 与 SORT 的 MOTA 和 IDF1。",
          "componentId": "bt-threshold",
          "moduleId": "threshold-module"
        },
        {
          "id": "handoff",
          "title": "从跟踪历史到轨迹预测",
          "goal": "跟踪中留下的观测缺口会交给下游什么输入？",
          "summary": "切换关联策略与截止帧，对比同一 ID 的历史。",
          "interaction": "切换关联策略与截止帧，对比同一 ID 的历史。",
          "next": "固定预测器，检验历史缺口对未来预测的影响。",
          "notes": "此页延伸到专题下一阶段。坐标来自教学框中心的水平位置，未运行预测器，也不等价于真实数据集的世界坐标。",
          "componentId": "bt-handoff",
          "moduleId": "handoff-module"
        }
      ]
    }
  ]
};

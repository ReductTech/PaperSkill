import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "RABBIT: A Robot-Assisted Bed Bathing System with Multimodal Perception and Integrated Compliance",
    "titleZh": "RABBIT：多模态感知与双重柔顺的床边擦浴机器人",
    "venue": "HRI 2024 · Cornell University",
    "authors": "Rishabh Madan, Skyler Valdez, David Kim, Sujie Fang, Luoyan Zhong, Diego T. Virtue, Tapomayukh Bhattacharjee",
    "affiliation": "康奈尔大学",
    "domain": "辅助机器人 · 物理人机交互",
    "coreProblem": "机器人如何识别干、湿、肥皂区域，并完成舒适的洗涤、冲洗与拍干？",
    "coreInsight": "把多模态分割、护理动作原语和软硬件柔顺结合，按皮肤状态执行前臂护理。",
    "keywords": [
      "RGB-T",
      "CMX-SRA",
      "动作原语",
      "双重柔顺",
      "Scrubby"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "仅凭RGB的视觉线索",
      "desc": "透明薄水膜难以仅靠颜色辨别。",
      "componentId": "rabbit-cover-old"
    },
    "newMethod": {
      "title": "RABBIT的多模态与柔顺接触",
      "desc": "结合热特征定位目标，用柔顺工具适应轮廓。",
      "componentId": "rabbit-cover-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "皮肤状态与护理任务",
      "modules": [
        {
          "kind": "module",
          "id": "task",
          "title": "任务区域由皮肤状态决定",
          "desc": "识别当前任务应覆盖哪一种区域。",
          "componentId": "rabbit-task"
        }
      ],
      "scenes": [
        {
          "id": "task",
          "title": "任务区域由皮肤状态决定",
          "goal": "识别当前任务应覆盖哪一种区域。",
          "summary": "三种任务需要不同目标区域。",
          "interaction": "选择洗涤、冲洗或拍干，观察掩膜与动作。",
          "next": "热成像补足薄水膜的视觉线索",
          "notes": "PDF page 3–4, §3–3.1; page 6, §3.2\n洗涤选择干皮肤区域；冲洗选择肥皂区域；拍干选择水区域。背景不处理。\n适用条件：前臂实验；任务由当前阶段决定，不是任意污渍自动分类\n协议：不适用\n交互规则：task=0，范围0/1/2；目标掩膜分别为干皮肤/肥皂/水，选择后动画工具移入对应区域。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-task",
          "moduleId": "task"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "多模态感知与训练",
      "modules": [
        {
          "kind": "module",
          "id": "thermal",
          "title": "热成像补足薄水膜的视觉线索",
          "desc": "理解互补信息及温差边界。",
          "componentId": "rabbit-thermal"
        },
        {
          "kind": "module",
          "id": "fusion",
          "title": "CMX校正并融合两种模态特征",
          "desc": "看懂融合发生在特征层。",
          "componentId": "rabbit-fusion"
        },
        {
          "kind": "module",
          "id": "sra",
          "title": "SRA先学习粗结构，再适应细节",
          "desc": "区分训练顺序与推理结构。",
          "componentId": "rabbit-sra"
        }
      ],
      "scenes": [
        {
          "id": "thermal",
          "title": "热成像补足薄水膜的视觉线索",
          "goal": "理解互补信息及温差边界。",
          "summary": "热对比弱时，仅凭热图无法可靠区分。",
          "interaction": "调节水与皮肤的温差。",
          "next": "CMX校正并融合两种模态特征",
          "notes": "PDF page 3, §2.2; page 5, Table 1\nRGB有助识别肥皂，热图补充薄水膜的温差信息；不能保证所有类别都提升。\n适用条件：依赖水和皮肤可辨的热特征；热平衡是教学边界推断\n协议：SBP test；IoU %，越高越好\n交互规则：delta=12，范围0–16；热图温差改变，理想化分割仅在delta≥3时可辨；阈值为教学设定。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-thermal",
          "moduleId": "thermal"
        },
        {
          "id": "fusion",
          "title": "CMX校正并融合两种模态特征",
          "goal": "看懂融合发生在特征层。",
          "summary": "融合需要可靠的互补信息，不能盲目叠加。",
          "interaction": "调节一个水区域的热特征可靠度。",
          "next": "SBP用增强假人扩展护理数据",
          "notes": "PDF page 5, §3.1\n跨模态特征校正模块与特征融合模块校正、整合RGB和热输入。\n适用条件：沿用CMX；不把演示加权均值当成CMX实现\n协议：不适用\n交互规则：confidence=0.8，范围0–1；RGB示意分数0.3，热分数0.9，融合=0.3×(1-c)+0.9×c；显示局部特征与0.6演示判定。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-fusion",
          "moduleId": "fusion"
        },
        {
          "id": "dataset",
          "title": "SBP用增强假人扩展护理数据",
          "goal": "区分物理采集与纯计算机合成。",
          "summary": "增强假人的热与视觉特征仍有域差异。",
          "interaction": "阅读按相机分组的数据构成和采集条件。",
          "next": "SRA先学习粗结构，再适应细节",
          "notes": "PDF page 4–5, §3.1; Figures 3–4\n共1389对图像；六种假人肤色、毛发、覆盖状态、视角；未报告按受试者独立划分，不能断言跨人泛化。\n适用条件：增强护理假人及4名真人；包含不真实局部热伪影\n协议：低分辨率392假人+397真人；高分辨率360假人+240真人；8:1:1划分\n交互规则：静态堆叠条形：低分辨率789对，高分辨率600对；共1389。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-dataset"
        },
        {
          "id": "sra",
          "title": "SRA先学习粗结构，再适应细节",
          "goal": "区分训练顺序与推理结构。",
          "summary": "先低分辨率训练，再高分辨率微调。",
          "interaction": "拖动热图训练分辨率，观察同一湿区域采样。",
          "next": "工具宽度约束掩膜内的路点覆盖",
          "notes": "PDF page 5, §3.1 SRA; Table 1\nCMX-SRA先低分辨率热数据训练再高分辨率微调；并非推理时同时运行两个热相机。\n适用条件：ImageNet初始化后训练；低分辨率训练，再高分辨率微调\n协议：24×32 MLX90640；256×192 P2Pro\n交互规则：resolution=0，范围0/1；8×4与32×16为示意抽样网格，真实相机24×32、256×192；数据先后顺序不换。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-sra",
          "moduleId": "sra"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "护理动作与轨迹",
      "modules": [
        {
          "kind": "module",
          "id": "waypoints",
          "title": "工具宽度约束掩膜内的路点覆盖",
          "desc": "理解掩膜到路点再到3D轨迹。",
          "componentId": "rabbit-waypoints"
        },
        {
          "kind": "module",
          "id": "motion",
          "title": "护理动作原语同时规定位姿与力",
          "desc": "比较连续擦、单向擦和抬起拍干。",
          "componentId": "rabbit-motion"
        }
      ],
      "scenes": [
        {
          "id": "waypoints",
          "title": "工具宽度约束掩膜内的路点覆盖",
          "goal": "理解掩膜到路点再到3D轨迹。",
          "summary": "更窄的工具需要更多覆盖条带。",
          "interaction": "调整擦拭工具宽度，观察需要的条带数。",
          "next": "护理动作原语同时规定位姿与力",
          "notes": "PDF page 5–6, §3.2; Equation 1\n掩膜边界和工具尺寸决定2D路点；深度映射到3D，再构成位姿—力轨迹。\n适用条件：期望位姿6自由度，期望力3自由度；不展示未经给出的临床力阈值\n协议：不适用\n交互规则：width=60，范围40–100；目标宽240，条带数ceil(240/width)；演示平面边界和无重叠假设。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-waypoints",
          "moduleId": "waypoints"
        },
        {
          "id": "motion",
          "title": "护理动作原语同时规定位姿与力",
          "goal": "比较连续擦、单向擦和抬起拍干。",
          "summary": "拍干时，路点间抬起而不是拖擦。",
          "interaction": "选择任务并拖动轨迹进度。",
          "next": "接触后切换为法向力优先",
          "notes": "PDF page 6, §3.2; Figure 2\n洗涤连续上下擦拭；冲洗沿同一方向长擦并重复两次；拍干在路点之间抬起工具。\n适用条件：护理专家建议和OT验证；教学轨迹不等于机器人执行日志\n协议：不适用\n交互规则：mode=0，范围0/1/2；progress=0.35，范围0–1；wash蛇形，rinse两遍单向长擦，dry抬升—平移—落下。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-motion",
          "moduleId": "motion"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "软件柔顺控制",
      "modules": [
        {
          "kind": "module",
          "id": "controller",
          "title": "接触后切换为法向力优先",
          "desc": "理解接近、接触、稳定三个状态。",
          "componentId": "rabbit-controller"
        }
      ],
      "scenes": [
        {
          "id": "controller",
          "title": "接触后切换为法向力优先",
          "goal": "理解接近、接触、稳定三个状态。",
          "summary": "接触后继续追位置会压入；法向力反馈调整目标。",
          "interaction": "降低工具目标高度，对比刚性追踪与柔顺接触。",
          "next": "Scrubby靠四角弹簧贴合前臂轮廓",
          "notes": "PDF page 6, §3.3; Equations 2–3\nPID位姿与PD力误差反馈；洗涤、冲洗较高刚度，拍干降低刚度；不是实时视觉闭环。\n适用条件：任务空间控制加摩擦与重力补偿；接触后z向力优先；DIGIT经ATI标定\n协议：低层1kHz，轨迹约70Hz；分割含预处理约3秒\n交互规则：depth=0，范围0–60；compliant=true；接触面y=240，工具y=180+depth；刚性压入随深度增长，柔顺限在表面并示意力反馈。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-controller",
          "moduleId": "controller"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "Scrubby硬件柔顺",
      "modules": [
        {
          "kind": "module",
          "id": "scrubby",
          "title": "Scrubby靠四角弹簧贴合前臂轮廓",
          "desc": "区分软件反馈与被动机械适应。",
          "componentId": "rabbit-scrubby"
        }
      ],
      "scenes": [
        {
          "id": "scrubby",
          "title": "Scrubby靠四角弹簧贴合前臂轮廓",
          "goal": "区分软件反馈与被动机械适应。",
          "summary": "倾斜与压缩吸收剩余接触误差。",
          "interaction": "改变局部表面倾角。",
          "next": "CMX-SRA在SBP分割测试中领先",
          "notes": "PDF page 6, §3.3; Figure 2\n底板可压缩、倾斜，补偿噪声力反馈下的剩余接触不适应。\n适用条件：四根低刚度弹簧、软海绵、编织钢丝限制剪切；模型未提供弹簧刚度值\n协议：不适用\n交互规则：angle=0，范围-12–12；刚性顶板不转，底板随角度倾斜，四角投影弹簧长随之变化；无真实N或刚度数值。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-scrubby",
          "moduleId": "scrubby"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "分割和用户研究证据",
      "modules": [
        {
          "kind": "module",
          "id": "benchmark",
          "title": "CMX-SRA在SBP分割测试中领先",
          "desc": "比较相同划分中的mIoU与水类IoU。",
          "componentId": "rabbit-benchmark"
        }
      ],
      "scenes": [
        {
          "id": "benchmark",
          "title": "CMX-SRA在SBP分割测试中领先",
          "goal": "比较相同划分中的mIoU与水类IoU。",
          "summary": "mIoU较CMX增加5.97个百分点。",
          "interaction": "选择指标，核对固定实验数据。",
          "next": "高舒适度评分来自小规模前臂研究",
          "notes": "PDF page 5, Table 1\nCMX-SRA mIoU94.20%，相对CMX增加5.97个百分点；水类IoU增加10.88个百分点。\n适用条件：同一SBP的8:1:1划分；非临床效果比较\n协议：mIoU %: SegFormer86.86; RTFNet87.49; MFNet87.25; CMX88.23; CMX-SRA94.20。water %:75.16,77.84,77.56,78.55,89.43\n交互规则：metric=mean/water；使用Table1固定值，条形零起点0–100；不制造不确定性。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-benchmark",
          "moduleId": "benchmark"
        },
        {
          "id": "study",
          "title": "高舒适度评分来自小规模前臂研究",
          "goal": "区分主观评分、基准假设与临床证据。",
          "summary": "专家5分是假设，没有真实专家对照组。",
          "interaction": "阅读参与者、10次试验和完整序列评分。",
          "next": "开环计划难以跟随非自主运动",
          "notes": "PDF page 7–8, §4.1–4.2; Figures 7–8\n高主观评分是初步证据；专家5分只是解释基准假设，没有真实护理者对照组。\n适用条件：11名无行动障碍+1名MS参与者；仅前臂；每人9次单任务+1次完整序列\n协议：主观1–5分，越高越好；完整序列舒适度4.83±0.58，表现4.33±0.78；不将±解释为置信区间\n交互规则：静态12人图示，1人MS；4.83±0.58和4.33±0.78；1–5分尺度，不标置信区间。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-study"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "适用范围与研究边界",
      "modules": [
        {
          "kind": "module",
          "id": "limits",
          "title": "开环计划难以跟随非自主运动",
          "desc": "识别下一步研究所需反馈。",
          "componentId": "rabbit-limits"
        }
      ],
      "scenes": [
        {
          "id": "limits",
          "title": "开环计划难以跟随非自主运动",
          "goal": "识别下一步研究所需反馈。",
          "summary": "力反馈闭环不等于视觉运动规划闭环。",
          "interaction": "移动手臂偏移量，观察冻结计划与真实目标错位。",
          "next": "回看三项核心贡献及其证据边界。",
          "notes": "PDF page 8, §4.2–5\n拍干力一致性较低；残留肥皂/水、非自主运动、全身触达、细小敏感部位与在线偏好仍需研究。\n适用条件：初始力个性化而非在线偏好适应；当前开环规划\n协议：不适用\n交互规则：offset=0，范围-80–80；原计划固定，手臂移动；大于30显示红色几何错位，阈值仅教学设定。\n图形为教学示意，不运行真实CMX或机器人控制器。",
          "componentId": "rabbit-limits",
          "moduleId": "limits"
        }
      ]
    }
  ]
};

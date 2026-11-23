import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Rethinking Histology Slide Digitization Workflows for Low-Resource Settings",
    "titleZh": "面向低资源环境的组织学切片数字化工作流",
    "venue": "MICCAI 2024 · 交互式论文教程",
    "authors": "Talat Zehra, Joseph Marino, Wendy Wang, Grigoriy Frantsuzov, Saad Nadeem",
    "affiliation": "Jinnah Sindh Medical University · Memorial Sloan Kettering Cancer Center",
    "domain": "医学影像 · 计算病理 · 图像拼接与恢复",
    "coreProblem": "如何在有限预算下，把低成本显微镜拍摄的扫片视频变成可远程浏览的高质量全切片图像？",
    "coreInsight": "用低倍率、重叠视频降低采集门槛，再通过递归拼接与真实配对恢复逼近扫描级 WSI。",
    "keywords": [
      "全切片图像",
      "递归拼接",
      "pix2pix",
      "显微视频",
      "低资源医疗"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "商用高倍率扫描",
      "desc": "设备与运维成本高，基层机构难以持续负担。",
      "componentId": "hero-old-sequence"
    },
    "newMethod": {
      "title": "10× 视频与学习式恢复",
      "desc": "分行采集重叠画面，再拼接和恢复成 WSI。",
      "componentId": "hero-new-sequence"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 成本与细节的双重约束",
      "modules": [
        {
          "kind": "module",
          "id": "m01-cost",
          "title": "采集设备成本权衡",
          "desc": "选择自动扫描、商用离线拼接或本文低成本方案，比较硬件与部署负担。",
          "componentId": "ch1-cost"
        },
        {
          "kind": "module",
          "id": "m01-detail",
          "title": "10× 与 40× 的观察差异",
          "desc": "切换观察尺度，理解低倍率覆盖与高倍率细节为何必须同时考虑。",
          "componentId": "ch1-detail"
        }
      ],
      "scenes": [
        {
          "id": "ch1-cost",
          "title": "完整切片为何难以负担",
          "goal": "在三套采集方案之间切换，观察论文关注的硬件与部署负担。",
          "summary": "自动扫描器、商用拼接与低成本 10× 采集的成本结构不同。",
          "interaction": "点选自动多片扫描、商用离线拼接或本文方案，观察设备组合、预算层级与限制说明。",
          "next": "即使采得到切片，诊断细节仍必须足够清楚。",
          "notes": "来源：摘要与第 1 节。论文报告自动数字多片扫描器成本超过约 7 万美元，商用单切片离线拼接软件超过约 3500 美元，而且仍依赖高端显微镜、相机和工作站；本文使用约 200 美元的显微镜头。页面只比较论文给出的约束，不虚构图像质量分数。",
          "componentId": "ch1-cost",
          "moduleId": "m01-cost"
        },
        {
          "id": "ch1-detail",
          "title": "低倍率采集后，细节从哪里回来",
          "goal": "切换 10× 与 40× 示意视野，理解远程病理为何不能只看大结构。",
          "summary": "10× 保留空间上下文，40× 级细节用于观察更小的病理线索。",
          "interaction": "点选观察倍率，放大镜视野、细节可见性和远程共享反馈同步更新。",
          "next": "从采集协议开始，把许多 10× 画面变成一张 WSI。",
          "notes": "来源：第 3 节。论文指出较大的肉芽肿可在 10× 观察，较小的嗜苏木精性 LD 小体通常需要 40× 级细节，且数量少时容易漏诊。本页显微视野是观察尺度示意，不是实际诊断输出或准确率实验。",
          "componentId": "ch1-detail",
          "moduleId": "m01-detail"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 从 10× 视频到单片 WSI",
      "modules": [
        {
          "kind": "module",
          "id": "m02-acquire",
          "title": "扫片重叠与停顿协议",
          "desc": "调整重叠和停顿，观察画面连续性、覆盖缺口和采集风险。",
          "componentId": "ch2-acquire"
        },
        {
          "kind": "module",
          "id": "m02-keyframes",
          "title": "光流停顿帧与去重",
          "desc": "拖动视频时间，找出可拼接的稳定停顿帧并移除重复帧。",
          "componentId": "ch2-keyframes"
        },
        {
          "kind": "module",
          "id": "m02-stitch",
          "title": "递归批次拼接",
          "desc": "改变每批帧数，观察局部拼接层级与相对配对工作量。",
          "componentId": "ch2-stitch"
        }
      ],
      "scenes": [
        {
          "id": "ch2-acquire",
          "title": "让扫片像拍全景一样有重叠",
          "goal": "拖动重叠与停顿参数，判断哪些采集条件符合论文协议。",
          "summary": "行扫画面需要足够重叠和停顿，恢复模型不能替代缺失覆盖。",
          "interaction": "调整相邻重叠百分比和停顿秒数，观察帧间距、缺口、拼接有效性与反馈。",
          "next": "即使重叠足够，也只能从停顿稳定的瞬间开始拼接。",
          "notes": "来源：第 4.1 节与局限性。论文采集指南为至少 20–30% 重叠、停顿约一秒；局限性又指出当前最佳结果理想上需要超过 50% 重叠。页面把 20% 作为论文中可连接的采集条件，把 >50% 标为更理想设置，不声称它是统一硬阈值，也不声称模型可修补任意缺口。",
          "componentId": "ch2-acquire",
          "moduleId": "m02-acquire"
        },
        {
          "id": "ch2-keyframes",
          "title": "从扫片视频里挑出可以拼接的瞬间",
          "goal": "拖动时间轴，观察光流如何选中稳定停顿帧并丢弃重复画面。",
          "summary": "先保留低运动的新帧，再把去重后的停顿画面送入拼接。",
          "interaction": "拖动扫片时间，观察运动箭头、停顿帧边框、待拼接托盘和去重状态。",
          "next": "把筛选出的画面分批拼成更大的局部图。",
          "notes": "来源：第 4.1 节。论文以光流提取静态停顿帧，再进行去重。此处时间轴与重复判定是为教学构造的确定性示例，不提供论文未报告的光流阈值或帧数。",
          "componentId": "ch2-keyframes",
          "moduleId": "m02-keyframes"
        },
        {
          "id": "ch2-stitch",
          "title": "递归拼接怎样减少成对配准",
          "goal": "调整每批帧数，理解局部拼接层级和相对工作量为何变化。",
          "summary": "OpenStitching 把 30–50 帧递归合并为局部图，再逐步合成整片。",
          "interaction": "拖动每批帧数，观察拼接树层级、相对配对工作量和最终 WSI 状态。",
          "next": "拼接结果还只是低质量输入，需要和 40× 扫描参考配准。",
          "notes": "来源：第 4.1 节。论文报告递归拼接把耗时从数小时降至约 5–10 分钟，并使用每批 30–50 帧。本页显示的是 160 帧演示数据的相对工作量，不是论文实测时间；绿色区间只表示论文实现范围。",
          "componentId": "ch2-stitch",
          "moduleId": "m02-stitch"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 学习式恢复模型",
      "modules": [
        {
          "kind": "module",
          "id": "m03-register",
          "title": "配对数据与训练测试划分",
          "desc": "选择六个配准案例，观察训练、测试与无扫描对照的角色。",
          "componentId": "ch3-register"
        },
        {
          "kind": "module",
          "id": "m03-generator",
          "title": "生成器与 PatchGAN 配置",
          "desc": "选择放大、填充和判别器配置，观察边缘风险与论文采用组合。",
          "componentId": "ch3-generator"
        },
        {
          "kind": "module",
          "id": "m03-loss",
          "title": "三项监督共同塑形",
          "desc": "开关对抗、VGG 与 L1 约束，理解最终目标由多项共同组成。",
          "componentId": "ch3-loss"
        }
      ],
      "scenes": [
        {
          "id": "ch3-register",
          "title": "先让视频切片和高倍扫描对同一位置",
          "goal": "选择案例，确认哪些配对进入训练、哪些只用于测试。",
          "summary": "真实低质量视频与 40× 扫描参考经仿射配准构成监督对。",
          "interaction": "点选六个配对案例，观察对齐连线、训练/测试标签和无扫描案例的角色。",
          "next": "配对数据随后进入条件 GAN 的恢复装配台。",
          "notes": "来源：第 4.2 节。六个视频拼接 WSI 与扫描 WSI 进行仿射配准；两例训练、四例测试，另六例无扫描病例用于额外验证和专家定性评估。论文还报告 1408 对训练图像和 453 对验证图像。",
          "componentId": "ch3-register",
          "moduleId": "m03-register"
        },
        {
          "id": "ch3-generator",
          "title": "9 块 ResNet 与 PatchGAN 如何约束恢复",
          "goal": "比较放大路径、边界填充和判别器选择，理解论文为何采用特定组合。",
          "summary": "转置卷积、反射填充、VGG 损失和 vanilla PatchGAN 共同构成所选方案。",
          "interaction": "分别点选转置卷积/重采样卷积、零填充/反射填充、vanilla/LSGAN，观察边缘插图和网络路径。",
          "next": "网络选择之外，训练目标还由三类损失共同决定。",
          "notes": "来源：第 4.2 节、图 2 与表 1。生成器使用标准 9 块 ResNet；作者选用转置卷积，因为重采样卷积在本任务出现灰斑和更大色差；反射填充减轻边框伪影；判别器为 4 层 PatchGAN。本页视觉后果是解释示意，不是模型复现实验。",
          "componentId": "ch3-generator",
          "moduleId": "m03-generator"
        },
        {
          "id": "ch3-loss",
          "title": "同一张恢复照片受三股约束",
          "goal": "开关三类损失，理解真实感、感知结构与像素差异分别由哪一项约束。",
          "summary": "论文使用对抗损失、VGG 损失与 L1 损失的组合，列出权重均为 1。",
          "interaction": "点选三类损失开关，观察对应检查工具和论文配置状态；禁止无监督全关状态。",
          "next": "用表格指标和专家视觉选择检验七种训练配置。",
          "notes": "来源：第 4.2 节。论文说明生成器采用均方对抗损失、VGG 损失和 L1 损失的组合，给出的权重均为 1。页面不会编造去掉某项后的性能变化，只用工具高亮解释三种约束的不同职责。",
          "componentId": "ch3-loss",
          "moduleId": "m03-loss"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 指标与视觉证据",
      "modules": [
        {
          "kind": "module",
          "id": "m04-metrics",
          "title": "消融指标与最终选择",
          "desc": "选择模型，读取固定 SSIM/PSNR 数据并辨清指标最高与视觉选择。",
          "componentId": "ch4-metrics"
        },
        {
          "kind": "module",
          "id": "m04-visual",
          "title": "恢复方法对比图",
          "desc": "选择图 3 的方法列，观察原图高亮和论文对应的定性判断。",
          "componentId": "ch4-visual"
        }
      ],
      "scenes": [
        {
          "id": "ch4-metrics",
          "title": "最高 SSIM/PSNR 为什么不是最终模型",
          "goal": "比较七种配置的表格指标，理解作者为何按视觉质量选择 #5。",
          "summary": "表 2 中 #7 的 SSIM、#4 的 PSNR 最高，但最终视觉模型是 #5。",
          "interaction": "点选或键盘切换模型，观察两项固定指标、误差条、最大值标记及选择说明。",
          "next": "回到真实图像，看看视觉比较究竟呈现了什么。",
          "notes": "来源：表 2、图 2 与第 5 节。数值严格固定：模型 #7 SSIM 0.424±0.041；模型 #4 PSNR 11.619±1.604；模型 #5 被作者依据视觉质量选为最终结果，但其表格 SSIM/PSNR 并非最高。不能说 #5 在表格指标上获胜，也不能把 SSIM/PSNR 等同诊断准确率。",
          "componentId": "ch4-metrics",
          "moduleId": "m04-metrics"
        },
        {
          "id": "ch4-visual",
          "title": "与三类恢复方法的图像比较",
          "goal": "逐一选择方法列，比较低对比、模糊、锐化与恢复的差异。",
          "summary": "论文在真实显微视频样本上定性比较 DeblurGAN-v2、SRGAN、Real-ESRGAN 和本文方法。",
          "interaction": "点选六列方法，观察原图上的定位框与对应解释。",
          "next": "进一步查看专家标注与非利什曼病组织的泛化示例。",
          "notes": "来源：图 3 与第 5 节。原图保持不改，不做滤镜增强。论文认为 DeblurGAN 与 SRGAN 视觉改善很小，Real-ESRGAN 主要锐化高对比区域；本文依靠真实视频到扫描图像的配对训练。该图为代表性定性比较，不建立跨中心普遍优势。",
          "componentId": "ch4-visual",
          "moduleId": "m04-visual"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 泛化、代价与边界",
      "modules": [
        {
          "kind": "module",
          "id": "m05-expert",
          "title": "专家标注与跨组织证据",
          "desc": "切换拼接/生成视图与组织类别，区分定性展示和量化验证。",
          "componentId": "ch5-expert"
        },
        {
          "kind": "module",
          "id": "m05-runtime",
          "title": "拼接、训练与推理代价",
          "desc": "切换处理阶段，比较论文报告的时间、硬件和显存。",
          "componentId": "ch5-runtime"
        },
        {
          "kind": "module",
          "id": "m05-boundary",
          "title": "边界伪影与停止条件",
          "desc": "调整留白和重叠并选择重扫或裁除，决定何时不能直接使用结果。",
          "componentId": "ch5-boundary"
        }
      ],
      "scenes": [
        {
          "id": "ch5-expert",
          "title": "肉芽肿标注与跨组织定性结果",
          "goal": "比较视频拼接与生成 WSI，并判断图 4、图 5 提供了什么证据。",
          "summary": "专家在两类图像中标注肉芽肿与 LD 小体；其他组织展示定性结果。",
          "interaction": "切换视频拼接/生成 WSI，并选择利什曼病或另一类组织，观察图内定位与反馈。",
          "next": "可用性之外，还要评估时间、显存和硬件成本。",
          "notes": "来源：图 4、图 5 与第 5 节。论文称专家在拼接图和生成图中标注肉芽肿以及 LD 小体，并讨论 LD 小体可见性；乳腺、十二指肠、胃、肝、淋巴结为定性结果。没有统一的诊断准确率或跨组织量化指标。",
          "componentId": "ch5-expert",
          "moduleId": "m05-expert"
        },
        {
          "id": "ch5-runtime",
          "title": "几分钟、几个小时与一次推理",
          "goal": "比较拼接、训练和推理阶段的实际资源负担。",
          "summary": "低成本采集仍然需要图像处理、长时间训练和 GPU 推理。",
          "interaction": "选择拼接、训练或推理阶段，观察对应的论文报告数值和同一工作台中的物理隐喻。",
          "next": "最后处理论文明确承认的组织边界伪影。",
          "notes": "来源：第 4.1、4.2 节与局限性。递归拼接约 5–10 分钟；训练 84 小时、2×A100 40GB、32.5GB 训练显存；推理约 0.26 秒/块、1.9GB 显存。数值依赖论文硬件和分块条件。",
          "componentId": "ch5-runtime",
          "moduleId": "m05-runtime"
        },
        {
          "id": "ch5-boundary",
          "title": "边界伪影出现时，何时停止",
          "goal": "改变采集留白与重叠，并为不确定边界选择重扫或裁除。",
          "summary": "组织边界和方形伪影仍是当前方法限制，不能把每张输出都当作扫描级可靠证据。",
          "interaction": "拖动重叠和边缘留白，点选重扫或裁掉不确定区，观察伪影、可用面积和安全反馈。",
          "next": "完成教程后可进入人工准确性核验。",
          "notes": "来源：第 9 页 Limitations。论文承认组织边界和方形边框仍有明显伪影，并指向未来双向特征融合 GAN；当前还要求停顿和理想 >50% 重叠。重扫或裁除是保守使用建议，并非论文声称可完全消除模型伪影。",
          "componentId": "ch5-boundary",
          "moduleId": "m05-boundary"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "ch1-cost": "./thumbnails/ch1-cost.png",
    "ch1-detail": "./thumbnails/ch1-detail.png",
    "ch2-acquire": "./thumbnails/ch2-acquire.png",
    "ch2-keyframes": "./thumbnails/ch2-keyframes.png",
    "ch2-stitch": "./thumbnails/ch2-stitch.png",
    "ch3-register": "./thumbnails/ch3-register.png",
    "ch3-generator": "./thumbnails/ch3-generator.png",
    "ch3-loss": "./thumbnails/ch3-loss.png",
    "ch4-metrics": "./thumbnails/ch4-metrics.png",
    "ch4-visual": "./thumbnails/ch4-visual.png",
    "ch5-expert": "./thumbnails/ch5-expert.png",
    "ch5-runtime": "./thumbnails/ch5-runtime.png",
    "ch5-boundary": "./thumbnails/ch5-boundary.png"
  }
};

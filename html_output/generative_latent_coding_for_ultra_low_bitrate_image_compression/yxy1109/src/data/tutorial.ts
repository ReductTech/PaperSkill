import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Generative Latent Coding for Ultra-Low Bitrate Image Compression",
    "titleZh": "面向超低码率的生成式潜空间图像压缩",
    "venue": "arXiv:2512.20194v1 · 2025",
    "authors": "Zhaoyang Jia, Jiahao Li, Bin Li, Houqiang Li, Yan Lu",
    "affiliation": "中国科学技术大学 · 微软亚洲研究院",
    "domain": "深度学习图像压缩 · VQ-VAE · 生成式压缩 · 熵编码",
    "coreProblem": "超低码率下，像素空间失真与人的语义保真和纹理真实感并不总是一致。",
    "coreInsight": "GLC 先把图像编码进生成式 VQ-VAE 潜空间，再对离散语义潜码做变换编码、分类超先验建模和仅训练期使用的码预测监督。",
    "keywords": [
      "GLC",
      "VQ-VAE",
      "潜空间变换编码",
      "分类超先验",
      "码预测监督",
      "可变码率"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "像素空间变换编码",
      "desc": "修补师在低预算下逐块搬运局部像素，先失去的是结构与纹理。",
      "componentId": "glc-cover"
    },
    "newMethod": {
      "title": "生成式潜空间编码（GLC）",
      "desc": "修补师先保留语义马赛克，再让生成式解码器补全可信纹理。",
      "componentId": "glc-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 超低码率下为什么像素失真不等于感知质量",
      "modules": [
        {
          "kind": "module",
          "id": "problem",
          "title": "像素质感与感知结构的分歧",
          "desc": "拖动预算并切换像素/潜空间表示，观察结构、纹理和生成补全的差异。",
          "componentId": "glc-problem"
        },
        {
          "kind": "module",
          "id": "latent",
          "title": "生成式 VQ-VAE 码本",
          "desc": "选择 M=256、1024 或 16384，观察码本容量、索引位宽和语义细节的关系。",
          "componentId": "glc-latent"
        }
      ],
      "scenes": [
        {
          "id": "glc-problem",
          "title": "像素误差为何不等于感知质量",
          "goal": "在相同修补预算下比较像素空间与生成式潜空间，判断哪一种表示先守住主体结构和纹理真实感。",
          "summary": "超低码率让像素误差与语义/纹理判断分离",
          "interaction": "拖动预算，并切换像素空间与生成式潜空间两种表示",
          "next": "进一步理解生成式 VQ-VAE 如何形成离散语义潜码",
          "notes": "论文 §1 与 Figure 1 用 SNR 与 DISTS 说明：在超低码率下，较低像素失真不一定对应更好的语义一致性和纹理真实感。页面中的预算、马赛克细节和生成纹理均为教学示意，不是论文的实测 bpp 曲线；其作用是让读者看到两种表示关注的内容不同。",
          "componentId": "glc-problem",
          "moduleId": "problem",
          "thumbnail": "./thumbnails/glc-problem.jpg"
        },
        {
          "id": "glc-latent",
          "title": "离散码本如何形成生成式潜空间",
          "goal": "选择码本容量，理解语义单元数量、索引位宽和最终码流并不单调对应。",
          "summary": "VQ 码本把图像组织为离散语义单元",
          "interaction": "选择 M=256、1024 或 16384，观察语义色块数量与 log₂M 位宽",
          "next": "把码本放回完整 GLC 前向路径",
          "notes": "依据 §3.2 与 §8.1：自然图像模型采用 VQGAN 类结构，f=1/16、M=16384；人脸模型采用 CodeFormer 类结构，f=1/32、M=1024。码本更大意味着单个索引位宽更大，也会改变表达能力；论文并未声称码本越大总码流必然越小，因为主索引图还要经过潜空间变换编码。",
          "componentId": "glc-latent",
          "moduleId": "latent",
          "thumbnail": "./thumbnails/glc-latent.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 构建 GLC：潜空间路径与渐进训练",
      "modules": [
        {
          "kind": "module",
          "id": "architecture",
          "title": "GLC 前向路径",
          "desc": "点选 x→E→l→gₐ→y→Q→ŷ→gₛ→l̂→D→x̂ 的部件，并切换自然/人脸配置。",
          "componentId": "glc-architecture"
        },
        {
          "kind": "module",
          "id": "stage-one",
          "title": "三阶段渐进训练",
          "desc": "切换 Stage I、II、III，观察可训练/冻结模块与损失目标。",
          "componentId": "glc-stage-one"
        }
      ],
      "scenes": [
        {
          "id": "glc-architecture",
          "title": "GLC 前向路径：从照片到潜码再回到照片",
          "goal": "点选路径部件，区分潜自编码器、分析/合成变换、量化、熵编码输入与生成式解码。",
          "summary": "变换编码发生在生成式 VQ-VAE 潜空间",
          "interaction": "点击 11 个路径节点，切换自然图像与人脸模型配置",
          "next": "查看生成式潜空间为何需要分阶段训练",
          "notes": "主体依据 §3.1 的式 (1) 与 Figure 3：l=E(x)，y=gₐ(l)，ŷ=Q(y)，l̂=gₛ(ŷ)，x̂=D(l̂)。自然/人脸的下采样倍率和码本大小来自 §8.1。熵模型实际还使用分类超先验与四叉树分区空间上下文；此页先建立主路径，避免把所有模块挤成通用节点图。",
          "componentId": "glc-architecture",
          "moduleId": "architecture",
          "thumbnail": "./thumbnails/glc-architecture.jpg"
        },
        {
          "id": "glc-stage-one",
          "title": "三阶段训练：先学会表示，再学会压缩",
          "goal": "切换训练阶段，判断每一阶段冻结哪些模块、更新哪些损失，以及为什么先潜空间后码率。",
          "summary": "Stage I 建潜空间，II 学变换编码，III 联合微调",
          "interaction": "选择 Stage I/II/III，观察模块状态、损失项和精确权重",
          "next": "进入潜空间变换编码与分类超先验",
          "notes": "依据 §4.1–§4.3：Stage I 使用重建、LPIPS、自适应 Patch-GAN 与码本损失，λ_adv=0.8、β=0.25；Stage II 冻结自编码器，使率项与码预测失真联合优化，α=0.5；Stage III 放开整网并在像素空间应用码预测监督，λ_code=0.05。超码本损失在式 (5)–(8) 中省略，但训练时仍需要。",
          "componentId": "glc-stage-one",
          "moduleId": "stage-one",
          "thumbnail": "./thumbnails/glc-stage-one.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 在潜空间里做变换编码",
      "modules": [
        {
          "kind": "module",
          "id": "transform",
          "title": "潜码空间冗余与变换编码",
          "desc": "拖动空间冗余复用强度，比较索引图直传与变换残差，并核对 66.2% BD-Rate。",
          "componentId": "glc-transform"
        },
        {
          "kind": "module",
          "id": "hyper",
          "title": "分类超先验",
          "desc": "切换分解/分类超先验，观察局部账本与语义便签的信息差异。",
          "componentId": "glc-hyper"
        },
        {
          "kind": "module",
          "id": "rate",
          "title": "单模型可变码率",
          "desc": "拖动目标档位，观察 q_enc/q_dec、语义骨架和纹理细节的共同变化。",
          "componentId": "glc-rate"
        }
      ],
      "scenes": [
        {
          "id": "glc-transform",
          "title": "为什么不直接传输 VQ 索引图",
          "goal": "把空间冗余复用从弱拖到强，理解变换编码为何能比逐位置索引更好地消除重复结构。",
          "summary": "索引图直传的冗余利用不足，变换编码更有效",
          "interaction": "拖动上下文/冗余复用强度，观察位置码与残差码数量变化",
          "next": "理解超信息如何进一步降低码率",
          "notes": "论文 §3.3 指出索引图方法对潜码相关性利用不足；Table 1 在 CLIC2020 FID–BPP 曲线上报告索引图直传相对变换编码有 66.2% BD-Rate 损失。页面中 40 个位置码和残差数量的映射仅用于说明机制，不是论文的码字统计；66.2% 是固定实测值，不能由滑块改变。",
          "componentId": "glc-transform",
          "moduleId": "transform",
          "thumbnail": "./thumbnails/glc-transform.jpg"
        },
        {
          "id": "glc-hyper",
          "title": "分类超先验如何压缩旁信息",
          "goal": "切换两种超先验，判断哪类信息真正值得进入旁路码流，并正确解释 17.7% BD-Rate。",
          "summary": "分类超码本把超信息集中到高层语义结构",
          "interaction": "选择分解超先验或分类超先验，观察局部账本/语义便签与实测曲线损失",
          "next": "让同一模型覆盖不同码率",
          "notes": "依据 §3.3.1 与式 (2)：z=hₐ(y)，ẑ=VQ(z,C_h)，prior_z=hₛ(ẑ)。Table 1 中分解先验相对分类先验有 17.7% BD-Rate 损失。推理时超码本索引采用固定长度 log₂M_h 编码，因此图中 14 bit 只对应自然模型 M_h=16384 的索引宽度；局部颜色/纹理数量是解释示意，不声称实测码长。",
          "componentId": "glc-hyper",
          "moduleId": "hyper",
          "thumbnail": "./thumbnails/glc-hyper.jpg"
        },
        {
          "id": "glc-rate",
          "title": "一个模型如何覆盖不同码率",
          "goal": "拖动目标档位，理解学习到的编码/解码缩放器如何让同一模型产生不同率—细节工作点。",
          "summary": "q_enc/q_dec 调制同一潜空间变换路径",
          "interaction": "拖动目标码率档位，观察 q_enc、q_dec、码量示意和纹理细节",
          "next": "理解仅训练期使用的码预测监督",
          "notes": "依据 §3.3.2 与 Figure 14：GLC 沿用 DCVC 系列的学习缩放器设计，通过不同 λ 训练并在编码/解码变换中调制特征，从而支持单模型可变码率。页面的 0–100 档位不是 bpp，也不代表某个实测工作点；它只帮助观察率与细节的取向。论文实际 bpp 结论应看 Figure 8 与 §5.2。",
          "componentId": "glc-rate",
          "moduleId": "rate",
          "thumbnail": "./thumbnails/glc-rate.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 让压缩码保留语义：码预测监督",
      "modules": [
        {
          "kind": "module",
          "id": "code-prediction",
          "title": "码预测器的位置消融",
          "desc": "选择无预测、推理网络内预测、仅训练监督三种位置，观察属性稳定性和 BD-Rate。",
          "componentId": "glc-code-prediction"
        }
      ],
      "scenes": [
        {
          "id": "glc-code-prediction",
          "title": "码预测为何只留在训练期",
          "goal": "选择预测器位置，区分“更强语义约束”与“过窄推理瓶颈”，并正确读出 13.1% 与 60.7%。",
          "summary": "训练监督提升语义一致性，推理路径不经过码本瓶颈",
          "interaction": "选择无码预测/推理网络内码预测/仅训练监督，比较属性示意与 BD-Rate",
          "next": "核对消融与主要结果，避免把相对百分比读成 bpp",
          "notes": "依据 §4.4、式 (5) 与 Table 2：𝒟_code=αCE(M_l,M̂_l̂)+||l−l̂||²，α=0.5。无码预测和推理网络内预测分别相对“仅训练监督”有 13.1% 与 60.7% BD-Rate 损失。Figure 7 的眼影、嘴型等属性只提供定性例子；本页人脸图是示意，不是逐图复现，也不能据此推断身份保持已达生产标准。",
          "componentId": "glc-code-prediction",
          "moduleId": "code-prediction",
          "thumbnail": "./thumbnails/glc-code-prediction.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "05 · 证据、应用与失效边界",
      "modules": [
        {
          "kind": "module",
          "id": "ablation",
          "title": "三组关键消融",
          "desc": "切换潜码方案、码预测位置与 patch 大小，核对零基线和 BD-Rate 方向。",
          "componentId": "glc-ablation"
        },
        {
          "kind": "module",
          "id": "results",
          "title": "主要结果口径",
          "desc": "切换自然/人脸/等 FID 结果，区分报告范围与归一化比特节省。",
          "componentId": "glc-results"
        },
        {
          "kind": "module",
          "id": "applications",
          "title": "恢复与风格化应用",
          "desc": "选择普通压缩、恢复编码和风格解码路径，核对恢复应用指标。",
          "componentId": "glc-applications"
        },
        {
          "kind": "module",
          "id": "limits",
          "title": "屏幕内容失败边界",
          "desc": "增加分布偏移，观察网格、文字和生成先验之间的冲突。",
          "componentId": "glc-limits"
        }
      ],
      "scenes": [
        {
          "id": "glc-ablation",
          "title": "消融结果：所有数值都是 BD-Rate 越低越好",
          "goal": "切换消融族，核对柱值、共同尺度和 0% 参考点，避免把相对曲线损失当作 bpp 节省。",
          "summary": "变换编码、分类超先验与局部注意力均有实测支持",
          "interaction": "选择潜码方案、码预测或注意力族，观察精确 BD-Rate 柱值",
          "next": "阅读主要工作范围与等 FID 比较",
          "notes": "数值来自 Table 1、Table 2 与 Table 4：索引图 66.2%、分解先验 17.7%、分类先验 0%；无码预测 13.1%、推理网络内预测 60.7%、仅监督 0%；Global 20.8%、64×64 8.4%、32×32 0%、16×16 1.8%。BD-Rate 是对 FID–BPP 曲线的整体比较，并非 bpp、FID 或参数量。",
          "componentId": "glc-ablation",
          "moduleId": "ablation",
          "thumbnail": "./thumbnails/glc-ablation.jpg"
        },
        {
          "id": "glc-results",
          "title": "45% 比特节省来自等 FID 比较",
          "goal": "区分自然图像工作范围、人脸工作范围和 CLIC2020 等 FID 相对结果，明确每个数字的单位与条件。",
          "summary": "低于 0.04/0.01 bpp 是范围，45% 是等 FID 的相对比特节省",
          "interaction": "切换自然图像、人脸和 CLIC2020 三张结果卡，阅读证据条件",
          "next": "查看同一潜空间支持的恢复与风格化应用",
          "notes": "依据 Abstract、§5.2、Figure 8 与 §9.1：自然图像报告低于 0.04 bpp，人脸报告低于 0.01 bpp，CLIC2020 约 45% 比特节省是在与 MS-ILLM 等 FID 条件下得到。FID/KID 在自然图像上按 256×256 重叠 patch 计算，CLIC2020 共 28,650 patches；它们是数据集级统计，不是逐图保真保证。",
          "componentId": "glc-results",
          "moduleId": "results",
          "thumbnail": "./thumbnails/glc-results.jpg"
        },
        {
          "id": "glc-applications",
          "title": "同一个潜空间如何承载恢复与风格化",
          "goal": "选择应用路径，判断替换的是编码器还是解码器，并正确读恢复应用的 bpp、FID、DISTS 与参数量。",
          "summary": "恢复替换编码器，风格化解码替换解码器",
          "interaction": "选择普通压缩、恢复并压缩、风格化解码，观察路径与精确指标",
          "next": "推到屏幕内容这一分布外边界",
          "notes": "依据 §6、Table 3 与 Figure 10/16：恢复编码器把失真图像映射到干净潜码；Table 3 中 GLC Restoration Application 为 0.0299 bpp、FID 8.62、DISTS 0.1081、109M，对照 Restormer+GLC 为 0.0314、10.79、0.1174、25M+109M。风格化解码替换潜解码器。两者均为演示应用，不是通用生产服务；恢复实验只覆盖 σ=20 高斯噪声示例。",
          "componentId": "glc-applications",
          "moduleId": "applications",
          "thumbnail": "./thumbnails/glc-applications.jpg"
        },
        {
          "id": "glc-limits",
          "title": "生成式真实感不能保证精确还原",
          "goal": "把内容从自然照片推向屏幕网格与文字，观察生成先验何时覆盖输入结构，并形成部署前检查判据。",
          "summary": "屏幕网格与文字是论文明确报告的泛化弱点",
          "interaction": "拖动分布偏移，观察直线、网格与文字从稳定到失真的过程",
          "next": "核对本轮工作量和复现边界",
          "notes": "论文 §7、§10 与 Figure 15 明确报告屏幕内容泛化不足，尤其直线网格；GLC 的文字区域可能比 TCM/MS-ILLM 更清晰，但仍不能保证准确重建。页面的弯曲、缺口和 OCR 建议是放大解释，不是论文新增解法。FID/DISTS 可能无法单独暴露局部文字错误，因此部署应加结构、OCR 与人工检查。",
          "componentId": "glc-limits",
          "moduleId": "limits",
          "thumbnail": "./thumbnails/glc-limits.jpg"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "06 · 工作量、复现边界与下一步实验",
      "modules": [
        {
          "kind": "module",
          "id": "reproduce",
          "title": "工作检查与诚实边界",
          "desc": "切换完成项，核对阅读、公式、交互、报告与重新训练的真实边界。",
          "componentId": "glc-reproduce"
        },
        {
          "kind": "module",
          "id": "closing",
          "title": "可证伪的后续实验",
          "desc": "选择 OOD、超索引熵编码或人眼研究，查看假设、基线、指标和判定标准。",
          "componentId": "glc-closing"
        }
      ],
      "scenes": [
        {
          "id": "glc-reproduce",
          "title": "本轮工作完成了什么，没有完成什么",
          "goal": "逐项核对阅读、公式、结果口径、交互复现与训练复现，拒绝把理解工作包装成完整实验复现。",
          "summary": "已做机制与证据审读，未重训完整 GLC",
          "interaction": "切换六项检查，观察覆盖度和复现边界反馈",
          "next": "选择一条能被数据推翻的后续实验",
          "notes": "这是对本次学习工作量的自我审计，不是论文证据。完成项包括精读、公式与符号核对、数据集和指标口径核对、交互式机制复现与报告；未完成项是复用作者训练数据流程、从头训练 VQ-VAE/变换编码/生成解码器，以及在相同协议下评测。交互网页只复现机制因果关系，不能替代训练与 benchmark。",
          "componentId": "glc-reproduce",
          "moduleId": "reproduce",
          "thumbnail": "./thumbnails/glc-reproduce.jpg"
        },
        {
          "id": "glc-closing",
          "title": "下一步应验证泛化、超索引编码还是人眼收益",
          "goal": "比较三条后续路线，确定假设、基线、主指标和失败判据，把批判性思考转成可执行实验。",
          "summary": "后续实验必须同时约束质量、码率与结构保真",
          "interaction": "选择屏幕 OOD、超索引熵编码或人眼研究，阅读完整协议",
          "next": "",
          "notes": "三项均是未验证的后续假设，不是论文结论。建议优先做 OOD 与超索引编码：前者检验 GLC 的结构边界，后者直接检验分类超信息是否还可压缩。实验必须固定数据划分与码率点，同时报告 FID/DISTS、bpp、结构指标和失败案例。人眼研究应与客观指标结合，避免只用偏好替代保真。",
          "componentId": "glc-closing",
          "moduleId": "closing",
          "thumbnail": "./thumbnails/glc-closing.jpg"
        }
      ]
    }
  ]
};

import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'JoyAI-Image: Awaking Spatial Intelligence in Unified Multimodal Understanding and Generation',
    titleZh: 'JoyAI-Image：唤醒统一多模态理解与生成中的空间智能',
    venue: 'arXiv 2026',
    authors: 'Lin Song, Wenbo Li, Guoqing Ma 等',
    affiliation: 'Joy Future Academy · 京东',
    domain: '统一多模态基础模型 · 空间智能',
    coreProblem: '理解、生成、编辑常被拆成孤立能力；单视角视觉又难以获得可靠的 3D 几何证据。',
    coreInsight: '以空间数据增强 MLLM 的几何理解，并让生成、编辑模型学习空间条件；在 Think with Novel Views 中，再由 Planner、空间编辑器与 Reasoner 组合成主动求证流程。',
    keywords: ['统一多模态', '空间理解', 'Flow Matching', '空间编辑', 'Think with Novel Views']
  },
  hero: {
    oldMethod: { desc: '割裂方案：理解、生成、编辑各自优化；单一视角留下遮挡与几何歧义。', componentId: 'hero-old' },
    newMethod: { desc: 'JoyAI-Image：以 MLLM 为统一语义接口，生成与编辑共享 VAE—MMDiT 路径，并可在推理时借助空间编辑器合成新视角。', componentId: 'hero-new' }
  },
  chapters: ([
    {
      kind: 'chapter', id: 'chap-1', title: '统一架构：空间智能如何流过三项任务', badge: 'both', badgeLabel: '先见全貌',
      bridge: '先回答“它是什么”：JoyAI-Image 不是三个模型的拼盘，而是让同一份空间语义同时服务理解、生成与编辑的统一系统。',
      analogy: { title: '类比：换个视角，把遮挡部分补画完整', text: '铅笔先记录当前角度能看见的关系；换到新视角后，再<strong>补上此前不可见的部分，并结合原草图进行空间推理</strong>。统一框架让生成与编辑成为空间理解的补充视觉证据。', componentId: 'sec2-ana' },
      modules: [
        { kind: 'module', id: '1.1', title: '点选统一架构的三个部件', desc: '<strong>点击</strong> MLLM / VAE / MMDiT，区分“理解接口、潜变量压缩、条件生成核”三种职责。', componentId: 'sec1-mod1' },
        { kind: 'module', id: '1.2', title: '从语义条件到新视角：信息怎样往返？', desc: '<strong>逐步点击</strong>，看 MLLM 的隐藏状态如何为生成/编辑提供条件；在 TwNV 推理中，空间编辑器合成的新视角又如何成为 Reasoner 的补充输入。', componentId: 'sec2-mod1' },
        { kind: 'module', id: '1.3', title: '论文原图：统一架构', desc: 'Figure 4：理解直接输出语言；生成与编辑则将 MLLM 的隐藏状态作为 MMDiT 的条件，同时由 VAE 连接像素与潜空间。', componentId: 'fig-arch', figure: '/images/fig-architecture.png' }
      ],
      insight: '“统一”指三项任务被纳入同一框架，并由 MLLM 提供共同语义接口；理解路径不经过 VAE/MMDiT，三项任务也不共享同一套监督数据或评价指标。',
      takeaways: [
        { icon: '◆', title: 'MLLM 是接口', desc: 'Qwen3-VL-8B 既理解场景，也解释生成与编辑意图。' },
        { icon: '●', title: 'VAE 是桥梁', desc: 'Wan-2.1-VAE 将像素压入适合扩散建模的潜空间。' },
        { icon: '▲', title: 'MMDiT 是执行器', desc: '16B 双流生成核融合语义先验与视觉条件，完成生成和编辑。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-2', title: 'Understanding：让模型看懂空间', badge: 'inf', badgeLabel: '空间能力注入',
      bridge: '单张图无法直接看见被遮挡物、真实尺度或相机运动。Understanding 阶段的目标，是让模型建立跨视角仍一致的空间表征。',
      analogy: { title: '类比：导演绕着场景取景', text: '只看一个镜头容易误判前后与远近；不断<strong>换角度取景</strong>，才能确认物体的尺度、朝向和相互关系。', componentId: 'sec3-ana' },
      modules: [
        { kind: 'module', id: '2.1', title: '拖动 3D box，体验跨视角锚点', desc: '<strong>拖动</strong>立方体旋转：3D oriented bounding box 同时编码中心、尺度和朝向，可投影到多个视角。', componentId: 'sec3-mod1' },
        { kind: 'module', id: '2.2', title: '论文原图：OpenSpatial 数据引擎', desc: 'Figure 5：以 3D box 为锚点，从 3D 扫描与网络视频建立 object-frame 索引，再合成单视角与多视角 QA。', componentId: 'fig-spatial', figure: '/images/fig-spatial.png' }
      ],
      insight: '训练并非“课程学习”：论文采用空间专项 SFT、按数据集配比采样、动态序列打包；仅在通用数据上施加 KL 蒸馏，从而保住原有通用能力而不阻碍空间知识注入。',
      formula: { lead: '空间专项微调的总目标为标准监督损失加通用能力保持项；后者只用于通用数据。', unicode: 'L = L<sub>SFT</sub> + λL<sub>KL</sub>', symbols: [{ sym: 'L_SFT', desc: '空间与通用多模态样本的监督微调损失' }, { sym: 'L_KL', desc: '冻结教师在响应 token 上提供的层平均 KL 约束' }] },
      takeaways: [
        { icon: '■', title: '3M OpenSpatial', desc: '覆盖测量、关系、相机、多视角一致与场景推理五类能力。' },
        { icon: '◆', title: '多视角一致性', desc: '候选 3D box 只有在多个视角都对齐实例 mask 时才被保留。' },
        { icon: '▲', title: '64.4 空间平均分', desc: '9 个空间基准上较 Qwen3-VL-8B 的 59.1 提升 5.3 分。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-3', title: 'Generation：让模型生成空间', badge: 'trn', badgeLabel: 'DATA → TRAINING → RESULTS',
      bridge: '这一章不再从单个公式切入，而是追踪一条完整证据链：数据决定模型能看到哪些监督，训练阶段把监督逐步转化为能力，结果再检查这些能力是否真的出现。',
      analogy: { title: '类比：先准备摄影素材，再训练拍摄流程，最后逐项验片', text: '素材库决定摄影师见过什么；分阶段练习决定他如何掌握清晰度、构图和文字；最终验片则要分别检查<strong>文字、画面质量与空间一致性</strong>，不能只凭一张好看的样片。', componentId: 'sec4-ana' },
      modules: [
        { kind: 'module', id: '3.1', title: '主路线：Data → Training → Results', desc: '<strong>依次点击</strong>三层，先弄清训练数据提供了什么，再追踪四阶段训练各自解决的问题，最后按数据集核对论文结果。', componentId: 'sec-generation-roadmap' },
        { kind: 'module', id: '3.2', title: 'Training 细节：Flow Matching 到底学什么？', desc: '<strong>滑动</strong>时间步 t，观察基础生成目标如何学习噪声潜变量到图像潜变量之间的速度；它贯穿预训练，但不是全部训练策略。', componentId: 'sec4-mod1' },
        { kind: 'module', id: '3.3', title: 'Results 的视觉证据：多视角生成案例', desc: 'Figure 2 提供定性结果：同一提示生成多个一致视角。量化结论则在右侧按 LongText、CVTG、OneIG、DPG 与 CoReBench 分开核对。', componentId: 'fig-capabilities', figure: '/images/fig-capabilities.png' }
      ],
      insight: '完整因果链是：多粒度/OCR/多视角数据提供专项监督 → 渐进预训练建立覆盖 → 续训缩窄到高质量分布 → SFT 强化文字与多视角 → Flow-GRPO 对齐美学和文本一致性 → 分数据集验证，而不是把所有提升笼统归因于 RL。',
      takeaways: [
        { icon: '●', title: 'Data 决定能力上限', desc: 'OCR-aware caption 对应文字忠实度，约 1M 多视角数据对应跨视角一致性。' },
        { icon: '◆', title: 'Training 分工明确', desc: '预训练学覆盖、续训提质量、SFT 补专项、RL 做偏好对齐。' },
        { icon: '★', title: 'Results 有强项也有边界', desc: '长文本与构图突出，但 OneIG、DPG 和 CoReBench Reasoning 并非全部第一。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-4', title: 'Editing：让模型操纵空间', badge: 'both', badgeLabel: '编辑训练',
      bridge: '这一章沿用 Data → Training → Results，但把 Spatial Editing 放在中心：先看两条 3D 数据分支怎样制造明确监督，再看模型如何执行目标变化并保持指令未涉及的内容，最后用空间编辑结果验证。',
      analogy: { title: '编辑契约：变化边界由指令决定', text: 'Editing 不预设人物、主题或场景必须保持不变。模型先从指令中判断<strong>哪些内容应该改变</strong>，再尽量保持<strong>指令未涉及的内容</strong>；Spatial Editing 进一步要求物体或相机变化满足明确的几何关系。', componentId: 'sec6-ana' },
      modules: [
        { kind: 'module', id: '4.1', title: '主路线：Data → Training → Results', desc: '<strong>依次点击</strong>三层。Data 中重点比较 Static-Camera 与 Dynamic-Camera 两条空间分支；Training 追踪四个阶段；Results 优先核对 SpatialEdit-Bench。', componentId: 'sec-editing-roadmap' },
        { kind: 'module', id: '4.2', title: '论文原图：两条 Spatial Editing 数据分支', desc: 'Figure 10：上方 Dynamic-Camera 分支采样 yaw、pitch、distance；下方 Static-Camera 分支固定相机并生成物体移动、旋转与缩放。', componentId: 'fig-edit', figure: '/images/fig-edit-pipeline.png' },
        { kind: 'module', id: '4.3', title: '操纵空间时，哪些内容该改、哪些必须保留？', desc: '<strong>切换</strong>属性修改、物体变换与相机变换，观察目标变化与身份、布局、非目标区域保持之间的约束。', componentId: 'sec-edit-mod1' }
      ],
      insight: '空间编辑的关键不是增加一类文字指令，而是用 3D 场景生成几何上无歧义的源图—目标图对：Static-Camera 解耦物体变化与背景保持，Dynamic-Camera 解耦相机运动与场景结构保持。',
      takeaways: [
        { icon: '◆', title: '空间数据不是附属项', desc: '物体级与相机级两条数据分支提供明确的几何变换监督。' },
        { icon: '●', title: '先跟随，再好看', desc: '后训练把指令遵循视作高奖励的必要条件，而非用自然度掩盖错改。' },
        { icon: '▲', title: '变化边界由指令决定', desc: '修改指令指定内容，并尽量保持未被指令要求改变的部分；身份与布局是否保持取决于具体任务。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-5', title: '证据边界：这些结果能说明什么、不能说明什么', badge: 'both', badgeLabel: '阅读边界',
      bridge: '结果已经回到各自任务章节。本节不再重复领奖台，而是学习怎样正确阅读这些数字，避免跨协议比较和只挑有利结果。',
      analogy: { title: '类比：不同赛制不能共用一张成绩单', text: '短跑时间、跳高高度与体操评分不能直接排序；论文中的理解、生成、编辑指标也必须<strong>留在各自协议</strong>中解释。', componentId: 'sec5-ana' },
      modules: [
        { kind: 'module', id: '5.1', title: '点选三条结果阅读规则', desc: '<strong>选择</strong>指标方向、协议隔离或负面证据，判断一个实验结论是否越过了论文真正支持的边界。', componentId: 'sec5-mod1' }
      ],
      insight: '可信的教程不仅展示最好数字，还要说明 metric direction、数据集与评测协议，并保留不利结果；例如 JoyAI-Image-Edit 对 Nano Banana 2 的自然度与整体人评仍有明显差距。',
      takeaways: [
        { icon: '◆', title: '先看方向', desc: '准确率和得分通常越高越好，相机误差则越低越好。' },
        { icon: '●', title: '再看协议', desc: '不同数据集、split、judge 与单位不能混成统一排名。' },
        { icon: '▲', title: '保留负面证据', desc: '空间忠实度突出，不代表自然度已经超过最强闭源基线。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-6', title: 'Think with Novel Views：让三项能力闭成一次推理', badge: 'inf', badgeLabel: '应用闭环',
      bridge: '当单一视角无法提供足够的空间证据时，Planner 先规划新的观察位置，空间编辑模型再生成新视角，Reasoner 最后联合原图与新图完成判断。生成的新视角还可用于多视角重建，检验其是否保留了有意义的跨视角几何结构。',
      analogy: { title: '类比：换到看得见关键关系的位置再判断', text: '被遮挡或前后关系不清时，不急着猜答案；先<strong>走到合适的观察位置</strong>，再结合原视角和新视角作判断。', componentId: 'sec6-ana' },
      modules: [
        { kind: 'module', id: '6.1', title: '切换“单视角 / 新视角”推理', desc: '<strong>拨动开关</strong>，比较只有原图时的几何歧义，与 Planner 选视角、Synthesizer 合成后再推理的差别。', componentId: 'sec6-mod1' },
        { kind: 'module', id: '6.2', title: '论文原图：TwNV 的三阶段流程', desc: 'Figure 13：Planner 产生 6-DoF 相机运动，Synthesizer 生成 I₁，Reasoner 联合 {I₀, I₁} 回答空间问题。', componentId: 'fig-twnv', figure: '/images/fig-twnv.png' }
      ],
      insight: '这是论文在推理阶段给出的主动求证流程：MLLM Planner 规划需要暴露的几何证据，JoyAI-Image-Edit 执行相机运动并合成新视角，Reasoner 再联合原图与新图完成空间判断。',
      takeaways: [
        { icon: '◆', title: '先规划', desc: 'MLLM Planner 预测能暴露关键几何证据的 6-DoF 相机运动。' },
        { icon: '●', title: '再合成', desc: '空间编辑器必须忠实执行相机运动，否则新证据会误导推理。' },
        { icon: '▲', title: '最后推理', desc: '固定 GPT-5 Reasoner 时准确率 68.8→71.7；Qwen3-VL-32B 的相对增益为 7.8%。' }
      ]
    },
    {
      kind: 'chapter', id: 'chap-7', title: '总结：从看懂空间，到用新视角思考', badge: 'both', badgeLabel: '主线收束',
      bridge: 'Understanding、Generation 与 Editing 分别建立空间理解、多视角生成和空间操纵能力；在 Think with Novel Views 中，MLLM Planner 与 JoyAI-Image-Edit 被组合成主动求证流程，新视角再交给 Reasoner 作为补充证据。',
      modules: [
        { kind: 'module', id: '7.1', title: '点击五个节点，重走论文的空间智能闭环', desc: '<strong>依次点击</strong>统一架构、看懂空间、生成空间、操纵空间和新视角思考，核对每一步的职责、训练来源及关键证据。', componentId: 'sec-summary-loop' }
      ],
      insight: '这篇工作的统一性不在于所有任务共享同一种数据或损失，而在于共同框架覆盖理解、生成与编辑；TwNV 则进一步用 Planner 提出相机运动、用空间编辑模型产生新观察，再由 Reasoner 联合证据推理。',
      takeaways: [
        { icon: '◆', title: '三项任务各自成立', desc: 'Understanding、Generation 与 Editing 都有对应训练设计和独立实验证据。' },
        { icon: '●', title: '空间能力贯穿其中', desc: '空间不是单独 benchmark 标签，而是数据、模型条件、编辑控制与推理程序的共同主线。' },
        { icon: '↺', title: 'TwNV 完成闭环', desc: '模型不只回答当前图像，还能主动生成新视角来补充不可见的几何证据。' }
      ]
    }
  ] satisfies TutorialData['chapters'])
    .filter((chapter) => chapter.id !== 'chap-5')
    .map((chapter) => {
      if (chapter.id === 'chap-1') {
        return {
          ...chapter,
          modules: [
            {
              kind: 'module' as const,
              id: '1.1',
              title: '为什么“看懂图片”还不等于“理解空间”？',
              desc: '<strong>切换</strong>“看懂图片 / 理解空间”，比较可见语义识别与距离、尺度、遮挡、相机关系推理之间的证据差距。',
              componentId: 'sec1-mod1'
            },
            {
              kind: 'module' as const,
              id: '1.2',
              title: '沿 Figure 4 跑通三条任务线路',
              desc: '<strong>切换</strong>整体架构、Understanding、Generation 与 Editing，在论文原图上核对每项任务的输入、组件路径和输出。',
              componentId: 'fig-arch'
            }
          ]
        };
      }
      if (chapter.id === 'chap-2') {
        return {
          ...chapter,
          modules: [
            {
              kind: 'module' as const,
              id: '2.1',
              title: '先看训练数据：为什么空间数据不能单独训练？',
              desc: '<strong>切换</strong> Figure 7 的总语料与 OpenSpatial 视图，比较通用理解数据、空间理解数据和其他监督在 11.3M 训练语料中的分工。',
              componentId: 'fig-data-recipe'
            },
            {
              kind: 'module' as const,
              id: '2.2',
              title: 'OpenSpatial：怎样批量构造空间监督？',
              desc: 'Figure 5 展示 box-centric 数据引擎：先从 3D 扫描或网络视频获得场景级 3D OBB，再投影到各帧并以 mask 做跨视角校验，最终将 3D/2D box、实例 mask、局部点云和度量信息写入统一 object-frame index。',
              componentId: 'fig-spatial',
              figure: '/images/fig-spatial.png'
            },
            {
              kind: 'module' as const,
              id: '2.3',
              title: '拖动 3D box：OpenSpatial 如何对齐多个视角？',
              desc: '<strong>横向与纵向拖动</strong> oriented bounding box，观察中心、尺寸和朝向如何构成跨视角一致的几何锚点。',
              componentId: 'sec3-mod1'
            }
          ]
        };
      }
      if (chapter.id === 'chap-6') {
        return {
          ...chapter,
          id: 'chap-5',
          analogy: undefined,
          modules: [
            ...chapter.modules.map((module) => ({
              ...module,
              id: module.id.replace(/^6\./, '5.'),
              figure: module.componentId === 'fig-twnv' ? undefined : ('figure' in module ? module.figure : undefined)
            })),
            {
              kind: 'module' as const,
              id: '5.3',
              title: 'Figure 14：新视角怎样解决真实空间问题？',
              desc: '论文展示两个代表性 case：<strong>高度比较</strong>与<strong>垂直关系消歧</strong>。对比 Input、Qwen-Image-Edit、Nano Banana Pro 与 JoyAI-Image-Edit，观察不同新视角是否真正暴露了作答所需的空间证据。',
              componentId: 'sec-twnv-cases',
              figure: '/images/fig-twnv-cases.png'
            },
            {
              kind: 'module' as const,
              id: '5.4',
              title: 'Figure 15：生成的新视角真的具有几何一致性吗？',
              desc: '<strong>切换</strong>“单图重建 / 加入新视角重建”。论文将生成视角送入 VGGT，观察点云与相机姿态是否变得更稠密、更完整。',
              componentId: 'sec-twnv-reconstruction',
              figure: '/images/fig-reconstruction.png'
            }
          ]
        };
      }
      if (chapter.id === 'chap-7') {
        return {
          ...chapter,
          id: 'chap-6',
          modules: chapter.modules.map((module) => ({ ...module, id: module.id.replace(/^7\./, '6.') }))
        };
      }
      return chapter;
    })
};

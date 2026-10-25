# 自适应引擎 · 工程与交互规范

> 当前默认网页采用 [Robot-Revision.md](Robot-Revision.md) 的机器人故事版本；本文件保留为早期方案与证据边界参考。
状态：ACT 0–9 已开放。本文件部分接口是早期方案约定，不代表全部已实现；知识补给、ACT 8 与复习建议以 [Exploration-Revision.md](Exploration-Revision.md) 为准。最新呈现以 Beginner-Revision.md 为准，取消卡片式 UI；本章验收见 ACT0-Review.md。

## 6. 全局状态设计

### 状态分层

| 层 | 内容 | 生命周期 |
| --- | --- | --- |
| 只读论文证据 | 来源、原始测量、条件、缺失值、图表定位 | 随项目版本发布；玩家不能修改 |
| 学习记录 | 预测、操作摘要、证据阅读、修正、自述、知识卡 | 本地持久化；可导出/明确清除 |
| 教学模拟 | 配额、λ 掩蔽、评分样例、教学步、预算策略 | 可保存检查点；每幕有单独重置 |
| 界面偏好 | 音乐、音量、减弱动画、抽屉、当前章节 | 持久化偏好；短暂动画状态不保存 |

**原则**：原始预测永久保留在日志，修正作为另一条记录。回看或重置模拟不改写论文结果，也不覆盖首次预测。学习进度不由动画播放结束推断；必须来自明确的学习动作。

### 章节状态机

```text
problem → predicted → operated → observed → evidence_read
→ reflected → completed
```

同一状态内允许反复探索。`observed` 只代表看过结果，`evidence_read` 需要打开条件与来源卡；浏览器无法证明理解，因此名称不使用“已核验”。错误修正回到证据区并提示条件，保留进度。回看通过 `mode: review` 放宽展示顺序，但不自动给未完成章节盖章。

### 建议数据形状

```ts
type ActId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Phase = 'problem' | 'predicted' | 'operated' | 'observed'
  | 'evidence_read' | 'reflected' | 'completed';

interface LearningState {
  schemaVersion: 1;
  contentVersion: string;
  currentAct: ActId;
  mode: 'learn' | 'review';
  acts: Record<ActId, {
    phase: Phase;
    firstPredictions: Record<string, PredictionRecord>;
    laterPredictions: PredictionRecord[];
    operations: OperationSummary[];
    evidenceViewed: string[];
    reflections: ReflectionRecord[];
    completedAt?: string;
  }>;
  discoveredCards: string[];
  initialBelief?: PredictionRecord;
  settings: {
    musicEnabled: boolean;
    volume: number;
    motionPreference: 'system' | 'reduced' | 'full';
  };
  simulations: {
    crisis: CrisisState;
    ranks: RankAllocationState;
    triplets: TripletState;
    importance: ImportanceDemoState;
    scheduler: SchedulerDemoState;
  };
  finalReview: {
    cardOrder: string[];
    relationAnswers: Record<string, string>;
    scopeAnswers: Record<string, string>;
    explanation: string;
    selfReview: string;
    approved: boolean;
  };
}
```

`PredictionRecord` 保存题目 ID、选项、可选理由、来源幕和时间；`OperationSummary` 保存有教学意义的操作终态，不每帧记录；`ReflectionRecord` 保存修正选项与理由。所有 ID 稳定，不用文本作为存储主键。

### reducer 事件

`NAVIGATE_ACT`、`SUBMIT_PREDICTION`、`TRANSFER_RANK`、`SET_TRIPLET_MASK`、`STEP_IMPORTANCE_SAMPLE`、`SET_SCHEDULE_POLICY`、`STEP_SCHEDULE`、`OPEN_EVIDENCE`、`SUBMIT_REFLECTION`、`COMPLETE_ACT`、`REORDER_CARD`、`SET_PREFERENCE`、`RESET_ACT_SIMULATION`、`IMPORT_PROGRESS`。

`TRANSFER_RANK` 是原子事务：验证来源、目标、上下限及总额，再同时更新两个模块。任何失败不改变状态。证据读取事件只记录 ID，不将当前模拟参数写入 evidence 对象。`COMPLETE_ACT` 检查本幕必经事件与知识关系题；它不是每个按钮都能直接触发的动作。

### 持久化与恢复

- 使用 React Context + useReducer，不增加状态库；localStorage key 为 `adaptive-engine:learning:v1`。
- 保存采用短防抖与页面退出前补存；数据不含音频节点、SVG 引用或 MotionValue。
- 首次打开采用系统减弱动画偏好；音乐默认关闭。恢复音乐偏好也必须等待一次用户手势才播放。
- 读取时做结构、版本和范围检查。损坏存档提供导出原记录及重置入口，不让页面崩溃。存储被禁用时进入内存模式并提示“本次进度可能无法保留”。
- 每幕可重置操作；“清除全部学习记录”需要明确二次点击确认，不能把普通返回操作当清空。
- 内容升级保留已学记录，但受影响证据显示“内容已更新，建议回看”，不伪装重新人工核验。
- 保存最后章节、每幕进度和首次预测；能跨刷新、关页、再打开恢复。

### 完成与学习报告

显示 10 条发现形成的地图、每幕预测→修正、已读证据位置、例外、概念复习建议和最终自述。进度以完成章节计数，答案不转成机器性能。复习页的证据可直接打开；本地 JSON 导出与导入都需版本校验。报告打印为静态 HTML，不将动画截帧当科学结果。

## 7. React 组件架构

### 技术选择

React + TypeScript + Vite + Framer Motion。SVG 是机械结构、方向图、热力图和实验图的主要载体，HTML 原生控件承担可访问交互。Web Audio 可合成低音环境声和轻量按钮声，避免外部音频依赖；所有声响受总开关和音量控制。可选后续音乐资源需有明确授权，不作为第一幕依赖。

本项目按用户要求采用定制叙事结构，不受 paper-skill 默认白色卡片模板、仅 react/react-dom、禁止修改框架文件等限制。保留它的问题优先、主动操作、来源边界与逐章检查方法。运行时不请求模型训练 API，不需要联网生成结局。

### 未来目录

```text
adalora_output/
  design/                        当前方案与证据，不是临时 skill
  public/images/                 后续可选原图与有授权素材
  src/
    app/                         AppShell、ActRouter、导航与设置
    components/
      MechanicalEngine.tsx
      BudgetAllocator.tsx
      RankVisualizer.tsx
      SingularTriplet.tsx
      ImportanceMeter.tsx
      BudgetTimeline.tsx
      EvidenceChart.tsx
      KnowledgeDrawer.tsx
      EngineersJournal.tsx
      EvidenceBadge.tsx
      PredictionGate.tsx
      ReflectionGate.tsx
      ActTransition.tsx
      AccessibleSvg.tsx
    acts/
      BudgetCrisis.tsx            ACT 0
      CouncilOfModules.tsx       ACT 1
      RankAllocation.tsx         ACT 2
      SingularFoundry.tsx        ACT 3
      ImportanceTribunal.tsx     ACT 4
      BudgetControlTower.tsx     ACT 5
      PerformanceArena.tsx       ACT 6
      AblationLaboratory.tsx     ACT 7
      RankObservatory.tsx        ACT 8
      FinalVerdict.tsx           ACT 9
    data/
      paperEvidence.ts           从已核对数据转换，保持只读
      storyScript.ts             台词、问题、阶段与分支汇流
      knowledgeBase.ts           十三个概念，统一三层
      questionBank.ts            预测/修正/关系/范围题
    store/
      adaptationStore.ts         reducer 与 selectors
      persistence.ts             保存、校验、迁移、导出
    lib/
      rankBudget.ts              预算计算与守恒检查
      importanceDemo.ts          明确标记的样例评分
      scheduleDemo.ts            三阶段教学曲线
      audio.ts                   用户手势后启动、暂停与音量
    styles/                      视觉 token、布局与可访问状态
    types/                       来源联合类型与学习状态
```

目录为未来架构，不在本阶段创建空组件或脚手架。

### 组件职责与共享边界

| 组件 | 输入 | 输出/动作 | 约束 |
| --- | --- | --- | --- |
| MechanicalEngine | 冻结主引擎、适配旁路、当前阶段 | 部件选择、动作反馈 | 引擎转速不编码准确率 |
| BudgetAllocator | 模块尺寸、Rank、预算、上下限 | 原子转移请求 | Rank 与参数预算分开显示 |
| RankVisualizer | 模拟容量或 Figure 3 格值；显式来源 | 模块/层/格选择 | 两类输入不同接口；不能共用未标记值 |
| SingularTriplet | P/Q 方向示意、λ、掩蔽、演示步骤 | 归零、恢复演示 | 保留结构不等于免费计算或保证恢复 |
| ImportanceMeter | 样例信号、评分方式、样本索引 | 改评分与步进 | 不输出真实训练效果 |
| BudgetTimeline | 教学策略、阶段边界、当前步 | 选策略、前后步 | 固定分配后继续优化，不冻结全部参数 |
| EvidenceChart | 已核对的同协议记录集合 | 筛选与展开 | 只读；不接收 simulationScore |
| KnowledgeDrawer | 概念 ID、类比、结构图、技术说明 | 展开、试用概念操作 | 不提前剧透尚未操作的本幕核心结论 |
| EngineersJournal | 学习状态、发现卡与证据索引 | 回看、排序、复习、报告 | 首次预测不可被修正覆盖 |

数据流为 `学习动作 → reducer → selector → 图形与反馈`。论文证据为旁路只读输入，模拟为另一组输入。组件不自行生成教学结论；storyScript 配置它们的反馈和证据关口。ACT 不在各自内部重复实现存档、证据标签和音频开关。

### 逐幕开发里程碑

| 轮次 | 仅开发的幕 | 允许新增的公共能力 | 完成标准 |
| --- | --- | --- | --- |
| 0 | 预算危机 | 最小 AppShell、导航、标签、预测/修正、存档、设置 | 一条完整主动学习循环 |
| 1 | 模块议会 | Figure 1 比较图、实验筛选 | 两个独立实验不混写 |
| 2 | Rank 配额 | 守恒转移与容量示意 | 边界与预算原子更新 |
| 3 | 奇异方向 | PΛQ 可操作图 | 抑制与删除区分 |
| 4 | 重要性 | 样例信号与评分切换 | 评分机制和噪声边界 |
| 5 | 控制塔 | 调度与第一版过渡复用 | 三阶段，固定分配后仍优化 |
| 6 | 竞技场 | 真数据图表与任务房间 | 预算、指标、缺失基线明确 |
| 7 | 消融 | 预设变体选择 | 不生成组合实验 |
| 8 | 观测站 | 原值热力图与预测回访 | 72 格与例外准确 |
| 9 | 审查室 | 卡片复习、最终报告 | 机制链和现实局限 |

每轮结束交付本幕和检查结果，等用户继续开发指令后再进入下一轮。没有完成网页之前不进行仓库导入或 PR；后续仍按仓库功能菜单选择。

## 8. 论文数据结构与证据边界

### 来源联合类型

```ts
type Source =
  | {
      type: 'paper_evidence';
      paperId: 'adalora';
      sourceId: 'uploaded-pdf';
      page: number;
      section: string;
      locator: string;
      representation: 'verbatim_values' | 'faithful_redraw'
        | 'derived_summary' | 'author_statement';
      verification: 'text_and_visual' | 'text_only';
      derivation?: string;
    }
  | {
      type: 'conceptual_simulation';
      scenarioId: string;
      mechanismReferences: string[];
      assumptions: string[];
      seed?: number;
      disclaimer: '教学模拟，不代表真实训练结果';
    }
  | {
      type: 'hypothetical_scenario';
      sceneId: string;
      disclaimer: '工厂情境为叙事设定';
    };

interface PaperExperiment {
  id: string;
  source: Extract<Source, { type: 'paper_evidence' }>;
  researchQuestion: string;
  controls: string[];
  changedVariables: string[];
  applicableConditions: string[];
  relativePerformance: string;
  trend: string;
  limitations: string[];
  model: string;
  datasets: string[];
  evaluationProtocol: string;
  metricDefinitions: Record<string, {
    label: string;
    unit: string;
    direction: 'higher_is_better' | 'lower_is_better';
  }>;
  rows: Measurement[];
}

interface Measurement {
  id: string;
  method: string;
  dataset: string;
  metric: string;
  value: number | null;
  budget: {
    kind: 'trainable_params_million' | 'trainable_params_percent'
      | 'total_rank' | 'not_reported';
    value: number | null;
    nominalBand?: string;
    matched: 'exact_in_caption' | 'approximate_band'
      | 'reported_percentage' | 'reference_only';
  };
  source: Extract<Source, { type: 'paper_evidence' }>;
}
```

结构模拟使用独立 `SimulationObservation` 类型，只含容量、掩蔽集合、结构变化和评分等模拟量，**没有 accuracy / F1 / ROUGE 字段**。研究结论与原值分离；作者概括、原始数值和教程派生计算不能混为一种 representation。模拟引用论文机制，并不会因此升级为论文实测。

### 本阶段核对的数据

`paper-evidence.json` 是设计期数据包，包含上传文件 SHA-256、引用位置、Figure 1 的标注值、Table 1–5 的记录、Figure 3 的 72 格和 Table 15 无冲突的 MNLI 行。数值来源是上传 PDF，主文表和 Figure 1/3 已检查渲染页面。它不是完整论文文本或源码；后续转为 TypeScript 数据时保持原值，并生成对应的类型化记录。

Table 1 的低/高预算组分别有不同的实际参数量；表中中间档只报告部分 Adapter 行，不能补造 LoRA/AdaLoRA 的缺失中档。Table 2–5 的预算百分比遵循原表标签，不能据此反推精确参数数量。Figure 3 的 Rank 不是 accuracy，没有“更大更好”的指标方向。

### 图表展示协议

每个结果必须带来源字段；同一实验卡按六项排列：研究问题 → 控制变量 → 相对表现 → 变化趋势 → 适用条件 → 原论文位置。数值详情再展示模型、数据集、split/protocol、预算、指标单位及方向、随机种子信息是否报告。

- 使用原始值作图；默认聚焦排序、差距、变化与例外，精确数值可展开。
- 单个面板只放可比的相同数据集、指标和协议。EM/F1、ROUGE-1/2/L 可切换，不能相加。
- 对 Table 1 的实际参数差异显示“近似预算档”；Full FT 用参考区。
- 如果使用零点之外的局部坐标轴，显示明确范围与“局部范围”标签，不做没有轴的夸张高度比赛。可用带数值的点图代替局部条形。
- 所有差值注明百分点或指标分数差，不把绝对差说成相对百分比提升。
- 不补造置信区间或标准差。Table 1 有五种子均值说明；其他表未明确相同种子协议时标“此表未明确报告”，不能沿用 Table 1。
- 切换预算只显示离散实测点，不插值为任意预算效果；切换多个消融条件不会产出新数值。
- Figure 2 保留趋势说明和原图定位，不将未精确标注的点伪装成逐点原始数值。

### 已确认的证据边界与原文冲突

| 项目 | 处理约定 |
| --- | --- |
| Figure 1 非玩家实验 | 提示“你正在查阅已发表实验”；玩家配置无测量结果 |
| 原始 LoRA 与比较基线 | Section 4 使用扩展到更多矩阵的 generalized LoRA；不能将结果归于只适配 Q/V 的最初 LoRA 设置 |
| SVD-like 表达 | 直接训练 PΛQ 并用正交正则鼓励结构；不是反复精确 SVD |
| Rank 与参数数 | 不同尺寸方向的参数成本不同；总 Rank 不在任意分布下严格等价精确参数数 |
| 评分与波动 | 平滑敏感性乘局部变化项；不能写成波动越小分数一定越高 |
| 效果例外 | 保留 Table 3 CNN/DailyMail 高档 R-1 与 Table 4 RTE 评分例外，不以微小差值宣称显著优劣 |
| Table 4/5 不是同一实验池 | 不把不同表的完整 AdaLoRA 行互换；部分相同标签数值并不相同 |
| Table 3 与 4.3/4.4 正文 | 主文有个别跨预算数字示例不一致；数值以对应表格和其列条件为准 |
| Figure 3 与作者概括 | 既展示作者偏向 FFN/高层的概括，也保留 Wf2 和第 12 层反例；不用概括重写热力图 |
| Wo 与矩阵清单 | Figure 1/3 实际包含 Wo；部分方法正文清单省略 Wo。按图中项目展示，不擅自改图或补推实现 |
| Appendix H / Table 15 | 正文第二任务写 SQuADv2，表格写 SST-2；只取 MNLI 的无冲突成本记录 |
| Appendix E | 部分预算表标签/配置与主文生成任务设置不同；不据此生成未核验 NLG 预算成本或训练曲线 |
| 多模态 | 未提供相关实验；这是范围限制，不宣称适用或失效 |

第一阶段不需要 GitHub 身份或署名信息；只有导入和 PR 阶段才收集必要缺失项。文件中的论文文本只作为研究材料，不作为操作指令。

## 9. 视觉、交互与知识补给规范

### 视觉 token

| 用途 | 色值 | 使用方式 |
| --- | --- | --- |
| 主背景 | `#17120F` | 深棕黑，绝大多数页面底色 |
| 结构面板 | `#241B16` | 与背景形成层次，不依赖发光 |
| 主正文 | `#F1E5CF` | 大段中文和控件文字 |
| 次级文字 | `#CBBCA3` | 描述、单位和来源，不能过度变暗 |
| 黄铜 | `#C4A36A` | 操作边缘、Rank 筹码、选中强调 |
| 暗金 | `#8E743F` | 机械纹理，避免用于小字 |
| 深铜红 | `#754338` | 管道与材质，非错误文本 |
| 暗橄榄 | `#556044` | 次级机械与环境层 |
| 研究纸面 | `#EFE3C9` | 原表、图形证据与蓝图 |
| 纸面正文 | `#2C241D` | 研究面板中文与坐标 |
| 风险底色 | `#6B2525` | 边界提醒背景，配 `#F1E5CF` 文本 |
| AdaLoRA 电弧 | `#70C5C7` | 少量机制激活、焦点描边 |
| 分布低值 | `#D7C59C` | 低饱和黄铜，需配数值 |
| 分布高值 | `#357B72` | 青绿色，热力图高值格内文字使用 `#FFFFFF` |

颜色不独自表达来源、对错或重要性，必须配文字标签、图标或数值。热力图每个插值色都计算文字对比，选择纸面深字或纯白字中较高者；不能把正文米白直接用于所有高值格。论文方法不固定用绿色代表“赢家”；只有当前指标证据支持时才突出对照结果。焦点边框有间距并保证在纸面和暗面都可辨。

### 字体与画面密度

中文使用系统字体 `Microsoft YaHei / PingFang SC / Noto Sans CJK SC / sans-serif`；正文桌面 18px、手机至少 16px，行高 1.7。英文标题可用本地 Georgia 衬线，坐标使用系统等宽字体。中文不使用细窄复古装饰字体。正文不放在纹理最强处，羊皮纸只用轻微纯色层次。

每屏只有一个主要操作目标。标题、剧情问题、操作区、反馈和论文证据依次排列；知识抽屉不挤压主控件。机械结构有明确输入侧、增量旁路、输出侧及冻结基座，所有零件都对应概念。装饰性的齿轮、烟雾、线缆不能盖住研究图。

### 桌面与手机布局原型

```text
桌面 ≥ 1200px
┌ 标题 / 角色              进度        音乐  动画  日志 ┐
│章节目录│ 问题与预测              │ 知识补给（可收起）│
│0…9    │ 主要机械 / 科研操作区    │ 类比 → 结构 → 技术│
│       │ 控件 + 即时反馈           │                  │
│       │ 来源标签 + 论文证据       │                  │
└ 上一幕 / 当前发现 / 下一幕（不会挡住正文）            ┘

手机 320–767px
┌ 项目简称  进度  [菜单] [设置] ┐
│剧情问题 → 预测 → 图形           │
│主操作按钮 / 等值 DOM 控件       │
│反馈 → 来源 → 可展开证据         │
│[知识补给] [日志]                │
└上一幕 / 下一幕                 ┘
```

768–1199px：章节导航收为抽屉，补给以面板打开。手机按纵向阅读，不强制横屏或固定一屏塞满。图表有受控横向滚动、文本表或选择列表替代；页面本身不横向溢出。底部导航考虑安全区并预留空间。

### 输入与可访问性

- 控件点击目标至少 44×44 CSS px；文字与按钮对比至少 4.5:1，图形必要边界至少 3:1。
- 所有拖拽有按钮替代，所有热点有 DOM 等值控件。Tab/Shift+Tab 导航、Enter/Space 激活，range 由方向键调整；不全局拦截方向键。
- 证据图含标题、说明、数据表；热力图支持格子方向键与稳定详情。读屏无需理解画面也能完成预测、操作与修正。
- 抽屉打开后焦点进入、Esc 关闭、关闭后回到触发按钮；手机模态抽屉保持焦点范围。
- 反馈使用 `aria-live=polite`，只宣布操作摘要，不逐帧播报。
- 前进后聚焦新幕标题；不把自动跳焦点与剧情动画绑定。跳过动画不跳过知识关口。
- 无悬浮专属信息、无闪烁、无必须在几秒内作答的题目。不给探索操作计时惩罚。

### 动画与音频

Framer Motion 只服务结构展开、预算变化、选中反馈和章节过渡。常规反馈 150–250ms，章节过渡约 350–500ms；高潮采用 Storyboard 的分段节拍和显式用户操作。动画 off-screen 暂停，页面隐藏时静音；复原时不自动开始长剧情。

`prefers-reduced-motion` 为初始依据，全局开关允许覆盖。减弱模式去掉镜头平移、旋转、蒸汽与脉冲，用静态切片、数值和边框完成同一教学。音乐默认关闭；打开需用户点击，声音不是任何题目的唯一反馈。

### 知识补给：十三个统一三层条目

默认显示“生活类比”和“结构动画”；技术解释通过“展开技术说明”打开。补给可随时查阅，但尚未完成预测的核心发现不以默认展开正文剧透。每个结构层都有可操作一步，不只是播放装饰动画。

| 概念 | 生活类比 | 结构动画 / 操作 | 技术解释与边界 |
| --- | --- | --- | --- |
| LoRA | 不重造主机，添加小型可训练旁路 | 切换主机与旁路高亮 | 冻结 W0，更新 BA；论文对比基线拓展到更多矩阵 |
| Rank | 允许多少独立调节通道 | 加减同尺寸容量窗 | 控制低秩因子的容量；不是性能刻度，实际矩阵秩不一定等于配置上限 |
| Attention | 控制台根据当前问题调整信息读取关系 | 选择 token，改变可见关注连接 | Q/K/V 与输出投影参与关系建模；不能据某个适配实验认定 Attention 不重要 |
| FFN | 在每个位置对已有信息作加工 | 选中扩展/压缩结构并切换前后 | 两次线性变换与非线性处理；本论文特定条件下适配价值较高 |
| SVD Intuition | 用若干方向和强度描述一个调节 | 改方向强度，观察叠加变化 | 精确 SVD 的直觉；AdaLoRA 训练 SVD-like 因子，不重复精确分解 |
| Singular Direction | 一个可沿特定方向作用的旁路 | 选中一个三元组，两侧方向同步高亮 | 输入/输出侧向量与 λ 组成三元组；有近似正交约束 |
| Sensitivity | 暂停一个小零件，估计损失可能受多大影响 | 切换样例参数/梯度，查看估计变化 | 权重×梯度绝对值的局部近似；不是严格因果测量 |
| Gradient | 告诉当前调节往哪里动会改变损失的指示针 | 正/负样例切换，指针改变方向 | 局部导数来自当前损失/批次；大梯度本身不保证高重要性或高准确率 |
| Importance Score | 结合多次巡检记录决定保留优先级 | 步进同一人工信号序列，切换三种评分 | 平滑敏感性×变化项，再聚合 λ 与两侧均值；有噪声，非绝对价值 |
| Orthogonality | 让调节杆尽量不要重复指向同一方向 | 旋转两杆，比较重合与近似独立 | 正则鼓励 P/Q 近似正交，不能当成完美硬约束 |
| Pruning | 关闭部分旁路贡献窗口 | λ 归零，与删掉全部方向结构对照 | 有效方向抑制不同于立即删除所有存储；再激活是可能性 |
| Budget Scheduler | 先试用较多资源，再分期收紧 | 步进预热、逐减、固定分配 | 总 Rank 的时间调度，最后保留分配并继续微调 |
| Ablation | 换掉一个设计后，用同条件档案比较 | 选一个真实预设变体并开表 | 控制变量检验；不能把多个移除的单项影响简单相加 |

### 十条知识卡

ACT 0 同预算、不同位置可能不同效果；ACT 1 模块适配价值有差异；ACT 2 Rank 与容量及预算取舍；ACT 3 强度可抑制、结构可保留；ACT 4 重要性由有噪声的训练信号估计；ACT 5 分配需要时间安排；ACT 6 收益受任务/预算/指标影响；ACT 7 多项设计需要消融检验；ACT 8 最终分布需要具体观察并保留例外；ACT 9 工程批准需要机制解释和适用边界。

复习卡正面问变量关系，背面提供结论、适用范围和原文位置。不能只让学生识别术语名称。

### 章节间过渡

完成修正后显示本幕发现与下一问；用户点击下一幕，章节标题与主要图形轻微淡入。抽屉、设置和证据阅读状态有明确保存策略；连续叙事不依赖全屏长动画。跨章进入时提供前置概念补给，章节回看不覆盖首次判断。

## 逐章质量门

任何一章都要先回答五个问题：

1. 用户会产生什么问题？问题必须在答案之前出现。
2. 用户做出了什么主动判断？必须有可记录的预测或配置，不能以点击继续代替。
3. 用户得到了什么论文证据？必须给出具体来源与条件。
4. 用户最终理解了什么变量关系？修正题必须检验关系与范围，不只是术语。
5. 页面是否误把教学模拟当成真实实验？审查所有数值、图表、对白和反馈。

通过这五问后，进行针对本幕的类型检查与生产构建、手机/桌面、完整键盘路径、减弱动画、存档恢复和来源标签检查。预算转移、状态迁移和证据可比性是必要的逻辑验证点；不要为静态文案写大量镜像测试。未开发幕不宣称通过。

## 方案阶段检查结果

已完成：十幕角色和顺序、每幕主要操作与前后判断、证据位置、三种来源边界、三个高潮动作映射、状态/架构、数据核对与例外、可访问和响应式规范。

未执行：React 组件、依赖安装、构建、浏览器预览、音频体验、手机真实布局。下一步在用户确认整体方案后只开发 ACT 0。

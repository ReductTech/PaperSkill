// ============================================================
// 旧版教程（paperjury_tutorial）移入组件的全部数据
// 测验 10 道 / 漫画 4 张 / 交互动画 2 个 / 符号 17 个 /
// 论文图表索引 11 项 / 实验数据（Table 2/4/5、Figure 5）
// 数据均来自论文 arXiv:2606.16322 与旧教程原文，未改动数值
// ============================================================
import type {
  Quiz, Comic, InteractiveAnimation, FigureItem, SymbolItem,
} from './legacyTypes';

// ===================== 测验（10 道，6 种题型） =====================
export const QUIZZES: Quiz[] = [
  {
    id: 'q1',
    type: 'single',
    position: 'opening',
    difficulty: 1,
    question: '根据论文，PaperJury 的核心设计原则是什么？',
    options: [
      { key: 'A', text: '使用更大的语言模型作为唯一裁判，提高审稿质量', isCorrect: false, errorType: '曲解文意', explanation: '论文明确反对将安全关键决策交给单个语义模型，LLM-as-a-Judge存在已知的偏见和不稳定性。' },
      { key: 'B', text: '确定性编排与语义推理严格分离，模型仅做有界的阅读和判断', isCorrect: true, explanation: '这是论文的central design principle：所有必须跨运行一致的操作由确定性代码处理，语言模型仅用于有界任务。' },
      { key: 'C', text: '完全自动化论文写作，从摘要到实验一气呵成', isCorrect: false, errorType: '无中生有', explanation: 'PaperJury是预提交强化系统，不是从零写作工具。论文明确说"not a from-scratch drafter"。' },
      { key: 'D', text: '仅关注语法和拼写错误，不涉及论证层面', isCorrect: false, errorType: '缩小范围', explanation: 'PaperJury恰恰关注跨章节的深层论证问题，而非表面的语法拼写。' },
    ],
    analysis: '本题考查论文核心设计原则的识记。判据：论文§1和§3明确提出"a strict separation between deterministic control and semantic reasoning"。正确项B准确复述了这一原则。A曲解了论文对LLM-as-Judge的批判立场；C无中生有，PaperJury不做从零写作；D缩小了范围，论文关注的是论证健全性而非表面错误。',
    paperAnchor: '§1 Introduction, p.2; §3 Method, p.3',
  },
  {
    id: 'q2-judge',
    type: 'judge',
    position: 'opening',
    difficulty: 1,
    question: '判断：PaperJury 中语言模型完全不参与审稿过程，所有工作都由确定性代码完成。',
    options: [
      { key: 'T', text: '正确', isCorrect: false, errorType: '曲解文意', explanation: '论文明确说"The model still does the hard reading"——模型仍然做最难的阅读工作，只是不握法槌和橡皮。确定性代码负责路由、裁决计算、停止判定和精确一次编辑。' },
      { key: 'F', text: '错误', isCorrect: true, explanation: '模型负责阅读、判断和起草（像陪审团和辩护人），确定性代码负责程序控制、裁决计算、停止判定和精确一次编辑（像法官和法警）。两者是分离而非替代关系。' },
    ],
    analysis: '本题考查对确定性-语义分离的准确理解。判据：论文§1"the model still does the hard reading; it no longer holds the gavel or the eraser"。分离不等于模型不参与，而是模型不做安全关键决策。说"完全不参与"是曲解文意。',
    paperAnchor: '§1 Introduction, p.2; §3.1, p.3',
  },
  {
    id: 'q3',
    type: 'single',
    position: 'middle',
    difficulty: 2,
    question: '关于"冻结主张主线"（frozen claim spine），下列说法正确的一项是？',
    options: [
      { key: 'A', text: '它禁止对论文做任何修改，包括措辞和格式', isCorrect: false, errorType: '绝对化', explanation: '冻结主张主线只保护claim-level承诺，机器编辑可以repair support、wording或local organization，并非禁止一切修改。' },
      { key: 'B', text: '它在修订前提取，记录论文的核心主张，防止编辑悄悄改变主张', isCorrect: true, explanation: '论文§3.3明确：S是"the protected semantic backbone for later guard decisions"，编辑可修措辞但不能silently alter claim-level commitments。' },
      { key: 'C', text: '它由语义模型在每轮审稿后动态更新', isCorrect: false, errorType: '张冠李戴', explanation: '主张主线是在修订前一次性提取并冻结的确定性结构，不由语义模型动态更新。动态更新的是账本L。' },
      { key: 'D', text: '它的主要作用是提高审稿的召回率', isCorrect: false, errorType: '因果倒置', explanation: '冻结主张主线的作用是保障编辑安全（防止主张漂移），与召回率无直接因果关系。' },
    ],
    analysis: '本题考查对冻结主张主线机制的理解。判据：论文§3.3"The frozen claim spine is the protected semantic backbone... machine edits may repair support, wording, or local organization, but they must not silently alter claim-level commitments"。B准确复述。A绝对化——并非禁止一切修改；C张冠李戴——主线是确定性冻结的，不是模型动态更新；D因果倒置——主线保障安全而非提高召回。',
    paperAnchor: '§3.3, p.4; §3.4, p.6',
  },
  {
    id: 'q4',
    type: 'single',
    position: 'middle',
    difficulty: 2,
    question: '在可争议性路由（contestability routing）中，什么样的问题会进入正当程序审判（due-process trial）？',
    options: [
      { key: 'A', text: '所有被审稿人提出的问题都进入审判', isCorrect: false, errorType: '扩大范围', explanation: '并非所有问题都进入审判。机械性和次要实质性问题走低成本polish路径。' },
      { key: 'B', text: '可争议的实质性重大问题（contestable substantive-major）', isCorrect: true, explanation: '论文§3.3明确："contestable substantive-major issues enter a due-process trial"。' },
      { key: 'C', text: '仅机械性问题（如拼写错误）', isCorrect: false, errorType: '张冠李戴', explanation: '机械性问题恰恰走polish路径，不进入审判。' },
      { key: 'D', text: '作者要求重新审议的问题', isCorrect: false, errorType: '无中生有', explanation: '路由是确定性规则，不由作者要求触发。author-required是裁决结果，不是路由条件。' },
    ],
    analysis: '本题考查确定性路由规则。判据：论文§3.3"Mechanical and minor-substantive issues follow a lower-cost polish path, while contestable substantive-major issues enter a due-process trial"。B准确。A扩大范围——并非所有问题都审判；C张冠李戴——机械性问题走polish；D无中生有——路由是确定性的，不由作者触发。',
    paperAnchor: '§3.3, p.4-5; Figure 3, p.5',
  },
  {
    id: 'q5-sort',
    type: 'sort',
    position: 'middle',
    difficulty: 2,
    question: '请将 PaperJury 完整流水线的步骤按正确顺序排列：',
    sortItems: [
      { id: 's1', text: '确定性分解 D(x)：将论文切分为章节/段落/锚点/交叉引用', correctOrder: 0 },
      { id: 's2', text: '提取冻结主张主线 S，建立持久账本 L', correctOrder: 1 },
      { id: 's3', text: '有界整体审稿：全文辩护+局部陪审团，合并去重问题', correctOrder: 2 },
      { id: 's4', text: '确定性路由：机械/次要走polish，可争议重大问题进入审判', correctOrder: 3 },
      { id: 's5', text: '正当程序审判：辩护方陈述→陪审团投票→quorum+majority裁决', correctOrder: 4 },
      { id: 's6', text: '守卫修订：补丁经守卫链检查→精确一次应用→账本记录', correctOrder: 5 },
      { id: 's7', text: '收敛判定：确定性谓词τ检查账本，满足则停止，否则下一轮', correctOrder: 6 },
    ],
    analysis: '本题考查对PaperJury完整流水线时序的理解。正确顺序：①确定性分解（创建稳定寻址单元）→②提取主张主线+账本（建立参照系）→③有界审稿（发现问题）→④确定性路由（分配处理路径）→⑤正当程序审判（可争议问题的裁决）→⑥守卫修订（安全编辑）→⑦收敛判定（停止或继续）。这个顺序体现了"先建立确定性基础，再调用语义模型，最后确定性收尾"的设计哲学。',
    paperAnchor: '§3.3-3.4, p.4-6; Figure 2, p.4',
  },
  {
    id: 'q6-judge',
    type: 'judge',
    position: 'middle',
    difficulty: 2,
    question: '判断：在正当程序审判中，辩护律师和陪审团共享同一上下文，以便充分交流信息、达成共识。',
    options: [
      { key: 'T', text: '正确', isCorrect: false, errorType: '曲解文意', explanation: '恰恰相反，论文强调陪审团是"decorrelated local-context jury"（去相关的局部上下文陪审团），与全文辩护方隔离，以避免锚定效应。' },
      { key: 'F', text: '错误', isCorrect: true, explanation: '辩护方用全文上下文论证指控不成立，陪审团仅看局部证据独立投票，两者互不见面（decorrelated）。这种隔离是为了防止陪审团被辩护方的论证锚定，保证裁决的独立性。' },
    ],
    analysis: '本题考查对正当程序审判核心机制的理解。判据：论文§3.3"a whole-paper defense argues against the charge while a decorrelated local-context jury evaluates it using localized evidence"。去相关（decorrelated）是关键设计——隔离上下文才能避免锚定，保证陪审团独立判断。说"共享上下文、达成共识"完全曲解了设计意图。',
    paperAnchor: '§3.3, p.5; Figure 3, p.5',
  },
  {
    id: 'q7',
    type: 'single',
    position: 'ending',
    difficulty: 3,
    question: '根据论文实验结果（表2），下列说法正确的一项是？',
    options: [
      { key: 'A', text: 'Naive unbounded generator 的召回率最高，因此整体性能最好', isCorrect: false, errorType: '以偏概全', explanation: 'Naive generator召回率最高(0.721)但精确率最低(0.341)，F1仅0.459，且成本最高(8.37h, 31.4M tokens)，不能说整体最好。' },
      { key: 'B', text: 'PaperJury 的编辑安全违规率(ESVR)为 0.025，是 LLM-as-Judge Loop 的约 1/4.4', isCorrect: true, explanation: '表2显示PaperJury ESVR=0.025，Judge Loop ESVR=0.110。0.110/0.025=4.4，论文§4.3也明确说"4.4× lower (4/161 vs 19/172)"。' },
      { key: 'C', text: 'LLM-as-Judge Loop 在所有 12 篇论文上都达到了收敛', isCorrect: false, errorType: '绝对化', explanation: '表2显示Judge Loop的K=3.33±1.07，且有2/12篇触达五轮上限，说明并非全部收敛。' },
      { key: 'D', text: 'Forward-only rewriter 因为不生成问题列表，所以 F1 最高', isCorrect: false, errorType: '因果倒置', explanation: 'Forward-only不生成问题列表所以F1为n/a（无法计算），不是最高。论文明确说它"produces no issue list, hence no F1"。' },
    ],
    analysis: '本题考查对实验数据的综合理解和推断。判据：表2数据。B项可由0.110÷0.025=4.4验证，且论文原文明确表述。A以偏概全——高召回不等于整体好，还要看精确率和成本；C绝对化——2/12触顶说明未全部收敛；D因果倒置——n/a是无法计算而非最高。',
    paperAnchor: '§4.3 Results, Table 2, p.7-8',
  },
  {
    id: 'q8',
    type: 'single',
    position: 'ending',
    difficulty: 3,
    question: '根据消融实验（表6），移除哪个组件导致编辑安全违规率（ESVR）上升最多？',
    options: [
      { key: 'A', text: '移除有界审稿（w/o bounded review）', isCorrect: false, errorType: '张冠李戴', explanation: '移除有界审稿导致F1下降最多(-0.077)，但ESVR仅+0.013，不是安全退化最大的。' },
      { key: 'B', text: '移除确定性路由（w/o routing）', isCorrect: false, errorType: '张冠李戴', explanation: '移除路由主要损害裁决一致性(-0.075 Acc_v)并增加成本(2.43→3.49h)，ESVR+0.018。' },
      { key: 'C', text: '移除守卫链（w/o guard chain）', isCorrect: true, explanation: '表6显示移除守卫链后ESVR从0.029升至0.181，ΔESVR=+0.152，是所有消融中安全退化最大的。论文§4.3明确说"the largest safety degradations from removing the guard chain (+0.152 ESVR)"。' },
      { key: 'D', text: '移除正当程序审判（w/o trial）', isCorrect: false, errorType: '张冠李戴', explanation: '移除审判导致裁决一致性下降最多(-0.153 Acc_v)，但ESVR仅+0.023。' },
    ],
    analysis: '本题考查消融实验的精细解读和组件-功能对应。判据：表6数据。移除守卫链ΔESVR=+0.152（0.029→0.181），是最大的安全退化。A移除有界审稿影响F1最大；B移除路由影响裁决和成本；D移除审判影响裁决一致性最大。每个组件的退化模式与其功能对应：守卫链直接负责编辑安全，移除后安全退化最大。',
    paperAnchor: '§4.3, Table 6, p.8-9',
  },
  {
    id: 'q9',
    type: 'single',
    position: 'ending',
    difficulty: 3,
    question: '关于 PaperJury 的设计哲学，下列推断最合理的一项是？',
    options: [
      { key: 'A', text: 'PaperJury 认为语言模型的能力不足，应尽量减少模型参与', isCorrect: false, errorType: '曲解文意', explanation: '论文并未否定模型能力，而是说"The model still does the hard reading"——模型仍然做最难的阅读工作，只是不握法槌和橡皮。减少的是模型在安全关键决策上的裁量权。' },
      { key: 'B', text: 'PaperJury 主张安全关键的逻辑应放在确定性编排中，而非模型的自由裁量', isCorrect: true, explanation: '论文摘要明确说"supporting the thesis that load-bearing safety and completion logic should reside in deterministic orchestration rather than model discretion"。这是全文的核心论点。' },
      { key: 'C', text: 'PaperJury 的三向裁决空间说明大多数问题都需要作者手动处理', isCorrect: false, errorType: '无中生有', explanation: '三向空间是为了区分"不成立""成立可修""成立需作者"，表3显示valid-fixable占比最大(73/167)，author-required仅51/167，不能说"大多数需要作者手动处理"。' },
      { key: 'D', text: 'PaperJury 仅适用于 NLP 领域的论文，对 Vision 和 ML 效果不佳', isCorrect: false, errorType: '缩小范围', explanation: '表4显示三个领域(Vision/NLP/ML)的所有指标都在汇总值的0.03以内，说明效果跨领域稳定，并非仅适用于NLP。' },
    ],
    analysis: '本题考查对论文设计哲学的综合推断。判据：摘要的thesis statement。B项准确复述了论文核心论点"load-bearing safety and completion logic should reside in deterministic orchestration rather than model discretion"。A曲解——模型仍做hard reading，只是不做安全关键决策；C无中生有——数据不支持"大多数需作者处理"；D缩小范围——表4证明跨领域稳定。',
    paperAnchor: 'Abstract, p.1; §4.3 Table 3-4, p.8',
  },
  {
    id: 'q10-match',
    type: 'match',
    position: 'ending',
    difficulty: 3,
    question: '请将 PaperJury 的组件与其在消融实验中移除后的主要退化效应进行匹配：',
    matchPairs: [
      { leftId: 'm1', leftText: '守卫链（Guard Chain）', rightId: 'r1', rightText: 'ESVR 飙升 +0.152（编辑安全最大退化）' },
      { leftId: 'm2', leftText: '正当程序审判（Trial）', rightId: 'r2', rightText: '裁决一致性 Acc_v 下降 -0.153（最大裁决退化）' },
      { leftId: 'm3', leftText: '有界审稿（Bounded Review）', rightId: 'r3', rightText: 'F1 下降 -0.077 且时间翻倍至 4.81h' },
      { leftId: 'm4', leftText: '确定性路由（Routing）', rightId: 'r4', rightText: 'Acc_v -0.075 且成本从 2.43h 升至 3.49h' },
      { leftId: 'm5', leftText: '冻结主张主线（Claim Spine）', rightId: 'r5', rightText: 'ESVR +0.083（编辑可能悄悄改变主张）' },
    ],
    analysis: '本题考查组件功能与消融退化模式的对应关系。判据：表6数据。守卫链负责编辑安全→移除后ESVR飙升最多(+0.152)；正当程序审判负责裁决质量→移除后Acc_v下降最多(-0.153)；有界审稿控制审稿范围和成本→移除后F1降且时间翻倍；确定性路由分配审判资源→移除后裁决降且成本升；主张主线保护核心主张→移除后编辑可能漂移导致ESVR升(+0.083)。每个组件的退化模式直接反映其功能定位。',
    paperAnchor: '§4.3, Table 6, p.8-9',
  },
];

// 按章节挂载测验（chapterId -> 题目 id 列表）
export const QUIZ_IDS_BY_CHAPTER: Record<string, string[]> = {
  'chap-1': ['q1', 'q2-judge'],
  'chap-4': ['q3'],
  'chap-6': ['q4'],
  'chap-7': ['q6-judge'],
  'chap-9': ['q5-sort'],
  'chap-10': ['q7', 'q8', 'q9', 'q10-match'],
};

// ===================== 漫画（4 张） =====================
export const COMICS: Comic[] = [
  {
    id: 'comic1',
    title: '角色表：法庭上的五位角色',
    caption: '法官=确定性编排，陪审团=局部上下文，辩护方=全文辩护，守卫=安检，书记员=持久账本',
    imagePath: '/images/comics/01-characters.png',
    concept: '确定性-语义分离的角色映射',
  },
  {
    id: 'comic2',
    title: '开庭：论文进入审判庭',
    caption: '一篇LaTeX论文被带上法庭，法官敲下法槌，宣布预提交强化审判开始',
    imagePath: '/images/comics/02-court-opening.png',
    concept: '预提交强化的整体场景',
  },
  {
    id: 'comic3',
    title: '正当程序审判：辩护方 vs 陪审团',
    caption: '辩护律师从全案角度论证指控不成立，陪审团聚焦局部证据独立投票，两者互不见面',
    imagePath: '/images/comics/03-due-process-trial.png',
    concept: '全文辩护 vs 去相关局部陪审团',
  },
  {
    id: 'comic4',
    title: '守卫关卡：补丁过安检',
    caption: '一个编辑补丁经过锚点、引用、语义、编译四道安检，危险补丁被挡回，安全补丁精确一次落地',
    imagePath: '/images/comics/04-guard-chain.png',
    concept: '风险比例守卫链与精确一次应用',
  },
];

// 按章节挂载漫画
export const COMIC_IDS_BY_CHAPTER: Record<string, string[]> = {
  'chap-1': ['comic1', 'comic2'],
  'chap-7': ['comic3'],
  'chap-8': ['comic4'],
};

// ===================== 交互动画（2 个） =====================
export const ANIMATIONS: InteractiveAnimation[] = [
  {
    id: 'anim-pipeline',
    title: 'PaperJury 完整流水线交互式演示',
    description: '从论文分解到收敛停止的完整 review-verdict-revise-verify 流程，点击播放或逐步查看',
    concept: '完整系统流水线',
    steps: [
      {
        title: '第1步：确定性分解',
        description: '论文被确定性代码 D(x) 切分为章节、段落、锚点和交叉引用，创建稳定可寻址单元。此步骤不调用语言模型。',
        elements: [
          { id: 'paper', label: '论文 LaTeX', x: 12, y: 50, type: 'box', state: 'done' },
          { id: 'decompose', label: '确定性分解 D(x)', x: 35, y: 50, type: 'box', state: 'active' },
          { id: 'units', label: '可寻址单元', x: 58, y: 50, type: 'box', state: 'pending' },
          { id: 'model', label: '语义模型', x: 82, y: 50, type: 'circle', state: 'pending' },
        ],
        connections: [{ from: 'paper', to: 'decompose', label: '输入' }],
      },
      {
        title: '第2步：冻结主张主线 + 建立账本',
        description: '提取论文核心主张形成冻结主线 S（编辑不可改主张），同时建立持久账本 L 记录每个问题的身份和状态。',
        elements: [
          { id: 'paper', label: '论文 LaTeX', x: 12, y: 30, type: 'box', state: 'done' },
          { id: 'decompose', label: '确定性分解 D(x)', x: 35, y: 30, type: 'box', state: 'done' },
          { id: 'units', label: '可寻址单元', x: 58, y: 30, type: 'box', state: 'done' },
          { id: 'spine', label: '冻结主张主线 S', x: 30, y: 75, type: 'diamond', state: 'active' },
          { id: 'ledger', label: '持久账本 L', x: 65, y: 75, type: 'diamond', state: 'active' },
          { id: 'model', label: '语义模型', x: 82, y: 30, type: 'circle', state: 'pending' },
        ],
        connections: [
          { from: 'units', to: 'spine', label: '提取主张' },
          { from: 'units', to: 'ledger', label: '初始化' },
        ],
      },
      {
        title: '第3步：有界整体审稿',
        description: '语言模型以有界方式阅读论文：全文辩护方论证指控不成立，局部陪审团评估证据。两者去相关，防止互相污染。',
        elements: [
          { id: 'paper', label: '论文 LaTeX', x: 8, y: 25, type: 'box', state: 'done' },
          { id: 'decompose', label: '分解+主线+账本', x: 30, y: 25, type: 'box', state: 'done' },
          { id: 'defense', label: '全文辩护方', x: 55, y: 20, type: 'circle', state: 'active' },
          { id: 'jury', label: '局部陪审团', x: 55, y: 70, type: 'circle', state: 'active' },
          { id: 'issues', label: '问题列表', x: 80, y: 45, type: 'box', state: 'pending' },
        ],
        connections: [
          { from: 'decompose', to: 'defense', label: '全文上下文' },
          { from: 'decompose', to: 'jury', label: '局部证据' },
          { from: 'defense', to: 'issues', label: '合并去重' },
          { from: 'jury', to: 'issues', label: '合并去重' },
        ],
      },
      {
        title: '第4步：确定性路由',
        description: '每个问题按确定性规则路由：机械性和次要问题走低成本 polish 路径；可争议的实质性重大问题进入正当程序审判。',
        elements: [
          { id: 'issues', label: '问题列表', x: 12, y: 50, type: 'box', state: 'done' },
          { id: 'router', label: '确定性路由', x: 35, y: 50, type: 'diamond', state: 'active' },
          { id: 'polish', label: 'Polish 路径', x: 60, y: 25, type: 'box', state: 'pending' },
          { id: 'trial', label: '正当程序审判', x: 60, y: 75, type: 'box', state: 'pending' },
        ],
        connections: [
          { from: 'issues', to: 'router', label: '每个问题' },
          { from: 'router', to: 'polish', label: '机械/次要' },
          { from: 'router', to: 'trial', label: '可争议重大' },
        ],
      },
      {
        title: '第5步：正当程序审判',
        description: '可争议问题进入审判：辩护方陈述 → 陪审团投票 → 代码用 quorum+majority 规则计算裁决 → 三向结果（invalid-drop / valid-fixable / author-required）。',
        elements: [
          { id: 'trial', label: '正当程序审判', x: 15, y: 50, type: 'box', state: 'done' },
          { id: 'defense2', label: '辩护方陈述', x: 38, y: 25, type: 'circle', state: 'active' },
          { id: 'jury2', label: '陪审团投票', x: 38, y: 75, type: 'circle', state: 'active' },
          { id: 'verdict', label: '代码计算裁决', x: 62, y: 50, type: 'diamond', state: 'pending' },
          { id: 'result', label: '三向结果', x: 85, y: 50, type: 'box', state: 'pending' },
        ],
        connections: [
          { from: 'trial', to: 'defense2' },
          { from: 'trial', to: 'jury2' },
          { from: 'defense2', to: 'verdict' },
          { from: 'jury2', to: 'verdict' },
          { from: 'verdict', to: 'result', label: 'quorum+majority' },
        ],
      },
      {
        title: '第6步：守卫修订',
        description: 'valid-fixable 的问题生成补丁，经风险比例守卫链检查（锚点边界、交叉引用、语义审计、编译），通过后精确一次应用并记录到账本。',
        elements: [
          { id: 'fixable', label: 'valid-fixable', x: 10, y: 50, type: 'box', state: 'done' },
          { id: 'patch', label: '生成补丁', x: 30, y: 50, type: 'box', state: 'active' },
          { id: 'guard', label: '守卫链检查', x: 52, y: 50, type: 'diamond', state: 'pending' },
          { id: 'apply', label: '精确一次应用', x: 75, y: 50, type: 'box', state: 'pending' },
          { id: 'ledger2', label: '账本记录', x: 75, y: 80, type: 'diamond', state: 'pending' },
        ],
        connections: [
          { from: 'fixable', to: 'patch' },
          { from: 'patch', to: 'guard', label: '风险比例' },
          { from: 'guard', to: 'apply', label: '通过' },
          { from: 'apply', to: 'ledger2', label: '记录' },
        ],
      },
      {
        title: '第7步：收敛判定',
        description: '确定性谓词 τ 检查账本：所有问题已关闭且无新问题则收敛停止；否则进入下一轮审稿-裁决-修订循环。最多5轮。',
        elements: [
          { id: 'ledger3', label: '持久账本 L', x: 15, y: 50, type: 'diamond', state: 'done' },
          { id: 'tau', label: '收敛谓词 τ', x: 40, y: 50, type: 'diamond', state: 'active' },
          { id: 'stop', label: '收敛停止', x: 65, y: 25, type: 'box', state: 'pending' },
          { id: 'loop', label: '下一轮循环', x: 65, y: 75, type: 'box', state: 'pending' },
          { id: 'output', label: '强化后论文', x: 88, y: 50, type: 'box', state: 'pending' },
        ],
        connections: [
          { from: 'ledger3', to: 'tau', label: '检查状态' },
          { from: 'tau', to: 'stop', label: '已收敛' },
          { from: 'tau', to: 'loop', label: '未收敛' },
          { from: 'stop', to: 'output' },
        ],
      },
    ],
  },
  {
    id: 'anim-trial',
    title: '正当程序审判内部流程',
    description: '辩护方陈述 → 陪审团投票 → quorum+majority 裁决 → 三向结果的交互式步进演示',
    concept: '审判内部机制',
    steps: [
      {
        title: '第1步：问题进入审判',
        description: '可争议的实质性重大问题被确定性路由送入正当程序审判。问题带有稳定身份、证据引用和主张主线锚点。',
        elements: [
          { id: 'issue', label: '可争议问题', x: 15, y: 50, type: 'box', state: 'active' },
          { id: 'court', label: '审判庭', x: 45, y: 50, type: 'diamond', state: 'pending' },
          { id: 'defense', label: '辩护方', x: 70, y: 25, type: 'circle', state: 'pending' },
          { id: 'jury', label: '陪审团', x: 70, y: 75, type: 'circle', state: 'pending' },
        ],
        connections: [{ from: 'issue', to: 'court', label: '路由送入' }],
      },
      {
        title: '第2步：全文辩护方陈述',
        description: '辩护方获得论文全文上下文，从全局角度论证指控不成立。它可以引用跨章节的证据、指出指控的逻辑漏洞。',
        elements: [
          { id: 'issue', label: '可争议问题', x: 10, y: 50, type: 'box', state: 'done' },
          { id: 'court', label: '审判庭', x: 30, y: 50, type: 'diamond', state: 'done' },
          { id: 'defense', label: '全文辩护方', x: 55, y: 30, type: 'circle', state: 'active' },
          { id: 'jury', label: '局部陪审团', x: 55, y: 75, type: 'circle', state: 'pending' },
          { id: 'paper', label: '论文全文', x: 82, y: 30, type: 'box', state: 'done' },
        ],
        connections: [
          { from: 'court', to: 'defense', label: '分配' },
          { from: 'paper', to: 'defense', label: '全文上下文' },
        ],
      },
      {
        title: '第3步：局部陪审团独立投票',
        description: '陪审团仅获得问题相关的局部证据（去相关，看不到辩护方论证），每位陪审员独立投票：指控成立 / 不成立 / 弃权。',
        elements: [
          { id: 'court', label: '审判庭', x: 12, y: 50, type: 'diamond', state: 'done' },
          { id: 'defense', label: '全文辩护方', x: 35, y: 25, type: 'circle', state: 'done' },
          { id: 'jury', label: '局部陪审团', x: 35, y: 75, type: 'circle', state: 'active' },
          { id: 'evidence', label: '局部证据', x: 12, y: 75, type: 'box', state: 'done' },
          { id: 'votes', label: '投票结果', x: 65, y: 50, type: 'box', state: 'pending' },
        ],
        connections: [
          { from: 'evidence', to: 'jury', label: '仅局部' },
          { from: 'jury', to: 'votes', label: '独立投票' },
        ],
      },
      {
        title: '第4步：代码计算裁决',
        description: '确定性代码检查 quorum（存活票 ≥ 80% 陪审团规模）和 majority（一方 > 60% 存活票）。不满足则升级到更大陪审团。',
        elements: [
          { id: 'votes', label: '投票结果', x: 15, y: 50, type: 'box', state: 'done' },
          { id: 'quorum', label: 'Quorum 检查', x: 40, y: 30, type: 'diamond', state: 'active' },
          { id: 'majority', label: 'Majority 检查', x: 40, y: 75, type: 'diamond', state: 'active' },
          { id: 'escalate', label: '升级大陪审团', x: 68, y: 75, type: 'box', state: 'pending' },
          { id: 'verdict', label: '裁决计算', x: 68, y: 30, type: 'diamond', state: 'pending' },
        ],
        connections: [
          { from: 'votes', to: 'quorum' },
          { from: 'votes', to: 'majority' },
          { from: 'quorum', to: 'verdict', label: '≥80%' },
          { from: 'majority', to: 'verdict', label: '>60%' },
          { from: 'quorum', to: 'escalate', label: '不足' },
        ],
      },
      {
        title: '第5步：三向终局结果',
        description: '裁决输出三种结果之一：invalid-drop（指控不成立，驳回）、valid-fixable（成立且可安全机修）、author-required（成立但需作者处理）。结果记入账本。',
        elements: [
          { id: 'verdict', label: '裁决计算', x: 15, y: 50, type: 'diamond', state: 'done' },
          { id: 'drop', label: 'invalid-drop', x: 45, y: 18, type: 'box', state: 'pending' },
          { id: 'fixable', label: 'valid-fixable', x: 45, y: 50, type: 'box', state: 'active' },
          { id: 'author', label: 'author-required', x: 45, y: 82, type: 'box', state: 'pending' },
          { id: 'ledger', label: '账本记录', x: 78, y: 50, type: 'diamond', state: 'pending' },
        ],
        connections: [
          { from: 'verdict', to: 'drop', label: '不成立' },
          { from: 'verdict', to: 'fixable', label: '可机修' },
          { from: 'verdict', to: 'author', label: '需作者' },
          { from: 'drop', to: 'ledger' },
          { from: 'fixable', to: 'ledger' },
          { from: 'author', to: 'ledger' },
        ],
      },
    ],
  },
];

// 按章节挂载动画
export const ANIMATION_ID_BY_CHAPTER: Record<string, string> = {
  'chap-4': 'anim-pipeline',
  'chap-7': 'anim-trial',
};

// ===================== 符号（17 个，4 类） =====================
export const SYMBOLS: SymbolItem[] = [
  // 控制流
  { id: 'sym-D', symbol: 'D(x)', name: 'Deterministic Decomposition', nameZh: '确定性分解', paperDefinition: '将论文 x 分解为章节、段落、锚点和交叉引用目标', intuition: '把论文切成有稳定地址的"地块"，后续所有操作都在这些地块上进行，不会跑偏', icon: '🔪', category: '控制流', page: 4, related: ['S', 'L', 'τ'] },
  { id: 'sym-S', symbol: 'S', name: 'Frozen Claim Spine', nameZh: '冻结主张主线', paperDefinition: '修订前从论文中提取的受保护语义主张骨架', intuition: '论文的"骨架"，修订前先冻住，编辑时不能偷偷改变核心主张，只能修皮肉', icon: '❄️', category: '控制流', page: 4, related: ['D(x)', 'L', 'P_i'] },
  { id: 'sym-L', symbol: 'L', name: 'Durable Ledger', nameZh: '持久账本', paperDefinition: '存储问题状态、证据、裁决和应用历史的持久化账本', intuition: '法庭的"案卷"，每个问题从立案到结案全程记录，不可篡改，可回溯', icon: '📒', category: '控制流', page: 4, related: ['i', 'v_i', 'A'] },
  { id: 'sym-tau', symbol: 'τ', name: 'Stopping Predicate', nameZh: '停止谓词', paperDefinition: '用于无人值守执行的确定性停止条件', intuition: '法官的"休庭槌"，满足条件（无新问题/达到轮次上限）就立即停止，不会无限循环', icon: '🛑', category: '控制流', page: 4, related: ['K', 'U_r', 'C_r'] },
  { id: 'sym-N', symbol: 'N', name: 'Number of Reviewers', nameZh: '审稿人数', paperDefinition: '整体领域审稿人数，限制在 [2,4]，默认 3', intuition: '陪审团人数，3人是默认配置——人多了贵，人少了不准', icon: '👥', category: '控制流', page: 4, related: ['q', 'm'] },
  // 审判
  { id: 'sym-i', symbol: 'i', name: 'Candidate Issue', nameZh: '候选问题', paperDefinition: '为论文生成的单个候选问题，带有稳定身份', intuition: '法庭上的一个"案件"，有唯一编号，从立案到裁决全程跟踪', icon: '📋', category: '审判', page: 4, related: ['e_i', 'c_i', 'v_i'] },
  { id: 'sym-ci', symbol: 'c_i', name: 'Contestability Label', nameZh: '可争议性标签', paperDefinition: '由确定性路由分配给问题 i 的可争议性标签', intuition: '案件的"分流标签"——机械小问题走简易程序，重大争议问题走正式审判', icon: '🏷️', category: '审判', page: 4, related: ['T(i)', 'v_i'] },
  { id: 'sym-T', symbol: 'T(i)', name: 'Trial Procedure', nameZh: '审判程序', paperDefinition: '对被路由的问题 i 调用的审判程序', intuition: '正式开庭——辩护律师 vs 陪审团，双方独立举证，法官按规则计算裁决', icon: '⚖️', category: '审判', page: 4, related: ['q', 'm', 'v_i'] },
  { id: 'sym-q', symbol: 'q', name: 'Quorum Threshold', nameZh: '法定人数阈值', paperDefinition: '确定性裁决计算的法定人数阈值', intuition: '陪审团的"到场率门槛"，不够人数不能宣判，必须升级更大陪审团', icon: '✅', category: '审判', page: 4, related: ['m', 'N', 'T(i)'] },
  { id: 'sym-m', symbol: 'm', name: 'Majority Threshold', nameZh: '绝对多数阈值', paperDefinition: '确定性裁决计算的绝对多数阈值', intuition: '裁决的"通过率门槛"，超过60%存活票才能定罪，不是简单多数', icon: '🗳️', category: '审判', page: 4, related: ['q', 'v_i', 'T(i)'] },
  { id: 'sym-v', symbol: 'v_i', name: 'Terminal Verdict', nameZh: '终局裁决', paperDefinition: '问题 i 的终局裁决，取值 {invalid-drop, valid-fixable, author-required}', intuition: '法官的"判决书"——三种结果：驳回起诉、判决可修、需作者本人处理', icon: '📜', category: '审判', page: 4, related: ['T(i)', 'q', 'm', 'P_i'] },
  // 编辑
  { id: 'sym-P', symbol: 'P_i', name: 'Proposed Patch', nameZh: '提议补丁', paperDefinition: '为问题 i 提议的编辑补丁', intuition: '辩护律师起草的"修改方案"，还没生效，必须过安检才能应用', icon: '✏️', category: '编辑', page: 4, related: ['a(P_i)', 'ρ_i', 'G(P_i)', 'A'] },
  { id: 'sym-rho', symbol: 'ρ_i', name: 'Risk Category', nameZh: '风险等级', paperDefinition: '补丁 P_i 的风险类别，如 LOW 或 RISKY', intuition: '补丁的"危险等级"——低风险走快速通道，高风险触发严格审计', icon: '⚠️', category: '编辑', page: 4, related: ['G(P_i)', 'P_i'] },
  { id: 'sym-G', symbol: 'G(P_i)', name: 'Guard-Chain Outcome', nameZh: '守卫链结果', paperDefinition: '补丁 P_i 的守卫链检查结果（锚点、引用、语义、编译检查）', intuition: '机场的"安检结果"——四道关卡全过才能登机，任何一道亮红灯就被拦下', icon: '🛡️', category: '编辑', page: 4, related: ['ρ_i', 'P_i', 'A'] },
  { id: 'sym-A', symbol: 'A', name: 'Applied Edits Set', nameZh: '已应用补丁集合', paperDefinition: '精确一次补丁应用后，已应用的 valid-fixable 编辑集合', intuition: '已经"落地执行"的修改清单，每个补丁只应用一次，记入账本', icon: '✅', category: '编辑', page: 4, related: ['G(P_i)', 'P_i', 'L'] },
  // 评估
  { id: 'sym-F1', symbol: 'F1', name: 'F1 Score', nameZh: 'F1 分数', paperDefinition: '每篇论文精确率和召回率的调和平均，宏平均', intuition: '审稿质量的"综合得分"，既看找得准（精确率）又看找得全（召回率）', icon: '📊', category: '评估', page: 4, related: ['Acc_v', 'ESVR'] },
  { id: 'sym-ESVR', symbol: 'ESVR', name: 'Edit-Safety Violation Rate', nameZh: '编辑安全违规率', paperDefinition: '已应用编辑中的编辑安全违规率', intuition: '修改的"事故率"——越低越好，0.025 意味着每40次修改才出1次安全问题', icon: '🚨', category: '评估', page: 4, related: ['G(P_i)', 'A', 'F1'] },
];

export const SYMBOL_CATEGORIES = ['控制流', '审判', '编辑', '评估'];

// 章节 -> 默认聚焦类别
export const SYMBOL_CATEGORY_BY_CHAPTER: Record<string, string> = {
  'chap-4': '控制流',
  'chap-7': '审判',
  'chap-8': '编辑',
  'chap-10': '评估',
};

// ===================== 论文图表索引（11 项） =====================
export const FIGURE_DATA: FigureItem[] = [
  { id: 'fig-1', type: 'figure', number: 'Figure 1', title: 'Overview of the PaperJury review-verdict-revise-verify pipeline', page: 3, chapter: 1, keywords: ['系统概览', '流水线', 'pipeline', 'review', 'verdict', 'revise', 'verify', '三阶段', '确定性设置', '审稿裁决', '守卫修订'], description: 'PaperJury 完整的审稿-裁决-修订-验证流水线总览，展示三大阶段：确定性设置（分解+冻结主张主线）、审稿与裁决（有界整体审稿+可争议性路由+正当程序审判+三向裁决）、守卫修订与验证（草稿补丁+风险分配+守卫链+精确一次应用+clean re-review+停止谓词+持久账本）。', imagePath: '/images/figures/figure-1.png', relatedConcepts: ['完整流水线', '确定性-语义分离', '持久账本', '三向裁决', '守卫链'] },
  { id: 'fig-2', type: 'figure', number: 'Figure 2', title: 'Deterministic-versus-semantic split with ledger-backed control flow', page: 4, chapter: 3, keywords: ['确定性分离', '语义分离', '账本', '控制流', 'deterministic', 'semantic', 'ledger', 'claim spine', '冻结主张主线', '分解'], description: '展示确定性编排与语义推理的严格分离架构。左侧确定性层负责分解、锚点提取、冻结主张主线、账本记录；右侧语义层负责审稿、辩护、陪审团投票；中间由账本驱动的控制流连接，确保所有状态变更可追溯、可审计。', imagePath: '/images/figures/figure-2.png', relatedConcepts: ['确定性-语义分离', '冻结主张主线', '持久账本', '确定性分解'] },
  { id: 'fig-3', type: 'figure', number: 'Figure 3', title: 'Deterministic routing and due-process adjudication for candidate issues', page: 5, chapter: 7, keywords: ['可争议性路由', '正当程序审判', 'routing', 'due process', '辩护', '陪审团', 'quorum', 'majority', '三向裁决', 'invalid-drop', 'valid-fixable', 'author-required'], description: '展示候选问题的确定性路由和正当程序审判流程。机械/次要问题直接走 polish 路径；可争议的实质性重大问题进入审判：全文辩护 vs 局部上下文陪审团，需达到法定人数 quorum 和绝对多数 majority，最终输出三向裁决（invalid-drop / valid-fixable / author-required）。', imagePath: '/images/figures/figure-3.png', relatedConcepts: ['可争议性路由', '正当程序审判', '三向裁决', '陪审团投票', 'quorum', 'majority'] },
  { id: 'fig-4', type: 'figure', number: 'Figure 4', title: 'Two-arm expert-review evaluation protocol for PaperJury', page: 7, chapter: 10, keywords: ['评估协议', '双臂评审', 'expert review', 'evaluation', '实验设计', 'held-out', '基线对比', '盲审'], description: '展示 PaperJury 的双臂专家评审评估协议。12篇 held-out 论文随机分配到 PaperJury 和四个基线方法，由领域专家进行盲审，评估问题发现的精确率、召回率、F1、裁决一致性、编辑安全违规率等指标。', imagePath: '/images/figures/figure-4.png', relatedConcepts: ['实验评估', '专家评审', '基线对比', 'held-out 测试集'] },
  { id: 'fig-5', type: 'figure', number: 'Figure 5', title: 'Quality-cost trade-off across issue-producing systems', page: 7, chapter: 10, keywords: ['成本质量权衡', '散点图', 'trade-off', 'cost', 'quality', 'F1', '时间', '效率', '性价比'], description: '各问题生成系统的质量-成本权衡散点图。X轴为审稿时间成本（对数轴），Y轴为 F1 质量分数。PaperJury 在质量和成本之间取得最佳平衡，明显优于 Judge Loop、LLM 单轮审稿等基线。', imagePath: '/images/figures/figure-5.png', relatedConcepts: ['成本质量权衡', 'F1 分数', '实验结果', '效率对比'] },
  { id: 'tab-1', type: 'table', number: 'Table 1', title: 'Three-way verdict categories and definitions', page: 5, chapter: 7, keywords: ['三向裁决', 'verdict', 'invalid-drop', 'valid-fixable', 'author-required', '裁决类型'], description: '三向裁决的分类与定义：invalid-drop（无效驳回，问题不成立）、valid-fixable（有效可修，机器可安全编辑）、author-required（需作者处理，成立但需人工介入）。', relatedConcepts: ['三向裁决', '裁决分类'] },
  { id: 'tab-2', type: 'table', number: 'Table 2', title: 'Main results: F1, precision, recall across 12 held-out papers', page: 8, chapter: 10, keywords: ['主结果', 'F1', '精确率', '召回率', 'precision', 'recall', '12篇', 'held-out', '基线对比'], description: '12篇 held-out 论文上的主实验结果，对比 PaperJury 与四个基线在 F1、精确率、召回率上的表现。PaperJury F1=0.656，显著优于 Judge Loop (0.519) 等基线。', relatedConcepts: ['主实验结果', 'F1', '精确率', '召回率'] },
  { id: 'tab-3', type: 'table', number: 'Table 3', title: 'Verdict distribution across methods', page: 8, chapter: 10, keywords: ['裁决分布', 'verdict distribution', 'invalid-drop', 'valid-fixable', 'author-required', '比例'], description: '各方法的三向裁决分布统计，展示 invalid-drop / valid-fixable / author-required 三类裁决的比例，反映各方法的保守程度和编辑倾向。', relatedConcepts: ['裁决分布', '三向裁决'] },
  { id: 'tab-4', type: 'table', number: 'Table 4', title: 'Domain-slice results: Vision / NLP / ML', page: 8, chapter: 10, keywords: ['分领域', 'domain slice', 'Vision', 'NLP', 'ML', '视觉', '自然语言', '机器学习', '领域对比'], description: '按领域（Vision/NLP/ML 各4篇）切片的实验结果，展示 PaperJury 在不同学科领域的表现一致性和优势。', relatedConcepts: ['分领域结果', '领域泛化'] },
  { id: 'tab-5', type: 'table', number: 'Table 5', title: 'Edit safety violation rate (ESVR) and edit count', page: 9, chapter: 10, keywords: ['编辑安全', 'ESVR', '违规率', 'edit safety', '编辑次数', '安全编辑', '守卫链'], description: '编辑安全违规率（ESVR）和编辑次数统计。PaperJury 的 ESVR=0.025，远低于基线（0.110），证明守卫链有效防止了危险编辑。', relatedConcepts: ['编辑安全', 'ESVR', '守卫链'] },
  { id: 'tab-6', type: 'table', number: 'Table 6', title: 'Ablation study: removing each component', page: 9, chapter: 10, keywords: ['消融实验', 'ablation', '组件移除', '守卫链', '正当程序', '有界审稿', '确定性路由', '冻结主张主线'], description: '消融实验结果，逐一移除 PaperJury 的核心组件（守卫链、正当程序审判、有界审稿、确定性路由、冻结主张主线），观察各组件对 F1、裁决一致性、成本的贡献。', relatedConcepts: ['消融实验', '组件贡献', '核心机制'] },
];

// ===================== 实验数据（Table 2/4/5、Figure 5） =====================
export interface MainResult {
  method: string;
  methodShort: string;
  isOurs: boolean;
  P_panel: number | null;
  P_verified: number | null;
  R: number | null;
  F1: number | null;
  Acc_v: number | null;
  Acc_r: number | null;
  ESVR: number | null;
  K_mean: number | null;
  K_capHit: string | null;
  W_hours: number | null;
}

export const MAIN_RESULTS: MainResult[] = [
  { method: 'Forward-only Rewriter', methodShort: 'Forward-only', isOurs: false, P_panel: null, P_verified: null, R: null, F1: null, Acc_v: null, Acc_r: null, ESVR: 0.240, K_mean: 1, K_capHit: null, W_hours: 0.31 },
  { method: 'LLM Critic Only', methodShort: 'Critic only', isOurs: false, P_panel: 0.437, P_verified: 0.577, R: 0.462, F1: 0.446, Acc_v: null, Acc_r: null, ESVR: null, K_mean: 1, K_capHit: null, W_hours: 0.51 },
  { method: 'LLM-as-Judge Review-Revise Loop', methodShort: 'Judge loop', isOurs: false, P_panel: 0.512, P_verified: 0.663, R: 0.533, F1: 0.519, Acc_v: 0.681, Acc_r: null, ESVR: 0.110, K_mean: 3.33, K_capHit: '2/12', W_hours: 2.06 },
  { method: 'Naive Unbounded Generator', methodShort: 'Naive gen', isOurs: false, P_panel: 0.341, P_verified: 0.511, R: 0.721, F1: 0.459, Acc_v: null, Acc_r: null, ESVR: null, K_mean: 1, K_capHit: null, W_hours: 8.37 },
  { method: 'PaperJury (ours)', methodShort: 'PaperJury', isOurs: true, P_panel: 0.684, P_verified: 0.847, R: 0.637, F1: 0.656, Acc_v: 0.887, Acc_r: 0.913, ESVR: 0.025, K_mean: 3.08, K_capHit: '0/12', W_hours: 2.47 },
];

export const METRIC_META = [
  { key: 'F1', label: 'F1 ↑', desc: '每篇论文精确率与召回率的调和平均，再跨论文宏平均', higherIsBetter: true },
  { key: 'P_panel', label: 'P_panel ↑', desc: '相对于专家问题面板的精确率', higherIsBetter: true },
  { key: 'P_verified', label: 'P_verified ↑', desc: '经盲审验证的精确率（含系统独有有效问题）', higherIsBetter: true },
  { key: 'R', label: 'R ↑', desc: '相对于专家面板的召回率', higherIsBetter: true },
  { key: 'Acc_v', label: 'Acc_v ↑', desc: '裁决准确率（盲审专家一致率）', higherIsBetter: true },
  { key: 'Acc_r', label: 'Acc_r ↑', desc: '路由准确率（盲审专家认可的路由决策）', higherIsBetter: true },
  { key: 'ESVR', label: 'ESVR ↓', desc: '编辑安全违规率：已应用编辑中的违规占比', higherIsBetter: false },
  { key: 'W_hours', label: 'W (小时) ↓', desc: '每篇论文的墙钟运行时间', higherIsBetter: false },
] as const;

export type MetricKey = typeof METRIC_META[number]['key'];

export interface DomainSlice {
  domain: string;
  domainZh: string;
  P_panel: number;
  P_verified: number;
  R: number;
  F1: number;
  Acc_v: number;
  Acc_r: number;
  ESVR: number;
}

export const DOMAIN_SLICES: DomainSlice[] = [
  { domain: 'Vision', domainZh: '计算机视觉', P_panel: 0.671, P_verified: 0.839, R: 0.626, F1: 0.646, Acc_v: 0.881, Acc_r: 0.904, ESVR: 0.028 },
  { domain: 'NLP', domainZh: '自然语言处理', P_panel: 0.701, P_verified: 0.857, R: 0.653, F1: 0.671, Acc_v: 0.902, Acc_r: 0.929, ESVR: 0.021 },
  { domain: 'ML', domainZh: '机器学习', P_panel: 0.680, P_verified: 0.844, R: 0.632, F1: 0.651, Acc_v: 0.878, Acc_r: 0.906, ESVR: 0.026 },
];

export interface EditSafety {
  method: string;
  methodShort: string;
  appliedPerPaper: number | null;
  appliedSd: number | null;
  VF_terminals: number | null;
  proposed: number | null;
  coverage: number | null;
  guardBlock: number | null;
  unsafe: number | null;
  ESVR: number | null;
}

export const EDIT_SAFETY: EditSafety[] = [
  { method: 'Forward-only Rewriter', methodShort: 'Forward-only', appliedPerPaper: 254, appliedSd: 21.2, VF_terminals: null, proposed: null, coverage: null, guardBlock: null, unsafe: 61, ESVR: 0.240 },
  { method: 'LLM-as-Judge Loop', methodShort: 'Judge loop', appliedPerPaper: 172, appliedSd: 14.3, VF_terminals: 204, proposed: 178, coverage: 0.843, guardBlock: 0.034, unsafe: 19, ESVR: 0.110 },
  { method: 'PaperJury (ours)', methodShort: 'PaperJury', appliedPerPaper: 161, appliedSd: 13.4, VF_terminals: 196, proposed: 194, coverage: 0.821, guardBlock: 0.170, unsafe: 4, ESVR: 0.025 },
];

export const COST_QUALITY = [
  { name: 'Critic only', x: 0.8, y: 0.446, color: '#9ca3af' },
  { name: 'Judge loop', x: 3.2, y: 0.519, color: '#f59e0b' },
  { name: 'Naive gen', x: 12.0, y: 0.459, color: '#9ca3af' },
  { name: 'PaperJury', x: 3.8, y: 0.656, color: '#2563eb', highlight: true },
];

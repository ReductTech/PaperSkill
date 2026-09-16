import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Check,
  Database,
  FlaskConical,
  Layers3,
  Network,
  Scale,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Progress } from "./components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

const navItems = [
  ["问题", "#problem"],
  ["方法", "#method"],
  ["数据", "#data"],
  ["实验", "#experiments"],
  ["结论", "#takeaways"],
  ["测验", "#quiz"],
] as const;

const languages = ["俄语", "哈萨克语", "吉尔吉斯语", "乌兹别克语"];

const languageProfiles = {
  俄语: {
    hours: "5,822 h",
    level: "区域头部语言",
    challenge: "在提升长尾语言时，维持俄语识别稳定",
    wave: [22, 42, 68, 35, 55, 84, 48, 30, 72, 58, 38, 76, 92, 51, 27, 64, 45, 80, 54, 34, 70, 46, 60, 28],
  },
  哈萨克语: {
    hours: "9,812 h",
    level: "合成数据主导",
    challenge: "7,896 小时合成语音需要分域控制",
    wave: [34, 72, 46, 88, 52, 30, 62, 95, 40, 68, 25, 78, 56, 86, 38, 64, 92, 48, 74, 28, 58, 82, 44, 70],
  },
  吉尔吉斯语: {
    hours: "7,279 h",
    level: "极少公开语料",
    challenge: "公开语料仅 26 小时，真实语音覆盖稀缺",
    wave: [18, 52, 82, 40, 66, 26, 94, 58, 34, 76, 48, 88, 22, 62, 72, 38, 90, 54, 30, 68, 44, 84, 56, 24],
  },
  乌兹别克语: {
    hours: "585 h",
    level: "低资源语言",
    challenge: "没有合成或弱监督数据补充",
    wave: [28, 60, 38, 74, 46, 84, 32, 56, 90, 42, 68, 24, 78, 50, 36, 88, 58, 30, 72, 44, 82, 52, 64, 26],
  },
} as const;

const pipelineSteps = [
  {
    id: "discover",
    number: "01",
    icon: Database,
    title: "发现语言",
    short: "VAD 切分 + MMS LID 4017",
    body: "把音频虚拟切成 1 分钟片段，先用语音活动检测保留说话部分，再逐片段识别语言；整段录音的语言由多数投票决定。",
    fact: "置信度门槛：多数投票 0.7；选定语言片段的平均置信度 0.7。",
  },
  {
    id: "cluster",
    number: "02",
    icon: Network,
    title: "形成语言簇",
    short: "70+ 种语言 → 5 个簇",
    body: "研究者用同一录音中的语言共现关系建图，并按语言总体频次归一化边权。这样既看见亲近语言，也避免头部语言仅凭数据量占据图中心。",
    fact: "归一化边权：wᵢⱼ = cᵢⱼ / √(nᵢnⱼ)。",
  },
  {
    id: "pretrain",
    number: "03",
    icon: BrainCircuit,
    title: "自监督预训练",
    short: "HuBERT 式掩码单元预测",
    body: "教师模型将声学表示聚成 1000 个离散单元；学生模型看到被遮住 40% 帧的梅尔频谱，并尝试恢复对应单元标签。",
    fact: "600M 参数 Conformer：24 层、隐藏维 1024、25 Hz 帧率。",
  },
  {
    id: "finetune",
    number: "04",
    icon: Scale,
    title: "面向领域微调",
    short: "共享字符表 + CTC",
    body: "模型在五种语言上共享字符词表，并混合公开、众包、弱监督和合成数据。采样同时平衡语言与数据域，避免海量合成语音淹没真实自发语音。",
    fact: "最终方案：E2 预训练权重 + domain-aware 微调采样。",
  },
];

const dataByLanguage = {
  English: { label: "英语", values: [26738, 0, 0, 0] },
  Russian: { label: "俄语", values: [1767, 3363, 0, 692] },
  Kazakh: { label: "哈萨克语", values: [1031, 876, 9, 7896] },
  Kyrgyz: { label: "吉尔吉斯语", values: [26, 514, 324, 6415] },
  Uzbek: { label: "乌兹别克语", values: [313, 272, 0, 0] },
} as const;

const sourceNames = ["公开语料", "众包标注", "弱监督", "合成语音"];
const sourceColors = ["#6fae9c", "#4f8e80", "#668fb4", "#c69458"];

const experiments = [
  { id: "E0", note: "自然分布", weights: [60, 27, 8, 3, 2], wer: [4.6, 14.4, 9.4, 12.3, 10.5] },
  { id: "E1", note: "温和抬升长尾", weights: [60, 20, 10, 5, 5], wer: [4.6, 14.6, 9.1, 11.9, 10.2] },
  { id: "E2", note: "论文最终选择", weights: [50, 15, 25, 5, 5], wer: [4.7, 15.4, 8.5, 11.4, 9.7] },
  { id: "E3", note: "兼顾英语", weights: [40, 25, 25, 5, 5], wer: [4.9, 14.6, 8.7, 11.6, 9.8] },
] as const;

const benchmark = {
  Russian: { label: "俄语", values: [6.0, 14.6, 16.1, 10.1] },
  Kazakh: { label: "哈萨克语", values: [15.8, 32.2, 62.9, 65.2] },
  Kyrgyz: { label: "吉尔吉斯语", values: [9.8, 25.0, 78.3, 102.2] },
  Uzbek: { label: "乌兹别克语", values: [12.7, 30.2, 40.0, 120.6] },
} as const;
const modelNames = ["GigaAM", "Omnilingual 1B", "Seamless M4T", "Whisper large-v3"];

const quizQuestions = [
  {
    question: "预训练为什么按语言簇重加权，而不是直接把 70+ 种语言完全拉平？",
    options: ["减少 GPU 数量", "小语种权重难可靠估计，激进上采样易过拟合", "CTC 只支持五种语言"],
    answer: 1,
    explain: "论文认为，极低资源语言的权重估计不稳定；语言簇提供了更稳健的中间粒度。",
  },
  {
    question: "domain-aware 微调主要解决了哪种风险？",
    options: ["合成数据主导训练课程", "教师模型参数过少", "语言识别模型无法多数投票"],
    answer: 0,
    explain: "哈萨克语和吉尔吉斯语含大量合成语音，分域采样能保护真实、自发语音的代表性。",
  },
  {
    question: "论文中 E2 相比自然分布 E0 的核心取舍是什么？",
    options: ["英语和俄语均大幅提升", "长尾语言改善，英语略有回退", "所有语言表现完全一致"],
    answer: 1,
    explain: "E2 把 C3 权重从 8% 提到 25%，换来吉尔吉斯语、哈萨克语和乌兹别克语的改善，同时英语 WER 上升。",
  },
];

export default function Home() {
  const [activeLanguage, setActiveLanguage] = useState(languages[0]);
  const [activeStep, setActiveStep] = useState(0);
  const [experiment, setExperiment] = useState(2);
  const [resultLanguage, setResultLanguage] = useState<keyof typeof benchmark>("Kazakh");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("start");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setIsScrolled(window.scrollY > 24);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const sections = ["start", ...navItems.map(([, href]) => href.slice(1))]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -58% 0px", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const score = useMemo(
    () => quizQuestions.reduce((sum, item, index) => sum + (answers[index] === item.answer ? 1 : 0), 0),
    [answers],
  );

  const selectedExperiment = experiments[experiment];
  const selectedBenchmark = benchmark[resultLanguage];
  const maxBenchmark = Math.max(...selectedBenchmark.values);
  const languageProfile = languageProfiles[activeLanguage as keyof typeof languageProfiles];

  return (
    <main>
      <Progress className="reading-progress" value={progress} aria-label={`阅读进度 ${Math.round(progress)}%`} />
      <nav className={`topbar ${isScrolled ? "scrolled" : ""}`} aria-label="章节导航">
        <a className="brand" href="#start" aria-label="回到首页">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span>GigaAM · Paper Lab</span>
        </a>
        <div className="nav-links">
          {navItems.map(([label, href]) => <a className={activeSection === href.slice(1) ? "active" : ""} href={href} key={href}>{label}</a>)}
        </div>
        <a className="paper-link" href="https://arxiv.org/abs/2607.10371" target="_blank" rel="noreferrer">
          原文 <ArrowUpRight size={15} />
        </a>
      </nav>

      <section className="hero" id="start">
        <div className="hero-copy">
          <p className="eyebrow">交互式论文导读 · 多语言语音基础模型</p>
          <h1><span>让一种声音，</span><span>在数据中<strong>不再被忽略</strong></span></h1>
          <p className="lede">
            <strong>GigaAM Multilingual</strong> 研究的不是“再做一个更大的模型”，而是当训练数据极不平衡时，怎样让中亚代表性不足的语言真正被模型学到。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#problem">开始探索 <ArrowDown size={17} /></a>
            <span>约 8 分钟</span>
          </div>
        </div>

        <div className="signal-card" aria-label="语言观察器">
          <div className="signal-head"><span>语言观察器</span><span className="signal-note">声波示意 · 非真实音频</span></div>
          <div className="observer-body" key={activeLanguage}>
            <div className="waveform" aria-hidden="true">
              {languageProfile.wave.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
            </div>
            <div className="observer-stats">
              <div><span>微调数据</span><strong>{languageProfile.hours}</strong></div>
              <div><span>资源状态</span><strong>{languageProfile.level}</strong></div>
            </div>
            <p className="research-challenge"><span>研究难点</span>{languageProfile.challenge}</p>
          </div>
          <div className="language-grid">
            {languages.map((language) => (
              <button data-language={language} className={activeLanguage === language ? "active" : ""} key={language} onClick={() => setActiveLanguage(language)}>{language}</button>
            ))}
          </div>
        </div>

        <div className="metric-ribbon" aria-label="论文关键数字">
          <div><strong>2M</strong><span>小时预训练音频</span></div>
          <div><strong>70+</strong><span>高频语言</span></div>
          <div><strong>600M</strong><span>Conformer 参数</span></div>
          <div><strong>5</strong><span>语言簇</span></div>
        </div>
        <p className="paper-meta">Andrei Kuzmenko、Alexandr Maximenko、Aleksandr Kutsakov 等 · SaluteDevices · 2026</p>
      </section>

      <section className="section problem-section" id="problem">
        <div className="section-kicker"><span>01</span> 问题</div>
        <div className="section-grid">
          <div>
            <h2>规模很大，<br />公平性却不会自动出现</h2>
            <p className="section-intro">多语言语音识别的平均成绩不断提高，但训练数据仍向头部语言倾斜。直接重复小语种数据又可能造成过拟合，并伤害高资源语言。</p>
          </div>
          <div className="imbalance-visual" aria-label="自然语言簇分布示意，数据来自论文实验 E0">
            <div className="visual-title"><span>自然预训练分布 E0</span><span>总计 100%</span></div>
            {[60, 27, 8, 3, 2].map((value, index) => (
              <div className="cluster-row" key={value}>
                <span>C{index + 1}</span>
                <div><i style={{ width: `${value}%` }} /></div>
                <strong>{value}%</strong>
              </div>
            ))}
            <p className="visual-caption"><TriangleAlert size={16} /> 目标中亚语言所在簇 C3 只占 8%，头部簇 C1 占 60%。</p>
          </div>
        </div>
        <blockquote>研究问题：能否在不彻底打乱自然数据分布的前提下，让长尾语言获得足够的学习信号？</blockquote>
      </section>

      <section className="section method-section" id="method">
        <div className="section-kicker"><span>02</span> 方法</div>
        <div className="section-heading-row">
          <h2>从两百万小时音频，<br />到可迁移的语音表征</h2>
          <p>点击步骤，查看每个决策如何回应“数据不平衡”。</p>
        </div>
        <div className="pipeline">
          <div className="pipeline-nav" role="tablist" aria-label="方法步骤">
            {pipelineSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <button data-step={index} role="tab" aria-selected={activeStep === index} className={activeStep === index ? "active" : ""} onClick={() => setActiveStep(index)} key={step.id}>
                  <span className="step-icon"><Icon size={20} /></span>
                  <span><small>{step.number}</small><strong>{step.title}</strong><em>{step.short}</em></span>
                </button>
              );
            })}
          </div>
          <div className="step-detail" role="tabpanel">
            <span className="step-number">{pipelineSteps[activeStep].number}</span>
            <h3>{pipelineSteps[activeStep].title}</h3>
            <p>{pipelineSteps[activeStep].body}</p>
            <div className="fact-card"><Sparkles size={18} /><span>{pipelineSteps[activeStep].fact}</span></div>
          </div>
        </div>
        <div className="architecture-strip">
          <span><Layers3 size={18} /> 24 层</span><span>hidden = 1024</span><span>RoPE 自注意力</span><span>40 ms stride</span><span>K = 1000 单元</span><span>掩码 40%</span>
        </div>
      </section>

      <section className="section data-section" id="data">
        <div className="section-kicker"><span>03</span> 数据配方</div>
        <div className="section-heading-row">
          <h2>小时数不等于有效覆盖</h2>
          <p>切换语言，观察公开、众包、弱监督与合成数据如何组合。数值为微调时长。</p>
        </div>
        <div className="cluster-note"><Network size={19} /><span>目标语言簇 C3</span><strong>哈萨克语 · 吉尔吉斯语 · 乌兹别克语</strong><em>预训练权重由 8% 提升至 25%</em></div>
        <Tabs defaultValue="Kazakh" className="data-tabs">
          <TabsList className="data-tab-list" aria-label="选择语言">
            {Object.entries(dataByLanguage).map(([key, item]) => <TabsTrigger data-language-key={key} key={key} value={key}>{item.label}</TabsTrigger>)}
          </TabsList>
          {Object.entries(dataByLanguage).map(([key, item]) => {
            const total = item.values.reduce<number>((sum, value) => sum + value, 0);
            const max = Math.max(...item.values, 1);
            return (
              <TabsContent forceMount data-language-panel={key} value={key} key={key} className="data-tab-content">
                <div className="data-total"><span>微调数据总量</span><strong>{total.toLocaleString()}<small> 小时</small></strong></div>
                <div className="source-bars">
                  {item.values.map((value, index) => (
                    <div className="source-row" key={sourceNames[index]}>
                      <span><i style={{ background: sourceColors[index] }} />{sourceNames[index]}</span>
                      <div><b style={{ width: `${value === 0 ? 0 : Math.max(2, (value / max) * 100)}%`, background: sourceColors[index] }} /></div>
                      <strong>{value.toLocaleString()} h</strong>
                    </div>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
        <div className="data-reading">
          <div><strong>哈萨克语与吉尔吉斯语</strong><p>合成语音分别达到 7,896 和 6,415 小时，因此训练时必须控制数据域比例。</p></div>
          <div><strong>乌兹别克语</strong><p>没有合成或弱监督数据，domain-aware 采样相对语言平衡没有呈现额外收益。</p></div>
          <div><strong>众包质量控制</strong><p>每条语音由 5 位标注者处理，再用可靠性加权 ROVER 汇总转写。</p></div>
        </div>
      </section>

      <section className="section experiment-section" id="experiments">
        <div className="section-kicker"><span>04</span> 交互实验</div>
        <div className="section-heading-row">
          <h2>把更多注意力分给长尾，<br />会发生什么？</h2>
          <p>选择论文中的 E0–E3 配方。WER 越低越好；这里展示跨可用测试集的语言平均值。</p>
        </div>
        <div className="experiment-switcher" aria-label="选择预训练实验">
          {experiments.map((item, index) => (
            <button data-experiment={index} className={experiment === index ? "active" : ""} onClick={() => setExperiment(index)} key={item.id}>
              <strong>{item.id}</strong><span>{item.note}</span>{item.id === "E2" && <em>论文采用</em>}
            </button>
          ))}
        </div>
        <div className="lab-panel">
          <div className="weight-panel">
            <div className="panel-title"><span>语言簇采样权重</span><strong>{selectedExperiment.id}</strong></div>
            <div className="cluster-columns">
              {selectedExperiment.weights.map((weight, index) => (
                <div key={index}><div><i style={{ height: `${weight * 1.55}%` }} /></div><strong>{weight}%</strong><span>C{index + 1}</span></div>
              ))}
            </div>
          </div>
          <div className="wer-panel" key={selectedExperiment.id}>
            <div className="panel-title"><span>平均 WER</span><span className="lower-better">↓ 越低越好</span></div>
            <div className="wer-grid">
              {["俄语", "英语", "吉尔吉斯语", "哈萨克语", "乌兹别克语"].map((label, index) => {
                const delta = Number((selectedExperiment.wer[index] - experiments[0].wer[index]).toFixed(1));
                return (
                  <div key={label} className={index >= 2 ? "target" : ""}>
                    <span>{label}</span><strong>{selectedExperiment.wer[index]}%</strong>
                    <small className={delta < 0 ? "improved" : delta > 0 ? "regressed" : "neutral"}>
                      {delta === 0 ? "E0 基准" : `较 E0 ${delta < 0 ? "降低" : "升高"} ${Math.abs(delta).toFixed(1)} 个百分点`}
                    </small>
                  </div>
                );
              })}
            </div>
            <p className="lab-insight">
              {experiment === 0 && "自然分布保护头部语言，但中亚语言获得的训练信号不足。"}
              {experiment === 1 && "温和重加权带来稳定的小幅改善。"}
              {experiment === 2 && "C3 从 8% 提至 25%：三个目标语言显著改善，论文采用此方案。"}
              {experiment === 3 && "英语回升到 14.6%，但三个目标语言均比 E2 略差。"}
            </p>
          </div>
        </div>

        <div className="results-block">
          <div className="results-copy">
            <span className="mini-label">真实场景结果</span>
            <h3>真正拉开差距的，<br />是自发语音</h3>
            <p>在内部真实场景测试集上，选择语言查看四个公开多语言系统的 WER。论文全部采用贪心解码。</p>
            <div className="result-language-switcher">
              {(Object.keys(benchmark) as Array<keyof typeof benchmark>).map((key) => (
                <button data-result-language={key} className={resultLanguage === key ? "active" : ""} onClick={() => setResultLanguage(key)} key={key}>{benchmark[key].label}</button>
              ))}
            </div>
          </div>
          <div className="model-chart" aria-label={`${selectedBenchmark.label}内部测试集模型词错误率对比`}>
            <div className="model-chart-head"><span>内部测试集 WER</span><strong>越低越好 ↓</strong></div>
            {selectedBenchmark.values.map((value, index) => (
              <div className={index === 0 ? "winner" : ""} key={modelNames[index]}>
                <span>{modelNames[index]}</span>
                <div><i style={{ width: `${(value / maxBenchmark) * 100}%` }} /></div>
                <strong>{value}%</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="encoder-table-card">
          <div><span className="mini-label">同条件 CTC 微调</span><h3>更小的编码器，也能赢</h3><p>在相同微调数据与 CTC 解码设置下，240M GigaAM 的平均 WER 仍优于更大的基线。</p></div>
          <div className="mini-table-wrap">
            <table>
              <thead><tr><th>编码器</th><th>参数量</th><th>平均 WER ↓</th></tr></thead>
              <tbody>
                <tr className="best"><td>GigaAM</td><td>600M</td><td>10.2%</td></tr>
                <tr><td>GigaAM</td><td>240M</td><td>12.2%</td></tr>
                <tr><td>Whisper Large v3</td><td>更大</td><td>14.1%</td></tr>
                <tr><td>Omnilingual SSL</td><td>1B</td><td>16.6%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="tail-card">
          <div><span className="mini-label">预训练覆盖少于 500 小时</span><h3>跨语言迁移压力测试</h3><p>仅用 Common Voice 单语微调：格鲁吉亚语 93 小时，巴什基尔语 143 小时。</p></div>
          <div><span className="tail-lower">WER · 越低越好 ↓</span><div className="tail-score"><div><span>格鲁吉亚语</span><strong>3.8%</strong><small>Whisper 13.4 · Omni 7.8</small></div><div><span>巴什基尔语</span><strong>3.6%</strong><small>Whisper 11.1 · Omni 8.2</small></div></div></div>
        </div>
      </section>

      <section className="section takeaway-section" id="takeaways">
        <div className="section-kicker"><span>05</span> 结论与判断</div>
        <h2>论文真正提供的，<br />是一份“如何分配数据注意力”的配方</h2>
        <div className="takeaway-grid">
          <article><span>01</span><h3>预训练时，按簇看长尾</h3><p>语言簇比逐语言完全平衡更稳健，又能避免自然分布让头部语言长期主导梯度。</p></article>
          <article><span>02</span><h3>微调时，同时看语言与数据域</h3><p>语言平衡解决“谁被看到”，分域采样进一步解决“看到的是合成语音还是真实语音”。</p></article>
          <article><span>03</span><h3>匹配任务，比盲目放大模型更重要</h3><p>在受控微调中，240M GigaAM 也能超过更大的通用编码器，说明预训练配方与目标域匹配具有决定性作用。</p></article>
        </div>
        <div className="limitations">
          <div className="limitations-title"><TriangleAlert size={22} /><span>阅读时应保留的四个问号</span></div>
          <ul>
            <li>2M 小时预训练语料为内部数据，外部读者无法完整复现其组成与清洗过程。</li>
            <li>主要结论集中在俄语、英语与三种中亚语言，向更广语言族推广仍需验证。</li>
            <li>内部自发语音测试集没有公开，最突出的实际场景增益难以独立复核。</li>
            <li>重加权不是无成本的：E2 改善长尾语言时，英语平均 WER 从 14.4% 升到 15.4%。</li>
          </ul>
        </div>
      </section>

      <section className="section quiz-section" id="quiz">
        <div className="section-kicker"><span>06</span> 3 分钟测验</div>
        <div className="quiz-heading"><div><h2>你抓住论文的主线了吗？</h2><p>每题作答后立即看到解释。</p></div><div className="score-orb"><strong>{score}</strong><span>/ 3</span></div></div>
        <div className="questions">
          {quizQuestions.map((item, questionIndex) => (
            <article className="question-card" key={item.question}>
              <div className="question-number">Q{questionIndex + 1}</div>
              <h3>{item.question}</h3>
              <div className="options">
                {item.options.map((option, optionIndex) => {
                  const chosen = answers[questionIndex] === optionIndex;
                  const answered = answers[questionIndex] !== undefined;
                  const correct = optionIndex === item.answer;
                  const state = answered && correct ? "correct" : chosen && !correct ? "wrong" : "";
                  return <button data-question={questionIndex} data-option={optionIndex} className={`${chosen ? "chosen" : ""} ${state}`} onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} key={option}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{answered && correct && <Check size={17} />}</button>;
                })}
              </div>
              {answers[questionIndex] !== undefined && <p className="explanation"><strong>正确答案：{String.fromCharCode(65 + item.answer)}．{item.options[item.answer]}</strong>{item.explain}</p>}
            </article>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark">G</span><div><strong>GigaAM Multilingual · Paper Lab</strong><span>基于 arXiv:2607.10371v1 的中文交互式导读</span></div></div>
        <div className="footer-links">
          <a href="https://arxiv.org/abs/2607.10371" target="_blank" rel="noreferrer"><BookOpen size={16} /> 论文原文</a>
          <a href="https://github.com/salute-developers/GigaAM" target="_blank" rel="noreferrer"><FlaskConical size={16} /> 开源模型</a>
        </div>
        <p className="ai-note">论文披露：生成式 AI 仅用于部分语言编辑与措辞支持；实验结果、数据分析和科学决策由作者完成并负责。</p>
      </footer>
    </main>
  );
}

import { useEffect, useState } from 'react'
import { DenoisingPlayground } from './components/DenoisingPlayground'
import { EvidenceMatrix } from './components/EvidenceMatrix'
import { ExperimentFlow } from './components/ExperimentFlow'
import { ExperimentSimulator } from './components/ExperimentSimulator'
import { Icon } from './components/Icon'
import { MethodLab } from './components/MethodLab'
import { ParadigmShowcase } from './components/ParadigmShowcase'
import { ResultsLab } from './components/ResultsLab'
import { SectionHeader } from './components/SectionHeader'
import { TextLDMPipeline } from './components/TextLDMPipeline'
import {
  goalLayers,
  motivationCards,
  navSections,
  problemLayers,
  verificationItems,
} from './data/paper'


function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const root = document.documentElement
      const max = root.scrollHeight - root.clientHeight
      setScrollProgress(max > 0 ? (root.scrollTop / max) * 100 : 0)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActiveSection(visible.target.id)
      },
      { rootMargin: '-20% 0px -58% 0px', threshold: [0.08, 0.25, 0.55] },
    )

    document.querySelectorAll<HTMLElement>('section[data-section]').forEach((section) => observer.observe(section))
    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateProgress)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('section') || window.location.hash.slice(1)
    if (!id) return undefined
    const timer = window.setTimeout(() => {
      const target = document.getElementById(id)
      if (!target) return
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 16, left: 0, behavior: 'auto' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [])
  const goTo = (id: string) => {
    const target = document.getElementById(id)
    if (target) {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 16, left: 0, behavior: 'smooth' })
    }
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress / 100})` }} />

      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand" onClick={() => goTo('overview')} role="button" tabIndex={0}>
          <span className="brand__mark">T<span>L</span></span>
          <span className="brand__copy">
            <strong>TextLDM</strong>
            <small>Research Console</small>
          </span>
        </div>

        <nav className="side-nav" aria-label="论文分析导航">
          {navSections.map((section, index) => (
            <button
              className={activeSection === section.id ? 'is-active' : ''}
              key={section.id}
              onClick={() => goTo(section.id)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span className="side-nav__label">{section.label}</span>
              <small>{section.eyebrow}</small>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <div className="sidebar-card__top">
            <Icon name="book" size={18} />
            <span>Source paper</span>
          </div>
          <strong>Continuous Latent Diffusion for Language Modeling</strong>
          <p>arXiv 2605.07748v1 · 15 pages</p>
          <button onClick={() => goTo('verification')} type="button">
            查看核验边界 <Icon name="arrow" size={15} />
          </button>
        </div>
      </aside>

      {menuOpen ? <button aria-label="关闭导航" className="sidebar-scrim" onClick={() => setMenuOpen(false)} type="button" /> : null}

      <main className="page">
        <header className="mobile-header">
          <button className="mobile-brand" onClick={() => goTo('overview')} type="button">
            <span className="brand__mark">T<span>L</span></span>
            <strong>TextLDM</strong>
          </button>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} type="button">
            <Icon name={menuOpen ? 'x' : 'menu'} size={22} />
          </button>
        </header>

        <section className="hero section" data-section id="overview">
          <div className="hero__grid">
            <div className="hero__copy">
              <div className="hero__meta">
                <span className="document-pill"><span /> arXiv preprint</span>
                <span>Paper ID 2605.07748v1</span>
              </div>
              <p className="eyebrow">Evidence-first research navigation</p>
              <h1>TextLDM</h1>
              <h2>Language Modeling with Continuous Latent Diffusion</h2>
              <p className="hero__lead">
                这不是“扩散模型全面替代自回归”的证明，而是一次针对跨模态方法迁移的可行性验证：
                视觉潜扩散配方能否在文本上工作，以及连续文本表示为何成为真正瓶颈。
              </p>
              <div className="hero__actions">
                <button className="button button--primary" onClick={() => goTo('motivation')} type="button">
                  开始梳理 <Icon name="arrow" size={17} />
                </button>
                <button className="button button--ghost" onClick={() => goTo('evidence')} type="button">
                  直接查看证据矩阵
                </button>
              </div>
            </div>

            <div className="hero-visual" aria-label="TextLDM 核心论证结构示意">
              <div className="orbit orbit--outer" />
              <div className="orbit orbit--inner" />
              <div className="hero-core">
                <Icon name="orbit" size={31} />
                <span>Continuous</span>
                <strong>Latent DiT</strong>
                <small>Flow Matching</small>
              </div>
              <div className="orbit-node orbit-node--one">
                <span>01</span>
                <strong>TextVAE</strong>
                <small>continuous representation</small>
              </div>
              <div className="orbit-node orbit-node--two">
                <span>02</span>
                <strong>REPA</strong>
                <small>semantic alignment</small>
              </div>
              <div className="orbit-node orbit-node--three">
                <span>03</span>
                <strong>TextDiT</strong>
                <small>parallel denoising</small>
              </div>
            </div>
          </div>

          <div className="hero-metrics">
            <div><span>核心问题</span><strong>1</strong><small>跨范式迁移可行性</small></div>
            <div><span>方法阶段</span><strong>2</strong><small>TextVAE → TextDiT</small></div>
            <div><span>证据主张</span><strong>6</strong><small>3 支持 · 2 部分 · 1 未证</small></div>
            <div><span>评测基准</span><strong>4</strong><small>统一续写协议</small></div>
          </div>

          <div className="narrative-strip">
            <span>动机</span><i />
            <span>表示瓶颈</span><i />
            <span>REPA 对齐</span><i />
            <span>Flow Matching</span><i />
            <span>续写评测</span><i />
            <span>边界结论</span>
          </div>

          <ParadigmShowcase />
        </section>

        <section className="section section--split" data-section id="motivation">
          <SectionHeader
            index="01"
            eyebrow="Why this paper exists"
            title="研究动机：弥合视觉与语言的方法学缺口"
            description={<p>视觉生成向连续潜扩散收敛，而语言生成仍以自回归为主。TextLDM 要回答的不是范式优劣，而是这条视觉配方能否迁移。</p>}
          />

          <div className="motivation-grid">
            {motivationCards.map((card) => (
              <article className="motivation-card" key={card.index}>
                <div className="motivation-card__top">
                  <span>{card.index}</span>
                  <b>{card.tag}</b>
                </div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>

        </section>

        <section className="section" data-section id="problem">
          <SectionHeader
            index="02"
            eyebrow="The actual bottleneck"
            title="核心问题：重建精度并不等于生成质量"
            description={<p>论文最重要的诊断是，TextVAE 可以近乎完美地重建 token，却可能产生不适合条件去噪的潜空间。</p>}
          />
          <div className="problem-stack">
            {problemLayers.map((layer) => (
              <article className="problem-card" key={layer.index}>
                <div className="problem-card__marker"><span>{layer.index}</span></div>
                <div className="problem-card__copy">
                  <p className="eyebrow">{layer.label}</p>
                  <h3>{layer.title}</h3>
                  <p>{layer.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="insight-banner">
            <Icon name="target" size={28} />
            <div>
              <span>Central insight</span>
              <strong>关键变量不是“能否重建”，而是“潜空间是否保留对扩散友好的语义几何”。</strong>
            </div>
            <p>REPA 在几乎不改变重建精度的前提下，将 WikiSource MAUVE 从 2.5 提升到 20.4。</p>
          </div>
        </section>

        <section className="section" data-section id="method">
          <SectionHeader
            index="03"
            eyebrow="Two-stage framework"
            title="方法路径：从离散 token 到潜空间 Flow Matching"
            description={<p>TextVAE 负责建立连续文本表示，TextDiT 负责在该空间中执行条件生成；REPA 是连接二者的表示质量桥梁。</p>}
          />
          <MethodLab />

          <TextLDMPipeline />

        </section>

        <section className="section" data-section id="experiment-flow">
          <SectionHeader
            index="04"
            eyebrow="Interactive experiment pipeline"
            title="实验流程：从语料准备到参数化模拟"
            description={<p>点击步骤或在流程中播放，查看每一步的输入、操作、产物与证据位置；该图描述实际实验依赖，不替代论文原图。</p>}
          />
          <ExperimentFlow />
          <ExperimentSimulator />
          <DenoisingPlayground />
        </section>

        <section className="section" data-section id="evidence">
          <SectionHeader
            index="05"
            eyebrow="Claim ↔ evidence map"
            title="证据矩阵：每一条结论能走多远"
            description={<p>点击任一主张展开证据位置、适用范围和分析结论；它区分已验证、部分成立与仅属未来愿景的叙事。</p>}
          />
          <EvidenceMatrix />
        </section>

        <section className="section" data-section id="results">
          <SectionHeader
            index="06"
            eyebrow="Interactive result explorer"
            title="实验结果：跨评测集与指标的对比"
            description={<p>选择评测集与指标，筛选模型类别。数据来自论文 Table 1，柱长只在当前评测集与当前指标内部归一化。</p>}
          />
          <ResultsLab />
          <div className="result-observations">
            <article>
              <span>A</span>
              <h3>扩散语言模型对比</h3>
              <p>TextLDM 在四个基准的 ROUGE、BERTScore 和 MAUVE 上整体超过 SSD-LM 与 Block Diffusion。</p>
            </article>
            <article>
              <span>B</span>
              <h3>与自回归基线对比</h3>
              <p>768M 模型在多数指标上超过 GPT-2 Large，但部分 BERTScore 与多样性格局仍保留差距。</p>
            </article>
            <article>
              <span>C</span>
              <h3>规模扩展</h3>
              <p>从 114M 到 768M 呈现清晰提升，但不同规模比较的训练计算并不完全等价。</p>
            </article>
          </div>
        </section>

        <section className="section" data-section id="goals">
          <SectionHeader
            index="07"
            eyebrow="Goal and scope"
            title="明确目标：把“已经做到”与“只是愿景”分开"
            description={<p>论文目标是验证视觉潜扩散配方的语言迁移能力，为统一多模态架构提供底座证据；它不是统一多模态模型已经完成的证明。</p>}
          />

          <div className="goal-map">
            {goalLayers.map((layer) => (
              <article className={`goal-column goal-column--${layer.tone}`} key={layer.id}>
                <div className="goal-column__head">
                  <span>{layer.label}</span>
                  <h3>{layer.title}</h3>
                </div>
                <ul>
                  {layer.items.map((item) => (
                    <li key={item}>
                      <Icon name={layer.id === 'established' ? 'check' : layer.id === 'partial' ? 'warning' : 'x'} size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="objective-statement">
            <div className="objective-statement__label">
              <span>One-sentence objective</span>
              <Icon name="target" size={23} />
            </div>
            <blockquote>
              验证 REPA 增强的连续文本潜空间能否让标准 DiT Flow Matching 配方直接承担语言生成，并在统一数据和规模约束下达到与自回归模型可比的续写性能。
            </blockquote>
          </div>
        </section>

        <section className="section" data-section id="verification">
          <SectionHeader
            index="08"
            eyebrow="Evidence boundaries"
            title="核验状态与下一步研究门槛"
            description={<p>以下状态用于明确当前分析已经检查什么、尚未检查什么，以及严格复现需要补充哪些材料。</p>}
          />

          <div className="verification-grid">
            {verificationItems.map((item) => (
              <article className={`verification-card verification-card--${item.status.toLowerCase()}`} key={item.title}>
                <div className="verification-card__status">
                  <Icon name={item.status === 'VERIFIED' ? 'check' : item.status === 'UNVERIFIED' ? 'warning' : 'shield'} size={17} />
                  {item.status}
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>

          <div className="next-gate">
            <div>
              <p className="eyebrow">Next research gate</p>
              <h3>从论文分析走向可复现实验</h3>
              <p>下一阶段应按方法、数据、评测和边界假设四条线建立复现清单，而不先扩展到多模态主张。</p>
            </div>
            <div className="next-gate__steps">
              <span>01 复现 TextVAE 与 REPA</span>
              <span>02 验证 Flow Matching 与 CFG</span>
              <span>03 复测四项续写基准</span>
              <span>04 再评估效率与泛化</span>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div>
            <span className="brand__mark">T<span>L</span></span>
            <p>TextLDM Research Console · Evidence-calibrated paper navigation</p>
          </div>
          <p>内容依据论文与页面内图表整理；网页结论不替代原文、代码与独立复现。</p>
        </footer>
      </main>
    </div>
  )
}

export default App









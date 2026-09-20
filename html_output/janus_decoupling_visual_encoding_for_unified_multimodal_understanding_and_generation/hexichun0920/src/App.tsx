import { useEffect, useState } from 'react'
import {
  AblationLab,
  ArchitectureRouter,
  BenchmarkExplorer,
  CFGLab,
  ClaimAudit,
  ComputeAudit,
  ConflictLab,
  LossMaskLab,
  TokenWorkbench,
  TrainingConsole,
} from './components/Interactions'

const chapters = [
  ['problem', '矛盾'],
  ['architecture', '架构'],
  ['tokens', '序列'],
  ['training', '训练'],
  ['inference', '推理'],
  ['evidence', '证据'],
  ['ablation', '消融'],
  ['boundaries', '边界'],
  ['map', '脉络'],
  ['check', '验收'],
]

function SectionHead({ no, kicker, title, intro }: { no: string; kicker: string; title: string; intro: string }) {
  return <header className="section-head"><span className="chapter-no">{no}</span><div><p>{kicker}</p><h2>{title}</h2><div className="section-intro">{intro}</div></div></header>
}

function App() {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('problem')

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? window.scrollY / max * 100 : 0)
      let current = chapters[0][0]
      for (const [id] of chapters) {
        const node = document.getElementById(id)
        if (node && node.getBoundingClientRect().top < window.innerHeight * 0.38) current = id
      }
      setActive(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <>
      <div className="progress" style={{ width: `${progress}%` }} />
      <nav className="rail" aria-label="章节导航">
        <a className="brand" href="#top" aria-label="返回顶部"><span>J</span></a>
        <div>{chapters.map(([id, label], index) => <a key={id} className={active === id ? 'active' : ''} href={`#${id}`}><i>{String(index + 1).padStart(2, '0')}</i><span>{label}</span></a>)}</div>
      </nav>

      <main id="top">
        <section className="hero">
          <div className="hero-grid" />
          <div className="hero-copy">
            <span className="edition">PAPER FIELD GUIDE · 02</span>
            <h1><em>Janus</em><br />一颗大脑，<br />两双眼睛。</h1>
            <p>理解想看见“是什么”，生成必须记住“长什么样”。Janus 不强迫同一种视觉表征兼顾两者：它拆开视觉入口，再让所有模态进入同一个自回归 Transformer。</p>
            <div className="hero-actions">
              <a href="#problem">开始推演 <span>↓</span></a>
              <a className="quiet" href="https://arxiv.org/abs/2410.13848" target="_blank" rel="noreferrer">阅读原论文 ↗</a>
            </div>
            <dl className="hero-facts">
              <div><dt>模型</dt><dd>1.3B</dd></div>
              <div><dt>图像</dt><dd>384²</dd></div>
              <div><dt>上下文</dt><dd>4096</dd></div>
              <div><dt>发表</dt><dd>arXiv 2024</dd></div>
            </dl>
          </div>
          <div className="janus-mark" aria-label="Janus 双路径视觉隐喻">
            <div className="face semantic-face"><span>SEMANTIC</span><b>理解</b><i>SigLIP</i></div>
            <div className="shared-brain"><small>共享</small><strong>AR</strong><small>Transformer</small></div>
            <div className="face pixel-face"><span>PIXEL</span><b>生成</b><i>VQ</i></div>
            <div className="orbit orbit-a" /><div className="orbit orbit-b" />
          </div>
          <div className="hero-credit">何熹淳 · XichunHe · AI 辅助制作</div>
        </section>

        <aside className="reading-key">
          <span>阅读图例</span>
          <p><i className="paper-dot" />论文事实</p>
          <p><i className="derive-dot" />由配置推导</p>
          <p><i className="teaching-dot" />教学模拟</p>
        </aside>

        <section id="problem" className="chapter">
          <SectionHead no="01" kicker="The representation conflict" title="统一任务，不等于统一表征" intro="统一多模态模型试图用一套系统同时回答图片问题和生成图片。麻烦在入口：理解需要压缩掉无关像素以留下语义，生成却要保留足够细节才能重建画面。" />
          <div className="prose two-col">
            <article><span className="mini-index">A</span><h3>理解：不必记住每一片雪</h3><p>判断“这是一座雪中的灯塔”依赖类别、属性和关系。SigLIP 一类语义编码器擅长把图像变成高层连续特征，再供语言模型推理。</p></article>
            <article><span className="mini-index">B</span><h3>生成：必须知道每一片雪怎么画</h3><p>从提示词生成图像需要颜色、纹理和空间细节。VQ Tokenizer 把图像压成可预测、可解码回 RGB 的离散 ID。</p></article>
          </div>
          <ConflictLab />
          <div className="takeaway"><span>一句话</span><p>Janus 的贡献不是“把理解和生成放进一个模型”本身，而是承认它们需要不同粒度的视觉入口。</p></div>
        </section>

        <section id="architecture" className="chapter tinted">
          <SectionHead no="02" kicker="Architecture" title="入口分开，主干共享" intro="两条视觉编码路径分别优化，但通过两层 MLP 适配器进入同一个 DeepSeek-LLM 1.3B。文本理解、图像理解和图像生成最终都被写成序列建模问题。" />
          <ArchitectureRouter />
          <div className="fact-band">
            <div><span>理解编码器</span><b>SigLIP-Large-Patch16-384</b><small>高层语义连续特征</small></div>
            <div><span>生成编码器</span><b>VQ · 16,384 codebook</b><small>16× 下采样，离散图像 ID</small></div>
            <div><span>适配器</span><b>两层 MLP × 2</b><small>分别映射到 LLM 输入空间</small></div>
          </div>
        </section>

        <section id="tokens" className="chapter">
          <SectionHead no="03" kicker="One autoregressive language" title="把三种任务写成同一个预测问题" intro="Janus 没有为图像生成设计特殊注意力掩码。文本头负责文本，随机初始化的图像头负责视觉 ID；训练目标仍是朴素的 next-token prediction。" />
          <TokenWorkbench />
          <LossMaskLab />
        </section>

        <section id="training" className="chapter tinted">
          <SectionHead no="04" kicker="Curriculum" title="先接线，再共学，最后听指令" intro="三阶段课程把“接口对齐”和“能力学习”分开：Stage I 只训练适配器与图像头；Stage II 解冻 LLM 做统一预训练；Stage III 混合三类指令数据进行监督微调。" />
          <TrainingConsole />
          <div className="prose three-col compact">
            <article><span className="mini-index">数据起点</span><h3>Stage I</h3><p>1.25M ShareGPT4V 图文对用于理解，约 1.2M ImageNet 样本用于生成。</p></article>
            <article><span className="mini-index">训练节奏</span><h3>Stage II</h3><p>前 120K 步呈现 ImageNet，后 60K 步使用其他生成数据：先像素依赖，再复杂场景。</p></article>
            <article><span className="mini-index">指令微调</span><h3>Stage III</h3><p>加入 4M 内部生成数据；只监督回答部分，遮蔽系统与用户提示。</p></article>
          </div>
        </section>

        <section id="inference" className="chapter">
          <SectionHead no="05" kicker="Inference" title="生成时，用 CFG 把条件方向放大" intro="理解任务按标准方式逐 token 采样文本；生成任务同时估计有条件与无条件 logits，再用 classifier-free guidance 增强提示词约束。" />
          <CFGLab />
        </section>

        <section id="evidence" className="chapter dark-section">
          <SectionHead no="06" kicker="Evidence, not slogans" title="性能要按任务、参数与指标方向读取" intro="Janus 在多个理解与生成基准上超过此前统一模型，并能与一些专用模型竞争。但“强”不等于每个表格都第一，参数口径与缺失值同样重要。" />
          <BenchmarkExplorer />
          <div className="evidence-cards">
            <article><span>Show-o → Janus</span><strong>948.4 → 1338.0</strong><p>MME，论文概括为约 +41%</p></article>
            <article><span>Show-o → Janus</span><strong>48.7 → 59.1</strong><p>GQA，论文概括为约 +30%</p></article>
            <article><span>Show-o → Janus</span><strong>0.53 → 0.61</strong><p>GenEval Overall，绝对提升 0.08</p></article>
          </div>
        </section>

        <section id="ablation" className="chapter">
          <SectionHead no="07" kicker="Causal evidence" title="真正支持核心主张的是哪组对照？" intro="排行榜只能说明“结果好”。消融实验通过控制视觉编码器和训练任务，才回答“单编码器是否产生权衡”以及“解耦后统一训练是否仍伤害单项能力”。" />
          <AblationLab />
        </section>

        <section id="boundaries" className="chapter tinted">
          <SectionHead no="08" kicker="Scope & cost" title="论文解决了什么，又没有解决什么" intro="高分解读需要把作者结论、由配置推导的成本，以及作品自己的判断分开。下面的边界并不否定贡献，而是说明证据覆盖到哪里。" />
          <div className="boundary-grid">
            <article className="yes"><span>论文直接支持</span><h3>双路径缓解视觉表征冲突</h3><p>表 5 的单编码器对照与双路径 Janus 支持这一结论；统一训练后的单项能力接近专用训练。</p></article>
            <article className="yes"><span>论文直接支持</span><h3>统一自回归框架可兼顾两类任务</h3><p>同一 Transformer、同一交叉熵形式、不同输入路径与输出头，构成简单且可扩展的统一设计。</p></article>
            <article className="no"><span>不应过度声称</span><h3>并非所有指标、所有模型规模都领先</h3><p>例如 MJHQ-30K FID 仍落后于 VILA-U (384)；不同模型的参数量和外部模块也不完全一致。</p></article>
            <article className="no"><span>作品分析</span><h3>384²、AR 延迟与训练资源仍是约束</h3><p>原论文输出 384×384，逐 token 图像生成有序列开销；训练约用 128 张 A100 持续 7 天。</p></article>
          </div>
          <ComputeAudit />
        </section>

        <section id="map" className="chapter">
          <SectionHead no="09" kicker="Research map" title="从 Janus 到 DeltaV：问题发生在哪一层？" intro="两篇作业可以连成一条研究主线：Janus 处理“理解与生成如何共享主干”，DeltaV 进一步追问“统一模型推理时如何高效更新视觉状态”。" />
          <div className="research-map">
            <div className="timeline-line" />
            <article><time>2024</time><span>Janus</span><h3>视觉入口如何统一？</h3><p>以 SigLIP 与 VQ 双路径缓解语义抽象和像素重建之间的冲突。</p><b>架构层</b></article>
            <article><time>2025</time><span>Janus-Pro</span><h3>如何通过数据与规模继续增强？</h3><p>官方后续版本优化训练策略、扩展数据，并扩大到 7B；这是后续工作，不属于原 Janus 实验。</p><b>规模与数据层</b></article>
            <article><time>2026</time><span>DeltaV</span><h3>视觉思考如何避免反复重画？</h3><p>用视觉状态更新表达推理变化，讨论统一大模型中的视觉推理效率。</p><b>推理过程层</b></article>
          </div>
          <div className="takeaway"><span>研究主线</span><p>先让统一模型拥有合适的“眼睛”，再研究它如何用视觉状态连续“思考”。</p></div>
        </section>

        <section id="check" className="chapter dark-section final-section">
          <SectionHead no="10" kicker="Final check" title="你真的读懂了吗？" intro="完成五个判断。能区分“视觉编码解耦”和“模型完全拆分”，能正确读 FID 与缺失项，就掌握了这篇论文最容易被误解的部分。" />
          <ClaimAudit />
          <div className="final-summary">
            <span>Janus in 3 lines</span>
            <ol>
              <li><b>冲突：</b>理解需要高层语义，生成需要低层细节。</li>
              <li><b>设计：</b>SigLIP 与 VQ 分路编码，共享 1.3B 自回归 Transformer。</li>
              <li><b>证据：</b>单编码器消融暴露任务权衡，双路径统一训练保住两类能力。</li>
            </ol>
          </div>
        </section>

        <footer>
          <div><span className="edition">SOURCES</span><h2>继续阅读</h2></div>
          <div className="source-list">
            <a href="https://arxiv.org/abs/2410.13848" target="_blank" rel="noreferrer"><span>01</span><b>Janus 原论文</b><small>arXiv:2410.13848 ↗</small></a>
            <a href="https://github.com/deepseek-ai/Janus" target="_blank" rel="noreferrer"><span>02</span><b>官方代码与模型</b><small>deepseek-ai/Janus ↗</small></a>
            <a href="https://grokcv.site/sprouts/umm/" target="_blank" rel="noreferrer"><span>03</span><b>新芽专题：生成和理解统一模型</b><small>GrokCV ↗</small></a>
          </div>
          <p className="footer-note">内容依据 Janus 原论文与官方项目整理。教学模拟与配置推导均在页面中明确标注。制作：何熹淳（XichunHe），2026-09-20。</p>
        </footer>
      </main>
    </>
  )
}

export default App

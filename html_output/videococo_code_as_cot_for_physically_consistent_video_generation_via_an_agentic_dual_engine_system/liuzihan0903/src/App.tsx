import { useEffect, useState } from 'react';
import { VideoCoCoLab } from './modules/videococo-lab';

const asset = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

const sections = [
  ['background', '一、背景与问题'], ['solution', '二、总体方案'], ['method', '三、具体方法'],
  ['results', '四、实验结果'], ['outlook', '五、不足与展望'],
] as const;

const examples = [
  ['真空坍缩', asset('figure3-vacuum.png'), '密封塑料瓶在空气被抽出时逐渐坍缩。'],
  ['干冰升华', asset('figure3-sublimation.png'), '随着温度升高，干冰直接升华。'],
  ['冲击破碎', asset('figure3-impact.png'), '鸡蛋被用力扔向粗糙岩面，并在撞击时破碎。'],
  ['浮力', asset('figure3-buoyancy.png'), '木制玩具被轻放在一碗水的表面。'],
] as const;

function Arrow() { return <span className="arrow" aria-hidden="true">→</span>; }

function Bottle({ stage = 0 }: { stage?: number }) {
  return <span className={`bottle-shape bottle-stage-${stage}`} aria-hidden="true"><i /></span>;
}

function GeneratorIcon() {
  return <svg className="generator-icon" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="13" width="48" height="38" rx="8" /><path d="M17 23h30M17 32h18M17 41h12" /><circle cx="45" cy="40" r="7" /><path d="m43 36 6 4-6 4z" /></svg>;
}

function InstructionIcon({ kind }: { kind: 'prompt' | 'draft' | 'agent' | 'appearance' | 'lock' }) {
  if (kind === 'prompt') return <svg viewBox="0 0 48 48"><path d="M7 9h34v25H18l-9 7v-7H7zM14 17h20M14 24h14" /></svg>;
  if (kind === 'draft') return <svg viewBox="0 0 48 48"><rect x="5" y="10" width="38" height="28" rx="4" /><path d="M12 10v28m24-28v28M5 17h7m24 0h7M5 31h7m24 0h7" /><circle cx="24" cy="24" r="6" /></svg>;
  if (kind === 'agent') return <svg viewBox="0 0 48 48"><path d="M24 5v7M12 15h24a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V21a6 6 0 0 1 6-6Z" /><circle cx="17" cy="27" r="3" /><circle cx="31" cy="27" r="3" /><path d="M17 36h14" /></svg>;
  if (kind === 'appearance') return <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" /><path d="M24 7v34M7 24h34M12 13l24 22M36 13 12 35" /></svg>;
  return <svg viewBox="0 0 48 48"><rect x="10" y="21" width="28" height="21" rx="4" /><path d="M16 21v-7a8 8 0 0 1 16 0v7M24 29v6" /></svg>;
}

function OutlookIcon({ kind }: { kind: 'latency' | 'engine' | 'data' | 'vision' | 'robot' }) {
  if (kind === 'latency') return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="25" r="16" /><path d="M24 15v11l8 5M18 5h12M24 5v4" /></svg>;
  if (kind === 'engine') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 12h32v24H8zM14 18h8v8h-8zM28 18h6M28 24h6M14 31h20" /><path d="M4 19h4M4 29h4M40 19h4M40 29h4" /></svg>;
  if (kind === 'data') return <svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="11" rx="15" ry="6" /><path d="M9 11v12c0 3 7 6 15 6s15-3 15-6V11M9 23v12c0 3 7 6 15 6s15-3 15-6V23" /></svg>;
  if (kind === 'vision') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 24s7-12 19-12 19 12 19 12-7 12-19 12S5 24 5 24Z" /><circle cx="24" cy="24" r="6" /><path d="M36 8l5-5M12 8 7 3" /></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5v7M12 15h24a6 6 0 0 1 6 6v15a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V21a6 6 0 0 1 6-6Z" /><circle cx="17" cy="27" r="3" /><circle cx="31" cy="27" r="3" /><path d="M16 36h16M6 25H2M46 25h-4" /></svg>;
}

function DatasetIcon({ kind }: { kind: 'prompt' | 'prepare' | 'teacher' | 'dataset' }) {
  if (kind === 'prompt') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 9h34v25H18l-9 7v-7H7zM14 17h20M14 24h14" /></svg>;
  if (kind === 'prepare') return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="8" width="17" height="14" rx="3" /><rect x="26" y="26" width="17" height="14" rx="3" /><path d="M22 15h7a6 6 0 0 1 6 6v5M14 22v9a5 5 0 0 0 5 5h7M10 13h7M31 31h7" /></svg>;
  if (kind === 'teacher') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5v7M12 15h24a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V21a6 6 0 0 1 6-6Z" /><circle cx="17" cy="27" r="3" /><circle cx="31" cy="27" r="3" /><path d="M17 36h14M24 5l3-2" /></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="11" rx="15" ry="6" /><path d="M9 11v12c0 3 7 6 15 6s15-3 15-6V11M9 23v12c0 3 7 6 15 6s15-3 15-6V23" /><path d="m19 21 3 3 7-7" /></svg>;
}

function Title({ n, en, title, lead }: { n: string; en: string; title: string; lead: string }) {
  return <header className="section-title"><span>{n}</span><div><p className="eyebrow">{en}</p><h2>{title}</h2><p>{lead}</p></div></header>;
}

function SubTitle({ n, en, title }: { n: string; en: string; title: string }) {
  return <header className="sub-title"><span>{n}</span><div><p className="eyebrow">{en}</p><h3>{title}</h3></div></header>;
}

function Lab({ chapter, module = 'main', title }: { chapter: string; module?: string; title: string }) {
  return <div className="interactive-card indented"><div className="interactive-head"><span>INTERACTIVE</span><strong>{title}</strong><i>画布中的状态会持续演示，也可以手动切换</i></div><VideoCoCoLab chapterId={chapter} moduleId={module} /></div>;
}

export default function App() {
  const [active, setActive] = useState('');
  const [example, setExample] = useState(0);
  const [processRevealed, setProcessRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const current = entries.filter(x => x.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActive(current.target.id);
    }, { rootMargin: '-24% 0px -60%', threshold: [0, .2, .5] });
    sections.forEach(([id]) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setExample(current => (current + 1) % examples.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  return <>
    <header className="topbar">
      <a className="brand" href="#top">VideoCoCo</a>
      <nav aria-label="论文讲解导航">{sections.map(([id, label]) => <a className={active === id ? 'active' : ''} href={`#${id}`} key={id}>{label}</a>)}</nav>
    </header>

    <main id="top">
      <section className="hero">
        <p className="kicker">Physically-Consistent Video Generation · 2026</p>
        <h1>VideoCoCo</h1>
        <p className="hero-subtitle">Code-as-CoT for Physically-Consistent Video Generation<br />via an Agentic Dual-Engine System</p>
        <div className="keywords"><span>Code-as-CoT</span><span>物理一致性</span><span>双引擎系统</span><span>视频生成</span></div>
        <p className="hero-claim">视频生成中，需要将<strong>物理过程建模</strong>与<strong>视觉外观生成</strong>解耦。</p>
        <a className="start-button" href="#background">开始学习</a>
      </section>

      <section id="background" className="paper-section">
        <Title n="一" en="Background / Problem" title="背景与问题" lead="从生成结果中的物理错误出发，进一步追溯文本到视频模型难以显式表达完整动态过程的根源。" />
        <div className="merged-part first-part">
          <SubTitle n="1.1" en="Problem Phenomenon" title="视觉真实，不等于物理正确" />
        <div className="problem-intro">
          <p className="large-copy">模型可以生成“看起来真实”的单帧，却可能在物体运动、状态变化与时间演化上违反物理规律。</p>
          <p>下面三个生成结果分别展示了常见的过程错误。</p>
        </div>
        <div className="problem-evidence-grid">
          <article className="problem-evidence">
            <video controls muted loop playsInline preload="metadata" src={asset('problem-1.mp4')} aria-label="物体运动轨迹缺乏稳定约束的生成视频示例" />
            <div><span>01</span><p className="eyebrow">Motion Trajectory</p><h3>物体运动轨迹缺乏稳定约束</h3></div>
          </article>
          <article className="problem-evidence">
            <video controls muted loop playsInline preload="metadata" src={asset('problem-2.mp4')} aria-label="中间状态跳变或缺失的生成视频示例" />
            <div><span>02</span><p className="eyebrow">Intermediate State</p><h3>中间状态可能跳变或缺失</h3></div>
          </article>
          <article className="problem-evidence">
            <video controls muted loop playsInline preload="metadata" src={asset('problem-3.mp4')} aria-label="因果顺序与时间尺度不可靠的生成视频示例" />
            <div><span>03</span><p className="eyebrow">Causal Order</p><h3>因果顺序与时间尺度不可靠</h3></div>
          </article>
        </div>
        </div>

        <div className="merged-part reason-part">
        <SubTitle n="1.2" en="Root Cause" title="文字描述压缩了完整动态过程" />
        <p className="merged-lead">自然语言往往只给出初始条件与目标事件，却没有逐时刻指定中间状态。</p>
        <div className="case-flow" aria-label="文本提示直接生成视频的案例流程">
          <div className="case-node prompt-node">
            <div><p className="eyebrow">Prompt · 文本提示</p><strong>A sealed plastic bottle collapsing<br />as air is extracted.</strong></div>
            <Bottle />
          </div>
          <span className="flow-down" aria-hidden="true">↓</span>
          <div className="case-node generator-node">
            <GeneratorIcon />
            <div><p className="eyebrow">Video Generator</p><strong>视频生成模型</strong><div className="generating"><i /><i /><i /><span>Generating process and appearance</span></div></div>
          </div>
          <span className="flow-down" aria-hidden="true">↓</span>
          <div className="generated-node">
            <video className="generated-video" controls muted loop playsInline preload="metadata" src={asset('problem-root-video.mp4')} aria-label="密封塑料瓶抽气后坍缩的生成视频" />
            <div className="consistency-check"><span>Visual Realism <b>✓</b></span><span>Physical Consistency <b>✕</b></span></div>
          </div>
        </div>

        <div className="dual-task">
          <div className="dual-task-title"><p className="eyebrow">One Model, Two Responsibilities</p><h3>一个生成器需要同时完成两类任务</h3></div>
          <div className="branch-diagram">
            <div className="generator-hub"><GeneratorIcon /><strong>Video Generator</strong></div>
            <div className="branch-lines" aria-hidden="true"><i /><i /></div>
            <div className="branch-target dynamics"><span>Physical Dynamics</span><ul><li>Object motion</li><li>State evolution</li><li>Temporal process</li></ul></div>
            <div className="branch-target appearance"><span>Visual Appearance</span><ul><li>Material</li><li>Lighting</li><li>Style</li></ul></div>
          </div>
        </div>

        <aside className="opacity"><div><p className="eyebrow">Causal Opacity</p><h3>因果不透明性</h3></div><p>Prompt 没有显式给出中间状态，完整物理过程只能由生成器内部隐式补全，因此难以检查它采用了什么机制、又在哪一步偏离规律。</p></aside>

        <div className={`hidden-process ${processRevealed ? 'revealed' : ''}`}>
          <div className="hidden-process-head"><div><p className="eyebrow">Interactive</p><h3>Reveal the Hidden Process</h3></div><button onClick={() => setProcessRevealed(value => !value)} aria-expanded={processRevealed}>{processRevealed ? '收起过程' : '展开隐藏过程'}</button></div>
          <div className="hidden-prompt"><span>Prompt</span><strong>A bottle collapses<br />as air is extracted.</strong></div>
          <div className="hidden-process-body" aria-hidden={!processRevealed}>
            <p>The model also needs:</p>
            <div className="process-timeline">
              {['Initial state', 'Intermediate states', 'Temporal evolution', 'Final state'].map((label, index) => <div key={label}><span>t{index}</span><Bottle stage={index} /><strong>{label}</strong><small>{['Normal bottle', 'Deformation', 'Collapse', 'Final state'][index]}</small></div>)}
            </div>
          </div>
        </div>
        </div>
      </section>

      <section id="solution" className="paper-section">
        <Title n="二" en="Overall Solution" title="双引擎：先建模过程，再生成外观" lead="VideoCoCo 将过程建模交给可执行代码与 Blender，将高保真渲染交给生成式视频模型。" />
        <figure className="paper-figure main-figure"><img src={asset('figure-2.png')} alt="VideoCoCo 论文方法总览图" /><figcaption>论文 Figure 2：橙色部分负责过程，蓝色部分负责视觉。</figcaption></figure>
        <div className="butter-workflow">
          <header className="workflow-heading"><p className="eyebrow">Figure 2 Example · Interactive Reconstruction</p><h3>把论文中的黄油融化案例沿双引擎完整展开</h3><p>橙色路径落实物理过程，蓝色路径在保留 Draft 动态的前提下生成视觉外观。</p></header>

          <div className="workflow-stage simulation-stage"><div className="stage-label"><span>Stage 1</span><strong>Executable Simulation Engine</strong></div>
            <div className="simulation-flow">
              <article className="workflow-card prompt-card"><span className="step-index">01</span><p className="eyebrow">User Prompt</p><h4>A cinematic slow push-in watches as a knob of butter in a sizzling skillet foams, browns and pools, leaving melted butter.</h4></article>
              <span className="workflow-arrow" aria-hidden="true">→</span>
              <article className="workflow-card code-card"><span className="step-index">02</span><p className="eyebrow">Coding Agent · Blender Python</p><pre><code>{`# Scene setup
scene = init_scene()
add_object('metal_plate', 'ice_cube')
# Physics
set_material('metal', temp=350)
simulate_melting('ice_cube')
# Animation
animate(melting=True, spreading=True)
# Render
render_animation('draft.mp4')`}</code></pre></article>
              <span className="workflow-arrow" aria-hidden="true">→</span>
              <article className="workflow-card draft-card"><span className="step-index">03</span><p className="eyebrow">Spatiotemporal Draft</p><img src={asset('butter-draft-frames.png')} alt="四帧黄油融化 Blender 白模过程" /><div className="draft-ticks"><span>t0 · 固态</span><span>t1 · 软化</span><span>t2 · 塌陷</span><span>t3 · 铺开</span></div></article>
            </div>
          </div>

          <div className="stage-handoff"><span>Draft 提供过程约束</span><i aria-hidden="true">↓</i><span>Prompt 提供目标语义</span></div>

          <div className="workflow-stage generation-stage"><div className="stage-label"><span>Stage 2</span><strong>Generative Video Engine</strong></div>
            <div className="instruction-flow">
              <div className="instruction-inputs"><div><span>Prompt</span><p>A cinematic slow push-in watches as a knob of butter in a sizzling skillet foams, browns and pools, leaving melted butter.</p></div><div><span>Draft</span><img src={asset('butter-draft-frames.png')} alt="输入 Instruction Agent 的黄油融化白模草稿" /></div></div>
              <span className="workflow-arrow" aria-hidden="true">→</span>
              <div className="agent-node"><GeneratorIcon /><span>Instruction Agent</span><small>Compose editing instruction</small></div>
              <span className="workflow-arrow" aria-hidden="true">→</span>
              <article className="editing-prompt"><p className="eyebrow">Editing Prompt · Output</p><p>A pale golden knob of butter at the center of a dark cast-iron skillet, product-style close-up. Under heat it softens, slumps downward, and spreads into a thin sizzling pool with foamy edges, ripples, and nutty amber browning. Warm directional light with a bright rim creates wet gleaming highlights. Fixed slightly elevated three-quarter view, subtle push-in, ~85mm, shallow depth of field. Warm butter-gold and toasted amber tones, rich savory mood, photorealistic, cinematic, crisp detail. --resolution 720p --duration 5 --ratio 16:9</p></article>
            </div>

            <div className="generator-merge"><div className="merge-input"><span>Draft</span><img src={asset('butter-draft-frames.png')} alt="送入生成器的时空草稿" /></div><b>+</b><div className="merge-input prompt-output"><span>Editing Prompt</span><p>外观、材质、光照与镜头指令</p></div><span className="workflow-arrow" aria-hidden="true">→</span><div className="video-generator"><GeneratorIcon /><strong>Video Generator</strong><small>Draft-conditioned editing</small></div><span className="workflow-arrow" aria-hidden="true">→</span><div className="final-video-output"><span>Final Video</span><video controls muted loop playsInline preload="metadata" src={asset('butter-final-video.mp4')} aria-label="黄油融化的最终生成视频" /><strong>高保真生成结果</strong></div></div>
          </div>
        </div>
      </section>

      <section id="method" className="paper-section method-section">
        <Title n="三" en="Specific Methods" title="三个模块完成从过程到画面的衔接" lead="Code-as-CoT、Instruction Agent 与三元组数据集共同支撑双引擎框架。" />

        <article className="method-block">
          <SubTitle n="3.1" en="Code as Chain-of-Thought" title="将 Code 作为 CoT" />
          <p className="method-lead">与仅使用文本计划或中间图像不同，VideoCoCo 用可执行代码实例化过程级中间表示。</p>
          <figure className="paper-figure indented"><img src={asset('figure-1.png')} alt="论文 Figure 1：四种视觉生成 CoT 中间表示比较" /><figcaption>论文 Figure 1：按原图四块结构比较不同 CoT 形式。</figcaption></figure>
          <Lab chapter="chap-3" title="检查 Code-as-CoT 的三项性质" />
        </article>

        <article className="method-block">
          <SubTitle n="3.2" en="Instruction Agent" title="由 Prompt 与 Draft 生成视觉编辑指令" />
          <div className="instruction-explainer indented">
            <header><p className="eyebrow">Why Prompt + Draft?</p><h4>两个输入描述的是同一事件，但信息层级完全不同</h4><p>Instruction Agent 的作用不是再次推理运动，而是把两种互补信号整理成只关注外观的编辑指令。</p></header>
            <div className="signal-pair">
              <article className="signal-card prompt-signal"><InstructionIcon kind="prompt" /><div><span>Prompt p · WHAT</span><h5>压缩、抽象，说明事件是什么</h5><p>保留主体身份和目标语义，但没有充分指定材质、光照与电影风格。</p><small>单独使用的风险：外观描述不足，编辑器还可能重新猜测运动。</small></div></article>
              <div className="signal-plus">+</div>
              <article className="signal-card draft-signal"><InstructionIcon kind="draft" /><div><span>Draft d · HOW</span><h5>时序稠密，说明事件如何展开</h5><p>逐帧固定空间结构、运动轨迹和状态演化，但仍是低保真白模。</p><small>单独使用的不足：缺少真实主体、材质、光照与视觉风格。</small></div></article>
            </div>
            <div className="instruction-converge" aria-hidden="true"><i /><i /><b>↓</b></div>
            <div className="instruction-agent-node"><div className="agent-identity"><InstructionIcon kind="agent" /><div><span>Instruction Agent</span><strong>A<sub>edit</sub>(p, d)</strong></div></div><p>同时读取 Prompt 与 Draft，补足外观信息，并显式避免重定义 Draft 中已有的运动。</p></div>
            <div className="instruction-output-arrow" aria-hidden="true">↓</div>
            <div className="instruction-output"><div className="output-title"><InstructionIcon kind="appearance" /><div><span>Editing Instruction e</span><strong>只描述“最终画面应当如何呈现”</strong></div></div><div className="appearance-items"><span>Subject</span><span>Material</span><span>Lighting</span><span>Cinematic Style</span></div><div className="motion-lock"><InstructionIcon kind="lock" /><p><strong>Motion locked by Draft</strong><br />不覆盖、不重写已经实例化的物理过程</p></div></div>
            <div className="instruction-equations"><span>e = A<sub>edit</sub>(p, d)</span><b>→</b><span>v̂ = G<sub>θ</sub>(d, e)</span></div>
          </div>

        </article>

        <article className="method-block">
          <SubTitle n="3.3" en="Triplet Dataset" title="构建 Draft–Instruction–Target 三元组数据集" />
          <p className="method-lead">论文使用教师模型构建包含 3,000 组 Draft–Instruction–Target 三元组的数据集，让编辑模型学习保留草稿动态并恢复高保真视觉。</p>
          <div className="teacher-pipeline indented">
            <header><div><p className="eyebrow">Teacher-Based Triplet Construction</p><h4>教师模型如何构建 VideoCoCo-3K</h4></div><span>3,000 Triplets</span></header>
            <div className="teacher-flow">
              <article><div className="dataset-icon orange"><DatasetIcon kind="prompt" /></div><span>STEP 01</span><strong>收集来源 Prompt</strong><p>得到目标物理事件描述 <code>pᵢ</code></p><small>排除评测集 Prompt 及近重复项</small></article>
              <b aria-hidden="true">→</b>
              <article className="dual-output"><div className="dataset-icon blue"><DatasetIcon kind="prepare" /></div><span>STEP 02</span><strong>生成两项条件</strong><div><i>Simulation Engine</i><em>Draft dᵢ</em></div><div><i>Instruction Agent</i><em>Instruction eᵢ</em></div></article>
              <b aria-hidden="true">→</b>
              <article className="teacher-node"><div className="dataset-icon orange"><DatasetIcon kind="teacher" /></div><span>STEP 03 · TEACHER</span><strong>Seedance 2.0</strong><p><code>yᵢ = G<sub>T</sub>(dᵢ, eᵢ)</code></p><small>每个三元组调用一次教师编辑器</small></article>
              <b aria-hidden="true">→</b>
              <article className="dataset-node"><div className="dataset-icon green"><DatasetIcon kind="dataset" /></div><span>STEP 04</span><strong>VideoCoCo-3K</strong><p><code>(dᵢ, eᵢ, yᵢ)</code> × 3,000</p><small>同时保留原 Prompt 与 Blender 程序作为元数据</small></article>
            </div>
            <footer><span><b>Draft dᵢ</b> 锁定物理过程</span><span><b>Instruction eᵢ</b> 指定真实外观</span><span><b>Target yᵢ</b> 提供训练监督</span></footer>
          </div>
          <div className="triplet-static indented">
            <header><div><p className="eyebrow">VideoCoCo-3K · Triplet Dataset Example</p><h4>一组三元组数据：Draft、Instruction 与 Target 对齐</h4></div><div className="triplet-equation"><span>Draft d</span><b>+</b><span>Instruction e</span><b>→</b><span>Target y</span></div></header>
            <div className="triplet-video-pair">
            <figure><div className="video-label"><span>01</span><div><strong>Draft · video.mp4</strong><small>低保真时空草稿</small></div></div><video controls muted loop playsInline preload="metadata" src={asset('video.mp4')} aria-label="三元组中的 Draft 视频" /></figure>
            <figure><div className="video-label target"><span>02</span><div><strong>Target · seedance.mp4</strong><small>高保真目标视频</small></div></div><video controls muted loop playsInline preload="metadata" src={asset('seedance.mp4')} aria-label="三元组中的 Target 视频" /></figure>
            </div>
            <div className="triplet-prompt-visible"><div className="prompt-label"><span>03</span><div><p className="eyebrow">Editing Instruction · e</p><strong>视觉编辑 Prompt</strong></div></div><p>Extreme macro close-up of two fingertips pressing down onto a soft foam earplug resting on a brushed stainless-steel prep table. The earplug is dense open-cell memory foam, matte with a faintly velvety porous skin in warm cream-orange. Under the driving motion the fingertips descend and squeeze it flat, the foam compressing and bulging outward into a squashed dome, then slowly springing back and recovering its rounded form as the fingers lift away.</p></div>
          </div>
        </article>
      </section>

      <section id="results" className="paper-section">
        <Title n="四" en="Experiments" title="实验结果：定性、定量与消融" lead="实验从可视化案例、基准分数和训练策略三个角度验证方法。" />
        <article className="result-block"><SubTitle n="4.1" en="Qualitative" title="定性实验" />
          <div className="qualitative-carousel indented" aria-live="polite">
            <div className="carousel-top"><span><i />AUTO PLAY</span><p><b>{String(example + 1).padStart(2, '0')}</b> / {String(examples.length).padStart(2, '0')}</p></div>
            <div className="carousel-card" key={examples[example][0]}>
              <figure><img src={examples[example][1]} alt={`Figure 3 中的${examples[example][0]}案例`} /><figcaption>论文 Figure 3 · 不同方法定性对比</figcaption></figure>
              <div className="carousel-copy"><p className="eyebrow">Physical Prompt</p><h4>{examples[example][0]}</h4><p>{examples[example][2]}</p><div className="comparison-note"><span>阅读方式</span><strong>从左至右比较生成结果</strong><small>最右列为 VideoCoCo</small></div></div>
            </div>
            <div className="carousel-nav" aria-label="定性案例轮播进度">{examples.map((x, i) => <button type="button" aria-label={`查看${x[0]}案例`} aria-current={example === i} className={example === i ? 'active' : ''} onClick={() => setExample(i)} key={x[0]}><span>{x[0]}</span><i /></button>)}</div>
          </div>
        </article>
        <article className="result-block"><SubTitle n="4.2" en="Quantitative" title="定量实验" />
          <div className="benchmark-grid indented">
            <article className="benchmark-card phygen">
              <header><div><p className="eyebrow">Benchmark 01</p><h4>PhyGenBench</h4></div><span>↑ 越高越好</span></header>
              <div className="vertical-chart" role="img" aria-label="PhyGenBench 平均分：OmniWeaving 0.475，加入 VideoCoCo 后 0.558">
                <div className="chart-scale"><span>0.60</span><span>0.45</span><span>0.30</span><span>0.15</span><span>0</span></div>
                <div className="chart-bars">
                  <div className="vertical-bar baseline"><strong>0.475</strong><i style={{ height: '79.2%' }} /><span>OmniWeaving</span></div>
                  <div className="vertical-bar ours"><strong>0.558</strong><i style={{ height: '93%' }} /><span>+ VideoCoCo</span></div>
                </div>
              </div>
              <p className="benchmark-conclusion"><b>结论</b> 平均分由 <strong>0.475</strong> 提升至 <strong>0.558</strong>，提升约 17.5%。</p>
            </article>
            <article className="benchmark-card vbench">
              <header><div><p className="eyebrow">Benchmark 02</p><h4>VBench-2.0</h4></div><span>↑ 越高越好</span></header>
              <div className="vertical-chart" role="img" aria-label="VBench-2.0 物理维度平均分：OmniWeaving 52.18%，加入 VideoCoCo 后 77.88%">
                <div className="chart-scale"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div>
                <div className="chart-bars">
                  <div className="vertical-bar baseline"><strong>52.18%</strong><i style={{ height: '52.18%' }} /><span>OmniWeaving</span></div>
                  <div className="vertical-bar ours"><strong>77.88%</strong><i style={{ height: '77.88%' }} /><span>+ VideoCoCo</span></div>
                </div>
              </div>
              <p className="benchmark-conclusion"><b>结论</b> 物理维度平均分由 <strong>52.18%</strong> 提升至 <strong>77.88%</strong>，提升 25.70 个百分点。</p>
            </article>
          </div>
        </article>
        <article className="result-block"><SubTitle n="4.3" en="Ablation" title="消融实验" />
          <Lab chapter="chap-10" module="10.2" title="切换不同适配设置查看消融结果" />
        </article>
      </section>

      <section id="outlook" className="paper-section outlook-section">
        <Title n="五" en="Limitations & Outlook" title="不足与展望：从可执行生成到具身智能" lead="先明确 VideoCoCo 当前能做什么、不能做什么，再讨论可执行过程建模对视觉生成与 VLA 的潜在启发。" />

        <article className="outlook-block"><SubTitle n="5.1" en="Limitations" title="论文的不足与待改进之处" />
          <div className="limit-overview indented">
            <div className="limit-flow" aria-label="VideoCoCo 多阶段推理链带来的时延与仿真边界">
              <div><span>01</span><strong>Prompt</strong><small>目标物理事件</small></div><b>→</b>
              <div><span>02</span><strong>Code Agent</strong><small>生成 Blender 程序</small></div><b>→</b>
              <div className="bottleneck"><span>03</span><strong>Simulation</strong><small>执行与渲染草稿</small><i>主要边界</i></div><b>→</b>
              <div><span>04</span><strong>Video Editor</strong><small>恢复真实外观</small></div>
            </div>
            <p><strong>核心矛盾：</strong>可执行中间过程带来了可控性和可检查性，但同时增加了一条必须在推理时运行的工具链。</p>
          </div>
          <div className="limitation-grid indented">
            <article><div className="outlook-icon orange"><OutlookIcon kind="latency" /></div><span>LIMIT 01</span><h4>推理链更长</h4><p>代码生成、沙箱执行、草稿渲染与视频编辑依次发生，相比端到端生成会引入额外时延。</p><footer><b>待改进</b><span>知识蒸馏，把可执行物理先验内化到端到端模型中。</span></footer></article>
            <article><div className="outlook-icon blue"><OutlookIcon kind="engine" /></div><span>LIMIT 02</span><h4>受仿真器表达能力约束</h4><p>Blender 能稳定实例化常见刚体、材料与热过程，但复杂湍流等现象仍难以零样本合成。</p><footer><b>待改进</b><span>按任务路由至 Taichi、流体或柔体等专用物理引擎。</span></footer></article>
            <article><div className="outlook-icon green"><OutlookIcon kind="data" /></div><span>LIMIT 03</span><h4>编辑器适配仍依赖数据</h4><p>VideoCoCo-3K 连接白模草稿与真实视频；论文观察到有限三元组数据下，全量微调更容易偏离原有视觉先验。</p><footer><b>待改进</b><span>扩大过程类型与外观覆盖，并保留 LoRA 等轻量适配策略。</span></footer></article>
          </div>
          <aside className="evidence-note indented"><b>论文明确结论</b><span>以上限制与方向来自论文 Conclusion 及消融分析；其中 Taichi 与知识蒸馏由作者直接提出。</span></aside>
        </article>

        <article className="outlook-block inspiration-block"><SubTitle n="5.2" en="Research Outlook" title="对未来视觉生成与 VLA 的启发" />
          <div className="outlook-lanes indented">
            <article className="research-lane vision-lane">
              <header><div className="outlook-icon orange"><OutlookIcon kind="vision" /></div><div><p className="eyebrow">For Visual Generation</p><h4>从“生成像素”走向“先实例化过程”</h4></div></header>
              <div className="lane-diagram"><span>文本意图<small>发生什么</small></span><b>→</b><span className="focus">可执行过程<small>如何发生</small></span><b>→</b><span>视觉生成<small>看起来如何</small></span></div>
              <ul><li><b>中间表示应可验证：</b>不仅给出文本计划或关键帧，还能执行、回放与局部修改。</li><li><b>生成模型可模块化：</b>物理引擎负责动力学，生成器专注材质、光照和真实感。</li><li><b>合成数据可携带因果结构：</b>草稿—指令—目标三元组把“过程保持”变成可监督目标。</li></ul>
              <p className="lane-takeaway">长期方向：先用工具显式执行，再将其能力蒸馏回统一的视频世界模型。</p>
            </article>
            <article className="research-lane vla-lane">
              <header><div className="outlook-icon blue"><OutlookIcon kind="robot" /></div><div><p className="eyebrow">For Vision-Language-Action</p><h4>把 Code-as-CoT 延伸为可执行动作推演</h4></div></header>
              <div className="vla-loop" aria-label="VLA 可执行动作推演闭环"><span>视觉观测<small>Vision</small></span><b>+</b><span>语言目标<small>Language</small></span><b>→</b><span className="focus">动作程序 / 模拟 rollout<small>Executable plan</small></span><b>→</b><span>机器人动作<small>Action</small></span><i>环境反馈 ↺</i></div>
              <ul><li><b>计划可检查：</b>在真正执行前检查碰撞、时序和约束，便于定位失败来自理解、规划还是控制。</li><li><b>反事实数据：</b>在仿真中改变物体、材质和初始状态，形成带过程标签的多样化训练轨迹。</li><li><b>世界模型与策略分工：</b>过程模型预测动作后果，VLA 根据视觉反馈选择和修正动作。</li></ul>
              <p className="lane-takeaway">这是基于 VideoCoCo 机制的研究推演，并非论文已经验证的 VLA 实验结论。</p>
            </article>
          </div>
          <div className="outlook-bridge indented"><p className="eyebrow">Shared Principle</p><h4>共同启发：让“中间思考”落到可执行、可观察、可纠错的世界状态上。</h4><div><span>可执行 Executable</span><span>可检查 Inspectable</span><span>可验证 Verifiable</span><span>可蒸馏 Distillable</span></div></div>
          <aside className="outlook-sources indented"><span>延伸阅读</span><a href="https://deepmind.google/blog/rt-2-new-model-translates-vision-and-language-into-action/" target="_blank" rel="noreferrer">RT-2：视觉语言到动作</a><a href="https://openvla.github.io/" target="_blank" rel="noreferrer">OpenVLA：开放 VLA 模型</a><a href="https://research.nvidia.com/labs/dir/cosmos1/" target="_blank" rel="noreferrer">Cosmos：Physical AI 世界模型</a></aside>
        </article>
      </section>

      <footer><strong>VideoCoCo</strong><span>交互式论文讲解 · 依据论文原文与网站大纲组织</span><a href="#top">返回顶部 ↑</a></footer>
    </main>
  </>;
}

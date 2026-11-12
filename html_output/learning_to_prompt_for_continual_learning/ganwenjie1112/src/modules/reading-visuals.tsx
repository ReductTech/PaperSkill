import { Specimen } from "./specimen";
import { VectorGlyph } from "./vit-visuals";
import { Sub } from "./lesson-math";
import { Term } from "../shared/core/reference/ReferenceHub";
import "./reading-visuals.css";

function CauseGlyph({ kind }: { kind: "shared" | "update" | "past" }) {
  return <svg className="cause-glyph" viewBox="0 0 40 36" aria-hidden="true">
    {kind === "shared" ? <><path d="M9 8 29 18 9 28M9 8V28" /><circle cx="9" cy="8" r="4" /><circle cx="9" cy="28" r="4" /><circle cx="29" cy="18" r="5" /></> :
      kind === "update" ? <><rect x="4" y="6" width="17" height="24" rx="3" /><path d="M9 13h7M9 18h5M26 18h10m-4-4 4 4-4 4" /></> :
      <><rect x="4" y="5" width="28" height="25" rx="3" strokeDasharray="3 3" /><path d="m9 25 6-7 5 5 5-8 4 6M12 10h4" /></>}
  </svg>;
}

export function TaskTimeline({ phase }: { phase: number }) {
  return <figure className="task-timeline" aria-label="同一模型沿时间依次学习任务，最后统一测试">
    <svg className="timeline-spine" viewBox="0 0 1000 48" preserveAspectRatio="none" aria-hidden="true"><path className="axis-underlay" d="M12 24H984" /><path d="M12 24H984m-10-7 10 7-10 7" /></svg>
    {[
      { title: "先学", object: "鸟与鱼", state: "任务 1 结束", index: 1, note: "建立已有类别的识别能力" },
      { title: "接着学", object: "猫与狗", state: "任务 2 结束", index: 2, note: "沿用参数，旧数据往往已不可完整取得" },
      { title: "面对全部类别", object: "统一预测", state: "测试阶段", index: 0, note: "只提供图像，在全部已学类别中判断" },
    ].map((item, i) => <div className={"timeline-stop" + (i === phase ? " is-current" : "")} key={item.state} aria-current={i === phase ? "step" : undefined}>
      <div className="timeline-card"><div className="timeline-card__copy"><b><span>{item.title}</span>{item.object}</b><span>{item.state}</span></div>
        <span className="timeline-state-object" aria-hidden="true">{item.index > 0 ? <math><Sub base="θ" index={item.index} /></math> : <svg viewBox="0 0 40 40"><rect x="4" y="4" width="12" height="12" rx="2" /><rect x="24" y="4" width="12" height="12" rx="2" /><rect x="4" y="24" width="12" height="12" rx="2" /><rect x="24" y="24" width="12" height="12" rx="2" /></svg>}</span>
      </div>
      <span className="timeline-pin" aria-hidden="true" /><p>{item.note}</p>
    </div>)}
    <figcaption>模型沿同一条时间线继续学习。下方切换快照，可对照两个训练阶段后的预测。</figcaption>
  </figure>;
}

export function InterferenceFishbone() {
  return <figure className="interference-fishbone" aria-label="共享参数、新类训练与旧数据访问限制共同形成旧能力受干扰的风险">
    <svg viewBox="0 0 1000 280" preserveAspectRatio="none" aria-hidden="true">
      <path className="axis-underlay" d="M18 140H790" /><path className="fish-spine" d="M18 140H790m-13-8 13 8-13 8" />
      <path className="fish-branch--shared" d="M110 65L224 128Q238 136 245 140" /><path className="fish-branch--new" d="M325 215L439 151Q453 143 460 140" /><path className="fish-branch--past" d="M535 65L649 128Q663 136 670 140" />
      <path className="axis-direction" d="m352 136 5 4-5 4m211-8 5 4-5 4" />
      {[{x:245,y:140,kind:'shared'}, {x:460,y:140,kind:'new'}, {x:670,y:140,kind:'past'}].map(node=><g key={node.kind}><circle className="fish-collar" cx={node.x} cy={node.y} r="11" /><circle className={'fish-junction fish-branch--'+node.kind} cx={node.x} cy={node.y} r="5" /></g>)}
      <circle className="branch-terminal fish-branch--shared" cx="110" cy="65" r="2.5" /><circle className="branch-terminal fish-branch--new" cx="325" cy="215" r="2.5" /><circle className="branch-terminal fish-branch--past" cx="535" cy="65" r="2.5" />
    </svg>
    <div className="fish-note fish-note--shared"><CauseGlyph kind="shared" /><b>新旧类别<span>共享参数</span></b><p>旧图与新图经过同一网络</p></div>
    <div className="fish-note fish-note--new"><CauseGlyph kind="update" /><b>新类别推动<span>参数更新</span></b><p>当前优化会改变特征与分数</p></div>
    <div className="fish-note fish-note--past"><CauseGlyph kind="past" /><b>旧图像<span>难以完整回放</span></b><p>旧类别约束难以同时维持</p></div>
    <div className="fish-result"><span>旧类别预测</span><strong>可能受到<em>干扰</em></strong><small>这些条件共同形成风险</small></div>
  </figure>;
}

export function OldImageReading() {
  return <div className="old-image-reading">
    <div className="fixed-image-object"><Specimen /><div><strong>图像始终相同</strong><span>真实类别仍然是鸟</span></div></div>
    <div className="prediction-reading"><h3>变的是<span className="editorial-key">参数</span>状态与<span className="editorial-key">输出</span></h3><p>在 <math><Sub base="θ" index={1} /></math> 下最高分是鸟，在 <math><Sub base="θ" index={2} /></math> 下变成猫。后续更新<span className="lesson-key lesson-key--caution">可能干扰</span>模型原先的分类能力。</p><p>遗忘的程度要看旧任务的<span className="lesson-key">整体测试表现</span>。<span className="lesson-key lesson-key--limit">单张图</span>只能呈现这一次预测变化。</p></div>
  </div>;
}

export function BackboneHandoff() {
  return <div className="backbone-handoff">
    <div className="backbone-object"><Specimen /><span className="backbone-object__model">预训练 ViT<small>保留视觉主干权重</small></span><VectorGlyph /></div>
    <div><h3>先看看，已有的视觉能力藏在哪里</h3><p>这条思路依赖预训练模型已经形成的特征。下一页沿同一张鸟类图像进入 ViT，看看它怎样从像素得到分类所需的表示。</p></div>
  </div>;
}

export function ViTReadingMap() {
  return <div className="vit-reading-map">
    <div className="vit-reading-map__copy"><p>先顺着主图看完整路径：<span className="lesson-key"><Term id="embedding-layer">输入嵌入</Term></span>模块 <math><Sub base="f" index="e" /></math> 形成序列，多层 <Term id="encoder-block">Encoder</Term> 组成 <math><Sub base="f" index="r" /></math>，最后从输出中读取分类特征。</p><p>冻结标记表示后续适应时保留主干权重，图像仍会完整经过这条计算路径。</p></div>
    <div className="representation-ladder" aria-label="像素数组、Token 序列与上下文表示三种对象">
      <div><span className="mini-pixel-field" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} />)}</span><b>像素数组</b><small>空间与颜色</small></div>
      <div><span className="mini-sequence" aria-hidden="true"><VectorGlyph /><VectorGlyph /><VectorGlyph /></span><b>Token 序列</b><small>位置与特征</small></div>
      <div><span className="mini-context" aria-hidden="true"><VectorGlyph /><svg viewBox="0 0 100 35"><path d="M5 6Q50 50 95 6M5 29Q50-15 95 29" /></svg></span><b>上下文表示</b><small>区域间的信息联系</small></div>
    </div>
  </div>;
}

export function PixelFeatureCompare() {
  return <div className="pixel-feature-compare">
    <div className="coordinate-board coordinate-board--pixel">
      <div className="coordinate-board__visual" aria-hidden="true"><span className="mini-pixel-field">{Array.from({length:16},(_,i)=><i key={i} />)}</span><span className="coordinate-ribbon">R G B · R G B · …</span></div>
      <h4><strong>展平</strong><span>保留像素值，改变排列</span></h4><p>16×16×3 = 768 个通道值，依次排进一个向量；原有数值的含义不变。</p>
    </div>
    <div className="projection-link"><span>共享线性投影</span><math><mi>z</mi><mo>=</mo><mi>x</mi><mi>W</mi><mo>+</mo><mi>b</mi></math><small>映射到新的特征坐标</small></div>
    <div className="coordinate-board coordinate-board--feature">
      <div className="coordinate-board__visual" aria-hidden="true"><VectorGlyph /><span className="coordinate-ribbon"><math><Sub base="z" index={1} /><mo>,</mo><Sub base="z" index={2} /><mo>,</mo><Sub base="z" index={3} /><mo>,</mo><mo>…</mo></math></span></div>
      <h4><strong>投影</strong><span>从像素坐标到特征坐标</span></h4><p>本配置输出宽度也为 768。维数相等，表示的含义已经改变；其他配置可用不同宽度。</p>
    </div>
  </div>;
}

export function EncoderReading() {
  return <section className="encoder-reading" aria-label="序列逐层传递与整图分类读出">
    <div className="encoder-reading__row">
      <div><h3><span className="editorial-key">位置</span>保留，<span className="editorial-key">表示</span>逐层更新</h3><p>回到总览中的 <span className="lesson-key lesson-term lesson-term--latin lesson-term--object"><Term id="encoder-block">Encoder</Term></span> 堆叠：每个 <strong className="lesson-ink"><Term id="encoder-block">Block</Term></strong> 接收前一层的整条序列，保留<span className="lesson-key">位置顺序</span>与向量宽度，更新各位置内部的特征。后一层接着处理这些输出，各位置逐渐携带其他区域的信息。</p></div>
      <div className="layer-relay" aria-label="同一位置的表示经过连续三层 Encoder 更新">
        {["Block 1", "Block 2", "Block 3"].map(label=><div key={label}><b>{label}</b><div><span className="token special">CLS</span><VectorGlyph kind="token" /><VectorGlyph /></div><small>整条序列传给下一层</small></div>)}
      </div>
    </div>
    <div className="encoder-reading__row encoder-reading__row--reverse">
      <div className="cls-readout-object"><span>末层输出序列</span><div><span className="token special">[CLS]</span><span className="token">Patch 1</span><span className="token">…</span></div><span className="cls-readout-line" /><strong>[CLS] 特征 → 分类头</strong><small>普通 ViT 的基础读出</small></div>
      <div><h3>从序列中读出整图特征</h3><p>普通 ViT 分类通常读取<span className="lesson-key">末层 [CLS]</span> 表示，再交给<span className="lesson-key lesson-term"><Term id="classification-head">分类头</Term></span>。后面的 L2P 会用无 Prompt 的 [CLS] 特征做检索，并从带 Prompt 序列的另一组输出位置读取分类特征；P5–P6 将沿实际路径展开。</p></div>
    </div>
  </section>;
}

function qkvTermId(symbol: string) {
  if (symbol === "Q") return "query";
  if (symbol === "K") return "key";
  return "value";
}

export function QKVBranch() {
  return <div className="qkv-branch" role="group" aria-label="归一化输入通过共享投影生成 Query、Key、Value">
    <div className="qkv-origin"><VectorGlyph /><math><mi>X</mi><mo>=</mo><mrow><mi mathvariant="normal">LN</mi><mo>(</mo><mi>Z</mi><mo>)</mo></mrow></math><span>同一条输入序列</span></div>
    <svg viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true"><path className="branch-underlay" d="M500 0V30M165 80V42Q165 30 177 30H823Q835 30 835 42V80M500 30V80" /><path d="M500 0V30M165 80V42Q165 30 177 30H823Q835 30 835 42V80M500 30V80" /><circle className="projection-junction" cx="500" cy="30" r="4" /></svg>
    <div className="qkv-branches">{[
      {symbol:'Q',title:'目标的匹配向量',text:'选定位置取出一个 Query，用它读取整条序列。'},
      {symbol:'K',title:'来源的匹配表示',text:'每个来源都有 Key，用于与目标 Query 计算分数。'},
      {symbol:'V',title:'来源的汇聚内容',text:'每个来源的 Value 按分配到的权重进入输出。'},
    ].map(item=><div className={'qkv-card qkv-card--'+item.symbol.toLowerCase()} key={item.symbol}><math><mi>{item.symbol}</mi><mo>=</mo><mi>X</mi><Sub base="W" index={item.symbol} /></math><h4><Term id={qkvTermId(item.symbol)}>{item.symbol==='Q'?'Query':item.symbol==='K'?'Key':'Value'}</Term> · {item.title}</h4><p>{item.text}</p></div>)}</div>
  </div>;
}

export function ResidualReading() {
  return <section className="residual-reading" aria-label="Attention 结果经两条残差路径交给下一层">
    <h3>把多头结果<span className="editorial-key">接回</span> Block</h3>
    <div className="residual-reading__row"><div><h4>先加回原输入</h4><p>第一条 <Term id="residual-connection">残差</Term>将 Z 与 MSA 输出<span className="lesson-key">逐位置相加</span>，得到 U，保留原表示并加入本次读取的信息。</p></div><div className="residual-equation"><span>第一处交接</span><math><mi>U</mi><mo>=</mo><mi>Z</mi><mo>+</mo><mtext>多头注意力输出</mtext></math><small>原表示 + 跨位置汇聚结果</small></div></div>
    <div className="residual-reading__row residual-reading__row--reverse"><div className="residual-equation"><span>第二处交接</span><math><msup><mi>Z</mi><mo>′</mo></msup><mo>=</mo><mi>U</mi><mo>+</mo><mtext>FFN 输出</mtext></math><small>整条输出序列交给下一层</small></div><div><h4>再加工每个位置的内部特征</h4><p>U 经 <Term id="layer-normalization">LayerNorm</Term> 归一化后进入 <Term id="ffn">FFN</Term>，逐位置做<span className="lesson-key lesson-term">非线性变换</span>；第二条残差再将结果与 U 相加，得到 Z′。跨位置读取由 Attention 完成，FFN 继续加工读入的特征。</p></div></div>
  </section>;
}

export function LearnableInputHandoff() {
  return <div className="learnable-handoff">
    <div><h3>这个额外 Token，能<span className="editorial-key">学</span>出来吗？</h3><p>刚才只加入一个给定向量，固定网络的输出就发生了变化。如果让这个向量通过训练调整，能否带来更适合当前任务的特征？</p><p>P4 将把它变成可学习的 <span className="lesson-key lesson-term lesson-term--latin">Prompt</span>，沿分类损失追踪更新过程。</p></div>
    <div className="learnable-object"><span className="token traced-token">额外 Token</span><span className="learnable-object__line" /><div><VectorGlyph /><b>向量的取值也可以学习</b></div><small>下一页开始训练，主干权重继续保持固定</small></div>
  </div>;
}

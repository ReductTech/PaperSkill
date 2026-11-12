import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion } from '../components/motion';
import { useState, type ReactNode } from 'react';
import { Hint, Term } from '../components/Hint';
import { paper, pinned, supplement } from '../data/tutorial';
import './chapter-reading.css';

const questions: Record<string, ReactNode> = {
  'chap-1': <>先用整张图问灯塔颜色，再改问帆船。哪一步开始需要读问题？如果把原图裁成只剩船的一角，原先算好的视觉特征还能沿用吗？</>,
  'chap-2': <>A3 没选进<Term name="主导 token"/>，它的信息还会进入语言模型吗？选中 A3 走完打分、归组和输出三步，再换 B5 比较。</>,
  'chap-3': <>函数收到 <code>dominant=54</code>。如果视觉塔也把 <Term name="CLS"/> 交给语言模型，序列里还装得下几个直接来自图块的主导特征？</>,
  'chap-4': <>同样只留 64 个位置，表 1 里为什么有两行 VisionZip？先选一个任务比较原始分，再到 <a href="#module-4-3">4.3</a> 看两次实验之间，究竟是哪一段权重变了。</>,
  'chap-5': <>看灯塔和帆船的位置关系需要全景，看清塔窗还得靠局部。五个视图原有 2,880 个位置，如果整张图只留 160 个，每个视图能分到多少？再到表 2 看看，增加预算时哪些任务涨了分。</>,
  'chap-6': <>要回答“这个动作发生在什么时候”，多看几个时刻可能有用。如果送入语言模型的视觉序列一样长，多一倍的帧，每帧还能留下多少细节？先读八帧实验，再试固定预算下的选帧。</>,
  'chap-7': <>两种方法都把 576 个位置压成 64 个。一种在视觉塔出口选好，另一种让语言模型先读几层完整图像。最终长度一样，期间处理过的视觉位置也一样多吗？</>,
};

export function ChapterQuestion({ id }: { id: string }) {
  if (!questions[id]) return null;
  return <div className="vzr-question">
    <span className="vzr-q-mark" aria-hidden="true">?</span>
    <div><strong>本节问题</strong><p>{questions[id]}</p></div>
  </div>;
}

function Cite({ href, children }: { href: string; children: ReactNode }) {
  return <a className="vzr-cite" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

function Reading({ title, children }: { title: string; children: ReactNode }) {
  return <section className="vzr-reading" aria-label={title}><h3>{title}</h3>{children}</section>;
}

function ReuseReading() {
  return <Reading title="下一问能从哪一步接着算？">
    <p>假设已经保存整张图经过<Term name="投影层"/>的 64 个向量。第二轮把“灯塔是什么颜色”换成“海面上有几艘船”，可以把这组向量交给新问题，语言模型再根据新的文字作答。能复用图像表示是一回事，64 个位置里是否留下了远处那艘小船的细节，还得看回答。</p>
    <details><summary>如果第二轮传入的是帆船的局部裁图呢？</summary>
      <p>裁剪改变了送入视觉塔的像素。若要得到这张裁图自己的特征，就得重新编码、给位置打分、归组，再投影。直接沿用整图的 64 个向量，语言模型看到的仍是先前那张整图的表示。</p>
      <p>作者在图 7 展示了同图追问。实现里可以顺着 <code>encode_images_visionzip</code> 看到从图像到投影的调用次序。这里的复用假定上次结果已保存，且预处理、权重和压缩参数一致。 <Cite href={paper+'#page=8'}>正文图 7</Cite> · <Cite href={pinned+'visionzip/llava_arch.py#L29-L37'}>图像编码路径</Cite></p>
    </details>
  </Reading>;
}

const poolingCases = [
  { label: '没有其他组员', members: '无', average: '(0, 0)', result: '(2, 0)', note: '实现把分母至少设为 1。该组的贡献总和为零，最后只留下代表自身的特征。' },
  { label: '一位组员', members: '(0, 2)', average: '(0, 2)', result: '(2, 2)', note: '只有一个贡献者，直接把它的特征加到代表上。' },
  { label: '两位组员', members: '(0, 2)、(0, 4)', average: '(0, 3)', result: '(2, 3)', note: '两个组员先取均值，再加代表。若把三者一起求平均，第一维会变成 2/3；作者的实现保留了代表自身的 2。' },
] as const;

function MergeReading() {
  const [index, setIndex] = useState(2);
  const selected = poolingCases[index];
  const explanation = useContentMotion<HTMLDivElement>(index);
  return <Reading title="代表在求均值时算不算一个组员？">
    <p>固定一个代表的<Term name="隐藏特征"/>为 (2, 0)。下面使用手算的二维向量，只改变归给它的组员。可以先算一下输出的第一维会是多少。</p>
    <SegmentBar value={index} className="vzr-choices" role="group" aria-label="上下文代表的其他组员数">{poolingCases.map((entry, n) => <button key={entry.label} type="button" aria-pressed={index === n} onClick={() => setIndex(n)}>{entry.label}</button>)}</SegmentBar>
    <div ref={explanation} className="vzr-worked" aria-live="polite">
      <span>其他组员的隐藏特征　{selected.members}</span>
      <p className="vzr-equation"><Hint text="代表所在位置的隐藏特征固定为 (2, 0)，在最后一步单独加回。">(2, 0)</Hint> ＋ <Hint text="只计算归入该代表的其他位置的平均隐藏特征。">{selected.average}</Hint> ＝ <b>{selected.result}</b></p>
      <p>{selected.note}</p>
    </div>
    <p className="vzr-source">对照 <code>counts</code>、<code>aggregated_hidden</code> 和最后相加的两项。 <Cite href={pinned+'visionzip/clip_encoder.py#L72-L83'}>固定版本第 72–83 行</Cite></p>
  </Reading>;
}

function OrderReading() {
  return <Reading title="得分最高的 patch 会排在输出的最前面吗？">
    <p>用四个位置追一次索引。它们在图上的先后是 A1、A2、A3、A4。假设打分结果是 A3 第一、A1 第二，主导预算只留这两个图块，另外两块归入同一个上下文代表。</p>
    <div className="vzr-sequence">
      <div><span>选中的图块，按得分</span><div><b>A3</b><i>→</i><b>A1</b></div></div>
      <div><span>交给投影层的顺序</span><div><b>CLS</b><i>→</i><b>A1</b><i>→</i><b>A3</b><i>→</i><b className="vzr-ctx">上下文</b></div></div>
    </div>
    <details><summary>对照代码，看顺序在哪一步确定</summary>
      <p><code>topk</code> 找出高分位置，代码用它们标记一个和原序列等长的掩码，再从原隐藏状态依次取值。这样，靠前的 A1 先于 A3 进入主导序列。最后一行才把上下文代表接在这组序列之后。</p>
      <p><Cite href={pinned+'visionzip/clip_encoder.py#L49-L57'}>主导位置与掩码</Cite> · <Cite href={pinned+'visionzip/clip_encoder.py#L78-L83'}>拼成最终序列</Cite></p>
    </details>
  </Reading>;
}

function OcrReading() {
  return <Reading title="如果任务专门读图中文字，要看哪一组证据？">
    <p>补充表 11 专门测了信息图和文档问答。LLaVA-1.5 保留 192 个视觉位置时，InfoVQA 从 25.7 到 25.0，DocVQA 从 28.1 到 25.8。预算相同，文档问答这一列掉得更多。 <Cite href={supplement+'#page=3'}>补充表 11</Cite></p>
    <div className="vzr-worked"><span>DocVQA，按原分复算</span><p className="vzr-equation"><Hint text="压到 192 个视觉 token 后，VisionZip 在 DocVQA 的报告值。">25.8</Hint> ÷ <Hint text="同一张表里未压缩的 LLaVA-1.5 在 DocVQA 的报告值。">28.1</Hint> ≈ <b>91.8%</b></p>
      <p>两行相差 2.3 分。若你要评估小字区域，表 11 给出的是整个基准的表现；要回答字有多小时更容易丢，还需要按文字尺寸拆分样本。</p></div>
    <details><summary>换一张表，平均值的分母也可能变</summary>
      <p>正文表 1 的 7B 结果汇总 11 项。补充表 10 的 13B 虽然也列出 11 项，作者因 LLaVA-Bench 和 MMVet 样本较少、波动较大，把这两项从 Avg. 中去掉。复算这一列时，用其余 9 项各自相对完整模型的比值，再除以 9。 <Cite href={supplement+'#page=3'}>补充表 10 表注</Cite></p>
    </details>
  </Reading>;
}

function LayerReading() {
  const [fullLayers, setFullLayers] = useState(2);
  const layers = 32, full = 576, short = 64;
  const early = layers * short;
  const later = fullLayers * full + (layers - fullLayers) * short;
  return <Reading title="都留 64 个位置，算过的总数相差多少？">
    <p>设一个 32 层语言模型，每层看到一个视觉位置就计一次。两条教学路径共用 576 个输入位置和 64 个保留名额。拖动滑杆，让后一条路径晚几层开始压缩。</p>
    <label className="vzr-layer-control"><span>后一路先读完整图像的层数 <b>{fullLayers}</b></span>
      <input type="range" min="0" max={layers - 1} value={fullLayers} onChange={event => setFullLayers(Number(event.currentTarget.value))}/></label>
    <div className="vzr-totals" aria-live="polite">
      <div><small>进入 LLM 前压缩</small><b>{early.toLocaleString('en-US')}</b><span>32 × 64</span></div>
      <div><small>在 LLM 内读完 {fullLayers} 层后压缩</small><b>{later.toLocaleString('en-US')}</b><span>{fullLayers} × 576 ＋ {32 - fullLayers} × 64</span></div>
    </div>
    <p>每晚一层，就多处理 576 − 64 = 512 个视觉位置。这里累加的是各层看到的位置数。要换算成运算量，还得计入文本长度、注意力的成对计算和前馈网络；实际耗时可以回到表 4 查。 <Cite href={paper+'#page=7'}>正文表 4</Cite></p>
  </Reading>;
}

const readings: Record<string, () => JSX.Element> = {
  'chap-1': ReuseReading, 'chap-2': MergeReading, 'chap-3': OrderReading,
  'chap-4': OcrReading, 'chap-7': LayerReading,
};

export function ChapterReading({ id }: { id: string }) {
  const Content = readings[id];
  return Content ? <Content /> : null;
}

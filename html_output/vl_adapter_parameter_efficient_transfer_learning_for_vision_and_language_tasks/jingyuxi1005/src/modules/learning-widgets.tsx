import { useId, useState } from 'react';

const fmt = (n: number) => n.toLocaleString('en-US');

export function AdapterStructure() {
  const [step, setStep] = useState(0);
  const stages = [
    ['Input', '原输入 x · dᵢ 维', 'x 进入小模块，同时沿右侧残差旁路原样保留。'],
    ['Down Projection', 'dᵢ → d', '降维权重把输入压到瓶颈维度 d，且 d 远小于 dᵢ。'],
    ['GELU', 'd 维', '非线性激活改变表示，但不改变瓶颈维度。'],
    ['Up Projection', 'd → dᵢ', '升维恢复到原维度，得到可与 x 相加的修正。'],
    ['Residual / 输出', '修正 + x · dᵢ 维', '旁路的原输入 x 与小模块修正相加，不是覆盖输入。'],
  ];
  return <div className="learning-tool">
    <div className="adapter-flow" aria-label="Adapter 主路与残差旁路">
      <div className="adapter-main">
        {stages.map(([title, dim], i) => <button key={title} type="button"
          className={'adapter-stage ' + (i === step ? 'selected ' : '') + (i === 1 || i === 2 ? 'bottleneck' : '')}
          aria-pressed={i === step} onClick={() => setStep(i)}>
          <strong>{title}</strong><span>{dim}</span>
        </button>)}
      </div>
      <div className={'residual-rail ' + (step === 0 || step === 4 ? 'active' : '')}>
        <span>x 原样保留</span><b aria-hidden="true">↙</b>
      </div>
    </div>
    <div className="feedback" aria-live="polite">{stages[step][2]}</div>
  </div>;
}

export function AdapterCalculator() {
  const [d, setD] = useState(96);
  const id = useId();
  const di = 768;
  const adapter = 2 * di * d;
  const dense = di * di;
  return <div className="learning-tool">
    <div className="ctrl">
      <label htmlFor={id}>瓶颈维度 d <span className="val">{d}</span></label>
      <input id={id} type="range" min="8" max="192" step="8" value={d}
        onChange={e => setD(Number(e.target.value))} aria-label="教学计算：瓶颈维度 d" />
    </div>
    <p className="tool-note">固定 dᵢ = 768；d 可选 8–192。仅计算单个 Adapter 的两块权重矩阵。</p>
    <div className="dimension-pair">
      <div><strong>降维 θᴰ</strong><span>768 × {d}</span></div>
      <span aria-hidden="true">+</span>
      <div><strong>升维 θᵁ</strong><span>{d} × 768</span></div>
    </div>
    <div className="calc-compare" aria-live="polite">
      <div className="result-card result-card-em"><strong>Adapter 权重参数</strong><span className="result-number">{fmt(adapter)}</span><small>2 × dᵢ × d</small></div>
      <div className="result-card"><strong>一个稠密矩阵的全量更新</strong><span className="result-number">{fmt(dense)}</span><small>dᵢ² = 768 × 768</small></div>
    </div>
    <div className="feedback" aria-live="polite">当前为单个稠密矩阵参数量的 <b>{(adapter / dense * 100).toFixed(2)}%</b>，
      少 <b>{fmt(dense - adapter)}</b> 个权重参数。d 越小，新增权重越少；这不代表性能必然不变。</div>
    <p className="tool-note"><b>教学计算示例：</b>右侧用一个同尺寸矩阵说明 Full FT 的全量更新，
      不是整模型 Full FT 参数量，也不是论文训练配置。参数复杂度来自主 §3.2、Eq. 3。</p>
  </div>;
}

export function TrainableMap() {
  const [highlight, setHighlight] = useState(true);
  const block = (name: string, train: boolean, desc: string) => <div
    className={'architecture-block ' + (highlight ? train ? 'is-trainable' : 'is-frozen' : '')}>
    <strong>{name}</strong><span>{desc}</span><small>{train ? '可训练' : '冻结'}</small>
  </div>;
  return <div className="learning-tool">
    <button type="button" className={'vl-chip ' + (highlight ? 'selected' : '')}
      aria-pressed={highlight} onClick={() => setHighlight(v => !v)}>突出可训练模块</button>
    <div className="vl-architecture">
      {block('CLIP 视觉编码器', false, '图像 / 视频帧 → 特征')}
      <div className="flow-arrow" aria-hidden="true">↓</div>
      {block('视觉投影', true, '映射到语言模型维度')}
      <div className="flow-arrow" aria-hidden="true">↓ + 文本 / 字幕</div>
      <div className="language-shell">
        <strong>语言侧编码器—解码器</strong>
        {block('原有 Attention / Feed-forward 权重', false, '保留预训练主干')}
        <div className="train-pair">
          {block('Adapter', true, '子层后学习修正')}
          {block('LayerNorm', true, '适配下游分布')}
        </div>
      </div>
      <div className="flow-arrow" aria-hidden="true">↓</div>
      {block('输出层', false, '与词嵌入绑权')}
    </div>
    <div className="feedback" aria-live="polite">{highlight
      ? '绿色突出三类可训练模块；灰色模块保持冻结。语言侧 LayerNorm 是冻结主干中的可训练例外。'
      : '已关闭颜色强调。文字标记仍说明各模块状态；这个开关只改变显示，不改变论文训练设置。'}</div>
  </div>;
}

export function SharingExplorer() {
  const [mode, setMode] = useState(0);
  const names = ['Multiple', 'Half-shared', 'Single'];
  const info = [
    ['4D + 4U = 8 组', '每项任务都有独立的降维与升维权重。', '12.22%', '75.9', '4 × 2dᵢd = 8dᵢd'],
    ['4D + 1U = 5 组', '主实验共享升维 U，降维 D 保持任务专用。', '8.36%', '75.9', '(4 + 1)dᵢd = 5dᵢd'],
    ['1D + 1U = 2 组', '四项任务共用同一套降维与升维权重。', '4.18%', '77.4', '2dᵢd'],
  ][mode];
  return <div className="learning-tool">
    <div className="vl-controls" role="group" aria-label="Adapter 共享模式">
      {names.map((name, i) => <button type="button" key={name} aria-pressed={i === mode}
        className={'vl-chip ' + (i === mode ? 'selected' : '')} onClick={() => setMode(i)}>{name}</button>)}
    </div>
    <p className="tool-note"><b>同色、同编号 = 同一组权重。</b>D 为降维，U 为升维。绿色代表跨任务共享；其他颜色代表任务专用。</p>
    <div className="sharing-grid">
      {['VQA', 'GQA', 'NLVR²', 'COCO'].map((task, i) => <div className="sharing-task" key={task}>
        <strong>{task}</strong>
        <div className={'weight-block ' + (mode === 2 ? 'shared' : 'task-' + i)}>
          <b>{mode === 2 ? 'D 共用' : 'D' + (i + 1)}</b><span>降维</span>
        </div>
        <div className={'weight-block ' + (mode > 0 ? 'shared' : 'task-' + i)}>
          <b>{mode > 0 ? 'U 共用' : 'U' + (i + 1)}</b><span>升维</span>
        </div>
      </div>)}
    </div>
    <div className="share-summary" aria-live="polite">
      <strong>每个插入位置：{info[0]}</strong><span>{info[1]}</span>
      <span>四任务、仅矩阵权重的教学计数：{info[4]}（忽略 bias）。共享减少独立矩阵，不必为每任务复制一套。</span>
    </div>
    <div className="mini-metrics"><div><small>主 Table 1 可更新参数</small><b>{info[2]}</b></div>
      <div><small>论文 Avg.</small><b>{info[3]}</b></div></div>
    <p className="tool-note">主表为 CLIP-BART 图文四任务；比例排除冻结视觉编码器，并含视觉投影和 LN，
      不等于上方单个插入位置的矩阵比例。共享发生在任务之间；不同层仍有各自参数。</p>
  </div>;
}

export function ResultExplorer() {
  const [group, setGroup] = useState(0);
  const [joint, setJoint] = useState(false);
  const video = group === 1;
  const pretrained = !video && joint;
  const table = video ? '4' : pretrained ? '6' : '1';
  const full = video ? '87.4' : pretrained ? '78.5' : '77.6';
  const adapter = video ? '87.4' : pretrained ? '79.2' : '77.4';
  const share = video ? '3.39%' : pretrained ? null : '4.18%';
  return <div className="learning-tool result-widget">
    <div className="vl-controls" role="group" aria-label="选择实验任务组">
      {['Image-Text / 图文', 'Video-Text / 视频文本'].map((s, i) => <button type="button" key={s}
        className={'vl-chip ' + (group === i ? 'selected' : '')} aria-pressed={group === i}
        onClick={() => { setGroup(i); setJoint(false); }}>{s}</button>)}
    </div>
    {!video && <div className="vl-controls" role="group" aria-label="图文预训练条件">
      <button type="button" className={'vl-chip ' + (!joint ? 'selected' : '')} aria-pressed={!joint}
        onClick={() => setJoint(false)}>主设置 · Table 1</button>
      <button type="button" className={'vl-chip ' + (joint ? 'selected' : '')} aria-pressed={joint}
        onClick={() => setJoint(true)}>联合 V&L 预训练后 · Table 6</button>
    </div>}
    <div className="result-context">CLIP-BART · {video ? '四项视频文本任务' : '四项图文任务'} · 主论文 Table {table}</div>
    <div className="result-condition" aria-live="polite">{pretrained
      ? '额外初始化：先在 COCO / VG 上进行联合 V&L 预训练，再适配下游任务（主 §5.3）。'
      : '主设置：CLIP / BART 各自的预训练权重；没有额外进行该统一框架的联合 V&L 预训练。'}</div>
    <div className="result-compare" aria-live="polite">
      <div className="result-card"><strong>Full Fine-Tuning</strong><span className="result-number">{pretrained ? '—' : '100%'}</span>
        <small>{pretrained ? 'Table 6 未重列参数比例' : '可更新参数比例'}</small><b>Avg. {full}</b></div>
      <div className="result-card result-card-em"><strong>Single Adapter</strong><span className="result-number">{share ?? '—'}</span>
        <small>{pretrained ? '不直接套用 Table 1 的 4.18%' : '可更新参数比例'}</small><b>Avg. {adapter}</b></div>
    </div>
    <div className="feedback">Avg. 混合 Accuracy 与 CIDEr，不是平均准确率。仅在同一任务组、同一预训练条件内比较；汇总接近不代表每项任务均提升。</div>
    {!pretrained && <p className="tool-note"><b>参数口径：</b>以排除冻结视觉编码器后的 Full FT 模型参数为参照（补 §B）。
      PEFT 更新量含 Adapter、视觉投影与 LN。{video ? '3.39%' : '4.18%'} 仅对应该表设置，不是所有 V&L 模型的固定比例。</p>}
    <p className="tool-note">{video
      ? '所有任务使用 test-pub。TVQA / How2QA：Accuracy；TVC / YC2C：CIDEr。'
      : 'VQA：Karpathy test；GQA：test-dev；NLVR²：test-P（Accuracy）；COCO：Karpathy test（CIDEr）。'}</p>
  </div>;
}

export function Limitations() {
  return <div className="limits-grid">
    <section className="limit-card"><h5>作者明确指出</h5><ul>
      <li>不同架构需各自选择超参数，任务分布不同；结论不保证泛化到其他任务（补 §H）。</li>
      <li>三种常用 Adapter 变体不能代表全部方法（补 §H）。</li>
      <li>Adapter / Prompt 增加额外推理计算；LoRA 可合并更新，避免该额外开销（补 §D）。</li>
      <li>主要实验未先做联合 V&L 预训练，与当时 SOTA 存在表现差距；Table 6 为另行预训练的验证（主 §5.3）。</li>
    </ul></section>
    <section className="limit-card"><h5>根据本文实验范围可以观察到</h5><ul>
      <li>实验覆盖有限任务与架构，不能据此保证现代大规模 MLLM 的全面适用性。</li>
      <li>不能保证未覆盖任务、模型架构和数据分布获得相同表现。</li>
    </ul><p className="tool-note">这是对论文实验覆盖范围的归纳，不是作者原话，也不是额外实验结论。</p></section>
  </div>;
}

export function ConclusionExplorer() {
  const [selected, setSelected] = useState(0);
  const conclusions = [
    {
      name: '参数效率',
      observation: '冻结视觉编码器与语言主干权重，训练语言侧 Adapter、视觉投影与 LayerNorm，可以用少量可更新参数适配本文的视觉语言任务。',
      condition: '参数比例以排除冻结视觉编码器后的 Full FT 模型参数为参照，更新量包含 Adapter、视觉投影和 LayerNorm。（主 §3.2、Table 1、4；补 §B）',
      boundary: '少量可训练参数不代表推理零开销；本文的比例不能直接套用到任意模型或配置。（补 §D、§H）',
    },
    {
      name: '图文与视频文本',
      observation: '本文分别检验 image-text 与 video-text 多任务适配；Single Adapter 的汇总表现可接近对应 Full FT 基线。',
      condition: '只在同一任务组、架构和预训练条件内比较。主 Table 1、4 与额外联合预训练的 Table 6 分开解读；Avg. 混合 Accuracy 与 CIDEr。',
      boundary: '汇总接近不等于每项任务都提升，也不能保证实验未覆盖任务或数据分布的效果。',
    },
    {
      name: '任务共享',
      observation: '论文比较 Multiple、Half-shared、Single Adapter。本文图文主设置中，Single 更省参数，汇总分也高于另外两种共享方式。',
      condition: '共享发生于不同任务在同一插入位置使用的权重，不是让所有层共用一个 Adapter；主实验 Half-shared 共享升维层。（主 §3.2、Fig. 3、Table 1）',
      boundary: '共享带来的效果受任务组合、模型和超参数影响，不能据此认定 Single 在所有场景都是最佳选择。（补 §H）',
    },
  ];
  const current = conclusions[selected];
  return <div className="learning-tool">
    <div className="vl-controls" role="group" aria-label="选择 VL-Adapter 核心结论">
      {conclusions.map(({ name }, i) => <button type="button" key={name}
        className={'vl-chip ' + (selected === i ? 'selected' : '')}
        aria-pressed={selected === i} onClick={() => setSelected(i)}>{name}</button>)}
    </div>
    <div aria-live="polite" aria-atomic="true">
      <div className="result-card result-card-em"><strong>论文观察 · {current.name}</strong><p className="tool-note">{current.observation}</p></div>
      <p className="tool-note"><b>比较条件：</b>{current.condition}</p>
      <div className="feedback"><b>不能据此推出：</b>{current.boundary}</div>
    </div>
  </div>;
}

const methods = [
  ['Full FT', '更新语言侧主干', '本文主基线仍冻结 CLIP，多任务共享模型。'],
  ['Adapter', '加入瓶颈残差模块', '语言侧 Adapter + 视觉投影 + LN 更新。'],
  ['Hyperformer', '超网络生成 Adapter 权重', '条件为任务和层索引。'],
  ['Compacter', 'PHM / Kronecker 参数化', '本文移除跨层矩阵共享与进一步低秩分解；不是原始完整配置。'],
  ['Prompt', '学习编码器输入提示', '本文使用提示嵌入及两层投影网络；不同于固定任务词。'],
  ['LoRA', '学习低秩权重增量', '本文的比较基线，非 VL-Adapter 的技术基础。'],
];
export function MethodComparison({ selected }: { selected: number }) {
  return <div className="method-list">
    {methods.map(([name, change, note], i) => <div key={name} className={'method-row ' + (selected === i ? 'selected' : '')}>
      <strong>{name}</strong><div><b>{change}</b><p>{note}</p></div>
    </div>)}
    <p className="tool-note">依据：主 §3.2、§5.1；补 §C–D。比较更新对象，不做跨配置的“最佳方法”排名。</p>
  </div>;
}

export function NumericEvidence({ moduleId, selected }: { moduleId: string; selected: number }) {
  const scores = [[67.6, 65.9], [73, 74.2], [112.9, 114.9], [76.3, 76.6], [45.7, 46.3], [154, 152.9]];
  if (moduleId === '8.2') {
    const [full, single] = scores[selected];
    const max = Math.max(full, single) * 1.1;
    const task = ['VQA', 'NLVR²', 'COCO', 'TVQA', 'TVC', 'YC2C'][selected];
    const metric = [0, 1, 3].includes(selected) ? 'Accuracy (%)' : 'CIDEr';
    return <div className="score-bars"><strong>{task} · {metric} · 主 Table {selected < 3 ? '1' : '4'}</strong>
      {[['Full FT', full], ['Single Adapter', single]].map(([name, value], i) => <div className="score-bar" key={name}>
        <span>{name}</span><b>{value}</b><div className="score-track"><i className={i ? 'single' : 'full'} style={{ width: Number(value) / max * 100 + '%' }} /></div>
      </div>)}</div>;
  }
  const labels = selected ? ['仅视觉投影', '+ LayerNorm', '+ Adapter'] : ['Multiple', 'Half-shared', 'Single'];
  const values = selected ? [47.1, 62.9, 77.4] : [75.9, 75.9, 77.4];
  return <div className="ablation-cards">
    {labels.map((name, i) => <div className={'result-card ' + (i === 2 ? 'result-card-em' : '')} key={name}>
      <strong>{name}</strong><b>Avg. {values[i]}</b>
      <small>主 Table {selected ? '5' : '1'}</small>
    </div>)}
  </div>;
}

export function MobileEvidence({ moduleId, selected }: { moduleId: string; selected: number }) {
  let parts: string[] = [];
  if (moduleId === '2.1') parts = [selected ? '视频帧' : '图像',
    selected ? 'CLIP ViT-B/32' : 'CLIP-ResNet101', '视觉投影 + 文本' + (selected ? ' / 字幕' : ''), 'BART 文本输出'];
  if (moduleId === '4.1') parts = [['Self-attention', 'Cross-attention（解码器）', 'Feed-forward'][selected], '子层之后', 'Adapter'];
  if (moduleId === '5.2') parts = [selected ? '可训练连续向量' : '固定任务词 vqa:', '模型输入'];
  if (moduleId === '7.1') parts = [selected < 4 ? 'Image-Text' : 'Video-Text',
    ['VQAv2', 'GQA', 'NLVR²', 'MSCOCO', 'TVQA', 'How2QA', 'TVC', 'YC2C'][selected],
    [0, 1, 2, 4, 5].includes(selected) ? 'Accuracy (%)' : 'CIDEr'];
  if (!parts.length) return null;
  return <div className="mobile-evidence" aria-label="当前选项的结构">
    {parts.map((part, i) => <div key={part}><strong>{part}</strong>{i < parts.length - 1 && <span aria-hidden="true">↓</span>}</div>)}
  </div>;
}

import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type ObservationStage = 'raw' | 'local' | 'global';
type FusionMode = 'v5' | 'v6';
type HeadView = 'training' | 'inference';
type FormulaFocus = 'add' | 'skip' | null;

const POSITION_COUNT = 15;

function SegmentedButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  );
}

function revealChapter(fromChapter: number, toChapter: number) {
  const targetId = `chap-${toChapter}`;
  const scroll = () => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (document.getElementById(targetId)) {
    scroll();
    return;
  }

  let current = fromChapter;
  const revealNext = () => {
    if (document.getElementById(targetId)) {
      scroll();
      return;
    }
    document.querySelector<HTMLButtonElement>(`#chap-${current} .chap-loader-btn`)?.click();
    current += 1;
    if (current <= toChapter) window.setTimeout(revealNext, 90);
  };
  revealNext();
}

function Arrow() {
  return <b className="r7-arrow" aria-hidden="true">→</b>;
}

export const Ch6Recognition: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState<ObservationStage>('local');
  const [selected, setSelected] = useState(7);
  const positions = useMemo(() => Array.from({ length: POSITION_COUNT }, (_, index) => index), []);
  const selectedX = 30 + selected * (840 / (POSITION_COUNT - 1));
  const linkTargets = [0, 3, 7, 11, 14].filter((index) => index !== selected);

  const feedback: Record<ObservationStage, string> = {
    raw: '原始序列保留沿宽度排列的位置关系；每一格都是 feature position，不是一个字符。',
    local: '1×1 Conv 先把 C 投影到 D，1×7 DWConv 再沿宽度聚合当前附近 7 个 feature positions。',
    global: '局部信息仍然保留；Transformer Blocks 继续通过 MHSA + FFN 建立整行范围的依赖。',
  };

  const goToTiers = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    revealChapter(7, 9);
  };

  return (
    <div id="r7-sequence" className={`r7-sequence-lab r7-stage-${stage}`}>
      <div className="r7-scope-note">
        <div><span>本页主图</span><strong>PP-OCRv6 Medium / Small</strong></div>
        <p>两档使用 EncoderWithLightSVTR；Tiny 不使用 recognition neck。</p>
        <a className="ui-page-link" href="#chap-9" onClick={goToTiers}>Tiny 为什么例外？查看 §9 配置</a>
      </div>

      <div className="r7-source-pipeline" aria-label="从文字图像到横向序列特征">
        <div className="r7-source-sample"><span>教学文字行</span><strong>ARCHIVE 2026</strong></div>
        <Arrow />
        <div><span>LCNetV4 Backbone</span><strong>B × C × 1 × W</strong></div>
        <Arrow />
        <div><span>Reshape</span><strong>B × C × W</strong></div>
      </div>

      <div className="r7-stage-controls" role="group" aria-label="选择序列观察阶段">
        <SegmentedButton selected={stage === 'raw'} onClick={() => setStage('raw')}><b>①</b> 原始序列</SegmentedButton>
        <SegmentedButton selected={stage === 'local'} onClick={() => setStage('local')}><b>②</b> Local</SegmentedButton>
        <SegmentedButton selected={stage === 'global'} onClick={() => setStage('global')}><b>③</b> Global</SegmentedButton>
      </div>

      <section className="r7-observation-stage">
        <header>
          <div><span>固定观察对象 · 教学示意</span><strong>横向 Feature Sequence</strong></div>
          <code>position {selected + 1} / {POSITION_COUNT}</code>
        </header>

        <div className="r7-sequence-grid" role="group" aria-label="选择一个横向 feature position">
          {positions.map((index) => {
            const inLocalWindow = Math.abs(index - selected) <= 3;
            const className = [
              index === selected ? 'selected' : '',
              stage !== 'raw' && inLocalWindow ? 'local' : '',
              stage === 'global' ? 'global' : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                type="button"
                key={index}
                className={className}
                aria-label={`横向 feature position ${index + 1}`}
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
              >
                <i aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <div className="r7-position-label"><span>↑</span><strong>当前观察位置</strong><small>一格不等于一个字符</small></div>

        <svg className={`r7-attention-web ${stage === 'global' ? 'visible' : ''}`} viewBox="0 0 900 105" preserveAspectRatio="none" aria-hidden="true">
          {linkTargets.map((target) => {
            const targetX = 30 + target * (840 / (POSITION_COUNT - 1));
            const middleX = (selectedX + targetX) / 2;
            const lift = 15 + Math.abs(selected - target) * 3;
            return <path key={target} d={`M ${selectedX} 96 Q ${middleX} ${lift} ${targetX} 96`} />;
          })}
        </svg>

        <div className="r7-stage-blocks">
          <div className={stage !== 'raw' ? 'active' : ''}><span>Channel projection</span><strong>1×1 Conv · C → D</strong><small>Medium 192 · Small 120</small></div>
          <Arrow />
          <div className={stage === 'local' || stage === 'global' ? 'active local' : ''}><span>Local first</span><strong>DWConv 1×7</strong></div>
          <Arrow />
          <div className={stage === 'global' ? 'active global' : ''}><span>Global next</span><strong>Transformer × L</strong><small>MHSA + FFN · L = 2</small></div>
        </div>
        <p className="r7-stage-boundary">教学网格和连线只表达观察范围，不代表论文中的具体 attention weight，也不建立 feature position 与字符的一一对应。</p>
      </section>

      <div className={`feedback ${stage === 'global' ? 'good' : ''}`} role="status" aria-live="polite">{feedback[stage]}</div>
    </div>
  );
};

export const RecognitionFusionLab: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<FusionMode>('v6');
  const [formulaFocus, setFormulaFocus] = useState<FormulaFocus>('add');
  const isV6 = mode === 'v6';

  const formulaHelp: Record<Exclude<FormulaFocus, null>, { title: string; text: string }> = {
    add: { title: '+ · Element-wise Addition', text: '两路具有相同的 D 维度，因此可逐元素相加。' },
    skip: { title: 'Conv_skip · Skip Projection', text: '原始输入先通过 1×1 Conv 投影到 D，再与主路融合。' },
  };

  return (
    <div id="r7-fusion" className={`r7-fusion-lab r7-fusion-${mode}`}>
      <div className="r7-fusion-tabs" role="group" aria-label="比较识别 neck 的融合方式">
        <SegmentedButton selected={mode === 'v5'} onClick={() => setMode('v5')}>PP-OCRv5 · Concat</SegmentedButton>
        <SegmentedButton selected={mode === 'v6'} onClick={() => setMode('v6')}>PP-OCRv6 · Add</SegmentedButton>
      </div>

      <section className="r7-parallel-graph" aria-label={isV6 ? 'PP-OCRv6 LightSVTR 并行加法支路' : 'PP-OCRv5 EncoderWithSVTR 拼接支路'}>
        <div className="r7-branch-input"><span>Input</span><strong>x</strong><small>{isV6 ? 'B × C × W' : 'C channels'}</small></div>

        <div className="r7-branch-paths">
          <div className="r7-main-branch">
            <header><span>Local–Global Path</span><em>Online</em></header>
            <div className="r7-path-flow">
              {isV6 ? (
                <>
                  <span>1×1 Conv<small>C → D</small></span><Arrow />
                  <span>DWConv 1×7<small>Local</small></span><Arrow />
                  <span>Transformer × L<small>MHSA + FFN</small></span><Arrow />
                  <strong>Feature A<small>D</small></strong>
                </>
              ) : (
                <><span>Global SVTR<small>EncoderWithSVTR</small></span><Arrow /><strong>Feature A<small>C</small></strong></>
              )}
            </div>
          </div>

          <div className="r7-skip-branch">
            <header><span>Skip Path</span><em>Parallel</em></header>
            <div className="r7-path-flow">
              {isV6 ? (
                <><span>1×1 Skip Conv<small>C → D</small></span><Arrow /><strong>Feature B<small>D</small></strong></>
              ) : (
                <><span>Input feature<small>Identity path</small></span><Arrow /><strong>Feature B<small>C</small></strong></>
              )}
            </div>
          </div>
        </div>

        <div className="r7-merge-node">
          <span>Feature A</span><span>Feature B</span>
          <button type="button" className={formulaFocus === 'add' && isV6 ? 'selected' : ''} onClick={() => isV6 && setFormulaFocus('add')}>{isV6 ? '+' : 'Concat'}</button>
          {isV6 ? null : <><Arrow /><em>2C</em><Arrow /><b>1×1 Projection</b></>}
          <strong>y <small>{isV6 ? 'D' : 'C'}</small></strong>
        </div>
      </section>

      <div className="r7-channel-demo" aria-label="Concat 与 Add 的通道宽度变化">
        <div><span>通道宽度</span><strong>{isV6 ? 'D + D' : 'C + C'}</strong></div>
        <div className="r7-channel-tiles"><i /><i /></div>
        <Arrow />
        <div className="r7-channel-result"><strong>{isV6 ? 'Add → D' : 'Concat → 2C → Projection → C'}</strong><span>{isV6 ? '不先扩成双倍通道' : '先拼宽，再用 1×1 Conv 压回 C'}</span></div>
      </div>

      <div className="r7-inline-formula">
        <span>{isV6 ? 'EncoderWithLightSVTR' : 'EncoderWithSVTR'}</span>
        {isV6 ? (
          <div>
            <code>y = Transformer<sup>L</sup>(DWConv<sub>1×7</sub>(Conv<sub>1×1</sub>(x)))</code>
            <button type="button" aria-label="解释逐元素加法" className={formulaFocus === 'add' ? 'selected' : ''} onClick={() => setFormulaFocus('add')}>+</button>
            <button type="button" aria-label="解释 skip 1×1 projection" className={formulaFocus === 'skip' ? 'selected' : ''} onClick={() => setFormulaFocus('skip')}>Conv<sub>skip 1×1</sub>(x)</button>
          </div>
        ) : (
          <code>y = Conv<sub>1×1</sub>(Concat[SVTR(x), x])</code>
        )}
        <p>{isV6 && formulaFocus ? <><strong>{formulaHelp[formulaFocus].title}</strong>{formulaHelp[formulaFocus].text}</> : 'Concat 将两路通道拼接为 2C，再投影回 C。'}</p>
      </div>

      <div className={`feedback ${isV6 ? 'good' : ''}`} role="status">
        {isV6
          ? 'Additive skip 是一条并行路径，不是 Transformer 后面的串行模块；它是当前 LightSVTR neck 的轻量融合选择。'
          : 'PP-OCRv5 使用 concat：先把两路通道拼成 2C，再通过 1×1 projection 压回 C。'}
      </div>
    </div>
  );
};

export const RecognitionHeadsLab: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<HeadView>('training');
  const isTraining = view === 'training';

  return (
    <div id="r7-heads" className={`r7-heads-lab r7-heads-${view}`}>
      <div className="r7-head-tabs" role="group" aria-label="切换识别训练图与推理图">
        <SegmentedButton selected={view === 'training'} onClick={() => setView('training')}>Training</SegmentedButton>
        <SegmentedButton selected={view === 'inference'} onClick={() => setView('inference')}>Inference</SegmentedButton>
      </div>

      <div className="r7-online-spine">
        <span>1×1 Projection</span><Arrow /><span>DWConv 1×7</span><Arrow /><span>Transformer × L</span><Arrow /><span>Additive Skip</span><Arrow /><strong>Shared Recognition Feature</strong>
        <em>LightSVTR online path 始终保留</em>
      </div>

      <section className="r7-head-stage">
        <div className="r7-shared-feature"><span>Shared Feature</span><strong>Local + Global</strong></div>
        <div className="r7-head-branches">
          <div className="r7-ctc-branch">
            <span>CTC Head</span><Arrow /><span>Parallel timestep logits</span><Arrow /><span>CTC Decode</span><Arrow /><strong>ARCHIVE 2026</strong><em>Inference path</em>
          </div>
          <div className={`r7-nrtr-branch ${isTraining ? 'visible' : ''}`} aria-hidden={!isTraining}>
            <span>NRTR Head</span><Arrow /><strong>Cross-entropy supervision</strong><em>Train only · Auxiliary regularizer</em>
          </div>
        </div>
        <p>{isTraining ? 'CTC 与 NRTR 从同一份 shared representation 分出，两者都参与训练监督。' : '紫色 NRTR Head 已移除；CTC 仍使用完整的 LightSVTR shared feature。'}</p>
      </section>

      <details className="r7-nrtr-detail">
        <summary>NRTR 在训练中怎样帮助共享表示？</summary>
        <p>NRTR Head 接受 ground-truth cross-entropy supervision，并使用 label smoothing；它通过共享 encoder representation 起到隐式语言模型式的正则化作用。本节不展开自回归解码细节。</p>
      </details>

      <div className={`feedback ${!isTraining ? 'good' : ''}`} role="status" aria-live="polite">
        {isTraining
          ? '训练时有两个识别 Head，但 NRTR 不是线上第二份识别结果。'
          : '全局建模没有消失。消失的是训练专用的 NRTR Head；1×7 DWConv、Transformer、Additive Skip 与 CTC 全部保留。'}
      </div>
    </div>
  );
};

function EvidenceRow({ label, value, delta, tone = 'blue' }: { label: string; value: string; delta?: string; tone?: 'blue' | 'green' | 'muted' }) {
  return (
    <div className={`r7-evidence-row ${tone}`}>
      <span>{label}</span><strong>{value}</strong>{delta ? <em>{delta}</em> : null}
    </div>
  );
}

export const RecognitionEvidence: React.FC<WidgetProps> = () => {
  return (
    <div className="r7-evidence">
      <aside className="r7-tiny-boundary">
        <div><span>模型范围边界</span><strong>Tiny 是例外</strong></div>
        <code>Backbone → Reshape + FC → CTC / NRTR Heads</code>
        <p>Tiny 为极小容量移除 EncoderWithLightSVTR；这不等于序列建模对 Medium / Small 没有价值。</p>
      </aside>

      <section className="r7-ablation">
        <header>
          <div><span>论文证据 · Appendix Table 14</span><strong>这些识别改动真的有用吗？</strong></div>
          <small>Recognition ablation · backbone fixed</small>
        </header>
        <div className="r7-ablation-groups">
          <article>
            <h5>Neck Design</h5>
            <EvidenceRow label="No neck" value="74.52" tone="muted" />
            <EvidenceRow label="EncoderWithSVTR" value="79.35" />
            <EvidenceRow label="+ additive skip" value="79.77" delta="+0.42" />
            <EvidenceRow label="+ DWConv 1×7" value="80.24" delta="+0.89 vs baseline" tone="green" />
            <p>在 additive skip 基础上加入 1×7 DWConv，进一步增加约 +0.47。</p>
          </article>
          <article>
            <h5>Decoder</h5>
            <EvidenceRow label="CTC only" value="79.08" />
            <EvidenceRow label="CTC + NRTR-384" value="80.24" delta="+1.16" tone="green" />
            <EvidenceRow label="CTC + NRTR-512" value="80.61" tone="green" />
            <p>NRTR-384 与 NRTR-512 是 decoder 配置比较，不与左侧 Neck Design 按行连续累加。</p>
          </article>
        </div>
        <p className="r7-ablation-boundary">两个小组分别研究 neck 与 decoder；不要把全部数字解释成一条连续的 sequential ablation。No neck 结果也不能直接用于否定专门重设计并配合蒸馏的 Tiny。</p>
      </section>

      <div className="r7-final-structure">
        <div><span>横向局部归纳偏置</span><b>+</b><span>全局 Transformer</span><b>+</b><span>轻量 Additive Fusion</span></div>
        <Arrow />
        <strong>Shared Recognition Feature</strong>
        <Arrow />
        <div><span>CTC · Online</span><b>+</b><span className="training">NRTR · Training only</span></div>
        <p>推理结构仍然拥有 local + global 表示能力；NRTR 只是训练期额外监督。</p>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type TokenKind = 'text' | 'visual';

interface SequenceToken {
  id: string;
  label: string;
  kind: TokenKind;
  unit: 0 | 1 | 2;
}

const TOKENS: SequenceToken[] = [
  { id: 't1', label: 'T₁', kind: 'text', unit: 0 },
  { id: 'a1', label: 'A1', kind: 'visual', unit: 1 },
  { id: 'a2', label: 'A2', kind: 'visual', unit: 1 },
  { id: 'a3', label: 'A3', kind: 'visual', unit: 1 },
  { id: 'a4', label: 'A4', kind: 'visual', unit: 1 },
  { id: 't2', label: 'T₂', kind: 'text', unit: 0 },
  { id: 'b1', label: 'B1', kind: 'visual', unit: 2 },
  { id: 'b2', label: 'B2', kind: 'visual', unit: 2 },
  { id: 'b3', label: 'B3', kind: 'visual', unit: 2 },
  { id: 'b4', label: 'B4', kind: 'visual', unit: 2 },
  { id: 'q', label: 'Q', kind: 'text', unit: 0 },
];

const canAttend = (queryIndex: number, keyIndex: number) => {
  const query = TOKENS[queryIndex];
  const key = TOKENS[keyIndex];
  return keyIndex <= queryIndex || (query.unit > 0 && query.unit === key.unit);
};

function TokenButton({ index, selected, onSelect }: { index: number; selected: number; onSelect: (index: number) => void }) {
  const token = TOKENS[index];
  const visible = canAttend(selected, index);
  const className = [
    'ch5-token',
    token.kind === 'visual' ? 'is-visual' : 'is-text',
    index === selected ? 'is-query' : '',
    visible ? 'is-visible' : 'is-masked',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={className}
      aria-pressed={index === selected}
      onClick={() => onSelect(index)}
    >
      {token.label}
    </button>
  );
}

function VisualUnit({ unit, selected, onSelect }: { unit: 1 | 2; selected: number; onSelect: (index: number) => void }) {
  const indices = unit === 1 ? [1, 2, 3, 4] : [6, 7, 8, 9];
  return (
    <div className={`ch5-visual-unit is-unit-${unit}`}>
      <small>visual unit {unit}</small>
      <div>
        <code>&lt;img&gt;</code>
        <span className="ch5-unit-tokens">
          {indices.map((index) => <TokenButton key={index} index={index} selected={selected} onSelect={onSelect} />)}
        </span>
        <code>&lt;/img&gt;</code>
      </div>
    </div>
  );
}

function CausalPrimer() {
  const words = ['我', '看', '到', '一', '辆', '红', '车'];
  const patches = ['建筑', '天空', '路口', '红车', '道路', '路边'];
  return (
    <section className="ch5-primer" aria-labelledby="ch5-primer-title">
      <h5 id="ch5-primer-title">如果 visual tokens 只能看见序列中更早的 token，会怎样？</h5>
      <div className="ch5-causal-reminder">
        <div className="ch5-word-sequence" aria-label="普通文本的因果顺序">
          {words.map((word, index) => (
            <React.Fragment key={word + index}>
              <span>{word}</span>{index < words.length - 1 ? <i aria-hidden="true">←</i> : null}
            </React.Fragment>
          ))}
        </div>
        <p><b>decoder-only LLM 通常使用 causal attention：</b>后面的 token 可以利用已经出现的内容。</p>
      </div>

      <div className="ch5-image-question">
        <div>
          <h6>换成同一张红车街景</h6>
          <div className="ch5-patch-grid" aria-label="一张街景中的六个视觉区域">
            {patches.map((patch) => <span className={patch === '红车' ? 'is-car' : ''} key={patch}>{patch}</span>)}
          </div>
        </div>
        <blockquote>但一张图片真的有“左边 token 比右边 token 更早”这种语义吗？</blockquote>
      </div>

      <div className="ch5-mini-contrast" aria-label="纯因果与视觉单元内双向交互的简短对比">
        <figure>
          <figcaption>如果严格 causal</figcaption>
          <div className="ch5-mini-grid is-causal">
            {Array.from({ length: 6 }, (_, index) => <i className={index === 0 ? 'is-current' : ''} key={index} />)}
          </div>
          <p>前面的视觉 token 无法访问同图中排在后面的区域。</p>
        </figure>
        <span className="ch5-contrast-arrow" aria-hidden="true">→</span>
        <figure>
          <figcaption>同一 visual unit</figcaption>
          <div className="ch5-mini-grid is-bidirectional">
            {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
            <b aria-hidden="true">↔　↕　↔</b>
          </div>
          <p><strong>同一张图片 / 同一帧内部：双向。</strong></p>
        </figure>
      </div>
      <p className="ch5-primer-conclusion">为了理解完整图片，同一 visual unit 内的空间区域需要充分互相交互，而不应只受普通文本式的左到右因果限制。</p>
    </section>
  );
}

function AttentionMatrix({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  return (
    <div className="ch5-matrix-wrap">
      <div className="ch5-matrix-title">
        <h6>Attention mask</h6>
        <span>K（被查看）→</span>
      </div>
      <div className="ch5-matrix-scroll">
        <div className="ch5-matrix" role="grid" aria-label="混合 attention mask；行是 query，列是 key">
          <span className="ch5-matrix-corner">Q↓</span>
          {TOKENS.map((token) => <b className="ch5-col-label" key={`col-${token.id}`}>{token.label}</b>)}
          {TOKENS.map((query, queryIndex) => (
            <React.Fragment key={`row-${query.id}`}>
              <button
                type="button"
                className={`ch5-row-label ${queryIndex === selected ? 'is-selected' : ''}`}
                onClick={() => onSelect(queryIndex)}
                aria-label={`选择 query ${query.label}`}
              >
                {query.label}
              </button>
              {TOKENS.map((key, keyIndex) => {
                const open = canAttend(queryIndex, keyIndex);
                const sameUnit = query.unit > 0 && query.unit === key.unit;
                const classes = [
                  'ch5-mask-cell',
                  open ? 'is-open' : 'is-closed',
                  sameUnit ? 'is-unit-block' : '',
                  queryIndex === selected ? 'is-active-row' : '',
                ].filter(Boolean).join(' ');
                return (
                  <span
                    className={classes}
                    role="gridcell"
                    aria-label={`${query.label} ${open ? '可以' : '不能'}查看 ${key.label}`}
                    key={`${query.id}-${key.id}`}
                  >
                    {sameUnit ? '◆' : open ? '•' : ''}
                  </span>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="ch5-matrix-legend">
        <span><i className="is-causal" /> causal：已出现的 token</span>
        <span><i className="is-unit" /> unit 内：完整双向块</span>
        <span><i className="is-closed" /> 被 mask</span>
      </div>
    </div>
  );
}

function feedbackFor(index: number) {
  const token = TOKENS[index];
  if (token.unit === 1) return '同一 visual unit 内不受普通 causal 顺序限制，可以双向交互；未来的 Text₂、Image 2 与 Question 仍被 mask。';
  if (token.unit === 2) return 'Image 2 可以利用此前的文字与 Image 1，并看见本 visual unit 内全部 token；后面的 Question 仍被 mask。';
  if (token.id === 'q') return 'Question 位于序列最后，可以利用此前出现的全部文字和多图视觉上下文。';
  if (token.id === 't2') return 'Text₂ 可以利用此前的 Text₁ 与 Image 1，但不能访问未来的 Image 2 和 Question。';
  return 'Text₁ 位于序列开头，只能查看自己；未来的 visual units 仍不可见。';
}

function AttentionExperiment() {
  const [selected, setSelected] = useState(2);
  const visible = TOKENS.filter((_, index) => canAttend(selected, index)).map((token) => token.label).join('、');

  return (
    <section className="ch5-experiment" aria-labelledby="ch5-experiment-title">
      <div className="ch5-section-heading">
        <small>互动实验</small>
        <h5 id="ch5-experiment-title">点一个 token，看看它能“看见”谁</h5>
        <p>橙色描边是当前 query；清晰 token 是可用证据；淡化 token 是被 mask 的未来内容。</p>
      </div>

      <div className="ch5-sequence" aria-label="包含两个视觉单元的统一输入序列">
        <TokenButton index={0} selected={selected} onSelect={setSelected} />
        <i aria-hidden="true">→</i>
        <VisualUnit unit={1} selected={selected} onSelect={setSelected} />
        <i aria-hidden="true">→</i>
        <TokenButton index={5} selected={selected} onSelect={setSelected} />
        <i aria-hidden="true">→</i>
        <VisualUnit unit={2} selected={selected} onSelect={setSelected} />
        <i aria-hidden="true">→</i>
        <TokenButton index={10} selected={selected} onSelect={setSelected} />
      </div>

      <div className="ch5-selection-summary" aria-live="polite">
        <b>{TOKENS[selected].label} 可以看见</b>
        <span>{visible}</span>
        <p>{feedbackFor(selected)}</p>
      </div>

      <AttentionMatrix selected={selected} onSelect={setSelected} />
      <div className="ch5-core-rule">
        <b>unit 内：双向</b>
        <span>+</span>
        <b>unit 间：因果</b>
      </div>
    </section>
  );
}

function TransferRule() {
  return (
    <section className="ch5-transfer" aria-labelledby="ch5-transfer-title">
      <h5 id="ch5-transfer-title">同一规则怎样迁移到多图和视频？</h5>
      <div className="ch5-transfer-lanes">
        <article>
          <h6>多图</h6>
          <div><span>Image A<small>内部 ↔</small></span><i>→</i><span>Image B<small>内部 ↔</small></span><i>→</i><span>Image C<small>内部 ↔</small></span></div>
          <p>每张图片内部双向；不同图片之间按 §4 的 sequence 顺序保持 causal interaction。</p>
        </article>
        <article>
          <h6>视频</h6>
          <div><span>Frame 1<small>τ₁ · 内部 ↔</small></span><i>→</i><span>Frame 2<small>τ₂ · 内部 ↔</small></span><i>→</i><span>Frame 3<small>τ₃ · 内部 ↔</small></span></div>
          <p>每个 sampled frame 都是独立 visual unit：帧内双向，跨帧保持时间顺序。</p>
        </article>
      </div>
    </section>
  );
}

function PaperRule() {
  return (
    <section className="ch5-paper-rule" aria-labelledby="ch5-paper-rule-title">
      <h5 id="ch5-paper-rule-title">论文怎样定义这套规则？</h5>
      <div className="ch5-equation" aria-label="论文中的 mixed attention mask 公式">
        <span>ℳᵢⱼ = 1</span>
        <i>⇔</i>
        <strong>j ≤ i</strong>
        <em>∨</em>
        <strong>uᵢ = uⱼ &gt; 0</strong>
      </div>
      <p className="ch5-or-note"><b>∨ 的意思很简单：</b>满足任意一个条件，就允许 attention。</p>

      <div className="ch5-equation-rules">
        <article>
          <code>j ≤ i</code>
          <div><b>顺序规则</b><p>可以看已经出现在自己之前的 token。</p></div>
          <span>过去 → 当前</span>
        </article>
        <article>
          <code>uᵢ = uⱼ &gt; 0</code>
          <div><b>visual unit 规则</b><p>两个 token 属于同一视觉单元时，允许双向交互。</p></div>
          <span>A1 ↔ A2 ↔ A3 ↔ A4</span>
        </article>
      </div>

    </section>
  );
}

export const NeoCh5Main: React.FC<WidgetProps> = () => (
  <div className="ch5-attention-lesson">
    <CausalPrimer />
    <AttentionExperiment />
    <TransferRule />
    <PaperRule />
    <div className="ch5-takeaway">💡 <b>NEO-ov 在同一 visual unit 内允许视觉 token 双向交互，而不同 visual units 之间仍保持序列上的因果关系。</b>这样，一张图片或一帧内部可以充分建模视觉结构，同时多图和视频仍保留有序依赖。</div>
  </div>
);

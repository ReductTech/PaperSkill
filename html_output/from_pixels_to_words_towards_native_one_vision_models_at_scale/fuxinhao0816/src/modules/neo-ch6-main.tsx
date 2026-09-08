import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Axis = 'T' | 'H' | 'W';
type Unit = 'A' | 'B';
type SelectionSlot = 'A' | 'B';
type IndexAxis = 't' | 'h' | 'w';

interface IndexToken {
  id: string;
  label: string;
  kind: 'text' | 'visual';
  t: number;
  h: number;
  w: number;
  unit?: Unit;
}

const SUBSCRIPTS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const sub = (value: number) => String(value).split('').map((digit) => SUBSCRIPTS[Number(digit)]).join('');

const AXIS_COPY: Record<Axis, { title: string; duty: string; cue: string }> = {
  T: { title: '时序 / 序列关系', duty: 'textual order · cross-image relations · cross-frame dependencies', cue: '序列：过去 → 当前 → 后续' },
  H: { title: '高度方向关系', duty: '建模二维空间中的纵向结构', cue: '纵向：上 ↕ 下' },
  W: { title: '宽度方向关系', duty: '建模二维空间中的横向结构', cue: '横向：左 ↔ 右' },
};

function AxisButton({ axis, active, onClick }: { axis: Axis; active: boolean; onClick: () => void }) {
  return <button type="button" className={`ch6c-axis ch6c-axis-${axis.toLowerCase()} ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={onClick}>{axis}</button>;
}

function ChannelSection() {
  const [active, setActive] = useState<Axis>('T');
  const info = AXIS_COPY[active];
  const axisClass = `is-axis-${active.toLowerCase()}`;

  return (
    <section className={`ch6-channel-section ${axisClass}`} aria-labelledby="ch6-channel-title">
      <h5 id="ch6-channel-title"><span>6.1</span> 一组 Q/K，怎样同时表达时序与二维空间？</h5>

      <div className="ch6c-capacity">
        <div className="ch6c-original">
          <small>普通 LLM Attention Head</small>
          <div><span>Q</span><b>原 LLM head dimension</b></div>
          <div><span>K</span><b>原 LLM head dimension</b></div>
        </div>
        <i aria-hidden="true">↓</i>
        <div className="ch6c-extension">
          <div><small>保留原有 capacity</small><AxisButton axis="T" active={active === 'T'} onClick={() => setActive('T')} /><p>原 LLM head dimension 作为 T component</p></div>
          <b aria-hidden="true">+</b>
          <div><small>新增 spatial capacity</small><span><AxisButton axis="H" active={active === 'H'} onClick={() => setActive('H')} /><AxisButton axis="W" active={active === 'W'} onClick={() => setActive('W')} /></span><p>额外引入 H/W spatial dimensions</p></div>
        </div>
        <div className="ch6c-not-split">不是把原来的 head dimension 平均切成三份，而是在保留 T capacity 的基础上扩展 H/W。</div>
      </div>

      <div className="ch6c-demo-heading"><small>互动演示</small><h6>一次 token correlation，哪些关系共同参与？</h6><p>点击 T、H 或 W，结构图会同步突出对应的 Q/K feature components 与关系路径。</p></div>
      <div className="ch6c-correlation-demo">
        <div className="ch6c-qk-row">
          <b>Query i</b>
          {(['T', 'H', 'W'] as Axis[]).map((axis) => <AxisButton key={`q-${axis}`} axis={axis} active={active === axis} onClick={() => setActive(axis)} />)}
        </div>
        <div className="ch6c-pair-lines">
          {(['T', 'H', 'W'] as Axis[]).map((axis) => <span className={`is-${axis.toLowerCase()} ${active === axis ? 'is-active' : ''}`} key={axis}>qᵢ{axis === 'T' ? 'ᵀ' : axis === 'H' ? 'ᴴ' : 'ᵂ'} ↕ kⱼ{axis === 'T' ? 'ᵀ' : axis === 'H' ? 'ᴴ' : 'ᵂ'}</span>)}
        </div>
        <div className="ch6c-qk-row">
          <b>Key j</b>
          {(['T', 'H', 'W'] as Axis[]).map((axis) => <AxisButton key={`k-${axis}`} axis={axis} active={active === axis} onClick={() => setActive(axis)} />)}
        </div>
        <div className="ch6c-active-duty" aria-live="polite"><b>{active} · {info.title}</b><span>{info.duty}</span><strong>{info.cue}</strong></div>
      </div>

      <div className="ch6c-equation" aria-label="THW-decoupled Query 和 Key 公式">
        <span>qᵢ = [ qᵢᵀ ; qᵢᴴ ; qᵢᵂ ]</span>
        <span>kⱼ = [ kⱼᵀ ; kⱼᴴ ; kⱼᵂ ]</span>
      </div>
      <div className="ch6c-component-key"><span><b>T</b> temporal / sequential relation</span><span><b>H</b> height-related spatial relation</span><span><b>W</b> width-related spatial relation</span></div>

      <h6 className="ch6c-correlation-title">三部分怎样共同形成 token correlation？</h6>
      <div className="ch6c-merge-flow">
        <div><span className="is-t">⟨qᵢᵀ,kⱼᵀ⟩</span><span className="is-h">⟨qᵢᴴ,kⱼᴴ⟩</span><span className="is-w">⟨qᵢᵂ,kⱼᵂ⟩</span></div>
        <i aria-hidden="true">→</i>
        <strong>correlation sᵢⱼ</strong>
      </div>
      <div className="ch6c-equation is-score" aria-label="T H W 三个 correlation terms 求和公式">sᵢⱼ = ⟨qᵢᵀ,kⱼᵀ⟩ + ⟨qᵢᴴ,kⱼᴴ⟩ + ⟨qᵢᵂ,kⱼᵂ⟩</div>
      <p className="ch6c-formula-note">同一个 Attention 中，Q/K correlation 由 T/H/W 三部分共同贡献；它们不是三个独立 Attention modules。</p>

    </section>
  );
}

const makeVisualTokens = (unit: Unit, t: number): IndexToken[] => Array.from({ length: 9 }, (_, index) => ({
  id: `${unit}${index + 1}`,
  label: `${unit}${index + 1}`,
  kind: 'visual' as const,
  unit,
  t,
  h: Math.floor(index / 3) + 1,
  w: index % 3 + 1,
}));

const VISUAL_TOKENS = [...makeVisualTokens('A', 1), ...makeVisualTokens('B', 2)];
const TEXT_TOKENS: IndexToken[] = ['红色', '汽车', '在', '哪里'].map((label, index) => ({ id: `text-${index}`, label, kind: 'text', t: index + 3, h: 0, w: 0 }));
const INDEX_TOKENS = [...VISUAL_TOKENS, ...TEXT_TOKENS];
const tokenById = (id: string) => INDEX_TOKENS.find((token) => token.id === id) ?? VISUAL_TOKENS[4];
const indexLabel = (token: IndexToken) => token.kind === 'text' ? `[t${sub(token.t)}, 0, 0]` : `[t${sub(token.t)}, h${sub(token.h)}, w${sub(token.w)}]`;
const coordinateLabel = (token: IndexToken, axis: IndexAxis) => token[axis] === 0 ? '0' : `${axis}${sub(token[axis])}`;

function SelectionMark({ slot }: { slot: SelectionSlot }) {
  return <span className={`ch6i-selection-mark is-${slot.toLowerCase()}`} aria-hidden="true">{slot}</span>;
}

function IndexGrid({ unit, tokenA, tokenB, onSelect }: { unit: Unit; tokenA: IndexToken; tokenB: IndexToken; onSelect: (id: string) => void }) {
  const tokens = VISUAL_TOKENS.filter((token) => token.unit === unit);
  return (
    <article className="ch6i-image-grid">
      <header><b>Image {unit}</b><span>temporal index · t{sub(unit === 'A' ? 1 : 2)}</span></header>
      <div className="ch6i-col-labels"><i /><span>w₁</span><span>w₂</span><span>w₃</span></div>
      <div className="ch6i-grid-body">
        <div className="ch6i-row-labels"><span>h₁</span><span>h₂</span><span>h₃</span></div>
        <div className="ch6i-grid" aria-label={`Image ${unit} 的位置索引网格`}>
          {tokens.map((token) => {
            const isA = tokenA.id === token.id;
            const isB = tokenB.id === token.id;
            const rowA = tokenA.unit === unit && token.h === tokenA.h;
            const rowB = tokenB.unit === unit && token.h === tokenB.h;
            const colA = tokenA.unit === unit && token.w === tokenA.w;
            const colB = tokenB.unit === unit && token.w === tokenB.w;
            const classes = [rowA && 'is-row-a', rowB && 'is-row-b', colA && 'is-col-a', colB && 'is-col-b', isA && 'is-token-a', isB && 'is-token-b'].filter(Boolean).join(' ');
            return <button type="button" className={classes} aria-pressed={isA || isB} onClick={() => onSelect(token.id)} key={token.id}>{isA && <SelectionMark slot="A" />}{isB && <SelectionMark slot="B" />}<b>{token.label}</b><small>h{sub(token.h)},w{sub(token.w)}</small></button>;
          })}
        </div>
      </div>
    </article>
  );
}

function IndexAssignment() {
  const [selectedA, setSelectedA] = useState('A5');
  const [selectedB, setSelectedB] = useState('A6');
  const [activeSlot, setActiveSlot] = useState<SelectionSlot>('B');
  const tokenA = tokenById(selectedA);
  const tokenB = tokenById(selectedB);

  const assignToken = (id: string) => {
    if (activeSlot === 'A') {
      if (id === selectedB) setSelectedB(selectedA);
      setSelectedA(id);
      return;
    }
    if (id === selectedA) setSelectedA(selectedB);
    setSelectedB(id);
  };

  const insight = tokenA.kind === 'text' && tokenB.kind === 'text'
    ? '两个 text token 都以 temporal / sequential position 区分，h 和 w 均为 0。'
    : tokenA.kind === 'visual' && tokenB.kind === 'visual' && tokenA.unit === tokenB.unit
      ? `两个 token 来自同一 Image ${tokenA.unit}，共享 t${sub(tokenA.t)}；图内位置由 h / w 区分。`
      : tokenA.kind === 'visual' && tokenB.kind === 'visual'
        ? '两个 token 来自不同 visual units，因此 t 不同；h / w 仍在各自图像内部定义。'
        : '文本与视觉 token 使用同一组三维索引表示，但只有 visual token 使用非零的 h / w 空间索引。';

  const selectedSlot = (id: string) => id === selectedA ? 'A' : id === selectedB ? 'B' : null;

  return (
    <div className="ch6i-assignment">
      <div className="ch6i-demo-heading"><small>互动实验</small><h6>任选两个 token，比较它们的位置索引</h6><p>分别选择 Token A 和 Token B，观察它们的 t / h / w 哪些相同、哪些不同。</p></div>
      <div className="ch6i-slot-controls" aria-label="选择要替换的比较位置">
        {(['A', 'B'] as SelectionSlot[]).map((slot) => <button type="button" className={activeSlot === slot ? 'is-active' : ''} aria-pressed={activeSlot === slot} onClick={() => setActiveSlot(slot)} key={slot}><SelectionMark slot={slot} /><span>Token {slot}</span><b>{slot === 'A' ? tokenA.label : tokenB.label}</b><small>{activeSlot === slot ? '正在选择' : '点击以替换'}</small></button>)}
      </div>
      <div className="ch6i-text-tokens">
        <span>Text</span>
        <div>{TEXT_TOKENS.map((token) => {
          const slot = selectedSlot(token.id);
          return <button type="button" className={slot ? `is-token-${slot.toLowerCase()}` : ''} aria-pressed={Boolean(slot)} onClick={() => assignToken(token.id)} key={token.id}>{slot && <SelectionMark slot={slot} />}{token.label}</button>;
        })}</div>
        <code>text → [tᵢ, 0, 0]</code>
      </div>
      <div className="ch6i-grid-pair"><IndexGrid unit="A" tokenA={tokenA} tokenB={tokenB} onSelect={assignToken} /><IndexGrid unit="B" tokenA={tokenA} tokenB={tokenB} onSelect={assignToken} /></div>
      <div className="ch6i-comparison" aria-live="polite">
        <div className="ch6i-token-result is-a"><SelectionMark slot="A" /><small>Token A</small><b>{tokenA.label}</b><code>{indexLabel(tokenA)}</code></div>
        <div className="ch6i-token-result is-b"><SelectionMark slot="B" /><small>Token B</small><b>{tokenB.label}</b><code>{indexLabel(tokenB)}</code></div>
        <div className="ch6i-axis-comparison">
          {(['t', 'h', 'w'] as IndexAxis[]).map((axis) => {
            const same = tokenA[axis] === tokenB[axis];
            return <div className={same ? 'is-same' : 'is-different'} key={axis}><b>{axis}</b><code>{coordinateLabel(tokenA, axis)} ↔ {coordinateLabel(tokenB, axis)}</code><strong>{same ? '✓ 相同' : '≠ 不同'}</strong></div>;
          })}
        </div>
        <p>{insight}</p>
      </div>
      <p className="ch6i-teaching-note">教学示意：离散索引用于解释论文的位置分配规律，不代表某个具体训练样本的绝对坐标。</p>
    </div>
  );
}

function NativeRopeSection() {
  return (
    <section className="ch6-index-section" aria-labelledby="ch6-index-title">
      <h5 id="ch6-index-title"><span>6.2</span> token 的时序与空间位置怎样编码？</h5>
      <p className="ch6i-opening">上一节解决了“用哪些 Q/K 通道建模时序和二维空间”。但这些 feature components 本身并没有说明：当前 token 具体位于什么序列位置、哪一行、哪一列，因此 NEO-ov 还需要为每个 token 定义位置索引。</p>

      <div className="ch6i-position-stage">
        <div className="ch6i-stage-heading"><small>第一阶段</small><h6>Position Index：每个 token 在哪里？</h6></div>
        <div className="ch6i-equation" aria-label="三维位置索引公式">idxᵢ = [ tᵢ, hᵢ, wᵢ ]</div>
        <div className="ch6i-index-definitions">
          <div><code>tᵢ</code><b>temporal / sequential position</b><span>token 在更大的时序或序列结构中的位置。</span></div>
          <div><code>hᵢ</code><b>vertical spatial position</b><span>visual token 在当前图像内部的纵向空间索引。</span></div>
          <div><code>wᵢ</code><b>horizontal spatial position</b><span>visual token 在当前图像内部的横向空间索引。</span></div>
        </div>
        <p className="ch6i-index-reminder"><code>t / h / w</code> = position indices</p>

        <IndexAssignment />

        <div className="ch6i-observation"><small>你可以从这些比较中看到</small><p>同一张图片中的 visual tokens 共享同一个 temporal / sequential index，并通过不同的 h / w 区分二维位置；不同 visual units 使用不同的 temporal / sequential positions，而空间索引在各自图像内部定义。</p></div>

        <div className="ch6i-video-transfer"><b>视频中的轻量迁移</b><span>Frame 1 patch · [t₁,h,w]</span><i>→</i><span>Frame 2 patch · [t₂,h,w]</span><i>→</i><span>Frame 3 patch · [t₃,h,w]</span></div>
        <p className="ch6i-video-note">不同 sampled frames 作为不同 visual units，对应不同的 temporal / sequential positions。</p>

      </div>

      <div className="ch6i-rope-question"><small>新的问题</small><h6>有了 [t,h,w]，Attention 怎么真正用上这些位置？</h6></div>

      <div className="ch6i-rope-stage">
        <div className="ch6i-stage-heading"><small>第二阶段</small><h6>Native-RoPE：把位置索引带进 Q/K</h6></div>
        <p className="ch6i-rope-intro">位置索引通过 Native-RoPE 作用到对应的 Q/K 分量。RoPE 根据这些索引对 Q/K 进行旋转式位置编码，而不是直接相加一个普通 PE vector。</p>
        <div className="ch6i-mechanism">
          <div className="ch6i-mechanism-input is-feature"><small>来自 §6.1 · Q/K feature components</small><code>q = [qᵀ | qᴴ | qᵂ]<br />k = [kᵀ | kᴴ | kᵂ]</code></div>
          <div className="ch6i-mechanism-input is-index"><small>刚刚得到 · Position index</small><code>idx = [t | h | w]</code></div>
          <div className="ch6i-converge" aria-hidden="true"><span>↘</span><span>↙</span></div>
          <strong>Native-RoPE</strong>
          <div className="ch6i-axis-map"><span><code>index t</code><i>→</i><b>qᵀ / kᵀ</b></span><span><code>index h</code><i>→</i><b>qᴴ / kᴴ</b></span><span><code>index w</code><i>→</i><b>qᵂ / kᵂ</b></span></div>
          <i className="ch6i-down" aria-hidden="true">↓</i>
          <div className="ch6i-positioned-output">带有对应 temporal / spatial position information 的 Q/K</div>
        </div>
      </div>
    </section>
  );
}

export const NeoCh6Main: React.FC<WidgetProps> = () => (
  <div className="ch6-position-lesson ch6-two-level-lesson">
    <ChannelSection />
    <NativeRopeSection />
    <div className="ch6-takeaway">💡 <b>THW-Decoupled Q/K</b> 定义表示通道；<b>Position Index</b> 定义 token 在哪里；<b>Native-RoPE</b> 利用这些 index 对 Q/K 做位置编码。</div>
  </div>
);

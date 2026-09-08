import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ImageOrder = 'AB' | 'BA';
type SceneKind = 'street' | 'water';

const Boundary = ({ children }: { children: React.ReactNode }) => (
  <code className="ch4-boundary">{children}</code>
);

function TokenRun({ count, label = '', tone = 'blue' }: { count: number; label?: string; tone?: 'blue' | 'orange' | 'green' }) {
  return (
    <span className={`ch4-token-run is-${tone}`} aria-label={label ? `${label}，${count} 个视觉 token` : `${count} 个视觉 token`}>
      <span className="ch4-token-cells" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => <i key={index} />)}
      </span>
      {label ? <small>{label}</small> : null}
    </span>
  );
}

function VisualSegment({ id, count, compact = false }: { id: string; count: number; compact?: boolean }) {
  return (
    <span className={`ch4-visual-segment ${compact ? 'is-compact' : ''}`}>
      <Boundary>&lt;img&gt;</Boundary>
      <TokenRun count={count} label={id} tone={id.includes('A') || id.includes('1') ? 'orange' : 'blue'} />
      <Boundary>&lt;/img&gt;</Boundary>
    </span>
  );
}

function SceneThumb({ kind, label, frame = 0 }: { kind: SceneKind; label?: string; frame?: number }) {
  const carX = 24 + frame * 14;
  return (
    <svg className="ch4-scene-thumb" viewBox="0 0 160 96" role="img" aria-label={kind === 'street' ? `${label ?? ''} 红色汽车街景` : `${label ?? ''} 蓝色小船水边场景`}>
      <rect width="160" height="96" rx="9" fill="#f5f8f0" />
      {kind === 'street' ? (
        <>
          <rect x="0" y="0" width="55" height="42" fill="#b8c9a7" />
          <rect x="10" y="13" width="34" height="29" rx="2" fill="#76906a" />
          <rect x="0" y="48" width="160" height="48" fill="#d9dde2" />
          <path d="M 74 48 L 95 96 M 116 48 L 116 96" stroke="#ffffff" strokeWidth="5" />
          <path d="M 0 72 L 160 72" stroke="#ffffff" strokeWidth="3" strokeDasharray="12 8" />
          <rect x={carX} y="61" width="38" height="17" rx="5" fill="#c43f52" stroke="#21324a" strokeWidth="2" />
          <circle cx={carX + 9} cy="79" r="4" fill="#21324a" />
          <circle cx={carX + 30} cy="79" r="4" fill="#21324a" />
          <path d="M 113 42 L 113 57 M 105 50 L 121 50" stroke="#d97706" strokeWidth="3" />
        </>
      ) : (
        <>
          <rect x="0" y="0" width="160" height="48" fill="#dce7ef" />
          <rect x="0" y="48" width="160" height="48" fill="#9bb8cb" />
          <path d="M 0 58 C 30 51, 55 65, 84 58 S 132 51, 160 60" fill="none" stroke="#ffffff" strokeWidth="3" />
          <path d="M 53 60 L 112 60 L 100 76 L 66 76 Z" fill="#27446e" stroke="#21324a" strokeWidth="2" />
          <path d="M 82 31 L 82 61 L 108 52 Z" fill="#ffffff" stroke="#d97706" strokeWidth="2" />
          <circle cx="25" cy="24" r="10" fill="#d97706" opacity="0.75" />
        </>
      )}
      {label ? <text x="10" y="90" fill="#21324a" fontSize="11" fontWeight="700">{label}</text> : null}
    </svg>
  );
}

const FormulaMap = ({ items }: { items: Array<[string, string]> }) => (
  <div className="ch4-symbol-map">
    {items.map(([symbol, meaning]) => (
      <div key={symbol}>
        <code>{symbol}</code>
        <span aria-hidden="true">→</span>
        <p>{meaning}</p>
      </div>
    ))}
  </div>
);

function NeedSerialization() {
  return (
    <section className="ch4-need" aria-labelledby="ch4-need-title">
      <div className="ch4-raw-tokens" aria-label="没有标明来源的 visual tokens">
        {[4, 3, 4].map((count, group) => (
          <span key={group}>{Array.from({ length: count }, (_, index) => <i key={index} />)}</span>
        ))}
      </div>
      <div className="ch4-ambiguity" id="ch4-need-title">
        <span>属于同一张图？</span>
        <span>来自三张图片？</span>
        <span>还是三个视频帧？</span>
      </div>
      <p>只看 token 本身还不够，模型还需要一种统一的方式组织视觉单元和文字。</p>
      <strong>统一视觉序列化 <small>Unified Visual Serialization</small></strong>
    </section>
  );
}

function SingleImageSection() {
  return (
    <section className="ch4-builder-section" aria-labelledby="ch4-single-title">
      <header>
        <span>4.1</span>
        <div>
          <h5 id="ch4-single-title">一张图片怎样插进文字？</h5>
        </div>
      </header>
      <div className="ch4-builder-flow is-single">
        <div className="ch4-order-label">原始输入</div>
        <div className="ch4-single-source">
          <SceneThumb kind="street" label="图片" />
          <p><b>问题</b><span>红色汽车停在哪里？</span></p>
        </div>
        <span className="ch4-down" aria-hidden="true">↓ <b>序列化后</b></span>
        <div className="ch4-order-label">序列化后的输入序列</div>
        <div className="ch4-sequence-line">
          <VisualSegment id="visual tokens" count={8} />
          <span className="ch4-text-token">红色汽车停在哪里？</span>
        </div>
        <p className="ch4-token-note">每个方块代表一个 visual token</p>
      </div>
      <p className="ch4-section-conclusion">一张图片不会变成一个 token，而是变成被 <Boundary>&lt;img&gt;</Boundary> 与 <Boundary>&lt;/img&gt;</Boundary> 包裹的一段 visual tokens。</p>
    </section>
  );
}

function MultiImageSection() {
  const [imageOrder, setImageOrder] = useState<ImageOrder>('AB');
  const order = imageOrder === 'AB' ? ['A', 'B'] as const : ['B', 'A'] as const;
  const config = {
    A: { kind: 'street' as const, tokens: 9, title: '红色汽车街景' },
    B: { kind: 'water' as const, tokens: 5, title: '蓝色小船水边' },
  };

  return (
    <section className="ch4-builder-section" aria-labelledby="ch4-multi-title">
      <header>
        <span>4.2</span>
        <div>
          <h5 id="ch4-multi-title">多张图片怎么知道“谁是谁、谁在前”？</h5>
          <p>交换图片在 prompt 中的位置，观察下方 sequence 怎样同步重排。</p>
        </div>
        <button
          type="button"
          className="ch4-primary-action ch4-section-action"
          onClick={() => setImageOrder((current) => current === 'AB' ? 'BA' : 'AB')}
        >
          交换 A / B 顺序
        </button>
      </header>

      <div className="ch4-order-board" key={`prompt-${imageOrder}`}>
        <div className="ch4-order-label">原始输入</div>
        <div className="ch4-prompt-copy">先看图片 {order[0]}，再看图片 {order[1]}，比较它们有什么不同？</div>
        <div className="ch4-image-order">
          {order.map((id) => (
            <article key={id}>
              <SceneThumb kind={config[id].kind} label={`图片 ${id}`} />
              <div><b>{config[id].title}</b><span>{config[id].tokens} 个 visual tokens</span></div>
            </article>
          ))}
        </div>
        <span className="ch4-down" aria-hidden="true">↓ 序列化</span>
        <div className="ch4-order-label">统一 token sequence</div>
        <div className="ch4-multi-sequence" key={`sequence-${imageOrder}`}>
          <span className="ch4-text-token">x_t₁</span>
          {order.map((id, index) => (
            <React.Fragment key={id}>
              <VisualSegment id={`图片 ${id} · x_v${index + 1}`} count={config[id].tokens} compact />
              {index === 0 ? <span className="ch4-text-token">x_t₂</span> : null}
            </React.Fragment>
          ))}
          <span className="ch4-query-token">q</span>
        </div>
      </div>

      <div className="ch4-feedback" aria-live="polite">visual segments 在统一序列中的顺序跟随图片在文本中的出现顺序；每张图仍保持独立边界。</div>
      <p className="ch4-variable-note"><b>不同图片的 visual segment 可以有不同长度。</b> token 数量会随图像空间尺寸调整，而不是强制每张图使用完全相同的固定长度。</p>

      <div className="ch4-formula-block">
        <h6>论文怎样表示多图输入？</h6>
        <div className="ch4-formula">{'X_multi = [ x_t₁, <img> x_v₁ </img>, …, x_tₘ, <img> x_vₘ </img>, q ]'}</div>
        <FormulaMap items={[
          ['x_tk', '第 k 个图像附近的文本片段'],
          ['x_vk', '第 k 张图片的 visual segment'],
          ['<img> … </img>', '一个独立视觉单元的边界'],
          ['q', '后续问题 / query'],
        ]} />
      </div>
    </section>
  );
}

function VideoSection() {
  const [serialized, setSerialized] = useState(false);
  const times = ['0.0s', '1.2s', '2.4s', '3.6s'];
  const tauLabels = ['τ₁', 'τ₂', 'τ₃', 'τ₄'];

  return (
    <section className="ch4-builder-section" aria-labelledby="ch4-video-title">
      <header>
        <span>4.3</span>
        <div>
          <h5 id="ch4-video-title">视频为什么不能只当成“一堆图片”？</h5>
          <p>多图有顺序，视频还需要表达“这些画面发生在什么时间”。</p>
        </div>
        <button
          type="button"
          className="ch4-primary-action ch4-section-action"
          onClick={() => setSerialized((current) => !current)}
        >
          {serialized ? '还原时间线' : '序列化这些帧'}
        </button>
      </header>

      <div className={`ch4-video-board ${serialized ? 'is-serialized' : ''}`}>
        <div className="ch4-filmstrip" aria-label="同一辆红车经过路口的四个采样帧">
          {times.map((time, index) => (
            <div className="ch4-frame" key={time}>
              <time>{time}</time>
              <SceneThumb kind="street" frame={index} label={`frame ${index + 1}`} />
            </div>
          ))}
        </div>
        <span className="ch4-down" aria-hidden="true">↓</span>
        {serialized ? (
          <div className="ch4-video-output">
            <div className="ch4-order-label">序列化后的统一输入序列</div>
            <div className="ch4-video-sequence" role="list" aria-label="视频序列化后的输入顺序">
              <div className="ch4-sequence-global" role="listitem">
                <b>p_global</b>
                <small>global prefix</small>
                <dl>
                  <div><dt>时长</dt><dd>3.6s</dd></div>
                  <div><dt>采样帧数</dt><dd>4</dd></div>
                  <div><dt>采样率</dt><dd>1.1 fps</dd></div>
                </dl>
              </div>
              {times.map((time, index) => (
                <div className="ch4-sequence-step" role="listitem" key={time}>
                  <span className="ch4-sequence-arrow" aria-hidden="true">→</span>
                  <div className="ch4-sequence-frame">
                    <time>[{tauLabels[index]} · {time}]</time>
                    <VisualSegment id="" count={4} compact />
                  </div>
                </div>
              ))}
              <div className="ch4-sequence-step" role="listitem">
                <span className="ch4-sequence-arrow" aria-hidden="true">→</span>
                <span className="ch4-query-token ch4-sequence-query">[问题 q]</span>
              </div>
            </div>
          </div>
        ) : <div className="ch4-video-placeholder">四个 sampled frames 目前只有时间线，还没有被写成模型读取的 token sequence。</div>}
      </div>

      <div className={`ch4-feedback ${serialized ? 'is-good' : ''}`} aria-live="polite">
        {serialized
          ? '每个 sampled frame 仍是独立 image unit；帧顺序与 timestamp 被保留，整个视频另有 p_global 描述全局时间尺度。'
          : '先观察时间线，再把每一帧映射为带 timestamp 的独立 visual unit。'}
      </div>

      <div className="ch4-time-roles">
        <div><b>p_global</b><span>整个视频</span><p>时长 · 采样帧数 · 可用时的采样率</p></div>
        <div><b>τ_k</b><span>每个 frame</span><p>这一帧发生在视频的什么时刻</p></div>
      </div>

      <div className="ch4-formula-block">
        <h6>论文怎样表示视频输入？</h6>
        <div className="ch4-formula">{'X_video = [ p_global, [τ₁]: <img> x_v₁ </img>, …, [τ_f]: <img> x_vf </img>, q ]'}</div>
        <FormulaMap items={[
          ['p_global', '整个视频的全局时间提示'],
          ['τ_k', '第 k 个 sampled frame 的 timestamp'],
          ['x_vk', '第 k 帧对应的 visual segment'],
          ['<img> … </img>', '每一帧仍作为独立视觉单元'],
          ['q', '后续问题'],
        ]} />
      </div>
    </section>
  );
}

function UnifiedSummary() {
  const [hasRevealedNext, setHasRevealedNext] = useState(false);

  const revealNext = () => {
    const button = document.querySelector<HTMLButtonElement>('#chap-4 > .chap-loader .chap-loader-btn');
    if (!button) return;
    button.click();
    setHasRevealedNext(true);
    window.setTimeout(() => document.getElementById('chap-5')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  return (
    <section className="ch4-summary" aria-labelledby="ch4-summary-title">
      <h5 id="ch4-summary-title">为什么叫“统一视觉序列化”？</h5>
      <div className="ch4-unified-diagram">
        <div className="ch4-summary-columns">
          <article>
            <h6>单图</h6>
            <div className="ch4-summary-content">
              <VisualSegment id="" count={4} compact />
            </div>
            <small>一个 visual unit</small>
            <span className="ch4-summary-arrow" aria-hidden="true">↓</span>
          </article>
          <article>
            <h6>多图</h6>
            <div className="ch4-summary-content is-multi">
              <VisualSegment id="" count={3} compact />
              <VisualSegment id="" count={4} compact />
            </div>
            <small>多个独立 visual units</small>
            <span className="ch4-summary-arrow" aria-hidden="true">↓</span>
          </article>
          <article>
            <h6>视频</h6>
            <div className="ch4-summary-video">
              <b>p_global</b>
              <span>τ₁: frame₁ · τ₂: frame₂ · …</span>
            </div>
            <small>global prefix + 有序 frame units</small>
            <span className="ch4-summary-arrow" aria-hidden="true">↓</span>
          </article>
        </div>
        <strong>统一视觉序列化 <i aria-hidden="true">→</i> 统一 token sequence <i aria-hidden="true">→</i> unified backbone</strong>
      </div>
      <p className="ch4-unified-boundary">统一的是序列化框架，不是把不同视觉输入的结构差异抹掉。</p>

      <div className="ch4-takeaway">💡 <b>NEO-ov 用同一套序列化框架组织不同视觉输入：</b>单图形成一个 visual unit，多图按照文本顺序形成多个独立 visual units，视频则把带时间信息的 sampled frames 按顺序组织起来。</div>

      {!hasRevealedNext ? (
        <div className="ch4-next-bridge">
          <h5>序列排好了，但模型应该允许哪些 token 互相“看见”？</h5>
          <p>同一张图片内部需要充分理解空间结构，而多图和视频又存在跨单元的顺序关系。只把它们排进一条序列，还不够。</p>
          <button className="chap-loader-btn" type="button" onClick={revealNext}>
            看看序列中的 token 可以怎样互相交互 <span className="chap-loader-arrow">→</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}

export const NeoCh4Main: React.FC<WidgetProps> = () => (
  <div className="ch4-sequence-builder">
    <NeedSerialization />
    <SingleImageSection />
    <MultiImageSection />
    <VideoSection />
    <UnifiedSummary />
  </div>
);

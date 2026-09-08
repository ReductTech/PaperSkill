import type { WidgetProps } from './registry';
import '../styles/transcoder-intro.css';

const FEATURE_STATES = [false, true, false, true, false, true, false];

export function TranscoderIntro(_props: WidgetProps) {
  return (
    <div className="transcoder-intro is-proxy">
      <div className="ti-context-trail" aria-label="从模型回答定位到一层 MLP">
        <div><span>刚才看到</span><strong>模型回答 D / ND</strong></div>
        <b>→</b>
        <div><span>回答来自</span><strong>多层 Transformer</strong></div>
        <b>→</b>
        <div className="is-focus"><span>本文聚焦</span><strong>每一层的 MLP 变换</strong></div>
      </div>

      <div className="ti-toolbar">
        <div>
          <span>Transcoder 是什么？</span>
          <strong>一层 MLP 的透明近似代理：尽量保持输出，同时暴露中间 Feature。</strong>
        </div>
        <b>结构对比</b>
      </div>

      <div className="ti-compare">
        <section className="ti-lane ti-mlp-lane">
          <header>
            <span>原始计算</span>
            <strong>MLP · 中间过程不可读</strong>
          </header>
          <div className="ti-flow">
            <div className="ti-node is-input"><strong>h</strong><span>输入</span></div>
            <i aria-hidden="true">→</i>
            <div className="ti-block is-mlp"><strong>MLP</strong><span>复杂变换</span></div>
            <i aria-hidden="true">→</i>
            <div className="ti-node is-output"><strong>y</strong><span>原输出</span></div>
          </div>
          <p>能看到输入和输出，但无法把中间贡献拆成可追踪的信号。</p>
        </section>

        <div className="ti-relation" aria-hidden="true">
          <span>同一个 h</span>
          <b>≈</b>
          <span>输出近似</span>
        </div>

        <section className="ti-lane ti-proxy-lane is-visible">
          <header>
            <span>分析用代理</span>
            <strong>Transcoder · 中间 Feature 可见</strong>
          </header>
          <div className="ti-proxy-flow">
            <div className="ti-node is-input"><strong>h</strong><span>同一输入</span></div>
            <i aria-hidden="true">→</i>
            <div className="ti-block"><strong>Encoder</strong><span>识别模式</span></div>
            <i aria-hidden="true">→</i>
            <div className="ti-feature-bank" aria-label="稀疏 Feature 结构示意，只有少数单元激活，不表示论文实测强度">
              <span>Sparse Feature</span>
              <small>结构示意</small>
              <div>
                {FEATURE_STATES.map((active, index) => (
                  <i
                    key={index}
                    className={active ? 'is-active' : ''}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
            <i aria-hidden="true">→</i>
            <div className="ti-block"><strong>Decoder</strong><span>重组信号</span></div>
            <i aria-hidden="true">→</i>
            <div className="ti-node is-output"><strong>ŷ</strong><span>代理输出</span></div>
          </div>
          <p>中间只激活少数 Feature，并通过 Decoder 重组为近似输出 ŷ。</p>
        </section>
      </div>

      <div className="ti-feedback is-complete">
        <strong>为什么使用 Transcoder？</strong>
        <span>它近似一层 MLP 的输入输出变换，同时把中间过程拆成可定位、可追踪的 Feature。</span>
      </div>

      <p className="ti-boundary">
        Transcoder 是预先训练好的分析代理，<code>ŷ ≈ y</code>；它不是打开原始 MLP，也不是永久改造模型。
      </p>
    </div>
  );
}

export default TranscoderIntro;

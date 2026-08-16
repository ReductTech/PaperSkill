import { useState } from 'react';
import { isPresentationMode } from '../lib/presentation';
import '../styles/transcoder-map.css';

type ViewState = 'sealed' | 'proxy' | 'feature';

const FEATURE_CHANNELS = [
  { id: 'latent-1', active: false },
  { id: 'latent-2', active: true },
  { id: 'latent-3', active: false },
  { id: 'feature-119106', active: true, target: true },
  { id: 'latent-5', active: false },
  { id: 'latent-6', active: true },
  { id: 'latent-7', active: false },
];

const VIEW_FEEDBACK: Record<ViewState, string> = {
  sealed: '只能观察输入 h 和输出 y；MLP 内部哪条信号路径推动了结果仍然不可见。',
  proxy: '透明代理近似同一层变换，并把中间表示拆成可寻址的稀疏 feature channels。',
  feature:
    'L23 / Feature #119106 出现在 95/100 个 prompt attribution graphs 中，是后续电路分析的稳定候选，但高频本身不等于因果证明。',
};

function Wire({ muted = false }: { muted?: boolean }) {
  return <span className={`tm-wire${muted ? ' is-muted' : ''}`} aria-hidden="true" />;
}

function Endpoint({ symbol, label }: { symbol: string; label: string }) {
  return (
    <div className="tm-endpoint">
      <strong>{symbol}</strong>
      <span>{label}</span>
    </div>
  );
}

function ClosedMlp() {
  return (
    <div className="tm-closed-state">
      <div className="tm-closed-flow" aria-label="输入 h 经过封闭 MLP 得到输出 y">
        <Endpoint symbol="h" label="输入表示" />
        <Wire muted />
        <div className="tm-blackbox">
          <div className="tm-blackbox-topline">
            <span>MLP</span>
            <span className="tm-seal">SEALED</span>
          </div>
          <div className="tm-hidden-path" aria-hidden="true">
            <span>?</span>
            <span>?</span>
            <span>?</span>
          </div>
          <small>内部表示不可观察</small>
        </div>
        <Wire muted />
        <Endpoint symbol="y" label="原始输出" />
      </div>
      <div className="tm-visibility-row" aria-label="黑箱可见性">
        <span className="is-visible">输入可见</span>
        <span className="is-hidden">中间路径未知</span>
        <span className="is-visible">输出可见</span>
      </div>
    </div>
  );
}

function SparseFeatures({ selected, onInspect }: { selected: boolean; onInspect: () => void }) {
  return (
    <div className={`tm-feature-bank${selected ? ' is-selected' : ''}`}>
      <div className="tm-feature-bank-title">
        <strong>Sparse features</strong>
        <span>仅少数通道激活</span>
      </div>
      <div className="tm-channels" role="group" aria-label="稀疏特征通道">
        {FEATURE_CHANNELS.map((channel) =>
          channel.target ? (
            <button
              key={channel.id}
              type="button"
              className={`tm-channel is-on is-target${selected ? ' is-selected' : ''}`}
              aria-label="检查 Layer 23 Feature 119106"
              aria-pressed={selected}
              onClick={onInspect}
            >
              <span className="tm-channel-core" aria-hidden="true" />
              <span className="tm-channel-id">#119106</span>
            </button>
          ) : (
            <span key={channel.id} className={`tm-channel${channel.active ? ' is-on' : ''}`} aria-hidden="true">
              <span className="tm-channel-core" />
            </span>
          )
        )}
      </div>
    </div>
  );
}

function TransparentProxy({ selected, onInspect }: { selected: boolean; onInspect: () => void }) {
  return (
    <div className="tm-proxy-state">
      <div className="tm-reference-rail" aria-label="原始 MLP 参照路径 h 到 MLP 到 y">
        <span className="tm-reference-label">原 MLP 参照</span>
        <code>h</code>
        <span aria-hidden="true">→</span>
        <span className="tm-reference-chip">MLP</span>
        <span aria-hidden="true">→</span>
        <code>y</code>
      </div>

      <div className="tm-proxy-flow" aria-label="h 经过编码器、稀疏特征通道和解码器得到 y hat">
        <Endpoint symbol="h" label="同一输入" />
        <Wire />
        <div className="tm-process-block">
          <span className="tm-block-index">01</span>
          <strong>Encoder</strong>
          <small>检测哪些模式存在</small>
        </div>
        <Wire />
        <SparseFeatures selected={selected} onInspect={onInspect} />
        <Wire />
        <div className="tm-process-block">
          <span className="tm-block-index">02</span>
          <strong>Decoder</strong>
          <small>重组已激活特征</small>
        </div>
        <Wire />
        <Endpoint symbol="ŷ" label="代理输出" />
      </div>

      <div className="tm-output-match">
        <span>功能参照</span>
        <strong aria-label="y hat approximately equals y">ŷ ≈ y</strong>
        <span>代理输出近似原 MLP 输出</span>
      </div>
    </div>
  );
}

function FeatureInspector({ view, onInspect }: { view: ViewState; onInspect: () => void }) {
  const unlocked = view !== 'sealed';
  const selected = view === 'feature';

  return (
    <aside className={`tm-inspector${unlocked ? ' is-unlocked' : ''}${selected ? ' is-complete' : ''}`}>
      <div className="tm-inspector-head">
        <div>
          <span className="tm-kicker">FIXED FEATURE</span>
          <h5>Feature 检查器</h5>
        </div>
        <span className="tm-inspector-status">{selected ? 'READ' : unlocked ? 'READY' : 'LOCKED'}</span>
      </div>

      {!unlocked ? (
        <div className="tm-inspector-locked">
          <div className="tm-lock-symbol" aria-hidden="true">
            <span />
          </div>
          <strong>没有可寻址的中间单元</strong>
          <p>封闭 MLP 只暴露输入与输出，检查器无法定位层内 feature。</p>
        </div>
      ) : (
        <>
          <dl className="tm-feature-fields">
            <div>
              <dt>位置</dt>
              <dd>Layer 23</dd>
            </div>
            <div>
              <dt>固定编号</dt>
              <dd>Feature #119106</dd>
            </div>
            <div className="tm-field-wide">
              <dt>Explanation label</dt>
              <dd>{selected ? 'Obscuring information' : '待读取'}</dd>
            </div>
          </dl>

          <div className={`tm-occurrence${selected ? ' is-visible' : ''}`}>
            <div className="tm-occurrence-head">
              <span>跨 prompt 归因图出现</span>
              <strong>{selected ? '95 / 100' : '-- / 100'}</strong>
            </div>
            <div className="tm-meter" aria-label={selected ? '95 of 100' : '尚未读取'}>
              <span />
            </div>
          </div>

          <button type="button" className="tm-inspect-button" onClick={onInspect} disabled={selected}>
            {selected ? 'Feature #119106 已读取' : '读取 Feature #119106'}
          </button>

          <div className={`tm-label-note${selected ? ' is-visible' : ''}`}>
            <strong>解释标签 ≠ token</strong>
            <p>“Obscuring information”是对该稀疏特征的可读语义解释，不是输入中的单词或 token。</p>
          </div>
        </>
      )}
    </aside>
  );
}

export function TranscoderMap() {
  const [view, setView] = useState<ViewState>(() =>
    isPresentationMode() ? 'proxy' : 'sealed'
  );
  const proxyVisible = view !== 'sealed';
  const featureSelected = view === 'feature';

  const inspectFeature = () => setView('feature');

  return (
    <div className={`tm-root is-${view}`} data-transcoder-state={view}>
      <div className="tm-toolbar">
        <div>
          <span className="tm-kicker">OBSERVATION MODE</span>
          <strong>同一层，两种可见性</strong>
        </div>
        <div className="tm-mode-switch" role="group" aria-label="切换 MLP 观察方式">
          <button
            type="button"
            className={!proxyVisible ? 'is-active' : ''}
            aria-pressed={!proxyVisible}
            onClick={() => setView('sealed')}
          >
            <span className="tm-mode-mark is-sealed" aria-hidden="true" />
            封闭 MLP
          </button>
          <button
            type="button"
            className={proxyVisible ? 'is-active' : ''}
            aria-pressed={proxyVisible}
            onClick={() => setView('proxy')}
          >
            <span className="tm-mode-mark is-proxy" aria-hidden="true" />
            透明 Transcoder
          </button>
        </div>
      </div>

      <div className="tm-workspace">
        <section className="tm-board" aria-live="polite">
          <div className="tm-board-head">
            <div>
              <span>Layer 23 · 输入保持为 h</span>
              <h5>{proxyVisible ? '透明代理电路' : '原始 MLP 黑箱'}</h5>
            </div>
            <span className="tm-board-status">{featureSelected ? 'FEATURE LOCATED' : proxyVisible ? 'PROXY ONLINE' : 'PATH HIDDEN'}</span>
          </div>
          {proxyVisible ? (
            <TransparentProxy selected={featureSelected} onInspect={inspectFeature} />
          ) : (
            <ClosedMlp />
          )}
        </section>

        <FeatureInspector view={view} onInspect={inspectFeature} />
      </div>

      <div className={`tm-feedback${featureSelected ? ' is-complete' : ''}`} role="status" aria-live="polite">
        <span>当前判断</span>
        <p>{VIEW_FEEDBACK[view]}</p>
      </div>

      <p className="tm-boundary">
        <strong>边界：</strong>Transcoder 是分析用代理，不是把被研究模型改造成了新架构；这里的 <code>ŷ ≈ y</code>
        表示功能近似，不是严格相等。
      </p>
    </div>
  );
}

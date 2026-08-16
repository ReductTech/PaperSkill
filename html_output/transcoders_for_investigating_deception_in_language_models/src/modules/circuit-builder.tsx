import { useState } from 'react';
import type { WidgetProps } from './registry';
import '../styles/circuit-builder.css';

export function CircuitBuilder(_props: WidgetProps) {
  const [edgeCount, setEdgeCount] = useState(24);
  const retained = edgeCount >= 30;

  return (
    <div className={'circuit-builder' + (retained ? ' is-retained' : ' is-removed')}>
      <div className="cb-input-band">
        <div><span>分析对象已经确定</span><strong>Top-10 Feature</strong></div>
        <div className="cb-top-nodes" aria-label="十个高频Feature">
          {Array.from({ length: 10 }, (_, index) => <i key={index}>{index + 1}</i>)}
        </div>
        <p>现在逐条统计它们之间的有向边，在 100 张归因图中重复出现了多少次。</p>
      </div>

      <div className="cb-workbench">
        <section className="cb-evidence-panel">
          <header>
            <div><span>检查一条有向边</span><strong>Feature i → Feature j</strong></div>
            <b>{edgeCount}<small>/100</small></b>
          </header>
          <div className="cb-prompt-grid" aria-label={`100张归因图中有${edgeCount}张包含这条边`}>
            {Array.from({ length: 100 }, (_, index) => (
              <i className={index < edgeCount ? 'is-present' : ''} key={index} aria-hidden="true" />
            ))}
          </div>
          <label htmlFor="cb-edge-count">
            <span>拖动这条边的跨 Prompt 出现次数</span>
            <output htmlFor="cb-edge-count">{edgeCount} 次</output>
          </label>
          <input
            id="cb-edge-count"
            type="range"
            min="0"
            max="100"
            step="1"
            value={edgeCount}
            onChange={(event) => setEdgeCount(Number(event.target.value))}
          />
          <div className="cb-scale"><span>0</span><b>约 30 次阈值</b><span>100</span></div>
        </section>

        <div className="cb-decision-arrow" aria-hidden="true">→</div>

        <section className="cb-circuit-panel" aria-live="polite">
          <header><span>汇总电路</span><strong>{retained ? '这条边被保留' : '这条边被移除'}</strong></header>
          <svg className="cb-circuit-graph" viewBox="0 0 420 220" role="img" aria-label={retained ? '这条边进入汇总电路' : '这条边没有进入汇总电路'}>
            <line className="cb-background-edge" x1="70" y1="60" x2="205" y2="165" />
            <line className="cb-background-edge" x1="205" y1="165" x2="350" y2="145" />
            <line className="cb-background-edge" x1="205" y1="55" x2="350" y2="145" />
            <line className="cb-tested-edge" x1="70" y1="145" x2="350" y2="60" />
            <circle cx="70" cy="60" r="23" /><circle cx="70" cy="145" r="26" className="is-source" />
            <circle cx="205" cy="55" r="23" /><circle cx="205" cy="165" r="23" />
            <circle cx="350" cy="60" r="26" className="is-target" /><circle cx="350" cy="145" r="23" />
            <text x="70" y="65">1</text><text x="70" y="151">i</text>
            <text x="205" y="60">4</text><text x="205" y="170">7</text>
            <text x="350" y="66">j</text><text x="350" y="150">9</text>
          </svg>
          <div className="cb-decision">
            <span>{edgeCount}/100 {retained ? '达到' : '未达到'}约 30% 阈值</span>
            <strong>{retained ? '保留连接，加入电路' : '移除连接，不进入电路'}</strong>
          </div>
        </section>
      </div>

      <div className="cb-conclusion">
        <span>构建结果</span>
        <strong>对 Top-10 之间的每条边重复这一统计，反复出现的连接共同组成 Feature 电路。</strong>
      </div>

      <div className="cb-why-circuit" aria-live="polite">
        <section className="cb-isolated-view">
          <div className="cb-why-copy">
            <span>只有 Top-10 清单</span>
            <strong>知道哪些 Feature 经常出现</strong>
          </div>
          <div className="cb-isolated-cloud" aria-label="十个彼此孤立的Feature">
            {Array.from({ length: 10 }, (_, index) => <i key={index}>{index + 1}</i>)}
          </div>
          <p>节点彼此孤立，看不出信号之间的依赖关系。</p>
        </section>

        <div className="cb-why-divider" aria-hidden="true">
          <span>边提供了新信息</span>
          <i />
        </div>

        <section className="cb-connected-view">
          <svg viewBox="0 0 420 120" role="img" aria-label={retained ? '重复连接进入电路，网络结构变得可分析' : '当前测试连接未进入电路'}>
            <line x1="46" y1="32" x2="155" y2="88" />
            <line x1="155" y1="88" x2="270" y2="74" />
            <line x1="270" y1="74" x2="372" y2="34" />
            <line x1="155" y1="88" x2="265" y2="24" />
            <line className="is-tested" x1="46" y1="88" x2="265" y2="24" />
            <circle cx="46" cy="32" r="18" />
            <circle className="is-source" cx="46" cy="88" r="20" />
            <circle cx="155" cy="88" r="18" />
            <circle className="is-target" cx="265" cy="24" r="20" />
            <circle cx="270" cy="74" r="18" />
            <circle cx="372" cy="34" r="18" />
          </svg>
          <div className="cb-why-copy">
            <span>加入跨 Prompt 重复边</span>
            <strong>{retained ? '连接结构开始显露电路中的枢纽' : '未稳定复现的边不会进入电路'}</strong>
          </div>
          <p>
            {retained
              ? '统计每个节点连向多少其他节点，就能继续寻找核心 Feature。'
              : '拖过约 30 次阈值后，这条边会成为可分析电路的一部分。'}
          </p>
        </section>
      </div>
    </div>
  );
}

export default CircuitBuilder;

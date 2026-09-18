import { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const TOKENS = ['语', '言', '表', '示', '迁', '移'];
const MASKED = new Set([1, 4]);

function Matrix({
  kind,
  query,
  unlocked,
  onSelect,
}: {
  kind: 'causal' | 'bidir';
  query: number;
  unlocked: boolean;
  onSelect: (index: number) => void;
}) {
  const n = TOKENS.length;
  const isBidir = kind === 'bidir' && unlocked;
  return (
    <section className={`mask-panel ${isBidir ? 'is-bidir' : ''}`}>
      <div className="mask-panel-head">
        <b>{kind === 'causal' ? 'AR · Causal Mask' : 'DLM · Bidirectional Mask'}</b>
        <span>{kind === 'causal' ? '只允许 j ≤ i' : unlocked ? '所有非 padding 位置互通' : '等待切换'}</span>
      </div>
      <div className="mask-grid" style={{ gridTemplateColumns: `repeat(${n + 1}, minmax(24px, 1fr))` }}>
        <span className="mask-corner">q\k</span>
        {TOKENS.map((token, index) => <span key={`h-${index}`} className={index === query ? 'query-head' : ''}>{token}</span>)}
        {TOKENS.flatMap((rowToken, row) => [
          <button
            type="button"
            key={`r-${row}`}
            className={`mask-row-label ${row === query ? 'selected' : ''}`}
            onClick={() => onSelect(row)}
            aria-label={`选择查询词元 ${rowToken}`}
          >{rowToken}</button>,
          ...TOKENS.map((keyToken, col) => {
            const allowed = kind === 'causal' ? col <= row : unlocked || col <= row;
            const pending = kind === 'bidir' && !unlocked && col > row;
            return (
              <button
                type="button"
                key={`${row}-${col}`}
                className={`mask-cell ${allowed ? 'allowed' : 'blocked'} ${pending ? 'pending' : ''} ${row === query ? 'active-row' : ''} ${row === query && allowed ? 'visible-key' : ''}`}
                aria-label={`${rowToken} ${allowed ? '可以' : '不可以'}读取 ${keyToken}`}
                onClick={() => onSelect(row)}
              >{allowed ? '●' : '×'}</button>
            );
          }),
        ])}
      </div>
    </section>
  );
}

export const AttentionMaskLab: React.FC<WidgetProps> = () => {
  const [query, setQuery] = useState(3);
  const [unlocked, setUnlocked] = useState(true);
  const [showMasked, setShowMasked] = useState(true);
  const causalVisible = useMemo(() => TOKENS.slice(0, query + 1), [query]);
  return (
    <div className="mask-lab">
      <div className="mask-token-picker" aria-label="选择查询词元">
        <span>点击一个 query token</span>
        <div className="chip-row">
          {TOKENS.map((token, index) => (
            <button type="button" key={token} className={`chip ${query === index ? 'selected' : ''}`} onClick={() => setQuery(index)}>
              {index + 1} · {token}
            </button>
          ))}
        </div>
      </div>
      <div className="mask-input-row">
        <b>DLM 输入：</b>
        {TOKENS.map((token, index) => <span key={token} className={showMasked && MASKED.has(index) ? 'masked' : ''}>{showMasked && MASKED.has(index) ? '<M>' : token}</span>)}
        <button type="button" className="tiny ghost" onClick={() => setShowMasked((value) => !value)}>{showMasked ? '显示干净输入' : '加入 token mask'}</button>
      </div>
      <div className="mask-panels">
        <Matrix kind="causal" query={query} unlocked onSelect={setQuery} />
        <Matrix kind="bidir" query={query} unlocked={unlocked} onSelect={setQuery} />
      </div>
      <div className="mask-actions">
        <button type="button" className="tiny" onClick={() => setUnlocked((value) => !value)}>
          {unlocked ? '收回上三角连接' : '执行 mask switch'}
        </button>
        <span><i className="legend-dot allowed" />允许信息流</span>
        <span><i className="legend-dot blocked" />被掩码阻断</span>
      </div>
      <div className={`feedback ${unlocked ? 'good' : ''}`}>
        位置 {query + 1}「{TOKENS[query]}」：AR 可读取「{causalVisible.join('、')}」；DLM {unlocked ? `可读取全部 ${TOKENS.length} 个位置` : '尚未切换，仍遵循因果可见性'}。矩阵展示的是允许连接，不是模型学到的 attention score。
      </div>
    </div>
  );
};

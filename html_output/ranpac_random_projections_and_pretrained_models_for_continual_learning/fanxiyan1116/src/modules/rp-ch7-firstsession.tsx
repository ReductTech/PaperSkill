import React, { useState } from 'react';

type Mode = 'none' | 'adapter' | 'adapter-prompt';

const modeLabels: Record<Mode, string> = {
  none: '无 PETL',
  adapter: '仅适配器',
  'adapter-prompt': '适配器 + 提示',
};

export function RpCh7Firstsession() {
  const [mode, setMode] = useState<Mode>('adapter');
  const [locked, setLocked] = useState(false);
  const petlParts = mode === 'none' ? [] : mode === 'adapter' ? ['适配器'] : ['适配器', '提示'];

  const lock = () => setLocked(true);

  return (
    <div className="rp-widget rp-firstsession-widget">
      <div className="rp-firstsession-top">
        <div className="rp-task-badge">
          <span>首任务</span>
          <strong>Task 1</strong>
        </div>
        <div className="rp-mode-selector" role="radiogroup" aria-label="首任务 PETL 配置">
          {(Object.keys(modeLabels) as Mode[]).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              className={mode === option ? 'is-active' : ''}
              disabled={locked}
              onClick={() => setMode(option)}
            >
              {modeLabels[option]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`rp-lock-button ${locked ? 'is-locked' : ''}`}
          aria-pressed={locked}
          onClick={lock}
          disabled={locked}
        >
          {locked ? '首任务设置已锁定' : '锁定首任务设置'}
        </button>
      </div>

      <div className="rp-fixture">
        <section className="rp-fixture-part is-frozen">
          <span>预训练主干</span>
          <strong>冻结</strong>
          <div className="rp-lock-glyph" aria-hidden="true">▣</div>
        </section>
        <i className="rp-fixture-path" aria-hidden="true" />
        <section className="rp-fixture-part is-frozen">
          <span>固定随机板</span>
          <strong>冻结</strong>
          <div className="rp-lock-glyph" aria-hidden="true">▣</div>
        </section>
        <i className="rp-fixture-path" aria-hidden="true" />
        <section className={`rp-fixture-part is-petl ${petlParts.length ? 'is-on' : 'is-off'}`}>
          <span>{petlParts.length ? petlParts.join(' + ') : '可选 PETL 未启用'}</span>
          <strong>{locked ? '配置固定' : '仅任务一'}</strong>
        </section>
        <i className="rp-fixture-path" aria-hidden="true" />
        <section className={`rp-temporary-head ${locked ? 'is-discarded' : ''}`}>
          <span>临时线性分类头</span>
          <strong>{locked ? '已丢弃' : '仅服务任务一'}</strong>
          {locked && <b aria-label="已丢弃临时头">已丢弃临时头</b>}
        </section>
      </div>

      <div className="rp-firstsession-lower">
        <section className="rp-panel rp-flow-panel">
          <div className="rp-panel-heading">
            <span>首任务阶段</span>
            <strong>一次可选 SGD</strong>
          </div>
          <div className="rp-flow-steps">
            <span className="is-petl">适配 {petlParts.length ? petlParts.join(' + ') : '关闭'}</span>
            <i aria-hidden="true">→</i>
            <span className="is-temp">训练临时头</span>
            <i aria-hidden="true">→</i>
            <span className={locked ? 'is-discard' : ''}>{locked ? '丢弃临时头' : '等待锁定'}</span>
            <i aria-hidden="true">→</i>
            <span className="is-frozen">进入 Phase 2</span>
          </div>
        </section>
        <section className="rp-panel rp-entry-panel">
          <span className="rp-kicker">进入后续任务的入口</span>
          <strong>{locked ? '适配后的冻结特征' : '尚未锁定'}</strong>
          <p>{locked ? '后续只累计 G 与 C；Phase 2 不执行 SGD。' : '锁定后会丢弃临时头，只保留特征入口。'}</p>
        </section>
      </div>
      <div className="rp-feedback">
        <strong>{`${modeLabels[mode]} · ${locked ? '已进入冻结入口' : '首任务配置中'}`}</strong>
        <span>
          PETL 是可选项，只在 Task 1 发生；临时头在 Phase 2 前丢弃。它不保证每种主干或数据都提升。
        </span>
      </div>
    </div>
  );
}

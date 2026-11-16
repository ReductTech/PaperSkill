import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

interface ResultRow {
  id: string;
  dataset: string;
  full: number;
  noRp: number;
  ncm: number;
  note?: string;
}

const results: Record<'cil' | 'dil', ResultRow[]> = {
  cil: [
    { id: 'cifar100', dataset: 'CIFAR100', full: 92.2, noRp: 90.6, ncm: 83.4 },
    { id: 'imagenet-r', dataset: 'ImageNet-R', full: 77.9, noRp: 73.9, ncm: 61.2 },
    { id: 'imagenet-a', dataset: 'ImageNet-A', full: 62.4, noRp: 57.7, ncm: 49.3 },
    { id: 'cub', dataset: 'CUB', full: 90.3, noRp: 86.6, ncm: 85.1 },
    { id: 'omnibenchmark', dataset: 'OmniBenchmark', full: 79.9, noRp: 74.3, ncm: 73.1 },
    { id: 'vtab', dataset: 'VTAB', full: 92.2, noRp: 90.0, ncm: 88.4 },
    { id: 'cars', dataset: 'Cars', full: 77.5, noRp: 73.0, ncm: 37.7 },
  ],
  dil: [
    { id: 'core50', dataset: 'CORe50', full: 96.7, noRp: 94.8, ncm: 80.4 },
    { id: 'cddb-hard', dataset: 'CDDB-Hard', full: 86.2, noRp: 84.2, ncm: 69.8, note: 'M=5K' },
    { id: 'domainnet', dataset: 'DomainNet', full: 66.6, noRp: 55.2, ncm: 46.4 },
  ],
};

export function RpCh10Results() {
  const [protocol, setProtocol] = useState<'cil' | 'dil'>('cil');
  const [selectedId, setSelectedId] = useState('cifar100');
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const rows = results[protocol];
  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0],
    [rows, selectedId],
  );

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const stop = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  };

  const start = () => {
    stop();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    const startedAt = performance.now();
    const duration = 1650;
    const tick = (now: number) => {
      const next = Math.min(1, (now - startedAt) / duration);
      setProgress(next);
      if (next < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };
    setProgress(0);
    frameRef.current = requestAnimationFrame(tick);
  };

  const chooseProtocol = (next: 'cil' | 'dil') => {
    stop();
    setProtocol(next);
    setSelectedId(results[next][0].id);
    setProgress(0);
  };

  return (
    <div className="rp-widget rp-results-widget">
      <div className="rp-results-toolbar">
        <div className="rp-segmented" role="group" aria-label="选择持续学习协议">
          <button
            type="button"
            className={protocol === 'cil' ? 'is-active' : ''}
            aria-pressed={protocol === 'cil'}
            onClick={() => chooseProtocol('cil')}
          >
            CIL · 类增量
          </button>
          <button
            type="button"
            className={protocol === 'dil' ? 'is-active' : ''}
            aria-pressed={protocol === 'dil'}
            onClick={() => chooseProtocol('dil')}
          >
            DIL · 域增量
          </button>
        </div>
        <button type="button" className="rp-start-button" onClick={start}>
          开始核对
        </button>
        <div className="rp-result-legend" aria-label="柱色图例">
          <span className="is-full">完整 RanPAC</span>
          <span className="is-no-rp">无 RP</span>
          <span className="is-ncm">仅 NCM</span>
        </div>
      </div>

      <div className="rp-results-layout">
        <section className="rp-panel rp-results-chart" aria-label="最终平均准确率核对图">
          <div className="rp-result-axis">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span>
          </div>
          <div className="rp-result-rows">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`rp-result-row ${selected.id === row.id ? 'is-selected' : ''}`}
                aria-pressed={selected.id === row.id}
                onClick={() => setSelectedId(row.id)}
              >
                <span className="rp-result-name">
                  {row.dataset}
                  {row.note && <small>{row.note}</small>}
                </span>
                <span className="rp-result-bars">
                  <i className="is-full"><b style={{ width: `${row.full * progress}%` }} /></i>
                  <i className="is-no-rp"><b style={{ width: `${row.noRp * progress}%` }} /></i>
                  <i className="is-ncm"><b style={{ width: `${row.ncm * progress}%` }} /></i>
                </span>
              </button>
            ))}
          </div>
          <div className="rp-results-axis-title">
            最终平均准确率（%）↑ · 零基线 · 精确报告值
          </div>
        </section>

        <aside className="rp-panel rp-result-inspector" aria-live="polite">
          <div className="rp-inspector-kicker">
            {protocol === 'cil' ? 'Table 1 · CIL' : 'Table 3 · DIL'}
            {selected.note ? ` · ${selected.note}` : ''}
          </div>
          <h3>{selected.dataset}</h3>
          <div className="rp-exact-values">
            <span className="is-full"><b>完整 RanPAC</b><strong>{selected.full.toFixed(1)}</strong></span>
            <span className="is-no-rp"><b>无 RP</b><strong>{selected.noRp.toFixed(1)}</strong></span>
            <span className="is-ncm"><b>仅 NCM</b><strong>{selected.ncm.toFixed(1)}</strong></span>
          </div>
          <p>
            <SymbolHint meaning="各任务最终准确率的平均值，表中单位均为百分比，越高越好">
              最终平均准确率
            </SymbolHint>
            ；柱长按 0-100% 映射，不使用训练集探针数值。
          </p>
          <div className="rp-result-gain">
            <span>完整方法相对仅 NCM</span>
            <strong>{`+${(selected.full - selected.ncm).toFixed(1)}`}</strong>
          </div>
        </aside>
      </div>

      <div className="rp-results-footer">
        <div className={`rp-feedback ${protocol === 'cil' ? 'is-green' : 'is-green'}`}>
          <strong>{protocol === 'cil' ? 'CIL 结果' : 'DIL 结果'}</strong>
          <span>
            {protocol === 'cil'
              ? '完整 RanPAC 在全部 CIL 报告行均高于无 RP 与仅 NCM。'
              : '域增量协议下，RP 与 Gram 校准仍带来报告增益。'}
          </span>
        </div>
        <div className="rp-boundary-feedback is-orange">
          <strong>适用边界</strong>
          <span>依赖 ImageNet 预训练 ViT；从零训练不适用。</span>
        </div>
      </div>
    </div>
  );
}

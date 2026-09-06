import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Row = {
  id: string;
  label: string;
  shortLabel: string;
  protocol: string;
  metric: string;
  mage: number;
  base: number;
  mageTime: number;
  baseTime: number;
};

const ROWS: Row[] = [
  { id: 'nextqa', label: 'NExT-QA', shortLabel: 'NExT-QA', protocol: 'tc8', metric: 'Accuracy', mage: 80.8, base: 79.8, mageTime: 415, baseTime: 1460 },
  { id: 'videomme', label: 'VideoMME', shortLabel: 'VideoMME', protocol: 'tc32', metric: 'Score', mage: 64.0, base: 59.7, mageTime: 534, baseTime: 463 },
  { id: 'mlvu', label: 'MLVU-dev', shortLabel: 'MLVU', protocol: 'tc32', metric: 'Score', mage: 68.7, base: 61.5, mageTime: 361, baseTime: 786 },
  { id: 'anet', label: 'TimeLens-ActivityNet', shortLabel: 'TimeLens-A', protocol: 'tc32', metric: 'Score', mage: 45.4, base: 28.4, mageTime: 785, baseTime: 766 },
  { id: 'qv', label: 'TimeLens-QVHighlight', shortLabel: 'TimeLens-QV', protocol: 'tc32', metric: 'Score', mage: 57.4, base: 34.9, mageTime: 421, baseTime: 402 },
  { id: 'temp', label: 'TempCompass', shortLabel: 'TempCompass', protocol: 'tc32', metric: 'Score', mage: 62.3, base: 72.7, mageTime: 729, baseTime: 433 },
  { id: 'charades', label: 'Charades', shortLabel: 'Charades', protocol: 'tc32', metric: 'Score', mage: 31.4, base: 45.9, mageTime: 729, baseTime: 707 },
];

function signed(value: number, unit = '') {
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return (value > 0 ? '+' : '') + rounded + unit;
}

export const VerifiedResultRace: React.FC<WidgetProps> = () => {
  const [id, setId] = useState('nextqa');
  const row = ROWS.find((candidate) => candidate.id === id)!;
  const scoreDelta = row.mage - row.base;
  const timeSaved = row.baseTime - row.mageTime;
  const scoreWin = scoreDelta > 0;
  const timeWin = timeSaved > 0;

  const verdict = scoreWin && timeWin
    ? { label: '又准又快', detail: '分数高 ' + scoreDelta.toFixed(1) + ' 点，同时少用 ' + timeSaved.toFixed(0) + ' 秒。', tone: 'good' }
    : scoreWin
      ? { label: '更准，但更慢', detail: '分数高 ' + scoreDelta.toFixed(1) + ' 点，但多用 ' + Math.abs(timeSaved).toFixed(0) + ' 秒。', tone: 'mixed' }
      : { label: '该任务未领先', detail: '分数低 ' + Math.abs(scoreDelta).toFixed(1) + ' 点，且多用 ' + Math.abs(timeSaved).toFixed(0) + ' 秒。', tone: 'bad' };

  return (
    <div className="mvl-widget mvl-result-review">
      <div className="mvl-result-reading-order" aria-label="结果阅读顺序">
        <span><i>1</i>先看分数</span>
        <b aria-hidden="true">→</b>
        <span><i>2</i>再看时间</span>
        <b aria-hidden="true">→</b>
        <span><i>3</i>最后合并判断</span>
      </div>

      <div className="mvl-result-task-tabs" role="tablist" aria-label="选择评测任务">
        {ROWS.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={candidate.id === id}
            className={candidate.id === id ? 'active' : ''}
            onClick={() => setId(candidate.id)}
          >
            <span>{candidate.shortLabel}</span>
            <small>{candidate.protocol}</small>
          </button>
        ))}
      </div>

      <section className="mvl-result-case" aria-live="polite">
        <header className="mvl-result-case-head">
          <div>
            <span>当前案例</span>
            <h4>{row.label} · {row.protocol}</h4>
          </div>
          <strong className={'mvl-result-verdict ' + verdict.tone}>{verdict.label}</strong>
        </header>

        <div className="mvl-result-evidence">
          <article className={'mvl-result-metric ' + (scoreWin ? 'good' : 'bad')}>
            <div className="mvl-result-metric-head">
              <span>① {row.metric} ↑</span>
              <strong>{scoreWin ? 'Mage-VL 更高' : 'Mage-VL 更低'}</strong>
            </div>
            <div className="mvl-result-values">
              <div><span>Mage-VL</span><b>{row.mage.toFixed(1)}</b></div>
              <div><span>Qwen3-VL</span><b>{row.base.toFixed(1)}</b></div>
            </div>
            <p>分数差：<b>{signed(scoreDelta)} 点</b></p>
          </article>

          <article className={'mvl-result-metric ' + (timeWin ? 'good' : 'bad')}>
            <div className="mvl-result-metric-head">
              <span>② Wall-clock ↓</span>
              <strong>{timeWin ? 'Mage-VL 更快' : 'Mage-VL 更慢'}</strong>
            </div>
            <div className="mvl-result-values">
              <div><span>Mage-VL</span><b>{row.mageTime}s</b></div>
              <div><span>Qwen3-VL</span><b>{row.baseTime}s</b></div>
            </div>
            <p>节省时间：<b>{signed(timeSaved, 's')}</b></p>
          </article>
        </div>

        <div className={'mvl-result-conclusion ' + verdict.tone}>
          <span>③ 合并判断</span>
          <p><b>{verdict.label}：</b>{verdict.detail}</p>
        </div>
      </section>

      <p className="mvl-timing-note">
        表 5 的计时口径：Mage-VL 为完整实测 wall-clock；Qwen3-VL 不含估算的视频加载时间。设备为单个 8×B200 节点。
      </p>
    </div>
  );
};

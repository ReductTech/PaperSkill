import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

type Protocol = 'subject' | 'trial';
type Split = 'train' | 'validation' | 'test';

const SUBJECTS = Array.from({ length: 10 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`);

const SPLIT_STYLE: Record<Split, { fill: string; stroke: string; label: string }> = {
  train: { fill: '#dcecf6', stroke: '#79a4c0', label: '训练' },
  validation: { fill: '#e4f1ed', stroke: '#72a995', label: '验证' },
  test: { fill: '#fff0d8', stroke: '#d6a453', label: '测试' },
};

const RESULTS: Record<Protocol, Array<{ model: string; value: number; color: string }>> = {
  subject: [
    { model: 'BrainOmni', value: 51.6, color: '#245d87' },
    { model: 'CBraMod', value: 38.4, color: '#6756a3' },
    { model: 'REVE', value: 39.9, color: '#168d97' },
  ],
  trial: [
    { model: 'BrainOmni', value: 52.5, color: '#245d87' },
    { model: 'CBraMod', value: 80.4, color: '#6756a3' },
    { model: 'REVE', value: 61.6, color: '#168d97' },
  ],
};

function splitFor(protocol: Protocol, subjectIndex: number, trialIndex: number): Split {
  if (protocol === 'subject') {
    if (subjectIndex < 8) return 'train';
    return subjectIndex === 8 ? 'validation' : 'test';
  }
  if (trialIndex < 8) return 'train';
  return trialIndex === 8 ? 'validation' : 'test';
}

export const OmniLab7: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const [protocol, setProtocol] = useState<Protocol>('subject');
  const width = mobile ? 360 : 920;
  const height = mobile ? 760 : 430;
  const results = RESULTS[protocol];
  const winner = results.reduce((best, item) => item.value > best.value ? item : best);
  const sharedIdentities = protocol === 'subject' ? 0 : 10;

  const renderLegend = (x: number, y: number, gap: number) => (
    <g>
      {(Object.keys(SPLIT_STYLE) as Split[]).map((split, index) => {
        const style = SPLIT_STYLE[split];
        const itemX = x + index * gap;
        return (
          <g key={split} transform={`translate(${itemX},${y})`}>
            <rect width="13" height="9" rx="2" fill={style.fill} stroke={style.stroke} />
            <text x="18" y="8" className="oi-mini">{style.label}</text>
          </g>
        );
      })}
    </g>
  );

  const renderRows = (x: number, y: number, tileWidth: number, tileGap: number, rowGap: number) => (
    <g>
      {SUBJECTS.map((subject, subjectIndex) => {
        const rowY = y + subjectIndex * rowGap;
        return (
          <g key={subject}>
            <circle cx={x} cy={rowY + 6} r="5" fill="#52677e" opacity={0.38 + subjectIndex * 0.045} />
            <text x={x + 11} y={rowY + 9} className="oi-mini">{subject}</text>
            {Array.from({ length: 10 }, (_, trialIndex) => {
              const split = splitFor(protocol, subjectIndex, trialIndex);
              const style = SPLIT_STYLE[split];
              return (
                <rect
                  key={trialIndex}
                  x={x + 48 + trialIndex * (tileWidth + tileGap)}
                  y={rowY}
                  width={tileWidth}
                  height="12"
                  rx="2"
                  fill={style.fill}
                  stroke={style.stroke}
                  style={{ transition: 'fill 220ms ease, stroke 220ms ease' }}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );

  const renderBars = (x: number, y: number, barWidth: number, rowGap: number) => (
    <g key={protocol} className="oi-reveal">
      {results.map((item, index) => {
        const rowY = y + index * rowGap;
        const isWinner = item.model === winner.model;
        return (
          <g key={item.model}>
            <text x={x} y={rowY} className="oi-label">{item.model}</text>
            {isWinner && (
              <g transform={`translate(${x + barWidth - 43},${rowY - 13})`}>
                <rect width="43" height="16" rx="3" fill="#e8f3ee" stroke="#88b5a2" />
                <text x="21.5" y="11.5" textAnchor="middle" fill="#27815f" fontSize="7" fontWeight="900">本任务第 1</text>
              </g>
            )}
            <rect x={x} y={rowY + 10} width={barWidth} height="13" rx="3" fill="#e8edf1" />
            <rect x={x} y={rowY + 10} width={barWidth * item.value / 100} height="13" rx="3" fill={item.color} opacity=".88" />
            <text x={x + barWidth - 4} y={rowY + 21} textAnchor="end" fill="#344a62" fontSize="8" fontWeight="900">
              {item.value.toFixed(1)}%
            </text>
          </g>
        );
      })}
    </g>
  );

  return (
    <div className="oi-unit" ref={ref}>
      <div className="ob-state-control" role="group" aria-label="选择论文评测协议">
        <button type="button" className={protocol === 'subject' ? 'active' : ''} aria-pressed={protocol === 'subject'} onClick={() => setProtocol('subject')}>
          受试者级 · 主榜
        </button>
        <button type="button" className={protocol === 'trial' ? 'active' : ''} aria-pressed={protocol === 'trial'} onClick={() => setProtocol('trial')}>
          试次级 · 多受试者适应
        </button>
      </div>
      <div className="oi-caption">
        <span>同一批数据采用 8:1:1，切分单位决定模型最终面对谁</span>
        <strong>跨集合身份：{sharedIdentities} / 10</strong>
      </div>
      <svg className="oi-stage is-static" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="切换受试者级与试次级协议，查看数据分配、测试对象以及论文实测分数和排名的变化">
        <rect x=".5" y=".5" width={width - 1} height={height - 1} rx="6" fill="#f7f9fb" stroke="#d6e0e8" />
        {mobile ? (
          <>
            <g transform="translate(16,22)">
              <rect width="328" height="397" rx="5" fill="#fff" stroke="#cbd7e1" />
              <text x="14" y="25" className="oi-label">① 数据怎样进入三个集合</text>
              <text x="314" y="25" textAnchor="end" className="oi-note">每格代表一次试次</text>
              {renderLegend(16, 46, 84)}
              {renderRows(18, 78, 22, 2, 26)}
              <rect x="14" y="351" width="300" height="32" rx="4" fill={protocol === 'subject' ? '#eef5f9' : '#f1f0f8'} />
              <text x="26" y="371" fill="#344a62" fontSize="9" fontWeight="800">
                {protocol === 'subject' ? 'P01-P08 训练 · P09 验证 · P10 测试' : '每位受试者内部：8 次训练 · 1 次验证 · 1 次测试'}
              </text>
            </g>
            <g transform="translate(16,439)">
              <rect width="328" height="297" rx="5" fill="#fff" stroke="#cbd7e1" />
              <text x="14" y="25" className="oi-label">② 测试对象与结果随之变化</text>
              <rect x="14" y="41" width="300" height="58" rx="4" fill={protocol === 'subject' ? '#eef5f9' : '#f1f0f8'} stroke={protocol === 'subject' ? '#b9cfde' : '#c8c1df'} />
              <text x="26" y="62" className="oi-mini">测试问题</text>
              <text x="26" y="83" fill="#1d2d42" fontSize="10" fontWeight="900">
                {protocol === 'subject' ? '能否迁移到训练阶段未见的 P10？' : '能否适应 P01-P10 各自的新试次？'}
              </text>
              <text x="14" y="125" className="oi-kicker">Broderick-Cocktail-party · BA ↑</text>
              {renderBars(20, 151, 288, 43)}
              <text x="314" y="284" textAnchor="end" className="oi-mini">论文补充表 5 / 6 · 3 次运行均值</text>
            </g>
          </>
        ) : (
          <>
            <g transform="translate(24,24)">
              <rect width="532" height="382" rx="5" fill="#fff" stroke="#cbd7e1" />
              <text x="16" y="28" className="oi-label">① 数据怎样进入三个集合</text>
              <text x="516" y="28" textAnchor="end" className="oi-note">10 名受试者 × 每人 10 次试次</text>
              {renderLegend(278, 47, 78)}
              {renderRows(24, 75, 34, 3, 26)}
              <rect x="16" y="348" width="500" height="22" rx="4" fill={protocol === 'subject' ? '#eef5f9' : '#f1f0f8'} />
              <text x="266" y="363" textAnchor="middle" fill="#344a62" fontSize="9" fontWeight="850">
                {protocol === 'subject' ? 'P01-P08 全部试次训练 · P09 验证 · P10 测试' : 'P01-P10 各自按试次分为 8 训练 · 1 验证 · 1 测试'}
              </text>
            </g>
            <g transform="translate(576,24)">
              <rect width="320" height="382" rx="5" fill="#fff" stroke="#cbd7e1" />
              <text x="16" y="28" className="oi-label">② 测试对象与结果随之变化</text>
              <rect x="16" y="44" width="288" height="68" rx="4" fill={protocol === 'subject' ? '#eef5f9' : '#f1f0f8'} stroke={protocol === 'subject' ? '#b9cfde' : '#c8c1df'} />
              <text x="28" y="66" className="oi-mini">测试问题</text>
              <text x="28" y="88" fill="#1d2d42" fontSize="10" fontWeight="900">
                {protocol === 'subject' ? '能否迁移到训练阶段未见的 P10？' : '能否适应 P01-P10 各自的新试次？'}
              </text>
              <text x="28" y="102" className="oi-mini">
                {protocol === 'subject' ? '训练 / 验证 / 测试身份互不相交' : '10 名身份均出现在三个集合中'}
              </text>
              <text x="16" y="144" className="oi-kicker">Broderick-Cocktail-party · BA ↑</text>
              <text x="304" y="144" textAnchor="end" className="oi-mini">同一任务 · 同一指标</text>
              {renderBars(20, 175, 280, 56)}
              <text x="304" y="364" textAnchor="end" className="oi-mini">论文补充表 5 / 6 · 3 次运行均值</text>
            </g>
          </>
        )}
      </svg>
      <div className="oi-feedback good">
        <b>{protocol === 'subject'
          ? '主榜检验陌生个体迁移；这个任务中 BrainOmni 以 51.6% 居首。'
          : '多受试者协议检验已见个体的新试次适应；CBraMod 提升 42.0 个百分点，任务第一由 BrainOmni 转为 CBraMod。'}</b>
        {' '}两组分数回答不同问题，应分别解读。
      </div>
    </div>
  );
};

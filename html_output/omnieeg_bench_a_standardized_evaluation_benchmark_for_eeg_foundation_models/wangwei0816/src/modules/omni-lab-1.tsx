import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

type ViewMode = 'scores' | 'conditions';

type Report = {
  id: 'A' | 'B' | 'C';
  model: string;
  score: number;
  metric: string;
  dataset: string;
  task: string;
  split: string;
  color: string;
  tint: string;
};

const BLUE = '#245d87';
const PURPLE = '#6756a3';
const ORANGE = '#c47719';
const RED = '#bd4051';
const INK = '#17263b';
const MUTED = '#68788b';

const REPORTS: Report[] = [
  { id: 'A', model: '模型 A', score: 92.1, metric: 'Accuracy', dataset: '数据集 α', task: '2 类运动想象', split: '划分 P', color: BLUE, tint: '#eaf3f9' },
  { id: 'B', model: '模型 B', score: 88.7, metric: 'Macro-F1', dataset: '数据集 β', task: '5 类睡眠分期', split: '划分 Q', color: PURPLE, tint: '#f0edf8' },
  { id: 'C', model: '模型 C', score: 84.4, metric: 'AUROC', dataset: '数据集 γ', task: '2 类异常检测', split: '划分 R', color: ORANGE, tint: '#fff3e4' },
];

export const OmniLab1: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const [mode, setMode] = useState<ViewMode>('scores');
  const width = mobile ? 360 : 920;
  const height = mobile ? 442 : 300;
  const rowX = mobile ? 18 : 36;
  const rowWidth = mobile ? 324 : 848;
  const rowTop = mobile ? 42 : 40;
  const rowHeight = mobile ? 82 : 56;
  const rowGap = 8;
  const auditY = mobile ? 326 : 236;
  const auditHeight = mobile ? 94 : 42;
  const alignedLabels = ['数据集', '任务', '划分', '指标'];

  return (
    <div className="ob-split-lab" ref={ref}>
      <div className="ob-state-control" role="group" aria-label="查看论文分数或测量条件">
        <button type="button" className={mode === 'scores' ? 'active' : ''} aria-pressed={mode === 'scores'} onClick={() => setMode('scores')}>只看报告值</button>
        <button type="button" className={mode === 'conditions' ? 'active' : ''} aria-pressed={mode === 'conditions'} onClick={() => setMode('conditions')}>展开测量坐标</button>
      </div>

      <div className="ob-canvas-wrap">
        <svg className="ob-canvas is-static" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={mode === 'scores' ? '三篇论文的报告值按数值排列' : '三篇论文使用了不同数据集、任务、划分和指标，分数缺少共同测量坐标'}>
          <rect width={width} height={height} fill="#f7f9fb" />
          <text x={rowX} y="27" fill={INK} fontSize="9" fontWeight="850">{mode === 'scores' ? '只读取数字时，榜单看似明确' : '展开每个数字背后的测量条件'}</text>
          <text x={rowX + rowWidth} y="27" textAnchor="end" fill={mode === 'scores' ? BLUE : RED} fontSize="7.5" fontWeight="850">{mode === 'scores' ? '92.1 > 88.7 > 84.4' : '四项条件均未对齐'}</text>

          {REPORTS.map((report, index) => {
            const y = rowTop + index * (rowHeight + rowGap);
            const tags = [report.dataset, report.task, report.split, report.metric];
            return (
              <g key={report.id}>
                <rect x={rowX} y={y} width={rowWidth} height={rowHeight} rx="5" fill="#fff" stroke={mode === 'conditions' ? report.color : '#cfd9e2'} strokeWidth={mode === 'conditions' ? 1.8 : 1.1} />
                <rect x={rowX} y={y} width={mobile ? 42 : 48} height={rowHeight} rx="5" fill={report.tint} />
                <rect x={rowX + (mobile ? 37 : 43)} y={y} width="5" height={rowHeight} fill={report.tint} />
                <text x={rowX + (mobile ? 21 : 24)} y={y + (mobile ? 31 : 33)} textAnchor="middle" fill={report.color} fontSize="17" fontWeight="900">{mode === 'scores' ? index + 1 : report.id}</text>
                <text x={rowX + (mobile ? 56 : 62)} y={y + 21} fill={INK} fontSize="10" fontWeight="900">{report.model}</text>
                <text x={rowX + (mobile ? 56 : 150)} y={y + (mobile ? 50 : 24)} fill={report.color} fontSize={mobile ? '18' : '17'} fontWeight="900">{report.score.toFixed(1)}</text>

                {mode === 'scores' ? (
                  <>
                    <rect x={rowX + (mobile ? 138 : 232)} y={y + (mobile ? 37 : 16)} width={mobile ? 166 : 480} height="8" rx="2" fill="#e5ebf0" />
                    <rect x={rowX + (mobile ? 138 : 232)} y={y + (mobile ? 37 : 16)} width={(mobile ? 166 : 480) * report.score / 100} height="8" rx="2" fill={report.color} />
                    <text x={rowX + rowWidth - 14} y={y + (mobile ? 67 : 43)} textAnchor="end" fill={MUTED} fontSize="7">教学构造的示意报告值</text>
                  </>
                ) : mobile ? (
                  <>
                    <text x={rowX + 112} y={y + 21} fill={MUTED} fontSize="6.8">{tags[0]} · {tags[2]}</text>
                    <text x={rowX + 112} y={y + 43} fill={report.color} fontSize="7.2" fontWeight="850">{tags[1]}</text>
                    <text x={rowX + 112} y={y + 65} fill={INK} fontSize="7.2" fontWeight="850">计分：{tags[3]}</text>
                  </>
                ) : (
                  <>
                    {tags.map((tag, tagIndex) => {
                      const tagX = rowX + 230 + tagIndex * 147;
                      return (
                        <g key={alignedLabels[tagIndex]}>
                          <text x={tagX} y={y + 18} fill={MUTED} fontSize="6.5">{alignedLabels[tagIndex]}</text>
                          <rect x={tagX} y={y + 25} width="130" height="21" rx="3" fill={report.tint} stroke={report.color} strokeOpacity=".35" />
                          <text x={tagX + 65} y={y + 39} textAnchor="middle" fill={report.color} fontSize="7.5" fontWeight="850">{tag}</text>
                        </g>
                      );
                    })}
                  </>
                )}
              </g>
            );
          })}

          <g>
            <rect x={rowX} y={auditY} width={rowWidth} height={auditHeight} rx="5" fill={mode === 'scores' ? '#eef5fa' : '#faecee'} stroke={mode === 'scores' ? '#b9d0df' : '#dfb4bb'} />
            {mode === 'scores' ? (
              <>
                <text x={rowX + 14} y={auditY + 25} fill={BLUE} fontSize="9" fontWeight="900">临时排名：A ＞ B ＞ C</text>
                <text x={mobile ? rowX + 14 : rowX + rowWidth - 14} y={auditY + (mobile ? 52 : 25)} textAnchor={mobile ? 'start' : 'end'} fill={MUTED} fontSize="8">尚未检查这些分数是否测量同一件事</text>
                {mobile && <text x={rowX + 14} y={auditY + 77} fill={INK} fontSize="8" fontWeight="800">下一步：展开测量坐标</text>}
              </>
            ) : (
              <>
                <text x={rowX + 14} y={auditY + 25} fill={RED} fontSize="9" fontWeight="900">可比性：0 / 4 对齐</text>
                {alignedLabels.map((label, index) => {
                  const col = mobile ? index % 2 : index;
                  const line = mobile ? Math.floor(index / 2) : 0;
                  const x = rowX + (mobile ? 24 + col * 145 : 250 + col * 138);
                  const y = auditY + (mobile ? 48 + line * 27 : 22);
                  return <g key={label}><circle cx={x} cy={y} r="6" fill="#fff" stroke={RED} /><text x={x} y={y + 3} textAnchor="middle" fill={RED} fontSize="8" fontWeight="900">×</text><text x={x + 12} y={y + 3} fill={INK} fontSize="8" fontWeight="800">{label}</text></g>;
                })}
              </>
            )}
          </g>
        </svg>
      </div>
      <div className="oi-feedback neutral"><b>边界说明：模型名、数据集、任务和分数均为教学构造，只用于解释“不同口径的数字不能直接排名”。</b></div>
    </div>
  );
};

import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

type Family = {
  name: string;
  short: string;
  examples: string;
  coverage: [boolean, boolean, boolean];
  color: string;
};

const BLUE = '#245d87';
const PURPLE = '#6756a3';
const ORANGE = '#c47719';
const INK = '#17263b';
const MUTED = '#68788b';

const FAMILIES: Family[] = [
  { name: '信号可靠性', short: '可靠性', examples: '伪迹识别 · 跨会话一致性', coverage: [true, false, false], color: '#3d7899' },
  { name: '生物特征与疾病', short: '生物与疾病', examples: '身份 · 年龄 · 临床状态', coverage: [false, true, true], color: '#526f9e' },
  { name: '意识与状态', short: '意识状态', examples: '睡眠 · 警觉 · 麻醉状态', coverage: [true, true, false], color: '#675f9c' },
  { name: '认知与情绪', short: '认知情绪', examples: '负荷 · 情绪 · 认知过程', coverage: [true, false, true], color: '#8a5c88' },
  { name: '自然刺激解码', short: '自然刺激', examples: '语音 · 图像 · 连续视听刺激', coverage: [false, false, true], color: '#a96667' },
  { name: '运动与交互', short: '运动交互', examples: '运动想象 · 意图 · 闭环控制', coverage: [true, true, false], color: '#b37345' },
];

const PAPER_COLORS = [BLUE, PURPLE, ORANGE];

export const OmniMotivationCoverage: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const width = mobile ? 360 : 920;
  const height = mobile ? 532 : 440;
  const matrixX = mobile ? 18 : 46;
  const matrixY = mobile ? 106 : 96;
  const matrixWidth = mobile ? 324 : 828;
  const labelWidth = mobile ? 164 : 300;
  const rowHeight = mobile ? 52 : 45;
  const rowGap = 3;
  const colWidth = (matrixWidth - labelWidth) / 3;
  const [selected, setSelected] = useState(0);
  const family = FAMILIES[selected];
  const evidenceCount = family.coverage.filter(Boolean).length;
  const rowY = (index: number) => matrixY + index * (rowHeight + rowGap);

  const detailY = mobile ? 444 : 384;
  const detailHeight = mobile ? 68 : 38;

  return (
    <div className="ob-split-lab" ref={ref}>
      <div className="ob-lab-head">
        <div>
          <span>WHAT SHOULD A GENERAL MODEL COVER?</span>
          <h5>零散任务能否定义“通用 EEG 能力”</h5>
        </div>
        <p>点选一个能力区域，检查三篇工作是否都留下了可横向比较的评测证据。</p>
      </div>

      <div className="ob-state-control ob-family-control" role="group" aria-label="选择 EEG 能力区域">
        {FAMILIES.map((item, index) => (
          <button
            key={item.name}
            type="button"
            className={selected === index ? 'active' : ''}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            {item.short}
          </button>
        ))}
      </div>

      <div className="ob-canvas-wrap">
        <svg
          className="ob-canvas is-static"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`六类 EEG 能力在三篇既有工作中的评测覆盖，当前检查${family.name}`}
        >
          <rect width={width} height={height} fill="#f7f9fb" />
          <text x={matrixX} y="37" fill={INK} fontSize="9" fontWeight="850">既有工作任务覆盖示意</text>
          <text x={matrixX} y="56" fill={MUTED} fontSize="7.5">圆点表示该论文在对应区域报告过结果</text>
          {['论文 A', '论文 B', '论文 C'].map((label, index) => (
            <g key={label}>
              <circle cx={matrixX + labelWidth + colWidth * (index + 0.5)} cy="64" r="6" fill={PAPER_COLORS[index]} />
              <text x={matrixX + labelWidth + colWidth * (index + 0.5)} y="84" textAnchor="middle" fill={PAPER_COLORS[index]} fontSize="8" fontWeight="850">{label}</text>
            </g>
          ))}

          {FAMILIES.map((item, index) => {
            const y = rowY(index);
            const active = selected === index;
            return (
              <g key={item.name}>
                <rect x={matrixX} y={y} width={matrixWidth} height={rowHeight} rx="4" fill={active ? '#fff' : index % 2 === 0 ? '#f1f5f8' : '#f7f9fb'} stroke={active ? item.color : '#dfe6ec'} strokeWidth={active ? 2 : 1} />
                <rect x={matrixX} y={y} width="5" height={rowHeight} rx="2" fill={active ? item.color : '#c9d4dd'} />
                <text x={matrixX + 16} y={y + (mobile ? 21 : 19)} fill={active ? item.color : INK} fontSize={mobile ? '8.5' : '9'} fontWeight="850">{mobile ? item.short : item.name}</text>
                <text x={matrixX + 16} y={y + (mobile ? 38 : 34)} fill={MUTED} fontSize={mobile ? '6.2' : '7'}>{item.examples}</text>
                {item.coverage.map((covered, paperIndex) => {
                  const cx = matrixX + labelWidth + colWidth * (paperIndex + 0.5);
                  const cy = y + rowHeight / 2;
                  return (
                    <g key={paperIndex}>
                      <circle cx={cx} cy={cy} r={active ? 12 : 9} fill={covered ? PAPER_COLORS[paperIndex] : '#fff'} stroke={covered ? '#fff' : '#b9c5d0'} strokeWidth={covered ? 3 : 1.5} />
                      <text x={cx} y={cy + 3} textAnchor="middle" fill={covered ? '#fff' : '#9aa8b5'} fontSize="8" fontWeight="900">{covered ? '✓' : '—'}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <g>
            <rect x={matrixX} y={detailY} width={matrixWidth} height={detailHeight} rx="5" fill={evidenceCount === 3 ? '#e8f4ef' : '#fff5e6'} stroke={evidenceCount === 3 ? '#99c6b2' : '#dfbd82'} />
            {mobile ? (
              <>
                <text x={matrixX + 14} y={detailY + 24} fill={family.color} fontSize="9" fontWeight="900">{family.name}</text>
                <text x={matrixX + matrixWidth - 14} y={detailY + 24} textAnchor="end" fill={ORANGE} fontSize="9" fontWeight="900">{evidenceCount} / 3 篇有证据</text>
                <line x1={matrixX + 14} y1={detailY + 36} x2={matrixX + matrixWidth - 14} y2={detailY + 36} stroke="#e0d7c7" />
                <text x={matrixX + 14} y={detailY + 56} fill={INK} fontSize="8" fontWeight="850">共同横向比较：无法完成</text>
              </>
            ) : (
              <>
                <text x={matrixX + 14} y={detailY + 24} fill={family.color} fontSize="9" fontWeight="900">{family.name}</text>
                <text x={matrixX + 184} y={detailY + 24} fill={ORANGE} fontSize="8" fontWeight="900">{evidenceCount} / 3 篇有证据</text>
                <text x={matrixX + 320} y={detailY + 24} fill={INK} fontSize="8" fontWeight="850">共同横向比较：无法完成</text>
                <text x={matrixX + matrixWidth - 14} y={detailY + 24} textAnchor="end" fill={MUTED} fontSize="7.5">覆盖缺口随任务区域改变</text>
              </>
            )}
          </g>
        </svg>
      </div>

      <div className="ob-evidence-strip">
        <div><span>第二个缺口</span><b>不同工作偏向不同任务区域</b></div>
        <div><span>直接后果</span><b>“通用能力”缺少统一覆盖范围</b></div>
        <div><span>论文切入</span><b>先建立任务路线图与能力地图</b></div>
      </div>
      <div className="ob-source-note">覆盖矩阵为动机示意，不对应具体三篇论文。论文 §1 指出不同工作隐含地优先关注不同任务族，因此需要一套共同任务路线图来操作化“通用 EEG 表征”。</div>
    </div>
  );
};

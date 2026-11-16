import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Pill } from './kit';

type Strategy = 'scratch' | 'finetune' | 'cofine';
type LensId = 'all' | 'strategy' | 'scale' | 'gap';

type AblationBar = {
  id: string;
  size: '5B' | '55B';
  strategy: Strategy;
  strategyLabel: string;
  semantic: '弱' | '中' | '强';
  value: number;
  color: string;
  short: string;
  explain: string[];
};

const bars: AblationBar[] = [
  {
    id: 's5', size: '5B', strategy: 'scratch', strategyLabel: '从零训练', semantic: '弱', value: 3, color: PAL.red, short: 'Scratch',
    explain: ['没有机器人微调形成可用动作，也没有网页预训练承接；', '5B 从零训练几乎学不到泛化。'],
  },
  {
    id: 'f5', size: '5B', strategy: 'finetune', strategyLabel: '纯微调', semantic: '中', value: 28, color: '#8fb7e8', short: 'Fine',
    explain: ['机器人数据让动作能执行，但只做动作微调会挤占网页语义；', '所以泛化只有 28%。'],
  },
  {
    id: 'c5', size: '5B', strategy: 'cofine', strategyLabel: '共同微调', semantic: '强', value: 44, color: PAL.blue, short: 'Co-fine',
    explain: ['共同微调把网页语义留住，同是 5B，', '就比纯微调高 16 个百分点。'],
  },
  {
    id: 'f55', size: '55B', strategy: 'finetune', strategyLabel: '纯微调', semantic: '中', value: 48, color: '#3f9e6a', short: 'Fine',
    explain: ['55B 规模带来 20 个百分点提升，但缺少共同微调；', '语义仍没有完全保住。'],
  },
  {
    id: 'c55', size: '55B', strategy: 'cofine', strategyLabel: '共同微调', semantic: '强', value: 62, color: PAL.green, short: 'Co-fine',
    explain: ['55B 规模和共同微调同时生效，语义与动作都保留；', '拿到最佳 62%。'],
  },
];

const lensSets: Record<LensId, string[]> = {
  all: bars.map((x) => x.id),
  strategy: ['s5', 'f5', 'c5'],
  scale: ['f5', 'c5', 'f55', 'c55'],
  gap: ['s5', 'c55'],
};

const lensOptions: { id: LensId; label: string }[] = [
  { id: 'all', label: '全部五柱' },
  { id: 'strategy', label: '5B 训练策略' },
  { id: 'scale', label: '同策略比规模' },
  { id: 'gap', label: '最差到最佳' },
];

const lensSummary: Record<LensId, string> = {
  all: '五根柱子不是孤立排名：先控制规模看训练策略，再控制策略看规模，才能解释为什么 55B + 共同微调最佳。',
  strategy: '5B 内部：从零 3 → 纯微调 28 → 共同微调 44，说明先让动作可学，再用语义数据拉开泛化。',
  scale: '同策略下，55B 比 5B 分别高 20 和 18 个百分点；规模有效，但共同微调仍继续带来提升。',
  gap: '最佳 62 与最差 3 相差 59 个百分点，差距来自规模、训练策略和网页语义保留的共同作用。',
};

const baseY = 248;
const plotScale = 170 / 75;
const barX = [100, 204, 308, 412, 516];
const barW = 68;

function Bracket({ x1, x2, y, color, label }: { x1: number; x2: number; y: number; color: string; label: string }) {
  const cx = (x1 + x2) / 2;
  const boxW = label.length * 7 + 18;
  return (
    <g>
      <path d={`M ${x1} ${y - 5} V ${y + 5} M ${x1} ${y} H ${x2} M ${x2} ${y - 5} V ${y + 5}`} fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={cx - boxW / 2} y={y - 10} width={boxW} height={17} rx={8.5} fill="#ffffff" stroke={color} strokeWidth={1} />
      <T x={cx} y={y + 2.5} size={9.5} anchor="middle" color={color} weight={600}>{label}</T>
    </g>
  );
}

// Read from Figure 6b's "Unseen Average" bars (rounded to whole percent).
export const AblationRecap: React.FC<WidgetProps> = () => {
  const [pick, setPick] = useState('c55');
  const [lens, setLens] = useState<LensId>('all');
  const [zoom, setZoom] = useState(false);
  const b = bars.find((x) => x.id === pick)!;
  const activeIds = lensSets[lens];
  const gapToBest = 62 - b.value;

  const chooseLens = (next: LensId) => {
    setLens(next);
    const ids = lensSets[next];
    if (!ids.includes(pick)) setPick(ids[0]);
  };

  return (
    <div>
      <Svg w={1080} h={320} label="规模与训练策略的消融">
        <Card x={18} y={12} w={660} h={296} title="Unseen Average 成功率（%），读自图 6b" color={PAL.blue} active>
          {[0, 25, 50, 75].map((v) => {
            const y = baseY - v * plotScale;
            return (
              <g key={v}>
                <line x1={82} y1={y} x2={612} y2={y} stroke={PAL.line} strokeWidth={v === 0 ? 1.2 : 0.9} />
                <T x={68} y={y + 3.5} size={9} anchor="end" color={PAL.muted}>{v}</T>
              </g>
            );
          })}
          <line x1={82} y1={baseY - 62 * plotScale} x2={612} y2={baseY - 62 * plotScale} stroke={PAL.green} strokeWidth={1.3} strokeDasharray="6 5" strokeLinecap="round" />
          <T x={612} y={baseY - 62 * plotScale - 5} size={9} anchor="end" color={PAL.green} weight={600}>最佳线 62</T>

          {bars.map((x, i) => {
            const h = x.value * plotScale;
            const top = baseY - h;
            const cx = barX[i] + barW / 2;
            const isActive = activeIds.includes(x.id);
            const isSelected = pick === x.id;
            return (
              <g key={x.id} onClick={() => setPick(x.id)} style={{ cursor: 'pointer' }} opacity={isActive ? 1 : 0.22}>
                <rect x={barX[i]} y={top} width={barW} height={h} rx={9} fill={x.color} stroke={isSelected ? PAL.ink : x.color} strokeOpacity={isSelected ? 0.18 : 0.45} strokeWidth={isSelected ? 1.8 : 1} />
                <rect x={barX[i] + 8} y={top + 5} width={barW - 16} height={3} rx={1.5} fill="#ffffff" opacity={0.35} />
                <T x={cx} y={top - 8} size={12} anchor="middle" color={x.color} weight={700}>{x.value}</T>
                <T x={cx} y={268} size={10} anchor="middle" color={PAL.ink} weight={600}>{x.short}</T>
                <T x={cx} y={283} size={9} anchor="middle" color={PAL.muted}>{x.size}</T>
              </g>
            );
          })}

          {lens === 'strategy' ? (
            <>
              <T x={100} y={48} size={9.5} color={PAL.muted} weight={600}>5B：训练策略变化</T>
              <Bracket x1={134} x2={238} y={64} color={PAL.orange} label="+25" />
              <Bracket x1={238} x2={342} y={64} color={PAL.green} label="+16" />
            </>
          ) : null}
          {lens === 'scale' ? (
            <>
              <T x={204} y={46} size={9.5} color={PAL.muted} weight={600}>同策略：模型规模变化</T>
              <Bracket x1={238} x2={446} y={58} color={PAL.orange} label="+20" />
              <Bracket x1={342} x2={550} y={80} color={PAL.green} label="+18" />
            </>
          ) : null}
          {lens === 'gap' ? (
            <>
              <T x={100} y={46} size={9.5} color={PAL.muted} weight={600}>最差到最佳</T>
              <Bracket x1={134} x2={550} y={62} color={PAL.red} label="+59" />
            </>
          ) : null}
        </Card>

        <Card x={698} y={12} w={364} h={296} title="变量拆解" color={b.color} active>
          <T x={718} y={68} size={15} color={PAL.ink} weight={700}>{b.short} · {b.size}</T>
          {[
            ['模型规模', b.size],
            ['训练策略', b.strategyLabel],
            ['网页语义', b.semantic],
            ['成功率', `${b.value}%`],
          ].map(([label, value], i) => (
            <g key={label}>
              <T x={718} y={98 + i * 30} size={10} color={PAL.muted}>{label}</T>
              <T x={812} y={98 + i * 30} size={11} color={PAL.ink} weight={600}>{value}</T>
            </g>
          ))}
          <Pill x={718} y={210} w={154} h={26} label={`距最佳 ${gapToBest} 个百分点`} color={b.color} size={10} />
          {b.explain.map((line, i) => (
            <T key={line} x={718} y={254 + i * 20} size={10.5} color={PAL.muted}>{line}</T>
          ))}
        </Card>
      </Svg>

      <div className="rt2-controls">
        {bars.map((x) => (
          <button key={x.id} className={`rt2-btn ${pick === x.id ? 'is-active' : ''}`} onClick={() => setPick(x.id)}>
            {x.short} {x.size}
          </button>
        ))}
        <button className="rt2-btn" onClick={(e) => { e.stopPropagation(); setZoom(true); }}>放大图 6b</button>
      </div>
      <div className="rt2-controls">
        {lensOptions.map((x) => (
          <button key={x.id} className={`rt2-btn ${lens === x.id ? 'is-active' : ''}`} onClick={() => chooseLens(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="rt2-figure-grid">
        <div className="rt2-figure-card">
          <h4>原图对照：图 6b</h4>
          <img
            src="./images/paper/fig-6b.png"
            alt="图 6b：不同模型规模与训练策略在 Unseen 任务上的成功率"
            onClick={(e) => { e.stopPropagation(); setZoom(true); }}
          />
          <p className="rt2-figure-hint">点击图片或上方“放大图 6b”可查看原图。</p>
          <div className="rt2-figure-legend">
            <span><i className="rt2-figure-dot" style={{ background: PAL.blue }} />共同微调</span>
            <span><i className="rt2-figure-dot" style={{ background: PAL.green }} />纯微调</span>
            <span><i className="rt2-figure-dot" style={{ background: PAL.red }} />从零训练</span>
          </div>
        </div>
        <div className="rt2-figure-card">
          <h4>读图讲解</h4>
          <ol className="rt2-figure-steps">
            <li>
              <span className="rt2-figure-index">1</span>
              <span>先认颜色和柱上标签：蓝色是共同微调，绿色是纯微调，红色是从零训练；浅色柱对应 5B，深色柱对应 55B。</span>
            </li>
            <li>
              <span className="rt2-figure-index">2</span>
              <span>看最右侧 Average：五个整数读数依次为 3、28、44、48、62，最佳与最差相差 59 个百分点。</span>
            </li>
            <li>
              <span className="rt2-figure-index">3</span>
              <span>再回看前三组：共同微调在新物体、新背景和新环境中都保持优势，说明 62% 不是靠单一类别拉高。</span>
            </li>
          </ol>
        </div>
      </div>

      {zoom ? createPortal(
        <div className="rt2-zoom" role="dialog" aria-label="查看图 6b" onClick={(e) => { e.stopPropagation(); setZoom(false); }}>
          <img src="./images/paper/fig-6b.png" alt="图 6b：规模与训练策略消融" />
          <span className="rt2-zoom-hint">点击任意位置关闭</span>
        </div>,
        document.body,
      ) : null}
      <p className="rt2-note is-warn">
        <b>对比结论：</b>{lensSummary[lens]}
      </p>
      <p className="rt2-note">
        <b>读数说明：</b>数值为图 6b 柱高的整数读数；括号差值由这些读数直接相减。附录表 7 给的是各子集原始数字，不能把近似值当成精确测评结果。
      </p>
    </div>
  );
};

export default AblationRecap;

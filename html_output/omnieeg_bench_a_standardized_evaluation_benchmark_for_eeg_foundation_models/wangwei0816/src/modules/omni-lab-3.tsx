import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { usePanelWidth } from './omni-interaction-kit';

type Family = {
  short: string;
  title: string;
  color: string;
  axes: [number, number, number];
  focus: string;
  reason: string;
  examples: string;
};

const families: Family[] = [
  {
    short: '信号可靠性',
    title: 'Signal reliability',
    color: '#2b7896',
    axes: [0.18, 0.12, 0.08],
    focus: '伪迹敏感性、跨会话一致性，以及信号经过处理后是否仍可复用。',
    reason: '关注相对稳定的信号质量，变化较慢，通常属于被动测量。',
    examples: 'EEGDenoiseNet、纵向 test-retest',
  },
  {
    short: '生物特征与疾病',
    title: 'Biometrics and disease',
    color: '#486da8',
    axes: [0.10, 0.25, 0.08],
    focus: '身份、年龄和疾病状态等相对稳定的个体差异。',
    reason: '标签多是长期特质，时间变化缓慢，模型主要读取生物标志。',
    examples: '身份识别、年龄估计、疾病状态',
  },
  {
    short: '意识与状态',
    title: 'Consciousness and state',
    color: '#6756a3',
    axes: [0.56, 0.36, 0.12],
    focus: '从觉醒、睡眠到任务状态，追踪全局脑状态的变化。',
    reason: '比个体特质更瞬时，但通常仍在秒到分钟的较慢尺度上变化。',
    examples: 'Awakening、ISRUC-Sleep、HBN-EEG',
  },
  {
    short: '认知与情绪',
    title: 'Cognition and emotion',
    color: '#9a4f78',
    axes: [0.66, 0.60, 0.20],
    focus: '认知负荷、工作记忆与情绪等任务相关心理状态。',
    reason: '标签更接近当下状态，变化速度也快于睡眠或临床特质。',
    examples: 'FACED、EEGMAT、情绪与认知任务',
  },
  {
    short: '自然刺激解码',
    title: 'Naturalistic stimulus decoding',
    color: '#b06a25',
    axes: [0.50, 0.88, 0.24],
    focus: '在连续语音、图像等真实刺激中解码感知内容与语义。',
    reason: '刺激持续变化，模型需要紧跟动态上下文，仍以读取反应为主。',
    examples: 'Broderick-Cocktail-party、ThingsEEG2',
  },
  {
    short: '运动与交互',
    title: 'Motor and interaction',
    color: '#27815f',
    axes: [0.76, 0.84, 0.95],
    focus: '解码运动意图、错误反馈，并把脑信号用于主动控制。',
    reason: '需要快速响应当前意图，也是六类中最接近闭环交互的一端。',
    examples: 'BCIC-IV、PhysioNet-MI、Monitoring-ErrP',
  },
];

type Point = { x: number; y: number };

const add = (...points: Point[]): Point => points.reduce(
  (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
  { x: 0, y: 0 },
);

const scale = (point: Point, factor: number): Point => ({
  x: point.x * factor,
  y: point.y * factor,
});

const qualitativePosition = (values: [number, number, number]) => [
  values[0] < .34 ? '偏稳定特质' : values[0] > .66 ? '偏瞬时状态' : '特质—状态之间',
  values[1] < .34 ? '偏慢变化' : values[1] > .66 ? '偏快变化' : '中等时间尺度',
  values[2] < .34 ? '偏被动监测' : values[2] > .66 ? '偏主动交互' : '监测—交互之间',
];

export const OmniLab3: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const [selected, setSelected] = useState(0);
  const family = families[selected];
  const width = mobile ? 360 : 920;
  const height = mobile ? 765 : 390;
  const origin = mobile ? { x: 56, y: 370 } : { x: 94, y: 352 };
  const basisX = mobile ? { x: 190, y: 0 } : { x: 320, y: 0 };
  const basisY = mobile ? { x: 0, y: -210 } : { x: 0, y: -220 };
  const basisZ = mobile ? { x: 74, y: -46 } : { x: 116, y: -68 };
  const detail = mobile
    ? { x: 24, y: 430, width: 312, height: 328 }
    : { x: 590, y: 31, width: 300, height: 328 };

  const project = ([x, y, z]: [number, number, number]) => add(
    origin,
    scale(basisX, x),
    scale(basisY, y),
    scale(basisZ, z),
  );

  const corners = {
    o: project([0, 0, 0]),
    x: project([1, 0, 0]),
    y: project([0, 1, 0]),
    z: project([0, 0, 1]),
    xy: project([1, 1, 0]),
    xz: project([1, 0, 1]),
    yz: project([0, 1, 1]),
    xyz: project([1, 1, 1]),
  };
  const point = project(family.axes);
  const projectionXY = project([family.axes[0], family.axes[1], 0]);
  const projectionXZ = project([family.axes[0], 0, family.axes[2]]);
  const projectionYZ = project([0, family.axes[1], family.axes[2]]);
  const reads = qualitativePosition(family.axes);
  const labelWidth = Math.max(66, family.short.length * 12 + 16);
  const plotRight = mobile ? 350 : 566;
  const labelX = point.x + 12 + labelWidth < plotRight ? point.x + 12 : point.x - labelWidth - 12;
  const labelY = point.y < 48 ? point.y + 12 : point.y > 260 ? point.y - 74 : point.y - 29;
  const cubeEdges: [Point, Point][] = [
    [corners.o, corners.x], [corners.o, corners.y], [corners.o, corners.z],
    [corners.x, corners.xy], [corners.x, corners.xz],
    [corners.y, corners.xy], [corners.y, corners.yz],
    [corners.z, corners.xz], [corners.z, corners.yz],
    [corners.xy, corners.xyz], [corners.xz, corners.xyz], [corners.yz, corners.xyz],
  ];

  return (
    <div className="oi-unit ol3-unit" ref={ref}>
      <div className="oi-caption">
        <span>选择一种能力，观察它在三条连续维度中的位置</span>
        <strong>58 项任务 · 6 类能力</strong>
      </div>

      <div className="ob-state-control ob-family-control" role="group" aria-label="选择 EEG 能力类别">
        {families.map((item, index) => (
          <button
            key={item.short}
            type="button"
            className={selected === index ? 'active' : ''}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span className="ol3-family-dot" style={{ background: item.color }} aria-hidden="true" />
            {item.short}
          </button>
        ))}
      </div>

      <svg
        className="oi-stage ol3-stage"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${family.short}在表征对象、时间尺度和使用方式三条连续维度上的定性位置`}
      >
        <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="6" fill="#f7f9fb" stroke="#d6e0e8" />

        <text x={mobile ? 24 : 34} y="30" className="oi-kicker">六类能力共享一个连续任务空间</text>
        <text x={mobile ? 24 : 34} y="49" className="oi-note">选择类别后，实心点与三条坐标面投影线同步移动</text>

        <g aria-hidden="true">
          <polygon
            points={`${corners.o.x},${corners.o.y} ${corners.x.x},${corners.x.y} ${corners.xz.x},${corners.xz.y} ${corners.z.x},${corners.z.y}`}
            fill="#eef3f6"
          />
          <polygon
            points={`${corners.o.x},${corners.o.y} ${corners.y.x},${corners.y.y} ${corners.yz.x},${corners.yz.y} ${corners.z.x},${corners.z.y}`}
            fill="#f3f0f7"
          />
          <polygon
            points={`${corners.y.x},${corners.y.y} ${corners.xy.x},${corners.xy.y} ${corners.xyz.x},${corners.xyz.y} ${corners.yz.x},${corners.yz.y}`}
            fill="#f3f7f5"
          />
          {cubeEdges.map(([start, end], index) => (
            <line
              key={index}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#b9c6d1"
              strokeWidth="1.2"
              strokeDasharray={index > 8 ? '4 4' : undefined}
            />
          ))}

          {[.25, .5, .75].map((tick) => {
            const xTick = add(origin, scale(basisX, tick));
            const yTick = add(origin, scale(basisY, tick));
            const zTick = add(origin, scale(basisZ, tick));
            return (
              <g key={tick} opacity=".8">
                <line x1={xTick.x} y1={xTick.y - 4} x2={xTick.x} y2={xTick.y + 4} stroke="#6e8395" />
                <line x1={yTick.x - 4} y1={yTick.y} x2={yTick.x + 4} y2={yTick.y} stroke="#6e8395" />
                <line x1={zTick.x - 3} y1={zTick.y - 3} x2={zTick.x + 3} y2={zTick.y + 3} stroke="#6e8395" />
              </g>
            );
          })}
        </g>

        <g className="ol3-axis-labels">
          <text x={corners.o.x} y={corners.o.y + 24}>稳定特质</text>
          <text x={corners.x.x} y={corners.x.y + 24} textAnchor="end">瞬时状态</text>
          <text x={corners.o.x - 10} y={corners.o.y - 4} textAnchor="end">慢变化</text>
          <text x={corners.y.x - 9} y={corners.y.y + 4} textAnchor="end">快变化</text>
          <text x={corners.o.x + basisZ.x * .25 + 4} y={corners.o.y + basisZ.y * .25 - 4}>被动监测</text>
          <text x={corners.z.x + 8} y={corners.z.y - 3}>主动交互</text>
          <text x={corners.o.x + basisX.x * .52} y={corners.o.y - 8} className="ol3-axis-letter">X</text>
          <text x={corners.o.x + 8} y={corners.o.y + basisY.y * .52} className="ol3-axis-letter">Y</text>
          <text x={corners.o.x + basisZ.x * .58 + 5} y={corners.o.y + basisZ.y * .58 - 4} className="ol3-axis-letter">Z</text>
        </g>

        <g className="ol3-projections" stroke={family.color} style={{ transition: 'all 360ms ease' }}>
          <line x1={point.x} y1={point.y} x2={projectionXY.x} y2={projectionXY.y} />
          <line x1={point.x} y1={point.y} x2={projectionXZ.x} y2={projectionXZ.y} />
          <line x1={point.x} y1={point.y} x2={projectionYZ.x} y2={projectionYZ.y} />
          {[projectionXY, projectionXZ, projectionYZ].map((projection, index) => (
            <circle key={index} cx={projection.x} cy={projection.y} r="3" fill="#fff" />
          ))}
        </g>

        <g aria-label="六类能力的定性位置">
          {families.map((item, index) => {
            if (index === selected) return null;
            const itemPoint = project(item.axes);
            return (
              <circle
                key={item.short}
                cx={itemPoint.x}
                cy={itemPoint.y}
                r="5"
                fill={item.color}
                stroke="#fff"
                strokeWidth="2"
                opacity=".62"
              />
            );
          })}
          <circle cx={point.x} cy={point.y} r="14" fill={family.color} opacity=".12" style={{ transition: 'all 360ms ease' }} />
          <circle cx={point.x} cy={point.y} r="8" fill={family.color} stroke="#fff" strokeWidth="3" style={{ transition: 'all 360ms ease' }} />
          <g className="ol3-point-label" transform={`translate(${labelX},${labelY})`}>
            <rect width={labelWidth} height="23" rx="3" fill="#fff" stroke={family.color} />
            <text x="8" y="15">{family.short}</text>
          </g>
        </g>

        <g className="ol3-detail-reveal" key={family.short} transform={`translate(${detail.x},${detail.y})`}>
          <rect width={detail.width} height={detail.height} rx="5" fill="#fff" stroke="#cbd7e1" />
          <rect width="5" height={detail.height} rx="2.5" fill={family.color} />
          <circle cx="27" cy="29" r="8" fill={family.color} />
          <text x="45" y="34" className="oi-label">{family.short}</text>
          <text x="20" y="61" className="oi-mini">{family.title}</text>

          <text x="20" y="82" className="oi-kicker">空间位置</text>
          <foreignObject x="20" y="91" width={detail.width - 40} height="35">
            <div className="ol3-coordinate-readout">
              {reads.map((read) => <span key={read}>{read}</span>)}
            </div>
          </foreignObject>

          <text x="20" y="145" className="oi-kicker">测量核心</text>
          <foreignObject x="20" y="155" width={detail.width - 40} height="45">
            <div className="ol3-svg-copy">{family.focus}</div>
          </foreignObject>

          <text x="20" y="216" className="oi-kicker">定位理由</text>
          <foreignObject x="20" y="226" width={detail.width - 40} height="52">
            <div className="ol3-svg-copy">{family.reason}</div>
          </foreignObject>

          <line x1="20" y1={detail.height - 39} x2={detail.width - 20} y2={detail.height - 39} stroke="#e4eaf0" />
          <text x="20" y={detail.height - 17} className="oi-mini">代表任务</text>
          <text x={detail.width - 20} y={detail.height - 17} textAnchor="end" className="ol3-example">{family.examples}</text>
        </g>
      </svg>

      <div className="oi-feedback neutral">
        <b>读图方法：</b>六类能力覆盖连续任务空间。三条轴用于组织任务属性，不代表模型得分。
      </div>
    </div>
  );
};

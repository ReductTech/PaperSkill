import { useTeachingValues } from './teaching-motion';

export const probabilityColors = ['#7f92af', '#5365ad', '#bd9254'];
const boundaries = (values: number[]) => values.reduce<number[]>((sum, value) => [...sum, sum[sum.length - 1] + value], [0]);

export function ProbabilityRedistribution({ before, current, cause }: { before: number[]; current: number[]; cause: string }) {
  const animated = useTeachingValues(current);
  const previousEdges = boundaries(before), nextEdges = boundaries(animated);
  const hasBefore = before.some(value => value > 0), hasCurrent = current.some(value => value > 0);
  return <div className="probability-redistribution" aria-label="概率重新分配示意">
    <div className="probability-flow-heading"><strong>一份概率，重新分配</strong><span>{hasCurrent ? '当前总和 100%' : '当前无候选'}</span></div>
    <div className="probability-flow-chart" aria-hidden="true">
      <div className="probability-flow-labels"><span>{hasBefore ? '调整前' : '此前为空'}</span><span>{hasCurrent ? '当前' : '暂无分配'}</span></div>
      <svg viewBox="0 0 360 64" preserveAspectRatio="none">
        <rect x="0" y="0" width="360" height="9" rx="3" fill="#dfe4ef"/>
        <rect x="0" y="55" width="360" height="9" rx="3" fill="#dfe4ef"/>
        {current.map((_, i) => {
          const leftTop = previousEdges[i] * 360, rightTop = previousEdges[i + 1] * 360;
          const leftBottom = nextEdges[i] * 360, rightBottom = nextEdges[i + 1] * 360;
          return <g key={i} fill={probabilityColors[i]}>
            <path className="probability-flow-band" d={`M${leftTop} 9C${leftTop} 32 ${leftBottom} 32 ${leftBottom} 55H${rightBottom}C${rightBottom} 32 ${rightTop} 32 ${rightTop} 9Z`} opacity=".2"/>
            <rect className="probability-previous-segment" x={leftTop} y="0" width={Math.max(0, rightTop - leftTop)} height="9" opacity=".5"/>
            <rect className="probability-current-segment" data-category={i} data-probability={current[i]} x={leftBottom} y="55" width={Math.max(0, rightBottom - leftBottom)} height="9"/>
          </g>;
        })}
      </svg>
    </div>
    <p className="probability-flow-cause">{cause}</p>
  </div>;
}

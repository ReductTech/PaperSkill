import { motionEase, useTeachingProgress } from './teaching-motion';

const colors = ['#7f92af', '#bd9254', '#8c83aa'];
export const promptVector = (angle: number) => [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
export function averagePromptVectors(angles: number[]) {
  const average = angles.reduce((sum, angle) => {
    const v = promptVector(angle);
    return [sum[0] + v[0] / angles.length, sum[1] + v[1] / angles.length];
  }, [0, 0]);
  const norm = Math.hypot(...average);
  return { average, norm, embedding: average.map(value => value / norm) };
}

export function PromptComposition({ angles, indices, ensemble }: { angles: number[]; indices: number[]; ensemble: boolean }) {
  const { average, norm, embedding } = averagePromptVectors(indices.map(i => angles[i]));
  const progress = useTeachingProgress(`${ensemble}:${indices.join(',')}`, ensemble && indices.length > 1 ? 2700 : 1050);
  const multiple = ensemble && indices.length > 1;
  const merge = motionEase((progress - .14) / .43);
  const normalize = motionEase((progress - .64) / .27);
  const resultScale = multiple ? norm + (1 - norm) * normalize : motionEase(progress / .8);
  const plot = (v: number[]) => [44 + v[0] * 156, 192 - v[1] * 156];
  const meanPoint = plot(average), finalPoint = plot(embedding);
  const movingResult = plot(embedding.map(value => value * resultScale));
  const stage = !multiple ? '归一化后，得到一个类别方向' : progress < .2 ? '每个模板，先得到单位向量' : progress < .64 ? '取平均：彩点汇聚到均值位置' : progress < 1 ? '再归一化：方向不变，长度变为 1' : '多个模板，合成一个类别方向';
  return <div className="prompt-space prompt-composition">
    <div className="prompt-motion-heading"><span>模板如何合成方向</span><small>二维教学示意</small></div>
    <svg viewBox="0 0 270 220" role="img" aria-label={'文本类别向量为' + embedding.map(v => v.toFixed(3)).join('，') + (multiple ? '；先平均，再归一化' : '')}>
      <path d="M24 192H236M44 208V20" stroke="#d4d9e2" fill="none"/>
      <path d="M200 192A156 156 0 0 0 44 36" fill="none" stroke="#d2d9e9" strokeDasharray="3 6"/>
      <text x="218" y="211" fill="#7d8799" fontSize="12">长度 1</text>
      {angles.map((angle, i) => {
        const v = promptVector(angle), point = plot(v), active = indices.includes(i);
        return <g key={i} className="prompt-reference-vector" opacity={active ? 1 : .16}>
          <path d={`M44 192L${point[0]} ${point[1]}`} stroke={colors[i]} strokeWidth="1.5" fill="none"/>
          <circle cx={point[0]} cy={point[1]} r="5" fill="white" stroke={colors[i]} strokeWidth="2"/>
          <text x={point[0] + 10} y={point[1] + 5} fill={colors[i]} fontSize="15" fontWeight="600">{i + 1}</text>
          {multiple && active && <>
            <path d={`M${point[0]} ${point[1]}L${meanPoint[0]} ${meanPoint[1]}`} stroke={colors[i]} strokeWidth="1.2" strokeDasharray="2 4" opacity=".5"/>
            <circle className="prompt-merging-point" data-template={i} cx={point[0] + (meanPoint[0] - point[0]) * merge} cy={point[1] + (meanPoint[1] - point[1]) * merge} r="4" fill={colors[i]} opacity={1 - normalize} />
          </>}
        </g>;
      })}
      {multiple && <path d={`M44 192L${finalPoint[0]} ${finalPoint[1]}`} stroke="#5365ad" strokeWidth="2" opacity=".14"/>}
      <g opacity={multiple ? merge : 1}>
        <path d={`M44 192L${movingResult[0]} ${movingResult[1]}`} stroke="#5365ad" strokeWidth="4" strokeLinecap="round"/>
        <circle className="prompt-final-point" data-x={embedding[0]} data-y={embedding[1]} cx={movingResult[0]} cy={movingResult[1]} r="7" fill="#5365ad" stroke="white" strokeWidth="2.5"/>
      </g>
      {multiple && <circle cx={meanPoint[0]} cy={meanPoint[1]} r="3" fill="white" stroke="#5365ad" strokeWidth="1.5" opacity={normalize}/>}
      <circle cx="44" cy="192" r="3" fill="#26364a"/>
    </svg>
    <div className="prompt-motion-steps" aria-hidden="true"><span className={progress < .2 ? 'is-active' : ''}>① 独立表示</span><i>→</i>{multiple && <><span className={progress >= .2 && progress < .64 ? 'is-active' : ''}>② 取平均</span><i>→</i></>}<span className={!multiple || progress >= .64 ? 'is-active' : ''}>{multiple ? '③' : '②'} 归一化</span></div>
    <p className="prompt-motion-status" aria-hidden="true">{stage}</p>
    <div className="vector-output"><small>最终类别向量</small><b>[{embedding.map(v => v.toFixed(3)).join(', ')}]</b></div>
    {multiple && <div className="prompt-norm-readout"><span>平均长度 <b>{norm.toFixed(3)}</b></span><i>→</i><span>最终长度 <b>1.000</b></span></div>}
  </div>;
}

import { useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { Choice, Road, gold, mint, sky } from './road-scenes';
import { distance, greedyCoverage, hit, sampleRoad } from './road-model';
import { optimizeDistance } from './learning-model';

function CoverScene({ distribution }: { distribution: boolean }) {
  const { progress } = useCoverPlayback();
  const positions = [125, 350, 575];
  return <svg className="td-cover-explained" viewBox="0 0 700 430" aria-label={distribution
    ? '先学习左转、直行、右转的可能性，再选择两个输出' : '只提交两个候选，可能漏掉其他未来'}>
    <rect width="700" height="430" rx="24" fill="#102b2e" />
    <text x="350" y="43" textAnchor="middle" fill="#eaf8f0" fontSize="30">
      {distribution ? '① 先学：未来有哪些可能？' : '训练与有限候选的安排相联系'}</text>
    {positions.map((x, i) => <g key={x}>
      <path d={'M350 318 Q350 240 ' + x + ' 168'} fill="none" stroke="#607f7e" strokeWidth="5" />
      {distribution && Array.from({ length: 15 }, (_, j) => <circle key={j}
        cx={x + Math.cos(j * 2.4) * Math.sqrt(j + 1) * 12}
        cy={159 + Math.sin(j * 2.4) * Math.sqrt(j + 1) * 9} r="5" fill={sky} opacity=".75" />)}
      <text x={x} y="100" textAnchor="middle" fill="#eaf8f0" fontSize="30">{['左转', '直行', '右转'][i]}</text>
    </g>)}
    {(distribution ? [125, 575] : [330, 380]).map((x, i) => <g key={x}>
      <circle cx={x} cy="168" r="25" fill="#102b2e" stroke={gold} strokeWidth="4" />
      <text x={x} y="179" textAnchor="middle" fill={gold} fontSize="30">{i + 1}</text>
    </g>)}
    <g transform={'translate(350 ' + (310 - 12 * progress) + ')'}>
      <rect x="-22" y="-32" width="44" height="64" rx="12" fill={mint} />
      <rect x="-15" y="-20" width="30" height="16" rx="4" fill="#17474a" />
    </g>
    <text x="350" y="365" textAnchor="middle" fill="#eaf8f0" fontSize="28">
      {distribution ? '② 再选：按当前指标给出两个候选' : '例如：两个候选都照顾直行附近'}</text>
    <text x="350" y="407" textAnchor="middle" fill="#a4c0be" fontSize="28">
      {distribution ? '蓝点＝可能未来；编号圈＝最终候选' : '编号圈＝最终候选；其他方向仍可能发生'}</text>
  </svg>;
}

export const CoverQuestion = () => <CoverScene distribution={false} />;
export const CoverAnswer = () => <CoverScene distribution />;

export function ExplainScoring() {
  const [position, setPosition] = useState(0);
  const truth = { x: 0, y: 0, angle: 0 };
  const choices = [{ x: .6, y: .2 }, { x: 1.4, y: .2 }, { x: 2.4, y: .2 }];
  const candidate = choices[position];
  const matched = hit(candidate, truth, 1);
  const x = 360 + candidate.x * 120, y = 240 - candidate.y * 120;
  return <div className="td-score-explained">
    <div className="td-wide-toolbar"><p>固定一个真实终点，只移动预测终点。</p>
      <Choice items={['近处', '框内较远处', '框外']} current={position} select={setPosition} /></div>
    <div className="td-score-columns">
      <svg viewBox="0 0 900 450" aria-label="真实终点周围的容差窗口与预测误差距离">
        <rect width="900" height="450" rx="20" fill="#173e41" />
        <text x="35" y="47" fill="#eaf8f0" fontSize="30">放大终点附近：绿色框就是命中窗口</text>
        <rect x="174" y="146.4" width="372" height="187.2" rx="3" fill={mint} fillOpacity=".12" stroke={mint} strokeWidth="4" />
        <path d="M100 240 H770 M360 95 V350" stroke="#72918b" strokeWidth="2" strokeDasharray="8 9" />
        <line x1="360" y1="240" x2={x} y2={y} stroke={gold} strokeWidth="5" />
        <path d="M360 224 l16 16 -16 16 -16 -16Z" fill={mint} />
        <circle cx={x} cy={y} r="17" fill={gold} stroke="#102b2e" strokeWidth="3" />
        <text x="215" y="128" fill={mint} fontSize="28">按真实位置、航向定义的容差范围</text>
        <text x="244" y="382" fill={mint} fontSize="28">◆ 真实终点</text>
        <text x="500" y="382" fill={gold} fontSize="28">● 预测终点</text>
        <text x="35" y="426" fill="#a4c0be" fontSize="28">黄色线段＝预测终点到真实终点的距离</text>
      </svg>
      <div className="td-score-readouts">
        <section><h2>距离评分</h2><strong>{distance(candidate, truth).toFixed(2)} m</strong>
          <p>越近越好。多个候选中，取最近一个：minFDE。</p></section>
        <section><h2>窗口判定</h2><strong>{matched ? '命中 ✓' : '未命中 ×'}</strong>
          <p>{matched ? '点在框内就算命中。靠得更近，也只算这一次命中。' : '点在框外，本次未命中。框的大小由评测协议规定。'}</p></section>
      </div>
    </div>
    <p className="td-wide-conclusion">距离优先：让最近误差更小。窗口优先：让更多可能未来被命中。此处只演示命中判定；mAP 还要考虑置信度与排序。</p>
  </div>;
}

const samples = sampleRoad(24);
const byDistance = optimizeDistance(samples, 3);
const byWindow = greedyCoverage(samples, 3, 1).selected.map(row => row.point);

export function ExplainDecoupling() {
  const [stage, setStage] = useState(0);
  const [policy, setPolicy] = useState(0);
  return <div className="td-bridge td-bridge-explained">
    <div className="td-bridge-text">
      <Choice items={['① 为什么分开', '② 怎样学习', '③ 怎样输出']} current={stage} select={setStage} />
      <h2>{['先保留信息，再决定怎样交答案', '学习未来的概率分布', '模型不变，按用途选择答案'][stage]}</h2>
      {stage === 0 ? <>
        <p>上一页的冲突发生在：只有 K 个名额，距离与覆盖偏好不同的候选摆法。</p>
        <p>若训练也围绕这种摆法，学到的分布与某项指标的答题策略就绑在了一起。</p>
        <p>因此先学习多种未来及其可能性，把“怎样分配 K 个名额”推迟到输出阶段。</p>
      </> : stage === 1 ? <>
        <p>输入历史与地图，用真实未来作监督。NLL 训练模型的位置、尺度和模式权重。</p>
        <p>目标是给真实未来更高的密度，保留各方向的不确定性，不直接按 minFDE 或 mAP 安排最终候选。</p>
        <p className="td-quiet">接下来第 5—7 页讲：怎样表示分布、怎样训练。</p>
      </> : <>
        <p>固定模型权重，从同一分布采样。按当前评价目标，用 TraDiE 选择少量候选。</p>
        <Choice items={['距离策略', '窗口策略']} current={policy} select={setPolicy} />
        <p>切换规则时，右侧蓝色样本不变，编号候选改变。不需要为这次切换重新训练模型。</p>
        <p className="td-quiet">它把取舍移到输出阶段；两种目标对候选的取舍仍然存在。</p>
      </>}
    </div>
    <div className="td-bridge-road"><Road samples={samples}
      picks={stage === 2 ? policy === 0 ? byDistance : byWindow : []}
      note={stage === 2 ? '蓝点不变，候选随规则改变' : '蓝点：先保留各种可能未来'} /></div>
  </div>;
}

import React, { useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { SymbolHint as Hint } from '../components/SymbolHint';
import { add, baseFit, composed, fitLine, future, history, last, number, offsets, positions, sub } from './resonance-model';
import type { Point } from './resonance-model';
import { Choice, color, Legend, Map, Note, Panel, Slider, Split } from './resonance-ui';

const observations = { points: positions, color: color.history, dots: true };
const fitted = { points: history.map(point => baseFit.at(point.t)), color: color.baseline, dashed: true };
const extended = { points: [baseFit.at(7), ...future], color: color.baseline, dashed: true };
const demoNeighbor: Point = [3.75, 1.75];

export function Cover({ moduleId }: { moduleId: string }) {
  const { progress } = useCoverPlayback();
  const method = moduleId === 'newMethod';
  const trajectory = method ? composed(1, 1) : future;
  const step = Math.min(10, Math.floor(progress * 14));
  return <div className="re-cover-map">
    <Map label={method ? '观察蓝线，叠加偏移后的紫色未来' : '蓝色历史和灰色线性未来'}
      routes={[observations, extended, ...(method ? [{ points: [baseFit.at(7), ...trajectory.slice(0, step + 1)], color: color.result }] : [])]}
      people={[{ point: trajectory[step], color: method ? color.result : color.baseline }, { point: demoNeighbor, color: color.social }]} />
  </div>;
}

export function History() {
  const [step, setStep] = useState(7);
  const shown = positions.slice(0, step + 1);
  return <Panel>
    <Split visual={<Map routes={[{ ...observations, points: shown }]} people={[{ point: last(shown), color: color.history }, { point: demoNeighbor, color: color.social }]} label="逐步显示行人已观察到的位置" />}>
      <div className="re-tag">教学街景</div>
      <h3>先确认同一个人走过哪里</h3>
      <p>ByteTrack 提供跨帧身份和位置。Resonance 读取目标与邻居的坐标序列，再预测后续位置。</p>
      <div className="re-readout">{step + 1} / 8 个观测点</div>
      <p>每隔 0.4 秒取一个点。第 8 个观测点之后，预测接下来 12 个点。</p>
    </Split>
    <Slider label="观测时刻" value={step + 1} min={1} max={8} change={value => setStep(value - 1)} />
    <Note>本页用同一坐标系示意任务交接。真实视频中的像素坐标与米制轨迹需要先对齐尺度和时间。</Note>
  </Panel>;
}

export function Linear() {
  const [index, setIndex] = useState(7);
  const [shift, setShift] = useState(0.65);
  const modified = history.map((point, i) => i === index
    ? { ...point, position: add(point.position, [0, shift]) } : point);
  const line = fitLine(modified);
  const predicted = Array.from({ length: 12 }, (_, i) => line.at(i + 8));
  return <Panel>
    <Split visual={<Map label="拖动观测点会重新拟合历史并改变未来外推"
      routes={[{ points: modified.map(p => p.position), color: color.history, dots: true },
        { points: history.map(p => line.at(p.t)), color: color.own },
        { points: [line.at(7), ...predicted], color: color.baseline, dashed: true }]}
      handles={[{ point: modified[index].position, label: '可拖动的历史点', change: p =>
        setShift(Math.round(Math.max(-1.2, Math.min(1.2, p[1] - positions[index][1])) * 100) / 100) }]} />}>
      <div className="re-tag">式 (2)–(4)</div>
      <h3>用全部观测点拟合</h3>
      <p>分别在横向和纵向拟合位置随时间的直线，把直线延伸到未来。</p>
      <div className="re-readout">({number(line.slope[0] / .4)}, {number(line.slope[1] / .4)}) 米/秒</div>
      <p>紫圈标出当前可拖动的点。拖动时，历史拟合线和外推终点同时更新。</p>
    </Split>
    <div className="re-controls">
      <Slider label="第几个历史点" value={index + 1} min={1} max={8} change={i => { setIndex(i - 1); setShift(0); }} />
      <Slider label="纵向扰动（米）" value={shift} min={-1.2} max={1.2} step={.01} change={setShift} />
    </div>
    <Legend items={[[ '观测', color.history ], [ '历史拟合', color.own ], [ '未来外推', color.baseline ]]} />
  </Panel>;
}

const states = ['只看线性基线', '加入自身偏移', '再加入交互偏移'];
export function Composition() {
  const [stage, setStage] = useState(2);
  const [frame, setFrame] = useState(8);
  const step = frame - 1;
  const base = future[step];
  const { own, neighbor } = offsets(step);
  const middle = add(base, own);
  const finish = add(middle, neighbor);
  const selected = stage === 0 ? base : stage === 1 ? middle : finish;
  const ownRoute = [baseFit.at(7), ...composed(1, 0)];
  const finalRoute = [baseFit.at(7), ...composed(1, 1)];
  return <Panel>
    <Choice labels={states} value={stage} change={setStage} label="轨迹叠加步骤" />
    <Split visual={<Map label="同一未来时刻的两段偏移向量首尾相接"
      routes={[observations, extended, ...(stage >= 1 ? [{ points: ownRoute, color: color.own, opacity: .75 }] : []),
        ...(stage === 2 ? [{ points: finalRoute, color: color.result }] : [])]}
      arrows={[...(stage >= 1 ? [{ start: base, end: middle, color: color.own }] : []),
        ...(stage === 2 ? [{ start: middle, end: finish, color: color.social }] : [])]}
      markers={[{ point: base, color: color.baseline }, ...(stage >= 1 ? [{ point: middle, color: color.own }] : []),
        ...(stage === 2 ? [{ point: finish, color: color.result, radius: 10 }] : [])]}
      people={[{ point: demoNeighbor, color: color.social }]} />}>
      <div className="re-tag">式 (1) · 教学偏移</div>
      <h3>同一时刻，逐项相加</h3>
      <div className="re-equation">
        <Hint meaning="这一时刻的线性外推位置">基线</Hint> +
        <Hint meaning="模型自身分支预测的二维偏移"> 自身偏移</Hint> +
        <Hint meaning="模型交互分支预测的二维偏移"> 交互偏移</Hint>
      </div>
      <p>自身偏移 {stage >= 1 ? `(${number(own[0])}, ${number(own[1])})` : '尚未加入'}</p>
      <p>交互偏移 {stage >= 2 ? `(${number(neighbor[0])}, ${number(neighbor[1])})` : '尚未加入'}</p>
      <div className="re-readout">当前 ({number(selected[0])}, {number(selected[1])}) 米</div>
    </Split>
    <Slider label="未来第几步" value={frame} min={1} max={12} change={setFrame} />
    <Legend items={[[ '线性基线', color.baseline ], [ '自身偏移', color.own ], [ '交互偏移', color.social ], [ '合成结果', color.result ]]} />
  </Panel>;
}

export function SelfBias() {
  const [frame, setFrame] = useState(6);
  const at = frame - 1, fit = baseFit.at(at), observed = positions[at];
  const residual = sub(observed, fit);
  return <Panel>
    <Split visual={<Map label="观测历史与线性参考之间的偏差"
      routes={[observations, fitted, { points: [baseFit.at(7), ...composed(1, 0)], color: color.own }]}
      arrows={[{ start: fit, end: observed, color: color.error }]}
      markers={[{ point: fit, color: color.baseline }, { point: observed, color: color.history }]} />}>
      <div className="re-tag">式 (5)–(8)</div>
      <h3>从实际历史里找出偏离</h3>
      <p>模型分别对观测和历史拟合做 Haar 变换及嵌入，再在特征层作差。当前图画的是便于阅读的空间差。</p>
      <div className="re-readout">空间差 ({number(residual[0])}, {number(residual[1])}) 米</div>
      <p>自身分支再结合噪声，生成未来少量路标点的偏移，经逆变换和插值得到完整序列。</p>
    </Split>
    <Slider label="查看历史第几步" value={frame} min={1} max={8} change={setFrame} />
    <Legend items={[[ '观测历史', color.history ], [ '历史拟合', color.baseline ], [ '教学自身轨迹', color.own ]]} />
  </Panel>;
}

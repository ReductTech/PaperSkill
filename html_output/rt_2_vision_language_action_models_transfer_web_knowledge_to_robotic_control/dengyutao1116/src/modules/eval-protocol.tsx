import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Pill } from './kit';

type Suite = {
  id: string;
  label: string;
  count: string;
  score?: string;
  easy?: string;
  hard?: string;
  note: string;
};

const suites: Suite[] = [
  { id: 'seen', label: 'Seen', count: '200+ 任务', score: '91', note: '训练分布内，但物体位置、光照与机器人位置仍会变化。' },
  { id: 'objects', label: 'Unseen Objects', count: '280+ 中的一类', easy: '70', hard: '62', note: '新物体；hard 档包含更难抓、更少见的物体（如玩具）。' },
  { id: 'backgrounds', label: 'Unseen Backgrounds', count: '280+ 中的一类', easy: '96', hard: '48', note: '新背景；hard 档同时混入更复杂的背景与新物体。' },
  { id: 'environments', label: 'Unseen Environments', count: '280+ 中的一类', easy: '63', hard: '35', note: '新环境；easy 是厨房水槽，hard 是带显示器与配件的办公桌。' },
  { id: 'average', label: 'Unseen Average', count: '三类汇总', score: '62', note: '表 5 的 Unseen Average 行，不是把 easy/hard 两档随手平均。' },
];

const titleOf = (s: Suite) => {
  if (s.id === 'seen') return '一个分数';
  if (s.id === 'average') return '三类汇总';
  return 'easy / hard 两档';
};

// The protocol is the lesson: denominators, splits and difficulty tiers before
// comparing any success rate.
export const EvalProtocol: React.FC<WidgetProps> = () => {
  const [id, setId] = useState('objects');
  const s = suites.find((x) => x.id === id)!;
  return (
    <div>
      <Svg w={1080} h={300} label="RT-2 的评估协议与表 5 读数">
        <Pill x={18} y={12} w={220} h={24} label="约 6,000 次真实机器人评估" color={PAL.blue} size={10} />
        <T x={254} y={29} size={10} color={PAL.muted}>先看分母与难度档，再看百分比</T>

        <Card x={18} y={54} w={400} h={230} title="本次看哪一档" active color={PAL.blue}>
          <T x={36} y={104} size={16} color={PAL.ink} weight={600}>{s.label}</T>
          <Pill x={36} y={116} w={190} h={22} label={s.count} color={PAL.blue} size={9} />
          <T x={36} y={158} size={10} color={PAL.muted}>模型：RT-2-PaLI-X-55B</T>
          <T x={36} y={178} size={10} color={PAL.muted}>{titleOf(s)}</T>
          {s.easy ? (
            <>
              <T x={36} y={204} size={10} color={PAL.green}>easy</T>
              <T x={36} y={236} size={34} color={PAL.green} weight={700}>{s.easy}</T>
              <T x={36} y={254} size={9} color={PAL.muted}>成功率 %</T>
              <T x={220} y={204} size={10} color={PAL.orange}>hard</T>
              <T x={220} y={236} size={34} color={PAL.orange} weight={700}>{s.hard}</T>
              <T x={220} y={254} size={9} color={PAL.muted}>成功率 %</T>
            </>
          ) : (
            <>
              <T x={36} y={236} size={40} color={s.id === 'seen' ? PAL.green : PAL.purple} weight={700}>{s.score}</T>
              <T x={36} y={254} size={9} color={PAL.muted}>成功率 %</T>
            </>
          )}
        </Card>

        <Card x={436} y={54} w={300} h={230} title="分母与规模" color={PAL.purple} active>
          <T x={454} y={126} size={44} color={PAL.purple} weight={700}>6k</T>
          <T x={454} y={146} size={10} color={PAL.muted}>评估轨迹（约）</T>
          <Pill x={454} y={166} w={250} h={22} label="Seen 200+ 任务" color={PAL.green} size={9} />
          <Pill x={454} y={194} w={250} h={22} label="Unseen 280+ 任务" color={PAL.orange} size={9} />
          <T x={454} y={234} size={10} color={PAL.muted}>四款模型同场轮转</T>
          <T x={454} y={254} size={9} color={PAL.muted}>总量不是每模型各 6k</T>
        </Card>

        <Card x={754} y={54} w={308} h={230} title="三个不能混" color={PAL.red} active>
          {[
            ['Seen ≠ Unseen', '训练分布内与分布外'],
            ['easy ≠ hard', '两档任务不同'],
            ['6k 是总量', '论文没拆成每模型 6k'],
          ].map(([a, b], i) => (
            <g key={a}>
              <circle cx={772} cy={98 + i * 34} r={3} fill={PAL.red} />
              <T x={784} y={102 + i * 34} size={11} color={PAL.ink} weight={600}>{a}</T>
              <T x={784} y={117 + i * 34} size={9} color={PAL.muted}>{b}</T>
            </g>
          ))}
          <T x={772} y={222} size={10} color={PAL.muted}>先确认分母，再读百分比；</T>
          <T x={772} y={240} size={10} color={PAL.muted}>表 5 的 Average 是三类汇总。</T>
        </Card>
      </Svg>
      <div className="rt2-controls">
        {suites.map((x) => (
          <button key={x.id} className={`rt2-btn ${id === x.id ? 'is-active' : ''}`} onClick={() => setId(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="rt2-note">
        数值取自附录表 5 的 RT-2-PaLI-X-55B 行：Seen 91；Unseen Objects 70 / 62，Backgrounds 96 / 48，Environments 63 / 35，Unseen Average 62。
        easy 与 hard 是两档不同任务，不能合成一个数再比较；6k 是论文报告的评估总量，不是每个模型各测 6k。
      </p>
    </div>
  );
};

export default EvalProtocol;

import React, { useState } from 'react';
import { C, Cello, Mic, Meter, PageFrame, Track } from './studioKit';
import './studio.css';

// 端点取 Table 5 的 CLIP（0.1719 / 75.40）与 Base（0.0579 / 72.74）。
// 这两个数是「跨 10 个任务」的结果，不是单任务内的逐轮曲线（后者见 p3 / Fig.3）。
const NEG0 = 0.1719;
const NEG1 = 0.0579;
const ACC0 = 75.4;
const ACC1 = 72.74;

/** p1：间隙是出厂基准；跨任务累积训练把它越推越开。中间值为按任务数的线性示意。 */
export function MgGapBase() {
  const [task, setTask] = useState(0);
  const neg = NEG0 + ((NEG1 - NEG0) * task) / 10;
  const last = ACC0 + ((ACC1 - ACC0) * task) / 10;
  const drop = (NEG0 - neg) / NEG0;
  const cents = -2 - 3.2 * task;
  const tone = task <= 2 ? 'ok' : task <= 6 ? 'warn' : 'bad';
  const feedback =
    task <= 2
      ? '前两个任务：间隙还在出厂附近，旧片段还清楚。'
      : task <= 6
      ? '任务越往后，负样本被越推越远，旧磁带的高频开始发闷。'
      : `跨完 ${task} 个任务：neg 已从 0.1719 掉到 ${neg.toFixed(4)}（累计下降 ${Math.round(drop * 100)}%），Last 掉到 ${last.toFixed(2)}。`;

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`已完成 ${task} 个任务：负样本相似度 ${neg.toFixed(4)}，旧类准确率 ${last.toFixed(2)}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x="0" y="430" width="900" height="130" fill={C.light} opacity="0.45" />
          <path d="M0 430 H900" stroke={C.wood} strokeWidth="5" opacity="0.5" />
          {Array.from({ length: 11 }, (_, i) => (
            <rect key={i} x={20 + i * 80} y={26 + (i % 2) * 8} width={60} height={60} rx={7} fill={C.light} opacity={0.32} />
          ))}

          <Cello x={180} y={300} s={1} mute={task > 7} />
          <Mic x={286} y={132} s={0.9} color={C.blue} hang active={task < 8} />
          <Mic x={92} y={300} s={0.72} color={C.green} hang={false} active={task <= 2} />

          <Meter x={470} y={200} s={1.15} cents={cents} label="两轨音分差（示意）" />

          <Track x={392} y={330} w={210} h={46} color={C.blue} amp={1} gap={-0.1 * (task / 10)} seed={1} />
          <Track x={392} y={392} w={210} h={46} color={task > 6 ? C.red : C.green} amp={0.9} gap={0.02} seed={2} />
          <text x={498} y={324} textAnchor="middle" fontSize={19} fill={C.muted}>参考轨</text>
          <text x={498} y={386} textAnchor="middle" fontSize={19} fill={C.muted}>旧片段</text>

          <g>
            <text x={700} y={210} fontSize={20} fill={C.muted}>负样本相似度 neg</text>
            <rect x={700} y={222} width={160} height={20} rx={7} fill="#eef1f6" />
            <rect x={700} y={222} width={160 * (neg / 0.18)} height={20} rx={7} fill={task > 6 ? C.red : C.blue} />
            <text x={700} y={276} fontSize={29} fontWeight={700} fill={task > 6 ? C.red : C.ink}>{neg.toFixed(4)}</text>
            <text x={700} y={322} fontSize={20} fill={C.muted}>旧类 Last</text>
            <text x={700} y={362} fontSize={29} fontWeight={700} fill={task > 6 ? C.red : C.ink}>{last.toFixed(2)}%</text>
            <text x={700} y={400} fontSize={19} fill={C.muted}>neg 累计降幅 {Math.round(drop * 100)}%</text>
          </g>

          <text x={24} y={506} fontSize={20} fill={C.muted}>
            横轴是「第几任务（共 10 个）」：这是跨任务的累计变化，不是单任务内的逐轮曲线
          </text>
        </svg>
      }
      side={
        <>
          <div className="studio-panel">
            <h4>间隙不是故障，是底子</h4>
            <p style={{ margin: 0 }}>
              原始 CLIP 的两路本来就有个固定偏差；它是预训练知识的形态，不是要修掉的错误。真正的问题是：任务越往后，这个偏差被越推越大。
            </p>
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <label className="studio-muted" htmlFor="gap-task">总训练量（已完成任务数 / 共 10 个）</label>
          <input id="gap-task" className="studio-slider" type="range" min={0} max={10} step={1} value={task} onChange={(e) => setTask(Number(e.target.value))} />
          <div className="studio-src">
            端点取 Table 5 的 CLIP（neg 0.1719 / Last 75.40）与 Base（neg 0.0579 / Last 72.74），
            是跨 10 个任务的结果；中间值按任务数线性插值，属示意。单任务内的逐轮曲线见 p3 与 Fig.3，两者量级不同。
          </div>
        </>
      }
    />
  );
}

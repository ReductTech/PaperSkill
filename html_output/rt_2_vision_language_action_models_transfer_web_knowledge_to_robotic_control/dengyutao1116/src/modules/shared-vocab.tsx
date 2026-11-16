import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Pill } from './kit';

type Mode = 'text' | 'action';

const TEXT = ['把', '草莓', '放进', '正确的', '碗里'];
const ACTION = ['132', '114', '128', '5', '25', '156', '255', '256'];

const notes: Record<string, { title: string; body: string; color: string }> = {
  文本: { title: '来自网页图文', body: '这些词元在预训练时已经见过海量上下文，含义与语法都藏在同一套权重里。', color: PAL.blue },
  动作: { title: '来自机器人轨迹', body: '整数不是新词，而是 0–255 的动作 bin；模型仍用同一个 softmax 预测下一个 token。', color: PAL.orange },
  '255': { title: '夹爪编号', body: '夹爪伸展量是连续维度，也会被量化成一个离散档位，和位置增量一起写进同一条动作串。', color: PAL.green },
  '256': { title: '教学结束显示', body: '它对应离散终止命令，不占 0–255 的动作 bin；界面中的 256 用来区别普通动作编号。', color: PAL.purple },
};

// One vocabulary, two kinds of sentences. Clicking a token shows where it came
// from; the action strip keeps the 8-slot convention used in chapter 3.
export const SharedVocab: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('text');
  const [sel, setSel] = useState('把');
  const tokens = mode === 'text' ? TEXT : ACTION;
  const note = notes[sel] ?? notes[mode === 'text' ? '文本' : '动作'];
  return (
    <div>
      <Svg w={1080} h={322} label="文本词元与动作 bin 共用一张词表">
        <Card x={18} y={12} w={338} h={128} color={PAL.blue} title="文本词元">
          <Pill x={34} y={48} w={118} h={24} label="来自网页语料" color={PAL.blue} size={10} />
          <T x={34} y={94} size={12} color={PAL.ink}>把 · 草莓 · 放进 · 碗里</T>
          <T x={34} y={118} size={11} color={PAL.muted}>十亿级图文对提供的语义底盘</T>
        </Card>
        <Card x={372} y={12} w={338} h={128} color={PAL.orange} title="动作 bin">
          <Pill x={388} y={48} w={118} h={24} label="来自机器人轨迹" color={PAL.orange} size={10} />
          <T x={388} y={94} size={12} color={PAL.ink}>0 · 1 · … · 132 · … · 255</T>
          <T x={388} y={118} size={11} color={PAL.muted}>每个维度 256 格，共 7 个连续量（含夹爪）</T>
        </Card>
        <Card x={726} y={12} w={336} h={128} color={PAL.purple} title="特殊格">
          <Pill x={742} y={48} w={96} h={24} label="不占动作维度" color={PAL.purple} size={10} />
          <T x={742} y={94} size={12} color={PAL.ink}>255 = 夹爪编号 · 256 = 教学结束</T>
          <T x={742} y={118} size={11} color={PAL.muted}>教学序列中放在尾部</T>
        </Card>

        <Card x={18} y={156} w={1044} h={86} color={mode === 'text' ? PAL.blue : PAL.orange} title={mode === 'text' ? '网页样本：一句话就是一条序列' : '机器人样本：一句话也是一条序列'} active>
          {tokens.map((t, i) => {
            const chipW = mode === 'text' ? 182 : 112;
            const step = mode === 'text' ? 198 : 124;
            const x = 40 + i * step;
            const active = t === sel;
            return (
              <g key={t} onClick={() => setSel(t)} style={{ cursor: 'pointer' }}>
                <rect
                  x={x}
                  y={198}
                  width={chipW}
                  height={32}
                  rx={8}
                  fill={active ? (mode === 'text' ? '#e8f0fd' : '#fff1e5') : '#fff'}
                  stroke={active ? (mode === 'text' ? PAL.blue : PAL.orange) : PAL.line}
                  strokeWidth={active ? 1.8 : 1}
                />
                <T x={x + chipW / 2} y={219} size={mode === 'text' ? 13 : 14} color={active ? (mode === 'text' ? PAL.blue : PAL.orange) : PAL.ink} anchor="middle" weight={active ? 700 : 500}>
                  {t}
                </T>
              </g>
            );
          })}
        </Card>

        <Card x={18} y={254} w={780} h={56} color={note.color} title={note.title}>
          <T x={36} y={294} size={12} color={PAL.ink}>{note.body}</T>
        </Card>
        <Card x={814} y={254} w={248} h={56} color={PAL.green} title="关键">
          <T x={832} y={294} size={12} color={PAL.ink} weight={600}>没有新增动作输出头</T>
        </Card>
      </Svg>
      <div className="rt2-controls">
        <button className={`rt2-btn ${mode === 'text' ? 'is-active' : ''}`} onClick={() => { setMode('text'); setSel('把'); }}>看网页样本</button>
        <button className={`rt2-btn is-green ${mode === 'action' ? 'is-active' : ''}`} onClick={() => { setMode('action'); setSel('132'); }}>看机器人样本</button>
      </div>
      <p className="rt2-note">
        <b>同一套参数，两种句子。</b>词表不区分“语言 token”和“动作 token”，只区分它们出现的上下文。
      </p>
    </div>
  );
};

export default SharedVocab;

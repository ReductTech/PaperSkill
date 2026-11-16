import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

const POOL = ['类别识别', '物体编辑', 'Z 深度', '度量 3D', '深度理解', '计数', '2D 分割', '2D 排序', '部位识别', '符号识别', '区域语义', '遮挡理解', '3D 形状'];
type Stage = { name: string; title: string; what: string; fact: string; leaves: number };
const STAGES: Stage[] = [
  {
    name: '抽样描述', title: '从 7 个基准里抽问题',
    what: '用 gemini-3-flash-preview 描述每道题涉及的视觉属性与关系，例如相对深度、大小比较、遮挡。',
    fact: '7 个基准：BLINK、MM-Star、MMT-Bench、CV-Bench、RealWorldQA、MMVP、VStarBench', leaves: 3,
  },
  {
    name: '固定 schema', title: '把描述整理成固定属性表',
    what: '人工复核描述，合并成一份固定的属性 schema（键值对），用它给全部样本做一致标注。',
    fact: '固定 schema 让不同基准的题目可以用同一套属性描述', leaves: 6,
  },
  {
    name: '局部树', title: '分批长出局部任务树',
    what: '样本分成 10 个基准分层批次，每批由一个 VLM 依属性组织成局部任务树，并把样本归到最合适的叶子。',
    fact: '10 个基准分层批次', leaves: 10,
  },
  {
    name: '合并归位', title: '合并同义叶子，归入 3R，人工精修',
    what: '合并跨批次同义叶子，放进 Recognition / Reconstruction / Reorganization，再人工拆分、合并、写定义。',
    fact: '25 个理解能力 + 19 个 I2I 任务；三评审 ≥2/3 一致后保留 9,444 例', leaves: 13,
  },
];

export function S6Build(_props: WidgetProps) {
  const [stage, setStage] = useState(0);
  const [votes, setVotes] = useState<number[]>([0, 0, 1]);
  const current = STAGES[stage];
  const forCount = votes.filter((v) => v === 0).length;
  const kept = Math.max(forCount, 3 - forCount) >= 2;
  const winner = forCount >= 2 ? '计数' : '2D 排序';
  const vote = (index: number) => setVotes((prev) => prev.map((v, i) => (i === index ? 1 - v : v)));

  return (
    <div style={{ display: 'flex', gap: 24, width: 1472, height: 622 }}>
      <div style={{ flex: 1, background: C.bg, border: `2px solid ${C.line}`, borderRadius: 18, padding: '14px 18px', boxSizing: 'border-box' }}>
        <svg viewBox="0 0 830 456" width="830" height="456" role="img" aria-label={`构建第 ${stage + 1} 阶段的树状示意`}>
          <text x="8" y="24" fontSize="22" fill={C.muted}>分类结构（示意；真实叶子为 25 个理解能力）</text>
          {Array.from({ length: 9 }).map((_, index) => (
            <g key={index} opacity={stage <= 1 ? 1 : 0.3}>
              <rect x={16 + index * 26} y={40} width="22" height="26" rx="4" fill={C.woodSoft} stroke={C.wood} strokeWidth="1.4" />
            </g>
          ))}
          <text x="268" y="60" fontSize="18" fill={C.muted}>基准问题样本</text>

          {stage <= 1 && (
            <g>
              <text x="16" y="376" fontSize="19" fill={C.muted}>示例属性（固定 schema 的键）</text>
              {['相对深度', '大小比较', '遮挡关系', '朝向', '连通性'].map((name, index) => (
                <g key={name}>
                  <rect x={16 + index * 128} y={392} width="118" height="34" rx="8" fill="#fff" stroke={C.blue} strokeWidth="1.6" />
                  <text x={16 + index * 128 + 59} y={415} fontSize="18" fill={C.ink} textAnchor="middle">{name}</text>
                </g>
              ))}
              <text x="16" y="452" fontSize="17" fill={C.muted}>这些键让不同基准的题目可以用同一套属性描述。</text>
            </g>
          )}

          <rect x="330" y="86" width="160" height="44" rx="10" fill={C.woodSoft} stroke={C.wood} strokeWidth="2.5" />
          <text x="410" y="114" fontSize="22" fill={C.ink} textAnchor="middle">视觉能力</text>
          {['Recognition', 'Reconstruction', 'Reorganization'].map((family, index) => {
            const x = 40 + index * 262;
            const on = stage >= 3;
            return (
              <g key={family} opacity={on || index < 2 ? 1 : 0.4}>
                <path d={`M410 130 C410 158 ${x + 96} 148 ${x + 96} 172`} fill="none" stroke={C.envD} strokeWidth="2.5" />
                <rect x={x} y="172" width="192" height="40" rx="10" fill={on ? 'rgba(34,141,92,.10)' : '#fff'} stroke={on ? C.green : C.line} strokeWidth="2.5" />
                <text x={x + 96} y="198" fontSize="19" fill={C.ink} textAnchor="middle">{family}</text>
              </g>
            );
          })}
          {Array.from({ length: current.leaves }).map((_, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const x = 40 + col * 262 + 20;
            const y = 228 + row * 42;
            return (
              <g key={index}>
                <path d={`M${40 + col * 262 + 96} 212 V${y}`} fill="none" stroke={C.envD} strokeWidth="1.8" opacity=".55" />
                <rect x={x} y={y} width="152" height="30" rx="7" fill="#fff" stroke={stage >= 3 ? C.green : C.blue} strokeWidth="1.8" />
                <circle cx={x + 14} cy={y + 15} r="5" fill={stage >= 3 ? C.green : C.blue} />
                <text x={x + 26} y={y + 21} fontSize="16" fill={C.ink}>{POOL[index]}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ display: 'flex', gap: 10 }}>
          {STAGES.map((item, index) => {
            const active = index === stage;
            return (
              <button key={item.name} type="button" onClick={() => setStage(index)}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 22,
                  color: C.ink, background: active ? 'rgba(240,126,71,.12)' : '#fff',
                  border: `2px solid ${active ? C.orange : C.line}`,
                }}>
                <span style={{ display: 'block', fontWeight: 700 }}>{index + 1}. {item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: 580, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '18px 22px', background: '#fff', border: `2px solid ${C.blue}`, borderRadius: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.ink }}>{current.title}</div>
          <div style={{ fontSize: 23, lineHeight: 1.5, color: C.ink, marginTop: 8 }}>{current.what}</div>
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(39,68,110,.07)', fontSize: 21, color: C.blue, lineHeight: 1.45 }}>
            {current.fact}
          </div>
        </div>
        <div style={{ padding: '14px 18px', background: '#fff', border: `2px solid ${C.green}`, borderRadius: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>三评审投票：≥2 一致才保留</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {votes.map((value, index) => (
              <button key={index} type="button" onClick={() => vote(index)}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 19,
                  color: C.ink, background: value === 0 ? 'rgba(39,68,110,.10)' : 'rgba(240,126,71,.12)',
                  border: `2px solid ${value === 0 ? C.blue : C.orange}`,
                }}>
                评审 {String.fromCharCode(65 + index)}<br />
                <b>{value === 0 ? '计数' : '2D 排序'}</b>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 20, color: kept ? C.green : C.red, lineHeight: 1.4 }}>
            {kept ? `保留：${forCount}–${3 - forCount} 一致 → 归入「${winner}」` : '剔除：无人达到 2 票一致'}
          </div>
        </div>
        <div style={{ padding: '14px 18px', background: '#fff', border: `2px solid ${C.line}`, borderRadius: 16, flex: 1 }}>
          <div style={{ fontSize: 21, fontWeight: 700, color: C.ink }}>规则跑完之后的规模</div>
          <div style={{ fontSize: 21, lineHeight: 1.5, color: C.ink, marginTop: 6 }}>
            全量判定后保留 <b>9,444</b> 例。抽样人工复核 250 例、400 次评审：确定判断中 <b>97.4%</b> 与 VLM 一致，κ <b>0.956–0.989</b>（均值 0.972），四人共同复核 50 例 α = <b>0.943</b>。
          </div>
          <div style={{ fontSize: 19, color: C.muted, marginTop: 6 }}>抽样校验，不是对 9,444 例的全量人工标注。</div>
        </div>
      </div>
    </div>
  );
}

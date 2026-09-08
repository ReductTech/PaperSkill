import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const palette = {
  ink: '#243128', muted: '#647068', line: '#cbd6c6', field: '#f5f8f0', white: '#ffffff',
  blue: '#27446e', blueSoft: '#dce8f4', green: '#228d5c', greenSoft: '#dff3e9',
  orange: '#d97706', orangeSoft: '#fff0d6', purple: '#7553a6', purpleSoft: '#eee8f7',
};

type Work = {
  id: string;
  name: string;
  family: string;
  contribution: string;
  boundary: string;
  cue: string;
  tone: string;
  soft: string;
};

const works: Work[] = [
  { id: 'sora', name: 'Sora', family: '通用视频模型', contribution: '探索通过扩展视频生成走向通用物理与数字环境模拟。', boundary: '相关工作指出，这类模型主要优化开放式内容生成，并不显式建模机器人控制信号如何改变状态。', cue: '输入侧重点：开放式生成条件', tone: palette.blue, soft: palette.blueSoft },
  { id: 'svd', name: 'Stable Video Diffusion', family: '通用视频模型', contribution: '代表大规模视频生成在视觉动态先验上的进展。', boundary: '逼真的未来帧不自动等价于可控状态转移；论文未把它描述为精细机器人动作接口。', cue: '强项：视觉生成先验', tone: palette.blue, soft: palette.blueSoft },
  { id: 'hunyuan', name: 'HunyuanVideo', family: '通用视频模型', contribution: '代表大规模视频生成模型对外观、运动与场景动态的学习。', boundary: '其相关工作定位仍是视觉内容生成，而不是动作—观测逐时刻对齐的机器人模拟。', cue: '强项：开放域视觉内容', tone: palette.blue, soft: palette.blueSoft },
  { id: 'wan', name: 'Wan', family: '通用视频模型', contribution: '提供可复用的视频生成先验；BWM 的报告实现由 Wan2.2-TI2V-5B 初始化。', boundary: '基础视频模型本身没有提供 BWM 所需的精细机器人动作控制与状态化滚动接口。', cue: '与 BWM 的关系：通用先验起点', tone: palette.blue, soft: palette.blueSoft },
  { id: 'gamengen', name: 'GameNGen', family: '交互式环境', contribution: '根据过去画面与玩家动作预测下一游戏帧，支持实时交互。', boundary: '论文将其归为游戏环境；输入接口不是与机器人—物体精细交互对齐的机器人动作轨迹。', cue: '接口：玩家动作', tone: palette.purple, soft: palette.purpleSoft },
  { id: 'genie', name: 'Genie', family: '交互式环境', contribution: '从文本提示生成可导航动态世界，并支持可提示的世界事件。', boundary: '导航命令或文本事件主要控制视点与全局变化，不等同于高精度机器人动作序列。', cue: '接口：导航 / 文本事件', tone: palette.purple, soft: palette.purpleSoft },
  { id: 'irasim', name: 'IRASim', family: '机器人动作条件模型', contribution: '使用历史观测与机器人动作轨迹，并在 Transformer 块中加入帧级动作条件以加强动作—帧对齐。', boundary: '它代表机器人动作条件路线；论文进一步指出，这类系统的预训练路线会增加世界模拟器的总体构建成本。', cue: '接口：时间对齐机器人动作', tone: palette.orange, soft: palette.orangeSoft },
  { id: 'cosmos', name: 'Cosmos-Predict 2.5', family: '机器人动作条件模型', contribution: '把大规模视频预训练通过机器人特定后训练适配到动作条件预测。', boundary: '复用大规模预训练带来能力，也构成总体训练与适配成本的一部分；此处不推断具体成本数值。', cue: '路线：视频预训练 + 机器人后训练', tone: palette.orange, soft: palette.orangeSoft },
  { id: 'ctrl', name: 'Ctrl-World', family: 'VLA 数据引擎', contribution: '结合多视角预测、姿态条件记忆检索与帧级动作条件，生成用于监督策略改进的成功轨迹。', boundary: '论文把它列作数据引擎代表；现有研究常只评一个下游任务或功能角色，不能据此视为多功能综合评测。', cue: '功能：合成成功轨迹', tone: palette.green, soft: palette.greenSoft },
];

const needs = [
  { id: 'visual', label: '通用视觉先验' },
  { id: 'robot', label: '精细机器人动作' },
  { id: 'state', label: '状态化 rollout' },
  { id: 'cost', label: '低成本领域适配' },
  { id: 'multi', label: '多功能综合评测' },
] as const;

type NeedId = (typeof needs)[number]['id'];

const families = [
  { name: '通用视频模型', fit: ['visual'] as NeedId[], note: '适合作为视觉先验；不是精细机器人控制接口。' },
  { name: '交互式环境', fit: ['visual', 'state'] as NeedId[], note: '支持用户输入，但报告接口多为玩家动作、导航或文本。' },
  { name: '机器人动作条件模型', fit: ['visual', 'robot', 'state'] as NeedId[], note: '最接近动作轨迹模拟；类别内部训练路线与功能覆盖不同。' },
  { name: 'BWM', fit: ['visual', 'robot', 'state', 'cost', 'multi'] as NeedId[], note: '论文定位：通用视频先验 + 领域后训练，并验证 Data Engine 与 Policy Evaluator。' },
];

const matrices = [
  ['通用视频模型', '非设计目标', '视觉生成先验', '未统一报告', '未统一审计'],
  ['交互式环境', '玩家 / 导航 / 文本', '类别内不同', '未统一报告', '未统一审计'],
  ['机器人动作条件模型', '机器人动作轨迹', '类别内不同', '论文称总体成本较高', '未统一审计'],
  ['BWM', '绝对 EEF 位姿动作', 'x₀ + 动态历史', '论文定位为低成本适配', '论文声明开源；细节见第10章'],
];

const panel: React.CSSProperties = { border: `1px solid ${palette.line}`, borderRadius: 14, background: palette.white, padding: 16 };

function Timeline() {
  const [selected, setSelected] = useState('sora');
  const active = works.find((work) => work.id === selected) ?? works[0];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...panel, overflowX: 'auto' }}>
        <div style={{ minWidth: 920, display: 'grid', gridTemplateColumns: `repeat(${works.length}, 1fr)`, alignItems: 'start', position: 'relative', paddingTop: 8 }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: 34, right: 34, top: 29, height: 2, background: palette.line }} />
          {works.map((work, index) => {
            const on = work.id === selected;
            return (
              <button key={work.id} type="button" onClick={() => setSelected(work.id)} aria-pressed={on} style={{ position: 'relative', border: 0, background: 'transparent', color: palette.ink, cursor: 'pointer', padding: '0 5px', font: 'inherit' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, margin: '0 auto 9px', borderRadius: '50%', color: on ? palette.white : work.tone, background: on ? work.tone : work.soft, border: `2px solid ${work.tone}`, fontWeight: 800 }}>{index + 1}</span>
                <strong style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>{work.name}</strong>
                <small style={{ color: palette.muted, fontSize: 10 }}>{work.family}</small>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ ...panel, borderColor: active.tone, background: active.soft, display: 'grid', gridTemplateColumns: 'minmax(150px,.55fr) minmax(240px,1fr) minmax(240px,1fr)', gap: 14 }}>
        <div><small style={{ color: active.tone, fontWeight: 800 }}>{active.family}</small><h4 style={{ margin: '6px 0 8px', color: palette.ink }}>{active.name}</h4><span style={{ fontSize: 12, color: active.tone, fontWeight: 700 }}>{active.cue}</span></div>
        <div><b style={{ color: palette.green, fontSize: 12 }}>论文中的推进</b><p style={{ margin: '7px 0 0', color: palette.ink, lineHeight: 1.65 }}>{active.contribution}</p></div>
        <div><b style={{ color: palette.orange, fontSize: 12 }}>仍需注意的边界</b><p style={{ margin: '7px 0 0', color: palette.ink, lineHeight: 1.65 }}>{active.boundary}</p></div>
      </div>
      <small style={{ color: palette.muted }}>时间线表示论文相关工作的概念推进，不代表严格发表先后或性能排名。</small>
    </div>
  );
}

function Recommender() {
  const [selected, setSelected] = useState<NeedId[]>(['robot', 'state']);
  const ranked = useMemo(() => families.map((family) => ({ ...family, score: selected.filter((id) => family.fit.includes(id)).length })).sort((a, b) => b.score - a.score), [selected]);
  const best = ranked[0];
  const toggle = (id: NeedId) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={panel}>
        <b style={{ color: palette.ink }}>先勾选你要解决的问题</b>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {needs.map((need) => {
            const on = selected.includes(need.id);
            return <button key={need.id} type="button" onClick={() => toggle(need.id)} aria-pressed={on} style={{ border: `1px solid ${on ? palette.orange : palette.line}`, borderRadius: 999, padding: '8px 12px', background: on ? palette.orangeSoft : palette.white, color: on ? palette.orange : palette.ink, fontWeight: 700, cursor: 'pointer' }}>{on ? '✓ ' : '+ '}{need.label}</button>;
          })}
        </div>
      </div>
      <div style={{ ...panel, display: 'grid', gridTemplateColumns: 'minmax(180px,.55fr) 1fr', gap: 18, borderColor: palette.green }}>
        <div><small style={{ color: palette.green, fontWeight: 800 }}>类别级匹配结果</small><h4 style={{ margin: '6px 0', color: palette.ink }}>{selected.length ? best.name : '请至少选择一项需求'}</h4><div style={{ color: palette.muted, fontSize: 12 }}>{selected.length ? `匹配 ${best.score} / ${selected.length} 个所选维度` : '推荐器尚未启动'}</div></div>
        <p style={{ margin: 0, lineHeight: 1.65, color: palette.ink }}>{selected.length ? best.note : '点击上方需求芯片；结果仅说明论文分类中哪条技术路线最接近需求。'}</p>
      </div>
      <div style={{ ...panel, overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', color: palette.ink, fontSize: 12 }}>
          <thead><tr>{['方法类别', '动作接口', '状态保持设计', '成本表述', '开源信息'].map((head) => <th key={head} style={{ textAlign: 'left', padding: 10, borderBottom: `2px solid ${palette.line}`, color: palette.muted }}>{head}</th>)}</tr></thead>
          <tbody>{matrices.map((row) => <tr key={row[0]} style={{ background: row[0] === 'BWM' ? palette.greenSoft : palette.white }}>{row.map((cell, index) => <td key={cell} style={{ padding: 10, borderBottom: `1px solid ${palette.line}`, fontWeight: index === 0 ? 800 : 500 }}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <small style={{ color: palette.muted }}>“未统一报告 / 未统一审计”不是否定项：§2 没有按同一协议逐项核验所有模型的成本与仓库状态。BWM 的当前复现边界在第 10 章单独核对。</small>
    </div>
  );
}

export const BwmRelatedWork: React.FC<WidgetProps> = ({ moduleId }) => moduleId === '2.1' ? <Timeline /> : <Recommender />;

export default BwmRelatedWork;

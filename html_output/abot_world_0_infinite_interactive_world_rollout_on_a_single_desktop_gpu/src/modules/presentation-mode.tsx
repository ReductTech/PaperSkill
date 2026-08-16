import React, { useEffect, useState } from 'react';
import { tutorial } from '../data/tutorial';
import { ActionIdentityDemo } from './action-identity-split';
import { PresentationActTwo } from './presentation-act-two';

const ACTS = [
  { index: 1, time: '约 40 秒', title: '研究问题与四项贡献' },
  { index: 2, time: '', title: '因果自滚动与 LongForcing' },
  { index: 3, time: '约 70 秒', title: 'Action、Identity 与教师/学生' },
  { index: 4, time: '约 40 秒', title: '单卡部署与结果边界' },
];

function ActOne() {
  return <div className="act-body">
    <div className="presentation-problem">
      <span>研究问题</span>
      <strong>漂亮短片 ≠ 可持续、可控制、可实时运行的交互世界</strong>
      <p>输出会成为下一轮输入，因此控制、长时稳定、延迟和显存必须在同一个闭环中成立。</p>
    </div>
    <div className="presentation-pillars">
      {tutorial.hero.pillars.map((pillar) => <div key={pillar.index}><span>{pillar.index}</span><strong>{pillar.title}</strong><p>{pillar.desc}</p></div>)}
    </div>
    <div className="speaker-cue">一句话带走：ABot-World-0 的贡献是数据、模型训练与部署的整栈协同，不只是一个新损失。</div>
  </div>;
}

function ActTwo() {
  return <PresentationActTwo />;
}

function ActThree() {
  return <div className="act-body">
    <ActionIdentityDemo compact />
    <div className="teacher-student-summary">
      <div><span>双向教师</span><strong>可读取完整时域</strong><p>提供高质量、全局一致的训练目标，不能直接用于在线自回归部署。</p></div>
      <div className="summary-arrow">蒸馏 →</div>
      <div><span>因果学生</span><strong>只能读取过去</strong><p>信息结构匹配在线闭环，并经过少步化与长期分布修正。</p></div>
    </div>
  </div>;
}

const DEPLOYMENT_ANCHORS = [
  { name: 'Base', value: 'OOM', note: '完整管线无法装入显存', tone: 'bad' },
  { name: '+ LightVAE', value: '9.117 FPS', note: '首个可运行配置 · 20.491 GiB', tone: '' },
  { name: '+ FP8', value: '12.405 FPS', note: '质量导向默认点 · 15.925 GiB', tone: 'good' },
  { name: '+ MXFP4 + Fast-RoPE', value: '15.831 FPS', note: '低比特吞吐上沿 · 17.148 GiB', tone: 'good' },
];

function ActFour() {
  return <div className="act-body">
    <div className="deployment-staircase">
      {DEPLOYMENT_ANCHORS.map((item, index) => <React.Fragment key={item.name}>
        <div className={`deployment-anchor ${item.tone}`}><span>{item.name}</span><strong>{item.value}</strong><small>{item.note}</small></div>
        {index < DEPLOYMENT_ANCHORS.length - 1 ? <i>→</i> : null}
      </React.Fragment>)}
    </div>
    <div className="hero-metrics presentation-metrics">
      {tutorial.hero.metrics.map((metric) => <div key={metric.value}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
    </div>
    <p className="condition-note">{tutorial.hero.conditions}</p>
    <div className="result-boundary">
      <strong>结果边界</strong>
      <p>WorldRoamBench 显示 ABot-World-0 在动作、轨迹、视觉、物理与记忆子指标上具有竞争力，但不是所有指标第一；60 秒 LongForcing 消融也不等于无限时长稳定保证。</p>
    </div>
    <details className="deep-reading">
      <summary>深入阅读：Table 2 完整配置</summary>
      <div className="table-scroll"><table className="paper"><thead><tr><th>配置</th><th>DiT ms/chunk</th><th>VAE ms/chunk</th><th>FPS ↑</th><th>VRAM GiB ↓</th></tr></thead><tbody>
        <tr><td>Base</td><td>—</td><td>—</td><td>OOM</td><td>OOM</td></tr>
        <tr><td>+ SageAttention2</td><td>—</td><td>—</td><td>OOM</td><td>OOM</td></tr>
        <tr><td>+ LightVAE</td><td>1191.081</td><td>78.276</td><td>9.117</td><td>20.491</td></tr>
        <tr><td>+ FP8</td><td>845.180</td><td>75.980</td><td>12.405</td><td>15.925</td></tr>
        <tr><td>+ FP8 + Fast-RoPE</td><td>786.871</td><td>71.730</td><td>13.269</td><td>19.281</td></tr>
        <tr><td>+ MXFP6 + Fast-RoPE</td><td>718.281</td><td>85.994</td><td>14.098</td><td>18.287</td></tr>
        <tr><td>+ MXFP4 + Fast-RoPE</td><td>638.843</td><td>72.957</td><td>15.831</td><td>17.148</td></tr>
      </tbody></table></div>
    </details>
  </div>;
}

export function PresentationMode({ onOpenTutorial }: { onOpenTutorial: () => void }) {
  const [act, setAct] = useState(0);
  const selected = ACTS[act];
  useEffect(() => {
    document.getElementById('presentation-mode')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [act]);

  return (
    <section id="presentation-mode" className="presentation-mode" data-testid="presentation-mode" data-act={act + 1}>
      <div className="presentation-header">
        <div><span>4 分钟汇报模式</span><h2>第 {selected.index} 幕 · {selected.title}</h2></div>
        {selected.time ? <strong>{selected.time}</strong> : null}
      </div>
      <div className="act-progress" aria-label="汇报进度">
        {ACTS.map((item, index) => <button type="button" key={item.index} onClick={() => setAct(index)} className={index === act ? 'active' : index < act ? 'done' : ''}><span>{item.index}</span><small>{item.title}</small></button>)}
      </div>
      {act === 0 ? <ActOne /> : null}
      {act === 1 ? <ActTwo /> : null}
      {act === 2 ? <ActThree /> : null}
      {act === 3 ? <ActFour /> : null}
      <div className="presentation-nav">
        <button type="button" className="secondary-action" disabled={act === 0} onClick={() => setAct((value) => Math.max(0, value - 1))}>上一幕</button>
        {act < ACTS.length - 1
          ? <button type="button" className="primary-action" data-testid="presentation-next" onClick={() => setAct((value) => value + 1)}>进入下一幕 →</button>
          : <button type="button" className="primary-action" data-testid="open-tutorial" onClick={onOpenTutorial}>进入完整教程 →</button>}
      </div>
    </section>
  );
}

import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const box: React.CSSProperties = {
  margin: '10px 0 12px',
  padding: '12px 14px',
  background: '#fff',
  border: '1px solid #d7deea',
  borderRadius: 8,
  color: '#27446e',
  fontFamily: '"Cambria Math", Georgia, serif',
  fontSize: 20,
  fontWeight: 700,
  lineHeight: 1.7,
  overflowX: 'auto',
};

function Formula({ children }: { children: React.ReactNode }) {
  return <div style={box}>{children}</div>;
}

export const Ch6Eq1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [scores, setScores] = useState([0.2, 0.4, 0.7, 0.9]);
  const H = useMemo(() => scores.reduce((a, b) => a + b, 0) / scores.length, [scores]);

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <Formula>
        H(˜p) = 𝔼<sub>y ∼ P<sub>M</sub>( · | ˜p )</sub> [ h(y) ]
        <span style={{ marginLeft: 10, fontSize: 14, color: '#68778f' }}>（1）</span>
      </Formula>
      <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.65 }}>
        目标模型 M 把提示 ˜p 映射为回答分布 P<sub>M</sub>(y | ˜p)。评判器 h : 𝒴 → [0, 1] 给每个回答一个有害分。H(˜p) 是这条提示的<strong>期望危害</strong>——还不是训练目标。
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#68778f' }}>
        下面用 4 个样本近似期望：拖动 h(y<sub>i</sub>)，均值就是 H(˜p) 的蒙特卡洛估计。
      </p>
      {scores.map((s, i) => (
        <div className="ctrl" key={i} style={{ marginBottom: 4 }}>
          <label>
            h(y<sub>{i + 1}</sub>) <span className="val">{s.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(s * 100)}
            onChange={(e) => {
              const next = [...scores];
              next[i] = Number(e.target.value) / 100;
              setScores(next);
            }}
          />
        </div>
      ))}
      <div className="opt-card good">
        <div className="opt-kicker">样本均值 ≈ 期望</div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#27446e' }}>
          H(˜p) ≈ (h<sub>1</sub>+h<sub>2</sub>+h<sub>3</sub>+h<sub>4</sub>)/4 = {H.toFixed(3)}
        </p>
      </div>
      <div className="feedback">
        黑盒设定下只能看到解码输出 y，不能对 M 反传。式 (1) 只定义「这一条提示有多有害」。
      </div>
    </div>
  );
};

export const Ch6Eq2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [view, setView] = useState<'one' | 'avg'>('one');

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <Formula>
        max<sub>θ</sub> (1 / |ℬ|) ∑<sub>b ∈ ℬ</sub> 𝔼<sub>p ∼ A<sub>θ</sub>( · | b ), y ∼ P<sub>M</sub>( · | p )</sub> [ h(b, y) ]
        <span style={{ marginLeft: 10, fontSize: 14, color: '#68778f' }}>（2）</span>
      </Formula>
      <div className="chip-row">
        <button type="button" className={`chip${view === 'one' ? ' selected' : ''}`} onClick={() => setView('one')}>
          单个行为 b
        </button>
        <button type="button" className={`chip${view === 'avg' ? ' selected' : ''}`} onClick={() => setView('avg')}>
          对行为集 ℬ 平均
        </button>
      </div>
      <div className={`opt-card ${view === 'avg' ? 'good' : 'mid'}`} style={{ marginTop: 12 }}>
        <div className="opt-kicker">{view === 'one' ? '内层：一个行为上的期望危害' : '外层：在 ℬ 上对 θ 最大化'}</div>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.65 }}>
          {view === 'one'
            ? 'A_θ 实例化为 LLaDA-8B-Base：按行为 b 条件化，迭代去掩码采样对抗提示 p。再把 p 送进黑盒 M 得到 y，用 h(b, y) 打分。这一项度量「在行为 b 上能诱发多少期望危害」。'
            : 'ℬ 是有害行为数据集。IHO 对每个目标只训一个检查点，在全部训练行为上平均，而不是每个行为单独优化。一次训练覆盖多次部署。'}
        </p>
      </div>
      <div className="feedback">
        式 (2) 才是要优化的目标。离散采样与不可微防御流水线让它无法对 θ 直接求导——所以才需要式 (3)。
      </div>
    </div>
  );
};

export const Ch6Eq3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [part, setPart] = useState<'pair' | 'loss' | 'loop'>('pair');

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <Formula>
        ℒ<sub>DPO</sub>(θ) = −𝔼<sub>(p⁺, p⁻) ∼ 𝒫</sub>
        <span style={{ display: 'inline-block', marginTop: 6 }}>
          [ log σ( β [ log (π<sub>θ</sub>(p⁺) / π<sub>θ₀</sub>(p⁺)) − log (π<sub>θ</sub>(p⁻) / π<sub>θ₀</sub>(p⁻)) ] ) ]
        </span>
        <span style={{ marginLeft: 10, fontSize: 14, color: '#68778f' }}>（3）</span>
      </Formula>
      <div className="chip-row">
        <button type="button" className={`chip${part === 'pair' ? ' selected' : ''}`} onClick={() => setPart('pair')}>
          偏好对 p⁺ / p⁻
        </button>
        <button type="button" className={`chip${part === 'loss' ? ' selected' : ''}`} onClick={() => setPart('loss')}>
          损失里的符号
        </button>
        <button type="button" className={`chip${part === 'loop' ? ' selected' : ''}`} onClick={() => setPart('loop')}>
          LoRA 与多周期
        </button>
      </div>
      <div className={`opt-card ${part === 'loop' ? 'good' : ''}`} style={{ marginTop: 12 }}>
        <div className="opt-kicker">
          {part === 'pair' ? '用偏好代理式 (2)' : part === 'loss' ? '相对参考模型的对数比' : '间接危害优化'}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.65 }}>
          {part === 'pair'
            ? '诱发高分回答的提示为 chosen p⁺，低分为 rejected p⁻，组成偏好集 𝒫。不再对 H 求导，而是让攻击器更常生成 p⁺、更少生成 p⁻。'
            : part === 'loss'
              ? 'π_θ 是当前策略，π_θ₀ 是冻结参考模型。β 控制相对 π_θ₀ 的 KL 惩罚。σ 是 logistic。损失下降意味着 π_θ(p⁺) 相对 π_θ(p⁻) 变大。'
              : '实践中 θ 是冻结基座上的 LoRA：基座同时作为 π_θ₀ 与 π_θ 的初始化。DPO 多周期重复，每周期用改进后的攻击器重采样偏好；留出集平均评判分不再提升则早停。A_θ 经 DPO 间接对准危害，故称 IHO。'}
        </p>
      </div>
      <div className={`feedback ${part === 'loop' ? 'good' : ''}`}>
        {part === 'loop'
          ? '「间接」：优化的是偏好损失，对齐的是评判器度量的危害。'
          : '点选三块，把式 (3) 拆开看；流水线细节放到第 7 章。'}
      </div>
    </div>
  );
};

export const Ch6Mod1 = Ch6Eq1;
export default Ch6Eq1;

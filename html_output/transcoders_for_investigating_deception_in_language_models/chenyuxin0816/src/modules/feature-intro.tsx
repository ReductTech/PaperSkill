import { useState, type CSSProperties } from 'react';
import '../styles/feature-intro.css';

function activationState(value: number) {
  if (value === 0) return { tone: 'off', label: '未激活', contribution: '当前贡献为 0' };
  if (value < 10) return { tone: 'off', label: '几乎未激活', contribution: '当前贡献很弱' };
  if (value < 40) return { tone: 'low', label: '弱激活', contribution: '当前贡献较弱' };
  if (value < 75) return { tone: 'medium', label: '中等激活', contribution: '当前贡献随激活增强' };
  return { tone: 'high', label: '强激活', contribution: '当前贡献较强' };
}

export function FeatureIntro() {
  const [activation, setActivation] = useState(25);
  const state = activationState(activation);
  const normalized = (activation / 100).toFixed(2);
  const dynamicStyle = {
    '--fi-level': activation + '%',
    '--fi-opacity': String(0.18 + activation * 0.0082),
  } as CSSProperties;

  return (
    <div className={'feature-intro is-' + state.tone} style={dynamicStyle}>
      <div className="fi-definition">
        <span>教学理解：检测方向 + 写入方向</span>
        <strong>
          可以把一个 Feature 看作 Transcoder 中的小计算单元：检测输入模式，产生激活，再向层输出写入变化。
        </strong>
      </div>

      <div className="fi-workbench">
        <div className="fi-flow" aria-label="一个Feature从检测输入到写入输出贡献的计算过程">
          <section className="fi-flow-node fi-input-node">
            <span>当前输入</span>
            <strong>h</strong>
            <small>送入这一层 MLP 的内部表示</small>
          </section>

          <i className="fi-flow-arrow" aria-hidden="true">→</i>

          <section className="fi-flow-node fi-detector-node">
            <span>固定部分 1</span>
            <strong>Encoder vector</strong>
            <code>w<sub>enc,i</sub></code>
            <small>计算 h 与检测方向的匹配程度，得到激活 x</small>
          </section>

          <i className="fi-flow-arrow" aria-hidden="true">→</i>

          <section className="fi-flow-node fi-activation-node" aria-live="polite">
            <span>随输入变化</span>
            <strong>激活强度 x<sub>i</sub></strong>
            <div className="fi-activation-meter" aria-hidden="true"><i /></div>
            <b>x<sub>i</sub> = {normalized}</b>
            <small>{state.label}</small>
          </section>

          <i className="fi-flow-arrow" aria-hidden="true">→</i>

          <section className="fi-flow-node fi-writer-node">
            <span>固定部分 2</span>
            <strong>Decoder vector</strong>
            <code>d<sub>i</sub></code>
            <small>决定激活后向层输出写入哪个方向</small>
          </section>

          <i className="fi-flow-arrow" aria-hidden="true">→</i>

          <section className="fi-flow-node fi-contribution-node" aria-live="polite">
            <span>当前 Feature i 的贡献</span>
            <strong>Δŷ<sub>i</sub> = {normalized} · d<sub>i</sub></strong>
            <div className="fi-contribution-vector" aria-hidden="true"><i /></div>
            <code className="fi-total-equation">ŷ = b<sub>dec</sub> + Σ<sub>j</sub> Δŷ<sub>j</sub></code>
            <small>{state.contribution}，方向不变</small>
          </section>
        </div>

        <div className="fi-control">
          <label htmlFor="feature-activation">
            <span>改变当前 Feature 的激活强度</span>
            <output htmlFor="feature-activation">x<sub>i</sub> = {normalized}</output>
          </label>
          <input
            id="feature-activation"
            type="range"
            min="0"
            max="100"
            step="1"
            value={activation}
            onChange={(event) => setActivation(Number(event.target.value))}
            aria-label="当前Feature的归一化教学激活强度"
          />
          <div className="fi-control-scale" aria-hidden="true">
            <span>未激活 · 不写入贡献</span>
            <b>归一化教学示意</b>
            <span>强激活 · 写入贡献增强</span>
          </div>
        </div>
      </div>

      <div className="fi-facts">
        <section>
          <span>Feature 本体 · 固定</span>
          <strong>检测方向 w<sub>enc,i</sub> + 写入方向 d<sub>i</sub></strong>
          <p>Transcoder 训练完成后，这组参数固定不变。</p>
        </section>
        <section>
          <span>当前激活 · 可变</span>
          <strong>x<sub>i</sub> = {normalized}</strong>
          <p>不同 Prompt 和 token 会让同一个 Feature 产生不同激活。</p>
        </section>
        <section className="fi-paper-example">
          <span>论文中的真实示例</span>
          <strong>Layer 23 · Feature #119106</strong>
          <p><b>Obscuring information</b> 是人类可读解释；<code>Layer + Index</code> 才是地址。</p>
        </section>
      </div>

      <p className="fi-boundary">
        教学简化：实际 Transcoder 还包含非线性激活；滑杆只解释 x<sub>i</sub> 与 Δŷ<sub>i</sub> = x<sub>i</sub>d<sub>i</sub> 的关系，不代表某条 Prompt 的实测值。本文直接使用预训练 PLT。
      </p>
    </div>
  );
}

export default FeatureIntro;

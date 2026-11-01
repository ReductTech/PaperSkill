import { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const GROUPS = ['图像 patch', '提示 ℓ', '本体状态 q', 'FAST 动作 token', '动作专家 token'];

// rows = query, cols = key. true = 可以看见
const MASK: boolean[][] = [
  [true, true, true, false, false],
  [true, true, true, false, false],
  [true, true, true, false, false],
  [true, true, true, true, false],
  [true, true, true, false, true],
];

const EXPLAIN = [
  '图像 patch 只在前缀内部双向看，看不到任何动作 token。',
  '提示 ℓ 同样只在前缀内互看。',
  '本体状态 q 被离散成文本 token，也在前缀里。',
  'FAST 动作 token 看前缀，并按自回归看之前的 FAST token。',
  '动作专家看前缀、也看彼此，但看不到 FAST token —— 信息从 VLM 单向流向动作专家。',
];

export function AttentionDual(_: { chapterId: string; moduleId: string }) {
  const [row, setRow] = useState(3);
  const [alpha, setAlpha] = useState(10);

  const ce = 1;
  const fm = alpha * 0.55;
  const total = ce + fm;
  const cePct = Math.round((ce / total) * 100);
  const fmPct = 100 - cePct;

  return (
    <div className="pi-split">
      <div className="pi-left">
        <p className="pi-body">点一行，看这一组 token 能看见谁。</p>
        <div className="pi-mask">
          <div className="pi-mask-corner" />
          {GROUPS.map((g) => (
            <div key={`h-${g}`} className="pi-mask-head">
              {g}
            </div>
          ))}
          {GROUPS.map((g, r) => (
            <div key={g} className="pi-mask-rowwrap" style={{ display: 'contents' }}>
              <button
                className={`pi-mask-head pi-mask-row${r === row ? ' is-sel' : ''}`}
                onClick={() => setRow(r)}
                aria-pressed={r === row}
              >
                {g}
              </button>
              {GROUPS.map((h, c) => (
                <div
                  key={`${g}-${h}`}
                  className={`pi-mask-cell${MASK[r][c] ? ' is-on' : ' is-off'}${r === row ? ' is-active-row' : ''}`}
                  title={MASK[r][c] ? '可以看见' : '看不见'}
                >
                  {MASK[r][c] ? '✓' : '–'}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="pi-feedback" style={{ color: '#27446e' }}>{EXPLAIN[row]}</p>
      </div>

      <div className="pi-right">
        <p className="pi-body">
          训练目标里两项的相对分量由{' '}
          <SymbolHint meaning="交叉熵项与流匹配项的权衡权重；后训练取 10.0。">α</SymbolHint> 控制。
        </p>
        <p className="pi-formula">
          H(x, f<sup>ℓ</sup>) + α · ‖ω − a<sub>t:t+H</sub> − f<sup>a</sup>(a<sup>τ,ω</sup>, o, ℓ)‖²
        </p>
        <label className="pi-slider pi-slider-wide">
          <span>α</span>
          <input type="range" min={0} max={10} step={0.5} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
          <b>{alpha.toFixed(1)}</b>
        </label>
        <div className="pi-bars">
          <div className="pi-bar">
            <span className="pi-bar-label">交叉熵项（文本 / FAST token）</span>
            <span className="pi-w-bar"><span style={{ width: `${cePct}%`, background: '#27446e' }} /></span>
            <span className="pi-w-val">{cePct}%</span>
          </div>
          <div className="pi-bar">
            <span className="pi-bar-label">α × 流匹配项（动作专家）</span>
            <span className="pi-w-bar"><span style={{ width: `${fmPct}%`, background: '#228d5c' }} /></span>
            <span className="pi-w-val">{fmPct}%</span>
          </div>
        </div>
        <p className="pi-feedback" style={{ color: alpha === 0 ? '#68778f' : '#228d5c' }}>
          {alpha === 0
            ? 'α = 0：纯 VLM 式的预训练，只训文本与离散 token —— 这就是第一阶段的状态。'
            : alpha === 10
            ? 'α = 10.0：论文后训练的实际设置（80k 步），此前是 280k 步的纯离散预训练。'
            : '两项同时在训：语言能力被保住，动作精度在提升。'}
        </p>
        <p className="pi-note">条形按 α 线性换算是示意，不是论文报告的损失曲线。</p>
      </div>
    </div>
  );
}

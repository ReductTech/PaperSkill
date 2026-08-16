import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type TokenKind = 'text' | 'image' | 'special';
type TokenCell = {
  label: string;
  kind: TokenKind;
  confidence: number;
  alternatives: [string, string];
};

const BLOCKS: TokenCell[][] = [
  [
    { label: 'V₁', kind: 'image', confidence: .97, alternatives: ['V₇', 'V₁₂'] },
    { label: 'V₂', kind: 'image', confidence: .93, alternatives: ['V₅', 'V₉'] },
    { label: '问题', kind: 'text', confidence: .96, alternatives: ['图像', '回答'] },
    { label: '图中', kind: 'text', confidence: .94, alternatives: ['画面', '照片'] },
  ],
  [
    { label: '有', kind: 'text', confidence: .96, alternatives: ['是', '出现'] },
    { label: '三只', kind: 'text', confidence: .88, alternatives: ['两只', '几只'] },
    { label: '白色', kind: 'text', confidence: .81, alternatives: ['灰色', '小小的'] },
    { label: '鸟', kind: 'text', confidence: .92, alternatives: ['猫', '动物'] },
  ],
  [
    { label: '停在', kind: 'text', confidence: .89, alternatives: ['站在', '飞过'] },
    { label: '树枝', kind: 'text', confidence: .84, alternatives: ['屋顶', '草地'] },
    { label: '上', kind: 'text', confidence: .95, alternatives: ['旁', '中'] },
    { label: '。', kind: 'special', confidence: .98, alternatives: ['，', '！'] },
  ],
];

const DEFAULT_MASKS = [
  [true, false, true, false],
  [true, true, false, true],
  [true, false, true, true],
];

const MASK_RATES = [25, 50, 75, 100] as const;

function buildMask(rate: number, salt = 0): boolean[] {
  const count = Math.max(1, Math.round(4 * rate / 100));
  const order = [2, 0, 3, 1].map(index => (index + salt) % 4);
  return Array.from({ length: 4 }, (_, index) => order.slice(0, count).includes(index));
}

function logLoss(probability: number) {
  return -Math.log(Math.max(.01, probability));
}

export const UnifiedTokenDiffusion: React.FC<WidgetProps> = () => {
  const [currentBlock, setCurrentBlock] = useState(1);
  const [maskRate, setMaskRate] = useState<(typeof MASK_RATES)[number]>(75);
  const [masks, setMasks] = useState<boolean[][]>(DEFAULT_MASKS);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [showAllTerms, setShowAllTerms] = useState(true);
  const [round, setRound] = useState(0);
  const [activeCommand, setActiveCommand] = useState<'reset' | 'random' | 'recover'>('recover');

  const currentMask = masks[currentBlock];
  const maskedIndices = useMemo(
    () => currentMask.map((masked, index) => masked ? index : -1).filter(index => index >= 0),
    [currentMask],
  );
  const activeIndex = currentMask[selectedIndex] ? selectedIndex : (maskedIndices[0] ?? selectedIndex);
  const activeToken = BLOCKS[currentBlock][activeIndex];

  const probabilities = useMemo(() => {
    const contextBonus = currentBlock * .015;
    const maskPenalty = Math.max(0, maskedIndices.length - 1) * .025;
    return BLOCKS[currentBlock].map(token =>
      Math.max(.52, Math.min(.98, token.confidence + contextBonus - maskPenalty)),
    );
  }, [currentBlock, maskedIndices.length]);

  const lossTerms = maskedIndices.map(index => logLoss(probabilities[index]));
  const totalLoss = lossTerms.reduce((sum, term) => sum + term, 0);
  const maskSet = maskedIndices.length
    ? maskedIndices.map(index => `(${currentBlock + 1},${index + 1})`).join(', ')
    : '∅';

  const applyMask = (nextMask: boolean[], nextRate = maskRate) => {
    setMasks(previous => previous.map((blockMask, index) => index === currentBlock ? nextMask : blockMask));
    const firstMasked = nextMask.findIndex(Boolean);
    if (firstMasked >= 0) setSelectedIndex(firstMasked);
    setMaskRate(nextRate);
    setRound(0);
  };

  const resetMask = () => {
    setActiveCommand('reset');
    applyMask([...DEFAULT_MASKS[currentBlock]], 75);
  };

  const randomizeMask = () => {
    setActiveCommand('random');
    const count = Math.max(1, Math.round(4 * maskRate / 100));
    const ranked = [0, 1, 2, 3]
      .map(index => ({ index, value: Math.random() }))
      .sort((a, b) => a.value - b.value)
      .slice(0, count)
      .map(item => item.index);
    applyMask(Array.from({ length: 4 }, (_, index) => ranked.includes(index)));
  };

  const recoverConfident = () => {
    if (!maskedIndices.length) return;
    setActiveCommand('recover');
    const recover = [...maskedIndices]
      .sort((a, b) => probabilities[b] - probabilities[a])
      .slice(0, Math.min(2, maskedIndices.length));
    const next = currentMask.map((masked, index) => masked && !recover.includes(index));
    setMasks(previous => previous.map((blockMask, index) => index === currentBlock ? next : blockMask));
    const nextMasked = next.findIndex(Boolean);
    if (nextMasked >= 0) setSelectedIndex(nextMasked);
    setRound(value => value + 1);
  };

  const changeBlock = (index: number) => {
    setCurrentBlock(index);
    const firstMasked = masks[index].findIndex(Boolean);
    setSelectedIndex(firstMasked >= 0 ? firstMasked : 0);
    setMaskRate(75);
    setRound(0);
  };

  const changeRate = (rate: (typeof MASK_RATES)[number]) => {
    applyMask(buildMask(rate, currentBlock), rate);
  };

  const toggleToken = (index: number) => {
    const next = [...currentMask];
    next[index] = !next[index];
    setMasks(previous => previous.map((blockMask, blockIndex) => blockIndex === currentBlock ? next : blockMask));
    setSelectedIndex(index);
    setRound(0);
  };

  const activeProbability = probabilities[activeIndex];
  const activeLoss = logLoss(activeProbability);
  const completed = maskedIndices.length === 0;

  return (
    <section className="utd-shell utd-microscope" aria-label="BDLM 损失显微镜">
      <header className="utd-head">
        <div>
          <span className="utd-kicker">DISTILL-STYLE FORMULA LAB</span>
          <strong>BDLM 损失显微镜</strong>
          <small>点选一个位置，让 Token、条件视窗、预测与公式同步变化</small>
        </div>
        <div className="utd-legend" aria-label="Token 图例">
          <span className="is-text">文本 Token</span>
          <span className="is-image">视觉 Token</span>
          <span className="is-special">特殊 Token</span>
          <span className="is-mask">[MASK]</span>
        </div>
      </header>

      <div className="utd-commandbar">
        <div className="utd-command-buttons">
          <button type="button" className={activeCommand === 'reset' ? 'is-active' : ''} aria-pressed={activeCommand === 'reset'} onClick={resetMask}>重置 Mask</button>
          <button type="button" className={activeCommand === 'random' ? 'is-active' : ''} aria-pressed={activeCommand === 'random'} onClick={randomizeMask}>随机 Mask</button>
          <button type="button" className={activeCommand === 'recover' ? 'is-active' : ''} aria-pressed={activeCommand === 'recover'} onClick={recoverConfident} disabled={completed}>
            {completed ? '当前块已恢复' : '恢复高置信度位置'}
          </button>
        </div>
        <div className="utd-mask-scale" aria-label="Mask 比例图例">
          <span>可见</span><i /><i /><i /><i /><b>Mask</b>
        </div>
      </div>

      <div className="utd-workbench">
        <section className="utd-block-panel" aria-label="输入 Token 分块">
          <div className="utd-panel-title">
            <div><small>INPUT</small><strong>输入 Token 分块</strong></div>
            <span>xₜ</span>
          </div>
          <div className="utd-blocks">
            {BLOCKS.map((block, blockIndex) => {
              const relation = blockIndex < currentBlock ? 'clean' : blockIndex === currentBlock ? 'current' : 'future';
              return (
                <div className={`utd-block-row is-${relation}`} key={blockIndex}>
                  <button
                    type="button"
                    className="utd-block-label"
                    aria-pressed={blockIndex === currentBlock}
                    onClick={() => changeBlock(blockIndex)}
                  >
                    <b>B{blockIndex + 1}</b>
                    <small>{relation === 'clean' ? '前序干净块' : relation === 'current' ? '当前块 k' : '未来块'}</small>
                  </button>
                  <div className="utd-block-tokens">
                    {block.map((token, tokenIndex) => {
                      const masked = relation === 'current' && currentMask[tokenIndex];
                      const selected = relation === 'current' && tokenIndex === activeIndex;
                      return (
                        <button
                          type="button"
                          key={tokenIndex}
                          disabled={relation !== 'current'}
                          aria-label={`B${blockIndex + 1} 第 ${tokenIndex + 1} 个位置，${masked ? 'Mask' : token.label}`}
                          aria-pressed={selected}
                          className={`utd-grid-token is-${masked ? 'mask' : token.kind}${selected ? ' is-selected' : ''}`}
                          onClick={() => toggleToken(tokenIndex)}
                        >
                          <small>i={tokenIndex + 1}</small>
                          <strong>{masked ? 'MASK' : token.label}</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="utd-panel-note">只有当前块可切换 Mask；前序块作为干净条件，未来块不进入当前条件。</p>
        </section>

        <section className="utd-condition-panel" aria-label="当前条件视窗">
          <div className="utd-panel-title is-centered">
            <div><small>CONDITION</small><strong>当前条件视窗</strong></div>
          </div>
          <div className="utd-condition-arrow" aria-hidden="true"><i /><b>预测</b></div>
          <div className="utd-condition-card">
            <span className="is-clean">x₀,&lt;{currentBlock + 1}</span>
            <b>前 {currentBlock} 个干净 Block</b>
          </div>
          <div className="utd-plus">+</div>
          <div className="utd-condition-card is-noisy">
            <span>xₜ,{currentBlock + 1}</span>
            <b>当前带 Mask 的 Block</b>
          </div>
          <div className="utd-active-position">
            <small>当前观察位置</small>
            <strong>(k,i)=({currentBlock + 1},{activeIndex + 1})</strong>
          </div>
        </section>

        <section className="utd-output-panel" aria-label="教学示意预测">
          <div className="utd-panel-title">
            <div><small>OUTPUT</small><strong>被 Mask 位置的预测</strong></div>
            <span>pθ</span>
          </div>
          <div className="utd-prediction-grid">
            {BLOCKS[currentBlock].map((token, index) => {
              const masked = currentMask[index];
              const selected = index === activeIndex && masked;
              return (
                <button
                  type="button"
                  key={index}
                  disabled={!masked}
                  className={`${masked ? 'is-predicted' : 'is-known'}${selected ? ' is-selected' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <small>位置 {index + 1}</small>
                  <strong>{masked ? token.label : '已知 / 不计损失'}</strong>
                  {masked ? <i><b style={{ width: `${probabilities[index] * 100}%` }} /></i> : null}
                  <span>{masked ? `${Math.round(probabilities[index] * 100)}%` : '—'}</span>
                </button>
              );
            })}
          </div>
          <div className="utd-candidates">
            <small>选中位置的候选分布 · 教学示意</small>
            <div><b>{activeToken.label}</b><i style={{ width: `${activeProbability * 100}%` }} /></div>
            <div><b>{activeToken.alternatives[0]}</b><i style={{ width: `${Math.max(8, (1 - activeProbability) * 65)}%` }} /></div>
            <div><b>{activeToken.alternatives[1]}</b><i style={{ width: `${Math.max(5, (1 - activeProbability) * 35)}%` }} /></div>
          </div>
        </section>
      </div>

      <div className="utd-controls utd-formula-controls">
        <label>
          <span>教学遮挡概率 <b>1−αₜ</b></span>
          <input
            type="range"
            min="0"
            max={MASK_RATES.length - 1}
            step="1"
            value={MASK_RATES.indexOf(maskRate)}
            onChange={event => changeRate(MASK_RATES[Number(event.target.value)])}
          />
        </label>
        <output>{maskRate}%</output>
        <div className="utd-view-toggle" role="group" aria-label="公式显示范围">
          <button type="button" className={!showAllTerms ? 'is-active' : ''} onClick={() => setShowAllTerms(false)}>只看当前项</button>
          <button type="button" className={showAllTerms ? 'is-active' : ''} onClick={() => setShowAllTerms(true)}>查看全部求和</button>
        </div>
      </div>

      <section className="utd-live-formula" aria-live="polite">
        <div className="utd-formula-summary">
          <span>Mask 集合</span>
          <strong>𝓜ₜ = {'{'}{maskSet}{'}'}</strong>
          <small>{maskedIndices.length} 个位置参与当前训练损失</small>
        </div>
        <div className="utd-formula-equation">
          <small>{showAllTerms ? '当前块的全部求和项' : `位置 (${currentBlock + 1},${activeIndex + 1}) 的单项损失`}</small>
          {completed ? (
            <strong>𝓜ₜ = ∅　→　当前块没有 Mask 项</strong>
          ) : showAllTerms ? (
            <strong>
              L<sub>current</sub> = w(t) × [{lossTerms.map(term => term.toFixed(2)).join(' + ')}]
              {' '}= w(t) × {totalLoss.toFixed(2)}
            </strong>
          ) : (
            <strong>
              −w(t) log p<sub>θ</sub>(“{activeToken.label}” | x<sub>0,&lt;{currentBlock + 1}</sub>, x<sub>t,{currentBlock + 1}</sub>)
              {' '}= w(t) × {activeLoss.toFixed(2)}
            </strong>
          )}
          <p>这里的概率与数值只用于解释 −log p 如何进入求和；论文时间权重仍保留为 w(t)=−α′ₜ/(1−αₜ)。</p>
        </div>
        <div className="utd-formula-summary is-round">
          <span>并行恢复</span>
          <strong>{round ? `已演示 ${round} 轮` : '尚未恢复'}</strong>
          <small>一次可接受多个高置信度位置，不要求严格从左到右</small>
        </div>
      </section>

      <div className={`utd-feedback ${completed ? 'is-success' : maskedIndices.length >= 3 ? 'is-emphasis' : 'is-current'}`}>
        <b>
          {completed
            ? '当前块已经没有 Mask；训练时也就没有对应的损失项。'
            : `现在只有 𝓜ₜ 中的 ${maskedIndices.length} 个位置进入求和。`}
        </b>
        <span>
          {completed
            ? '重置或随机 Mask 可以重新观察条件与损失如何联动。'
            : `前序干净块 x₀,<${currentBlock + 1} 与当前噪声块 xₜ,${currentBlock + 1} 一起条件化位置 (${currentBlock + 1},${activeIndex + 1})。`}
        </span>
      </div>
    </section>
  );
};

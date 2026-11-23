import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CodeChip, MosaicArtwork, StageBadge, StudioPanel } from './glc-kit';

type Stage = 1 | 2 | 3;

const stageInfo: Record<Stage, {
  title: string;
  goal: string;
  feedback: string;
  trainable: string[];
  frozen: string[];
}> = {
  1: {
    title: 'Stage I · 建立生成式潜空间',
    goal: '先让 VQ-VAE 学会语义一致、纹理可信的重建。',
    feedback: '阶段 I 先把潜空间训练好；此时代码率模块还没有开始学习。',
    trainable: ['E', 'VQ', 'D'],
    frozen: []
  },
  2: {
    title: 'Stage II · 冻结自编码器',
    goal: '固定语义潜空间，专门学习潜空间变换编码与熵模型。',
    feedback: '阶段 II 冻结 E/D，让变换编码先围绕稳定潜空间学习率失真目标。',
    trainable: ['gₐ', 'Q', 'gₛ', 'hₐ', 'hₛ', 'CP'],
    frozen: ['E', 'VQ', 'D']
  },
  3: {
    title: 'Stage III · 端到端联合微调',
    goal: '放开整网，在率项、像素感知项和码预测监督下共同更新。',
    feedback: '阶段 III 允许 E/D 与变换编码一起调整，但码预测仍只在训练期提供监督。',
    trainable: ['E', 'VQ', 'D', 'gₐ', 'Q', 'gₛ', 'hₐ', 'hₛ', 'CP'],
    frozen: []
  }
};

export function GlcStageOne() {
  const [stage, setStage] = useState<Stage>(1);
  const current = stageInfo[stage];
  const isTrainable = (part: string) => current.trainable.includes(part);
  return <div className="glc-scene glc-stage-page">
    <aside className="glc-stage-menu">
      <StageBadge tone="blue">渐进式训练</StageBadge>
      <h3>选择训练阶段</h3>
      {[1, 2, 3].map(item => <button key={item} className={stage === item ? 'is-active' : ''}
        onClick={() => setStage(item as Stage)} aria-pressed={stage === item}>
        <span>STAGE {['I', 'II', 'III'][item - 1]}</span>
        <b>{item === 1 ? '潜空间' : item === 2 ? '变换编码' : '联合微调'}</b>
      </button>)}
      <div className={`glc-feedback is-${stage === 1 ? 'blue' : stage === 2 ? 'purple' : 'green'}`} aria-live="polite">
        {current.feedback}
      </div>
    </aside>
    <div className="glc-stage-main">
      <StudioPanel className="glc-stage-network" tone="green">
        <div className="glc-card-title">
          <span>{current.title}</span>
          <CodeChip tone={stage === 1 ? 'blue' : stage === 2 ? 'purple' : 'green'}>{current.goal}</CodeChip>
        </div>
        <div className="glc-network-row">
          {['E', 'VQ', 'l', 'gₐ', 'Q', 'ŷ', 'gₛ', 'D'].map((part, index) => <React.Fragment key={part}>
            <div className={`glc-network-block ${isTrainable(part) ? 'is-trainable' : current.frozen.includes(part) ? 'is-frozen' : 'is-neutral'}`}>
              <b>{part}</b>
              <span>{current.frozen.includes(part) ? '冻结' : isTrainable(part) ? '更新' : '表示'}</span>
            </div>
            {index < 7 && <span className="glc-path-arrow" aria-hidden="true">→</span>}
          </React.Fragment>)}
        </div>
        <div className="glc-hyper-branch">
          <span className="glc-branch-stem" />
          {['hₐ', 'ẑ', 'hₛ', 'prior z'].map((part, index) => <React.Fragment key={part}>
            <div className={`glc-network-block is-purple ${isTrainable(part) ? 'is-trainable' : ''}`}><b>{part}</b>
              <span>{isTrainable(part) ? '更新' : '旁路'}</span></div>
            {index < 3 && <span className="glc-path-arrow" aria-hidden="true">→</span>}
          </React.Fragment>)}
        </div>
        <div className="glc-stage-caption">
          {stage === 1 ? '生成式 VQ-VAE 先确定潜空间的语义与纹理能力。'
            : stage === 2 ? '主码流与超信息开始学习，码预测器只参与训练监督。'
              : '联合微调把码率、生成质量与语义一致性放进同一优化过程。'}
        </div>
      </StudioPanel>
      <div className="glc-stage-bottom">
        <StudioPanel className="glc-loss-card" tone={stage === 2 ? 'purple' : stage === 1 ? 'blue' : 'green'}>
          <div className="glc-card-title"><span>当前优化目标</span>
            <CodeChip tone={stage === 2 ? 'purple' : stage === 1 ? 'blue' : 'green'}>
              {stage === 1 ? 'λ_adv = 0.8 · β = 0.25' : stage === 2 ? 'α = 0.5' : 'λ_code = 0.05'}
            </CodeChip>
          </div>
          {stage === 1 && <div className="glc-loss-lines">
            <p>ℒ = ‖x−x̂‖ + ℒ_per + <SymbolHint meaning="λ_adv：自适应 Patch-GAN 对抗损失的权重，论文设为 0.8。">λ_adv</SymbolHint>ℒ_adv + ℒ_codebook</p>
            <p>ℒ_codebook = ‖sg(l)−l̃‖ + <SymbolHint meaning="β：码本更新项的权重，论文设为 0.25。">β</SymbolHint>‖sg(l̃)−l‖</p>
          </div>}
          {stage === 2 && <div className="glc-loss-lines">
            <p>ℒ = 𝔼[<SymbolHint meaning="R(ŷ)：由熵模型估计的量化变换码码率。">R(ŷ)</SymbolHint> + λ𝒟_code]</p>
            <p>𝒟_code = <SymbolHint meaning="α：码预测交叉熵项的权重，论文设为 0.5。">α</SymbolHint>CE(M_l, M̂_l̂) + ‖l−l̂‖²</p>
          </div>}
          {stage === 3 && <div className="glc-loss-lines">
            <p>𝒟 = ‖x−x̂‖ + ℒ_per + λ_advℒ_adv + <SymbolHint meaning="λ_code：像素潜空间码预测损失的权重，论文设为 0.05。">λ_code</SymbolHint>𝒟_code</p>
            <p>ℒ = 𝔼[<SymbolHint meaning="R(ŷ)：估计码率，与失真项共同构成率失真目标。">R(ŷ)</SymbolHint> + λ𝒟]</p>
          </div>}
        </StudioPanel>
        <StudioPanel className="glc-stage-visual" tone="neutral">
          <MosaicArtwork detail={stage === 1 ? 58 : stage === 2 ? 74 : 92} mode="latent" generative
            label="训练推进时，马赛克从基础语义逐渐获得更丰富的纹理" />
          <div><strong>{stage === 1 ? '语义可读' : stage === 2 ? '码率受控' : '联合权衡'}</strong>
            <p>{stage === 1 ? '先能重建' : stage === 2 ? '再能压小' : '最后共同优化'}</p></div>
        </StudioPanel>
      </div>
    </div>
  </div>;
}

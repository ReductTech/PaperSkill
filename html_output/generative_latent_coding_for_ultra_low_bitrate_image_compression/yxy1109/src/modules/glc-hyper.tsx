import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { CodeChip, MetricBar, StageBadge, StudioPanel } from './glc-kit';

type Prior = 'factorized' | 'categorical';

export function GlcHyper() {
  const [prior, setPrior] = useState<Prior>('categorical');
  return <div className="glc-scene glc-hyper-page">
    <aside className="glc-hyper-menu">
      <StageBadge tone="purple">超信息 ẑ</StageBadge>
      <h3>选择超先验</h3>
      <button className={prior === 'factorized' ? 'is-active is-red' : ''} onClick={() => setPrior('factorized')}>
        <span>分解超先验</span><b>局部颜色 / 纹理账本</b>
      </button>
      <button className={prior === 'categorical' ? 'is-active is-purple' : ''} onClick={() => setPrior('categorical')}>
        <span>分类超先验</span><b>高层语义便签 + 码本</b>
      </button>
      <div className="glc-hyper-note">两种模式的视觉内容都是示意；<b>17.7%</b> 才是 CLIC2020 的 BD-Rate 实测对照。</div>
    </aside>
    <div className="glc-hyper-visual">
      <StudioPanel className={`glc-hyper-workbench ${prior === 'factorized' ? 'is-factorized' : 'is-categorical'}`}
        tone={prior === 'factorized' ? 'red' : 'purple'}>
        <div className="glc-workbench-top">
          <div className="glc-paper-sheet">
            <div className="glc-paper-scene" aria-hidden="true">
              <span className="glc-paper-sun" /><span className="glc-paper-hill is-one" /><span className="glc-paper-hill is-two" />
              <span className="glc-paper-river" />
            </div>
            <div className="glc-paper-label">{prior === 'factorized' ? '局部旁信息账本' : '语义场景便签'}</div>
          </div>
          <span className="glc-workbench-arrow">→</span>
          <div className="glc-hyper-stream">
            {prior === 'factorized'
              ? ['#8fb8c0', '#d7c498', '#5e887b', '#b0c9aa', '#c9a777', '#738f8c', '#ddd3b2'].map((color, index) =>
                <span key={`${color}-${index}`} className="glc-local-token" style={{ backgroundColor: color }} />)
              : <>
                {['天空', '山体', '河流'].map((word, index) => <CodeChip key={word} tone={index === 1 ? 'green' : 'blue'}>{word}</CodeChip>)}
                <span className="glc-hyper-index">ẑ<sub>1</sub> · 14 bit</span>
              </>}
          </div>
        </div>
        <div className="glc-hyper-feedback" aria-live="polite">
          {prior === 'factorized'
            ? '分解先验把更多码率花在颜色、纹理等低层旁信息上。'
            : '分类先验把 z 量化进超码本，优先携带高层语义与结构。'}
        </div>
      </StudioPanel>
      <div className="glc-hyper-bottom">
        <StudioPanel className="glc-hyper-formula" tone="purple">
          <span className="glc-section-label">分类超模块 · 式 (2)</span>
          <div className="glc-formula">
            <SymbolHint meaning="z：超分析变换得到的连续超码。">z</SymbolHint>
            <span> = hₐ(</span><SymbolHint meaning="y：分析变换输出的连续变换码。">y</SymbolHint><span>), </span>
            <SymbolHint meaning="ẑ：把超码 z 在超码本 C_h 中最近邻量化后的离散索引。">ẑ</SymbolHint>
            <span> = VQ(z, </span><SymbolHint meaning="C_h：超码本；其大小 M_h 与主辅助码本 C 相同。">C_h</SymbolHint><span>)</span>
          </div>
          <p>推理时 ẑ 的码字索引用固定长度 log₂M_h 编码，再经 hₛ 产生主码率模型的先验。</p>
        </StudioPanel>
        <StudioPanel className="glc-hyper-chart" tone={prior === 'factorized' ? 'red' : 'green'}>
          <div className="glc-card-title"><span>FID–BPP 曲线上的整体位置</span>
            <CodeChip tone={prior === 'factorized' ? 'red' : 'green'}>{prior === 'factorized' ? '+17.7%' : '0% 参考'}</CodeChip>
          </div>
          <MetricBar label="分解超先验" value={17.7} max={20} suffix="% BD-Rate" tone="red" />
          <MetricBar label="分类超先验" value={0} max={20} suffix="%" tone="green" />
          <p className="glc-metric-rule">BD-Rate 越低越好；“17.7%”是相对曲线损失，不是码率节省比例。</p>
        </StudioPanel>
      </div>
    </div>
  </div>;
}

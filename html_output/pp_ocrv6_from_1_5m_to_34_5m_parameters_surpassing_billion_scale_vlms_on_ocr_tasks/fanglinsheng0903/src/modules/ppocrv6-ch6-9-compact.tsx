import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type ReceptiveField = '3x3' | '7x7';
type ContextMode = 'local' | 'global';
type RuntimeView = 'training' | 'inference';
type Tier = 'tiny' | 'small' | 'medium';

function Remember({ children }: { children: React.ReactNode }) {
  return <div className="compact-remember"><strong>你应该记住：</strong><span>{children}</span></div>;
}

function PaperDetails({ children }: { children: React.ReactNode }) {
  return (
    <details className="compact-paper-details">
      <summary>查看论文细节</summary>
      <div>{children}</div>
    </details>
  );
}

export const CompactDetectionAnalogy: React.FC<WidgetProps> = () => (
  <div className="compact-rf-analogy" role="img" aria-label="同一个特征点从较小局部邻域扩大到更大的局部邻域">
    <div className="small"><span>3×3</span><i /></div>
    <b aria-hidden="true">→</b>
    <div className="large"><span>7×7</span><i /></div>
    <p>同一点 · 更多上下文</p>
  </div>
);

export const CompactDetectionLesson: React.FC<WidgetProps> = () => {
  const [field, setField] = useState<ReceptiveField>('3x3');
  const radius = field === '3x3' ? 1 : 3;
  const cells = useMemo(() => Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    return { index, active: Math.abs(row - 4) <= radius && Math.abs(col - 4) <= radius, center: row === 4 && col === 4 };
  }), [radius]);
  const wide = field === '7x7';

  return (
    <div className={`compact-lesson compact-detection ${wide ? 'is-wide' : 'is-local'}`}>
      <div className="compact-question"><span>核心问题</span><strong>文字检测为什么需要既“看得更广”，又“学得更细”？</strong></div>

      <div className="compact-segment" role="group" aria-label="选择局部感受野">
        <button type="button" className={!wide ? 'selected' : ''} aria-pressed={!wide} onClick={() => setField('3x3')}><b>3×3</b><span>旧 refinement</span></button>
        <button type="button" className={wide ? 'selected' : ''} aria-pressed={wide} onClick={() => setField('7x7')}><b>7×7</b><span>RepLKFPN</span></button>
      </div>

      <section className="compact-rf-stage" aria-live="polite">
        <div className="compact-rf-copy">
          <span>{wide ? 'RepLKFPN · 7×7' : '旧 refinement · 3×3'}</span>
          <strong>{wide ? '更大的局部上下文' : '局部信息较少'}</strong>
          <p>{wide ? '同一个位置可以同时参考更多字符、字符间关系和周边背景。' : '同一个位置主要看到附近笔画，长文字与密集区域的上下文有限。'}</p>
        </div>
        <div className="compact-rf-sample" role="img" aria-label={`${wide ? '7×7' : '3×3'} 局部感受野覆盖 TOTAL ¥128.00 文字区域`}>
          <div className="compact-receipt-line"><span>RECEIPT</span><strong>TOTAL ¥128.00</strong></div>
          <div className="compact-rf-grid" aria-hidden="true">
            {cells.map((cell) => <i key={cell.index} className={`${cell.active ? 'active' : ''} ${cell.center ? 'center' : ''}`} />)}
          </div>
        </div>
      </section>

      <div className="compact-fact-strip"><span>推理态 FPN neck</span><strong>172K → 118K</strong><em>训练多分支，部署融合为单个 7×7 DWConv</em></div>

      <div className="compact-support-grid">
        <article className="training"><div><span>Training only</span><strong>中间层也要收到反馈</strong></div><b>Auxiliary Deep Supervision</b><p>训练时给 P2 / P3 / P4 增加辅助监督，让中间特征更直接地收到梯度。</p></article>
        <article className="loss"><div><span>Training objective</span><strong>困难像素需要更多关注</strong></div><b>Dice + Focal</b><p>Dice 关注整体文字区域，Focal 补充更细粒度的像素监督，尤其关注难样本。</p></article>
      </div>

      <PaperDetails>
        <p>RepLKFPN 保留多尺度 FPN 框架，重点改变 per-level refinement：训练态使用多尺度 dilated paths，导出时融合为单个 7×7 depthwise convolution。</p>
        <p>辅助 heads 只在训练阶段存在，不进入推理图。论文对应检测方法与 Appendix Table 13；这里不展开逐层 stride、损失公式和 sequential ablation。</p>
      </PaperDetails>

      <Remember>PP-OCRv6 的检测改进可以概括成两件事：<b>让特征看得更广，让训练信号学得更细</b>；复杂的辅助结构主要留在训练阶段。</Remember>
    </div>
  );
};

const SAMPLE_CHARACTERS = ['T', 'E', 'H', '2', '0', '2', '6'];

export const CompactRecognitionLesson: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<ContextMode>('local');
  const [selected, setSelected] = useState(2);
  const global = mode === 'global';

  return (
    <div className={`compact-lesson compact-recognition ${global ? 'is-global' : 'is-local'}`}>
      <div className="compact-question"><span>核心问题</span><strong>读一个字符时，为什么既需要看邻近字符，又需要理解整行文字？</strong></div>

      <div className="compact-segment" role="group" aria-label="选择文字上下文范围">
        <button type="button" className={!global ? 'selected' : ''} aria-pressed={!global} onClick={() => setMode('local')}><b>Local</b><span>看附近</span></button>
        <button type="button" className={global ? 'selected' : ''} aria-pressed={global} onClick={() => setMode('global')}><b>Global</b><span>看整行</span></button>
      </div>

      <section className="compact-context-stage" aria-live="polite">
        <div className="compact-character-row" role="group" aria-label="选择要观察的字符">
          {SAMPLE_CHARACTERS.map((character, index) => {
            const active = global || Math.abs(index - selected) <= 2;
            return (
              <button type="button" key={`${character}-${index}`} className={`${active ? 'in-context' : ''} ${index === selected ? 'selected' : ''}`} aria-pressed={index === selected} onClick={() => setSelected(index)}>
                {character}
              </button>
            );
          })}
        </div>
        <div className="compact-context-explanation">
          <span>{global ? 'Transformer' : '1×7 DWConv'}</span>
          <strong>{global ? '再理解整行' : '先观察附近'}</strong>
          <p>{global ? '整条序列共同参与，利用全局上下文连接远距离位置并帮助消歧。' : `围绕“${SAMPLE_CHARACTERS[selected]}”聚合邻近位置，观察字符边界、间距和局部结构。`}</p>
        </div>
      </section>

      <div className="compact-recognition-flow" role="img" aria-label="输入依次经过局部上下文、全局上下文并得到输出">
        <span>Input</span><b>↓</b><strong>Local context · 1×7 DWConv</strong><b>↓</b><strong>Global context · Transformer</strong><b>↓</b><span>Output</span>
        <em>Additive skip · 用相加代替 concat + projection，减少额外参数</em>
      </div>

      <PaperDetails>
        <p>EncoderWithLightSVTR 先通过 1×1 projection 与 1×7 depthwise convolution 建模横向局部上下文，再由 Transformer blocks 建立全局依赖。</p>
        <p>本页主路径描述 Medium / Small Recognition；Tiny 不使用 recognition neck。NRTR 的训练期作用统一放到 §8 解释。</p>
      </PaperDetails>

      <Remember>PP-OCRv6 的识别模块不是一开始就“看全局”，而是<b>先利用字符附近的局部规律，再理解整行上下文</b>。</Remember>
    </div>
  );
};

export const CompactTrainingLesson: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<RuntimeView>('training');
  const inference = view === 'inference';

  return (
    <div className={`compact-lesson compact-training ${inference ? 'is-inference' : 'is-training'}`}>
      <div className="compact-question"><span>核心问题</span><strong>为什么训练阶段可以更复杂，但部署阶段仍然很轻？</strong></div>

      <div className="compact-segment" role="group" aria-label="切换训练与推理计算图">
        <button type="button" className={!inference ? 'selected' : ''} aria-pressed={!inference} onClick={() => setView('training')}><b>Training</b><span>更多学习路径</span></button>
        <button type="button" className={inference ? 'selected' : ''} aria-pressed={inference} onClick={() => setView('inference')}><b>Inference</b><span>只留部署路径</span></button>
      </div>

      <section className="compact-runtime-stage" aria-live="polite">
        <header><span>{inference ? 'Inference graph' : 'Training graph'}</span><strong>{inference ? '只保留真正需要运行的路径' : '给模型更多学习路径和监督信号'}</strong></header>

        <div className="compact-runtime-extras" aria-hidden={inference}>
          <article style={{ '--order': 0 } as React.CSSProperties}><span>Detection</span><strong>Auxiliary Heads</strong><small>P2 / P3 / P4</small></article>
          <article style={{ '--order': 1 } as React.CSSProperties}><span>Recognition</span><strong>NRTR Head</strong><small>training only</small></article>
          <article style={{ '--order': 2 } as React.CSSProperties}><span>Tiny</span><strong>Medium Teacher</strong><small>distillation</small></article>
        </div>

        <div className="compact-runtime-pipeline" role="img" aria-label={inference ? '推理图只保留融合后的单分支、检测、裁剪、识别与输出' : '训练图包含 RepDWConv 多分支及检测识别主路径'}>
          <div className="reparam"><span>Token Mixer</span><strong>{inference ? 'Fused DWConv' : 'RepDWConv 多分支'}</strong><small>{inference ? '单分支' : '3×3 + 1×1 + Identity'}</small></div>
          <b>→</b><div><span>Detection</span><strong>文字框</strong></div><b>→</b><div><span>Crop</span><strong>文字行</strong></div><b>→</b><div><span>Recognition</span><strong>CTC 输出</strong></div>
        </div>

        {inference ? <div className="compact-runtime-removed"><span>已在部署前处理</span><strong>多分支已融合 · Aux / NRTR / Teacher 已删除</strong></div> : null}
      </section>

      <PaperDetails>
        <p>RepDWConv 和 RepLKFPN 的训练分支在部署前做结构重参数化；Detection Auxiliary Heads、Recognition NRTR Head 与 Tiny 的 Medium Teacher 都只参与训练。</p>
        <p>Tiny Recognition 使用 vocabulary-matched Medium teacher 进行知识蒸馏。以上机制服务优化过程，不意味着线上存在对应的额外计算分支。</p>
      </PaperDetails>

      <Remember><b>PP-OCRv6 把复杂性留在训练阶段，而不是留给部署。</b> 这不是单个模块的技巧，而是贯穿检测、识别与轻量模型训练的设计思想。</Remember>
    </div>
  );
};

const TIER_INFO: Record<Tier, { name: string; params: string; role: string; depth: number; det: string; rec: string }> = {
  tiny: { name: 'Tiny', params: '1.5M', role: 'Edge / CPU / 资源受限设备', depth: 2, det: '0.43M', rec: '1.1M' },
  small: { name: 'Small', params: '7.7M', role: 'Balanced', depth: 3, det: '2.48M', rec: '5.2M' },
  medium: { name: 'Medium', params: '34.5M', role: 'Higher Accuracy / Server', depth: 5, det: '15.5M', rec: '19M' },
};

export const CompactScalingLesson: React.FC<WidgetProps> = () => {
  const [tier, setTier] = useState<Tier>('small');
  const current = TIER_INFO[tier];

  return (
    <div className={`compact-lesson compact-scaling tier-${tier}`}>
      <div className="compact-question"><span>核心问题</span><strong>怎样用同一套架构覆盖边缘设备到服务器？</strong></div>

      <div className="compact-tier-selector" role="group" aria-label="选择 PP-OCRv6 模型档位">
        {(Object.keys(TIER_INFO) as Tier[]).map((key) => (
          <button type="button" key={key} className={tier === key ? 'selected' : ''} aria-pressed={tier === key} onClick={() => setTier(key)}>
            <span>{TIER_INFO[key].name}</span><strong>{TIER_INFO[key].params}</strong>
          </button>
        ))}
      </div>

      <section className="compact-scale-stage" aria-live="polite">
        <div className="compact-tier-result"><span>{current.name}</span><strong>{current.params}</strong><p>{current.role}</p></div>

        <div className="compact-primitive"><span>固定不变</span><strong><i aria-hidden="true" />LCNetV4Block</strong><small>Block primitive 不变</small></div>

        <div className="compact-scale-pipeline" role="img" aria-label={`${current.name} 使用相同 LCNetV4Block，以当前深度和宽度构成 Detection 与 Recognition`}>
          <div className="compact-scale-node detection"><span>Detection</span><div>{Array.from({ length: current.depth }, (_, index) => <i key={index} />)}</div><small>二维多尺度特征</small></div>
          <b>→</b><div className="compact-crop-node"><span>Crop</span><strong>文字行</strong></div><b>→</b>
          <div className="compact-scale-node recognition"><span>Recognition</span><div>{Array.from({ length: current.depth }, (_, index) => <i key={index} />)}</div><small>横向序列</small></div>
        </div>

        <div className="compact-dimension-legend"><span><i className="depth" />Depth：block 数量</span><span><i className="width" />Width：通道容量</span><em>切换档位时只强调这两个视觉维度</em></div>
      </section>

      <PaperDetails>
        <div className="compact-tier-table" role="table" aria-label="三档模型参数摘要">
          <div role="row"><b>Tier</b><b>Detection</b><b>Recognition</b><b>End-to-end</b></div>
          {(Object.keys(TIER_INFO) as Tier[]).map((key) => <div role="row" key={key}><strong>{TIER_INFO[key].name}</strong><span>{TIER_INFO[key].det}</span><span>{TIER_INFO[key].rec}</span><span>{TIER_INFO[key].params}</span></div>)}
        </div>
        <p>参数来自论文 Table 2。三档共享设计基元，但具体 Detection / Recognition 配置并非一份权重或机械等比例缩放。</p>
      </PaperDetails>

      <Remember>Tiny、Small、Medium 并不是三套不同架构，而是<b>同一套 LCNetV4 设计按不同 depth / width 扩展</b>，从而覆盖从边缘端到服务器的部署需求。</Remember>
    </div>
  );
};

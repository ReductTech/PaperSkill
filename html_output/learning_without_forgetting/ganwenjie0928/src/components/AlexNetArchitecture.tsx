import React from 'react';

function DenseNetworkGlyph({ shape }: { shape: 'fc6' | 'fc7' }) {
  const isFc6 = shape === 'fc6';
  const interfaceYs = [8, 20, 32, 44, 56];
  const fc6InputYs = [4, 10.2, 16.4, 22.7, 29, 35, 41.3, 47.6, 53.8, 60];
  const inputYs = isFc6 ? fc6InputYs : interfaceYs;
  const outputYs = interfaceYs;
  const xs = [25, 83];
  return (
    <svg className={`v2-alexnet-dense-glyph ${isFc6 ? 'is-compressed' : 'is-equal'}`} viewBox="0 0 108 64" aria-hidden="true">
      {inputYs.flatMap((y) => outputYs.map((nextY) => (
        <line key={`${y}-${nextY}`} x1={xs[0] + 4} y1={y} x2={xs[1] - 4} y2={nextY} />
      )))}
      {inputYs.map((y, index) => <circle key={`input-${index}`} cx={xs[0]} cy={y} r={isFc6 ? 2.4 : 3.3} />)}
      {outputYs.map((y, index) => <circle key={`output-${index}`} cx={xs[1]} cy={y} r="3.3" />)}
    </svg>
  );
}

function ConvolutionGlyph() {
  return (
    <svg className="v2-alexnet-conv-glyph" viewBox="0 0 122 58" aria-hidden="true">
      <g className="v2-feature-plane"><rect x="5" y="13" width="43" height="39" rx="4" /><path d="M13 22h27M13 30h27M13 38h27M13 46h27M18 17v31M26 17v31M34 17v31" /></g>
      <g className="v2-feature-plane is-middle"><rect x="30" y="8" width="43" height="39" rx="4" /><path d="M38 17h27M38 25h27M38 33h27M38 41h27M43 12v31M51 12v31M59 12v31" /></g>
      <g className="v2-feature-plane is-front"><rect x="56" y="3" width="43" height="39" rx="4" /><path d="M64 12h27M64 20h27M64 28h27M64 36h27M69 7v31M77 7v31M85 7v31" /></g>
      <rect className="v2-conv-filter" x="78" y="16" width="14" height="14" rx="2" />
    </svg>
  );
}

export function AlexNetArchitecture({
  compact = false,
  boundary = 'fc7',
  mode,
  showNewHead,
  parameterState,
  inputSymbol = 'Xₙ',
  sharedState = '共享主干',
  oldState = '保留旧任务输出',
  newState = '新任务输出',
  onInspect = () => undefined,
}: {
  compact?: boolean;
  boundary?: 'features' | 'fc7';
  mode?: 'teacher' | 'student';
  showNewHead?: boolean;
  parameterState?: 'frozen' | 'trainable';
  inputSymbol?: string;
  sharedState?: string;
  oldState?: string;
  newState?: string;
  onInspect?: (objectId: string) => void;
}) {
  const denseLayersShared = boundary === 'fc7';
  const includesNewHead = showNewHead ?? mode !== 'teacher';
  return (
    <section className={`v2-alexnet-architecture${compact ? ' is-compact' : ''}${mode ? ` is-${mode}-mode` : ''}`} aria-label="AlexNet 参数结构">
      {mode ? <div className="v2-alexnet-modebar">
        <div><span>{mode === 'teacher' ? 'OLD MODEL / TEACHER' : 'EXPANDED STUDENT'}</span><strong>{mode === 'teacher' ? '旧模型保持固定结构' : '共享主体连接新旧任务输出'}</strong></div>
        <b className={parameterState === 'trainable' ? 'is-trainable' : 'is-frozen'}>{parameterState === 'trainable' ? 'TRAINABLE · 可训练' : 'FROZEN · 固定'}</b>
      </div> : null}
      {!compact ? (
        <header className="v2-alexnet-heading">
          <div><p className="v2-eyebrow">ALEXNET · 参数边界示意</p><h3>哪些层属于共享参数，哪些层属于任务输出？</h3></div>
        </header>
      ) : null}
      <div className="v2-alexnet-flow">
        <div className="v2-alexnet-input"><span>输入图像</span><code>{inputSymbol}</code><small>进入当前模型</small></div>
        <span className="v2-alexnet-arrow" aria-hidden="true">→</span>
        <div className="v2-alexnet-shared">
          <button type="button" className="v2-alexnet-param v2-alexnet-param-shared" onClick={() => onInspect('theta_s')}>
            <span>共享参数 · θₛ</span><strong>{sharedState}</strong><small>{denseLayersShared ? 'conv1–5 + fc6 + fc7' : 'conv1–5（features）'}</small>
          </button>
          <div className="v2-alexnet-layer-grid">
            <article className={`v2-alexnet-layer v2-alexnet-conv-layer${denseLayersShared ? '' : ' is-wide'}`}>
              <div className="v2-alexnet-layer-art"><ConvolutionGlyph /></div>
              <div className="v2-alexnet-layer-caption"><strong>CNN 卷积特征</strong><span>conv1 → conv2 → conv3 → conv4 → conv5</span></div>
            </article>
            {denseLayersShared ? <DenseLayer label="fc6" shape="9216 → 4096" /> : null}
            {denseLayersShared ? <DenseLayer label="fc7" shape="4096 → 4096" /> : null}
          </div>
        </div>
        <span className="v2-alexnet-arrow" aria-hidden="true">→</span>
        <div className={`v2-alexnet-heads${includesNewHead ? '' : ' is-single'}`} aria-label="任务专属分类头">
          {mode === 'student' ? <span className="v2-alexnet-branch-label">共享表示从 fc7 分支</span> : null}
          <TaskHead code="θₒ" title="旧任务头" layerLabel={denseLayersShared ? 'fc8_old' : 'fc6 → fc7 → fc8_old'} state={oldState} outputLabel={mode ? mode === 'teacher' ? 'Yₒ' : 'Ŷₒ' : undefined} old onInspect={() => onInspect('theta_o')} />
          {includesNewHead ? <TaskHead code="θₙ" title="新任务头" layerLabel={denseLayersShared ? 'fc8_new' : 'fc6 → fc7 → fc8_new'} state={newState} outputLabel={mode ? 'Ŷₙ' : undefined} onInspect={() => onInspect('theta_n')} /> : null}
        </div>
      </div>
      <div className="v2-alexnet-explanation-grid">
        <div><strong>共享参数 θₛ</strong><span>{denseLayersShared ? '论文示例中包含五个卷积层 conv1–5 和两个全连接层 fc6、fc7。' : '当前边界只共享 conv1–5；fc6、fc7 各自在旧、新任务分支中计算。'}</span></div>
        <div><strong>旧任务头 θₒ</strong><span>{denseLayersShared ? 'fc8_old 把共享表示映射为旧任务类别分数。' : 'fc6 → fc7 → fc8_old 负责旧任务分类。'}</span></div>
        <div><strong>新任务头 θₙ</strong><span>{denseLayersShared ? '新建的 fc8_new 输出新任务类别分数。' : '新建 fc6 → fc7 → fc8_new，输出新任务类别分数。'}</span></div>
      </div>
      <footer className="v2-alexnet-note"><strong>记号提示：</strong>θₒ 的下标是字母 o（old，旧任务），不是数字 0；θₙ 是新任务输出头。当前边界设置在{denseLayersShared ? 'fc7 之后' : 'features 之后'}。</footer>
    </section>
  );
}

function DenseLayer({ label, shape }: { label: 'fc6' | 'fc7'; shape: string }) {
  return <article className="v2-alexnet-layer v2-alexnet-dense-layer"><div className="v2-alexnet-layer-art"><DenseNetworkGlyph shape={label} /></div><div className="v2-alexnet-layer-caption"><strong>{label}</strong><span>{shape} · 全连接</span></div></article>;
}

function TaskHead({ code, title, layerLabel, state, outputLabel, old, onInspect }: { code: string; title: string; layerLabel: string; state: string; outputLabel?: string; old?: boolean; onInspect: () => void }) {
  return <button type="button" className={`v2-alexnet-param v2-alexnet-task-head${old ? ' is-old' : ' is-new'}`} onClick={onInspect}>
    <span>{title} · {code}</span><strong>{layerLabel}</strong><small>{state}</small>{outputLabel ? <em className="v2-alexnet-task-output">输出 · {outputLabel}</em> : null}
  </button>;
}

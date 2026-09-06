import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice, Segmented, Stat } from './common';
import { assetUrl, handleImageError } from './asset-url';

type Point = { x: number; y: number; label: string; detail: string };

function PaperFigureLens({
  src,
  points,
  initial = 0,
  contain = true,
}: {
  src: string;
  points: Point[];
  initial?: number;
  contain?: boolean;
}) {
  const [selected, setSelected] = useState(initial);
  const [cursor, setCursor] = useState({ x: points[initial].x, y: points[initial].y });
  const current = points[selected];
  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setCursor({
      x: Math.max(0, Math.min(100, ((e.clientX - box.left) / box.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - box.top) / box.height) * 100)),
    });
  };
  return (
    <div className="paper-lens">
      <div
        className={`paper-lens-stage ${contain ? 'contain' : 'cover'}`}
        onMouseMove={move}
        onMouseLeave={() => setCursor({ x: current.x, y: current.y })}
      >
        <img src={src} alt="论文原图" onError={handleImageError} />
        <span className="crosshair-x" style={{ top: `${cursor.y}%` }} />
        <span className="crosshair-y" style={{ left: `${cursor.x}%` }} />
        <span className="crosshair-dot" style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }} />
        {points.map((point, index) => (
          <button
            key={point.label}
            type="button"
            className={`paper-hotspot ${index === selected ? 'selected' : ''}`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            aria-label={point.label}
            onClick={() => {
              setSelected(index);
              setCursor({ x: point.x, y: point.y });
            }}
          />
        ))}
      </div>
      <div className="lens-tabs">
        {points.map((point, index) => (
          <button type="button" key={point.label} className={index === selected ? 'selected' : ''} onClick={() => setSelected(index)}>
            {point.label}
          </button>
        ))}
      </div>
      <Notice>{current.detail}</Notice>
    </div>
  );
}

export const BenchmarkLens: React.FC<WidgetProps> = () => (
  <div className="ll-widget">
    <PaperFigureLens
      src={assetUrl('figure-1-benchmark.png')}
      points={[
        { x: 27, y: 47, label: '理解侧', detail: '左轮覆盖通用 VQA、推理、OCR/文档等理解任务；蓝色条是本文模型，但不同任务不能简单相加。' },
        { x: 73, y: 47, label: '生成与编辑侧', detail: '右轮覆盖图像生成、单/多参考编辑与交错任务；这张图表达“覆盖面”，不是一个统一总分。' },
        { x: 50, y: 91, label: '比较原则', detail: '每根辐条只在自己的 benchmark 和量纲内比较。页面不会把 0–1 分数与百分制分数画在同一轴上。' },
      ]}
    />
  </div>
);

export const GenerationGallery: React.FC<WidgetProps> = () => {
  const presets = [
    { value: 'portrait', label: '人物与材质', pos: '22% 12%', note: '观察皮肤、衣料、光照与人物一致性；这是定性样例，不等同于盲测结论。' },
    { value: 'text', label: '图中文字', pos: '48% 55%', note: '样例包含中英文排版和招牌；论文同时承认密集文本生成仍有改进空间。' },
    { value: 'layout', label: '构图与风格', pos: '68% 77%', note: '同一模型覆盖摄影、插画、商品与节庆构图，说明统一 token 空间没有把生成接口限制在单一风格。' },
  ];
  const [preset, setPreset] = useState(presets[0].value);
  const [zoom, setZoom] = useState(135);
  const chosen = presets.find((item) => item.value === preset) || presets[0];
  return (
    <div className="ll-widget">
      <Segmented label="图像样例观察区域" value={preset} onChange={setPreset} items={presets} />
      <div className="gallery-zoom" style={{ backgroundPosition: chosen.pos, backgroundSize: `${zoom}% auto` }} role="img" aria-label="论文 Figure 2 高保真图像生成样例局部放大" />
      <div className="ctrl">
        <label>放大 <span className="val">{zoom}%</span></label>
        <input aria-label="调整图像放大比例" type="range" min="100" max="220" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
      </div>
      <Notice>{chosen.note}</Notice>
    </div>
  );
};

export const ArchitectureFigure: React.FC<WidgetProps> = () => (
  <PaperFigureLens
    src={assetUrl('figure-4-architecture.png')}
    points={[
      { x: 24, y: 78, label: '输入侧', detail: '文本经 Text Tokenizer，图像经 SigLIP-VQ；尺寸 token 明示图像高宽，二者都成为离散序列。' },
      { x: 51, y: 49, label: '统一骨干', detail: '中间的 16B MoE dLLM 在同一词表和块级 Mask 目标下处理文本与视觉 token。' },
      { x: 75, y: 24, label: '输出侧', detail: '文本 token 直接反词元化；图像语义 token 交给独立扩散解码器恢复高分辨率像素。' },
    ]}
  />
);

export const EditingFigure: React.FC<WidgetProps> = () => {
  const scenes = [
    { value: 'single', label: '单图编辑', pos: '30% 10%', detail: '保留人物与场景关系，只修改服装或局部语义。' },
    { value: 'multi', label: '多参考编辑', pos: '67% 53%', detail: '服装、配饰、人物与背景可作为多份参考，共同条件化目标结果。' },
    { value: 'interleaved', label: '交错生成', pos: '48% 72%', detail: '文字步骤与图像帧交替出现，后续内容可利用前面的两种模态。' },
    { value: 'reason', label: '交错推理', pos: '50% 93%', detail: '棋局示例把文字推理步骤和视觉状态穿插起来；论文将其视为有前景但仍需扩展的能力。' },
  ];
  const [scene, setScene] = useState(scenes[0].value);
  const current = useMemo(() => scenes.find((s) => s.value === scene) || scenes[0], [scene]);
  return (
    <div className="ll-widget">
      <Segmented label="选择 Figure 3 子任务" value={scene} onChange={setScene} items={scenes} />
      <div className="editing-focus" style={{ backgroundPosition: current.pos }} role="img" aria-label={`Figure 3：${current.label}`}><span>原图 / 条件 → 目标结果</span></div>
      <Notice>{current.detail} 这里放大的是论文原图局部，并未重新生成样例。</Notice>
    </div>
  );
};

export const StoryboardFigure: React.FC<WidgetProps> = () => {
  const slices = [
    {
      eyebrow: '案例 A · 人物动作连续性',
      prompt: '让同一位戴黑色针织帽的男子坐在白色沙发上，用连续画面依次表现：平静看向镜头、抬头观察、转向镜头、回看身后。保持人物身份、服装与室内场景一致。',
      steps: [
        { no: '01', image: assetUrl('intergen-person-1.png'), title: '建立人物与场景', text: '第一张图确定人物身份、黑色背心、针织帽、白色沙发和窗边环境，形成后续序列的视觉上下文。', context: '文字条件 → 图像 Token' },
        { no: '02', image: assetUrl('intergen-person-2.png'), title: '在同一视觉上下文中改变动作', text: '模型延续上一帧的人物与背景，只让视线和身体姿态发生变化，保持跨帧身份一致。', context: '前图 + 新动作文本 → 新图像' },
      ],
    },
    {
      eyebrow: '案例 A · 人物动作连续性',
      prompt: '让同一位戴黑色针织帽的男子坐在白色沙发上，用连续画面依次表现：平静看向镜头、抬头观察、转向镜头、回看身后。保持人物身份、服装与室内场景一致。',
      steps: [
        { no: '03', image: assetUrl('intergen-person-3.png'), title: '继续承接人物身份', text: '第三张图再次利用已有图像 Token 作为条件，人物重新面向镜头，但主体、服装与空间关系保持稳定。', context: '历史图文上下文 → 下一视觉块' },
        { no: '04', image: assetUrl('intergen-person-4.png'), title: '完成动作序列', text: '最后一帧生成回看动作。变化集中在头部与视线，前文和前图共同约束序列的连贯性。', context: '前图 + 动作约束 → 完成序列' },
      ],
    },
    {
      eyebrow: '案例 B · 烹饪步骤连续性',
      prompt: '用连续图文步骤展示煎牛排：准备并调味、预热油锅、入锅煎制、盖上锡纸静置。保持牛排、平底锅与操作顺序前后一致。',
      steps: [
        { no: '01', image: assetUrl('intergen-steak-1.png'), title: '准备并调味牛排', text: '图像首先给出原料、盐粒、黑胡椒与夹子；这些视觉实体会成为下一步骤可引用的上下文。', context: '步骤文本 → 食材图像' },
        { no: '02', image: assetUrl('intergen-steak-2.png'), title: '预热平底锅', text: '模型把文字动作转换为新的视觉块，同时保留“油、平底锅、炉火”等后续煎制所需的对象关系。', context: '前文目标 → 工具图像' },
      ],
    },
    {
      eyebrow: '案例 B · 烹饪步骤连续性',
      prompt: '用连续图文步骤展示煎牛排：准备并调味、预热油锅、入锅煎制、盖上锡纸静置。保持牛排、平底锅与操作顺序前后一致。',
      steps: [
        { no: '03', image: assetUrl('intergen-steak-3.png'), title: '把牛排放入热锅', text: '前两步已经建立食材与厨具；当前文字动作在这些视觉条件上继续生成煎制画面。', context: '历史图像 + 当前动作 → 煎制图像' },
        { no: '04', image: assetUrl('intergen-steak-4.png'), title: '盖箔静置完成', text: '最后一步延续同一块牛排，并用锡纸覆盖表达静置。图像结果也可继续成为后续说明的视觉条件。', context: '完整图文上下文 → 最终状态' },
      ],
    },
  ];
  const [caseIndex, setCaseIndex] = useState(0);
  const [page, setPage] = useState(0);
  const slice = caseIndex * 2 + page;
  const current = slices[slice];
  const move = (delta: number) => setPage((page + delta + 2) % 2);
  const chooseCase = (index: number) => {
    setCaseIndex(index);
    setPage(0);
  };
  return (
    <div className="ll-widget intergen-slices">
      <div className="intergen-case-switch" role="group" aria-label="切换交错生成案例">
        <button type="button" className={caseIndex === 0 ? 'is-active' : ''} aria-pressed={caseIndex === 0} onClick={() => chooseCase(0)}>
          <span>案例 A</span><b>人物动作连续性</b>
        </button>
        <button type="button" className={caseIndex === 1 ? 'is-active' : ''} aria-pressed={caseIndex === 1} onClick={() => chooseCase(1)}>
          <span>案例 B</span><b>烹饪步骤连续性</b>
        </button>
      </div>

      <section className="intergen-prompt-card">
        <span>User Prompt</span>
        <p>{current.prompt}</p>
      </section>

      <section className="intergen-output-card">
        <header>
          <div><span>LLaDA2.0-Uni Output</span><strong>{current.eyebrow}</strong></div>
          <small>案例 {caseIndex === 0 ? 'A' : 'B'} · 片段 {page + 1}/2 · 当前只展开两个相邻步骤</small>
        </header>
        <div className="intergen-step-list" key={slice}>
          {current.steps.map((step, index) => (
            <React.Fragment key={step.image}>
              {index > 0 ? <div className="intergen-chain" aria-hidden="true"><i /><b>视觉上下文继续参与</b><i /></div> : null}
              <article className="intergen-step-card">
                <figure>
                  <img src={step.image} alt={step.title} onError={handleImageError} />
                  <span>STEP {step.no}</span>
                </figure>
                <div>
                  <small>{step.context}</small>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                  <div className="intergen-token-trace" aria-hidden="true"><i className="is-text" /><i className="is-image" /><i className="is-text" /><i className="is-image" /></div>
                </div>
              </article>
            </React.Fragment>
          ))}
        </div>
        <div className="intergen-token-legend">
          <i className="is-text" /><span>文本 Token</span>
          <i className="is-image" /><span>图像 Token</span>
          <b>两种 Token 共同组成后续上下文</b>
        </div>
      </section>

      <div className="intergen-slice-nav" aria-label="交错生成切片导航">
        <button type="button" aria-label="上一切片" onClick={() => move(-1)}>←</button>
        <div>
          {[0, 1].map((index) => (
            <button
              type="button"
              key={index}
              className={index === page ? 'is-active' : ''}
              aria-label={`片段 ${index + 1}`}
              aria-pressed={index === page}
              onClick={() => setPage(index)}
            />
          ))}
          <span>片段 <b>{page + 1}/2</b></span>
        </div>
        <button type="button" aria-label="下一切片" onClick={() => move(1)}>→</button>
      </div>

      <div className="intergen-principle">
        <b>统一序列的链式推演</b>
        <span>交错生成让图像 Token 与文本 Token 在同一离散序列中交替出现，并由块级 Mask 预测统一建模。前一步生成的图像可以成为后续文本或图像生成的视觉上下文，形成“以图促文、以文生图”的闭环。</span>
      </div>
    </div>
  );
};

export const DecoderFigureCompare: React.FC<WidgetProps> = () => {
  const [split, setSplit] = useState(50);
  return (
    <div className="ll-widget">
      <div
        className="decoder-compare"
        style={{ '--split': `${split}%` } as React.CSSProperties}
        role="img"
        aria-label="同一列样例中，左侧显示 8 步蒸馏解码结果，右侧显示 50 步扩散解码结果"
      >
        <div className="decoder-layer slow"><span>50 steps</span></div>
        <div className="decoder-layer fast"><span>8 steps</span></div>
        <div className="decoder-handle" />
      </div>
      <div className="ctrl">
        <label>拖动对比线 <span className="val">{split}%</span></label>
        <input aria-label="拖动 50 步与 8 步对比线" type="range" min="8" max="92" value={split} onChange={(e) => setSplit(Number(e.target.value))} />
      </div>
      <div className="metrics">
        <Stat label="50 步" value="32.95 s" note="GenEval 0.89" tone="blue" />
        <Stat label="8 步蒸馏" value="2.90 s" note="GenEval 0.87" tone="green" />
        <Stat label="报告加速" value="11.4×" note="单卡 1024², BF16" tone="orange" />
      </div>
    </div>
  );
};

import React from 'react';
import type { WidgetProps } from './registry';

export const sceneUrl = (name: string) => `${import.meta.env.BASE_URL}images/${name}.png`;
const detailCaption = '一只橘猫坐在蓝色椅子上。';
const scenes = [
  { file: 'cat-landscape', title: '横版 · 3:2', text: '猫靠右，左侧展开窗户与房间。' },
  { file: 'cat-chair', title: '方版 · 1:1', text: '主体居中，突出猫和椅子的关系。' },
  { file: 'cat-portrait', title: '竖版 · 2:3', text: '沿上下展开，容纳高窗与整把椅子。' },
];

export function CatPicture({ file = 'cat-chair', caption, children }: { file?: string; caption?: string; children?: React.ReactNode }) {
  return <figure className="teach-picture"><div className="teach-image-wrap"><img src={sceneUrl(file)} alt={file === 'cat-simple' ? '一只橘猫坐在地上' : file === 'cat-landscape' ? '横版构图：橘猫坐在右侧蓝色椅子上，左侧有窗户、植物和书' : file === 'cat-portrait' ? '竖版构图：高窗前的橘猫和整把蓝色椅子' : '一只橘猫坐在蓝色椅子上'} loading="lazy" />{children}</div>{caption && <figcaption>{caption}</figcaption>}</figure>;
}

export function CompositionGallery({ squareOnly = false }: { squareOnly?: boolean }) {
  return <div className={`teach-compositions ${squareOnly ? 'square-only' : ''}`}>{(squareOnly ? [scenes[1]] : scenes).map(scene => <figure key={scene.file}><div className="teach-composition-image"><img src={sceneUrl(scene.file)} alt={scene.text} loading="lazy" /></div><figcaption><b>{scene.title}</b><span>{scene.text}</span></figcaption></figure>)}</div>;
}

export function FeatureTiles({ noise = false, variant = 0 }: { noise?: boolean; variant?: number }) {
  return <div className={`teach-feature-grid ${noise ? 'is-noise' : ''}`} role="img" aria-label={noise ? '随机数字组成的潜噪声示意' : '不同数值组成的文字特征示意，不是真实模型数值'}>{Array.from({ length: 24 }, (_, i) => <span key={i} style={{ backgroundColor: `hsl(${noise ? 215 : [28, 210, 145][(i + variant) % 3]} ${noise ? 12 : 35}% ${35 + ((i * 17 + variant * 13) % 47)}%)` }}>{(((i * (37 + variant * 11) + (noise ? 13 : 7) + variant * 53) % 199 - 99) / 100).toFixed(1)}</span>)}</div>;
}

function Arrow({ label }: { label: string }) { return <div className="teach-arrow"><span>{label}</span><b aria-hidden="true">→</b></div>; }
function Tokens() { return <div className="teach-tokens"><span>一只</span><span className="orange">橘猫</span><span>坐在</span><span className="blue">蓝色椅子</span><span>上</span></div>; }
function Notes({ children }: { children: React.ReactNode }) { return <p className="teach-note">{children}</p>; }

function ArchitectureOverview() {
  return <div className="teach-architecture">
    <div className="teach-architecture-lead"><b>按处理顺序认识模型框架</b><span>文字和图片先各自转换成模型能处理的数字表示，再在 MMDiT 中交换信息，最后还原成图片。</span></div>
    <div className="teach-architecture-lanes">
      <div className="teach-architecture-lane text">
        <div className="teach-architecture-label">文字路径</div>
        <div className="teach-architecture-box">文字 prompt</div>
        <div className="teach-architecture-arrow">↓</div>
        <div className="teach-architecture-box">GPT-OSS<br /><small>取第 4/12/18/24 层文字特征</small></div>
        <div className="teach-architecture-arrow">↓</div>
        <div className="teach-architecture-box">Linear Adapter<br /><small>把维度对齐</small></div>
      </div>
      <div className="teach-architecture-lane image">
        <div className="teach-architecture-label">图片路径（训练时）</div>
        <div className="teach-architecture-box">输入图片</div>
        <div className="teach-architecture-arrow">↓</div>
        <div className="teach-architecture-box">VAE Encoder<br /><small>压缩为 H/8 × W/8 的 latent</small></div>
        <div className="teach-architecture-arrow">↓</div>
        <div className="teach-architecture-box">Patchify（2×2）<br /><small>切成图像 token，供 Transformer 处理</small></div>
      </div>
    </div>
    <div className="teach-architecture-join">文字特征（后文记作 <b>c</b>） + 图像 token<br /><span>合并后进入生成骨干</span></div>
    <div className="teach-architecture-main"><b>48 × MMDiT Blocks</b><small>图文两条分支在这里交换信息，预测潜表示的更新方向</small></div>
    <div className="teach-architecture-output"><span>Unpatchify</span><b>→</b><span>VAE Decoder</span><b>→</b><span>输出图片</span></div>
    <Notes>生成时没有现成的输入图片：图片路径从随机潜噪声开始，最后仍由 VAE Decoder 解码。48 是网络内部块数，不是生成采样步数。</Notes>
  </div>;
}

function ArchitectureModeVisual({ generating }: { generating: boolean }) {
  return <div className="teach-architecture-mode">
    <div className="teach-architecture-mode-paths">
      <div className="teach-architecture-mode-path text"><b>文字路径</b><span>{generating ? '用户提示词' : '训练图片对应的文字描述'}</span><strong>↓ GPT-OSS</strong><span>文字特征</span></div>
      <div className="teach-architecture-mode-path image"><b>图像路径</b><span>{generating ? '随机潜噪声' : '真实图片 → VAE Encoder'}</span><strong>{generating ? '↓' : '↓ 压缩并加噪'}</strong><span>当前图像潜表示</span></div>
    </div>
    <div className="teach-architecture-mode-core"><b>两路进入 MMDiT</b><span>{generating ? '反复预测方向并更新潜表示' : '预测更新方向，与已知训练目标比较后调整骨干参数'}</span></div>
    <div className="teach-architecture-mode-end">{generating ? '最终潜表示 → VAE Decoder → 输出图片' : '训练完成：学会根据文字预测图像潜表示的更新方向'}</div>
    <Notes>{generating ? '生成时没有现成的图片作为答案；VAE Encoder 不参与这条起始路径。' : '训练时有图文对，真实图片提供学习依据；VAE 和 GPT-OSS 冻结，主要更新 MMDiT 骨干。'}</Notes>
  </div>;
}

export function VaeVisual() {
  return <div className="teach-vae">
    <div className="teach-vae-purpose"><b>VAE 的意义</b><span>把图片转换成更紧凑的潜表示（latent，记作 z），让生成模型不用在每一步直接处理整张图的像素，节省计算；最后再把潜表示变回能看的图片。z 指整幅图的数字表示，不是单个数字。</span></div>
    <div className="teach-vae-own-training"><b>训练 VAE 本身：要学会重建图片</b><div className="teach-vae-reconstruction-flow"><span>原图</span><b>→</b><span>编码器</span><b>→</b><span>latent</span><b>→</b><span>解码器</span><b>→</b><span>重建图</span></div><small>这条完整路径属于 VAE 自身的训练。Lens 使用已经训练好的 FLUX.2 VAE，不在预训练 Lens 时重新训练它。</small></div>
    <div className="teach-vae-row">
      <strong>训练 Lens 生成骨干：有现成图片，用 VAE 编码器</strong>
      <div className="teach-pipeline"><CatPicture caption="已有的训练图片" /><Arrow label="VAE 编码" /><div className="teach-feature"><FeatureTiles /><b>潜表示 latent</b></div><Arrow label="供模型学习" /><div className="teach-box teach-vae-model">生成模型<br /><small>在潜表示中学习</small></div></div>
    </div>
    <div className="teach-vae-row">
      <strong>用 Lens 文生图：没有原始图片，最后用 VAE 解码器</strong>
      <div className="teach-pipeline"><div className="teach-feature"><FeatureTiles noise /><b>随机潜噪声 + 文字要求</b></div><Arrow label="生成模型反复更新" /><div className="teach-feature"><FeatureTiles /><b>最终潜表示</b></div><Arrow label="VAE 解码" /><CatPicture caption="生成的图片示意" /></div>
    </div>
    <Notes>Lens 预训练的误差在潜表示上计算，不要求每一步都把结果解码成图片。图中的数字格子与猫图仅用于讲解，并非真实潜变量或 Lens 的生成结果。</Notes>
  </div>;
}

function VaeCandidatesVisual({ value }: { value: number }) {
  const candidates = [
    { name: 'FLUX.1', family: '传统 VAE' },
    { name: 'SD3', family: '传统 VAE' },
    { name: 'FLUX.2', family: '语义 VAE' },
    { name: 'VTP', family: '语义 VAE' },
  ];
  return <div className="teach-vae-candidates">
    <div className="teach-vae-candidate-method"><b>论文怎样选择 VAE？</b><span>在相同的 Lens-Toy 文生图训练设置中更换 VAE，比较生成表现和收敛速度，而非只看图片重建得有多像。</span></div>
    <div className="teach-vae-candidate-grid">{candidates.map((candidate, i) => <div key={candidate.name} className={`teach-vae-candidate ${i === value ? 'active' : ''} ${i === 2 ? 'chosen' : ''}`}><small>{candidate.family}</small><b>{candidate.name}</b>{i === value && <span>当前查看</span>}</div>)}</div>
    <div className="teach-vae-candidate-result">{value === 2 ? '论文结果：FLUX.2 在这组 Lens-Toy 实验中的生成表现与收敛速度最好，因此 Lens 采用它。' : `当前查看 ${candidates[value].name}：它是论文比较的候选之一。点击 FLUX.2 可看到作者最终采用的方案。`}</div>
    <Notes>这四项是 VAE 候选，不是四个完整的 Lens 模型；卡片仅展示论文报告的选型结论，不代表原始实验曲线。</Notes>
  </div>;
}

export function GenerationVisual() {
  return <><div className="teach-pipeline"><div className="teach-feature"><FeatureTiles noise /><b>随机潜噪声</b></div><Arrow label="反复更新" /><div className="teach-feature"><FeatureTiles /><b>最终潜表示</b></div><Arrow label="VAE 解码" /><CatPicture caption="符合文字的图片" /></div><div className="teach-prompt">文字要求：{detailCaption}</div><Notes>流程示意：格子不是实际潜变量，图片不是 Lens 的真实采样结果。</Notes></>;
}

function TextVisual() {
  return <><Tokens /><div className="teach-pipeline"><div className="teach-box">GPT-OSS<br /><small>文字编码器</small></div><Arrow label="提取特征" /><div className="teach-feature"><FeatureTiles /><b>文字条件 c</b></div><Arrow label="引导生成" /><CatPicture /></div></>;
}

function JointVisual() {
  return <><div className="teach-joint"><div><Tokens /><div className="teach-box">文字特征 c</div></div><div className="teach-joint-center">↔<b>注意力交换信息</b><small>“橘猫”与猫的外观<br />“蓝色椅子”与椅子的颜色</small></div><CatPicture><span className="teach-region cat">橘猫</span><span className="teach-region chair">蓝色椅子</span></CatPicture></div><Notes>彩框帮助理解文字与图像的对应；实际运算作用在特征 token 上，不是直接给图片画框。</Notes></>;
}

function ReviewVisual() {
  return <div className="teach-review"><CatPicture caption="训练流程示意图，非 Lens 实际输出" /><div><div className="teach-prompt">示例提示词：{detailCaption}</div><p className="teach-review-lead">先写清检查标准，再评估生成图片：</p><ul className="teach-checklist"><li>主体是否是一只猫？</li><li>猫是否为橘色？</li><li>椅子是否为蓝色？</li><li>猫是否坐在椅面上？</li><li>整张图是否自然、结构合理？</li></ul><Notes>这些是帮助理解的示例规则，不是论文公开的真实评分单；评审给奖励后，系统继续更新生成模型。</Notes></div></div>;
}

function SpeedVisual() {
  return <><div className="teach-turbo-flow"><span>Lens-RL<br /><small>完整模型能力</small></span><b>蒸馏</b><span>Lens-Turbo<br /><small>少步生成器</small></span></div><div className="teach-speed">{[20, 4].map((steps, i) => <div key={steps}><b>{i === 0 ? 'Lens' : 'Lens-Turbo'}</b><div className="teach-step-dots">{Array.from({ length: steps }, (_, n) => <span key={n} />)}</div><strong>{steps} 个采样步</strong><small>{i === 0 ? '约 3.15 秒' : '约 0.84 秒'}</small></div>)}</div><Notes>论文单张 H100、1024×1024 条件下的用时；蒸馏让 Turbo 在更少采样步下尽量保留原模型能力。</Notes></>;
}

export const TeachingIllustration: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  let content: React.ReactNode;
  if (chapterId === 'hero') {
    const old = moduleId === 'old';
    content = <><CatPicture caption={old ? '同一张训练图 · 描述只有“一只猫”' : `同一张训练图 · ${detailCaption}`}><span className={`teach-status ${old ? 'bad' : 'good'}`} aria-label={old ? '描述不充分' : '描述更充分'}>{old ? '×' : '✓'}</span></CatPicture><div className="teach-facts">{old ? '缺少毛色、椅子颜色和位置关系' : '主体 + 颜色 + 动作 + 位置关系'}</div></>;
  } else switch (chapterId) {
    case 'chap-1': content = <ArchitectureOverview />; break;
    case 'chap-2': content = <><div className="teach-pair"><CatPicture file="cat-simple" caption="一只猫" /><CatPicture caption={detailCaption} /></div><Notes>两幅图帮助看懂描述的区别；下方实验固定同一张图，只切换配文。</Notes></>; break;
    case 'chap-3': content = <><CompositionGallery /><Notes>三种独立构图示意：横图展开环境，方图聚焦主体，竖图容纳高度。</Notes></>; break;
    case 'chap-4': content = <VaeVisual />; break;
    case 'chap-5': content = <TextVisual />; break;
    case 'chap-6': content = <GenerationVisual />; break;
    case 'chap-7': content = <><div className="teach-stage-labels"><b>① 方图打基础</b><span>→</span><b>② 多种构图接着学</b></div><CompositionGallery /><Notes>第二阶段继续更新已有模型，训练图片的尺寸与构图更丰富。</Notes></>; break;
    case 'chap-8': content = <JointVisual />; break;
    case 'chap-9': content = <ReviewVisual />; break;
    case 'chap-10': content = <SpeedVisual />; break;
    default: content = <CatPicture />;
  }
  return <div className={`teaching-visual ${chapterId === 'hero' ? 'teach-hero' : ''}`}>{content}<small className="teach-credit">{chapterId === 'chap-1' ? '依据论文第 2.2 节绘制 · 教学示意' : 'AI 教学插图 · 非论文实验图'}</small></div>;
};

export function ModuleIllustration({ id, value }: { id: string; value: number }) {
  let content: React.ReactNode;
  if (id === '1.1') content = <ArchitectureModeVisual generating={value === 1} />;
  else if (id === '2.1') {
    const captions = ['一只猫。', '一半样本用简短描述，一半用详细描述。', detailCaption];
    content = <div className="teach-caption-lab"><CatPicture caption="训练图片始终相同" /><div className="teach-caption-content"><span className="teach-eyebrow">{['简短标题', '50% / 50% 混合策略', '详细标题'][value]}</span><p className="teach-prompt">{captions[value]}</p>{value === 1 ? <div className="teach-mixture"><p>50%：一只猫。</p><p>50%：{detailCaption}</p><small>比例指训练样本；不是把两句话拼成一条标题。</small></div> : <div className="teach-clues">{['主体：猫', '毛色：橘色', '椅子：蓝色', '关系：坐在椅面上'].map((clue, i) => <span key={clue} className={i === 0 || value === 2 ? 'known' : ''}>{i === 0 || value === 2 ? '✓' : '—'} {clue}</span>)}</div>}<Notes>未写出的细节仍在图中，但文字没有明确指出它们。</Notes></div></div>;
  } else if (id === '4.1') content = <VaeCandidatesVisual value={value} />;
  else if (id === '5.1') content = <><Tokens /><div className="teach-layers">{[4, 12, 18, 24].map((layer, i) => <div key={layer} className={i === value ? 'active' : ''}><b>第 {layer} 层</b><FeatureTiles variant={i + 1} /></div>)}</div><div className="teach-prompt">四层提取不同的文字特征，一起拼接 → 投影 → 文字条件 c</div><Notes>四组数值和颜色只用于展示“层与层不同”，不是 GPT-OSS 实际输出。</Notes></>;
  else if (id === '7.1') content = <><div className="teach-prompt">{value === 0 ? '① 固定 512×512：先学习方形图片' : '② 在原模型上续训：接触不同分辨率与构图'}</div><CompositionGallery squareOnly={value === 0} /></>;
  else if (id === '9.2') content = <><div className="teach-review"><CatPicture caption="不同要求需要不同检查规则" /><div className="teach-coverage"><b>后训练提示词的覆盖量</b><div>{Array.from({ length: 12 }, (_, i) => <span key={i} className={i < [3, 6, 12][value] ? 'active' : ''}>{['主体', '颜色', '位置', '文字'][i % 4]}</span>)}</div><strong>训练后 GenEval：{['0.916', '0.920', '0.930'][value]}</strong></div></div><Notes>小格示意训练提示词的覆盖程度；GenEval 是论文表 1 的外部评测，不是这张猫图的奖励。</Notes></>;
  else if (id === '6.2') content = <><div className="teach-reasoner">{['想画一只猫', detailCaption, '文字 → 特征 c', '根据 c 更新潜表示'].map((item, i) => <div key={item} className={i === value ? 'active' : ''}><small>{['用户请求', 'Reasoner 补充细节', 'GPT-OSS 编码', 'MMDiT 预测方向'][i]}</small><b>{item}</b></div>)}</div><div className="teach-pair"><CatPicture file="cat-simple" caption="原始要求只明确了主体" /><CatPicture caption="补充后的要求明确了场景" /></div><Notes>Reasoner 的补充是一种可能的创作选择；用户可以继续修改。这一步发生在生成前，不负责给图片打分。</Notes></>;
  else content = <GenerationVisual />;
  return <div className="teaching-visual teaching-module">{content}<small className="teach-credit">{id === '4.1' ? 'VAE 候选对照示意 · 依据论文第 2.2 节' : 'AI 教学插图 · 非论文实验图'}</small></div>;
}

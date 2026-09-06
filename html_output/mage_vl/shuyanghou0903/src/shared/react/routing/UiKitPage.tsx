import { Button } from '../controls/Button';
import { ExplainPanelButton } from '../controls/ExplainPanelButton';
import { RangeControl } from '../controls/RangeControl';
import { Select } from '../controls/Select';
import { Switch } from '../controls/Switch';
import { TextInput } from '../controls/TextInput';
import { Callout } from '../feedback/Callout';
import { Feedback } from '../feedback/Feedback';
import { NoticeStrip } from '../feedback/NoticeStrip';
import { ReplayableCallouts } from '../feedback/ReplayableCallouts';
import { AttentionHint } from '../feedback/AttentionHint';
import { CatalogItem } from '../layout/CatalogItem';
import { ContentBlock } from '../layout/ContentBlock';
import { ModuleShell } from '../layout/ModuleShell';
import { FormulaBlock } from '../learning/FormulaBlock';
import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../learning/MathFormulaBlock';
import { Question } from '../learning/Question';
import { LessonFooter } from '../learning/LessonFooter';
import { ProgressiveReveal } from '../learning/ProgressiveReveal';
import { PanelChoiceQuestion } from '../learning/PanelChoiceQuestion';
import { CodeCompletionBlock } from '../learning/CodeCompletionBlock';
import { ValueTile } from '../learning/ValueTile';
import {
  Typography,
  typographyVariantMapping,
  type TypographyTone,
  type TypographyVariant,
} from '../typography/Typography';
import { FunctionPlot, type FunctionSeries } from '../visuals/FunctionPlot';
import { PlotlyChart, type PlotlyLayout, type PlotlyTrace } from '../visuals/PlotlyChart';
import '../ui-kit.css';

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const surfaceAxis = Array.from({ length: 25 }, (_, index) => -2 + index * (4 / 24));
const surfaceData: PlotlyTrace[] = [{ type: 'surface', x: surfaceAxis, y: surfaceAxis, z: surfaceAxis.map((y) => surfaceAxis.map((x) => Math.exp(-(x * x + y * y) / 2))), colorscale: [[0, '#eef3fb'], [0.5, '#f7b28d'], [1, '#f07e47']], showscale: false, hovertemplate: 'x = %{x:.2f}<br>y = %{y:.2f}<br>z = %{z:.2f}<extra></extra>' }];
const surfaceLayout: PlotlyLayout = { paper_bgcolor: '#fbfdff', margin: { l: 0, r: 0, t: 12, b: 0 }, showlegend: false, scene: { bgcolor: '#fbfdff', dragmode: 'orbit', aspectmode: 'cube', xaxis: { title: { text: 'x' } }, yaxis: { title: { text: 'y' } }, zaxis: { title: { text: 'z' } } } };
const cartesianDemoSeries: FunctionSeries[] = [
  { id: 'sigmoid', label: 'Sigmoid', fn: sigmoid, stroke: '#f07e47', strokeWidth: 3 },
  { id: 'tanh', label: 'tanh', fn: (x) => Math.tanh(x), stroke: '#27446e', strokeWidth: 3 },
];
const panelChoiceOptions = [
  {
    key: 'A',
    value: 'curve',
    title: 'y = σ(x)',
    caption: '坐标轴与曲线',
    media: <FunctionPlot fn={sigmoid} minHeight={132} ariaLabel="带坐标轴的 Sigmoid 函数曲线面板" initialScale={{ x: 0.025, y: 0.01 }} />,
  },
  { key: 'B', value: 'image', title: '道路样本', caption: '图片内容', media: <span>图片媒体槽</span>, wrongFeedback: '这是图片媒体，不包含可缩放的函数坐标轴。' },
  { key: 'C', value: 'video', title: '动态场景', caption: '视频内容', media: <span>视频媒体槽</span>, wrongFeedback: '这是视频媒体，不是由坐标数据绘制的函数图。' },
];

const typographyVariants: Array<{
  variant: TypographyVariant;
  label: string;
  usage: string;
  sample: string;
}> = [
  { variant: 'display', label: '展示标题', usage: '极少数课程主视觉标题', sample: '亲手看见模型如何学习' },
  { variant: 'h1', label: '一级标题', usage: '每个完整模块的主标题', sample: '超参数与搜索策略' },
  { variant: 'h2', label: '二级标题', usage: '内容块和主要学习阶段', sample: '模型学习什么，我们决定什么' },
  { variant: 'h3', label: '三级标题', usage: '面板、实验或局部小节', sample: '改变训练规则会发生什么？' },
  { variant: 'subtitle', label: '副标题', usage: '紧跟标题解释当前学习目标', sample: '拖动参数，观察训练过程如何改变。' },
  { variant: 'body', label: '正文', usage: '主要解释、结论和教学文案', sample: '学习率决定模型每次更新参数时迈出多大一步。' },
  { variant: 'bodySmall', label: '小正文', usage: '紧凑面板、控件附近的补充说明', sample: '真实结果仍需结合验证集表现判断。' },
  { variant: 'label', label: '标签', usage: '表单、指标和状态名称', sample: '当前学习率' },
  { variant: 'caption', label: '说明文字', usage: '图注、来源和低优先级帮助', sample: '数值保留三位小数' },
  { variant: 'button', label: '按钮文字', usage: 'Button 等操作组件内部使用', sample: '继续学习' },
  { variant: 'numeric', label: '关键数值', usage: '损失、准确率和动态读数', sample: '92.40%' },
  { variant: 'code', label: '代码文字', usage: '变量、短代码和等宽文本', sample: 'learning_rate = 0.001' },
  { variant: 'inherit', label: '继承', usage: '需要完整继承父组件文字样式时使用', sample: '继承父组件的排版' },
];

const typographyTones: Array<{ tone: TypographyTone; label: string; usage: string }> = [
  { tone: 'main', label: '主要文字', usage: '默认正文' },
  { tone: 'muted', label: '弱化文字', usage: '副标题和补充说明' },
  { tone: 'light', label: '轻量文字', usage: '最低优先级信息' },
  { tone: 'accent', label: '强调文字', usage: '主要概念和当前位置' },
  { tone: 'success', label: '成功文字', usage: '正确和完成状态' },
  { tone: 'warning', label: '警告文字', usage: '需要注意但可继续' },
  { tone: 'danger', label: '危险文字', usage: '错误和高风险状态' },
  { tone: 'inherit', label: '继承颜色', usage: '由父组件决定颜色' },
];

export function UiKitPage() {
  return <ModuleShell title="UI Kit" subtitle="教学模块的统一界面组件与交互规范。" shellClassName="kit-shell edu-shell--scaled" headerClassName="kit-header">
    <section className="kit-section" aria-labelledby="typography-title">
      <header className="kit-section-head">
        <h2 id="typography-title">文字系统 Typography</h2>
        <p>统一文字的视觉等级、语义颜色、对齐与换行。Shared 组件内部自动使用；模块中独立出现的文字才直接使用 Typography。</p>
      </header>

      <div className="kit-type-stack">
        <article className="kit-type-panel">
          <header className="kit-type-panel-head">
            <Typography as="h3" variant="h3">字体家族</Typography>
            <Typography variant="bodySmall" tone="muted">默认使用系统无衬线字体；数值和代码使用等宽字体。后续替换字体只修改共享 token。</Typography>
          </header>
          <div className="kit-font-family-grid">
            <div>
              <Typography variant="label" tone="muted">--ui-font-sans</Typography>
              <Typography variant="h3">中文教学文字 Aa 123</Typography>
            </div>
            <div>
              <Typography variant="label" tone="muted">--ui-font-mono</Typography>
              <Typography variant="code">Loss = 0.024 · epoch_12</Typography>
            </div>
          </div>
        </article>

        <article className="kit-type-panel">
          <header className="kit-type-panel-head">
            <Typography as="h3" variant="h3">全部文字等级</Typography>
            <Typography variant="bodySmall" tone="muted">variant 只决定视觉等级；默认 HTML 标签如下，必要时可用 as 单独调整语义。</Typography>
          </header>
          <div className="kit-type-catalog">
            {typographyVariants.map(({ variant, label, usage, sample }) => (
              <div className="kit-type-entry" key={variant}>
                <div className="kit-type-meta">
                  <Typography variant="label">{variant}</Typography>
                  <Typography variant="caption" tone="muted">{label} · 默认 &lt;{String(typographyVariantMapping[variant])}&gt;</Typography>
                  <Typography variant="caption" tone="light">{usage}</Typography>
                </div>
                <Typography as="p" variant={variant}>{sample}</Typography>
              </div>
            ))}
          </div>
        </article>

        <article className="kit-type-panel">
          <header className="kit-type-panel-head">
            <Typography as="h3" variant="h3">语义颜色 Tone</Typography>
            <Typography variant="bodySmall" tone="muted">使用颜色角色，不直接填写色值。主题调整时所有文字会一起更新。</Typography>
          </header>
          <div className="kit-tone-grid">
            {typographyTones.map(({ tone, label, usage }) => (
              <div className="kit-tone-entry" key={tone}>
                <Typography variant="body" tone={tone}>{label}</Typography>
                <Typography variant="caption" tone="muted">{tone} · {usage}</Typography>
              </div>
            ))}
          </div>
        </article>

        <article className="kit-type-panel">
          <header className="kit-type-panel-head">
            <Typography as="h3" variant="h3">对齐与换行</Typography>
            <Typography variant="bodySmall" tone="muted">对齐使用 start/end 以兼容未来语言方向；标题默认平衡换行，正文默认优化段落换行。</Typography>
          </header>
          <div className="kit-alignment-grid">
            <Typography variant="bodySmall" align="start">align="start"</Typography>
            <Typography variant="bodySmall" align="center">align="center"</Typography>
            <Typography variant="bodySmall" align="end">align="end"</Typography>
          </div>
          <div className="kit-wrap-grid">
            <div><Typography variant="label" tone="muted">normal</Typography><Typography variant="bodySmall" wrap="normal">普通换行适合连续正文，这段内容会按照容器宽度自然进入下一行。</Typography></div>
            <div><Typography variant="label" tone="muted">balance</Typography><Typography variant="h3" wrap="balance">平衡换行让多行标题的长度更加接近</Typography></div>
            <div><Typography variant="label" tone="muted">nowrap</Typography><Typography variant="bodySmall" wrap="nowrap">保持单行，不裁切内容</Typography></div>
            <div><Typography variant="label" tone="muted">truncate</Typography><Typography variant="bodySmall" wrap="truncate">单行空间不足时截断，并在结尾显示省略号</Typography></div>
          </div>
        </article>

        <article className="kit-type-panel">
          <header className="kit-type-panel-head">
            <Typography as="h3" variant="h3">使用、自定义与新增</Typography>
            <Typography variant="bodySmall" tone="muted">保持入口简单：Shared 组件自动处理自己的文字；只有模块独立文案直接使用 Typography。</Typography>
          </header>
          <div className="kit-type-guide-grid">
            <section>
              <Typography as="h4" variant="label">独立文字</Typography>
              <pre className="kit-code-sample"><code>{`<Typography variant="h2">
  当前训练状态
</Typography>

<Typography variant="body" tone="muted">
  模型正在接近最低点。
</Typography>`}</code></pre>
            </section>
            <section>
              <Typography as="h4" variant="label">Shared 组件文字</Typography>
              <pre className="kit-code-sample"><code>{`<ModuleShell
  title="超参数与搜索策略"
  subtitle="观察参数如何影响训练"
/>

<Button>继续学习</Button>`}</code></pre>
            </section>
            <section>
              <Typography as="h4" variant="label">自定义现有样式</Typography>
              <Typography variant="bodySmall" tone="muted">在 <code>typography.css</code> 中修改对应的 <code>--ui-type-*</code> token，不在模块 CSS 中重写字号、字重或行高。</Typography>
            </section>
            <section>
              <Typography as="h4" variant="label">新增文字等级</Typography>
              <ol className="kit-type-steps">
                <li>确认现有 variant 无法表达真实且可复用的语义。</li>
                <li>向 TypographyVariant 和默认标签映射加入名称。</li>
                <li>在 typography.css 增加 token 与样式。</li>
                <li>在本栏目补充预览、用途和窄屏检查。</li>
                <li>确认至少两个场景会复用后，再提供给模块使用。</li>
              </ol>
            </section>
          </div>
        </article>
      </div>
    </section>

    <section className="kit-section" aria-labelledby="foundation-title"><header className="kit-section-head"><h2 id="foundation-title">基础展示</h2><p>定义每个教学小块的固定结构，以及正文中允许复用的提示、指标、公式和代码运行组件。</p></header><div className="foundation-catalog">
      <CatalogItem title="标准内容块" description="每个小块只保留一个主标题、一个副标题和一个正文区域。"><ContentBlock className="foundation-preview" title="损失就是距离" subtitle="Loss 衡量真实值和预测值之间差多少。这里先用一条数轴，把这种差距直接画出来。"><p className="edu-body">训练的目标不是记住一个答案，而是持续缩小预测与真实结果之间的距离。</p><p className="edu-body">先改变预测值，再观察 <strong className="edu-emphasis">L1 Loss</strong> 如何变化。</p></ContentBlock></CatalogItem>
      <CatalogItem title="提示框" description="颜色和播放方式是两个独立维度。每种颜色都可以直接显示，也可以逐字显示。"><div className="foundation-stack foundation-preview--compact"><Callout tone="orange" label="你的任务" text="拖动绿色预测值，让它与红色真实值重合，把 Loss 缩小到 0。" /><ReplayableCallouts className="foundation-stack" replayLabel="重播四种逐字提示" items={[{ tone: 'orange', label: '思考提示', text: '先比较预测值和真实值，再判断应该向左还是向右移动。', streaming: true, streamInterval: 24 }, { tone: 'blue', label: '逐步解释', text: '预测值每靠近真实值一步，损失就会随距离一起减小。', streaming: true, streamInterval: 24 }, { tone: 'green', label: '正确反馈', text: '方向判断正确，继续缩小距离就能进一步降低损失。', streaming: true, streamInterval: 24 }, { tone: 'red', label: '风险提醒', text: '学习率过大可能越过最低点，导致训练过程来回震荡。', streaming: true, streamInterval: 24 }]} /><Feedback status="correct" label="正确反馈" message="方向判断正确，可以继续。" /><Feedback status="wrong" label="错误提示" message="当前操作让预测值远离真实值。" /></div></CatalogItem>
      <CatalogItem title="紧凑提示条" description="用于紧跟图表、模型或控制区显示一句当前状态。"><div className="foundation-stack foundation-preview--compact"><NoticeStrip tone="blue" lead="观察状态：">已经有 3 个线性神经元了。它们叠加后仍然只是一条直线。</NoticeStrip><NoticeStrip tone="orange" lead="操作提醒：">继续调整参数，比较曲线改变前后的形状。</NoticeStrip><NoticeStrip tone="green" lead="阶段完成：">当前结果已经满足目标，可以进入下一步。</NoticeStrip><NoticeStrip tone="red" lead="需要调整：">当前参数使输出偏离目标，请检查输入范围。</NoticeStrip></div></CatalogItem>
      <CatalogItem title="小型指标块" description="用于一个短标签和一个关键结果。"><div className="foundation-value-row foundation-preview"><ValueTile tone="orange" label="L1 Loss = |真实值 - 预测值|" value="5.4" /><ValueTile tone="blue" label="验证准确率" value="92.4%" /><ValueTile tone="success" label="已完成样本" value="128" /><ValueTile tone="danger" label="误分类样本" value="7" /></div></CatalogItem>
      <CatalogItem title="可解释公式块（MathLive）" description="默认整条公式保持单一主色。只有教学任务明确需要对照、追踪或强调某个语义项时，才为对应 MathFormulaTerm 设置 tone；禁止为了装饰给公式片段随意加色。变量、函数和陌生结构使用 MathFormulaTerm，括号、等号等结构符号使用 MathFormulaStatic。"><MathFormulaBlock ariaLabel="带 L2 正则化的训练目标函数"><MathFormulaTerm latex="W^{*}" tooltip="W*：训练结束时找到的最优权重。" ariaLabel="W star，训练得到的最优权重" /><MathFormulaStatic latex="=" /><MathFormulaTerm latex="\underset{W}{\operatorname{arg\,min}}" tooltip="arg min：在候选权重中寻找让目标最小的一组。" ariaLabel="arg min，对 W 寻找最小目标值" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="\operatorname{Loss}" tooltip="Loss：衡量预测与真实答案之间的误差。" ariaLabel="Loss，损失函数" /><MathFormulaStatic latex="(" /><MathFormulaTerm latex="y" tooltip="y：样本的真实目标值。" ariaLabel="y，真实目标值" /><MathFormulaStatic latex="," /><MathFormulaTerm latex="\hat{y}" tooltip="ŷ：模型给出的预测值。" ariaLabel="y hat，预测值" /><MathFormulaStatic latex=")" /><MathFormulaStatic latex="+" /><MathFormulaTerm latex="\lambda" tooltip="λ：正则化强度；此处因示例需要强调正则项而使用暖色。" ariaLabel="lambda，正则化强度" tone="warm" /><MathFormulaTerm latex="\lVert W\rVert_2^2" tooltip="权重的 L2 正则项；此处与 λ 同属被强调的正则部分。" ariaLabel="W 的 L2 范数平方" tone="warm" /><MathFormulaStatic latex=")" /></MathFormulaBlock></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="visual-title"><header className="kit-section-head"><h2 id="visual-title">坐标与曲线</h2><p>用于展示函数关系、曲面和训练误差的共享可视化。</p></header><div className="visual-catalog">
      <CatalogItem variant="visual" title="二维坐标轴与函数曲线" description="拖动平移坐标，使用滚轮缩放。函数会按当前视口重新采样，不设固定坐标范围。"><FunctionPlot className="visual-plot" fn={sigmoid} ariaLabel="Sigmoid 函数曲线" /></CatalogItem>
      <CatalogItem variant="visual" title="多函数二维坐标图" description="与单函数图使用同一套平移、滚轮缩放与按视口重新采样逻辑；可同时比较任意多条函数。"><FunctionPlot className="visual-plot" series={cartesianDemoSeries} showLegend xLabel="x" yLabel="输出值" initialCenter={{ x: 0, y: 0 }} initialScale={{ x: .012, y: .006 }} minHeight={300} ariaLabel="Sigmoid 与 tanh 的多函数坐标图" /></CatalogItem>
      <CatalogItem variant="visual" title="三维坐标轴与曲面" description="拖动旋转坐标，使用滚轮缩放。"><PlotlyChart className="visual-plot" data={surfaceData} layout={surfaceLayout} aria-label="三维函数曲面" /><output className="visual-readout">camera = 1.35, 1.35, 0.95</output></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="buttons-title"><header className="kit-section-head"><h2 id="buttons-title">按钮</h2><p>按钮样式由操作语义决定，同一区域通常只保留一个主操作。</p></header><div className="button-catalog">
      <CatalogItem variant="button" title="默认按钮" description="用于切换样本、重置局部设置或返回上一步。"><Button>换个样本</Button></CatalogItem>
      <CatalogItem variant="button" title="主操作按钮" description="用于开始训练、提交答案或进入下一步。"><Button variant="primary">开始训练</Button></CatalogItem>
      <CatalogItem variant="button" title="警告按钮" description="用于会改变实验结果但仍可恢复的操作。"><Button variant="warn">随机初始化</Button></CatalogItem>
      <CatalogItem variant="button" title="危险按钮" description="仅用于删除、清空或不可直接撤销的操作。"><Button variant="danger">清空记录</Button></CatalogItem>
      <CatalogItem variant="button" title="提示点击按钮" description="初始发光，首次鼠标移入、聚焦或点击后停止提示。"><Button variant="primary" hint>点击继续</Button></CatalogItem>
      <CatalogItem variant="button" title="询问按钮" description="鼠标悬浮、键盘聚焦或触摸时显示可容纳任意内容的面板。"><ExplainPanelButton><strong>学习率</strong><p>学习率决定每次参数更新的步幅。</p><FormulaBlock ariaLabel="学习率公式">w<sub>new</sub> = w − η · ∇L</FormulaBlock></ExplainPanelButton></CatalogItem>
      <CatalogItem variant="button" title="等待按钮" description="请求已提交，正在等待结果，不可重复点击。"><Button loading>等待数据</Button></CatalogItem>
      <CatalogItem variant="button" title="禁用按钮" description="前置条件尚未满足时使用，禁用期间不显示等待动画。"><Button variant="primary" disabled>继续训练</Button></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="hint-title"><header className="kit-section-head"><h2 id="hint-title">提示</h2><p>用于标记首次需要操作的对象；鼠标移入、键盘聚焦或点击后，提示由共享组件自动结束。</p></header><div className="foundation-catalog">
      <CatalogItem title="通用交互提示" description="使用 AttentionHint 包裹任意 HTML 内容，或为 SVG 图形添加 edu-attention-hint 类名。"><AttentionHint><NoticeStrip tone="blue" lead="现在可以操作：">将鼠标移入此提示，外侧高亮会自动结束。</NoticeStrip></AttentionHint></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="controls-title"><header className="kit-section-head"><h2 id="controls-title">参数与选项控件</h2><p>根据数据类型选择控件：单项选择用下拉或单选，多项选择用复选框，二元设置用开关，数值范围用滑杆。</p></header><div className="control-catalog">
      <CatalogItem variant="control" title="提示输入框" description="首次显示提示，首次移入、聚焦或输入后停止。"><TextInput label="输入答案" placeholder="请填写" hint /></CatalogItem>
      <CatalogItem variant="control" title="下拉列表" description="从多个互斥选项中选择一个。"><Select label="数据集" defaultValue="mnist" options={[{ value: 'mnist', label: '手写数字 MNIST' }, { value: 'cifar10', label: '彩色图像 CIFAR-10' }, { value: 'lfw', label: '人脸数据 LFW' }]} /></CatalogItem>
      <CatalogItem variant="control" title="复选框" description="普通样式用于设置列表，候选项可作为独立特征或标签。"><div className="edu-check-group"><label className="edu-check"><input type="checkbox" defaultChecked /> <span>显示网格</span></label><label className="edu-check edu-check--option"><input type="checkbox" /> <span>中心墨迹</span></label></div></CatalogItem>
      <CatalogItem variant="control" title="单选组" description="用于少量互斥选项，并让学习者直接看到所有选项。"><fieldset className="edu-control edu-fieldset"><legend className="edu-label">激活函数</legend><div className="edu-radio-group"><label className="edu-radio"><input type="radio" name="activation" value="relu" defaultChecked /><span>ReLU</span></label><label className="edu-radio"><input type="radio" name="activation" value="sigmoid" /><span>Sigmoid</span></label><label className="edu-radio"><input type="radio" name="activation" value="linear" /><span>Linear</span></label></div></fieldset></CatalogItem>
      <CatalogItem variant="control" title="滑块开关" description="用于立即生效并持续保持的二元设置。"><Switch label="显示决策边界" defaultChecked /></CatalogItem>
      <CatalogItem variant="control" title="提示连续滑杆" description="初始使用通用高亮提示，首次移入、聚焦或拖动后停止。"><RangeControl label="学习率" min={0} max={1} step={0.01} defaultValue={0.5} digits={2} hint /></CatalogItem>
      <CatalogItem variant="control" title="离散刻度滑杆" description="只能在预定档位中选择，滑杆下方同时展示刻度。"><RangeControl label="隐藏层数" min={1} max={5} step={1} defaultValue={3} discrete scale={['1', '2', '3', '4', '5']} digits={0} /></CatalogItem>
    </div></section>

    <section className="kit-section" aria-labelledby="flow-title"><header className="kit-section-head"><h2 id="flow-title">流程控制</h2><p>直接弹出用于连续结果；下拉提示用于学习者确认后进入下一阶段。</p></header><div className="flow-patterns">
      <article className="flow-pattern"><header className="flow-pattern-head"><span className="edu-kicker">模式 1</span><h3>直接弹出</h3><p>操作完成后，下一段内容立即出现。</p></header><ProgressiveReveal revealLabel="完成并显示结果" stage={{ className: 'flow-result', kicker: '结果已出现', title: '模型已完成这一轮计算', description: '这里可以直接展示结果、解释或下一项操作。' }}><NoticeStrip tone="green">当前阶段已完成。</NoticeStrip></ProgressiveReveal></article>
      <article className="flow-pattern"><header className="flow-pattern-head"><span className="edu-kicker">模式 2</span><h3>下拉提示</h3><p>当前步骤完成后，轻量指示标记出下一段内容，不新增空白占位。</p></header><ProgressiveReveal mode="cue" revealLabel="完成当前步骤" resetLabel="重置演示" stage={{ className: 'flow-result', kicker: '下一阶段', title: '开始解释刚才观察到的现象', description: '滚动提示适合阶段边界明显、下一段内容较长的教学流程。' }}><NoticeStrip tone="blue">学习者已确认进入下一阶段。</NoticeStrip></ProgressiveReveal></article></div></section>

    <section className="kit-section" aria-labelledby="questions-title"><header className="kit-section-head"><h2 id="questions-title">考试题型</h2><p>所有题型采用单栏。单选和判断点击即判；多选、填空和简答完成作答后提交。</p></header><div className="question-catalog"><PanelChoiceQuestion title="下面哪个面板展示的是可计算的函数坐标图？" options={panelChoiceOptions} answer="curve" feedback={{ initial: '面板中的媒体槽可以替换为坐标轴、图片、视频或其他可视化。', correct: '判断正确：A 面板提供了可计算的坐标数据。', wrong: '再观察一次：图片或视频本身不是函数坐标图。' }} /><Question title="下面哪个函数可以把输入映射到 0～1？" options={[{ value: 'relu', label: 'ReLU', wrongFeedback: 'ReLU 的正半轴没有上界，输出不局限于 0～1。' }, { value: 'sigmoid', label: 'Sigmoid' }, { value: 'linear', label: 'Linear', wrongFeedback: '线性函数的输出通常没有 0～1 的范围限制。' }]} answer="sigmoid" feedback={{ correct: '回答正确。', wrong: '再想想输出范围。' }} /><Question type="judgement" title="没有激活函数时，多层线性层叠加后仍然等价于线性变换。" options={[{ key: 'T', value: 'true', label: '正确' }, { key: 'F', value: 'false', label: '错误', wrongFeedback: '多个线性变换复合后仍是线性变换，深度不会带来非线性表达能力。' }]} answer="true" /><Question type="multiple" multiple title="哪些属于训练指标？" options={[{ value: 'loss', label: 'Loss', missedFeedback: 'Loss 直接衡量预测误差，是常见训练指标。' }, { value: 'accuracy', label: 'Accuracy', missedFeedback: 'Accuracy 常用于观察训练阶段的预测正确率。' }, { value: 'color', label: '颜色', wrongFeedback: '颜色只是展示属性，不衡量模型训练表现。' }]} answer={['loss', 'accuracy']} /><Question type="fill" title="二分类输出常用 ____ 函数。" blanks={[{ label: '函数名', placeholder: '填写答案' }]} answer="sigmoid" /><Question type="short" title="请解释为什么较小的 Loss 有用。" feedback={{ sample: '已记录你的回答，可以对照后续解释继续完善。' }} /></div></section>

    <section className="kit-section" aria-labelledby="code-title"><header className="kit-section-head"><h2 id="code-title">代码运行块</h2><p>代码主体只读，学习者只填写指定的单行空位，并看到运行状态、帮助和运行时间。</p></header><CodeCompletionBlock className="foundation-preview" language="Python" expectedAnswer="square" inputLabel="填入缺失的函数名" help="这里需要填写 PyTorch 中执行平方运算的函数名。" prefixLines={<><span className="edu-code-line"><span className="edu-code-token--keyword">import</span> <span className="edu-code-token--module">torch</span></span>{'\n'}<span className="edu-code-line">prediction = torch.tensor([1.6])</span>{'\n'}<span className="edu-code-line">target = torch.tensor([7.0])</span>{'\n'}</>} beforeInput="loss = torch." afterInput=" (target - prediction)" /></section>

    <section className="kit-section" aria-labelledby="ending-title"><header className="kit-section-head"><h2 id="ending-title">课程结尾</h2><p>用一个清晰的完成状态收束本节内容，再提供继续学习和延伸观看的入口。</p></header><LessonFooter title="继续你的学习旅程" description="你可以返回课程目录，或在准备好后继续前往下一步。" back={{ href: '../CourseMap/', label: '返回课程目录' }} next={{ href: '../MLP_playground/', label: '学习下一课' }} videos={[{ title: '从直觉理解神经元', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116933504537855&bvid=BV1k3KE6uERK&cid=40029127550&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>' }, { title: '损失如何指导学习？', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116933504537855&bvid=BV1k3KE6uERK&cid=40029127550&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>' }, { title: '激活函数为什么重要？', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116933504537855&bvid=BV1k3KE6uERK&cid=40029127550&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>' }, { title: '从误差到参数更新', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116933504537855&bvid=BV1k3KE6uERK&cid=40029127550&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>' }, { title: '继续探索多层网络', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116933504537855&bvid=BV1k3KE6uERK&cid=40029127550&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>' }]} /></section>
  </ModuleShell>;
}

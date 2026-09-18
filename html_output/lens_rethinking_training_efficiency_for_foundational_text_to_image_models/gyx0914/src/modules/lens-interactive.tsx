import React, { useEffect, useState } from 'react';
import { ModuleIllustration } from './teaching-visuals';

type Props = { chapterId: string; moduleId: string };
const choices: Record<string, string[]> = {
  '1.1': ['训练时', '生成时'],
  '2.1': ['简短', '一半混合', '详细'],
  '4.1': ['FLUX.1', 'SD3', 'FLUX.2', 'VTP'],
  '5.1': ['第 4 层', '第 12 层', '第 18 层', '第 24 层'],
  '6.2': ['原始请求', 'Reasoner', 'GPT-OSS', 'MMDiT'],
  '7.1': ['第一阶段', '第二阶段'],
  '8.1': ['文字分支', '图像分支', '图文交互', '输出方向'],
  '9.2': ['四分之一', '一半', '全部']
};

function feedback(id: string, v: number): { text: string; mood: 'good' | 'bad' | '' } {
  switch (id) {
    case '1.1': return v === 0
      ? { text: '训练时有图片和文字：VAE 把图片变成潜表示，GPT-OSS 把文字变成特征。MMDiT 利用已知图片学习预测更新方向。', mood: '' }
      : { text: '生成时有文字和随机潜噪声：MMDiT 反复更新潜表示，最后由 VAE Decoder 解码成图片。', mood: 'good' };
    case '2.1': return [
      { text: '简短标题只明确“一只猫”，没有点出橘色毛、蓝色椅子和坐在椅面上的关系。', mood: 'bad' as const },
      { text: '一半简短、一半详细：在 Lens-Toy 的 GenEval 消融中，没有超过全详细标题。', mood: '' as const },
      { text: '论文报告：在 Lens-Toy 的 GenEval 消融中，详细标题优于简短或各半混合标题。上方猫图用于讲解，不是这项实验的生成结果。', mood: 'good' as const }
    ][v];
    case '3.1': return { text: '续训只使用 27 个具体尺寸组合；论文报告 Lens 在推理时也能生成未见过的 5:4、6:7 等比例，并达到 1440² 图像面积。', mood: 'good' };
    case '4.1': return v === 2
      ? { text: '选中 FLUX.2：在论文的 Lens-Toy 文生图消融中，其生成表现与收敛速度在四个候选中最好，因此被采用。', mood: 'good' }
      : { text: '这也是论文比较的 VAE 候选之一。作者在文生图训练中比较生成表现与收敛速度；只看把原图重建得多像，无法判断哪个潜空间更适合训练生成模型。', mood: '' };
    case '5.1': return { text: `当前高亮第 ${[4, 12, 18, 24][v]} 层；真实 Lens 把这四层 GPT-OSS 特征全部拼接并投影。c 是随提示词改变的输入特征，不是固定权重。`, mood: 'good' };
    case '6.1': return [
      { text: '起点：文生图时没有“标准答案图片”，而是从随机潜噪声开始。', mood: '' as const },
      { text: '早期更新：模型接收当前潜表示、时刻 t 和文字条件 c，预测更新方向。', mood: '' as const },
      { text: '中途：z 表示当前整幅图的潜表示。采样器沿预测方向多次更新 z；示意图不等于真实数值轨迹。', mood: '' as const },
      { text: '后期：潜表示逐渐形成可解码的结构，但真实单步画质不保证单调变好。', mood: '' as const },
      { text: '终点：VAE 解码器把最终潜表示变成可见图片；生成时仍没有现成答案图片。', mood: 'good' as const }
    ][v];
    case '7.1': return v === 0
      ? { text: '第一阶段：固定 512×512，训练 40 万次迭代。VAE 与 GPT-OSS 冻结，只优化生成骨干。', mood: '' }
      : { text: '第二阶段：混合分辨率续训 40 万次迭代，包含 27 个桶。两阶段均报告使用 128 张 A100 80GB；迭代不是 epoch。', mood: 'good' };
    case '8.1': return [
      { text: '文字分支接收 GPT-OSS 给出的提示词特征 c；c 不是固定模型权重。', mood: '' as const },
      { text: '图像分支处理当前潜表示 z 切出的图像 token；z 不是单个 token。', mood: '' as const },
      { text: 'MMDiT 的两条分支让图文特征在块内相互作用。图中是一块的抽象示意，论文骨干共 48 块。', mood: 'good' as const },
      { text: '骨干预测用于更新潜表示的方向。48 是网络块数，不是 48 个生成采样步。', mood: 'good' as const }
    ][v];
    case '9.2': return { text: `表 1：${['四分之一', '一半', '全部'][v]}提示词覆盖的 GenEval 为 ${['0.916', '0.920', '0.930'][v]}（越高越好）。三组基座相同，均后训练 180 步；这是训练后的外部测试分数，不是单张图片的奖励。`, mood: v === 2 ? 'good' : '' };
    case '6.2': return [
      { text: '用户可能只给出一句模糊要求，尚未形成便于生成的详细提示词。', mood: '' as const },
      { text: 'Reasoner 默认使用 GPT-5.5，把模糊要求改写得更具体；它是生成前的独立模块，可替换而不重训骨干，也不负责后训练评分。', mood: 'good' as const },
      { text: 'GPT-OSS 是另一个模块：把提示词编码为 c，并不是 Reasoner 本身。', mood: '' as const },
      { text: 'MMDiT 骨干利用当前 z、t、c 预测更新方向，再经采样与 VAE 解码得到图像。', mood: 'good' as const }
    ][v];
    default: return { text: '选择一个状态，观察图示和文字如何同时变化。', mood: '' };
  }
}

export const LensInteractive: React.FC<Props> = ({ moduleId }) => {
  const [value, setValue] = useState(0);
  useEffect(() => { setValue(0); }, [moduleId]);
  const f = feedback(moduleId, value);
  const slider = moduleId === '3.1';
  const steps = moduleId === '6.1';
  const labels = choices[moduleId] || [];
  const ratioLabels = ['1:2', '9:16', '2:3', '3:4', '1:1', '4:3', '3:2', '16:9', '2:1'];
  return (
    <div>
      <ModuleIllustration id={moduleId} value={value} />
      {moduleId === '2.1' && <div className="lens-eval-notes">
        <div className="lens-eval-note">
          <strong>Lens-Toy 是什么？</strong>
          <p>它是论文专门用来做消融实验的<strong>缩小版 Lens</strong>：使用 1.2B 图像生成骨干和 Qwen3-0.6B 文字编码器，在 Lens-130M 的 1.3 亿个图文对上训练。三组模型的结构和训练条件相同，只有标题写法不同。</p>
        </div>
        <div className="lens-eval-note">
          <strong>GenEval 测什么？</strong>
          <p>它是一个外部文生图评测集，重点检查图片是否满足文字中的<strong>物体、数量、颜色、位置和属性关系</strong>。论文用检测器和分类器自动核对 553 条提示词；分数越高，说明文字与图像的组合匹配越好。</p>
        </div>
      </div>}
      {slider && <div className="ctrl">
        <label htmlFor={`lens-range-${moduleId}`}>长宽比</label>
        <input id={`lens-range-${moduleId}`} type="range" min={0} max={8} step={1} value={value} onChange={e => setValue(Number(e.target.value))} />
        <span className="val">{ratioLabels[value]}</span>
      </div>}
      {steps && <div className="step-ctrl">
        <button className="tiny ghost" type="button" disabled={value === 0} onClick={() => setValue(v => Math.max(0, v - 1))}>上一步</button>
        <span className="step-label">概念状态 <b>{value + 1}/5</b></span>
        <button className="tiny" type="button" disabled={value === 4} onClick={() => setValue(v => Math.min(4, v + 1))}>下一步</button>
        <span className="step-desc">{value === 0 ? '已到起点' : value === 4 ? '已到终点' : '可继续或返回'}</span>
      </div>}
      {!slider && !steps && <div className="chip-row" role="group" aria-label="选择要观察的状态">
        {labels.map((label, i) => <button key={label} type="button" className={`chip ${i === value ? 'selected' : ''}`} aria-pressed={i === value} onClick={() => setValue(i)}>{label}</button>)}
      </div>}
      {moduleId === '9.2' && <p className="step-desc">GenEval 是后训练完成后的外部评测（越高越好）：四分之一 0.916 · 一半 0.920 · 全部 0.930；相同基座、180 步。</p>}
      {moduleId === '8.1' && <p className="step-desc">示意图上路是文字特征，下路是图像特征；它们在一个代表性 MMDiT 块中相互作用。论文的生成骨干重复 48 个块，图中未展开全部内部运算。</p>}
      {moduleId === '10.1' && <p className="step-desc">上条：采样步数（Lens 20 / Turbo 4）。下条：单张 H100、1024² 用时（3.15 秒 / 0.84 秒）。表 2 各指标均越高越好：GenEval 0.930 / 0.914；OneIG 英文 0.557 / 0.554；LongText 英文 0.937 / 0.927；CVTG 平均分 0.869 / 0.889。不同指标不可相减。</p>}
      <div className={`feedback ${f.mood}`} role="status" aria-live="polite">{f.text}</div>
    </div>
  );
};

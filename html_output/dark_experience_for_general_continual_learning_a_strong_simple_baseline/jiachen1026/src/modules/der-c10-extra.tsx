import React, { useState } from 'react';
import { C, useCanvas, drawPhoto, roundRect, Feedback, Source } from './der-kit';

type Case = { name: string; methods: string[]; means: number[]; spreads?: number[]; feedback: string; source: string };
const cases: Case[] = [
  { name: 'CIFAR-10 · Class-IL · K=500 · 50 轮', methods: ['ER', 'DER', 'DER++'], means: [57.74, 70.51, 72.70], spreads: [.27, 1.67, 1.36], feedback: '在此类别增量条件下，DER++ 比 ER 高 14.96 个百分点；这是保留跨任务类别关系的支持证据。', source: '正文 Table 2' },
  { name: 'CIFAR-10 · Task-IL · K=5120 · 50 轮', methods: ['ER', 'DER', 'DER++'], means: [96.98, 95.43, 96.12], spreads: [.17, .33, .21], feedback: '测试任务身份已知时，ER 的均值高于 DER 与 DER++；更复杂的回放目标不是无条件优势。', source: '正文 Table 2' },
  { name: 'Tiny ImageNet · Class-IL · K=200 · 100 轮', methods: ['ER', 'DER', 'DER++'], means: [8.49, 11.87, 10.96], spreads: [.16, .78, 1.17], feedback: 'DER 为 11.87%，DER++ 为 10.96%。低容量、高类别数条件下，不能宣称 ++ 总比 DER 好。', source: '正文 Table 2' },
  { name: 'Permuted MNIST · Domain-IL · K=500', methods: ['ER', 'DER', 'DER++'], means: [80.60, 87.29, 88.21], spreads: [.86, .46, .39], feedback: '相同标签空间下的域变化中，历史输出关系带来较明显的准确率收益。', source: '正文 Table 2' },
  { name: 'Rotated MNIST · Domain-IL · K=500', methods: ['ER', 'DER', 'DER++'], means: [88.91, 92.24, 92.77], spreads: [1.44, 1.12, 1.05], feedback: '旋转域变化中，DER 与 DER++ 的均值均超过 ER；这不等于自然漂移也会得到相同收益。', source: '正文 Table 2' },
  { name: 'CIFAR-10 · Class-IL · K=500 · 单轮消融', methods: ['ER', 'FDR', 'DER++'], means: [45.22, 21.06, 48.04], feedback: '单轮时 JOINT 也只有 56.74%，远低于 50 轮的 92.20%。此时欠拟合与遗忘同时影响结果。', source: '补充材料 Table 5；此表未给出 ± 数值' },
];
const paperUrl = 'https://proceedings.neurips.cc/paper/2020/hash/b704ea2c39778f07c617f6b7ce480e9e-Abstract.html';
const supplementUrl = 'https://proceedings.neurips.cc/paper_files/paper/2020/file/b704ea2c39778f07c617f6b7ce480e9e-Supplemental.zip';
export function DerC10Extra() {
  const [index, setIndex] = useState(0);
  const chosen = cases[index];
  const ref = useCanvas(ctx => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 1080, 280);
    for (let x = 260; x <= 1010; x += 150) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, 252); ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.stroke(); }
    chosen.means.forEach((value, i) => {
      const y = 42 + i * 77, color = chosen.methods[i].startsWith('DER') ? C.green : C.blue;
      drawPhoto(ctx, 90, y, 100, 59, [.3, .55, .65], color);
      roundRect(ctx, 260, y + 15, 750, 30, 5, C.axis);
      roundRect(ctx, 260, y + 15, 750 * value / 100, 30, 5, color);
    });
  }, [index]);
  return <div className="der-widget">
    <canvas ref={ref} className="der-canvas" aria-label="同一实验条件下三种方法的准确率对照" />
    <div className="der-controls"><label>选择同条件对照 <select value={index} aria-label="标准基准或单轮消融对照" onChange={e => setIndex(Number(e.target.value))}>{cases.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}</select></label></div>
    <Feedback tone={index === 1 || index === 2 ? 'purple' : 'green'}>{chosen.feedback}</Feedback>
    <div className="der-prose">
      <p>本图横轴为 0–100% 准确率，六个刻度依次为 0、20、40、60、80、100%；三行从上到下与表格方法顺序一致。切换条件会替换整组结果，不把不同设定拼成一条改进曲线。下表为关键摘录，完整结果请看原文。</p>
      <div className="der-table-wrap"><table><caption>{chosen.name} · {chosen.source}</caption><thead><tr><th>方法</th><th>最终平均准确率（%，越高越好）</th></tr></thead><tbody>{chosen.methods.map((m, i) => <tr key={m}><th scope="row">{m}</th><td>{chosen.means[i].toFixed(2)}{chosen.spreads ? ` ± ${chosen.spreads[i].toFixed(2)}` : ''}</td></tr>)}</tbody></table></div>
      <p>标准基准中 Task-IL 能用任务身份屏蔽无关类别，所以整体类别关系的价值可能比 Class-IL 小；这解释了作者为何认为 DER 的优势依赖设定，属于与结果一致的机制解释，不是排除所有其他原因的因果证明。单轮消融提示：如果模型连联合训练都欠拟合，低分就不能全部归咎于遗忘。补充材料 Tiny ImageNet 的单轮 K=500 结果同样如此：ER 8.39、FDR 4.76、DER++ 8.65，JOINT 单轮 19.37，100 轮 59.99。</p>
      <Source>正文 Table 2：标准基准的十次初始化结果与反例。</Source>
      <Source href={supplementUrl}>补充材料 §F.3，Table 5：单轮训练消融。</Source>
      <h4>Fig. 2 的六个子图，分别支持什么？</h4>
      <div className="der-table-wrap"><table><thead><tr><th>图与坐标</th><th>实验要检验什么</th><th>论文观察与解释边界</th></tr></thead><tbody>
        <tr><th scope="row">2(a)：高斯参数噪声强度 σ → 平均训练损失</th><td>S-CIFAR-10、K=500，向训练后参数加入不同强度扰动，检验邻域敏感度。</td><td>DER/DER++ 比 ER、尤其 FDR 更不敏感；参数化方式会影响平坦性，不能由这条曲线单独推出泛化因果关系。</td></tr>
        <tr><th scope="row">2(b)：缓存容量 → Tr(F̂)</th><td>用单样本梯度外积的经验 Fisher 迹，诊断训练后几何。</td><td>DER，尤其 DER++ 的迹较低；FDR 在大缓存的异常与其失败相关，但相关不等于已证实的失败原因，F̂ 也不普遍等于 Hessian。</td></tr>
        <tr><th scope="row">2(c)：训练进程 → ECE</th><td>Tiny ImageNet 上追踪预测置信度与正确率的一致性。</td><td>DER/DER++ 展现较好的校准；并未额外做事后校准，ECE 仍依赖分箱，不能替代准确率。</td></tr>
        <tr><th scope="row">2(d)：置信度区间 → 经验正确率</th><td>Reliability Diagram（可靠性图）观察最终模型是否靠近“置信度=正确率”对角线。</td><td>论文方法更接近校准目标；这并不意味着每个类别或分布外样本都可靠。</td></tr>
        <tr><th scope="row">2(e)：缓存规模／学习设置 → 从缓存重新训练的准确率</th><td>用缓存单独训练新网络，比较记忆的信息量；另考察用每类 10 个测试样本微调后的适应。</td><td>DER 缓存特别在小预算时更有信息；微调部分显式使用并从后续评估中移除那一小份测试数据，不能当作普通完全未触碰测试集的分类成绩。</td></tr>
        <tr><th scope="row">2(f)：连续任务进度 → 累计墙钟时间</th><td>在 S-CIFAR-10 的 5 个任务上比较实际计算开销。</td><td>DER 与一些简单回放方法相近，GEM 随任务增多开销更突出；Titan X / i7-6850K 上的测量不可直接外推所有硬件。</td></tr>
      </tbody></table></div>
      <p>正文另报告该测量条件下 GSS 约 0.73 样本/秒、DER++ 约 3.71 样本/秒。这是特定实现与设备的吞吐对照，既不是本网页运行速度，也不是现代所有硬件的固定比值。本教程未从原图估读或伪造各条曲线的原始点。</p>
      <p>补充材料 Fig. 3 横轴是内存占用、纵轴是准确率，同一方法的多个点表示不同缓存规模，用来补充“相同样本个数并非相同总字节数”的比较。Fig. 4 进一步比较 ER 的缓存策略变体：极少记忆下，reservoir 可能遗漏某些类别。作者猜想 DER++ 可从非最大输出保留这些“缺席类别”的信息；这个说法是解释性猜想，并不是已经证明任何被遗漏类别都能恢复。</p>
      <Source>正文 §5，Fig. 2(a–f)：模型分析及运行时间。</Source>
      <Source href={supplementUrl}>补充材料 §§C、F.2，Fig. 3–4：内存占用与回放变体。</Source>
      <h4>研究视角：优点与局限怎样同时成立？</h4>
      <p>贡献在于把简单的历史输出约束、水库采样和标签回放组合成强基线，减少对任务切换时机的依赖，并用 MNIST-360 检验混合变化。工业视觉质检可以借鉴“保留少量旧图像及旧输出”，但这只是应用设想：真实系统还要核对标签到达、隐私许可、延迟、推理算力和类别变化。</p>
      <p>局限也具体：历史 logits 可能错误或过时；水库采样不保证类别均衡，且更代表历史频率；固定 C 是存储与目标对齐的重要条件；缓存原图有隐私与数据保留成本；额外 logits 占字节；α、β 需要验证集选择。实验主要是小型图像与有标签分类，不能直接证明时间序列、无标签或无限新类别上的效果。平坦性和校准分析没有给出一般遗忘界。</p>
      <h4>迁移到在线时间序列：应先改哪一层假设？</h4>
      <p>Online Learning（在线学习）强调逐步接收与更新；Continual Learning（持续学习）进一步考察旧能力保留；Concept Drift（概念漂移）关心分布随时间改变；Optimization（优化）提供多目标权衡与局部几何视角。Time Series Forecasting（时间序列预测）把“旧分类得分”换成过去模型的多步预测向量，但需要重新设计监督损失。</p>
      <p>设窗口输入 x<sub>t</sub>、预测模型 g<sub>θ</sub>(x<sub>t</sub>)∈ℝ<sup>H×D</sup>，可保留历史预测 z<sub>t</sub>，把新样本交叉熵换成 MSE 或 MAE，并对旧预测使用输出一致性项。这是研究改造，不是论文原始 DER 实验。预测时尚未观测的未来 y 不能提前进入训练；先发出预测，待真实值到达后才计算监督损失和入库标签，记录预测时刻、标签到达时刻、当时目标版本。严格时间切分，验证与测试之间不能打乱窗口泄露未来。</p>
      <p>在真正变化的系统里，旧关系有时应该遗忘。始终追随陈旧预测会阻碍适应；要同时测近期预测误差、历史／重复状态保留、适应延迟和内存字节，而不是只用一个最终准确率判断“越保留越好”。传感器预测、设备状态监测与需求预测都可作为候选场景，尚须用真实数据验证。</p>
      <h4>三个可证伪的研究方案（新颖性尚未核查）</h4>
      <div className="der-table-wrap"><table><thead><tr><th>假设与方法</th><th>基线与消融</th><th>评价与反证</th></tr></thead><tbody>
        <tr><th scope="row">旧输出的可靠性随置信度与年龄变化；按校准置信度／目标年龄加权 logits 正则。</th><td>ER、DER、DER++、仅年龄、仅置信度、同等随机权重；校准只用训练／验证历史。</td><td>固定字节与更新次数，在突然、渐变、复现变化下跑 10 个种子。若不能在相同保留水平下降低适应延迟，或权重只追随错误置信度，则不支持假设。</td></tr>
        <tr><th scope="row">相同字节预算下，压缩 logits 或分配不同记忆槽能改善存储效率。</th><td>原始 float32、低精度／截断 logits、等样本数、严格等总字节；分别消融采样与压缩。</td><td>同时报告 ACC／保留误差、实际缓存字节、峰值内存和墙钟时间。若收益在等字节控制后消失，原优势可能主要来自预算差异。</td></tr>
        <tr><th scope="row">漂移感知的输出约束能兼顾预测适应与复现状态保留。</th><td>滑动窗口、普通回放、直接预测向量版 DER、固定衰减、在线变化检测触发衰减；使用同一骨干与标签延迟。</td><td>严格滚动评估，测 MAE、RMSE、适应延迟、重复状态误差、字节和计算量。加入稳定流对照；若只在单一合成变化上有效，不能支持普适改进。</td></tr>
      </tbody></table></div>
      <p>发表价值还需要检索已有的目标加权、记忆压缩与漂移感知回放工作。这里提出可执行问题和判据，没有声称它们尚无人研究。</p>
      <h4>十二项精读记录：从理解到复现与批评</h4>
      <ol>
        <li><strong>Problem（问题）</strong>：有标签数据依次到达、分布变化，有限资源下如何学习新内容并保留旧能力，且不依赖人为任务切换信号？</li>
        <li><strong>Background（背景）</strong>：离线联合访问全部历史数据常不可行；仅优化当前数据会发生灾难性遗忘。标签以外的输出关系提供潜在的额外约束。</li>
        <li><strong>Setting（设定）</strong>：输入、标签、固定输出维度和固定容量记忆。标准任务实验与单遍 MNIST-360 的信息条件、训练轮数和测试协议必须分开记录。</li>
        <li><strong>Main Idea（核心思想）</strong>：从训练轨迹取历史 logits，以原输入重放并匹配旧输出；DER++ 再用旧标签监督。</li>
        <li><strong>Method（方法）</strong>：水库存储 (x,z) 或 (x,z,y)，旧目标脱离梯度图；新监督损失、输出一致性和旧标签损失组成更新目标。</li>
        <li><strong>Mathematics（数学）</strong>：能推导交叉熵与平方误差梯度、水库保留概率 K/n；知道高温 KL 近似要求中心化，知道经验 Fisher 与 Hessian 一般不同。</li>
        <li><strong>Algorithm（算法）</strong>：先在旧缓存取样，保存当前更新前的 detached logits，再反向传播、更新参数、按样本入库；推理只需当前网络。</li>
        <li><strong>Experiments（实验）</strong>：固定数据、骨干、顺序、信息条件、训练轮数、缓存和调参规则；Table 2 看标准协议，Table 3 看 MNIST-360，Table 5 看单轮欠拟合干扰。</li>
        <li><strong>Strength（贡献）</strong>：机制简洁、无需任务末教师更新，在论文多个设定上是强基线；新协议与模型分析补充了只比最终准确率的视角。</li>
        <li><strong>Limitation（局限）</strong>：旧目标可能有偏，类别和字节预算假设重要，少量缓存可能漏类；DER++ 有反例，没有一般无遗忘保证。</li>
        <li><strong>Connection（联系）</strong>：连接在线学习、持续学习、概念漂移与多目标优化；预测任务应替换分类损失，并尊重未来标签尚未到达的时间约束。</li>
        <li><strong>Research Extension（研究延伸）</strong>：设计目标可靠性、等字节比较和漂移感知预测实验；提出能被数据推翻的假设，再核查新颖性。</li>
      </ol>
      <p>四遍复读路径：第一遍用第 1–3 章讲清问题与贡献；第二遍逐行推导第 4–6、8 章；第三遍按第 7 章实现并核对第 9 章协议；第四遍用本章反例、局限与实验方案提出自己的判断。论文逻辑映射为：标题／摘要／引言→第 1 章，定义→第 2 章，相关工作→第 3 章，方法→第 4–7 章，数学辨析→第 5、8 章，实验→第 9–10 章，结论与研究→本章。</p>
      <Source href={paperUrl}>论文正文、结论与结果；本节研究方案明确属于教程提出的待验证延伸。</Source>
    </div>
  </div>;
}

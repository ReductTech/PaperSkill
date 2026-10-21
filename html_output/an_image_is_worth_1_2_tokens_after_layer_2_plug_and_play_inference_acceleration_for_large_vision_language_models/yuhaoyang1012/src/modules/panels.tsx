import React from 'react';
import type { WidgetProps } from './registry';
import { EVIDENCE, LINKS } from './glossary';
import { paperFlopsB, REPORTED_13B, reportedKey } from './stageKit';

// ============================================================================
//  章节内嵌的证据 / 对比面板（无外框模块，和正文同一阅读流）
// ============================================================================

export function Ev({ k }: { k: string }) {
  const e = EVIDENCE[k];
  return (
    <span className="ev" tabIndex={0} role="button" data-ev={k}>
      {e ? e.label : k}
    </span>
  );
}

export function Term({ k, children }: { k: string; children?: React.ReactNode }) {
  return (
    <span className="term" tabIndex={0} role="button" data-term={k}>
      {children ?? k}
    </span>
  );
}

// ---------------------------------------------------------------------------
//  第 5 章：论文 vs 代码
// ---------------------------------------------------------------------------
export const PaperVsCode: React.FC<WidgetProps> = () => (
  <section className="pvc" aria-label="论文描述与官方代码的差异">
    <div className="panel-head">
      <span className="panel-kicker">论文 vs 代码</span>
      <h3>排序分数究竟怎么算</h3>
    </div>
    <div className="pvc-grid">
      <div className="pvc-col">
        <div className="pvc-tag paper">论文 <Ev k="sec41" /></div>
        <p>
          在第 K 层，以每个 token <b>从所有其他 token 处收到的平均注意力</b>作为排序准则 φ<sub>attn</sub>，排名最后的 R% 图像 token 在之后的层中被剪掉。
        </p>
      </div>
      <div className="pvc-col">
        <div className="pvc-tag code">官方代码 <Ev k="code" /></div>
        <ol className="pvc-steps">
          <li>取第 K 层的注意力矩阵（<b>代码索引为 K−1，即剪枝前一层</b>：循环走到索引 K 时，读取上一层输出的注意力），<b>对所有注意力头求平均</b>；</li>
          <li><b>只取最后一个查询位置</b>（序列最后一个 token）那一行；</li>
          <li>截取其中视觉 token 那一段（系统提示之后的 576 个位置）；</li>
          <li>
            用 <Term k="topk" /> 保留得分最高的 (1−R%) × N<sub>img</sub> 个（N<sub>img</sub> = 576），其余剪掉。
          </li>
        </ol>
        <pre className="pvc-code" aria-label="代码逻辑示意（转述）">
{`attn = 第K层注意力          # 代码索引 K−1（剪枝前一层）[头, 查询, 键]
avg  = attn.mean(头)         # 平均各注意力头
row  = avg[-1]               # 只取最后一个查询
vis  = row[sys : sys+576]    # 视觉 token 段
keep = vis.topk((1-R)*N_img) # N_img=576，保留得分最高者`}
        </pre>
        <a className="pvc-link" href={LINKS.code} target="_blank" rel="noopener">
          查看官方实现 modeling_llama.py L738–746 ↗
        </a>
      </div>
    </div>
    <ul className="pvc-notes">
      <li>
        <b>差别：</b>论文说“所有其他 token 的平均注意力”，代码实际用的是“最后一个 token 对各视觉 token 的注意力（各头平均）”。两者并不等价。
      </li>
      <li>
        <b>“只剪一次”限于一次前向：</b>同一次 forward 里只在第 K 层排序、剪枝一次。原始实现不使用 <Term k="KV Cache" />，每生成一个 token 都要整条序列重新前向，因此<b>每次前向都会在第 K 层重新排序剪枝</b>（依据当时的最后一个 token）。后来加入的 KV Cache 版本只在首次前向剪一次，之后的解码步共享同一组视觉 token <Ev k="readme" />。
      </li>
      <li>
        <b>K=0：</b>代码中注意力掩码实现在 K=0 时改为随机保留，与论文“K=0 用随机排序”一致 <Ev k="sec41" />。
      </li>
    </ul>
  </section>
);

// ---------------------------------------------------------------------------
//  第 6 章：FLOPs 口径对账
// ---------------------------------------------------------------------------
const AUDIT: { label: string; K: number; R: number }[] = [
  { label: '完整模型', K: 0, R: 0 },
  { label: 'K=2，R=50%', K: 2, R: 0.5 },
  { label: 'K=3，R=50%', K: 3, R: 0.5 },
  { label: 'K=5，R=50%', K: 5, R: 0.5 },
  { label: 'K=2，R=75%', K: 2, R: 0.75 },
  { label: 'K=2，R=90%', K: 2, R: 0.9 },
  { label: 'K=0，R=50%', K: 0, R: 0.5 },
];

export const FlopsAudit: React.FC<WidgetProps> = () => (
  <section className="audit" aria-label="FLOPs 口径对账">
    <div className="panel-head">
      <span className="panel-kicker">口径对账</span>
      <h3>本页复算 vs 论文报告（LLaVA-1.5-13B）</h3>
    </div>
    <div className="audit-table-wrap">
      <table className="paper audit-table">
        <thead>
          <tr>
            <th>配置</th>
            <th>论文报告</th>
            <th>本页复算</th>
            <th>对照</th>
          </tr>
        </thead>
        <tbody>
          {AUDIT.map((a) => {
            const rep = REPORTED_13B[reportedKey(a.K, a.R)];
            const calc = paperFlopsB(a.K, a.R);
            const same = rep && Math.abs(rep.b - calc) < 0.05;
            return (
              <tr key={a.label}>
                <td>{a.label}</td>
                <td>
                  {rep ? `${rep.b.toFixed(1)}B` : '—'} {rep ? <Ev k={rep.src === 'Table 5' ? 'tab5' : 'tab1'} /> : null}
                </td>
                <td>{calc.toFixed(1)}B</td>
                <td className={same ? 'ok' : 'warn'}>{same ? '一致' : '与本页复算不一致，原因未知'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <ul className="audit-notes">
      <li>
        <b>复算假设：</b>d=5120、m=13824、T=40；视觉 token 576、文字 token 36；文字不剪，剪后长度 = 36 + (1−R%)×576。<b>36 是为拟合表格而采用的长度假设</b>，不是论文声明每个样本固定如此。
      </li>
      <li>
        <b>B 数值的含义：</b>它们在数值上等于“全模型公式 ÷ 层数”的归一化量（按层平均的理论 <Term k="FLOPs" />），不是完整前向的实测总运算量。
      </li>
      <li>
        <b>K=0、R=50%：</b><Ev k="tab5" /> 报告 78.9B，本页复算为 80.9B——与本页复算不一致，原因未知。论文未报告的其他配置均为<b>公式外推</b>。
      </li>
      <li>
        <b>7B 教学预设</b>只计 576 个视觉 token、只显示比例，不复现论文的 7B 基线 99.3B。
      </li>
    </ul>
  </section>
);

// ---------------------------------------------------------------------------
//  第 8 章：评测协议与样本规模
// ---------------------------------------------------------------------------
const PROTO: { b: React.ReactNode; set: React.ReactNode; metric: React.ReactNode; ev: string }[] = [
  { b: 'Nocaps / Flickr30k', set: '论文未说明子集规模；提示词为 “Describe the image in one sentence.”', metric: <><Term k="CIDEr" />，越高越好</>, ev: 'suppA' },
  { b: 'A-OKVQA', set: '论文称 development set，多选题', metric: '多选准确率', ev: 'suppA' },
  { b: <Term k="MMMU" />, set: '论文称 development set；按 13B 基线 36.4 与 MMMU 论文验证集的分数比对，实为 900 题的验证集', metric: '多选准确率', ev: 'suppA' },
  { b: 'OCR-VQA', set: '测试集', metric: <Term k="Rouge-L" />, ev: 'suppA' },
  { b: 'PCA-Bench', set: '开放 / 封闭测试集，三个领域平均', metric: '感知 P、认知 C、行动 A 与 G-PCA', ev: 'tab5' },
  { b: 'TGIF / MSVD / MSRVTT', set: '每个数据集只取前 1000 条', metric: 'GPT 评测的准确率与得分（Video-ChatGPT 工具）', ev: 'suppA' },
  { b: <Term k="MME" />, set: '14 个是 / 否子任务', metric: '子任务 = 准确率 + 两问全对率，总分求和', ev: 'tab3' },
];

export const EvalProtocol: React.FC<WidgetProps> = () => (
  <section className="proto" aria-label="评测协议">
    <div className="panel-head">
      <span className="panel-kicker">读分数之前</span>
      <h3>每个分数是怎么测出来的</h3>
    </div>
    <div className="audit-table-wrap">
      <table className="paper proto-table">
        <thead>
          <tr>
            <th>基准</th>
            <th>评测集与规模</th>
            <th>指标 / 协议</th>
          </tr>
        </thead>
        <tbody>
          {PROTO.map((p, i) => (
            <tr key={i}>
              <td>
                {p.b} <Ev k={p.ev} />
              </td>
              <td>{p.set}</td>
              <td>{p.metric}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="proto-note">
      所有实验使用贪心解码；论文没有报告多次运行的方差或 <Term k="标准误" />。因此 MMMU 36.4→38.1（13B，K=2、R=75%）、MME 1827.75→1849.68、视频平均准确率 0.48→0.49 这类小幅上升，<b>不等于剪枝提升了模型能力</b>，可能落在评测波动之内。
    </p>
  </section>
);

// ---------------------------------------------------------------------------
//  第 9 章：三种实现与两种延迟
// ---------------------------------------------------------------------------
export const ImplModes: React.FC<WidgetProps> = () => (
  <section className="impl" aria-label="实现方式与延迟口径">
    <div className="panel-head">
      <span className="panel-kicker">别把数字混在一起</span>
      <h3>效果、延迟与 KV Cache 分别来自哪里</h3>
    </div>
    <div className="impl-grid">
      <div className="impl-card">
        <div className="impl-n">01</div>
        <h4>效果评测 · token masking</h4>
        <p>
          官方 README 说明：复现 K/R 消融（<Ev k="fig6" />）的代码用注意力掩码屏蔽被剪 token，<b>不带来加速</b>，便于公平比较效果。论文没有逐表说明每个效果实验用的是哪种实现。
        </p>
      </div>
      <div className="impl-card">
        <div className="impl-n">02</div>
        <h4>真实延迟 · token dropping</h4>
        <p>
          <Ev k="tab4" />：单张 A40、A-OKVQA，FastV 设为 <b>K=0、R=50%（随机剪枝）</b>，报告总耗时与单样本延迟。README 另有 A100 上 K=2 的“首个输出 token 延迟”表 <Ev k="readme" />——硬件与指标都不同，不能与 Table 4 直接比较。
        </p>
      </div>
      <div className="impl-card">
        <div className="impl-n">03</div>
        <h4>后来加入 · KV Cache</h4>
        <p>
          原始实现不支持 <Term k="KV Cache" />，每次前向都重新剪枝；后来的 KV Cache 版本只在首次前向剪一次。README 报告单图场景延迟约降 8%，视频场景（K=2、R=50%）最多约 25%，这些数字不在论文中。
        </p>
      </div>
    </div>
    <p className="impl-note">
      <b>首 token 延迟 ≠ 端到端延迟：</b>首 token 延迟只覆盖“读完输入并给出第一个字”，端到端还包括之后每一步解码。A-OKVQA 只输出一个选项字母，两者较接近；回答一长，差距就会拉大（本页解读）。
    </p>
  </section>
);

// ---------------------------------------------------------------------------
//  第 10 章：证明了什么 / 作者如何解释 / 仍然未知
// ---------------------------------------------------------------------------
export const Verdict: React.FC<WidgetProps> = () => (
  <section className="verdict" aria-label="结论边界">
    <div className="panel-head">
      <span className="panel-kicker">结论边界</span>
      <h3>这篇论文到底说明了什么</h3>
    </div>
    <div className="verdict-grid">
      <div className="vd-col proven">
        <div className="vd-tag">论文证明了什么（在所测设置下）</div>
        <ul>
          <li>LLaVA-1.5-7B、1000 个样本上，深层视觉 token 的注意力效率最低 <Ev k="fig3" /><Ev k="fig4" />。</li>
          <li>在所测模型与基准上，K=2、R=50% 等配置的任务分数基本保持 <Ev k="tab1" /><Ev k="tab2" /><Ev k="tab5" /><Ev k="tab6" />。</li>
          <li>同样剪一半，剪图像好于剪文字、好于训练时池化 <Ev k="tab7" />。</li>
          <li>13B + FastV（K=0、R=50%）在 A40 上单样本延迟与原版 7B 基本追平 <Ev k="tab4" />。</li>
        </ul>
      </div>
      <div className="vd-col explain">
        <div className="vd-tag">作者如何解释</div>
        <ul>
          <li>“锚点”假设：浅层把与图像、指令相关的信息聚合到少数非图像 token，深层偏好关注这些锚点 <Ev k="sec34" />。</li>
          <li>这一解释没有逐层验证；它与因果注意力顺序（系统提示排在图像之前）如何对应，论文没有说明。</li>
        </ul>
      </div>
      <div className="vd-col unknown">
        <div className="vd-tag">仍然未知</div>
        <p className="vd-key">
          FastV 观察到深层视觉 Token 获得的注意力较低，并展示在所测试设置下剪枝仍能保持一定任务表现；但它没有证明“注意力低＝该 Token 不重要”是普遍成立的因果规律。
        </p>
        <ul>
          <li>注意力排序相对随机的小幅优势是否超出噪声（随机只跑一次）。</li>
          <li>K=0 的损失来自“剪得太早”还是“没有排序依据”——两者在实验中同时改变。</li>
          <li>理论 FLOPs 降幅能换来多少真实加速，取决于实现与是否使用 KV Cache。</li>
        </ul>
      </div>
    </div>
  </section>
);

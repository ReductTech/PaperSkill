import React, { useState } from 'react';
import { Btn, C, Seg, Tag } from './sv-kit';
import { Rich } from '../sv/Rich';
import { LEVELS, VERDICTS, type Level } from '../sv/closing';
import type { WidgetProps } from './registry';

// 10.1 论文 ↔ 代码对照清单，以及收束的结论分级模块。
// 两者都是“筛选 + 条目列表 + 所选内容”：选中项只有一个状态源，并维护不变式“选中项一定属于当前筛选结果”——
// 切换筛选时若选中项不在结果里，就选第一项；条目列表只列当前筛选结果，所以点选不会选到被筛掉的项。
// 跳到对应章节：派发 sv-jump 事件，由 App 展开并定位。

export const jumpTo = (n: number) => window.dispatchEvent(new CustomEvent('sv-jump', { detail: n }));

type St = 'diff' | 'same' | 'unwritten' | 'missing';
const ST: Record<St, { label: string; color: string }> = {
  diff: { label: '不一致', color: C.red },
  same: { label: '一致', color: C.green },
  unwritten: { label: '论文未写', color: C.amber },
  missing: { label: '代码未提供', color: C.muted },
};

interface Item {
  id: string;
  title: string;
  st: St;
  paper: string;
  code: string;
  note: string;
  chap: number;
}

const ITEMS: Item[] = [
  { id: 'raters', title: '评分员选择', st: 'same', chap: 3, paper: 'Eq. (5)(6)：嵌入相关度 r ≥ mean(r) 的文本 token [[ev:eq56]]', code: '进入第 0 层前的嵌入，softmax 沿文本维、对视觉维平均，取 > 均值 [[ev:cRaters]]', note: '只差一个等号；代码的候选包括“ASSISTANT:”等模板 token。' },
  { id: 'score', title: '视觉 token 打分', st: 'same', chap: 4, paper: 'Eq. (2)(3)：评分员（query）× 视觉（key）的注意力，对评分员平均 [[ev:eq23]]', code: '头平均 → 评分员行、视觉列 → 平均 → topk [[ev:cScore]]', note: '计算顺序一致。' },
  { id: 'howmany', title: '每层删多少', st: 'diff', chap: 5, paper: 'Eq. (7)：N = λ·(Lv − rank(P))，N = 0 时跳过 [[ev:eq7]]', code: '图像版：第 2、6、15 层按写死的配额 topk，无求秩代码 [[ev:cTopk]]；视频分支：保留 rank(P) 个 [[ev:vRank]]', note: '论文没有给 λ，也没有说明表 1 用哪种策略。rank(P) 不超过评分员个数。' },
  { id: 'where', title: '在哪几层剪', st: 'unwritten', chap: 7, paper: '只说“逐层渐进稀疏化”，没有给出层号', code: '图像版 [2, 6, 15]（0 起计）[[ev:cLoc]]；视频分支只在第 1 层 [[ev:vLoc]]', note: '剪枝层本身用剪枝前的 token 完整计算一遍。' },
  { id: 'tau', title: '回收比例 τ', st: 'unwritten', chap: 6, paper: '回收被删池中“top-τ%”的 token，τ 未给 [[ev:recycle]]', code: 'int(删除数 × 0.3) + 1 [[ev:cRecycle]]', note: '' },
  { id: 'theta', title: '簇数', st: 'unwritten', chap: 6, paper: 'C = θ·Lr，θ 未给', code: 'int(回收数 / 10) + 1；k 近邻的 k 也取簇数 [[ev:cRecycle]] [[ev:cCluster]]', note: '' },
  { id: 'assign', title: '归簇距离', st: 'diff', chap: 6, paper: '按余弦相似度分给最近的中心 [[ev:recycle]]', code: '按（除以 √C 的）欧氏距离取最近中心 [[ev:cAssign]]', note: '' },
  { id: 'merge', title: '组内合并', st: 'diff', chap: 6, paper: 'Eq. (10)：组内逐元素求和', code: '权重 1 / 组内总权重，即求平均 [[ev:cMerge]]', note: '求和会让向量长度约放大为组内 token 数倍。' },
  { id: 'flash', title: 'FlashAttention 兼容', st: 'diff', chap: 4, paper: '附录 B：第二遍 FlashAttention + 特制 V 矩阵 [[ev:appB]]', code: '32 层挂 FlashAttention2；剪枝层另外显式算完整 softmax(QKᵀ/√d) [[ev:cBuilder]] [[ev:cLogits]]', note: '按附录字面推导，方向与 Eq. (3) 相反（§4.2）。' },
  { id: 'flops', title: 'FLOPs 计数', st: 'diff', chap: 9, paper: 'Eq. (11)：每层 6ND² + 2N²D，FFN 中间维按 D [[ev:eq11]]', code: '每层 4nd² + 2n²d + 3ndm，m = 11008 [[ev:cFlops]]', note: '表 1 的 TFLOPs 能用代码计数式复算（需假设文本长度）。' },
  { id: 'timing', title: '延迟的计时范围', st: 'diff', chap: 9, paper: '附录 F：CUDA 时间包含图像编码（如适用）、KV Cache 读取（如适用）与 Transformer 前向，不含模型加载 [[ev:appF]]', code: '计时起点在评分员选择之后、终点在解码层循环之后，只在预填充时计时；视觉编码与评分员选择不在计时范围内 [[ev:cTiming]]', note: '表 1 的延迟用的是哪种计时，论文与代码都没有说明，具体对应关系尚未确认。' },
  { id: 'count', title: '“保留 R 个”的含义', st: 'unwritten', chap: 7, paper: '表 1 “Retain 192 / 128 / 64 Tokens” [[ev:tab1]]', code: '32 层“处理后”视觉 token 数的平均，打印为 equal token num [[ev:cCount]]', note: '192 档逐层 576 → 309 → 204 → 113。' },
  { id: 'pos', title: '剪枝后的位置编号', st: 'unwritten', chap: 7, paper: '未讨论', code: '截取前 n 个位置号（连续重排）；解码时位置号取各层缓存长度 [[ev:cConcat]] [[ev:cDecodePos]]', note: '' },
  { id: 'scripts', title: '评测脚本与其他模型', st: 'missing', chap: 10, paper: '表 1 八个基准；表 2 Qwen2-VL；图 4 Mini-Gemini', code: 'README 列 5 个评测脚本，固定提交只有 mme / pope / textvqa；没有 Qwen2-VL、Mini-Gemini 实现', note: '复现表 1 其余基准需自行补脚本。' },
];

type Filter = 'all' | St;

export function SvCodemap(_: WidgetProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState('howmany');
  const list = ITEMS.filter((x) => filter === 'all' || x.st === filter);
  const changeFilter = (f: Filter) => {
    setFilter(f);
    const next = ITEMS.filter((x) => f === 'all' || x.st === f);
    if (!next.some((x) => x.id === sel)) setSel(next[0].id);
  };
  const cur = list.find((x) => x.id === sel);
  if (!cur) throw new Error(`10.1 不变式被破坏：选中项 ${sel} 不在筛选结果里`);
  const count = (s: St) => ITEMS.filter((x) => x.st === s).length;

  return (
    <div className="sv-live sv-mod">
      <Seg
        label="筛选"
        value={filter}
        onChange={changeFilter}
        small
        options={[
          { value: 'all' as Filter, label: `全部 ${ITEMS.length}` },
          ...(Object.keys(ST) as St[]).map((s) => ({ value: s as Filter, label: `${ST[s].label} ${count(s)}` })),
        ]}
      />
      <div className="sv-ld">
        <div className="sv-list" role="group" aria-label="对照条目">
          {list.map((x) => (
            <button key={x.id} type="button" aria-pressed={x.id === sel} onClick={() => setSel(x.id)}>
              <i className="sv-dot" style={{ background: ST[x.st].color }} aria-hidden="true" />
              <span>{x.title}</span>
            </button>
          ))}
        </div>
        <div className="sv-detail" aria-live="polite">
          <h5>
            {cur.title}　<span className="sv-badge" style={{ color: ST[cur.st].color, borderColor: ST[cur.st].color }}>{ST[cur.st].label}</span>
          </h5>
          <dl>
            <div>
              <dt>论文怎么说</dt>
              <dd>
                <Rich text={cur.paper} />
              </dd>
            </div>
            <div>
              <dt>代码怎么做（固定提交 734d900 / video 分支 f05b898）</dt>
              <dd>
                <Rich text={cur.code} />
              </dd>
            </div>
            {cur.note ? (
              <div>
                <dt>补充</dt>
                <dd>{cur.note}</dd>
              </div>
            ) : null}
          </dl>
          <div>
            <Btn onClick={() => jumpTo(cur.chap)}>去 §{cur.chap} 细看 →</Btn>
          </div>
        </div>
      </div>
      <p className="sv-small">
        <Tag kind="paper" /> <Tag kind="code" /> 每条附论文页码与代码行号；“一致 / 不一致”是本页的判断。
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- 收束：结论分级
export function SvVerdict(_: WidgetProps) {
  const [level, setLevel] = useState<Level>('proven');
  const [sel, setSel] = useState(VERDICTS.find((v) => v.level === 'proven')!.id);
  const list = VERDICTS.filter((v) => v.level === level);
  const changeLevel = (l: Level) => {
    setLevel(l);
    const next = VERDICTS.filter((v) => v.level === l);
    if (!next.some((v) => v.id === sel)) setSel(next[0].id);
  };
  const cur = list.find((v) => v.id === sel);
  if (!cur) throw new Error(`结论分级不变式被破坏：${sel} 不属于 ${level}`);
  const tone: Record<Level, string> = { proven: C.green, explained: C.amber, unknown: C.muted };
  return (
    <div className="sv-live sv-mod">
      <Seg label="等级" value={level} onChange={changeLevel} options={LEVELS.map((l) => ({ value: l.level, label: `${l.title}（${VERDICTS.filter((v) => v.level === l.level).length}）` }))} />
      <p className="sv-small">{LEVELS.find((l) => l.level === level)!.desc}</p>
      <div className="sv-ld">
        <div className="sv-list" role="group" aria-label="结论条目">
          {list.map((v) => (
            <button key={v.id} type="button" aria-pressed={v.id === sel} onClick={() => setSel(v.id)}>
              <i className="sv-dot" style={{ background: tone[v.level] }} aria-hidden="true" />
              <span>{v.claim}</span>
            </button>
          ))}
        </div>
        <div className="sv-detail" aria-live="polite">
          <h5>{cur.claim}</h5>
          <dl>
            <div>
              <dt>依据</dt>
              <dd>
                <Rich text={cur.basis} />
              </dd>
            </div>
          </dl>
          <div>
            <Btn onClick={() => jumpTo(cur.chap)}>去 §{cur.chap} 细看 →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

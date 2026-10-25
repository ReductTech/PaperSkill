import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useTween } from '../lib/hooks';
import { Btn, Feedback, Seg, Slider } from '../ui/kit';
import { MODELS, PAPER_ROWS, computeFlops, getModel, keepOf, subsetModel, type FlopOpts, type KeepRule } from '../lib/flops';

// 9.1 TFLOPs 复算器：与 tflops.py 同口径（各数据集比例取算术平均）。
// 论文配置 + 默认口径 → 与表格比对；改动任何开关或参数 → 标记为“公式外推”。
// 从论文配置切到“自定义”时，完整复制当前配置（模型、数据集范围、K、保留规则），
// 尚未改动时结果与原配置完全一致；切换模型时在同一次状态更新里把 K 约束到新模型的层数。

function Num({ v, d = 3 }: { v: number; d?: number }) {
  const t = useTween(v, 360);
  return <>{t.toFixed(d)}</>;
}

interface Custom {
  src: string; // 作为起点的论文配置
  mid: string;
  subset?: number[];
  K: number;
  rule: KeepRule;
}

const T3_SUBSET = [3, 5, 8, 9];
const DEFAULT_ROW = 't1-ours-7b';

function fromRow(id: string): Custom {
  const pr = PAPER_ROWS.find((x) => x.id === id)!;
  return { src: id, mid: pr.model, subset: pr.subset, K: pr.K, rule: pr.rule };
}

function sameRule(a: KeepRule, b: KeepRule): boolean {
  if (a.kind === 'ratio' && b.kind === 'ratio') return Math.abs(a.r - b.r) < 1e-9;
  if (a.kind === 'count' && b.kind === 'count') return a.n === b.n;
  return false;
}

function sameAsSrc(c: Custom): boolean {
  const pr = PAPER_ROWS.find((x) => x.id === c.src)!;
  return pr.model === c.mid && String(pr.subset ?? '') === String(c.subset ?? '') && pr.K === c.K && sameRule(pr.rule, c.rule);
}

export const Ch9Calc: React.FC<WidgetProps> = () => {
  const [rowId, setRowId] = useState(DEFAULT_ROW);
  const [custom, setCustom] = useState<Custom | null>(null);
  const [opts, setOpts] = useState<FlopOpts>({ sign: 1, ffn: 2, prefix: 0 });

  const row = PAPER_ROWS.find((x) => x.id === rowId)!;
  const model = custom ? subsetModel(getModel(custom.mid), custom.subset) : subsetModel(getModel(row.model), row.subset);
  const cfg = custom ? { K: custom.K, kept: keepOf(custom.rule) } : { K: row.K, kept: row.kept };
  // 计算量很小，每次渲染直接重算
  const res = computeFlops(model, cfg, opts);
  const defaults = opts.sign === 1 && opts.ffn === 2 && opts.prefix === 0;

  let status: 'ok' | 'mismatch' | 'extrap' = 'extrap';
  if (!custom && defaults) {
    const okRatio = Math.abs(res.ratio - row.paperRatio) < 0.01;
    const okT = Number.isNaN(row.paperTflop) || Math.abs(res.pruned - row.paperTflop) < 0.0015;
    status = okRatio && okT ? 'ok' : 'mismatch';
  }

  const upd = (patch: Partial<Custom>) => setCustom((c) => (c ? { ...c, ...patch } : c));
  // 切换模型：K 在同一次更新里约束到新模型的层数；视频模型的数据集不同，不沿用图像数据集子集
  const setModel = (mid: string) =>
    setCustom((c) => {
      if (!c) return c;
      const m = getModel(mid);
      return { ...c, mid, K: Math.min(c.K, m.T), subset: m.datasets === getModel(c.mid).datasets ? c.subset : undefined };
    });

  const onSelect = (v: string) => {
    if (v === 'custom') setCustom(fromRow(rowId));
    else {
      setRowId(v);
      setCustom(null);
    }
  };

  const cm = custom ? getModel(custom.mid) : null;
  const imageModel = cm ? cm.datasets === getModel('l15-7b').datasets : false;
  const unchanged = custom ? sameAsSrc(custom) : false;
  const srcRow = custom ? PAPER_ROWS.find((x) => x.id === custom.src)! : row;
  const maxRatio = Math.max(...res.perDataset.map((p) => p.ratio), 30);
  const ruleText = (rule: KeepRule) =>
    rule.kind === 'ratio' ? `按比例 r = ${rule.r.toFixed(3)}（逐数据集取整，LLaVA 1.5 保留 ${keepOf(rule)(576)} 个）` : `固定保留 ${rule.n} 个`;

  return (
    <div className="w">
      <div className="calc-top">
        <label className="sel">
          <span>论文配置</span>
          <select value={custom ? 'custom' : rowId} onChange={(e) => onSelect(e.target.value)}>
            {PAPER_ROWS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.where} · {getModel(p.model).label} · {p.method}
              </option>
            ))}
            <option value="custom">{custom ? '自定义（公式外推）' : '以当前配置继续探索（自定义，公式外推）'}</option>
          </select>
        </label>
        {!custom ? <p className="w-note">{row.keptDesc}{row.subset ? '；只对 MMB、MMMU、POPE、SQA 四个数据集取平均（Table 3 的口径）' : ''}</p> : null}
      </div>

      {custom && cm ? (
        <div className="ctl-stack">
          <p className="w-note">
            起点：{srcRow.where} · {getModel(srcRow.model).label} · {srcRow.method}。当前保留规则：{ruleText(custom.rule)}；
            {custom.subset ? '只对 MMB、MMMU、POPE、SQA 四个数据集取平均。' : `对全部 ${cm.datasets.length} 个数据集取平均。`}
          </p>
          <Seg label="模型" options={MODELS.map((m) => ({ value: m.id, label: m.label }))} value={custom.mid} onChange={setModel} />
          <div className="ctl-row">
            <Seg
              small
              label="保留规则"
              options={[
                { value: 'ratio', label: '按比例 r' },
                { value: 'count', label: '固定个数' },
              ]}
              value={custom.rule.kind}
              onChange={(k) =>
                upd({
                  rule:
                    k === 'ratio'
                      ? { kind: 'ratio', r: custom.rule.kind === 'ratio' ? custom.rule.r : Math.min(0.5, keepOf(custom.rule)(576) / 576) }
                      : { kind: 'count', n: keepOf(custom.rule)(576) },
                })
              }
            />
            {imageModel ? (
              <label className="sw">
                <input type="checkbox" checked={!!custom.subset} onChange={(e) => upd({ subset: e.target.checked ? T3_SUBSET : undefined })} />
                <span className="sw-track" aria-hidden="true" />
                <span>只用 Table 3 的四个数据集取平均</span>
              </label>
            ) : null}
          </div>
          <div className="ctl-grid">
            <Slider label="剪枝层 K（0 = 进入第 1 层之前）" value={custom.K} min={0} max={cm.T} onChange={(K) => upd({ K: Math.min(K, cm.T) })} display={`K = ${custom.K} / ${cm.T}`} />
            {custom.rule.kind === 'ratio' ? (
              <Slider label="保留比例 r" value={custom.rule.r} min={0} max={0.5} step={0.001} onChange={(r) => upd({ rule: { kind: 'ratio', r } })} display={ruleText(custom.rule)} />
            ) : (
              <Slider label="每个样本保留的视觉 token 数" value={custom.rule.n} min={0} max={Math.max(...cm.visual)} onChange={(n) => upd({ rule: { kind: 'count', n } })} display={`${custom.rule.n} 个（超过该数据集视觉 token 数时按全部保留计）`} />
            )}
          </div>
          <div className="ctl-row">
            <Btn onClick={() => setCustom(fromRow(custom.src))}>⟲ 回到起点配置</Btn>
            <Btn onClick={() => { setRowId(DEFAULT_ROW); setCustom(null); setOpts({ sign: 1, ffn: 2, prefix: 0 }); }}>恢复论文默认（Table 1 · 7B · DivPrune）</Btn>
          </div>
        </div>
      ) : null}

      <fieldset className="opts">
        <legend>口径开关</legend>
        <label className="sw">
          <input type="checkbox" checked={opts.sign === -1} onChange={(e) => setOpts({ ...opts, sign: e.target.checked ? -1 : 1 })} />
          <span className="sw-track" aria-hidden="true" />
          <span>二次项按论文印刷用“−2μ²d”</span>
        </label>
        <label className="sw">
          <input type="checkbox" checked={opts.ffn === 3} onChange={(e) => setOpts({ ...opts, ffn: e.target.checked ? 3 : 2 })} />
          <span className="sw-track" aria-hidden="true" />
          <span>前馈网络按 SwiGLU 计 3μdm（外推）</span>
        </label>
        <label className="sw">
          <input type="checkbox" checked={opts.prefix === 35} onChange={(e) => setOpts({ ...opts, prefix: e.target.checked ? 35 : 0 })} />
          <span className="sw-track" aria-hidden="true" />
          <span>文本长度 N 额外计入 35 个前缀 token（外推）</span>
        </label>
      </fieldset>

      <div className="readouts">
        <div className="ro"><span>原模型平均 TFLOPs</span><b><Num v={res.full} /></b></div>
        <div className="ro ro-verm"><span>剪枝后平均 TFLOPs</span><b><Num v={res.pruned} /></b></div>
        <div className="ro ro-cobalt"><span>TFLOP 比例（各数据集比例的平均）</span><b><Num v={res.ratio} d={2} />%</b></div>
        {!custom || unchanged ? (
          <div className="ro"><span>{srcRow.where} 报告值</span><b>{Number.isNaN(srcRow.paperTflop) ? '' : `${srcRow.paperTflop.toFixed(3)} / `}{srcRow.paperRatio.toFixed(2)}%</b></div>
        ) : null}
      </div>

      <div className="perds" aria-label="各数据集的 TFLOP 比例">
        {res.perDataset.map((p) => (
          <div className="perds-row" key={p.name}>
            <span className="perds-k">{p.name}</span>
            <div className="perds-track">
              <div className="perds-fill" style={{ transform: `scaleX(${Math.min(1, p.ratio / maxRatio)})` }} />
            </div>
            <span className="perds-v">{p.ratio.toFixed(2)}%</span>
            <span className="perds-n">μ = {p.n} · 保留视觉 {p.kept}</span>
          </div>
        ))}
      </div>

      {status === 'ok' ? (
        <Feedback tone="good">✓ 与论文 {row.where} 一致：复算 {res.pruned.toFixed(3)} TFLOPs / {res.ratio.toFixed(2)}%，论文为 {Number.isNaN(row.paperTflop) ? '—' : row.paperTflop.toFixed(3)} / {row.paperRatio.toFixed(2)}%。{row.subset ? '' : ` 注意这是 ${res.perDataset.length} 个数据集比例的平均，单个数据集在 ${Math.min(...res.perDataset.map((p) => p.ratio)).toFixed(2)}%–${Math.max(...res.perDataset.map((p) => p.ratio)).toFixed(2)}% 之间。`}</Feedback>
      ) : status === 'mismatch' ? (
        <Feedback tone="warn">与本页复算不一致，原因未知：复算 {res.pruned.toFixed(3)} / {res.ratio.toFixed(2)}%，论文为 {row.paperTflop.toFixed(3)} / {row.paperRatio.toFixed(2)}%。论文没有单独给出视频模型的基线超参数，按 K = 3 保留 2 或 3 个 token 分别得到 14.15% 与 14.22%，都对不上。</Feedback>
      ) : (
        <Feedback tone="info">
          {custom
            ? unchanged
              ? `自定义起点与「${srcRow.where} · ${srcRow.method}」完全相同（结果也相同）；调整任一参数后即为论文未报告的配置。`
              : '公式外推：当前自定义配置论文未报告。'
            : '公式外推：改动了口径开关，结果不再是论文口径。'}
          {opts.sign === -1 ? ' 按印刷的负号，原模型 TFLOPs 会变小，比例也与表格对不上——这正是本页判断负号为排版错误的依据。' : ''}
          {opts.ffn === 3 ? ' 按 SwiGLU 三矩阵计数，线性项占比更大，比例略有变化，方法间排序不变。' : ''}
          {opts.prefix === 35 ? ' 计入 35 个前缀 token 后，剪不掉的部分变多，比例上升。' : ''}
        </Feedback>
      )}
    </div>
  );
};

export default Ch9Calc;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearField, sceneLabel, roundRect, drawHatch, fmt } from './ddpm-common';

// Module 5.1 — full ablation explorer, rebuilt around the COMPLETE experimental
// condition of each number in the paper's Table 2. A result only appears together
// with its prediction target + covariance + training objective; combinations the
// paper left blank are marked 不稳定/未报告 and are never filled with invented values.

const W = 1080;
const H = 250;

type Obj = 'mu' | 'eps' | 'x0';
type Cov = 'fixed' | 'learned';
type Trn = 'L' | 'Lsimple';

interface Combo {
  status: 'best' | 'ok' | 'unstable' | 'notreported' | 'na';
  is?: string;
  fid?: string;
  note: string;
  rowId?: string;
}

const RESULTS: Record<string, Combo> = {
  'mu|fixed|L': {
    status: 'ok',
    is: '8.06±0.09',
    fid: '13.22',
    note: 'μ̃ 预测（基线）+ 完整变分界 + 固定方差。论文原话：μ̃ 只有在完整变分界下才表现良好。',
    rowId: 'mu-fixed-L',
  },
  'mu|learned|L': {
    status: 'unstable',
    is: '7.28±0.10',
    fid: '23.69',
    note: '论文正文：学习对角方差训练不稳定、质量更差；该行仍报告了数值（IS 7.28 / FID 23.69）——属于「已报告但效果较差」。',
    rowId: 'mu-learned-L',
  },
  'mu|fixed|Lsimple': {
    status: 'unstable',
    note: '论文 Table 2 中该行为空：表注说明训练不稳定、生成的样本分数越界——属于「未能稳定训练、未报告数值」。',
    rowId: 'mu-Lsimple',
  },
  'mu|learned|Lsimple': {
    status: 'na',
    note: '论文未定义该组合：学习对角方差 Σθ 由变分界 L 训练，L_simple 中不含协方差项。',
  },
  'eps|fixed|L': {
    status: 'ok',
    is: '7.67±0.13',
    fid: '13.51',
    note: 'ε 预测 + 完整变分界 + 固定方差：与 μ̃ 基线相当（13.51 vs 13.22）。',
    rowId: 'eps-fixed-L',
  },
  'eps|learned|L': {
    status: 'unstable',
    note: '论文 Table 2 中该行为空：表注说明训练不稳定、分数越界（正文亦指出学习对角 Σθ 质量更差）。',
    rowId: 'eps-learned-L',
  },
  'eps|fixed|Lsimple': {
    status: 'best',
    is: '9.46±0.11',
    fid: '3.17',
    note: '本文推荐组合：ε 预测 + 简化目标 L_simple + 固定方差 → FID 从 13.51 降到 3.17。',
    rowId: 'eps-Lsimple',
  },
  'eps|learned|Lsimple': {
    status: 'na',
    note: '论文未定义该组合：L_simple 不含 Σθ 参数，不存在「学习对角」的版本。',
  },
};

const STATUS_TEXT: Record<Combo['status'], { label: string; color: string; quality: number; cost: number }> = {
  best: { label: '最佳（本文）', color: '#228d5c', quality: 0.92, cost: 0.35 },
  ok: { label: '可用', color: '#27446e', quality: 0.6, cost: 0.55 },
  unstable: { label: '不稳定 / 未报告数值', color: '#c43f52', quality: 0.22, cost: 0.85 },
  notreported: { label: '论文未报告', color: '#68778f', quality: 0.1, cost: 0.5 },
  na: { label: '组合不适用', color: '#68778f', quality: 0.1, cost: 0.5 },
};

function comboFor(obj: Obj, cov: Cov, trn: Trn): Combo {
  if (obj === 'x0') {
    return {
      status: 'notreported',
      note: '论文：预测 x₀ 在实验早期得到更差的样本质量（Section 3.2），未报告任何数值；本页面不推测。',
    };
  }
  return RESULTS[`${obj}|${cov}|${trn}`];
}

const TABLE2_ROWS: Array<{ id: string; group?: string; obj: string; trn: string; is: string; fid: string }> = [
  { id: 'mu-learned-L', group: 'μ̃ 预测（基线）', obj: 'L，学习对角 Σ', trn: '', is: '7.28±0.10', fid: '23.69' },
  { id: 'mu-fixed-L', obj: 'L，固定各向同性 Σ', trn: '', is: '8.06±0.09', fid: '13.22' },
  { id: 'mu-Lsimple', obj: '‖μ̃ − μ̃θ‖²', trn: '', is: '—', fid: '—' },
  { id: 'eps-learned-L', group: 'ε 预测（本文）', obj: 'L，学习对角 Σ', trn: '', is: '—', fid: '—' },
  { id: 'eps-fixed-L', obj: 'L，固定各向同性 Σ', trn: '', is: '7.67±0.13', fid: '13.51' },
  { id: 'eps-Lsimple', obj: '‖ε − εθ‖²（L_simple）', trn: '', is: '9.46±0.11', fid: '3.17' },
];

const CLS_BY_STATUS: Record<Combo['status'], string> = {
  best: 'good',
  ok: '',
  unstable: 'bad',
  notreported: '',
  na: '',
};

export const Ch5Tools: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ obj: Obj; cov: Cov; trn: Trn }>({ obj: 'eps', cov: 'fixed', trn: 'Lsimple' });
  const [obj, setObj] = useState<Obj>('eps');
  const [cov, setCov] = useState<Cov>('fixed');
  const [trn, setTrn] = useState<Trn>('Lsimple');

  const combo = comboFor(obj, cov, trn);
  const statusMeta = STATUS_TEXT[combo.status];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const s = stateRef.current;
      const c = comboFor(s.obj, s.cov, s.trn);
      const meta = STATUS_TEXT[c.status];
      clearField(ctx, W, H);

      const OBJ_LABEL: Record<Obj, string> = { mu: '预测 μ̃', eps: '预测 ε', x0: '预测 x₀' };
      const COV_LABEL: Record<Cov, string> = { fixed: '固定各向同性', learned: '学习对角' };
      const TRN_LABEL: Record<Trn, string> = { L: '完整变分界 L', Lsimple: '简化目标 L_simple' };

      sceneLabel(
        ctx,
        `当前组合：${OBJ_LABEL[s.obj]} · ${COV_LABEL[s.cov]} · ${TRN_LABEL[s.trn]}`,
        36,
        40,
        { size: 18 }
      );

      const blocked = c.status === 'notreported' || c.status === 'na';

      // quality / cost bars
      const barX = 360;
      const barW = 480;
      const drawBar = (y: number, ratio: number, color: string, label: string): void => {
        ctx.fillStyle = '#eef1f6';
        roundRect(ctx, barX, y, barW, 26, 6);
        ctx.fill();
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 1.5;
        roundRect(ctx, barX, y, barW, 26, 6);
        ctx.stroke();
        if (!blocked) {
          ctx.fillStyle = color;
          roundRect(ctx, barX, y, Math.max(10, barW * clamp(ratio, 0, 1)), 26, 6);
          ctx.fill();
        } else {
          drawHatch(ctx, barX, y, barW, 26);
        }
        ctx.fillStyle = '#21324a';
        ctx.font = '700 16px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(label, barX - 16, y + 19);
        ctx.textAlign = 'left';
      };
      drawBar(98, meta.quality, '#228d5c', '样本质量');
      drawBar(148, meta.cost, '#d97706', '训练代价');

      // numeric result
      if (c.is || c.fid) {
        ctx.font = '700 22px "Cascadia Code","Consolas",monospace';
        ctx.fillStyle = '#21324a';
        ctx.fillText(`IS ${c.is}`, 360, 210);
        ctx.fillText(`FID ${c.fid}`, 620, 210);
        sceneLabel(ctx, '（论文 Table 2 原值）', 820, 210, { size: 14, color: '#68778f' });
      } else {
        roundRect(ctx, 356, 188, 500, 40, 8);
        ctx.fillStyle = '#f2f5f9';
        ctx.fill();
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 1.5;
        roundRect(ctx, 356, 188, 500, 40, 8);
        ctx.stroke();
        ctx.fillStyle = '#68778f';
        ctx.font = '700 17px "Segoe UI","PingFang SC",sans-serif';
        ctx.fillText('无论文数值 —— 不编造结果', 380, 214);
      }

      // status chip
      const statusLabel =
        c.status === 'unstable'
          ? c.is || c.fid
            ? '训练不稳定（已报告数值）'
            : '不稳定 / 未报告数值'
          : meta.label;
      ctx.fillStyle = meta.color;
      ctx.font = '700 19px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(statusLabel, 1036, 40);
      ctx.textAlign = 'left';

      sceneLabel(ctx, '横条 = 相对强弱（教学示意，非论文指标）', 360, 242, {
        size: 13,
        color: '#8b97ab',
      });
    };

    const tick = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (o: Obj, c: Cov, t: Trn): void => {
    stateRef.current = { obj: o, cov: c, trn: t };
    setObj(o);
    setCov(c);
    setTrn(t);
  };

  return (
    <div>
      <div className="chip-row">
        {(['mu', 'eps', 'x0'] as Obj[]).map((o) => (
          <button key={o} type="button" className={`chip ${obj === o ? 'selected' : ''}`} onClick={() => pick(o, cov, trn)}>
            {o === 'mu' ? '预测 μ̃（后验均值）' : o === 'eps' ? '预测 ε（噪声）' : '预测 x₀（干净图）'}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {(['fixed', 'learned'] as Cov[]).map((c) => (
          <button key={c} type="button" className={`chip ${cov === c ? 'selected' : ''}`} onClick={() => pick(obj, c, trn)}>
            {c === 'fixed' ? 'Σ：固定各向同性' : 'Σ：学习对角'}
          </button>
        ))}
        {(['L', 'Lsimple'] as Trn[]).map((t) => (
          <button key={t} type="button" className={`chip ${trn === t ? 'selected' : ''}`} onClick={() => pick(obj, cov, t)}>
            {t === 'L' ? '目标：完整变分界 L' : '目标：简化目标 L_simple'}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`feedback ${CLS_BY_STATUS[combo.status]}`}>{combo.note}</div>
      <table className="paper ablation-table">
        <thead>
          <tr>
            <th>预测目标</th>
            <th>训练配置（论文 Table 2 原文）</th>
            <th>IS ↑</th>
            <th>FID ↓</th>
          </tr>
        </thead>
        <tbody>
          {TABLE2_ROWS.map((row) => (
            <tr key={row.id} className={combo.rowId === row.id ? 'row-active' : ''}>
              <td>{row.group ?? ''}</td>
              <td>{row.obj}</td>
              <td>{row.is}</td>
              <td>{row.fid}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="source-note">
        数据来源：原论文 Table 2 逐值转写（空白行 = 论文标注训练不稳定/分数越界）。高亮行为当前所选组合。
      </div>
      <div className="explain-block">
        <b>为什么 ε + L_simple 能把 FID 从 13.51 降到 3.17？</b>
        <ul>
          <li>L_simple 丢弃了 Eq. (12) 中的权重，相对<b>降权小 t（简单）区间、重视大 t（困难）区间</b>，让网络专注更难的去噪任务（论文 §3.4）。</li>
          <li>它是对原始变分界各项的重新加权（不是标准 VLB 本身），并在论文设定下与多噪声尺度的去噪分数匹配建立等价关系，因此训练目标与采样过程（Langevin 式迭代）方向一致。</li>
          <li>论文的对比显示：仅改变预测目标（ε vs μ̃）时 13.51 vs 13.22 几乎无差别；质量跃升与训练目标的重新加权同时出现（论文 §4.2 的解读）——两组对照中其余实验条件保持一致。</li>
        </ul>
      </div>
    </div>
  );
};

export default Ch5Tools;

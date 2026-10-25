import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt, clamp } from '../lib/stage';
import { C, rgba, TYPE_COLOR, type TokType } from '../lib/palette';
import { Feedback, Seg, ScrollX, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { TABLE6 } from '../data/tables';

// 6.1 位置编号：Keep vs Rearrange（代码事实 + 表 6 实测；token 数为教学示意）。
// 2 个系统 + 5 个视觉 + 2 个问题 token，之后解码 1 个词。

const TOK: TokType[] = ['sys', 'sys', 'vis', 'vis', 'vis', 'vis', 'vis', 'ins', 'ins'];

export const M6Pos: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'keep' | 'rearr'>('keep');
  const anim = useRef(new Anim()).current;

  // 深层的位置编号
  const deepPos = (j: number) => {
    if (TOK[j] === 'vis') return null;
    if (mode === 'keep') return j;
    return TOK.slice(0, j).filter((t) => t !== 'vis').length;
  };
  const newShallow = TOK.length; // 9
  const newDeep = mode === 'keep' ? TOK.length : TOK.filter((t) => t !== 'vis').length; // 9 或 4
  const distShallow = 7 - 1;
  const distDeep = (deepPos(7) ?? 0) - (deepPos(1) ?? 0);

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.34, 200, 240),
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const left = w < 480 ? 64 : 92;
        const n = TOK.length + 1;
        const cw = (w - left - 10) / n;
        const rows = [
          { y: 40, label: '浅层（前 K 层）', deep: false },
          { y: 120, label: mode === 'keep' ? '深层 · Keep' : '深层 · Rearrange', deep: true },
        ];
        rows.forEach((row) => {
          txt(ctx, row.label, 4, row.y, { size: 10, color: C.ink2, weight: 600 });
          for (let j = 0; j < n; j++) {
            const isNew = j === TOK.length;
            const ty: TokType = isNew ? 'out' : TOK[j];
            const x = left + cw * (j + 0.5);
            const gone = row.deep && ty === 'vis';
            const a = anim.to(`a-${row.deep}-${j}`, gone ? 0.08 : 0.9, dt, final, 8);
            const sz = Math.min(cw * 0.72, 26);
            ctx.fillStyle = rgba(TYPE_COLOR[ty], a);
            rr(ctx, x - sz / 2, row.y - sz / 2, sz, sz, 4);
            ctx.fill();
            let pos: number | null = j;
            if (row.deep) pos = isNew ? newDeep : deepPos(j);
            if (pos === null) continue;
            const shown = anim.to(`p-${row.deep}-${j}`, pos, dt, final, 7);
            const changed = row.deep && pos !== j;
            txt(ctx, String(Math.round(shown)), x, row.y + sz / 2 + 12, { size: 11, color: changed ? C.warn : C.ink, align: 'center', weight: 700 });
          }
          // 系统 token 1 与问题 token 7 之间的位置距离
          const x1 = left + cw * 1.5;
          const x7 = left + cw * 7.5;
          const d = row.deep ? distDeep : distShallow;
          const yA = row.y - 20;
          ctx.strokeStyle = row.deep && d !== distShallow ? C.warn : rgba(C.moon, 0.7);
          ctx.beginPath();
          ctx.moveTo(x1, row.y - 14);
          ctx.quadraticCurveTo((x1 + x7) / 2, yA - 16, x7, row.y - 14);
          ctx.stroke();
          txt(ctx, `距离 ${d}`, (x1 + x7) / 2, yA - 10, { size: 10, color: row.deep && d !== distShallow ? C.warn : C.moon, align: 'center', weight: 700 });
        });
        txt(ctx, '数字 = 位置编号（旋转位置编码按它计算相对距离）', 4, h - 10, { size: 10, color: C.ink3 });
        return anim.moving;
      },
    },
    [mode]
  );

  const best = (k: 'sqa' | 'mmmu' | 'pope') => Math.max(...TABLE6.map((r) => r[k]));

  return (
    <div className="mod-stack">
      <Seg
        small
        label="撤出后的位置编号"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'keep', label: 'Keep（保留原编号）' },
          { value: 'rearr', label: 'Rearrange（重新编号）' },
        ]}
      />
      <StageBox
        s={s}
        label={
          mode === 'keep'
            ? '浅层与深层的位置编号相同：系统 token 1 与问题 token 7 相距 6；新 token 编号 9'
            : `深层重新编号：问题 token 变为 2、3，与系统 token 1 相距 ${distDeep}；新 token 在深层编号 ${newDeep}`
        }
      />
      <Feedback
        tone={mode === 'keep' ? 'info' : 'warn'}
        k={mode}
        lead={
          mode === 'keep' ? (
            <>
              Keep：深层沿用原编号，系统 token 与问题 token 的距离在浅层和深层都是 <b>{distShallow}</b>。这是代码默认（pe_type = "keep"）。
            </>
          ) : (
            <>
              Rearrange：深层把文字 token 挤成连续编号，同一对 token 的距离从 {distShallow} 变成 <b>{distDeep}</b>，与浅层算出的表示不一致。
            </>
          )
        }
        more={
          <p>
            代码中 Keep 分支对 position_ids 做与 hidden_states 相同的切片 <EvChip id="cDrop" />；Rearrange 分支在预填充时截成连续编号，解码时把撤出层的位置改成该层 KV
            缓存的长度 <EvChip id="cRearr" />。“距离不一致”是本页对表 6 结果的解释，论文只报告了分数。
          </p>
        }
      />
      <ScrollX label="表 6，可横向滚动">
        <table className="tbl tbl-compact">
          <caption>
            表 6（LLaVA-1.5-7B，单次运行）<EvChip id="tab6" />
          </caption>
          <thead>
            <tr>
              <th scope="col">位置编码</th>
              <th scope="col">SQA_Image</th>
              <th scope="col">MMMU_Val</th>
              <th scope="col">POPE</th>
            </tr>
          </thead>
          <tbody>
            {TABLE6.map((r) => (
              <tr key={r.label} className={(mode === 'keep' && r.label.startsWith('Keep')) || (mode === 'rearr' && r.label.startsWith('Rearr')) ? 'is-sel' : ''}>
                <th scope="row">{r.label}</th>
                <td className={r.sqa === best('sqa') ? 'is-best' : ''}>{r.sqa.toFixed(2)}</td>
                <td className={r.mmmu === best('mmmu') ? 'is-best' : ''}>{r.mmmu.toFixed(2)}</td>
                <td className={r.pope === best('pope') ? 'is-best' : ''}>{r.pope.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollX>
      <p className="note">Keep 比 Rearrange 高 0.10 / 0.40 / 0.55；单次运行、无置信区间，现有材料无法判断这些差值是否超出评测波动。加粗为每列最高值（与论文一致）。</p>
    </div>
  );
};

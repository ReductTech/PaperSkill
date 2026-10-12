import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Readouts, Feedback, Source, FONT_SANS, FONT_MONO, PaperImage } from './kit';

// 模块 3.2：谁向谁提供信息。勾选哪些层作为查询 Q、哪些层拼进键 / 值 J，
// 连接图、拼接通道数 C_J 与每个注意力矩阵的形状同步更新；并标出该组合是否是原文图 8 测过的配置。

const CH = [32, 64, 128, 256];
const SUB = '₁₂₃₄';

const key = (s: boolean[]) => s.map((b, i) => (b ? i + 1 : '')).join('');
const TESTED_Q = ['12', '123', '23', '234', '34'];
const TESTED_J = ['12', '123', '23', '234', '34'];

export const ConnectLab: React.FC<WidgetProps> = () => {
  const [q, setQ] = useState([true, true, true, true]);
  const [j, setJ] = useState([true, true, true, true]);
  const cj = CH.reduce((s, c, i) => s + (j[i] ? c : 0), 0);
  const qk = key(q);
  const jk = key(j);
  const nq = q.filter(Boolean).length;
  const nj = j.filter(Boolean).length;

  let status: { tone: 'good' | 'info' | 'warn' | 'bad'; text: React.ReactNode };
  if (nq === 0 || nj === 0) {
    status = {
      tone: 'warn',
      text: <>没有查询或没有键 / 值时就没有跨层交互，四条跳连退化为普通 U-Net 的“同层直连”：解码层只拿到同一层编码特征。</>,
    };
  } else if (qk === '1234' && jk === '1234') {
    status = {
      tone: 'good',
      text: <>这就是 SCTransNet 的配置：四层都发出查询，键 / 值由四层拼接而成（C<sub>Σ</sub> = 480）。原文图 8 中，这一配置在三个数据集上 IoU 均最高。</>,
    };
  } else if (jk === '1234' && TESTED_Q.includes(qk)) {
    status = {
      tone: 'info',
      text: <>原文图 8 测过这一组合（J 取全部四层、只改变 Q）。作者的结论是：查询包含越高、越完整的层级，性能越好，全层 Q 最佳。</>,
    };
  } else if (qk === '1234' && TESTED_J.includes(jk)) {
    status = {
      tone: 'info',
      text: <>原文图 8 测过这一组合（Q 取全部四层、只改变 J）。作者的结论是：键 / 值包含完整的通道信息时，查询能找到更准确的特征。</>,
    };
  } else {
    status = {
      tone: 'warn',
      text: <>这个组合在原文图 8 中没有测试过——图 8 每次只改 Q 或只改 J，另一方保持四层完整。此处只展示连接与形状，不对性能下结论。</>,
    };
  }

  const toggle = (arr: boolean[], set: (v: boolean[]) => void, i: number) => {
    const n = arr.slice();
    n[i] = !n[i];
    set(n);
  };

  // 图形
  const W = 900;
  const H = 300;
  const ys = [56, 116, 176, 236];
  const exX = 70;
  const dX = 830;
  const barX = 395;
  const barW = 110;
  const barY0 = 40;
  const barH = 210;
  let acc = 0;
  const segs = CH.map((c, i) => {
    const h = j[i] ? (c / 480) * barH : 0;
    const y = barY0 + acc;
    acc += h;
    return { y, h, on: j[i] };
  });

  return (
    <div className="sx-lab">
      <div className="sx-toggles">
        <span className="sx-chips-label">查询 Q 来自</span>
        {CH.map((c, i) => (
          <button key={i} type="button" className={`chip ${q[i] ? 'selected' : ''}`} aria-pressed={q[i]} onClick={() => toggle(q, setQ, i)}>
            第 {i + 1} 层
          </button>
        ))}
        <span className="sx-chips-sep" />
        <span className="sx-chips-label">键 / 值拼接 J 包含</span>
        {CH.map((c, i) => (
          <button key={i} type="button" className={`chip chip-purple ${j[i] ? 'selected' : ''}`} aria-pressed={j[i]} onClick={() => toggle(j, setJ, i)}>
            第 {i + 1} 层
          </button>
        ))}
        <span className="sx-chips-sep" />
        <button type="button" className="tiny ghost" onClick={() => { setQ([false, false, false, false]); setJ([false, false, false, false]); }}>
          切换为普通跳连
        </button>
        <button type="button" className="tiny ghost" onClick={() => { setQ([true, true, true, true]); setJ([true, true, true, true]); }}>
          恢复 SCTransNet
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="sx-diagram" role="img" aria-label="编码层、拼接键值与解码层之间的连接">
        <g fontFamily={FONT_SANS}>
          <text x={exX} y={22} textAnchor="middle" fontSize={12} fill={C.muted}>编码层嵌入 Iᵢ</text>
          <text x={barX + barW / 2} y={22} textAnchor="middle" fontSize={12} fill={C.muted}>拼接 J（键 / 值）</text>
          <text x={dX} y={22} textAnchor="middle" fontSize={12} fill={C.muted}>送往解码层</text>
          {ys.map((y, i) => {
            const direct = !q[i] || nj === 0;
            return (
              <g key={i}>
                {direct ? (
                  <line x1={exX + 34} y1={y} x2={dX - 34} y2={y} stroke={C.line2} strokeWidth={1.4} strokeDasharray="5 4" />
                ) : null}
                {j[i] ? (
                  <path d={`M ${exX + 34} ${y} C ${exX + 180} ${y}, ${barX - 120} ${segs[i].y + segs[i].h / 2}, ${barX} ${segs[i].y + segs[i].h / 2}`} fill="none" stroke={C.purple} strokeOpacity={0.6} strokeWidth={1.3} />
                ) : null}
                {q[i] && nj > 0 ? (
                  <>
                    <path d={`M ${barX + barW} ${barY0 + barH / 2} C ${barX + barW + 120} ${barY0 + barH / 2}, ${dX - 200} ${y}, ${dX - 34} ${y}`} fill="none" stroke={C.blue} strokeWidth={1.8} />
                    <rect x={605} y={y - 11} width={92} height={22} rx={4} fill="#fff" stroke={C.blue} strokeWidth={0.8} />
                    <text x={651} y={y + 4} textAnchor="middle" fontSize={11} fill={C.blue} fontFamily={FONT_MONO}>
                      A{SUB[i]}: {CH[i]}×{cj}
                    </text>
                  </>
                ) : null}
                <rect x={exX - 34} y={y - 15} width={68} height={30} rx={5} fill={q[i] ? '#eef2f8' : C.paper2} stroke={q[i] ? C.blue : C.line2} />
                <text x={exX} y={y + 5} textAnchor="middle" fontSize={13} fill={C.ink} fontWeight={600}>
                  I{SUB[i]} · {CH[i]}
                </text>
                <rect x={dX - 34} y={y - 15} width={68} height={30} rx={5} fill={q[i] && nj > 0 ? '#eef6f1' : C.paper2} stroke={q[i] && nj > 0 ? C.green : C.line2} />
                <text x={dX} y={y + 5} textAnchor="middle" fontSize={13} fill={C.ink} fontWeight={600}>
                  O{SUB[i]}
                </text>
              </g>
            );
          })}
          <rect x={barX} y={barY0} width={barW} height={barH} fill="none" stroke={C.line2} strokeDasharray="3 3" />
          {segs.map((s, i) =>
            s.on ? (
              <g key={i}>
                <rect x={barX} y={s.y} width={barW} height={s.h} fill={C.purple} fillOpacity={0.12 + i * 0.07} stroke={C.purple} strokeWidth={0.8} />
                {s.h > 14 ? (
                  <text x={barX + barW / 2} y={s.y + s.h / 2 + 4} textAnchor="middle" fontSize={11} fill={C.purple} fontFamily={FONT_MONO}>
                    {CH[i]}
                  </text>
                ) : null}
              </g>
            ) : null
          )}
        </g>
      </svg>
      <Readouts
        cols={3}
        items={[
          { k: 'J 的通道数', v: cj, tone: 'blue' },
          { k: '接收跨层信息的层数', v: nj > 0 ? nq : 0, unit: '/ 4' },
          { k: '原文图 8 是否测过', v: nq && nj && ((jk === '1234' && (TESTED_Q.includes(qk) || qk === '1234')) || (qk === '1234' && TESTED_J.includes(jk))) ? '是' : '否', tone: 'muted' },
        ]}
      />
      <Feedback tone={status.tone}>{status.text}</Feedback>
      <details className="sx-details">
        <summary>查看原文图 8（Q 层级与 J 组成的消融）</summary>
        <PaperImage
          src="./images/fig8.png"
          alt="原文图 8：查询层级与拼接组成的消融柱状图"
          caption={
            <>
              原文图 8（p.10）。注意：左栏标为 NUDT-SIRST、纵轴 74–78，中栏标为 NUAA-SIRST、纵轴 93–94.2；而表 I 中 SCTransNet 在 NUAA-SIRST 上 IoU 为 77.50、在 NUDT-SIRST 上为 94.09。两栏的数据集标签很可能互换了，图题中的 “SUDT-SIRST” 也应是笔误。本导读不从柱状图读取具体数值。
            </>
          }
        />
      </details>
      <Source>
        依据：§III-B 与式 (8)–(14)：Q 来自各层 J<sub>i</sub>，K、V 来自四层拼接 J<sub>Σ</sub>，A<sub>i</sub> ∈ ℝ<sup>C<sub>i</sub>×C<sub>Σ</sub></sup>；§IV-E1 与图 8。未被选为查询的层在原文中如何处理没有说明，图中按普通跳连直通绘制。
      </Source>
    </div>
  );
};

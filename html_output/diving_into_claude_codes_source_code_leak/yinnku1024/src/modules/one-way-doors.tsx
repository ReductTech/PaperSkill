import React, { useState } from 'react';
import { Feedback, INK } from './kit';

type Attempt = {
  id: string;
  label: string;
  layer: string;
  verdict: string;
  detail: string;
  tone: 'good' | 'warn';
};

const ATTEMPTS: Attempt[] = [
  {
    id: 'u1', label: '改 JS：删掉 undercover 判断', layer: '策略层',
    verdict: '没有可删的分支', tone: 'good',
    detail: '这个模式没有 force-OFF：它按仓库来源在构建期决定，运行期不存在“关闭”这条路径。',
  },
  {
    id: 'u2', label: '改 JS：把 cch 写成固定值', layer: '原生层',
    verdict: '发送前被覆写', tone: 'good',
    detail: '请求里的 cch 只是占位符，Bun 的原生 HTTP 栈在发出前用计算结果替换它。',
  },
  {
    id: 'u3', label: '代理：拦截请求并改写头', layer: '原生层',
    verdict: '签不出同样的值', tone: 'good',
    detail: '计算发生在 Zig 层，JS 侧拿不到算法与密钥；代理只能转发已经签好的请求。',
  },
  {
    id: 'u4', label: '重编译：自己构建运行时', layer: '编译期',
    verdict: '可行，但代价转移', tone: 'warn',
    detail: '拿到源码就能改；成本从“改一行”变成“长期跟一个分叉版本”，并失去上游更新。',
  },
];

/* 两道门都不靠“默认关闭”，而靠“路径不存在”：
   undercover 是策略上的单向门，cch 是实现上的单向门。 */
export function OneWayDoors() {
  const [selected, setSelected] = useState(0);
  const active = ATTEMPTS[selected];
  return (
    <div className="ps" style={{ gridTemplateColumns: 'minmax(0, 1.22fr) minmax(0, 1fr)' }}>
      <div className="ps-card ps-card--plain" style={{ padding: 12, display: 'grid' }}>
        <svg className="ps-art" viewBox="0 0 760 552" role="img" aria-label="两道单向门：策略封条与原生铅版">
          <rect x="0" y="0" width="760" height="552" rx="14" fill="#f8f3e4" />
          <text x="28" y="44" fill={INK.blue} fontSize="30" fontWeight="700">策略单向门</text>
          <g transform="translate(30 70)">
            <rect x="0" y="0" width="300" height="330" rx="12" fill={INK.paper} stroke={INK.edgeStrong} strokeWidth="4" />
            <path d="M0 0 L150 132 L300 0" fill="none" stroke={INK.edgeStrong} strokeWidth="4" />
            <path d="M0 330 L112 196 M300 330 L188 196" fill="none" stroke={INK.edgeStrong} strokeWidth="4" />
            <circle cx="150" cy="196" r="52" fill="#c43f52" />
            <text x="150" y="210" textAnchor="middle" fill="#fff" fontSize="36" fontWeight="700">封</text>
            <text x="150" y="286" textAnchor="middle" fill={INK.muted} fontSize="30">undercover</text>
            <text x="150" y="320" textAnchor="middle" fill={INK.red} fontSize="30">没有 force-OFF</text>
          </g>
          <text x="28" y="452" fill={INK.muted} fontSize="30">按仓库来源在构建期选择</text>

          <text x="404" y="44" fill={INK.green} fontSize="30" fontWeight="700">实现单向门</text>
          <g transform="translate(404 70)">
            <rect x="0" y="0" width="320" height="330" rx="12" fill="#dfe4ea" stroke="#93a1b3" strokeWidth="4" />
            <rect x="26" y="26" width="268" height="278" rx="8" fill="#eef1f5" stroke="#a9b5c4" strokeWidth="3" />
            {[0, 1, 2, 3].map(i => <rect key={i} x="46" y={60 + i * 56} width="228" height="10" rx="5" fill="#b5c0cd" />)}
            <circle cx="160" cy="196" r="46" fill={INK.green} />
            <text x="160" y="208" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="700">Zig</text>
            <text x="160" y="286" textAnchor="middle" fill={INK.muted} fontSize="30">cch 由原生层计算</text>
          </g>
          <text x="404" y="452" fill={INK.muted} fontSize="30">JS 侧改不到、也签不出</text>

          <text x="380" y="514" textAnchor="middle" fill={INK.ink} fontSize="30">不是被禁止，而是那条路根本不存在。</text>
        </svg>
      </div>

      <div className="ps-col" style={{ gap: 10 }}>
        {ATTEMPTS.map((attempt, index) => (
          <button key={attempt.id} type="button" className="ps-btn ps-btn--block"
            aria-pressed={selected === index} onClick={() => setSelected(index)} style={{ padding: '8px 16px' }}>
            <span>{attempt.label}</span>
            <span className="ps-chip" data-tone={selected === index ? 'blue' : 'orange'}>{attempt.layer}</span>
          </button>
        ))}
        <div className="ps-card ps-card--plain ps-grow" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="ps-spread">
            <p className="ps-h">{active.verdict}</p>
            <span className="ps-chip" data-tone={active.tone === 'good' ? 'green' : 'orange'}>{active.layer}</span>
          </div>
          <p className="ps-t ps-t--tight">{active.detail}</p>
        </div>
        <Feedback tone={active.tone === 'good' ? 'good' : 'neutral'}>
          {active.tone === 'good' ? '拦截发生在你够不到的那一层。' : '这不是权限问题，是维护成本问题。'}
        </Feedback>
      </div>
    </div>
  );
}

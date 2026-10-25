import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { Feedback, INK, Switch } from './kit';

const SEGMENTS = [
  { id: 'sys', name: '系统规则', tokens: 1800 },
  { id: 'tools', name: '工具定义', tokens: 2400 },
  { id: 'proj', name: '项目说明', tokens: 900 },
  { id: 'branch', name: 'git 分支', tokens: 40 },
  { id: 'commits', name: '最近提交', tokens: 260 },
  { id: 'user', name: '用户消息', tokens: 120 },
];
const TOTAL = SEGMENTS.reduce((sum, segment) => sum + segment.tokens, 0);
const DISCOUNT = 0.1;

/* 分界线以上是每轮都一样的前缀，以下必须重算。
   "把 git 分支写进系统段"是一个真实存在的坏习惯：动态内容一旦混进稳定前缀，
   整段缓存每轮作废，命中率直接归零。 */
export function CacheBoundary() {
  const [boundary, setBoundary] = useState(3);
  const [leak, setLeak] = useState(false);

  const stable = SEGMENTS.slice(0, boundary).reduce((sum, segment) => sum + segment.tokens, 0);
  const cached = leak ? 0 : stable;
  const rest = TOTAL - cached;
  const hit = cached / TOTAL;
  const cost = (cached * DISCOUNT + rest) / 1000;

  return (
    <div className="ps" style={{ gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)' }}>
      <div className="ps-card ps-col" style={{ gap: 8, padding: '16px 18px' }}>
        {SEGMENTS.map((segment, index) => {
          const isCached = index < boundary && !leak;
          const beforeBoundary = index < boundary;
          const alarm = leak && index === 3;
          return (
            <React.Fragment key={segment.id}>
              <div className="ps-seg" data-side={isCached ? 'cached' : 'dynamic'} data-alarm={alarm}>
                <span style={{ color: isCached ? INK.blue : INK.orange, fontWeight: 700 }}>{segment.name}</span>
                <span className="ps-segbar"><i style={{ width: `${(segment.tokens / 2400) * 100}%`, background: isCached ? INK.blue : INK.orange }} /></span>
                <span className="ps-mono ps-muted">{segment.tokens.toLocaleString('en-US')}</span>
                <span className="ps-chip" data-tone={isCached ? 'blue' : 'orange'}>{isCached ? '缓存' : '重算'}</span>
              </div>
              {index === boundary - 1 && (
                <div className="ps-boundary">
                  <span>{alarm ? '动态内容被写进了稳定段' : 'SYSTEM_PROMPT_DYNAMIC_BOUNDARY'}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
        {boundary === 0 && <div className="ps-boundary"><span>分界线在最前：没有任何前缀被缓存</span></div>}
        {boundary === SEGMENTS.length && <div className="ps-boundary"><span>分界线在最后：全部视作稳定前缀</span></div>}
        <div className="ps-spread ps-t ps-muted" style={{ marginTop: 'auto' }}>
          <span>共 5,520 token</span>
          <span>缓存读取按 0.1 计价</span>
        </div>
      </div>

      <div className="ps-col" style={{ gap: 10 }}>
        <div className="ps-card ps-card--plain ps-col" style={{ gap: 2 }}>
          <div className="ps-spread">
            <span className="ps-t">缓存边界</span>
            <b className="ps-fig" style={{ color: INK.blue }}>{boundary}</b>
          </div>
          <input className="ps-range" type="range" min="0" max={SEGMENTS.length} step="1" value={boundary}
            aria-label="缓存边界位置" onChange={e => setBoundary(Number(e.target.value))} />
          <div className="ps-spread ps-t ps-muted"><span>0 · 不缓存</span><span>6 · 全部缓存</span></div>
        </div>

        <Switch checked={leak} onChange={setLeak}>把 git 分支写进系统段</Switch>

        <div className="ps-card ps-card--plain" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <p className="ps-fig" style={{ color: hit > 0.7 ? INK.green : INK.orange }}>{Math.round(hit * 100)}%</p>
            <p className="ps-t ps-muted">缓存命中</p>
          </div>
          <div>
            <p className="ps-fig" style={{ color: INK.ink }}>{cost.toFixed(1)}k</p>
            <p className="ps-t ps-muted">每轮成本</p>
          </div>
        </div>

        <p className="ps-t" style={{ lineHeight: 1.3 }}>
          <SymbolHint meaning="每轮相对成本，按千 token 当量计">C轮</SymbolHint>
          <span> ≈ {DISCOUNT} × </span>
          <SymbolHint meaning="被缓存的前缀 token 数">T缓存</SymbolHint>
          <span> + </span>
          <SymbolHint meaning="每轮必须重新计算的 token 数">T重算</SymbolHint>
        </p>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={leak ? 'bad' : boundary === 0 ? 'neutral' : 'good'}>
            {leak
              ? '稳定段里放了每轮变化的内容：整段前缀每轮失效，命中率归零。'
              : boundary === 0
                ? '没有任何前缀被缓存：每轮全量重算，最贵但最不容易出错。'
                : boundary === SEGMENTS.length
                  ? '全部命中；前提是这 6 段真的每轮不变。'
                  : `命中 ${Math.round(hit * 100)}%：每轮只为分界线之后的内容付费。`}
          </Feedback>
        </div>
      </div>
    </div>
  );
}

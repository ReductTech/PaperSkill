import React from 'react';
import { HW } from './kit';

const SOURCE = 'https://mp.weixin.qq.com/s/vbigwjX-TBvjDQ8sUdZ3qA';

/* 来源页要说清两件事：这是一篇微信公众号文章，正文由使用者提供；
   页面里出现的数字（1884、60MB、1906）都是文章自述，没有独立复核。 */
export function SourceCards() {
  return (
    <div className="hw" style={{ gridTemplateColumns: '500px minmax(0, 1fr)' }}>
      <section className="hw-card hw-card--plain hw-col" style={{ gap: 8 }}>
        <span className="hw-chip" data-tone="orange">微信文章 · 正文由作者提供</span>
        <p className="hw-t hw-t--tight" style={{ fontWeight: 700 }}>骨架之外的灵魂</p>
        <hr style={{ height: 1, background: HW.line, border: 0 }} />
        <dl className="hw-kv" style={{ gap: '4px 18px' }}>
          <dt>对象</dt><dd>Claude Code 2.1.88</dd>
          <dt>规模</dt><dd>1884 个源文件（作者自述）</dd>
          <dt>起因</dt><dd>60MB source map · 1906 个文件</dd>
          <dt>日期</dt><dd>原文未标注</dd>
          <dt>署名</dt><dd>原文未署名</dd>
          <dt>抓取</dt><dd>微信验证页拦截，正文由使用者粘贴</dd>
        </dl>
        <a className="hw-t" href={SOURCE} target="_blank" rel="noreferrer"
          title={SOURCE} style={{ fontSize: 28, wordBreak: 'break-all' }}>
          mp.weixin.qq.com/s/vbigwjX-TBvjDQ8sUdZ3qA ↗
        </a>
      </section>

      <div className="hw-col" style={{ gap: 10 }}>
        <Boundary n={1} title="作者亲读" tone={HW.blue}
          body="1884 个文件、12 个“停下来”的瞬间。" hint="引文与文件名来自文章正文。" />
        <Boundary n={2} title="已有人拆过" tone={HW.teal}
          body="Agent 循环、流式工具、权限管道、MCP、Skill。" hint="骨架部分本文不再重复。" />
        <Boundary n={3} title="本文的解释" tone={HW.orange}
          body="“为什么这么想”是作者的归纳。" hint="不是 Anthropic 的设计文档。" />
        <div className="hw-band" style={{ marginTop: 'auto' }}>
          <span>阅读路线：为什么再读 → 复查/睡眠/药房 → 安检/处方 → 值班/监控/旋钮 → 两只手</span>
        </div>
      </div>
    </div>
  );
}

function Boundary({ n, title, body, hint, tone }: { n: number; title: string; body: string; hint: string; tone: string }) {
  return (
    <section className="hw-card hw-row" style={{ alignItems: 'flex-start', flex: '1 1 0', gap: 16, borderTop: `4px solid ${tone}` }}>
      <span style={{
        display: 'inline-grid', placeItems: 'center', flex: 'none',
        width: 52, height: 52, borderRadius: 8, background: tone, color: '#fff',
        fontSize: 30, fontWeight: 700,
      }}>{n}</span>
      <div style={{ minWidth: 0 }}>
        <p className="hw-h" style={{ marginBottom: 2 }}>{title}</p>
        <p className="hw-t hw-t--tight">{body}</p>
        <p className="hw-t hw-t--tight hw-muted">{hint}</p>
      </div>
    </section>
  );
}

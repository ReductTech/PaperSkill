import React from 'react';
import { INK } from './kit';

const EVENTS = [
  { n: '01', title: '3 月 31 日', note: '更新随包发出' },
  { n: '02', title: '数分钟', note: '被发现并公开' },
  { n: '03', title: '当天', note: '镜像与重写' },
  { n: '04', title: '随后', note: '收到 DMCA' },
  { n: '05', title: '同时', note: '上传 IPFS' },
  { n: '06', title: '至今', note: '重写版在线' },
];

const PATHS = [
  {
    name: '原样镜像', tone: INK.red,
    rows: [['法律', '收到 DMCA 通知'], ['现状', '被下架'], ['控制权', '归平台']],
  },
  {
    name: '翻译重写', tone: INK.green,
    rows: [['法律', 'clean-room 论未上庭'], ['现状', '仍在线，75k+ star'], ['控制权', '归重写者']],
  },
  {
    name: '去遥测重发', tone: INK.orange,
    rows: [['法律', 'DMCA 能否触及未定'], ['现状', '已上传，无法撤回'], ['控制权', '无人可撤']],
  },
];

/* 事件链只陈述原文给出的事实顺序；三条路径是文章自己的比较，
   本页不补时间戳、不推断判决结果。 */
export function LeakAftermath() {
  return (
    <div className="ps" style={{ gridTemplateRows: 'auto minmax(0, 1fr) auto', gap: 16 }}>
      <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12, listStyle: 'none' }}>
        {EVENTS.map(event => (
          <li key={event.n} className="ps-card" style={{ padding: '12px 14px' }}>
            <p className="ps-t" style={{ color: INK.wood, fontWeight: 700 }}>{event.n}</p>
            <p className="ps-t ps-t--tight" style={{ fontWeight: 700 }}>{event.title}</p>
            <p className="ps-t ps-t--tight ps-muted">{event.note}</p>
          </li>
        ))}
      </ol>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, minHeight: 0 }}>
        {PATHS.map(path => (
          <section key={path.name} className="ps-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="ps-h" style={{ color: path.tone }}>{path.name}</p>
            <hr className="ps-rule" />
            <dl style={{ display: 'grid', gridTemplateColumns: '98px minmax(0, 1fr)', gap: '6px 10px', alignContent: 'center', flex: '1 1 auto' }}>
              {path.rows.map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt className="ps-t ps-t--tight ps-muted">{label}</dt>
                  <dd className="ps-t ps-t--tight" style={{ margin: 0 }}>{value}</dd>
                </React.Fragment>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="ps-band">
        <span>公开之后，能决定的只剩<strong>如何应对</strong>，不再是<strong>是否公开</strong>。</span>
      </div>
    </div>
  );
}

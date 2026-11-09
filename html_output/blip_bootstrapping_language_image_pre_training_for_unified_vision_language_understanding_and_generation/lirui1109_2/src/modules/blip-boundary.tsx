import { useState } from 'react';
import { Feedback, Photo, useTween } from './blip-kit';

export function BlipBoundary() {
  const [wrong, setWrong] = useState(true);
  const [accept, setAccept] = useState(true);
  const inclusion = useTween(accept ? 1 : 0, 450);
  const errors = wrong && accept ? 1 : 0;
  return <div className="blip-page" style={{ width: '100%', height: '100%', position: 'relative', fontSize: 'var(--ppt-body-text)', color: '#21324a' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: 840, height: 510, borderRadius: 24, background: '#f4efe4' }}>
      <div style={{ position: 'absolute', left: 22, top: 20 }}><Photo kind="umbrella" width={410} height={285} accent="#c43f52" /></div>
      <div style={{ position: 'absolute', left: 460, top: 28, width: 348 }}>
        <p style={{ fontSize: 'var(--ppt-body-heading)', fontWeight: 750, margin: '0 0 20px' }}>照片里是红伞</p>
        <button className="blip-control" onClick={() => setWrong(value => !value)} style={{ display: 'block', fontSize: 'var(--ppt-body-text)', width: '100%', padding: '18px 10px', border: `2px solid ${wrong ? '#c43f52' : '#228d5c'}`, borderRadius: 12, background: '#fffef9' }}>说明：一把<strong style={{ color: wrong ? '#27446e' : '#c43f52' }}>{wrong ? '蓝伞' : '红伞'}</strong><br /><span>{wrong ? '点击更正为红伞' : '点击改成蓝伞'}</span></button>
        <button className="blip-control" onClick={() => setAccept(value => !value)} aria-pressed={accept} style={{ fontSize: 'var(--ppt-body-text)', marginTop: 22, padding: '14px 15px', width: '100%', border: `2px solid ${accept ? '#27446e' : '#d7deea'}`, borderRadius: 12, background: accept ? '#e8eef5' : '#fffef9' }}>教学过滤：{accept ? '保留' : '拒绝'}</button>
      </div>
      <div style={{ position: 'absolute', top: 335, left: 24, width: 787, height: 143, border: `2px solid ${errors ? '#c43f52' : '#228d5c'}`, background: '#fffef9', borderRadius: 14 }}>
        <div style={{ position: 'absolute', left: 22, top: 15 }}><strong>教学训练集</strong><p style={{ margin: '12px 0 0' }}>3 条人标 + {accept ? '1 条待检描述' : '0 条待检描述'}</p></div>
        <div style={{ position: 'absolute', right: 28 + (1 - inclusion) * 15, top: 21, padding: '8px 15px', border: '2px solid #d7deea', background: errors ? '#f9e8eb' : '#eaf4ed', borderRadius: 8 }}><strong style={{ color: errors ? '#c43f52' : '#228d5c' }}>错误对：{errors}</strong><p style={{ margin: '8px 0 0' }}>共 {3 + Number(accept)} 对</p></div>
      </div>
    </div>
    <aside style={{ position: 'absolute', left: 910, top: 0, width: 545 }}>
      <h3 style={{ fontSize: 'var(--ppt-body-heading)', lineHeight: 1.2, margin: '0 0 18px' }}>更丰富的描述，<br />仍可能不符合图像。</h3>
      <p style={{ lineHeight: 1.35, margin: '0 0 18px' }}>这是已知颜色的教学校验，未运行 BLIP。更正或拒绝描述，会改变集合中的错误对数量。</p>
      <p style={{ lineHeight: 1.35, margin: '0 0 18px' }}>原文核采样描述有 25% 被 Filter 拒绝；这不是人工核实的真实错误率。</p>
      <p style={{ lineHeight: 1.35, margin: 0 }}>多轮自举、每图多条描述是未来方向；主实验每图生成一条。</p>
    </aside>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Feedback tone={errors ? 'red' : accept ? 'green' : 'blue'}>{errors ? 'Filter 也会误放行：蓝伞说明已进入训练集。请更正颜色，或拒绝这条描述。' : accept ? '红伞与图像一致，教学集合新增一条匹配对；真实数据仍需核验。' : '这条描述已移出教学训练集；拒绝能去噪，也可能丢掉正确信息。'}</Feedback></div>
  </div>;
}

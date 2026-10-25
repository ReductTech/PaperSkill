import React, {useRef, useState} from 'react';
import {useCoverPlayback} from '../components/CoverPlayback';
import type {WidgetProps} from './registry';
import {allConditions, analyzeFeedback, callTeachingTool, commonPrefix, newSession, recordAttempt, teachingSeal} from './models';

const C = {ink: '#21324a', blue: '#27446e', green: '#228d5c', red: '#c43f52', line: '#c5d0dd', quiet: '#f3f6fa'};
const SOURCE = 'https://alex000kim.com/posts/2026-03-31-claude-code-source-leak/';

function Cup({x = 0, y = 0, fill = 0, scale = 1}: {x?: number; y?: number; fill?: number; scale?: number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M130 42 H150 Q185 42 180 76 Q175 104 132 101" stroke={C.blue} strokeWidth="9" fill="none"/>
    <rect x="12" y="23" width="122" height="112" rx="20" fill="white" stroke={C.blue} strokeWidth="6"/>
    <rect x="22" y={126 - 78 * fill} width="102" height={78 * fill} rx="9" fill={C.green} className="cf-liquid"/>
    <path d="M0 149 H156" stroke={C.line} strokeWidth="10" strokeLinecap="round"/>
  </g>;
}

function Shop({open = false, night = false}: {open?: boolean; night?: boolean}) {
  return <svg viewBox="0 0 900 400" role="img" aria-label={night ? '夜间门店与尚待执行的值班计划' : open ? '四项条件满足，门店打开' : '门店关闭，仍有条件未满足'}>
    <rect width="900" height="400" rx="18" fill={C.quiet}/>
    {night && <path d="M775 36 A44 44 0 1 0 831 94 A39 39 0 0 1 775 36" fill="#9bacc1"/>}
    <rect x="190" y="95" width="500" height="258" rx="9" fill="white" stroke={C.line} strokeWidth="6"/>
    <path d="M166 100 L209 48 H670 L713 100 V139 H166Z" fill="#e5edf6" stroke={C.blue} strokeWidth="5"/>
    {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${210 + i * 96} 49 l-18 88 H${245 + i * 96} L${250 + i * 96} 49Z`} fill={C.blue} opacity=".75"/>)}
    <rect x="224" y="174" width="244" height="146" rx="8" fill="#edf2f8" stroke={C.line} strokeWidth="4"/>
    <Cup x={272} y={188} fill={open ? .8 : 0} scale={.72}/>
    <path d="M505 163 H651 V354 H505Z" fill={open ? '#e7f4eb' : '#e8edf3'} stroke={C.blue} strokeWidth="5"/>
    <g className="cf-door" style={{transform: `translateX(${open ? 78 : 0}px)`}}><rect x="510" y="168" width="136" height="181" fill="#dce6f1" stroke={C.blue} strokeWidth="4"/><circle cx="624" cy="266" r="8" fill={C.blue}/></g>
    <path d="M120 361 H770" stroke="#abb9ca" strokeWidth="12" strokeLinecap="round"/>
    <rect x="59" y="169" width="100" height="145" rx="7" fill="white" stroke={C.blue} strokeWidth="5"/>
    <path d="M76 207 H142 M76 237 H130 M76 267 H139" stroke={C.line} strokeWidth="7"/>
    <text x="440" y="388" textAnchor="middle" fontSize="32" fontWeight="700" fill={open ? C.green : C.blue}>{night ? '夜间值班：计划与执行要分开' : open ? '允许开门' : '等待条件满足'}</text>
  </svg>;
}

function NoteIllustration({kind = 'note'}: {kind?: 'note' | 'menu' | 'publish'}) {
  return <svg viewBox="0 0 300 300" aria-hidden="true">
    {kind === 'publish' ? <g><path d="M65 130 L226 70 V224 L65 174Z" fill="#e5edf6" stroke={C.blue} strokeWidth="7"/><path d="M75 174 L98 245 H132 L113 174" fill="white" stroke={C.blue} strokeWidth="7"/><path d="M244 90 l25-15 M246 150 H280 M242 206 l25 18" stroke={C.blue} strokeWidth="8"/></g> : <g>
      <rect x="44" y="30" width="210" height="242" rx="12" fill="white" stroke={C.blue} strokeWidth="7"/>
      <path d="M89 30 V15 H210 V46 H89Z" fill="#cbd8e7" stroke={C.blue} strokeWidth="5"/>
      <path d="M78 98 H215 M78 143 H198 M78 188 H216 M78 233 H180" stroke={C.line} strokeWidth="10"/>
      {kind === 'menu' ? <Cup x={113} y={75} scale={.65} fill={.7}/> : <path d="M199 218 l34-102 19 8-34 103-25 25Z" fill={C.blue}/>}
    </g>}
  </svg>;
}

function Feedback({good, neutral = false, children}: {good?: boolean; neutral?: boolean; children: React.ReactNode}) {
  return <div className={`cf-feedback ${neutral ? 'is-neutral' : good ? 'is-good' : 'is-bad'}`} aria-live="polite">{children}</div>;
}
function Footnote({children}: {children: React.ReactNode}) {return <p className="cf-footnote">{children}</p>;}
function Toggle({checked, onChange, children}: {checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode}) {
  return <label className="cf-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)}/><span>{children}</span></label>;
}

export function CafeCoverBody({moduleId}: WidgetProps) {
  const {progress} = useCoverPlayback();
  const last = useRef(0), finished = useRef(false);
  if (progress < last.current) finished.current = true;
  last.current = progress;
  const checked = moduleId === 'newMethod', ready = checked && (finished.current || progress > .55);
  return <div className="cf-cover"><Shop open={ready}/><p>{checked ? '条件满足以后，再验证实际行为' : '菜单里有名字，门店仍可能关闭'}</p></div>;
}

export function SourceBoundaryBody() {
  return <div className="cf-page cf-source">
    <section><h3>Alex Kim 的代码阅读笔记</h3><dl>
      <div><dt>作者</dt><dd>Alex Kim</dd></div><div><dt>发表</dt><dd>个人博客 · 2026-03-31</dd></div>
      <div><dt>类型</dt><dd>技术分析文章</dd></div><div><dt>机构</dt><dd>原文未明确</dd></div>
    </dl><a href={SOURCE} target="_blank" rel="noreferrer">阅读完整原文 ↗</a><p className="cf-source-takeaway">代码线索、作者判断与运行证据，<br/>需要分别核对。</p></section>
    <div className="cf-source-note"><NoteIllustration/><h3>本教程的交互</h3><p>原创本地模型，只解释规则。<br/>没有运行泄露源码。</p></div>
  </div>;
}

export function FeatureGatesBody() {
  const [values, setValues] = useState([true, true, true, false]);
  const labels = ['编译标志', 'CLI 入口', '第一方服务', '远程开关'];
  const active = allConditions(values);
  return <div className="cf-page cf-gates">
    <section><h3>四项条件，缺一不可</h3>{labels.map((label, i) => <Toggle key={label} checked={values[i]} onChange={value => setValues(old => old.map((item, j) => j === i ? value : item))}>{label}</Toggle>)}<p>改变一项，观察分支是否激活。</p></section>
    <section><Shop open={active}/><div className="cf-gate-lights">{labels.map((label, i) => <span key={label} className={values[i] ? 'is-on' : ''}><b>{values[i] ? '✓' : '○'}</b>{label}</span>)}</div>
      <Feedback good={active}>{active ? '四项同时满足：教学分支激活。' : `尚未激活：${labels.filter((_, i) => !values[i]).join('、')}。`}</Feedback></section>
    <Footnote>文章报告四项门控；满足此模型不等于确认真实服务行为。</Footnote>
  </div>;
}

export function DecoyToolsBody() {
  const [decoy, setDecoy] = useState(true), [choice, setChoice] = useState('隐藏配方');
  const tools = decoy ? ['查库存', '列菜单', '隐藏配方'] : ['查库存', '列菜单'];
  const result = callTeachingTool(choice);
  return <div className="cf-page cf-tools">
    <section><Toggle checked={decoy} onChange={value => {setDecoy(value); setChoice(value ? '隐藏配方' : '查库存');}}>观测目录包含伪条目</Toggle><p>点选一个条目，再核对本地注册表。</p>
      <div className="cf-menu-items">{tools.map((tool, i) => <button key={tool} aria-pressed={choice === tool} onClick={() => setChoice(tool)}><svg viewBox="0 0 220 170" aria-hidden="true">{i === 0 ? <g><rect x="35" y="35" width="140" height="100" rx="8" fill="white" stroke={C.blue} strokeWidth="5"/><path d="M35 70 H175 M35 103 H175 M80 35 V135 M130 35 V135" stroke={C.line} strokeWidth="5"/></g> : i === 1 ? <Cup x={35} y={8} fill={.7} scale={.8}/> : <g><path d="M49 27 H165 V145 H49Z" fill="white" stroke={C.blue} strokeWidth="5"/><path d="M74 65 H143 M74 96 H130" stroke={C.line} strokeWidth="8"/><text x="108" y="133" textAnchor="middle" fontSize="48" fill={C.blue}>?</text></g>}</svg><strong>{tool}</strong></button>)}</div>
    </section>
    <section className="cf-tool-result"><h3>本地执行回执</h3><strong className="cf-emphasis">{choice}</strong><p>{result.result}</p><Feedback good={result.registered}>{result.registered ? '这个示例条目已注册，可以返回结果。' : '只在目录中出现，不代表能够执行。'}</Feedback></section>
    <Footnote>工具名和返回值均为自拟示例，不复现服务端注入或实际蒸馏。</Footnote>
  </div>;
}

export function PrivacyCreditBody() {
  const [internal, setInternal] = useState(false), [credit, setCredit] = useState(true);
  return <div className="cf-page cf-privacy">
    <section><h3>分别决定两类字段</h3><Toggle checked={internal} onChange={setInternal}>公开内部代号</Toggle><Toggle checked={credit} onChange={setCredit}>保留贡献与工具说明</Toggle><Feedback good={!internal && credit}>{internal ? '内部代号进入了公开内容。' : credit ? '内部信息隐藏，贡献说明保留。' : '内部信息隐藏，贡献说明也被省略。'}</Feedback></section>
    <section className="cf-public-menu"><div className="cf-menu-icon"><NoteIllustration kind="menu"/></div><h3>咖啡店公开菜单</h3><p className={internal ? 'cf-private-visible' : 'cf-blank'}>{internal ? '内部代号：试验烘焙室' : '内部代号不公开'}</p><p className={credit ? 'cf-credit-visible' : 'cf-blank'}>{credit ? '贡献与工具说明：已保留' : '贡献说明：未展示'}</p></section>
    <Footnote>两字段是独立教学设计；不声称真实 Undercover 模式提供这些设置。</Footnote>
  </div>;
}

const feedbackExamples = [
  {label: '直接不满', text: 'This is awful', negative: true},
  {label: '否定语境', text: 'It is not awful anymore', negative: false},
  {label: '无关键词不满', text: 'It fails every time', negative: true},
  {label: '正面反馈', text: 'Looks good', negative: false},
];
export function FrustrationRegexBody() {
  const [text, setText] = useState(feedbackExamples[0].text), [negative, setNegative] = useState(true);
  const result = analyzeFeedback(text, negative);
  return <div className="cf-page cf-regex">
    <section><label htmlFor="feedback-text">改写顾客反馈</label><textarea id="feedback-text" maxLength={56} value={text} onChange={event => setText(event.target.value)}/><div className="cf-examples">{feedbackExamples.map(example => <button key={example.label} onClick={() => {setText(example.text); setNegative(example.negative);}}>{example.label}</button>)}</div><p>教学规则：只查 awful 或 this sucks。</p></section>
    <section className="cf-feedback-slip"><h3>关键词检查单</h3><p>命中词：<strong>{result.word}</strong></p><Toggle checked={negative} onChange={setNegative}>人工标注为负面反馈</Toggle><strong className="cf-emphasis">{result.kind === '一致' ? '与当前标注一致' : result.kind}</strong><Feedback good={result.kind === '一致'}>{result.kind === '误报' ? '命中关键词，但当前标注并非负面。' : result.kind === '漏报' ? '当前标注为负面，却未命中关键词。' : '这一次一致，不能推出整体准确率。'}</Feedback><div className="cf-slip-cup"><svg viewBox="0 0 200 160" aria-hidden="true"><Cup x={10} fill={.5}/></svg></div></section>
    <Footnote>正则、句子与标注均为自拟示例；本页不测量原始检测器准确率。</Footnote>
  </div>;
}

export function NativeSealBody() {
  const [quantity, setQuantity] = useState(2), [stamp, setStamp] = useState(() => teachingSeal('order:2'));
  const expected = teachingSeal('order:' + quantity), same = stamp === expected;
  return <div className="cf-page cf-seal">
    <section><h3>改订单，保留原来的章</h3><label className="cf-quantity">订单杯数<input aria-label="订单杯数" type="number" min="1" max="9" value={quantity} onChange={event => setQuantity(Math.max(1, Math.min(9, Number(event.target.value))))}/></label><div className="cf-seal-buttons"><button className="cf-primary" onClick={() => setStamp(expected)}>生成教学校验码</button><button onClick={() => setStamp('00000')}>恢复占位符</button></div><svg className="cf-seal-cup" viewBox="0 0 600 210" aria-hidden="true"><Cup x={200} y={10} scale={1.1} fill={same ? .8 : .2}/></svg><p>订单改变后，旧校验码仍保留。</p></section>
    <section className="cf-seal-receipt"><h3>固定五字符的教学字段</h3><div className="cf-seal-code" aria-label={'当前校验码 ' + stamp}>{[...stamp].map((char, i) => <span key={i}>{char}</span>)}</div><p>当前订单应对应 <strong>{expected}</strong></p><Feedback good={same}>{same ? '本地一致：校验码对应当前订单。' : '本地失配：订单与旧校验码不对应。'}</Feedback><p>公开、可重算的示例校验码，<br/>不具备密码学认证能力。</p></section>
    <Footnote>文章描述原生层替换字段；真实服务器是否拒绝无效值，本文未验证。</Footnote>
  </div>;
}

export function RetryBudgetBody() {
  const [state, setState] = useState(newSession);
  const successful = state.events[state.events.length - 1] === '成功';
  return <div className="cf-page cf-retry">
    <section><svg className="cf-machine" viewBox="0 0 900 390" role="img" aria-label={`教学咖啡机，连续失败 ${state.consecutive} 次，${state.stopped ? '已停止' : '仍可尝试'}`}>
      <rect width="900" height="390" rx="18" fill={C.quiet}/><path d="M100 345 H790" stroke="#aab9cb" strokeWidth="14"/>
      <rect x="220" y="45" width="420" height="272" rx="30" fill="#dce6f1" stroke={C.blue} strokeWidth="7"/><rect x="275" y="94" width="170" height="82" rx="12" fill="white" stroke={C.blue} strokeWidth="5"/>
      {[0, 1, 2].map(i => <circle key={i} cx={490 + i * 48} cy="126" r="15" fill={state.consecutive > i ? C.red : 'white'} stroke={C.blue} strokeWidth="4"/>)}
      <path d="M400 190 V225 H360 V250" stroke={C.blue} strokeWidth="18" fill="none"/><Cup x={288} y={214} scale={.7} fill={successful ? .9 : 0}/>
      <text x="360" y="149" textAnchor="middle" fontSize="32" fill={state.stopped ? C.red : C.blue}>{state.stopped ? '已停机' : '可尝试'}</text>
    </svg><div className="cf-attempt-buttons"><button disabled={state.stopped} onClick={() => setState(old => recordAttempt(old, false))}>失败一次</button><button disabled={state.stopped} onClick={() => setState(old => recordAttempt(old, true))}>成功一次</button><button onClick={() => setState(newSession())}>新会话</button></div></section>
    <section className="cf-retry-results"><h3>连续失败计数</h3><strong className="cf-emphasis">{state.consecutive} / 3</strong><p>本地尝试共 {state.total} 次</p><Feedback good={!state.stopped} neutral={!state.stopped}>{state.stopped ? '达到阈值：本会话不再尝试。' : successful ? '本次成功，连续失败计数归零。' : '尚未达到阈值；错误原因仍需诊断。'}</Feedback><div className="cf-event-strip">{state.events.length ? state.events.map((event, i) => <span key={i} className={event === '成功' ? 'is-success' : ''}>{event}</span>) : <span>尚无尝试</span>}</div></section>
    <Footnote>阈值 3 来自文章报告；事件序列是教学输入，不代表真实 API 调用。</Footnote>
  </div>;
}

export function IncidentEvidenceBody() {
  return <div className="cf-page cf-incident"><section className="cf-incident-record"><div className="cf-incident-icon"><NoteIllustration/></div><h3>作者引述的代码注释</h3><strong className="cf-emphasis">约 250,000 次调用 / 天</strong><p>注释日期：2026-03-10<br/>范围：注释所述的全局规模</p><p>1,279 个会话出现至少 50 次连续失败；<br/>文中所述单会话最高为 3,272 次。</p></section><section className="cf-evidence-limits"><h3>这些记录没有提供</h3><ul><li>可供复算的原始日志</li><li>完整请求量与统计协议</li><li>修复后的对照统计</li></ul><div className="cf-evidence-conclusion"><strong>不能据此计算节省比例，<br/>也不能当成当前规模。</strong></div></section><Footnote>数字仅转述文章所引注释，不是本教程的观测或独立复现实验。</Footnote></div>;
}

export function PromptPrefixBody() {
  const [shared, setShared] = useState(true);
  const before = ['角色规则', '品牌说明', '公共菜单', '交互约定', '本次订单 A'];
  const after = [...before]; after[shared ? 2 : 4] = shared ? '临时菜单' : '本次订单 B';
  const length = commonPrefix(before, after);
  return <div className="cf-page cf-prefix"><div className="cf-prefix-pair">{[before, after].map((segments, side) => <section className="cf-prefix-menu" key={side}><h3>{side ? '本次提示' : '上次提示'}</h3>{segments.map((segment, i) => <div key={i} className={i < length ? 'cf-prefix-same' : i === length ? 'cf-prefix-diff' : ''}><span>{i + 1}</span>{segment}<b>{i < length ? '相同' : i === length ? '首个差异' : '在差异之后'}</b></div>)}</section>)}</div><div className="cf-prefix-bottom"><div className="cf-prefix-options"><button aria-pressed={shared} onClick={() => setShared(true)}>改公共菜单</button><button aria-pressed={!shared} onClick={() => setShared(false)}>仅改本次订单</button></div><Feedback good={!shared} neutral={shared}>连续相同前缀：{length} 段。{shared ? '较早发生变化。' : '保留了更多公共段。'}</Feedback></div><Footnote>“段”是自拟模型单位，不代表实际 token、缓存命中率或计费规则。</Footnote></div>;
}

export function RoadmapBoundaryBody() {
  return <div className="cf-page cf-roadmap"><section><Shop night/><p>夜间计划写在值班表里，<br/>不代表已经在真实环境执行。</p></section><section><h3>文章中的 KAIROS 线索</h3><p>记忆整理、追加日志、后台进程、<br/>定时刷新等受开关控制的路径。</p><table><tbody><tr><th>代码引用存在</th><td>作者报告</td></tr><tr><th>实际激活条件</th><td>仍需核验</td></tr><tr><th>当前公开可用</th><td>本文未证明</td></tr></tbody></table><p>下一步：给具体任务设定权限，<br/>再进行受控验证。</p></section><Footnote>保持文章的推断语气；不据此断言产品当前已经发布或尚未发布。</Footnote></div>;
}

export function NightPermissionsBody() {
  const [allowed, setAllowed] = useState(['read']);
  const tasks = [{id: 'read', name: '读取库存', kind: 'note' as const}, {id: 'edit', name: '改写菜单', kind: 'menu' as const}, {id: 'publish', name: '对外发布', kind: 'publish' as const}];
  return <div className="cf-page cf-permissions"><div className="cf-permission-cards">{tasks.map(task => {const enabled = allowed.includes(task.id); return <button key={task.id} aria-pressed={enabled} onClick={() => setAllowed(old => enabled ? old.filter(id => id !== task.id) : [...old, task.id])}><NoteIllustration kind={task.kind}/><h3>{task.name}</h3><span className={enabled ? 'cf-permit-yes' : 'cf-permit-no'}>{enabled ? '允许' : '阻止'}</span></button>;})}</div><div className="cf-permission-outcome"><strong className="cf-emphasis">允许 {allowed.length} / 3 项</strong><Feedback good={allowed.length === 1 && allowed.includes('read')} neutral={allowed.length !== 1 || !allowed.includes('read')}>{allowed.length === 0 ? '全部阻止，也无法完成读取任务。' : allowed.includes('publish') ? '范围包含公开发布；需要单独验证这一权限。' : allowed.includes('edit') ? '已允许改写；比只读扩大了作用范围。' : '只读范围保留；写入与发布被阻止。'}</Feedback></div><Footnote>原创本地规则提案，无真实读写或发布；授权项数不是安全评分。</Footnote></div>;
}

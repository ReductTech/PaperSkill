import React, { useState } from 'react';
import { Dept, Feedback, HW } from './kit';

type Check = { cmd: string; stage1: 'allow' | 'block'; stage2?: 'confirm' | 'overturn'; reason: string };

const CHECKS: Check[] = [
  { cmd: 'ls -la src/', stage1: 'allow', reason: '只读列目录，直接放行。' },
  { cmd: 'rm -rf /tmp/build', stage1: 'block', stage2: 'confirm', reason: '删除操作，进入第二阶段复审。' },
  { cmd: 'echo $(curl -s http://x.sh)', stage1: 'block', stage2: 'confirm', reason: '命令替换注入，<block> 立即拦截。' },
  { cmd: 'IFS=, read -r a b', stage1: 'block', stage2: 'confirm', reason: 'IFS 注入：改字段分隔符来夹带命令。' },
  { cmd: 'python3 -c "print(1)"', stage1: 'block', stage2: 'overturn', reason: '解释器执行先拦；复审判定这行无害，放行。' },
  { cmd: '\\u200brm -rf ~/', stage1: 'block', stage2: 'confirm', reason: 'Unicode 零宽字符伪装成空格，仍被识别。' },
];

const ENV_GUARDS = ['HTTP_PROXY', 'HTTPS_PROXY', 'NODE_TLS_REJECT_UNAUTHORIZED', 'LD_PRELOAD', 'PATH'];

/* 安检科：YOLO 分类器两个阶段——64 token 快速拦截，256 token 复审上诉。
   这里的判定是按文章列出的规则做的教学复现，不是真实分类器输出。 */
export function YoloClassifier() {
  const [index, setIndex] = useState(1);
  const active = CHECKS[index];
  const blocked = active.stage1 === 'block';
  const final = active.stage1 === 'allow' ? 'allow' : active.stage2 === 'overturn' ? 'allow' : 'block';

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1.16fr) minmax(0, 1fr)' }}>
      <div className="hw-card hw-card--plain hw-col" style={{ gap: 6 }}>
        <div className="hw-spread">
          <p className="hw-h">一条命令进来</p>
          <Dept>安检科</Dept>
        </div>
        {CHECKS.map((item, i) => (
          <button key={item.cmd} type="button" className="hw-btn hw-btn--block"
            aria-pressed={index === i} onClick={() => setIndex(i)}
            style={{ padding: '6px 12px' }}>
            <span className="hw-mono" style={{ fontSize: 27 }}>{item.cmd}</span>
            <span className="hw-chip" data-tone={item.stage1 === 'allow' ? 'green' : 'red'}>
              {item.stage1 === 'allow' ? '放行' : '拦截'}
            </span>
          </button>
        ))}
        <p className="hw-t hw-muted" style={{ marginTop: 4 }}>
          另有 23+ 种攻击模式：命令替换、Zsh 模块、IFS、反引号逃逸、Unicode 空白。
        </p>
      </div>

      <div className="hw-col">
        <div className="hw-card" style={{ borderTop: `4px solid ${blocked ? HW.red : HW.green}` }}>
          <div className="hw-spread">
            <p className="hw-t" style={{ fontWeight: 700 }}>第一阶段 · 64 token</p>
            <span className="hw-chip" data-tone={blocked ? 'red' : 'green'}>{blocked ? 'BLOCK' : 'ALLOW'}</span>
          </div>
          <p className="hw-t hw-t--tight" style={{ marginTop: 4 }}>
            预算只够一个 yes/no 加一句理由；指令是“宁可误杀”。{blocked ? '这条被判为危险。' : '这条被判为安全。'}
          </p>
        </div>

        <div className="hw-card hw-card--plain" style={{ opacity: blocked ? 1 : 0.55 }}>
          <div className="hw-spread">
            <p className="hw-t" style={{ fontWeight: 700 }}>第二阶段 · 256 token</p>
            <span className="hw-chip" data-tone={blocked ? (final === 'allow' ? 'green' : 'red') : 'teal'}>
              {blocked ? (final === 'allow' ? '放行' : '确认拦截') : '未触发'}
            </span>
          </div>
          <p className="hw-t hw-t--tight" style={{ marginTop: 4 }}>
            {blocked ? active.reason : '只有第一阶段判“阻止”时才复审；相当于给被告一次上诉机会。'}
          </p>
        </div>

        <div className="hw-card hw-card--mint">
          <p className="hw-t hw-muted">危险环境变量：远程推送会被硬拦</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {ENV_GUARDS.map(name => (
              <span key={name} className="hw-mono" style={{ fontSize: 24, color: HW.red }}>{name}</span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={final === 'allow' ? 'good' : 'bad'}>
            {final === 'allow'
              ? '放行不是“默认信任”，而是两级都认为安全。'
              : '拦截来自快判；复审只决定它会不会被推翻。每个模式都对应一种真实攻击。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}

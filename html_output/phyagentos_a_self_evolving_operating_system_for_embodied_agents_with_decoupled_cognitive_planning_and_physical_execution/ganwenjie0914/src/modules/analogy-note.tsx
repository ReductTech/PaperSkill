import React from 'react';
import type { WidgetProps } from './registry';

// 文字版生活类比卡（PaperSkill 允许区域内的替换实现）。
// 原 560×140 徒步 Canvas 动画已按用户要求移除；本组件用文字承载同一个
// 「一主体 · 一动作 · 一目标」类比契约（animation-library.md 句子测试的
// 文本形式），锚定主题保持徒步不变。无动画、无 rAF，静态可读。

interface NoteDef {
  icon: string;
  subject: string;
  verb: string;
  goal: string;
  line: string;
}

const NOTES: Record<string, NoteDef> = {
  'chap-1': {
    icon: '🧭',
    subject: '登山队',
    verb: '认领分工',
    goal: '找出无人负责的两环',
    line: '向导、地图、补给各管一段——先看清谁负责什么，才知道哪段路没人管。',
  },
  'chap-2': {
    icon: '🥾',
    subject: '登山者',
    verb: '停下脚步',
    goal: '对照地图核验终点',
    line: '脚步停下只说明动作结束；把终点对回地图，才能说明任务完成。',
  },
  'chap-3': {
    icon: '⛺',
    subject: '大本营',
    verb: '调度补给',
    goal: '让登山成为系统工程',
    line: '大本营不替你迈步——路线调度、进度记录、装备检查、组织补给由它负责。',
  },
  'chap-4': {
    icon: '📻',
    subject: '无线电频道',
    verb: '同步频道',
    goal: '全队只认一份事实',
    line: '侦察队、大本营、补给队不必共享一本日记，但必须守同一个频道。',
  },
  'chap-5': {
    icon: '📋',
    subject: '一份行程单',
    verb: '随行记录',
    goal: '终点确认有据可查',
    line: '治理的对象是整段行程，不是某一步踩在哪——出发检查、途中报平安、终点确认。',
  },
  'chap-6': {
    icon: '🚩',
    subject: '登山者',
    verb: '更换走法',
    goal: '两种走法都过检查站',
    line: '按既定步频走，或边走边查路牌——不管哪种走法，都不能绕过检查站。',
  },
  'chap-7': {
    icon: '🗺️',
    subject: '登山者',
    verb: '核对地图',
    goal: '判定真的登顶',
    line: '起点、终点、路径一起对回地图——只看终点照片，说不清旗子是谁插的。',
  },
  'chap-8': {
    icon: '📒',
    subject: '路线手册',
    verb: '收录验路',
    goal: '下次直接复用',
    line: '猜一个修法只是猜测；换条路重新走通之后，才配写进手册。',
  },
  'chap-9': {
    icon: '🪨',
    subject: '登山者',
    verb: '逐层试路',
    goal: '归因摔跤、护具齐全',
    line: '先平地、再碎石、最后冰面——逐层试探才能归因，护绳头盔一样不能省。',
  },
  'chap-10': {
    icon: '📈',
    subject: '登顶记录',
    verb: '复盘记录',
    goal: '分清证据与难点',
    line: '终点的绿色不是「所有山都被征服」——每个协议下都有证据、提升和剩余难点。',
  },
};

export const AnalogyNote: React.FC<WidgetProps> = ({ chapterId }) => {
  const n = NOTES[chapterId];
  if (!n) return null;
  return (
    <div className="an-note" role="note" aria-label="本章生活类比">
      <div className="an-chips" aria-label="主体、动作与目标">
        <span className="an-chip">
          <i>主体</i>
          {n.subject}
        </span>
        <span className="an-arrow" aria-hidden>
          →
        </span>
        <span className="an-chip">
          <i>动作</i>
          {n.verb}
        </span>
        <span className="an-arrow" aria-hidden>
          →
        </span>
        <span className="an-chip">
          <i>目标</i>
          {n.goal}
        </span>
      </div>
      <p className="an-line">
        <span className="an-icon" aria-hidden>
          {n.icon}
        </span>
        {n.line}
      </p>
    </div>
  );
};

export default AnalogyNote;

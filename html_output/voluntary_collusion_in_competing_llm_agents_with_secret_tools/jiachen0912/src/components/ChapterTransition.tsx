import React from 'react';

// 章节过渡带：每章最后一道「下一问 + 下一章标题」，勾连翻页的连贯感。

const NEXT_QUESTIONS: Record<string, string> = {
  'chap-1': '在什么样的环境里，智能体才有机会这样共谋？',
  'chap-2': '竞争环境有了，那智能体在「接受」前，心里到底怎么权衡？',
  'chap-3': '「合谋」到底怎么严谨定义、怎么测量它的伤害？',
  'chap-4': '定义有了，被测量的那两件「秘密工具」具体是什么？',
  'chap-5': '工具摆上桌，智能体走完「接受 → 选同伙 → 邀请」的完整链是怎样的？',
  'chap-6': '合谋的「收益」从哪来？背后的评分与价值机制是什么？',
  'chap-7': '这些机制怎么拼成一整套可测量、可归因的实验？',
  'chap-8': '结果可靠吗？换个措辞、加个对照，结论还成立吗？',
  'chap-9': '最终，合谋到底造成了多大的行为与公平性后果？',
  'chap-10': '想动手复现或扩展，要注意哪些坑？',
};

export function ChapterTransition({ chapterId, nextTitle }: { chapterId: string; nextTitle?: string }) {
  const q = NEXT_QUESTIONS[chapterId];
  if (!q) return null;
  return (
    <div className="chapter-transition">
      <div className="ct-arrow">↓</div>
      <div className="ct-q">下一问：{q}</div>
      {nextTitle ? <div className="ct-next">下一章 · {nextTitle}</div> : null}
    </div>
  );
}

import type { ReactNode } from "react";

interface ActProps {
  id: string;
  n: string;            // "02"
  sub?: string;         // "A" / "B" / "C"，单子幕可省略
  subIndex?: number;    // 1-based
  subCount?: number;    // >1 时封面显示进度点
  kicker: string;       // 幕名，如 "乐高式解法"
  color: string;
  question: string;     // 本幕问题（一屏只问一个问题）
  title: ReactNode;
  thesis: ReactNode;    // 一句话结论
  children: ReactNode;  // 主交互 + 辅助解释
  remember: [string, string, string]; // 收束：只记住三件事
}

/** 每一节的生命周期：封面条 → 一句话 → 主实验 → 收束卡（翻页由外层 DeckBar 负责） */
export default function Act({
  id, n, sub, subIndex, subCount, kicker, color, question, title, thesis, children, remember,
}: ActProps) {
  return (
    <section className="act" id={id} style={{ ["--kcolor" as string]: color }}>
      <div className="act-cover">
        <div className="act-cover-inner">
          <span className="ghost">{n}{sub ?? ""}</span>
          <div>
            <div className="cover-name">第 {n} 幕 · {kicker}</div>
            <div className="cover-q">{question}</div>
          </div>
          {subCount && subCount > 1 && subIndex ? (
            <div className="cover-progress">
              <span>本幕 {subIndex}/{subCount}</span>
              <span className="cover-dots">
                {Array.from({ length: subCount }, (_, i) => (
                  <i key={i} className={i + 1 === subIndex ? "on" : ""} />
                ))}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="wrap">
        <div className="act-head">
          <h2 className="act-title">{title}</h2>
          <div className="act-thesis">
            <span className="tag">一句话</span>
            <span>{thesis}</span>
          </div>
        </div>

        <div className="act-body">{children}</div>

        <div className="act-close reveal">
          <div>
            <div className="close-head">本节收束 · 只记住三件事</div>
            <ul>
              {remember.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

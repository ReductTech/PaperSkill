import { ACTS, DECK_ORDER, SECTION_TITLES } from "../data/content";

interface SideNavProps {
  cur: string;
  onGo: (id: string) => void;
  open: boolean;         // 移动端抽屉开关
  onClose: () => void;
}

/** 左侧竖向目录条：幕 → 子节两级，点击切换；移动端为抽屉 */
export default function SideNav({ cur, onGo, open, onClose }: SideNavProps) {
  const idx = DECK_ORDER.indexOf(cur);
  const go = (id: string) => {
    onGo(id);
    onClose();
  };
  return (
    <>
      {open && <div className="sidenav-mask" onClick={onClose} />}
      <nav className={`sidenav ${open ? "open" : ""}`}>
        <button
          className={`sn-brand ${cur === "top" ? "active" : ""}`}
          onClick={() => go("top")}
        >
          StarVLA
          <small>乐高式 VLA 框架 · 交互讲解</small>
        </button>

        <div className="sn-list">
          {ACTS.map((a) => {
            const multi = a.subs.length > 1;
            const actActive = a.subs.includes(cur);
            return (
              <div key={a.n} className={`sn-act ${actActive ? "active" : ""}`}>
                {multi ? (
                  <div className="sn-act-head">
                    <span className="sn-n">{a.n}</span> {a.label}
                  </div>
                ) : (
                  <button className="sn-item sn-act-link" onClick={() => go(a.subs[0])}>
                    <span className="sn-n">{a.n}</span> {a.label}
                  </button>
                )}
                {multi &&
                  a.subs.map((id) => (
                    <button
                      key={id}
                      className={`sn-item sn-sub ${cur === id ? "active" : ""}`}
                      onClick={() => go(id)}
                    >
                      {SECTION_TITLES[id]}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>

        <div className="sn-progress">
          <div className="sn-progress-bar">
            <i style={{ width: `${((idx + 1) / DECK_ORDER.length) * 100}%` }} />
          </div>
          第 {idx + 1} / {DECK_ORDER.length} 节 · {SECTION_TITLES[cur]}
        </div>
      </nav>
    </>
  );
}

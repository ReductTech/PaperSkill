"use client";

import { useState } from "react";
import { Menu, RotateCcw, X } from "lucide-react";
import { learningSections, type SectionId } from "@/src/data/vista4d";

export function LearningSidebar({ active, onNavigate, onRestart }: {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  onRestart: () => void;
}) {
  const [open, setOpen] = useState(false);
  const navigate = (id: SectionId) => {
    onNavigate(id);
    setOpen(false);
  };
  return <>
    <button className="mobile-nav-trigger" onClick={() => setOpen(true)} aria-label="打开回顾导航"><Menu /></button>
    {open && <button className="drawer-scrim" onClick={() => setOpen(false)} aria-label="关闭回顾导航" />}
    <aside className={`learning-sidebar ${open ? "open" : ""}`} aria-label="回顾模式导航">
      <div className="sidebar-brand"><div className="rec-dot" /><div><b>VISTA4D</b><span>回顾模式</span></div><button onClick={() => setOpen(false)} aria-label="关闭导航"><X /></button></div>
      <nav>
        {learningSections.map((section, index) => (
          <button key={section.id} className={active === section.id ? "active" : ""} onClick={() => navigate(section.id)}>
            <span>{index === 0 ? "00" : index === 10 ? "终" : `0${index}`}</span>
            <div><b>{section.label}</b><small>{section.short}</small></div>
          </button>
        ))}
      </nav>
      <button className="sidebar-restart" onClick={onRestart}><RotateCcw /> 重新学习</button>
    </aside>
  </>;
}

import { createContext, useContext, useState } from 'react';
import './hero-evidence-demo.css';

const Playback = createContext({ paused: false, toggle: () => {} });
export function HeroPlayback({ children }: { children: React.ReactNode }) {
  const [paused, setPaused] = useState(false);
  return <Playback.Provider value={{ paused, toggle: () => setPaused(value => !value) }}>{children}</Playback.Provider>;
}

function ActionImage() {
  return <svg className="hero-action-image" viewBox="0 0 320 94" aria-hidden="true">
    <rect width="320" height="94" fill="#eef3f8" />
    <path d="M0 80H320" stroke="#b6c2cf" strokeWidth="3" />
    <path d="M174 68H312" stroke="#64778a" strokeWidth="11" strokeLinecap="round" />
    <path d="M190 73V94 M298 73V94" stroke="#64778a" strokeWidth="5" />
    <circle cx="88" cy="27" r="16" fill="#efc6a6" stroke="#9c705c" strokeWidth="2" />
    <path d="M73 20q14-18 29 0" fill="none" stroke="#354861" strokeWidth="8" />
    <path d="M88 45V86 M88 57L54 78 M88 57L132 59" fill="none" stroke="#356b9c" strokeWidth="18" strokeLinecap="round" />
    <path className="hero-hand" d="M131 59L179 54" fill="none" stroke="#efc6a6" strokeWidth="13" strokeLinecap="round" />
    <g className="hero-moving-key"><circle cx="188" cy="54" r="8" fill="none" stroke="#d7782e" strokeWidth="5" /><path d="M196 54h31v8h-8v-8" fill="none" stroke="#d7782e" strokeWidth="5" /></g>
    <g className="hero-left-key"><circle cx="188" cy="54" r="8" fill="none" stroke="#b6a085" strokeWidth="5" /><path d="M196 54h31v8h-8v-8" fill="none" stroke="#b6a085" strokeWidth="5" /></g>
  </svg>;
}

export function HeroEvidenceDemo({ active = false }: { active?: boolean }) {
  const playback = useContext(Playback);
  return <div className={`hero-visual hero-story ${active ? 'hero-active' : 'hero-passive'} ${playback.paused ? 'is-paused' : ''}`} role="group" aria-label={active ? '主动观察将范围收缩到放钥匙的短暂时段，放大动作并取得人物 A 放下钥匙的证据。' : '通用描述持续处理长视频，记录场景与人物活动，却漏掉放钥匙动作。'}>
    <div className="hero-question">谁最先把钥匙放在桌上？</div>
    {active ? <>
      <div className="hero-view"><ActionImage /><span className="hero-focus-box" /><span className="hero-evidence-ring" /></div>
      <div className="hero-film-track"><span className="hero-search-beam"/><span className="hero-target"/><span className="hero-window"/></div>
      <div className="hero-stage"><span className="phase-one">扫描长视频</span><span className="phase-two">锁定候选片段</span><span className="phase-three">放大观察动作</span><span className="phase-four">人物 A 放下钥匙 ✓</span></div>
      <button className="hero-pause" type="button" onClick={playback.toggle} aria-label={playback.paused ? '继续首页动画' : '暂停首页动画'}>{playback.paused ? '▶' : 'Ⅱ'}</button>
    </> : <>
      <div className="hero-passive-view"><ActionImage /><div className="hero-captions"><span>人物进入房间</span><span>有人走向桌子</span><span>人物在桌边活动</span></div></div>
      <div className="hero-film-track hero-generic-track"><span className="hero-search-beam"/></div>
      <div className="hero-stage"><span className="phase-one">持续处理整段视频</span><span className="phase-two">Caption 不断累积</span><span className="phase-three">关键动作没有记录</span><span className="phase-four">无法判断是谁放下钥匙 ✕</span></div>
    </>}
  </div>;
}

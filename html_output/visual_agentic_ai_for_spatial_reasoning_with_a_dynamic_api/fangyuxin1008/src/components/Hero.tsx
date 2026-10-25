import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { OpeningAnimation } from '../modules/VividScenes';
export function Hero({meta,hero}:{meta:Meta;hero:HeroConfig}) {
 return <section className="hero"><div className="hero-inner">
  <h1>{meta.titleEn}</h1><div className="hero-sub">{meta.coreInsight}</div>
  <p className="hero-abs">{meta.coreProblem}</p><div className="hero-meta">{meta.keywords?.map(k=><span className="tag" key={k}>{k}</span>)}</div>
  <div className="hero-compare"><div className="bg-side old"><div className="bg-side-head">固定 API</div><div className="bg-side-canvas"><OpeningAnimation dynamic={false}/></div><div className="bg-side-tag" dangerouslySetInnerHTML={{__html:hero.oldMethod.desc}}/></div>
   <div className="bg-side new"><div className="bg-side-head">动态 API</div><div className="bg-side-canvas"><OpeningAnimation dynamic/></div><div className="bg-side-tag" dangerouslySetInnerHTML={{__html:hero.newMethod.desc}}/></div></div>
 </div></section>;
}

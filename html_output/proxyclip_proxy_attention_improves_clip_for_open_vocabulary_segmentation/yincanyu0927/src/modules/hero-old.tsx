import React from 'react';
import { HeroOld } from './labs';
export function WidgetHeroOld(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><HeroOld /></div>;}

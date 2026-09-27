import React from 'react';
import { HeroNew } from './labs';
export function WidgetHeroNew(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><HeroNew /></div>;}

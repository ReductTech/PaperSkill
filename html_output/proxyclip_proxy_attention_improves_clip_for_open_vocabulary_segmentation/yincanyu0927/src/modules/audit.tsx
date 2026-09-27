import React from 'react';
import { Audit } from './labs';
export function WidgetAudit(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Audit /></div>;}

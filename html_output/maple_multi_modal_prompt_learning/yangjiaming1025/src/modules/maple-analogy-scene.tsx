import React from 'react';
import {Lab,Stage,C,book,photo,leaf,box,line} from './maple-kit';
const ease=(x:number)=>x*x*(3-2*x);
function cycle(t:number){if(t===0)return 1;const f=t%6/6;return f<.12?0:f<.55?ease((f-.12)/.43):f<.85?1:1-ease((f-.85)/.15)}
function shadow(c:CanvasRenderingContext2D,blur=15,y=6){c.shadowColor='#743e5526';c.shadowBlur=blur;c.shadowOffsetY=y}
const descriptions=['说明卡与图片对齐','放大镜扫描叶片细节','书签移到另一条目','透明描图尺联动两侧页边','翻页保留之前的观察','新标本卡落入图鉴','铅笔只修改页边注记','透明索引叠上图鉴','页边标注区展开','卡尺同时检验两侧刻度'];
export function MapleAnalogyScene({mode}:{mode:number}){return <Lab><Stage width={560} height={220} label={descriptions[mode-1]} draw={(c,w,h,t)=>{
 const u=cycle(t),bx=107,by=40,bw=346,bh=140;
 c.save();c.globalAlpha=.45;c.beginPath();c.ellipse(280,187,177,13,0,0,7);c.fillStyle='#e5c9d6';c.fill();c.restore();
 book(c,bx,by,bw,bh);leaf(c,194,108,.8);for(let j=0;j<4;j++)line(c,313,68+j*15,421-j*8,68+j*15,j===0?'#d4afc1':'#e9d5df',j===0?4:2);
 c.save();
 if(mode===1){const x=299+u*9,y=127-u*9;c.translate(x+58,y+15);c.rotate((1-u)*-.13);shadow(c);box(c,-58,-15,116,30,'#fff',C.border,5);c.shadowColor='transparent';line(c,-42,0,39,0,C.blue,3);box(c,-49,-6,4,12,C.blue,undefined,1);}
 if(mode===2){const x=180+u*38,y=91+u*12;c.save();c.beginPath();c.arc(x,y,34,0,7);c.clip();c.fillStyle='#fff8fb';c.fill();c.translate(x,y);c.scale(1.45,1.45);c.translate(-x,-y);leaf(c,194,108,.8);c.restore();shadow(c,10,4);line(c,x+25,y+25,x+53,y+54,C.blue,10);c.shadowColor='transparent';line(c,x+26,y+25,x+49,y+49,'#ce96ad',3);c.beginPath();c.arc(x,y,35,0,7);c.strokeStyle=C.blue;c.lineWidth=5;c.stroke();c.beginPath();c.arc(x,y,30,Math.PI*1.05,Math.PI*1.75);c.strokeStyle='#fff';c.lineWidth=2;c.stroke();}
 if(mode===3){const x=240+u*67,y=27+u*11;shadow(c,10,4);const g=c.createLinearGradient(x,y,x+25,y);g.addColorStop(0,'#b76d92');g.addColorStop(.5,'#d6a0ba');g.addColorStop(1,'#aa5f84');c.fillStyle=g;c.beginPath();c.moveTo(x,y);c.lineTo(x+25,y);c.lineTo(x+25,y+72);c.lineTo(x+12.5,y+61);c.lineTo(x,y+72);c.fill();c.shadowColor='transparent';line(c,x+6,y+9,x+6,y+48,'#f8dce780',1);}
 if(mode===4){const y=86+u*41;shadow(c,12,5);box(c,127,y,306,29,'#ecd9e67c','#bd8faa',3);c.shadowColor='transparent';for(let j=0;j<30;j++)line(c,136+j*9.8,y+2,136+j*9.8,y+(j%5===0?13:7),'#ac7894',.9);line(c,139,y+23,420,y+23,'#fff9',1);}
 if(mode===5){const mid=280,edge=mid+167*Math.cos(Math.PI*u),bend=Math.sin(Math.PI*u)*39;shadow(c,17,6);c.beginPath();c.moveTo(mid,48);c.bezierCurveTo(mid+bend,35,edge+bend,37,edge,42);c.bezierCurveTo(edge+bend,77,edge+bend,145,edge,174);c.quadraticCurveTo(mid+bend,164,mid,180);c.closePath();const g=c.createLinearGradient(Math.min(mid,edge)-1,0,Math.max(mid,edge)+1,0);g.addColorStop(0,'#e2cbd8');g.addColorStop(.22,'#fff8fc');g.addColorStop(1,'#fffdfd');c.fillStyle=g;c.fill();c.strokeStyle='#d9bfcc';c.lineWidth=.8;c.stroke();}
 if(mode===6){c.translate(371+u*6,94+(1-u)*-44);c.rotate((1-u)*.22-.04);shadow(c,16,8);photo(c,-48,-52,96,115,1);}
 if(mode===7){const x=316+u*76,y=124;line(c,315,y,x,y,'#ad6489',2);c.translate(x,y);c.rotate(.53);shadow(c,6,3);box(c,-4,-82,9,70,'#c587a5',undefined,2);box(c,-4,-82,9,10,'#ead5e0',undefined,2);line(c,0,-69,0,-15,'#efcbdc',2);c.beginPath();c.moveTo(-4,-12);c.lineTo(5,-12);c.lineTo(.5,1);c.closePath();c.fillStyle='#c9a28f';c.fill();c.beginPath();c.moveTo(-1.2,-3);c.lineTo(2.5,-3);c.lineTo(.5,1);c.fillStyle=C.ink;c.fill();}
 if(mode===8){const y=18+u*34;shadow(c,14,8);box(c,122,y,317,115,'#f7deed45','#ba91a9',5);c.shadowColor='transparent';line(c,280,y+9,280,y+107,'#b58ca7',1);for(let i=0;i<3;i++){box(c,313,y+23+i*23,91-i*12,9,'#bc89a760',undefined,3)}c.beginPath();c.arc(196,y+54,37,0,7);c.strokeStyle='#b58ca7';c.lineWidth=1;c.stroke();line(c,131,y+6,428,y+6,'#fff9',1.5);}
 if(mode===9){const width=27+u*63;shadow(c,12,5);box(c,435,78,width,54,'#f4d5e4','#d1a4bb',4);c.shadowColor='transparent';line(c,444,79,444,129,'#c48fa9',1);for(let j=0;j<5;j++){const xx=452+j*11;if(xx<435+width-8)line(c,xx,88,xx,119,'#cb98b2',1)}line(c,436,83,435+width-4,83,'#fff9',1);}
 if(mode===10){const jaw=403-u*29;shadow(c,9,4);box(c,307,60,120,9,C.blue,undefined,2);box(c,310,60,9,78,C.blue,undefined,2);box(c,jaw,60,9,78,C.blue,undefined,2);box(c,310,133,23,7,C.blue,undefined,2);box(c,jaw-14,133,23,7,C.blue,undefined,2);c.shadowColor='transparent';for(let i=0;i<15;i++)line(c,315+i*7,60,315+i*7,64,'#efd8e3',.8);box(c,jaw-4,48,17,21,'#c391ab',undefined,3);}
 c.restore();
 }}/></Lab>}

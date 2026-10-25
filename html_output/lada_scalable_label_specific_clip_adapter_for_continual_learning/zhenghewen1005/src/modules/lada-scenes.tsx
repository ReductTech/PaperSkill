import { Scene, C, drawAlbum, drawCard, drawLens, roundRect, line, arrow, text } from './lada-kit';

const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
function marker(c:CanvasRenderingContext2D,x:number,y:number,color:string,good:boolean){
  c.beginPath();c.arc(x,y,11,0,Math.PI*2);c.fillStyle=color;c.fill();
  if(good){line(c,x-5,y,x-1,y+4,'white',2);line(c,x-1,y+4,x+6,y-5,'white',2);}
  else{line(c,x-4,y-4,x+4,y+4,'white',2);line(c,x-4,y+4,x+4,y-4,'white',2);}
}

export function LadaAnalogy({chapter}:{chapter:number}) {
  return <Scene height={140} animate label={`自然观察图鉴，第 ${chapter} 章情景示意`} draw={(c,w,h,t)=>{
    const s=Math.min(w/560,1),cx=w/2;
    c.save();c.translate(cx-280*s,(h-140*s)/2);c.scale(s,s);
    const p=ease(((t%2.8)/2.8-.12)/.66),float=Math.sin(t/2.8*Math.PI*2)*3;
    if(chapter===1){
      drawAlbum(c,170,24,220,94);drawCard(c,220,57,33,0,C.blue);drawCard(c,338,57,33,2,C.dark);
      const x=95+220*p;drawCard(c,x,77-25*Math.sin(p*Math.PI),51,0,C.orange,-.10+.18*p);
      if(p>.92)marker(c,345,40,C.red,false);
    }else if(chapter===2){
      drawAlbum(c,192,22,182,99);roundRect(c,300,39,52,16,3,C.light);line(c,310,47,344,47,C.dark,2);
      drawCard(c,92+153*p,66+float*(1-p),57,0,C.blue,(1-p)*-.16);
      if(p>.8)arrow(c,275,52,297,47,C.green,2);
    }else if(chapter===3){
      drawAlbum(c,190,22,188,98);drawCard(c,237,59,38,0,C.blue);
      drawCard(c,433-104*p,59+30*(1-p),38,1,C.green,(1-p)*.15);
      roundRect(c,365,36,22,17,3,C.light);roundRect(c,365,59,22,17,3,C.green);
    }else if(chapter===4){
      drawCard(c,270,69,83,0,C.blue,-.05);drawLens(c,173+99*p,63+float,25+5*p,C.orange);
    }else if(chapter===5){
      drawAlbum(c,180,24,205,94);drawCard(c,230,57,37,0,C.blue);drawCard(c,331,57,37,1,C.green);
      c.fillStyle=C.blue;c.beginPath();c.moveTo(213,18+16*p);c.lineTo(245,18+16*p);c.lineTo(245,68+16*p);c.lineTo(229,58+16*p);c.lineTo(213,68+16*p);c.closePath();c.fill();
    }else if(chapter===6){
      drawAlbum(c,190,22,196,98);drawCard(c,241,58,37,0,C.blue);drawCard(c,340,58,37,2,C.dark);
      drawCard(c,86+155*p,72-18*Math.sin(p*Math.PI),48,0,C.orange);
      if(p>.9)marker(c,265,42,C.green,true);
    }else if(chapter===7){
      drawCard(c,266,70,72,0,C.blue);
      c.save();c.globalAlpha=.62;roundRect(c,146+80*p,25,80,90,3,'#e5eddd',C.dark);c.restore();
      for(let i=0;i<15;i++){const a=i*2.4;c.beginPath();c.arc(266+Math.cos(a)*(10+i%4*7),65+Math.sin(a)*(8+i%5*5),2.5,0,7);c.fillStyle=C.green;c.fill();}
    }else if(chapter===8){
      const width=90+140*p;drawAlbum(c,280-width/2,23,width,96);drawCard(c,280-width*.25,58,34,0,C.blue);
      if(p>.3){c.save();c.globalAlpha=Math.min(1,(p-.3)*2);drawCard(c,280+width*.25,58,34,1,C.green);c.restore();}
    }else if(chapter===9){
      drawAlbum(c,180,24,205,96);drawCard(c,230,58,37,0,C.blue);
      for(let i=0;i<4;i++){roundRect(c,307+i*(6+8*p),31+i*6,25,52,3,i===3?C.green:'#dae5d1',C.dark);}
    }else{
      drawAlbum(c,190,23,196,97);
      for(let i=0;i<3;i++)line(c,213,47+i*16,237+[27,40,51][i],47+i*16,[C.blue,C.orange,C.green][i],7);
      const x=185+130*p;roundRect(c,x,29,26,87,3,'#e3c789',C.brown);
      for(let i=0;i<7;i++)line(c,x+3,36+i*11,x+(i%2?11:16),36+i*11,C.brown,1);
    }
    c.restore();
  }}/>;
}

export function LadaHeroScene({modern}:{modern:boolean}){
  return <Scene height={230} animate label={modern?'标签记忆在统一候选中比较，照片归入猫类':'错误的任务路由将猫照片送入鸟类页'} draw={(c,w,h,t)=>{
    const s=Math.min(w/430,1);c.save();c.translate((w-430*s)/2,(h-230*s)/2);c.scale(s,s);
    const p=ease(((t%2.8)/2.8-.12)/.66);
    drawAlbum(c,168,47,226,135);
    drawCard(c,222,94,51,0,C.blue);drawCard(c,340,94,51,2,C.dark);
    if(modern){roundRect(c,175,51,93,98,8,'#228d5c0c',C.green);arrow(c,91,145,182,138,C.green);}
    else{arrow(c,95,154,335,164,C.red);line(c,168,58,168,147,C.line,3);}
    drawCard(c,68+(modern?153:265)*p,107-22*Math.sin(p*Math.PI),62,0,C.orange,-.14*(1-p));
    if(p>.90)marker(c,modern?251:370,62,modern?C.green:C.red,modern);
    text(c,modern?'标签专属记忆 · 统一比较':'先选任务 · 再做分类',215,207,14,modern?C.green:C.red);
    c.restore();
  }}/>;
}

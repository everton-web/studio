// _px.mjs <json-tarefas> : amostra pixels (moda + cor de primeiro plano) e recorta via canvas (Chrome headless)
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const tasks = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const b = await puppeteer.launch({ executablePath: process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe", headless: "new" });
const p = await b.newPage();
await p.setContent("<html><body></body></html>");
const cache = {};
async function load(f){ if(cache[f]) return; const d="data:image/png;base64,"+fs.readFileSync(f).toString("base64");
  await p.evaluate(async (k,d)=>{ window.imgs=window.imgs||{}; const i=new Image(); i.src=d; await i.decode(); const c=document.createElement("canvas"); c.width=i.width;c.height=i.height; const x=c.getContext("2d"); x.drawImage(i,0,0); window.imgs[k]={c,x,i}; },f,d); cache[f]=1; }
const out = [];
for (const t of tasks) {
  await load(t.f);
  if (t.type === "sample" || t.type === "fg") {
    const r = await p.evaluate((k,box,fg)=>{
      const {x}=window.imgs[k]; const [X,Y,W,H]=box; const d=x.getImageData(X,Y,W,H).data;
      const key=(i)=>((d[i]>>2)<<12)|((d[i+1]>>2)<<6)|(d[i+2]>>2);
      const m=new Map(); for(let i=0;i<d.length;i+=4){ const q=key(i); m.set(q,(m.get(q)||0)+1); }
      let bq=0,best=0; for(const [q,v] of m) if(v>best){best=v;bq=q;}
      const rgb=(q)=>[(q>>12)<<2,((q>>6)&63)<<2,(q&63)<<2];
      const avg=(Q)=>{let s=[0,0,0],n=0; for(let i=0;i<d.length;i+=4){ if(key(i)===Q){s[0]+=d[i];s[1]+=d[i+1];s[2]+=d[i+2];n++;} } return "#"+s.map(v=>Math.round(v/n).toString(16).padStart(2,"0")).join("").toUpperCase()+" ("+Math.round(100*n/(d.length/4))+"%)";};
      if(!fg) return avg(bq);
      const [br,bg,bb]=rgb(bq); let q2=bq,b2=0; for(const [q,v] of m){ const [r,g,bl]=rgb(q); if((r-br)**2+(g-bg)**2+(bl-bb)**2>9000 && v>b2){b2=v;q2=q;} }
      return "moda "+avg(bq)+" | outra "+avg(q2);
    }, t.f, t.box, t.type==="fg");
    out.push(t.name+"  "+r);
  } else if (t.type === "crop") {
    const data = await p.evaluate((k,box,scale)=>{ const {i}=window.imgs[k]; const [X,Y,W,H]=box; const c=document.createElement("canvas"); c.width=Math.round(W*scale); c.height=Math.round(H*scale); const x=c.getContext("2d"); x.imageSmoothingQuality="high"; x.drawImage(i,X,Y,W,H,0,0,c.width,c.height); return c.toDataURL("image/jpeg",0.86).split(",")[1]; }, t.f, t.box, t.scale||1);
    fs.writeFileSync(t.out, Buffer.from(data,"base64")); out.push("crop "+t.out);
  } else if (t.type === "share") {
    const r = await p.evaluate((k,pal)=>{ const {x,c}=window.imgs[k]; const d=x.getImageData(0,0,c.width,c.height).data; const P=pal.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]); const cnt=new Array(P.length).fill(0); let tot=0; for(let i=0;i<d.length;i+=16){ let bi=0,bd=1e9; for(let j=0;j<P.length;j++){ const dd=(d[i]-P[j][0])**2+(d[i+1]-P[j][1])**2+(d[i+2]-P[j][2])**2; if(dd<bd){bd=dd;bi=j;} } cnt[bi]++; tot++; } return cnt.map(v=>+(v/tot).toFixed(4)); }, t.f, t.pal);
    out.push(JSON.stringify({f:t.f.split("/").pop(), r}));
  }
}
console.log(out.join("\n"));
await b.close();

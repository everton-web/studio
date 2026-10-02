// _measure.mjs <json> : mede extensão vertical/horizontal de primeiro plano numa caixa (altura de caixa-alta, etc.)
import puppeteer from "puppeteer-core"; import fs from "node:fs";
const tasks = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const b = await puppeteer.launch({ executablePath: process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe", headless: "new" });
const p = await b.newPage(); await p.setContent("<html></html>"); const out=[]; const cache={};
for (const t of tasks) {
  if(!cache[t.f]){ const d="data:image/png;base64,"+fs.readFileSync(t.f).toString("base64");
    await p.evaluate(async (k,d)=>{ window.I=window.I||{}; const i=new Image(); i.src=d; await i.decode(); const c=document.createElement("canvas"); c.width=i.width;c.height=i.height; c.getContext("2d").drawImage(i,0,0); window.I[k]=c.getContext("2d"); },t.f,d); cache[t.f]=1; }
  const r = await p.evaluate((k,box,thr)=>{ const x=window.I[k]; const [X,Y,W,H]=box; const d=x.getImageData(X,Y,W,H).data; const bg=[d[0],d[1],d[2]]; let top=-1,bot=-1,l=1e9,rr=-1; for(let y=0;y<H;y++) for(let xx=0;xx<W;xx++){ const i=(y*W+xx)*4; const dd=Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2]); if(dd>thr){ if(top<0) top=y; bot=y; if(xx<l) l=xx; if(xx>rr) rr=xx; } } return {top:Y+top,bottom:Y+bot,h:bot-top+1,left:X+l,right:X+rr,w:rr-l+1}; }, t.f, t.box, t.thr||150);
  out.push(t.name+" "+JSON.stringify(r));
}
console.log(out.join("\n")); await b.close();

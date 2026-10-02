// render-alto-png.mjs <html> <png> <largura> : como render-alto, mas costura em Node (sem limite de canvas)
import puppeteer from "puppeteer-core"; import { pathToFileURL } from "node:url"; import fs from "node:fs"; import zlib from "node:zlib";
const [,, html, out, w] = process.argv; const W = +w, SEG = 2000;
const b = await puppeteer.launch({ executablePath: process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--allow-file-access-from-files"] });
const p = await b.newPage(); await p.setViewport({ width: W, height: SEG, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(html).href, { waitUntil: "networkidle0" }); await p.evaluate(() => document.fonts.ready);
const H = await p.evaluate(() => document.documentElement.scrollHeight);
function decode(buf){ let o=8, w,h,ct,idat=[]; while(o<buf.length){ const len=buf.readUInt32BE(o), t=buf.toString("ascii",o+4,o+8), d=buf.subarray(o+8,o+8+len);
  if(t==="IHDR"){w=d.readUInt32BE(0);h=d.readUInt32BE(4);ct=d[9]; if(d[8]!==8||d[12]!==0) throw new Error("png nao suportado");} else if(t==="IDAT") idat.push(d); o+=12+len; }
  const bpp = ct===6?4:ct===2?3:(()=>{throw new Error("ct "+ct)})(); const raw=zlib.inflateSync(Buffer.concat(idat)); const stride=w*bpp; const outB=Buffer.alloc(h*w*3); let prev=Buffer.alloc(stride), cur=Buffer.alloc(stride);
  for(let y=0;y<h;y++){ const f=raw[y*(stride+1)], line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));
    for(let i=0;i<stride;i++){ const a=i>=bpp?cur[i-bpp]:0, up=prev[i], c=i>=bpp?prev[i-bpp]:0; let v=line[i];
      if(f===1)v+=a; else if(f===2)v+=up; else if(f===3)v+=(a+up)>>1; else if(f===4){const pp=a+up-c,pa=Math.abs(pp-a),pb=Math.abs(pp-up),pc=Math.abs(pp-c); v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?up:c);} cur[i]=v&255; }
    for(let x=0;x<w;x++){ outB[(y*w+x)*3]=cur[x*bpp]; outB[(y*w+x)*3+1]=cur[x*bpp+1]; outB[(y*w+x)*3+2]=cur[x*bpp+2]; } [prev,cur]=[cur,prev]; }
  return {w,h,rgb:outB}; }
const crcT=new Int32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c;});
const crc=(buf)=>{let c=-1;for(const x of buf)c=crcT[(c^x)&255]^(c>>>8);return (c^-1)>>>0;};
const chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
const def = zlib.createDeflate({level:6}); const parts=[]; def.on("data",d=>parts.push(d)); const done=new Promise(r=>def.on("end",r));
let totalH=0, WW=0;
for (let y=0;y<H;y+=SEG){ const h=Math.min(SEG,H-y); const png=await p.screenshot({clip:{x:0,y,width:W,height:h},captureBeyondViewport:true});
  const im=decode(Buffer.from(png)); WW=im.w; totalH+=im.h; for(let r=0;r<im.h;r++){ const row=Buffer.alloc(1+im.w*3); im.rgb.copy(row,1,r*im.w*3,(r+1)*im.w*3); if(!def.write(row)) await new Promise(res=>def.once("drain",res)); } }
def.end(); await done; await b.close();
const ih=Buffer.alloc(13); ih.writeUInt32BE(WW,0); ih.writeUInt32BE(totalH,4); ih[8]=8; ih[9]=2;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR",ih), chunk("IDAT",Buffer.concat(parts)), chunk("IEND",Buffer.alloc(0))]));
console.log("ok", WW, "x", totalH, (fs.statSync(out).size/1e6).toFixed(1)+" MB");

import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {cena, TEMPO} from './tempo';

// ---------- design system Complexo SC ----------
const K = {
  marfim: '#F7F2EA',
  areia: '#EDE3D5',
  linho: '#FFFDF9',
  linha: '#E3D7C7',
  tinta: '#2B1B1F',
  tintaSuave: '#6A5558',
  vinho: '#5E1A2E',
  vinhoProfundo: '#2E0D17',
  champanhe: '#B8976A',
  champanheTexto: '#7A5B33',
  champanheClaro: '#D8C29C',
};
const DISPLAY = '"Newsreader", Georgia, serif';
const TEXTO = '"Manrope", system-ui, sans-serif';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

const fontes = delayRender('fontes');
Promise.all([
  loadFont({family: 'Newsreader', url: staticFile('fonts/newsreader-latin-opsz-normal.woff2'), weight: '200 800', style: 'normal'}),
  loadFont({family: 'Newsreader', url: staticFile('fonts/newsreader-latin-opsz-italic.woff2'), weight: '200 800', style: 'italic'}),
  loadFont({family: 'Manrope', url: staticFile('fonts/manrope-latin-wght-normal.woff2'), weight: '200 800'}),
]).then(() => continueRender(fontes));

type O = 'v' | 'h';
type P = {o: O};

const ent = (f: number, ini: number, dur: number) => interpolate(f, [ini, ini + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});

// ---------- peças ----------
const Eyebrow: React.FC<{children: React.ReactNode; cor?: string; f: number; ini?: number; size: number; style?: React.CSSProperties}> = ({children, cor = K.champanheTexto, f, ini = 0, size, style}) => {
  const p = ent(f, ini, 18);
  return (
    <div style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: size * 0.8, fontFamily: TEXTO, fontWeight: 600, fontSize: size, letterSpacing: '0.2em', textTransform: 'uppercase', color: cor, opacity: p, transform: `translateY(${(1 - p) * 10}px)`, ...style}}>
      <span style={{width: size * 2.2 * p, height: 1.5, background: cor, display: 'block'}} />
      <span>{children}</span>
    </div>
  );
};

// linha de texto que sobe por trás de uma máscara
const Sobe: React.FC<{f: number; ini: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({f, ini, dur = 22, children, style}) => {
  const p = ent(f, ini, dur);
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 105}%)`, opacity: interpolate(p, [0, 0.3, 1], [0, 1, 1])}}>{children}</div>
    </div>
  );
};

const Foto: React.FC<{src: string; f: number; dur: number; de?: [number, number, number]; para?: [number, number, number]; pos?: string; px?: [number, number]; style?: React.CSSProperties}> = ({src, f, dur, de = [1.06, 0, 0], para = [1, 0, 0], pos = 'center', px, style}) => {
  const p = interpolate(f, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.4, 1)});
  const s = de[0] + (para[0] - de[0]) * p;
  const x = de[1] + (para[1] - de[1]) * p;
  const y = de[2] + (para[2] - de[2]) * p;
  return <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: px ? `${px[0] + (px[1] - px[0]) * p}% ${pos.split(' ')[1] ?? '50%'}` : pos, transform: `translate(${x}%, ${y}%) scale(${s})`, ...style}} />;
};

// degradê de queda longa para legenda sobre foto
const Queda: React.FC<{alto?: number; cor?: string; lado?: 'baixo' | 'esquerda'}> = ({alto = 0.55, cor = '46,13,23', lado = 'baixo'}) => {
  const dir = lado === 'baixo' ? 'to top' : 'to right';
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${dir}, rgba(${cor},0.86) 0%, rgba(${cor},0.62) ${alto * 35}%, rgba(${cor},0.28) ${alto * 70}%, rgba(${cor},0.08) ${alto * 90}%, rgba(${cor},0) ${alto * 100}%)`,
      }}
    />
  );
};

// ---------- cena 1: lema e monograma ----------
const Abertura: React.FC<P & {dur: number}> = ({o}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  const desenho = ent(f, 4, 44);
  const graus = desenho * 380;
  const mono = v ? 320 : 330;
  const arco = ent(f, 0, 70);
  const tam = v ? 150 : 140;
  return (
    <AbsoluteFill style={{background: K.marfim}}>
      <Eyebrow f={f} ini={2} size={v ? 26 : 22} style={{left: v ? 84 : 120, top: v ? 120 : 96}}>Fortaleza · Aldeota</Eyebrow>
      <div style={{position: 'absolute', right: v ? 84 : 120, top: v ? 120 : 96, fontFamily: TEXTO, fontSize: v ? 22 : 19, letterSpacing: '0.2em', color: K.tintaSuave, opacity: ent(f, 10, 20), textAlign: 'right', lineHeight: 1.6, textTransform: 'uppercase'}}>
        Medicina · Estética
        <br />
        Educação
      </div>
      {/* arco fino em champanhe, só detalhe */}
      <svg width={v ? 1080 : 1920} height={v ? 1920 : 1080} style={{position: 'absolute', inset: 0}}>
        <circle
          cx={v ? 540 : 1460}
          cy={v ? 700 : 540}
          r={v ? 320 : 300}
          fill="none"
          stroke={K.champanhe}
          strokeWidth={1.5}
          strokeDasharray={2 * Math.PI * (v ? 320 : 300)}
          strokeDashoffset={2 * Math.PI * (v ? 320 : 300) * (1 - arco)}
          transform={`rotate(-90 ${v ? 540 : 1460} ${v ? 700 : 540})`}
          opacity={0.7}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: (v ? 540 : 1460) - mono / 2,
          top: (v ? 700 : 540) - (mono * 379) / 352 / 2,
          width: mono,
          height: (mono * 379) / 352,
          WebkitMaskImage: `conic-gradient(from 200deg, #000 0deg, #000 ${graus - 30}deg, transparent ${graus}deg)`,
          maskImage: `conic-gradient(from 200deg, #000 0deg, #000 ${graus - 30}deg, transparent ${graus}deg)`,
          transform: `scale(${0.94 + 0.06 * desenho})`,
        }}
      >
        <Img src={staticFile('img/mono-vinho.png')} style={{width: '100%', height: '100%'}} />
      </div>
      <div style={{position: 'absolute', left: v ? 84 : 120, bottom: v ? 210 : 250, fontFamily: DISPLAY, fontWeight: 300, fontSize: tam, lineHeight: 1.0, letterSpacing: '-0.02em', color: K.tinta}}>
        <Sobe f={f} ini={16}>Alcance o</Sobe>
        <Sobe f={f} ini={22}>extraordinário</Sobe>
        <Sobe f={f} ini={28}>
          <span style={{fontStyle: 'italic', color: K.vinho}}>em si.</span>
        </Sobe>
      </div>
    </AbsoluteFill>
  );
};

// ---------- cena 2: frase em vinho chapado ----------
const MenosDuvida: React.FC<P> = ({o}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  return (
    <AbsoluteFill style={{background: K.vinho}}>
      <Eyebrow f={f} ini={0} cor={K.champanheClaro} size={v ? 26 : 22} style={{left: v ? 84 : 120, top: v ? 120 : 96}}>Complexo SC</Eyebrow>
      <div style={{position: 'absolute', left: v ? 84 : 120, top: v ? 640 : 330, fontFamily: DISPLAY, fontWeight: 300, fontSize: v ? 210 : 230, lineHeight: 0.98, letterSpacing: '-0.025em', color: K.marfim}}>
        <Sobe f={f} ini={0} dur={20}>Menos</Sobe>
        <Sobe f={f} ini={5} dur={20}>
          <span style={{fontStyle: 'italic'}}>dúvida.</span>
        </Sobe>
      </div>
    </AbsoluteFill>
  );
};

// ---------- cena 3 e 4: foto em tela cheia com legenda ----------
const FotoLegenda: React.FC<P & {dur: number; src: string; eyebrow: string; linhas: string[]; pan?: [number, number]; kb: {v: [[number, number, number], [number, number, number], string]; h: [[number, number, number], [number, number, number], string]}}> = ({o, dur, src, eyebrow, linhas, pan, kb}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  const [de, para, pos] = v ? kb.v : kb.h;
  return (
    <AbsoluteFill style={{background: K.vinhoProfundo, overflow: 'hidden'}}>
      <Foto src={src} f={f} dur={dur} de={de} para={para} pos={pos} px={v ? pan : undefined} />
      <Queda alto={v ? 0.5 : 0.6} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(46,13,23,0.35), rgba(46,13,23,0) 18%)'}} />
      <Eyebrow f={f} ini={4} cor={K.champanheClaro} size={v ? 26 : 22} style={{left: v ? 84 : 120, top: v ? 120 : 96}}>
        {eyebrow}
      </Eyebrow>
      <div style={{position: 'absolute', left: v ? 84 : 120, bottom: v ? 230 : 120, fontFamily: DISPLAY, fontWeight: 350, fontSize: v ? 96 : 96, lineHeight: 1.04, letterSpacing: '-0.015em', color: K.marfim}}>
        {linhas.map((l, i) => (
          <Sobe key={i} f={f} ini={8 + i * 5}>
            {l}
          </Sobe>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// cena 4 no horizontal: foto vertical à direita, texto em marfim à esquerda
const FlorDividida: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const abre = ent(f, 0, 24);
  return (
    <AbsoluteFill style={{background: K.marfim}}>
      <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 960 * (0.92 + 0.08 * abre), overflow: 'hidden'}}>
        <Foto src="img/flores.jpg" f={f} dur={dur} de={[1.1, 0, 2]} para={[1.02, 0, 0]} pos="50% 30%" />
      </div>
      <Eyebrow f={f} ini={4} size={22} style={{left: 120, top: 96}}>
        Pós-operatório
      </Eyebrow>
      <div style={{position: 'absolute', left: 120, top: 380, width: 760, fontFamily: DISPLAY, fontWeight: 300, fontSize: 104, lineHeight: 1.02, letterSpacing: '-0.02em', color: K.tinta}}>
        <Sobe f={f} ini={6}>O cuidado não</Sobe>
        <Sobe f={f} ini={11}>termina na</Sobe>
        <Sobe f={f} ini={16}>
          <span style={{fontStyle: 'italic', color: K.vinho}}>cirurgia.</span>
        </Sobe>
      </div>
    </AbsoluteFill>
  );
};

// ---------- cena 5: contador ----------
const Numero: React.FC<{f: number; ini: number; ate: number; dur: number; size: number}> = ({f, ini, ate, dur, size}) => {
  const p = ent(f, ini, dur);
  const n = Math.round(ate * p);
  const vel = interpolate(f, [ini, ini + dur * 0.55, ini + dur], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <span style={{display: 'inline-block', fontVariantNumeric: 'lining-nums tabular-nums', filter: `blur(${vel * size * 0.03}px)`, opacity: interpolate(f, [ini, ini + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
      {String(n).padStart(2, '0')}
    </span>
  );
};

const Contador: React.FC<P> = ({o}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  const big = v ? 400 : 330;
  const bloco = (ini: number, numero: React.ReactNode, sufixo: React.ReactNode, legenda: string) => (
    <div>
      <div style={{fontFamily: DISPLAY, fontWeight: 300, fontSize: big, lineHeight: 0.9, letterSpacing: '-0.04em', color: K.vinho, display: 'flex', alignItems: 'baseline', gap: big * 0.06, whiteSpace: 'nowrap'}}>
        {numero}
        <span style={{fontStyle: 'italic', fontSize: big * 0.34, letterSpacing: '-0.01em', opacity: ent(f, ini + 14, 14)}}>{sufixo}</span>
      </div>
      <div style={{marginTop: v ? 28 : 22, fontFamily: TEXTO, fontWeight: 500, fontSize: v ? 46 : 36, color: K.tintaSuave, opacity: ent(f, ini + 18, 16), transform: `translateY(${(1 - ent(f, ini + 18, 16)) * 12}px)`}}>{legenda}</div>
    </div>
  );
  const linha = ent(f, 40, 24);
  return (
    <AbsoluteFill style={{background: K.linho}}>
      <Eyebrow f={f} ini={0} size={v ? 26 : 22} style={{left: v ? 84 : 120, top: v ? 120 : 96}}>
        Complexo SC em números
      </Eyebrow>
      {v ? (
        <div style={{position: 'absolute', left: 84, right: 84, top: 470}}>
          {bloco(4, <Numero f={f} ini={4} ate={17} dur={34} size={big} />, 'anos', 'cuidando das pessoas')}
          <div style={{height: 1.5, background: K.linha, margin: '110px 0 100px', width: `${linha * 100}%`}} />
          {bloco(
            46,
            <span style={{display: 'flex', alignItems: 'baseline', gap: big * 0.05}}>
              <span style={{fontSize: big * 0.34, fontStyle: 'italic', wordSpacing: '0.12em', opacity: ent(f, 46, 10)}}>+ de</span>
              <Numero f={f} ini={46} ate={20} dur={34} size={big} />
            </span>,
            'mil',
            'autoestimas renovadas',
          )}
        </div>
      ) : (
        <div style={{position: 'absolute', left: 120, right: 120, top: 350, display: 'flex', alignItems: 'flex-start'}}>
          <div style={{flex: 1}}>{bloco(4, <Numero f={f} ini={4} ate={17} dur={34} size={big} />, 'anos', 'cuidando das pessoas')}</div>
          <div style={{width: 1.5, background: K.linha, alignSelf: 'stretch', margin: '0 90px', transform: `scaleY(${linha})`, transformOrigin: 'top'}} />
          <div style={{flex: 1.25}}>
            {bloco(
              40,
              <span style={{display: 'flex', alignItems: 'baseline', gap: big * 0.05}}>
                <span style={{fontSize: big * 0.34, fontStyle: 'italic', wordSpacing: '0.12em', opacity: ent(f, 40, 10)}}>+ de</span>
                <Numero f={f} ini={40} ate={20} dur={34} size={big} />
              </span>,
              'mil',
              'autoestimas renovadas',
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- cena 6: cirurgia de mama em 4 passos ----------
const PASSOS = [
  {t: ['Consulta e', 'expectativa alinhada'], img: 'img/consulta.jpg', pos: '50% 40%'},
  {t: ['Planejamento', 'da proporção'], img: 'img/planejamento.jpg', pos: '40% 50%'},
  {t: ['Centro cirúrgico', 'próprio'], img: 'img/fachada.jpg', pos: '50% 35%'},
  {t: ['Pós-operatório', 'acompanhado'], img: 'img/apartamento.jpg', pos: '42% 50%'},
];
const PASSO = 1.5 * TEMPO; // um passo a cada tempo e meio, no mesmo ponto das notas da trilha

const Passos: React.FC<P> = ({o}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  const atual = Math.min(3, Math.floor(f / PASSO));
  const W = v ? 760 : 620;
  const H = v ? 900 : 820;
  const entra = ent(f, 0, 20);
  const fotos = PASSOS.map((p, i) => {
    const ini = i * PASSO;
    const c = i === 0 ? 1 : ent(f, ini - 2, 16); // cortina de baixo para cima
    if (f < ini - 2) return null;
    const z = interpolate(f, [ini, ini + PASSO + 20], [1.12, 1.02], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
    return (
      <div key={i} style={{position: 'absolute', inset: 0, clipPath: `inset(${(1 - c) * 100}% 0 0 0)`}}>
        <Img src={staticFile(p.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.pos, transform: `scale(${z})`}} />
      </div>
    );
  });
  const moldura = (
    <div
      style={{
        position: 'absolute',
        width: W,
        height: H,
        borderRadius: `${W / 2}px ${W / 2}px 18px 18px`,
        overflow: 'hidden',
        background: K.areia,
        boxShadow: '0 2px 4px rgba(43,27,31,.06), 0 24px 48px -24px rgba(43,27,31,.30)',
        ...(v ? {left: (1080 - W) / 2, top: 250} : {right: 160, top: (1080 - H) / 2 + 20}),
        transform: `translateY(${(1 - entra) * 40}px)`,
        opacity: entra,
      }}
    >
      {fotos}
    </div>
  );
  const titulo = PASSOS[atual].t;
  const fl = f - atual * PASSO;
  const barras = (
    <div style={{display: 'flex', gap: 10, marginTop: v ? 44 : 50}}>
      {PASSOS.map((_, i) => (
        <div key={i} style={{width: v ? 70 : 64, height: 3, background: K.linha, overflow: 'hidden'}}>
          <div style={{height: '100%', background: K.vinho, width: `${i < atual ? 100 : i === atual ? ent(fl, 0, PASSO) * 100 : 0}%`}} />
        </div>
      ))}
    </div>
  );
  const texto = (
    <div style={{position: 'absolute', ...(v ? {left: 84, right: 84, top: 1220} : {left: 120, top: 330, width: 900})}}>
      <div style={{fontFamily: TEXTO, fontWeight: 600, fontSize: v ? 28 : 24, letterSpacing: '0.18em', color: K.champanheTexto}}>
        <span style={{color: K.vinho}}>{String(atual + 1).padStart(2, '0')}</span> / 04
      </div>
      <div key={atual} style={{marginTop: v ? 26 : 30, fontFamily: DISPLAY, fontWeight: 330, fontSize: v ? 104 : 110, lineHeight: 1.02, letterSpacing: '-0.02em', color: K.tinta}}>
        <Sobe f={fl} ini={atual === 0 ? 6 : 0} dur={16}>
          {titulo[0]}
        </Sobe>
        <Sobe f={fl} ini={atual === 0 ? 10 : 4} dur={16}>
          <span style={{fontStyle: 'italic', color: K.vinho}}>{titulo[1]}</span>
        </Sobe>
      </div>
      {barras}
    </div>
  );
  return (
    <AbsoluteFill style={{background: K.marfim}}>
      <Eyebrow f={f} ini={0} size={v ? 26 : 22} style={{left: v ? 84 : 120, top: v ? 120 : 96}}>
        Cirurgia de mama · 4 passos
      </Eyebrow>
      {moldura}
      {texto}
    </AbsoluteFill>
  );
};

// ---------- cena 7: manifesto palavra por palavra ----------
const MANIFESTO: Record<O, string[]> = {
  v: ['Antes de qualquer', 'tratamento, existe uma', 'história que merece', 'ser ouvida. Cuidar é', 'ouvir, avaliar, orientar', 'e, quando preciso,', '*saber dizer não.*'],
  h: ['Antes de qualquer tratamento, existe', 'uma história que merece ser ouvida.', 'Cuidar é ouvir, avaliar, orientar e,', 'quando preciso, *saber dizer não.*'],
};
const Manifesto: React.FC<P & {dur: number}> = ({o, dur}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  // marca o trecho em itálico e numera as palavras
  let enfase = false;
  const linhas = MANIFESTO[o].map(l =>
    l.split(' ').map(w => {
      let w2 = w;
      if (w2.startsWith('*')) { enfase = true; w2 = w2.slice(1); }
      const fim = w2.endsWith('*');
      if (fim) w2 = w2.slice(0, -1);
      const item = {w: w2, enfase};
      if (fim) enfase = false;
      return item;
    }),
  );
  const total = linhas.flat().length;
  const ini = 4, fimRev = dur - 46;
  let k = 0;
  return (
    <AbsoluteFill style={{background: K.marfim}}>
      <Eyebrow f={f} ini={0} size={v ? 26 : 22} style={{left: v ? 84 : 120, top: v ? 120 : 96}}>
        Manifesto
      </Eyebrow>
      <div style={{position: 'absolute', left: v ? 84 : 120, ...(v ? {top: 600} : {top: 290}), fontFamily: DISPLAY, fontWeight: 340, fontSize: v ? 86 : 88, lineHeight: 1.2, letterSpacing: '-0.012em', color: K.tinta}}>
        {linhas.map((l, i) => (
          <div key={i} style={{whiteSpace: 'nowrap'}}>
            {l.map((p, j) => {
              const idx = k++;
              const t0 = ini + (idx / total) * (fimRev - ini);
              const a = ent(f, t0, 10);
              return (
                <span key={j} style={{opacity: 0.16 + 0.84 * a, color: p.enfase ? K.vinho : K.tinta, fontStyle: p.enfase ? 'italic' : 'normal'}}>
                  {p.w}
                  {j < l.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- cena 8: faixa diagonal ----------
const PROC = ['Prótese de mama', 'Mastopexia', 'Lipo HD', 'Abdominoplastia', 'Método RPP'];
const Faixa: React.FC<P> = ({o}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  const size = v ? 120 : 112;
  const linhas = v ? 11 : 8;
  return (
    <AbsoluteFill style={{background: K.vinhoProfundo, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: v ? 2600 : 3200, transform: 'translate(-50%, -50%) rotate(-9deg)'}}>
        {Array.from({length: linhas}).map((_, i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          const desloc = ((i * 397) % 900) + 200;
          const x = -desloc + dir * f * (v ? 7 : 8);
          const seq = [...PROC, ...PROC, ...PROC, ...PROC].slice(i % 5, (i % 5) + 14);
          return (
            <div key={i} style={{whiteSpace: 'nowrap', transform: `translateX(${x}px)`, fontFamily: DISPLAY, fontWeight: 330, fontSize: size, lineHeight: 1.32, letterSpacing: '-0.015em'}}>
              {seq.map((w, j) => (
                <span key={j} style={{color: (i + j) % 2 === 0 ? K.marfim : 'rgba(247,242,234,0.34)', fontStyle: (i + j) % 3 === 0 ? 'italic' : 'normal'}}>
                  {w}
                  <span style={{color: K.champanhe, margin: `0 ${size * 0.32}px`, fontStyle: 'normal'}}>·</span>
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: v ? 84 : 120, bottom: v ? 120 : 90, padding: v ? '16px 28px' : '14px 26px', borderRadius: 999, background: K.vinhoProfundo, boxShadow: `0 0 0 14px ${K.vinhoProfundo}`, border: `1px solid rgba(216,194,156,0.35)`, fontFamily: TEXTO, fontWeight: 600, fontSize: v ? 22 : 19, letterSpacing: '0.2em', textTransform: 'uppercase', color: K.champanheClaro, opacity: ent(f, 6, 16)}}>
        Procedimentos
      </div>
    </AbsoluteFill>
  );
};

// ---------- cena 9: o site novo ----------
const Site: React.FC<P & {dur: number}> = ({o, dur}) => {
  const f = useCurrentFrame();
  const v = o === 'v';
  const sobe = ent(f, 0, 22);
  const rola = interpolate(f, [22, dur - 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.25, 1)});
  const assina = ent(f, dur - 34, 18);
  const sai = interpolate(f, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (v) {
    const SW = 560, SH = Math.round((SW * 844) / 390); // tela do celular
    const imgH = Math.round((SW * 5064) / 390);
    const desce = rola * SH * 1.15;
    return (
      <AbsoluteFill style={{background: K.vinho, opacity: sai}}>
        <div style={{position: 'absolute', left: 84, right: 84, top: 120, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 330, fontSize: 84, lineHeight: 1.05, letterSpacing: '-0.015em', color: K.marfim}}>
          <Sobe f={f} ini={2}>O novo site do</Sobe>
          <Sobe f={f} ini={6}>
            <span style={{fontStyle: 'italic'}}>Complexo SC</span>
          </Sobe>
        </div>
        <div style={{position: 'absolute', left: (1080 - SW - 36) / 2, top: 380, width: SW + 36, height: SH + 36, borderRadius: 86, background: '#1A0D11', padding: 18, boxSizing: 'border-box', boxShadow: '0 40px 80px -30px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(216,194,156,0.25)', transform: `translateY(${(1 - sobe) * 120}px)`, opacity: sobe}}>
          <div style={{width: SW, height: SH, borderRadius: 68, overflow: 'hidden', position: 'relative', background: K.marfim}}>
            <Img src={staticFile('site/celular-longa.png')} style={{position: 'absolute', left: 0, top: -desce, width: SW, height: imgH}} />
            <div style={{position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 150, height: 40, borderRadius: 20, background: '#0E0709'}} />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 74, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, opacity: assina, transform: `translateY(${(1 - assina) * 14}px)`}}>
          <Img src={staticFile('img/mono-marfim.png')} style={{width: 58, height: (58 * 379) / 352}} />
          <span style={{width: 1.5, height: 48, background: 'rgba(216,194,156,0.5)'}} />
          <span style={{fontFamily: TEXTO, fontWeight: 600, fontSize: 22, letterSpacing: '0.2em', textTransform: 'uppercase', color: K.champanheClaro}}>Proposta Marca Digital</span>
        </div>
      </AbsoluteFill>
    );
  }
  const BW = 1100, BH = Math.round((BW * 900) / 1440);
  const imgH = Math.round((BW * 5400) / 1440);
  const desce = rola * BH * 0.95;
  return (
    <AbsoluteFill style={{background: K.vinho, opacity: sai}}>
      <div style={{position: 'absolute', left: 110, top: 330, width: 600, fontFamily: DISPLAY, fontWeight: 330, fontSize: 80, lineHeight: 1.05, letterSpacing: '-0.015em', color: K.marfim, whiteSpace: 'nowrap'}}>
        <Sobe f={f} ini={2}>O novo site do</Sobe>
        <Sobe f={f} ini={6}>
          <span style={{fontStyle: 'italic'}}>Complexo SC</span>
        </Sobe>
      </div>
      <div style={{position: 'absolute', left: 110, bottom: 120, display: 'flex', alignItems: 'center', gap: 22, opacity: assina, transform: `translateY(${(1 - assina) * 14}px)`}}>
        <Img src={staticFile('img/mono-marfim.png')} style={{width: 62, height: (62 * 379) / 352}} />
        <span style={{width: 1.5, height: 50, background: 'rgba(216,194,156,0.5)'}} />
        <span style={{fontFamily: TEXTO, fontWeight: 600, fontSize: 20, letterSpacing: '0.2em', textTransform: 'uppercase', color: K.champanheClaro}}>Proposta Marca Digital</span>
      </div>
      <div style={{position: 'absolute', right: 90, top: (1080 - BH - 44) / 2, width: BW, borderRadius: 16, overflow: 'hidden', background: '#1A0D11', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.6), inset 0 0 0 1.5px rgba(216,194,156,0.25)', transform: `translateY(${(1 - sobe) * 80}px)`, opacity: sobe}}>
        <div style={{height: 44, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 9}}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{width: 12, height: 12, borderRadius: 6, background: 'rgba(247,242,234,0.22)'}} />
          ))}
          <span style={{marginLeft: 22, flex: 1, maxWidth: 520, height: 26, borderRadius: 13, background: 'rgba(247,242,234,0.08)', fontFamily: TEXTO, fontSize: 14, letterSpacing: '0.04em', color: 'rgba(247,242,234,0.6)', display: 'flex', alignItems: 'center', paddingLeft: 16}}>proposta-csc-7k2q.vercel.app</span>
        </div>
        <div style={{width: BW, height: BH, overflow: 'hidden', position: 'relative', background: K.marfim}}>
          <Img src={staticFile('site/desktop-longa.png')} style={{position: 'absolute', left: 0, top: -desce, width: BW, height: imgH}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- montagem ----------
export const Video: React.FC<P> = ({o}) => {
  const {width} = useVideoConfig();
  void width;
  const S = (i: number, el: (dur: number) => React.ReactNode) => {
    const {from, dur} = cena(i);
    return (
      <Sequence from={from} durationInFrames={dur} key={i}>
        {el(dur)}
      </Sequence>
    );
  };
  return (
    <AbsoluteFill style={{background: K.marfim, WebkitFontSmoothing: 'antialiased'}}>
      {S(0, d => <Abertura o={o} dur={d} />)}
      {S(1, () => <MenosDuvida o={o} />)}
      {S(2, d => (
        <FotoLegenda
          o={o}
          dur={d}
          src="img/equipe.jpg"
          eyebrow="Equipe"
          linhas={['Uma equipe que', 'acompanha cada etapa.']}
          pan={[34, 70]}
          kb={{v: [[1.02, 0, 0], [1.0, 0, 0], '50% 40%'], h: [[1.08, 0, 1], [1.0, 0, 0], '50% 40%']}}
        />
      ))}
      {S(3, d =>
        o === 'v' ? (
          <FotoLegenda o={o} dur={d} src="img/flores.jpg" eyebrow="Pós-operatório" linhas={['O cuidado não termina', 'na cirurgia.']} kb={{v: [[1.1, 0, 2], [1.02, 0, 0], '50% 30%'], h: [[1, 0, 0], [1, 0, 0], 'center']}} />
        ) : (
          <FlorDividida dur={d} />
        ),
      )}
      {S(4, () => <Contador o={o} />)}
      {S(5, () => <Passos o={o} />)}
      {S(6, d => <Manifesto o={o} dur={d} />)}
      {S(7, () => <Faixa o={o} />)}
      {S(8, d => <Site o={o} dur={d} />)}
      <Audio src={staticFile('trilha.wav')} />
    </AbsoluteFill>
  );
};

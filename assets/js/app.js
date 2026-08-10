/* ==========================================================================
   Dossier · Mario Guido — app.js
   Motor de ajedrez + tableros + datos en vivo + UI (tema, buscador,
   sidebar, back-to-top, animaciones). Se carga con `defer`.
   NOTA: el motor de ajedrez, el array GAMES y los análisis NO se modifican.
   ========================================================================== */

/* ============ CHESS SAN REPLAY ENGINE ============ */
function startBoard(){const b=Array.from({length:8},()=>Array(8).fill(null));const back=['r','n','b','q','k','b','n','r'];for(let c=0;c<8;c++){b[0][c]=back[c];b[1][c]='p';b[6][c]='P';b[7][c]=back[c].toUpperCase();}return b;}
const isW=p=>p&&p===p.toUpperCase();const colorOf=p=>p?(isW(p)?'w':'b'):null;const inb=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const cloneB=b=>b.map(r=>r.slice());
function isAttacked(b,r,c,by){const pdir=by==='w'?1:-1;for(const dc of[-1,1]){const pr=r+pdir,pc=c+dc;if(inb(pr,pc)){const p=b[pr][pc];if(p&&colorOf(p)===by&&p.toLowerCase()==='p')return true;}}
const kn=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];for(const[dr,dc]of kn){const rr=r+dr,cc=c+dc;if(inb(rr,cc)){const p=b[rr][cc];if(p&&colorOf(p)===by&&p.toLowerCase()==='n')return true;}}
for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(inb(rr,cc)){const p=b[rr][cc];if(p&&colorOf(p)===by&&p.toLowerCase()==='k')return true;}}
const diag=[[-1,-1],[-1,1],[1,-1],[1,1]],orth=[[-1,0],[1,0],[0,-1],[0,1]];
for(const[dr,dc]of diag){let rr=r+dr,cc=c+dc;while(inb(rr,cc)){const p=b[rr][cc];if(p){if(colorOf(p)===by&&(p.toLowerCase()==='b'||p.toLowerCase()==='q'))return true;break;}rr+=dr;cc+=dc;}}
for(const[dr,dc]of orth){let rr=r+dr,cc=c+dc;while(inb(rr,cc)){const p=b[rr][cc];if(p){if(colorOf(p)===by&&(p.toLowerCase()==='r'||p.toLowerCase()==='q'))return true;break;}rr+=dr;cc+=dc;}}
return false;}
function kingPos(b,color){for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p&&p.toLowerCase()==='k'&&colorOf(p)===color)return[r,c];}return null;}
function sq(f,rk){return[8-parseInt(rk),f.charCodeAt(0)-97];}
function clearPath(b,r,c,tr,tc){const dr=Math.sign(tr-r),dc=Math.sign(tc-c);let rr=r+dr,cc=c+dc;while(rr!==tr||cc!==tc){if(b[rr][cc]!==null)return false;rr+=dr;cc+=dc;}return true;}
function canReach(b,t,r,c,tr,tc){const dr=tr-r,dc=tc-c;if(t==='N')return(Math.abs(dr)===1&&Math.abs(dc)===2)||(Math.abs(dr)===2&&Math.abs(dc)===1);if(t==='K')return Math.abs(dr)<=1&&Math.abs(dc)<=1;if(t==='B'){if(Math.abs(dr)!==Math.abs(dc))return false;return clearPath(b,r,c,tr,tc);}if(t==='R'){if(dr!==0&&dc!==0)return false;return clearPath(b,r,c,tr,tc);}if(t==='Q'){if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)))return false;return clearPath(b,r,c,tr,tc);}return false;}
function findSource(b,color,type,tr,tc,ff,fr,cap){const cands=[];const want=color==='w'?type.toUpperCase():type.toLowerCase();
if(type==='P'){const dir=color==='w'?1:-1;if(cap){const sr=tr+dir;for(const sc of[tc-1,tc+1])if(inb(sr,sc)&&b[sr][sc]===want)cands.push([sr,sc]);}else{const s1=tr+dir;if(inb(s1,tc)&&b[s1][tc]===want)cands.push([s1,tc]);else{const s2=tr+2*dir;const st=color==='w'?6:1;if(inb(s2,tc)&&b[s2][tc]===want&&b[s1][tc]===null&&s2===st)cands.push([s2,tc]);}}}
else{for(let r=0;r<8;r++)for(let c=0;c<8;c++){if(b[r][c]!==want)continue;if(canReach(b,type,r,c,tr,tc))cands.push([r,c]);}}
let f=cands.filter(([r,c])=>(ff==null||c===ff)&&(fr==null||r===fr));
if(f.length>1)f=f.filter(([r,c])=>{const nb=cloneB(b);nb[tr][tc]=nb[r][c];nb[r][c]=null;const kp=kingPos(nb,color);if(!kp)return true;return!isAttacked(nb,kp[0],kp[1],color==='w'?'b':'w');});
return f[0];}
function applySAN(b,san,color){san=san.replace(/[+#!?]/g,'').trim();
if(san==='O-O'||san==='0-0'){const r=color==='w'?7:0;b[r][6]=b[r][4];b[r][4]=null;b[r][5]=b[r][7];b[r][7]=null;return;}
if(san==='O-O-O'||san==='0-0-0'){const r=color==='w'?7:0;b[r][2]=b[r][4];b[r][4]=null;b[r][3]=b[r][0];b[r][0]=null;return;}
let promo=null;const pm=san.match(/=([QRBN])$/);if(pm){promo=pm[1];san=san.replace(/=([QRBN])$/,'');}
const cap=san.includes('x');san=san.replace('x','');const target=san.slice(-2);const[tr,tc]=sq(target[0],target[1]);
let rest=san.slice(0,-2);let type='P';if(/^[NBRQK]/.test(rest)){type=rest[0];rest=rest.slice(1);}
let ff=null,fr=null;for(const ch of rest){if(/[a-h]/.test(ch))ff=ch.charCodeAt(0)-97;else if(/[1-8]/.test(ch))fr=8-parseInt(ch);}
const src=findSource(b,color,type,tr,tc,ff,fr,cap);if(!src)throw new Error('no src '+san);
if(type==='P'&&cap&&b[tr][tc]===null){const dir=color==='w'?1:-1;b[tr+dir][tc]=null;}
let piece=b[src[0]][src[1]];if(promo)piece=color==='w'?promo:promo.toLowerCase();
b[tr][tc]=piece;b[src[0]][src[1]]=null;}
function parseMoves(pgn){return pgn.replace(/\{[^}]*\}/g,' ').replace(/\d+\.(\.\.)?/g,' ').replace(/(1-0|0-1|1\/2-1\/2|\*)/g,' ').trim().split(/\s+/).filter(Boolean);}
function replay(pgn){const moves=parseMoves(pgn);let b=startBoard(),color='w';const frames=[cloneB(b)];for(const m of moves){try{applySAN(b,m,color);}catch(e){break;}frames.push(cloneB(b));color=color==='w'?'b':'w';}return{frames,moves};}

/* ============ GAME DATA (sin cambios) ============ */
const GLYPH={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const GAMES=[
 {id:'120597036891',title:'Su mejor ataque — sacrificio en f7',meta:'Italiana C50 · TERRORRR (1813) vs 1854',hero:'w',res:'Gana Mario',rc:'win',url:'https://www.chess.com/game/live/120597036891',
  pgn:'1. e4 e5 2. Bc4 Nc6 3. Nf3 Nd4 4. Bxf7+ Kxf7 5. Nxe5+ Ke7 6. c3 Ne6 7. d4 d6 8. Nd3 h6 9. O-O Nf6 10. f4 g6 11. e5 Nh5 12. Qg4 Nexf4 13. Qf3 Nxd3 14. Qf7# 1-0',
  notes:{6:'3…Cd4?! descuida f7 — y Mario golpea al instante.',7:'4.Axf7+! sacrificio temático: el rey negro sale a la intemperie.',9:'5.Cxe5+ y el rey queda atrapado en el centro.',27:'14.Df7#. Su mejor versión: alfil a c4, golpe en f7, mate rápido.'},
  lesson:'Contra su Ac4 NUNCA juegues …Cd4 ni descuides f7. Cubre con …e6/…De7/…d6.'},
 {id:'119037562031',title:'Su mate típico — Cd5 / Ah6',meta:'Apertura del Alfil C23 · TERRORRR vs 1723',hero:'w',res:'Gana Mario',rc:'win',url:'https://www.chess.com/game/live/119037562031',
  pgn:'1. e4 e5 2. Bc4 Nc6 3. Qh5 g6 4. Qf3 Qf6 5. d3 Nd4 6. Qe2 Nxe2 7. Nxe2 Bc5 8. O-O d6 9. Nbc3 a6 10. Nd5 Qd8 11. c3 Ne7 12. d4 Bb6 13. Nf6+ Kf8 14. Bh6# 1-0',
  notes:{5:'Dh5 en la jugada 3 — su melodía favorita. El negro se defendió mal.',19:'10.Cd5 se instala gratis en el corazón negro.',25:'13.Cf6+ y la red se cierra.',27:'14.Ah6#. El patrón Cd5→Cf6+→Ah6#.'},
  lesson:'Contra Dh5 juega …g6 y …Cf6 con orden correcto; no dejes el caballo entrar a d5 gratis.'},
 {id:'118097924583',title:'Su ataque con negras — enroque opuesto',meta:'Siciliana Acelerada B27 · TERRORRR (1761) vs 1698',hero:'b',res:'Gana Mario (negras)',rc:'win',url:'https://www.chess.com/game/live/118097924583',
  pgn:'1. e4 c5 2. Nf3 g6 3. d3 Bg7 4. Nc3 Nc6 5. Be3 d6 6. Qd2 Nf6 7. O-O-O a6 8. h4 b5 9. h5 Qa5 10. hxg6 fxg6 11. Nd5 Qxa2 12. Nxf6+ Bxf6 13. Qe2 Qxb2+ 14. Kd2 Bc3# 0-1',
  notes:{13:'El blanco enroca largo (7.0-0-0) — entra en el juego de Mario.',15:'…b5 y …Da5: arranca la avalancha de dama y peones.',21:'…Dxa2 — el rey blanco ya no respira.',27:'…Bc3#. En enroques opuestos su ataque es letal.'},
  lesson:'Evita enrocar en el flanco opuesto al suyo. Aquí ganó porque el blanco entró en su juego.'},
 {id:'166376459566',title:'Su derrota Nº1 — caída por tiempo en final igualado',meta:'Anti-Siciliana lenta B30 · pierde por bandera',hero:'w',res:'Pierde por tiempo',rc:'loss',url:'https://www.chess.com/game/live/166376459566',
  pgn:'1. e4 c5 2. Nf3 Nc6 3. Bc4 e6 4. d3 Nf6 5. a3 d5 6. exd5 exd5 7. Bb5 Bd6 8. O-O O-O 9. Nc3 Bg4 10. Bg5 a6 11. Ba4 b5 12. Bb3 c4 13. dxc4 dxc4 14. Ba2 Qc7 15. h3 Bxf3 16. Qxf3 Ne5 17. Qe2 Nfd7 18. f4 Ng6 19. Nd5 Qc5+ 20. Ne3 Rfe8 21. Rae1 h6 22. f5 Ne7 23. Bh4 Nd5 24. Bf2 Bf4 25. Nxd5 Qxd5 26. Qf3 Qxf3 27. gxf3 Ne5 28. Kg2 Bd2 29. Rd1 Ba5 30. b3 c3 31. b4 Bd8 32. Bd4 Rc8 33. Rde1 Bf6 34. f4 Nc6 35. Bxf6 gxf6 36. Rd1 Re2+ 37. Rf2 Rce8 38. Rd6 Ne7 39. Rxe2 1-0',
  notes:{1:'¡La misma estructura anti-Siciliana lenta que te recomiendo en la sección 08!',51:'26…Dxf3: cambio de damas. A partir de aquí, final de torres igualado.',53:'Con el reloj en 4:59 empieza el desgaste; el rival guarda 2:09.',77:'Cae por bandera. Exactamente tu plan: estructura sana → cambiar damas → final largo → él se hunde.'},
  lesson:'Sírvele su propia medicina: estructura sana, cambia damas, alarga el final. Su reloj hace el resto.'},
 {id:'147467208438',title:'Su derrota Nº2 — sobreextiende y le contraatacan el rey',meta:'vs 1…g6 (con blancas) · pierde',hero:'w',res:'Pierde',rc:'loss',url:'https://www.chess.com/game/live/147467208438',
  pgn:'1. e4 g6 2. Nf3 Bg7 3. Bc4 e6 4. Nc3 Nc6 5. d3 d6 6. Bg5 Nge7 7. O-O O-O 8. a3 a6 9. Ba2 Qd7 10. h3 Ne5 11. Nxe5 dxe5 12. Ne2 h6 13. Bd2 Nc6 14. Ng3 Qe7 15. Be3 Kh7 16. Qd2 f5 17. b4 f4 18. Bc5 Qf7 19. Bxf8 Qxf8 20. Ne2 f3 21. Ng3 fxg2 22. Kxg2 Nd4 23. f3 Qf6 24. c3 Nc6 25. Rf2 h5 26. Raf1 Bh6 27. Qe2 Bf4 28. Qd1 Qg5 29. Kh1 Qxg3 30. Rg2 Qxh3+ 31. Kg1 Be3+ 32. Rff2 Bd7 33. Qe2 Bxf2+ 34. Kxf2 Rf8 35. Qe3 Nd4 36. cxd4 exd4 37. Qe2 Qh4+ 38. Kf1 e5 39. Qf2 Qf4 40. Qd2 Qxf3+ 41. Rf2 Bh3+ 42. Ke2 Qh1+ 43. Ke2 Bg4+ 0-1',
  notes:{31:'El negro golpea con …f5–f4–f3 y abre el rey blanco (antes 17.b4/18.Ac5 sobreextendió).',57:'29…Dxg3! — el ataque de Mario nunca llegó; ahora colapsa su propio enroque.',86:'0-1. Cuando le contraatacan el rey, no defiende bien.'},
  lesson:'Provoca que empuje peones, mantén tu solidez, y contraataca su rey.'},
 {id:'147302160170',title:'Fuera de repertorio = desastre',meta:'Pirc (rarísimo en él) · mate en 9',hero:'b',res:'Pierde (mate en 9)',rc:'loss',url:'https://www.chess.com/game/live/147302160170',
  pgn:'1.e4 d6 2.d4 c5 3.dxc5 dxc5 4.Qxd8+ Kxd8 5.Bf4 c4 6.Nc3 g5 7.O-O-O+ Ke8 8.Bc7 Bh6 9.Rd8# 1-0',
  notes:{7:'4.Dxd8+ le quita el enroque; el rey queda a la deriva.',13:'7.0-0-0+ con jaque, todo va sobre el rey negro.',17:'9.Td8#. Fuera de su Siciliana/…d5 no sabe defenderse.'},
  lesson:'Sacarlo del guion es oro. Escandinava o Caro con …Ag4 le quitan todo su repertorio.'}
];

/* ============ RENDER BOARDS (con carga diferida) ============ */
function diffSquares(a,b){const s=new Set();for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(a[r][c]!==b[r][c])s.add(r*8+c);return s;}

// Observador que inicializa cada tablero cuando se acerca al viewport (rendimiento)
const gameIO=('IntersectionObserver'in window)?new IntersectionObserver((es)=>{
  es.forEach(e=>{if(e.isIntersecting){initGame(e.target,e.target.__g);gameIO.unobserve(e.target);}});
},{rootMargin:'400px 0px'}):null;

let gameSeq=0;
function mountGame(container,g){
  const el=document.createElement('article');
  el.className='game';el.id='game-'+(gameSeq++);el.__g=g;
  el.innerHTML=`
    <div class="game-head">
      <div><div class="t">${g.title}</div><div class="m">${g.meta}</div></div>
      <span class="res ${g.rc}">${g.res}</span>
    </div>
    <div class="board-col"><div class="board skeleton" role="img" aria-label="Cargando tablero…"></div></div>`;
  container.appendChild(el);
  if(gameIO) gameIO.observe(el); else initGame(el,g);
  return el;
}

function initGame(el,g){
  const data=replay(g.pgn);
  el.innerHTML=`
    <div class="game-head">
      <div><div class="t">${g.title}</div><div class="m">${g.meta}</div></div>
      <span class="res ${g.rc}">${g.res}</span>
    </div>
    <div class="game-body">
      <div class="board-col">
        <div class="board" role="img" aria-label="Tablero de ajedrez: ${g.title}"></div>
        <div class="ctrls">
          <button data-a="first" aria-label="Ir al inicio">⏮</button>
          <button data-a="prev" aria-label="Jugada anterior">◀</button>
          <span class="counter" aria-live="polite"></span>
          <button data-a="next" aria-label="Jugada siguiente">▶</button>
          <button data-a="last" aria-label="Ir al final">⏭</button>
          <button data-a="flip" class="flip" aria-label="Girar el tablero">Girar</button>
        </div>
      </div>
      <div class="moves-col">
        <div class="movelist" aria-label="Lista de jugadas"></div>
        <div class="annot empty">Pulsa ▶ o una jugada para avanzar.</div>
        <a class="link mono" style="font-size:12px" href="${g.url}" target="_blank" rel="noopener">Ver la partida ↗</a>
        ${g.lesson?`<div class="annot" style="border-left-color:var(--ally);background:transparent;padding-left:12px"><b>Lección:</b> ${g.lesson}</div>`:''}
      </div>
    </div>`;
  const board=el.querySelector('.board'), movelist=el.querySelector('.movelist'),
        counter=el.querySelector('.counter'), annot=el.querySelector('.annot');
  let ply=0, flip=(g.hero==='b');
  const notes=g.notes||{};

  const mvSpans=[];
  let html='';
  for(let i=0;i<data.moves.length;i++){
    if(i%2===0) html+=`<span class="num">${i/2+1}.</span>`;
    html+=`<span class="mv" data-p="${i+1}">${data.moves[i]}</span> `;
  }
  movelist.innerHTML=html;
  movelist.querySelectorAll('.mv').forEach(s=>{mvSpans.push(s);s.addEventListener('click',()=>{ply=+s.dataset.p;render();});});

  function render(){
    const frame=data.frames[ply];
    const hl = ply>0 ? diffSquares(data.frames[ply-1],frame) : new Set();
    let sqhtml='';
    for(let vr=0;vr<8;vr++)for(let vc=0;vc<8;vc++){
      const r=flip?7-vr:vr, c=flip?7-vc:vc;
      const light=(r+c)%2===0;
      const p=frame[r][c];
      const glyph=p?`<span class="pc ${isW(p)?'w':'b'}">${GLYPH[p.toLowerCase()]}</span>`:'';
      sqhtml+=`<div class="sqr ${light?'lt':'dk'} ${hl.has(r*8+c)?'hl':''}">${glyph}</div>`;
    }
    board.innerHTML=sqhtml;
    counter.textContent=`${ply} / ${data.moves.length}`;
    mvSpans.forEach((s,i)=>s.classList.toggle('on',i+1===ply));
    if(ply>0){const active=mvSpans[ply-1];if(active)active.scrollIntoView({block:'nearest'});}
    const note=notes[ply];
    if(note){annot.classList.remove('empty');annot.innerHTML=note;}
    else{annot.classList.add('empty');annot.textContent=ply===0?'Posición inicial.':'…';}
  }
  el.querySelectorAll('.ctrls button').forEach(btn=>btn.addEventListener('click',()=>{
    const a=btn.dataset.a;
    if(a==='first')ply=0;else if(a==='prev')ply=Math.max(0,ply-1);
    else if(a==='next')ply=Math.min(data.moves.length,ply+1);
    else if(a==='last')ply=data.moves.length;
    else if(a==='flip'){flip=!flip;}
    render();
  }));
  render();
}

/* mount model games */
const gc=document.getElementById('games');
GAMES.forEach(g=>mountGame(gc,g));

/* ============ LIVE DATA (auto-actualizado por update-dossier.js) ============ */
(function(){
  const D=window.DOSSIER_DATA; if(!D) return;
  const setText=(k,v)=>document.querySelectorAll('[data-live="'+k+'"]').forEach(el=>el.textContent=v);
  const c=D.chesscom||{};
  if(D.updatedAt){
    const dt=new Date(D.updatedAt);
    const stamp=document.getElementById('updated');
    if(stamp) stamp.innerHTML='· actualizado <b>'+dt.toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})+
      '</b> '+dt.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
  }
  if(c.total){
    setText('total', c.total.toLocaleString('es-ES'));
    const wp=c.total?Math.round((c.wins+c.draws/2)/c.total*1000)/10:0; // resultado global (score%)
    setText('winpct', wp.toFixed(1).replace('.',',')+'%');
    setText('wdltext', c.wins+' G / '+c.draws+' T / '+c.losses+' P');
    setText('timeoutpct', (c.timeoutPct!=null?c.timeoutPct:0)+'%');
    const t=c.total||1;
    const wb=document.querySelector('[data-live="wbar"]'), db=document.querySelector('[data-live="dbar"]'), lb=document.querySelector('[data-live="lbar"]');
    if(wb)wb.style.width=(c.wins/t*100)+'%'; if(db)db.style.width=(c.draws/t*100)+'%'; if(lb)lb.style.width=(c.losses/t*100)+'%';
    setText('wn',c.wins); setText('dn',c.draws); setText('ln',c.losses);
  }
  if(c.sicilianPct!=null) setText('sicilianpct', c.sicilianPct+'%');

  function chart(id,rows,cls){
    const el=document.getElementById(id); if(!el||!rows||!rows.length) return;
    el.innerHTML=rows.map(r=>`<div class="bar"><span class="lab">${r.label}</span><div class="track"><div class="fill ${cls||''}" style="width:${r.pct}%"></div></div><span class="pct">${r.pct}%</span></div>`).join('');
  }
  chart('chartWhiteFirst', c.firstMoveWhite);
  chart('chartBlackE4', c.blackVsE4);

  if(D.recentGames && D.recentGames.length){
    const wrap=document.getElementById('recent-wrap'), rc=document.getElementById('recent-games');
    if(rc){
      D.recentGames.forEach(g=>{ g.notes=g.notes||{}; g.lesson=g.lesson||''; mountGame(rc,g); });
      wrap.style.display='';
      const cnt=document.getElementById('recent-count');
      if(cnt) cnt.textContent='('+D.recentGames.length+' partidas · fuente: chess.com/'+ (D.chesscomUser||'terrorrr') +')';
    }
  }
})();

/* ============ UI: TABS ============ */
function wireTabs(id){const root=document.getElementById(id);if(!root)return;root.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  const pane=t.dataset.pane;const container=root.parentElement;
  root.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===t));
  container.querySelectorAll(':scope > .tabpane').forEach(p=>p.classList.toggle('active',p.id===pane));
}));}
wireTabs('planTabs');wireTabs('trainTabs');

/* ============ SCROLL-SPY NAV ============ */
const navLinks=[...document.querySelectorAll('#nav a')];
const secMap=new Map(navLinks.map(a=>[a.getAttribute('href').slice(1),a]));
if('IntersectionObserver'in window){
  const spy=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){
    navLinks.forEach(a=>a.classList.remove('active'));const a=secMap.get(e.target.id);if(a)a.classList.add('active');}});},
    {rootMargin:'-25% 0px -70% 0px',threshold:0});
  document.querySelectorAll('main section').forEach(s=>spy.observe(s));
}

/* ============ SIDEBAR (móvil) ============ */
const sidebar=document.getElementById('sidebar');
const scrim=document.getElementById('scrim');
const menuBtn=document.getElementById('menuBtn');
function closeSidebar(){sidebar.classList.remove('open');scrim.classList.remove('show');if(menuBtn)menuBtn.setAttribute('aria-expanded','false');}
function toggleSidebar(){const open=sidebar.classList.toggle('open');scrim.classList.toggle('show',open);if(menuBtn)menuBtn.setAttribute('aria-expanded',String(open));}
if(menuBtn)menuBtn.addEventListener('click',toggleSidebar);
if(scrim)scrim.addEventListener('click',closeSidebar);
navLinks.forEach(a=>a.addEventListener('click',()=>{if(window.matchMedia('(max-width:1023px)').matches)closeSidebar();}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSidebar();closeResults();}});

/* ============ TEMA CLARO / OSCURO ============ */
const THEME_KEY='dossier-theme';
const themeBtn=document.getElementById('themeBtn');
function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem(THEME_KEY,t);}catch(e){}
  if(themeBtn)themeBtn.setAttribute('aria-label', t==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro');}
if(themeBtn)themeBtn.addEventListener('click',()=>{
  const cur=document.documentElement.getAttribute('data-theme')||'light';
  setTheme(cur==='dark'?'light':'dark');
});

/* ============ BACK TO TOP ============ */
const backTop=document.getElementById('backTop');
if(backTop){
  const onScroll=()=>{backTop.classList.toggle('show',window.scrollY>560);};
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

/* ============ ANIMACIONES DE ENTRADA ============ */
if('IntersectionObserver'in window && !window.matchMedia('(prefers-reduced-motion:reduce)').matches){
  const targets=[...document.querySelectorAll('.kpi,.card,.game,.callout,.tablewrap,.qcard,.line,.bars,.wdl')];
  targets.forEach(t=>t.classList.add('reveal'));
  const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target);}}),
    {rootMargin:'0px 0px -6% 0px',threshold:.06});
  targets.forEach(t=>ro.observe(t));
}

/* ============ ANIMAR BARRAS AL VERLAS ============ */
if('IntersectionObserver'in window){
  const barObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){
    e.target.querySelectorAll('.fill[data-w]').forEach(f=>{f.style.width=f.dataset.w+'%';});barObs.unobserve(e.target);}});},{threshold:.2});
  document.querySelectorAll('.bars').forEach(b=>barObs.observe(b));
} else {
  document.querySelectorAll('.fill[data-w]').forEach(f=>f.style.width=f.dataset.w+'%');
}

/* ============ BUSCADOR GLOBAL ============ */
(function(){
  const input=document.getElementById('search');
  const results=document.getElementById('results');
  if(!input||!results) return;

  // índice: secciones (del nav) + todas las partidas montadas
  const index=[];
  navLinks.forEach(a=>index.push({kind:'Sección',label:a.textContent.replace(/^\s*\d+\s*/,'').trim(),sub:'',target:a.getAttribute('href').slice(1)}));
  document.querySelectorAll('.game').forEach(el=>{
    const t=el.querySelector('.t'), m=el.querySelector('.m');
    index.push({kind:'Partida',label:t?t.textContent:'Partida',sub:m?m.textContent:'',target:el.id});
  });

  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  let items=[], active=-1;

  function goTo(target){
    const el=document.getElementById(target);
    if(el){el.scrollIntoView({behavior:'smooth',block:'start'});
      if(el.classList.contains('game')){el.style.outline='2px solid var(--accent)';el.style.outlineOffset='3px';
        setTimeout(()=>{el.style.outline='';el.style.outlineOffset='';},1600);}}
    closeResults();input.value='';
  }
  function closeResults(){results.classList.remove('open');results.innerHTML='';active=-1;items=[];
    navLinks.forEach(a=>a.classList.remove('dim'));}
  window.closeResults=closeResults;

  function run(q){
    const nq=norm(q).trim();
    if(!nq){closeResults();return;}
    const matches=index.filter(it=>norm(it.label+' '+it.sub+' '+it.kind).includes(nq)).slice(0,10);
    items=matches;active=matches.length?0:-1;
    // resaltar el nav
    const secIds=new Set(matches.filter(m=>m.kind==='Sección').map(m=>m.target));
    navLinks.forEach(a=>a.classList.toggle('dim', secIds.size>0 && !secIds.has(a.getAttribute('href').slice(1))));
    if(!matches.length){results.innerHTML='<div class="empty">Sin resultados para «'+q.replace(/</g,'&lt;')+'»</div>';results.classList.add('open');return;}
    results.innerHTML=matches.map((m,i)=>`<a class="ritem${i===0?' active':''}" data-t="${m.target}" href="#${m.target}">
        <span class="rk">${m.kind}</span>
        <span style="min-width:0"><span class="rt">${m.label}</span>${m.sub?`<br><span class="rd">${m.sub}</span>`:''}</span>
      </a>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.ritem').forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();goTo(a.dataset.t);}));
  }
  input.addEventListener('input',()=>run(input.value));
  input.addEventListener('focus',()=>{if(input.value)run(input.value);});
  input.addEventListener('keydown',e=>{
    const rows=[...results.querySelectorAll('.ritem')];
    if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(rows.length-1,active+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(0,active-1);}
    else if(e.key==='Enter'){e.preventDefault();if(items[active])goTo(items[active].target);return;}
    else return;
    rows.forEach((r,i)=>r.classList.toggle('active',i===active));
    if(rows[active])rows[active].scrollIntoView({block:'nearest'});
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.search'))closeResults();});
  // atajo "/" para enfocar
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&document.activeElement!==input&&!/input|textarea/i.test(document.activeElement.tagName)){
      e.preventDefault();input.focus();}
  });
})();

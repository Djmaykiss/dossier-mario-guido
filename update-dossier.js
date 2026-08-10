#!/usr/bin/env node
/**
 * update-dossier.js
 * ------------------
 * Descarga las partidas públicas de TERRORRR (Chess.com) y el perfil de
 * elBanano (Lichess), recalcula todas las estadísticas del dossier y las
 * inyecta en dossier-mario-guido.html (entre los marcadores DATA_START/END).
 *
 * Uso:   node update-dossier.js
 * Sin dependencias externas. Requiere Node 18+ (usa fetch global).
 */
const fs = require('fs');
const path = require('path');

const CHESS_USER = 'terrorrr';
const LICHESS_USER = 'elBanano';
const DIR = __dirname;
const HTML = path.join(DIR, 'index.html');
const CACHE = path.join(DIR, '.cache-archives');
const UA = 'scouting-dossier/1.0 (personal study tool)';
const RECENT_COUNT = 6;

const log = (...a) => console.log('[dossier]', ...a);

async function getJSON(url, useCache) {
  if (useCache) {
    const f = path.join(CACHE, url.split('/pub/player/')[1].replace(/\//g, '_') + '.json');
    if (fs.existsSync(f)) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {} }
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' @ ' + url);
  const data = await res.json();
  if (useCache) {
    fs.mkdirSync(CACHE, { recursive: true });
    const f = path.join(CACHE, url.split('/pub/player/')[1].replace(/\//g, '_') + '.json');
    fs.writeFileSync(f, JSON.stringify(data));
  }
  return data;
}

// --- extraer solo la parte de jugadas de un PGN de Chess.com ---
function movetext(pgn) {
  if (!pgn) return '';
  const parts = pgn.split(/\r?\n\r?\n/);           // headers \n\n movetext
  let mt = parts.length > 1 ? parts.slice(1).join(' ') : pgn;
  return mt.replace(/\{[^}]*\}/g, ' ').replace(/\r?\n/g, ' ').trim();
}
function header(pgn, key) {
  const m = pgn && pgn.match(new RegExp('\\[' + key + '\\s+"([^"]*)"'));
  return m ? m[1] : '';
}
function firstMoves(mt) { // devuelve [primeraBlancas, primeraNegras]
  const toks = mt.replace(/\d+\.(\.\.)?/g, ' ').replace(/(1-0|0-1|1\/2-1\/2|\*)/g, ' ').trim().split(/\s+/).filter(Boolean);
  return [toks[0] || '', toks[1] || ''];
}
function openingName(pgn) {
  const url = header(pgn, 'ECOUrl');
  if (url) {
    const seg = url.split('/').pop().replace(/-\d+(\.\.\.)?.*$/, '').replace(/-/g, ' ');
    return seg.trim();
  }
  return header(pgn, 'ECO') || '';
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}
function pct(n, d) { return d ? Math.round(n / d * 1000) / 10 : 0; }

// clasifica el resultado de un jugador según el string de Chess.com
const WIN = new Set(['win']);
const DRAW = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', 'timevsinsufficient', '50move']);
// cualquier otro = derrota (checkmated, resigned, timeout, abandoned, lose, ...)

async function main() {
  log('Descargando archivo de Chess.com de', CHESS_USER, '…');
  const arch = await getJSON('https://api.chess.com/pub/player/' + CHESS_USER + '/games/archives', false);
  const months = arch.archives;
  const now = new Date();
  const curKey = now.getUTCFullYear() + '/' + String(now.getUTCMonth() + 1).padStart(2, '0');
  const prev = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
  const prevKey = prev.getUTCFullYear() + '/' + String(prev.getUTCMonth() + 1).padStart(2, '0');

  let all = [];
  for (const url of months) {
    const key = url.split('/games/')[1]; // "2026/07"
    const fresh = (key === curKey || key === prevKey); // meses recientes: no cachear
    try {
      const d = await getJSON(url, !fresh);
      all = all.concat(d.games || []);
    } catch (e) { log('  aviso: no se pudo leer', key, '-', e.message); }
  }
  const games = all.filter(g => g.rules === 'chess'); // solo ajedrez estándar
  games.sort((a, b) => a.end_time - b.end_time);
  log('Partidas de ajedrez estándar:', games.length);

  // --- estadísticas ---
  let wins = 0, draws = 0, losses = 0, timeoutLosses = 0;
  const side = { w: { n: 0, wins: 0, draws: 0, losses: 0 }, b: { n: 0, wins: 0, draws: 0, losses: 0 } };
  const ratings = [];
  const whiteFirst = {}; const blackReplyE4 = {}; let blackVsE4Total = 0;

  for (const g of games) {
    const meIsWhite = g.white.username.toLowerCase() === CHESS_USER;
    const me = meIsWhite ? g.white : g.black;
    const opp = meIsWhite ? g.black : g.white;
    const r = (me.result || '').toLowerCase();
    const s = meIsWhite ? side.w : side.b;
    s.n++;
    let outcome;
    if (WIN.has(r)) { wins++; s.wins++; outcome = 'w'; }
    else if (DRAW.has(r)) { draws++; s.draws++; outcome = 'd'; }
    else { losses++; s.losses++; outcome = 'l'; if (r === 'timeout') timeoutLosses++; }
    if (me.rating) ratings.push(me.rating);

    const [wm, bm] = firstMoves(movetext(g.pgn));
    if (meIsWhite) {
      const key = wm === 'e4' ? '1.e4' : wm === 'd4' ? '1.d4' : wm === 'f4' ? '1.f4 (Bird)'
        : wm === 'c4' ? '1.c4' : wm === 'Nf3' ? '1.Cf3' : (wm ? 'otras' : null);
      if (key) whiteFirst[key] = (whiteFirst[key] || 0) + 1;
    } else if (wm === 'e4' && bm) {
      blackVsE4Total++;
      const map = { c5: '1…c5', e5: '1…e5', e6: '1…e6', c6: '1…c6', g6: '1…g6', d5: '1…d5', d6: '1…d6', Nf6: '1…Cf6' };
      const key = map[bm] || 'otras';
      blackReplyE4[key] = (blackReplyE4[key] || 0) + 1;
    }
  }

  function topBars(obj, total, max) {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, max)
      .map(([label, n]) => ({ label, n, pct: pct(n, total) }));
  }
  const whiteTotal = side.w.n;
  const firstMoveWhite = topBars(whiteFirst, whiteTotal, 5);
  const blackVsE4 = topBars(blackReplyE4, blackVsE4Total, 4);
  const sicilianPct = pct(blackReplyE4['1…c5'] || 0, blackVsE4Total);

  // --- perfil Lichess (solo estadísticas; las partidas dan 404) ---
  let lichess = null;
  try {
    const p = await getJSON('https://lichess.org/api/user/' + LICHESS_USER, false);
    lichess = {
      blitz: p.perfs?.blitz?.rating, rapid: p.perfs?.rapid?.rating, bullet: p.perfs?.bullet?.rating,
      totalGames: p.count?.all, wins: p.count?.win, draws: p.count?.draw, losses: p.count?.loss,
      lastOnline: p.seenAt ? new Date(p.seenAt).toISOString() : null
    };
    log('Lichess', LICHESS_USER, '- blitz', lichess.blitz, '| partidas', lichess.totalGames);
  } catch (e) { log('aviso Lichess:', e.message); }

  // --- partidas recientes con tablero jugable ---
  const recentGames = games.slice(-RECENT_COUNT).reverse().map(g => {
    const meIsWhite = g.white.username.toLowerCase() === CHESS_USER;
    const me = meIsWhite ? g.white : g.black;
    const opp = meIsWhite ? g.black : g.white;
    const r = (me.result || '').toLowerCase();
    let rc, res;
    if (WIN.has(r)) { rc = 'win'; res = 'Gana Mario'; }
    else if (DRAW.has(r)) { rc = 'draw'; res = 'Tablas'; }
    else { rc = 'loss'; res = (r === 'timeout' ? 'Pierde por tiempo' : 'Pierde'); }
    const date = new Date(g.end_time * 1000).toISOString().slice(0, 10);
    const op = openingName(g.pgn);
    const tc = ({ blitz: 'Blitz', bullet: 'Bullet', rapid: 'Rapid', daily: 'Daily' })[g.time_class] || g.time_class;
    const notes = {};
    return {
      url: g.url,
      title: 'vs ' + opp.username + ' (' + (opp.rating || '?') + ')',
      meta: date + ' · ' + tc + ' · ' + (op ? op + ' · ' : '') + 'Mario con ' + (meIsWhite ? 'blancas' : 'negras') +
        ' · su rating ' + (me.rating || '?'),
      hero: meIsWhite ? 'w' : 'b',
      res, rc, notes, lesson: '',
      pgn: movetext(g.pgn)
    };
  });

  const data = {
    updatedAt: new Date().toISOString(),
    chesscomUser: CHESS_USER,
    chesscom: {
      total: games.length, wins, draws, losses, timeoutLosses,
      timeoutPct: pct(timeoutLosses, losses),
      white: side.w, black: side.b,
      ratingMin: Math.min(...ratings), ratingMax: Math.max(...ratings),
      ratingMedian: median(ratings), ratingLatest: ratings[ratings.length - 1],
      firstMoveWhite, blackVsE4, sicilianPct,
      lastGameDate: games.length ? new Date(games[games.length - 1].end_time * 1000).toISOString().slice(0, 10) : null
    },
    lichess,
    recentGames
  };

  // --- inyectar en el HTML ---
  let html = fs.readFileSync(HTML, 'utf8');
  const json = JSON.stringify(data).replace(/</g, '\\u003c'); // evita cerrar el <script>
  const block = 'window.DOSSIER_DATA=' + json + ';';
  const re = /\/\*DATA_START\*\/[\s\S]*?\/\*DATA_END\*\//;
  if (!re.test(html)) throw new Error('No se encontraron los marcadores DATA_START/END en el HTML');
  html = html.replace(re, '/*DATA_START*/' + block + '/*DATA_END*/');
  fs.writeFileSync(HTML, html);

  log('---');
  log('Total:', games.length, '| G/T/P:', wins + '/' + draws + '/' + losses,
    '(' + pct(wins, games.length) + '% victorias)');
  log('Derrotas por tiempo:', timeoutLosses, '=', pct(timeoutLosses, losses) + '% de sus derrotas');
  log('Blancas 1ª jugada:', firstMoveWhite.map(x => x.label + ' ' + x.pct + '%').join(' · '));
  log('Siciliana con negras:', sicilianPct + '%');
  log('Rating (chess.com): min', data.chesscom.ratingMin, 'max', data.chesscom.ratingMax,
    'mediana', data.chesscom.ratingMedian, 'actual', data.chesscom.ratingLatest);
  log('Partidas recientes añadidas:', recentGames.length,
    recentGames.length ? '(última: ' + recentGames[0].meta.split(' · ')[0] + ')' : '');
  log('HTML actualizado ✔  ->', HTML);
}

main().catch(e => { console.error('[dossier] ERROR:', e.message); process.exit(1); });

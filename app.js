/* Rozane et Rochane Family — planning familial hors connexion
   Créé par Rochdi MECHETI. Toutes les données restent sur le téléphone. */
'use strict';

/* ---------- Outils ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const toMin = hm => { if (!hm) return -1; const [a, b] = hm.split(':').map(Number); return a * 60 + b; };
const addMin = (hm, n) => { let t = toMin(hm) + n; t = ((t % 1440) + 1440) % 1440; return pad(Math.floor(t / 60)) + ':' + pad(t % 60); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const J3 = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const fmtLong = s => { const d = parseD(s); return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()]; };
const fmtShort = s => { const d = parseD(s); return d.getDate() + ' ' + MOIS[d.getMonth()].slice(0, 4) + (MOIS[d.getMonth()].length > 4 ? '.' : ''); };
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- Données ---------- */
const KEY = 'kaelumFamily_v1';
const LATTES = { lat: 43.5676, lng: 3.9005 };
const MONTPELLIER = { lat: 43.6109, lng: 3.8772 };

function defaults() {
  return {
    v: 1, owner: '',
    people: [
      { id: 'papa', name: 'Papa Roch', color: '#3f6f5c', birth: '' },
      { id: 'maman', name: 'Maman Roufi', color: '#c94f6d', birth: '' },
      { id: 'fille1', name: 'Rochane', color: '#e0962a', birth: '' },
      { id: 'fille2', name: 'Rozane', color: '#8a5fb0', birth: '' }
    ],
    kids: ['fille1', 'fille2'],
    events: [], meds: [], medLog: {}, vaccines: [],
    birthdays: [],
    school: {
      days: { 1: { on: false, start: '08:30', end: '16:30' }, 2: { on: false, start: '08:30', end: '16:30' }, 3: { on: false, start: '08:30', end: '16:30' },
        4: { on: false, start: '08:30', end: '16:30' }, 5: { on: false, start: '08:30', end: '16:30' } },
      holidays: [], depart: 15, set: false
    },
    sleep: { week: '21:00', weekend: '23:00', before: 15 },
    wake: { school: '07:00', off: '08:30', on: true, offOn: false, who: 'all' },
    prayer: { show: true, method: 'uoif', asr: 'shafi', adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, remind: true, before: 0 },
    fast: { person: 'maman', weekdays: [], dates: [], skip: [] },
    menus: {}, menuSeed: {},
    cycle: { periods: [], logs: {}, len: 28, plen: 5, show: true, pause: true },
    journal: {}, courses: [],
    notif: { events: true, meds: true, school: true, sleep: true, wake: true, prayer: true, fast: true, rain: true, sound: true }
  };
}
let S;
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  const d = defaults();
  if (!S) { S = d; return; }
  for (const k in d) if (S[k] === undefined) S[k] = d[k];
  for (const k of ['school', 'sleep', 'wake', 'prayer', 'fast', 'cycle', 'notif']) S[k] = Object.assign({}, d[k], S[k]);
  if (!S.nm2) { // nouveaux prénoms affichés
    const NM = { papa: ['Rochdi', 'Papa'], maman: ['Roufaida', 'Maman'], fille1: ['Fille 1'], fille2: ['Fille 2'] }, NEW = { papa: 'Papa Roch', maman: 'Maman Roufi', fille1: 'Rochane', fille2: 'Rozane' };
    for (const p of S.people || []) if (NM[p.id] && NM[p.id].includes(p.name)) p.name = NEW[p.id];
    S.nm2 = true;
  }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('⚠️ Mémoire du téléphone pleine'); } if (typeof schedulePush === 'function') schedulePush(); }
const person = id => S.people.find(p => p.id === id);
const pname = id => id === 'all' ? 'Toute la famille' : id === 'kids' ? 'Les filles' : (person(id)?.name || '');
const pcolor = id => person(id)?.color || '#4b2fb0';
const avSrc = id => { try { return localStorage.getItem('kaelumAv_' + id) || ''; } catch (e) { return ''; } };
function avatar(id, size) {
  const src = avSrc(id), c = pcolor(id), sz = size || 22;
  if (src) return '<img class="av" src="' + src + '" style="width:' + sz + 'px;height:' + sz + 'px;border-color:' + c + '" alt="">';
  if (size) return '<span class="av avl" style="width:' + sz + 'px;height:' + sz + 'px;background:' + c + ';font-size:' + Math.round(sz * 0.42) + 'px">' + esc((person(id)?.name || '?').replace(/^(Papa|Maman) /, '').charAt(0)) + '</span>';
  return '<span class="dot" style="background:' + c + '"></span>';
}
function whoMark(who) {
  if (who === 'all') return '<span class="dot" style="background:#c9a27a"></span>';
  if (who === 'kids') return S.kids.map(k => avatar(k)).join('');
  return avatar(who);
}
const isOwnerWife = () => S.owner === 'maman';
const cycleVisible = () => S.cycle.show;

/* ---------- Prière & jeûne ---------- */
const prayerCache = {};
function prayers(D) {
  const k = D + JSON.stringify([S.prayer.method, S.prayer.asr, S.prayer.adj]);
  if (!prayerCache[k]) prayerCache[k] = PrayerCalc.forDate(D, { lat: MONTPELLIER.lat, lng: MONTPELLIER.lng, method: S.prayer.method, asr: S.prayer.asr, adj: S.prayer.adj });
  return prayerCache[k];
}
const PNAMES = { fajr: 'Sobh (Fajr)', sunrise: 'Lever du soleil', dhuhr: 'Dhohr', asr: 'Asr', maghrib: 'Maghreb', isha: 'Icha' };
function isFast(D) {
  if (S.fast.skip.includes(D)) return false;
  if (S.fast.dates.includes(D)) return true;
  return S.fast.weekdays.includes(parseD(D).getDay());
}

/* ---------- Cycle ---------- */
function cycleInfo(ref) {
  ref = ref || today();
  const ps = [...S.cycle.periods].sort((a, b) => a.start.localeCompare(b.start));
  const lens = [];
  for (let i = 1; i < ps.length; i++) { const l = diffDays(ps[i - 1].start, ps[i].start); if (l >= 18 && l <= 50) lens.push(l); }
  const lastL = lens.slice(-6);
  const avg = lastL.length ? Math.round(lastL.reduce((a, b) => a + b, 0) / lastL.length) : S.cycle.len;
  const plens = ps.filter(p => p.end).map(p => diffDays(p.start, p.end) + 1).filter(x => x > 0 && x < 12).slice(-6);
  const plen = plens.length ? Math.round(plens.reduce((a, b) => a + b, 0) / plens.length) : S.cycle.plen;
  const past = ps.filter(p => p.start <= ref);
  const last = past[past.length - 1];
  if (!last) return { avg, plen, last: null };
  const day = diffDays(last.start, ref) + 1;
  const inPeriod = last.end ? ref <= last.end : day <= plen + 3 && !last.closed;
  let next = addDays(last.start, avg);
  while (next <= ref && !inPeriod) next = addDays(next, avg);
  if (inPeriod) next = addDays(last.start, avg);
  const ov = addDays(next, -14);
  return { avg, plen, last, day, inPeriod, next, ov, fertStart: addDays(ov, -5), fertEnd: addDays(ov, 1), openPeriod: !last.end && inPeriod };
}
function dayCycleState(D) {
  const ps = S.cycle.periods;
  for (const p of ps) { const end = p.end || addDays(p.start, cycleInfo().plen - 1); if (D >= p.start && D <= end) return 'per'; }
  const ci = cycleInfo();
  if (!ci.last) return '';
  let n = ci.next;
  for (let i = 0; i < 4; i++) {
    if (D >= n && D <= addDays(n, ci.plen - 1) && D > today()) return 'pred';
    const ov = addDays(n, -14);
    if (D >= addDays(ov, -5) && D <= addDays(ov, 1) && D >= ci.last.start) return 'fert';
    n = addDays(n, ci.avg);
  }
  return '';
}
function wifeInPeriod(D) { return S.cycle.pause && cycleVisible() && cycleInfo(D).inPeriod; }

/* ---------- Import de plannings (fichier privé) ---------- */
function importPlanning(pl) {
  S.imports = S.imports || [];
  S.events = S.events.filter(e => e.src !== pl.id);
  pl.items.forEach(([date, time, end, cat, person, title, notes, alarm], i) =>
    S.events.push({ id: pl.id + '-' + i, src: pl.id, title, cat, person, date, time, end, rec: 'none', days: [], until: '', alarm: alarm < 0 ? 0 : alarm, noAlarm: alarm < 0, notes }));
  if (!S.imports.includes(pl.id)) S.imports.push(pl.id);
  return pl.items.length;
}

/* ---------- Planning chiffré en ligne (mise à jour automatique) ---------- */
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const PLAN_KEY = 'R5QwlQgJV1/YQsPfBeNBUVnnVi3dipaZrx74BhcBPdw=';
async function syncPlanning(manual) {
  if (!S.famKey) { S.famKey = PLAN_KEY; save(); }
  if (!S.famKey || !navigator.onLine) { if (manual) toast(S.famKey ? 'Pas de connexion' : 'Ouvre d\'abord le fichier privé'); return; }
  try {
    const r = await fetch('plannings.enc?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) { if (manual) toast('Aucun planning en ligne'); return; }
    const env = await r.json();
    if (env.sig && env.sig === S.planSig) { if (manual) toast('Planning déjà à jour ✅'); return; }
    const key = await crypto.subtle.importKey('raw', b64d(S.famKey), 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(env.iv) }, key, b64d(env.data));
    const data = JSON.parse(new TextDecoder().decode(plain));
    let n = 0; for (const pl of data.plannings) n += importPlanning(pl);
    if (data.pdf) { try { localStorage.setItem('kaelumPlanPdf', JSON.stringify(data.pdf)); } catch (e2) { } }
    S.planSig = env.sig; S.planAt = Date.now(); save(); render();
    toast('📅 Planning de ' + pname('papa') + ' mis à jour (' + n + ' créneaux)');
  } catch (e) { if (manual) toast('Impossible de lire le planning en ligne'); }
}

/* ---------- Agenda du jour (moteur central) ---------- */
const CATS = {
  travail: ['🛡️', 'Travail'], formation: ['🎓', 'Formation'], rdv: ['📌', 'Rendez-vous'], rappel: ['🔔', 'Rappel'], reveil: ['⏰', 'Réveil'], sport: ['🏃', 'Sport'], activite: ['🎨', 'Activité'],
  sortie: ['🌳', 'Sortie'], voyage: ['✈️', 'Voyage'], ecole: ['🎒', 'École'], medecin: ['🩺', 'Médecin'], autre: ['📝', 'Autre']
};
function occurs(ev, D) {
  if (D < ev.date) return false;
  if (ev.until && D > ev.until) return false;
  const r = ev.rec || 'none', d = parseD(D), o = parseD(ev.date);
  if (r === 'none') return D === ev.date;
  if (r === 'daily') return true;
  if (r === 'weekly') { const days = ev.days && ev.days.length ? ev.days : [o.getDay()]; return days.includes(d.getDay()); }
  if (r === 'monthly') return d.getDate() === o.getDate();
  if (r === 'yearly') return d.getDate() === o.getDate() && d.getMonth() === o.getMonth();
  return false;
}
function schoolDay(D) {
  const wd = parseD(D).getDay(), sd = S.school.days[wd];
  if (!sd || !sd.on) return null;
  if (S.school.holidays.some(h => D >= h.start && D <= h.end)) return null;
  return sd;
}
function dayItems(D) {
  const it = [], wd = parseD(D).getDay();
  for (const ev of S.events) if (occurs(ev, D)) {
    const c = CATS[ev.cat] || CATS.autre;
    it.push({ time: ev.time || '', title: c[0] + ' ' + ev.title, who: ev.person, cat: ev.cat === 'reveil' ? 'wakeEv' : 'event', alarm: ev.noAlarm ? -1 : Number(ev.alarm || 0), key: 'ev:' + ev.id + ':' + D, ev, notes: ev.notes });
  }
  for (const m of S.meds) {
    if (m.start && D < m.start) continue; if (m.end && D > m.end) continue;
    for (const t of (m.times || [])) it.push({ time: t, title: '💊 ' + m.name + (m.dose ? ' — ' + m.dose : ''), who: m.person, cat: 'med', alarm: 0, key: 'med:' + m.id + '@' + t + ':' + D, med: { id: m.id, t } });
  }
  const sd = schoolDay(D);
  if (sd) {
    it.push({ time: addMin(sd.start, -S.school.depart), title: '🚗 Départ crèche / école', who: 'kids', cat: 'school', alarm: 0, key: 'sch0:' + D });
    it.push({ time: sd.start, title: '🎒 Arrivée crèche / école', who: 'kids', cat: 'school', alarm: -1, key: 'sch1:' + D });
    it.push({ time: sd.end, title: '🏫 Récupérer les filles (crèche / école)', who: 'kids', cat: 'school', alarm: 10, key: 'sch2:' + D });
  }
  if (S.wake.on && (sd || S.wake.offOn)) it.push({ time: sd ? S.wake.school : S.wake.off, title: '⏰ Réveil', who: 'all', cat: 'wake', alarm: 0, key: 'wake:' + D });
  const night = [0, 1, 2, 3, 4].includes(wd) ? S.sleep.week : S.sleep.weekend;
  it.push({ time: night, title: '😴 Coucher des filles', who: 'kids', cat: 'sleep', alarm: Number(S.sleep.before || 0), key: 'sleep:' + D });
  const wifePer = wifeInPeriod(D);
  if (S.prayer.show) {
    const p = prayers(D);
    for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) it.push({ time: p[k], title: '🕌 ' + PNAMES[k], who: 'all', cat: 'prayer', alarm: Number(S.prayer.before || 0), key: 'pr:' + k + ':' + D, quiet: wifePer && isOwnerWife() });
  }
  if (isFast(D) && !wifePer) {
    const p = prayers(D);
    it.push({ time: addMin(p.fajr, -30), title: '🌙 Shour — fin du repas dans 30 min', who: S.fast.person, cat: 'fast', alarm: 0, key: 'shour:' + D });
    it.push({ time: p.fajr, title: '🌅 Début du jeûne (Sobh)', who: S.fast.person, cat: 'fast', alarm: -1, key: 'fs:' + D });
    it.push({ time: p.maghrib, title: '🌇 Rupture du jeûne (Maghreb) — Iftar', who: S.fast.person, cat: 'fast', alarm: 0, key: 'fe:' + D });
  }
  const md = D.slice(5);
  for (const b of S.birthdays) if (b.date.slice(-5) === md) {
    const age = b.date.length === 10 ? (Number(D.slice(0, 4)) - Number(b.date.slice(0, 4))) : null;
    it.push({ time: '', title: '🎂 Anniversaire de ' + b.name + (age ? ' (' + age + ' ans)' : ''), who: 'all', cat: 'bday', key: 'bd:' + b.id + ':' + D });
  }
  for (const b of S.birthdays) if (b.date.slice(-5) === addDays(D, 7).slice(5)) it.push({ time: '', title: '🎁 Dans 7 jours : anniversaire de ' + b.name, who: 'all', cat: 'bday', key: 'bd7:' + b.id + ':' + D });
  for (const v of S.vaccines) if (v.next === D && !v.done) it.push({ time: '', title: '💉 Vaccin prévu : ' + v.name, who: v.person, cat: 'vaccin', key: 'vac:' + v.id });
  for (const v of S.vaccines) if (v.next && !v.done && addDays(D, 7) === v.next) it.push({ time: '', title: '💉 Dans 7 jours : vaccin ' + v.name + ' (prendre RDV)', who: v.person, cat: 'vaccin', key: 'vac7:' + v.id });
  if (cycleVisible()) { const ci = cycleInfo(); if (ci.last && ci.next === D && !ci.inPeriod) it.push({ time: '', title: '🌸 Règles prévues aujourd\'hui', who: 'maman', cat: 'cycle', key: 'cyc:' + D }); }
  return it.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00') || (a.time ? 1 : -1));
}
function whoMatch(itemWho, filter) {
  if (filter === 'all') return true;
  if (itemWho === 'all') return true;
  if (itemWho === 'kids') return S.kids.includes(filter);
  return itemWho === filter;
}
const medTaken = (D, id, t) => !!(S.medLog[D] && S.medLog[D][id + '@' + t]);

/* ---------- Menus ---------- */
const MENU = {
  pdj: ['Msemen + miel + lait chaud', 'Tartines beurre-confiture + jus d\'orange', 'Céréales + lait + banane', 'Baghrir + miel + thé / lait',
    'Pain complet + fromage frais + pomme', 'Yaourt + granola + fruits rouges', 'Œufs brouillés + pain + jus de fruits', 'Porridge d\'avoine + lait + dattes',
    'Crêpes maison + compote', 'Matlouh + huile d\'olive + olives + thé', 'Pancakes + fruits frais', 'Pain au lait + chocolat chaud + clémentine'],
  midi: ['Couscous poulet et légumes', 'Tajine de poulet aux olives et citron + pain', 'Pâtes bolognaise (bœuf halal) + salade', 'Riz + poulet au curry doux + haricots verts',
    'Loubia (haricots blancs en sauce) + pain', 'Lentilles aux carottes + riz', 'Hachis parmentier (bœuf halal) + salade verte', 'Gratin de pâtes au thon + salade',
    'Poisson pané + purée + carottes', 'Chakchouka aux œufs + pain', 'Kefta en sauce tomate + pommes de terre au four', 'Poulet rôti + pommes de terre + salade',
    'Dolma (légumes farcis à la viande)', 'Saumon + riz + brocolis', 'Berkoukes au poulet', 'Quiche au poulet (sans porc) + salade'],
  diner: ['Chorba frik + pain', 'Soupe de légumes + omelette', 'Harira + dattes', 'Salade composée thon-œufs + pain', 'Gratin de courgettes + riz',
    'Pizza maison (thon ou poulet) + salade', 'Bourek à la viande hachée + soupe', 'Croque-monsieur à la dinde + salade', 'Omelette aux pommes de terre + salade',
    'Pâtes au saumon', 'Velouté de potiron + tartines au fromage', 'Wraps poulet et crudités', 'Soupe de lentilles corail + pain', 'Galettes complètes (dinde, œuf, fromage)'],
  collation: ['Fruit + petits-beurre', 'Yaourt + compote', 'Pain + barre de chocolat', 'Dattes + verre de lait', 'Fromage blanc + miel', 'Gâteau maison + jus de fruits',
    'Banane + petit-suisse', 'Smoothie banane-lait', 'Crêpe + confiture', 'Pomme + fromage'],
  shour: ['Porridge d\'avoine + dattes + lait + 2 verres d\'eau', 'Œufs + pain complet + fromage + eau', 'Yaourt + pain complet + miel + banane + eau',
    'Msemen + fromage + lait + eau', 'Riz au lait + fruit + eau', 'Pain complet + houmous + concombre + lait + eau'],
  iftar: ['Dattes + eau, puis chorba + bourek', 'Dattes + lait, puis harira + plat léger', 'Dattes + lben, puis soupe + poulet grillé + salade',
    'Dattes + eau, puis salade + tajine', 'Dattes + jus, puis velouté + poisson + riz', 'Dattes + eau, puis soupe + kefta + légumes']
};
const SLOTS = [['pdj', '☀️ Petit-déj'], ['midi', '🍲 Midi'], ['collation', '🍎 Collation'], ['diner', '🌙 Dîner']];
function menuFor(D, slot) {
  const saved = S.menus[D] && S.menus[D][slot];
  if (saved) return saved;
  const list = MENU[slot], seed = hash(D + slot + (S.menuSeed[D] || 0));
  let i = seed % list.length;
  if (slot === 'midi' || slot === 'diner') { // éviter le même plat que la veille
    const prev = hash(addDays(D, -1) + slot + (S.menuSeed[addDays(D, -1)] || 0)) % list.length;
    if (i === prev) i = (i + 1) % list.length;
  }
  return list[i];
}
function hasSport(D) { return dayItems(D).some(i => i.ev && ['sport', 'activite', 'sortie'].includes(i.ev.cat)); }

/* ---------- Météo Lattes ---------- */
const WMO = c => c === 0 ? ['☀️', 'Ciel dégagé'] : c <= 2 ? ['🌤️', 'Peu nuageux'] : c === 3 ? ['☁️', 'Couvert'] : c <= 48 ? ['🌫️', 'Brouillard']
  : c <= 57 ? ['🌦️', 'Bruine'] : c <= 67 ? ['🌧️', 'Pluie'] : c <= 77 ? ['❄️', 'Neige'] : c <= 82 ? ['🌦️', 'Averses'] : c <= 86 ? ['🌨️', 'Averses de neige'] : ['⛈️', 'Orage'];
const isRainCode = c => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
let WX = null;
try { WX = JSON.parse(localStorage.getItem('kaelumWx')); } catch (e) { }
async function fetchWeather() {
  if (!navigator.onLine) return;
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + LATTES.lat + '&longitude=' + LATTES.lng +
    '&current=temperature_2m,weather_code,precipitation,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=Europe%2FParis&forecast_days=7';
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return;
    WX = await r.json(); WX.at = Date.now();
    localStorage.setItem('kaelumWx', JSON.stringify(WX));
    checkRain(); if (view === 'accueil' || (view === 'plus' && sub === 'meteo')) render();
  } catch (e) { }
}
function rainSoon() {
  if (!WX || !WX.hourly) return null;
  const h = WX.hourly, now = new Date(), nowKey = ymd(now) + 'T' + pad(now.getHours()) + ':00';
  let start = h.time.indexOf(nowKey); if (start < 0) return null;
  for (let i = start; i < Math.min(start + 12, h.time.length); i++) {
    if ((h.precipitation_probability[i] ?? 0) >= 50 || (h.precipitation[i] ?? 0) >= 0.3 || isRainCode(h.weather_code[i]))
      return { hour: h.time[i].slice(11, 13) + 'h', prob: h.precipitation_probability[i], now: i === start, mm: h.precipitation[i] };
  }
  return null;
}
function rainTomorrow() {
  if (!WX || !WX.daily) return null;
  const i = WX.daily.time.indexOf(addDays(today(), 1)); if (i < 0) return null;
  return (WX.daily.precipitation_probability_max[i] >= 50 || WX.daily.precipitation_sum[i] >= 1) ? { prob: WX.daily.precipitation_probability_max[i], mm: WX.daily.precipitation_sum[i] } : null;
}
function checkRain() {
  if (!S.notif.rain) return;
  const r = rainSoon(), key = 'rain:' + today() + ':' + (new Date().getHours() < 13 ? 'am' : 'pm');
  if (r && !firedGet()[key]) { notify('🌧️ Pluie à Lattes', r.now ? 'Il pleut ou va pleuvoir maintenant — prends un parapluie !' : 'Pluie prévue vers ' + r.hour + (r.prob != null ? ' (' + r.prob + ' %)' : '') + ' — prends un parapluie.'); firedSet(key); }
  const t = rainTomorrow(), k2 = 'rainT:' + today();
  if (t && new Date().getHours() >= 18 && !firedGet()[k2]) { notify('🌧️ Demain : pluie à Lattes', 'Probabilité ' + t.prob + ' % — prévoir les K-way des filles.'); firedSet(k2); }
}

/* ---------- Notifications ---------- */
function firedGet() { try { return JSON.parse(localStorage.getItem('kaelumFired_' + today())) || {}; } catch (e) { return {}; } }
function firedSet(k) { const f = firedGet(); f[k] = 1; localStorage.setItem('kaelumFired_' + today(), JSON.stringify(f)); }
let audioCtx;
function beep(times = 3) {
  if (!S.notif.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + i * 0.45;
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      o.start(t0); o.stop(t0 + 0.4);
    }
  } catch (e) { }
}
async function notify(title, body) {
  toast(title + ' — ' + body);
  beep(2);
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: title + body, vibrate: [200, 100, 200] });
    else new Notification(title, { body, icon: 'icons/icon-192.png' });
  } catch (e) { }
}
let alarmTimer = null;
function ringAlarm(title) {
  openSheet('<div class="alarm"><div class="big">⏰</div><h2>' + esc(title) + '</h2><p class="mute">' + nowHM() + '</p><button class="btn full" data-a="stopAlarm">Arrêter</button></div>');
  beep(4); if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  clearInterval(alarmTimer); let n = 0;
  alarmTimer = setInterval(() => { beep(4); if (navigator.vibrate) navigator.vibrate([400, 200, 400]); if (++n > 20) clearInterval(alarmTimer); }, 3000);
}
const catOn = c => ({ event: S.notif.events, wakeEv: S.notif.wake, med: S.notif.meds, school: S.notif.school, sleep: S.notif.sleep, wake: S.notif.wake, prayer: S.notif.prayer, fast: S.notif.fast, bday: true, vaccin: true, cycle: true })[c];
function tick() {
  if (!S.owner || locked) return;
  const D = today(), now = toMin(nowHM()), fired = firedGet();
  for (const it of dayItems(D)) {
    if (!catOn(it.cat) || it.quiet) continue;
    if (!it.time) { // rappel journée à 8h
      if (now >= 480 && now <= 485 && !fired[it.key]) { notify(it.title, pname(it.who)); firedSet(it.key); }
      continue;
    }
    if (it.alarm < 0) continue;
    const at = toMin(it.time) - (it.alarm || 0);
    if (now >= at && now <= at + 2 && !fired[it.key]) {
      firedSet(it.key);
      if (it.cat === 'med' && medTaken(D, it.med.id, it.med.t)) continue;
      if (it.cat === 'wake' || it.cat === 'wakeEv') { ringAlarm(it.title + (it.who && it.who !== 'all' ? ' — ' + pname(it.who) : '')); if (document.hidden) notify(it.title, 'C\'est l\'heure !'); continue; }
      const when = it.alarm > 0 ? 'Dans ' + it.alarm + ' min (' + it.time + ')' : 'Maintenant (' + it.time + ')';
      notify(it.title, when + ' — ' + pname(it.who));
    }
  }
  // rappels « la veille » (1440 min) et rappels avant minuit
  for (const it of dayItems(addDays(D, 1))) {
    if (!it.time || !catOn(it.cat) || it.quiet || !(it.alarm > 0)) continue;
    const at = toMin(it.time) - it.alarm + 1440;
    if (at < 1440 && now >= at && now <= at + 2 && !fired[it.key]) { firedSet(it.key); notify(it.title, (it.alarm >= 1440 ? 'Demain à ' : 'Dans ' + it.alarm + ' min, à ') + it.time + ' — ' + pname(it.who)); }
  }
  checkRdvAlarms();
  checkRain();
}

/* ---------- UI de base ---------- */
let view = 'accueil', sub = '', selDay = today(), weekStart = null, filter = 'all', healthTab = 'meds', cycMonth = null, crDay = today();
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add('hidden'), 4500); }
function openSheet(html) { $('#sheet').innerHTML = html; $('#modal').classList.remove('hidden'); }
function closeSheet() { $('#modal').classList.add('hidden'); $('#sheet').innerHTML = ''; clearInterval(alarmTimer); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeSheet(); });

function personOpts(withAll = true, withKids = true) {
  const o = []; if (withAll) o.push(['all', 'Toute la famille']); if (withKids) o.push(['kids', 'Les filles']);
  for (const p of S.people) o.push([p.id, p.name]); return o;
}
// Formulaire générique
let formCtx = null;
function form(title, fields, val, onSave, onDel) {
  formCtx = { fields, onSave, onDel };
  let h = '<h2>' + esc(title) + '</h2>';
  for (const f of fields) {
    const v = val[f.k] ?? f.def ?? '';
    h += '<div class="f"' + (f.hide ? ' style="display:none"' : '') + ' id="fw_' + f.k + '"><label>' + esc(f.label) + '</label>';
    if (f.type === 'select') h += '<select id="f_' + f.k + '">' + f.options.map(([a, b]) => '<option value="' + esc(a) + '"' + (String(v) === String(a) ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select>';
    else if (f.type === 'textarea') h += '<textarea id="f_' + f.k + '">' + esc(v) + '</textarea>';
    else if (f.type === 'days') h += '<div class="row wrap" id="f_' + f.k + '">' + [1, 2, 3, 4, 5, 6, 0].map(d => '<button type="button" class="chip' + ((v || []).includes(d) ? ' on' : '') + '" data-a="togChip" data-d="' + d + '">' + J3[d] + '</button>').join('') + '</div>';
    else if (f.type === 'checkbox') h += '<input type="checkbox" id="f_' + f.k + '"' + (v ? ' checked' : '') + '>';
    else h += '<input id="f_' + f.k + '" type="' + (f.type || 'text') + '" value="' + esc(Array.isArray(v) ? v.join(', ') : v) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + '>';
    if (f.help) h += '<div class="mute" style="margin-top:4px">' + esc(f.help) + '</div>';
    h += '</div>';
  }
  h += '<div class="row" style="gap:10px;margin-top:6px"><button class="btn full" data-a="formSave">Enregistrer</button></div>';
  h += '<div class="row" style="gap:10px;margin-top:8px">' + (onDel ? '<button class="btn bad full" data-a="formDel">Supprimer</button>' : '') + '<button class="btn sec full" data-a="close">Annuler</button></div>';
  openSheet(h);
}
function formRead() {
  const out = {};
  for (const f of formCtx.fields) {
    const el = $('#f_' + f.k);
    if (f.type === 'days') out[f.k] = [...el.querySelectorAll('.chip.on')].map(b => Number(b.dataset.d));
    else if (f.type === 'checkbox') out[f.k] = el.checked;
    else if (f.type === 'number') out[f.k] = el.value === '' ? '' : Number(el.value);
    else out[f.k] = el.value.trim();
  }
  return out;
}

/* ---------- Écrans ---------- */
function render() {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
  $('#hdrSub').textContent = fmtLong(today()) + (S.owner ? ' · ' + pname(S.owner) : '');
  const fn = { accueil: vAccueil, planning: vPlanning, repas: vRepas, sante: vSante, plus: vPlus }[view] || vAccueil;
  $('#main').innerHTML = fn();
  window.scrollTo(0, 0);
}
function itemRow(it, D, showDone = true) {
  const done = it.cat === 'med' && medTaken(D, it.med.id, it.med.t);
  const isPast = D === today() && it.time && toMin(it.time) < toMin(nowHM());
  let h = '<li class="item' + (done ? ' done' : '') + '"' + (isPast && !done && it.cat !== 'med' ? ' style="opacity:.6"' : '') + '>';
  h += '<div class="t">' + (it.time || '—') + (it.ev && it.ev.end ? '<div class="mute" style="font-weight:400;font-size:12px">' + it.ev.end + (toMin(it.ev.end) < toMin(it.ev.time) ? ' +1j' : '') + '</div>' : '') + '</div><div class="body"' + (it.ev ? ' data-a="editEvent" data-id="' + it.ev.id + '"' : '') + '>';
  h += '<div>' + esc(it.title) + '</div><div class="who">' + whoMark(it.who) + ' ' + esc(pname(it.who)) + (it.notes ? ' · ' + esc(it.notes) : '') + '</div></div>';
  if (it.cat === 'med' && showDone) h += '<button class="chk' + (done ? ' on' : '') + '" data-a="medTake" data-d="' + D + '" data-id="' + it.med.id + '" data-t="' + it.med.t + '">' + (done ? '✓' : '') + '</button>';
  return h + '</li>';
}
function prayerCard(D) {
  const p = prayers(D), now = toMin(nowHM());
  const ks = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let next = ks.find(k => k !== 'sunrise' && toMin(p[k]) > now) || '';
  return '<div class="card"><h2>🕌 Prières — Montpellier <span class="pill">' + (S.prayer.method === 'uoif' ? 'UOIF 12°' : PrayerCalc.METHODS[S.prayer.method].name.replace(/.*\(|\)/g, '')) + '</span></h2><div class="prayers">' +
    ks.map(k => '<div class="' + (k === next && D === today() ? 'next' : '') + '"><small>' + PNAMES[k] + '</small><b>' + p[k] + '</b></div>').join('') + '</div></div>';
}
function fastCard(D) {
  const wp = wifeInPeriod(D);
  const p = prayers(D), now = toMin(nowHM()), a = toMin(p.fajr), b = toMin(p.maghrib);
  if (!isFast(D)) {
    return '<div class="card"><div class="row sp"><div><b>🌙 Jeûne de ' + esc(pname(S.fast.person)) + '</b><div class="mute">Pas de jeûne prévu aujourd\'hui</div></div>' +
      (D === today() ? '<button class="btn sm sec" data-a="fastToday">Je jeûne aujourd\'hui</button>' : '') + '</div></div>';
  }
  if (wp) return '<div class="card"><b>🌸 Jeûne suspendu</b><div class="mute">Période de règles en cours — le jeûne reprend après.</div></div>';
  let txt, pct = 0;
  if (now < a) txt = 'Le jeûne commence à ' + p.fajr + ' (Sobh). Shour avant ' + addMin(p.fajr, -10) + '.';
  else if (now < b) { const left = b - now; pct = Math.round((now - a) / (b - a) * 100); txt = 'Rupture à ' + p.maghrib + ' — encore ' + Math.floor(left / 60) + ' h ' + pad(left % 60) + '.'; }
  else { pct = 100; txt = 'Jeûne terminé à ' + p.maghrib + '. Saha ftourek ! 🤍'; }
  return '<div class="card fast"><div class="row sp"><b>🌙 Jour de jeûne — ' + esc(pname(S.fast.person)) + '</b>' + (D === today() ? '<button class="btn sm sec" data-a="fastCancel">Annuler</button>' : '') + '</div>' +
    '<div class="mute" style="margin-top:4px">Du Sobh ' + p.fajr + ' au Maghreb ' + p.maghrib + '</div><div style="margin-top:6px">' + txt + '</div><div class="bar"><i style="width:' + pct + '%"></i></div></div>';
}
function weatherCard(full) {
  if (!WX || !WX.current) return '<div class="card"><h2>🌦️ Météo Lattes</h2><div class="mute">' + (navigator.onLine ? 'Chargement…' : 'Pas de connexion : la météo s\'affichera dès que le téléphone aura internet.') + '</div></div>';
  const c = WX.current, w = WMO(c.weather_code), age = Math.round((Date.now() - WX.at) / 60000);
  let h = '<div class="card"><h2>🌦️ Météo Lattes 34970 <span class="mute">' + (age < 2 ? 'à l\'instant' : age < 120 ? 'il y a ' + age + ' min' : 'il y a ' + Math.round(age / 60) + ' h') + '</span></h2>';
  h += '<div class="wx"><div class="big">' + w[0] + '</div><div><div class="temp">' + Math.round(c.temperature_2m) + '°C</div><div class="mute">' + w[1] + ' · vent ' + Math.round(c.wind_speed_10m) + ' km/h</div></div></div>';
  const d = WX.daily;
  h += '<div class="days">' + d.time.slice(0, full ? 7 : 4).map((t, i) => {
    const ww = WMO(d.weather_code[i]), r = d.precipitation_probability_max[i] >= 50;
    return '<div class="' + (r ? 'r' : '') + '"><b>' + (i === 0 ? 'Auj.' : J3[parseD(t).getDay()]) + '</b><div style="font-size:20px">' + ww[0] + '</div>' + Math.round(d.temperature_2m_min[i]) + '° / ' + Math.round(d.temperature_2m_max[i]) + '°<br>💧' + (d.precipitation_probability_max[i] ?? 0) + ' %</div>';
  }).join('') + '</div>';
  if (full && WX.hourly) {
    const hh = WX.hourly, nk = ymd(new Date()) + 'T' + pad(new Date().getHours()) + ':00', s = Math.max(0, hh.time.indexOf(nk));
    h += '<h3>Prochaines heures</h3><div class="days">' + hh.time.slice(s, s + 12).map((t, j) => { const i = s + j, ww = WMO(hh.weather_code[i]); return '<div class="' + (hh.precipitation_probability[i] >= 50 ? 'r' : '') + '"><b>' + t.slice(11, 13) + 'h</b><div style="font-size:18px">' + ww[0] + '</div>' + Math.round(hh.temperature_2m[i]) + '°<br>💧' + (hh.precipitation_probability[i] ?? 0) + '%</div>'; }).join('') + '</div>';
  }
  return h + '</div>';
}
function vAccueil() {
  const D = today();
  const hr = new Date().getHours(), hello = hr < 5 ? 'Bonne nuit' : hr < 12 ? 'Bonjour' : hr < 18 ? 'Bon après-midi' : 'Bonsoir';
  const hero = heroSrc();
  let h = '<div class="hero">' + (hero ? '<img src="' + hero + '" alt="La famille" data-a="heroPick">' : '<div class="heroph" data-a="heroPick" style="cursor:pointer"><span style="display:block;text-align:center;font-size:64px">📷<small style="display:block;font:800 16px var(--sans);color:var(--deep);margin-top:8px">Touchez pour ajouter<br>notre photo de famille</small></span></div>') + '<div><span class="greet">' + hello + ' ' + esc(pname(S.owner)) + ' ' + (hr >= 18 || hr < 5 ? '🌙' : '☀️') + '</span><b>Rozane et Rochane Family</b>' + (S.people.some(p => avSrc(p.id)) ? '<span class="avrow">' + S.people.map(p => '<span data-a="avPick" data-id="' + p.id + '">' + avatar(p.id, 50) + '<small>' + esc(p.name) + '</small></span>').join('') + '</span>' : '<span>' + S.people.map(p => esc(p.name)).join(' · ') + '</span>') + '</div></div>';
  h += papaCard();
  if (!S.school.set) h += '<div class="banner warn row sp" data-a="go" data-v="plus" data-s="reglages"><span>🎒 Règle les horaires crèche / école et le réveil</span><span>›</span></div>';
  if (!('Notification' in window) || Notification.permission !== 'granted') h += '<div class="banner info row sp"><span>🔔 Active les notifications pour les rappels</span><button class="btn sm" data-a="askNotif">Activer</button></div>';
  const r = rainSoon(), rt = rainTomorrow();
  if (r) h += '<div class="banner rain">🌧️ ' + (r.now ? 'Il pleut / va pleuvoir maintenant à Lattes' : 'Pluie prévue vers ' + r.hour + ' à Lattes') + (r.prob != null ? ' (' + r.prob + ' %)' : '') + ' — prends un parapluie !</div>';
  else if (rt) h += '<div class="banner rain">🌧️ Demain : pluie probable à Lattes (' + rt.prob + ' %)</div>';
  if (isFast(D) || S.fast.person) h += fastCard(D);
  if (S.prayer.show) h += prayerCard(D);
  const items = dayItems(D).filter(i => i.cat !== 'prayer');
  const now = toMin(nowHM());
  const upcoming = items.filter(i => !i.time || toMin(i.time) >= now - 30 || (i.cat === 'med' && !medTaken(D, i.med.id, i.med.t)));
  h += '<div class="card"><h2>📋 Aujourd\'hui <button class="btn sm sec" data-a="go" data-v="planning">Tout voir</button></h2>';
  h += upcoming.length ? '<ul class="list">' + upcoming.map(i => itemRow(i, D)).join('') + '</ul>' : '<div class="empty">Rien de prévu pour la suite de la journée 🎉</div>';
  h += '</div>';
  if (cycleVisible()) {
    const ci = cycleInfo();
    if (ci.last) h += '<div class="card" data-a="go" data-v="sante" data-h="cycle"><div class="row sp"><b>🌸 Cycle de ' + esc(pname('maman')) + '</b><span class="pill">Jour ' + ci.day + '</span></div><div class="mute">' +
      (ci.inPeriod ? 'Règles en cours' : 'Prochaines règles : ' + fmtLong(ci.next) + ' (dans ' + diffDays(D, ci.next) + ' j)') + '</div></div>';
  }
  h += '<div class="card"><h2>🍽️ Menu du jour <button class="btn sm sec" data-a="go" data-v="repas">Semaine</button></h2>' + mealsHTML(D) + '</div>';
  h += weatherCard(false);
  const bd = nextBirthdays().slice(0, 2);
  if (bd.length) h += '<div class="card"><h2>🎂 Prochains anniversaires</h2>' + bd.map(b => '<div class="row sp" style="padding:4px 0"><span>' + esc(b.name) + '</span><span class="mute">' + fmtLong(b.when) + ' · dans ' + b.days + ' j</span></div>').join('') + '</div>';
  h += '<div class="credit">Rozane et Rochane Family · Créé par Rochdi MECHETI</div>';
  return h;
}
function papaCard() {
  const D = today(), now = nowHM();
  const evs = S.events.filter(e => e.src && (e.date > D || (e.date === D && ((e.end && toMin(e.end) < toMin(e.time)) || (e.end || e.time) >= now))))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const yest = S.events.find(e => e.src && e.date === addDays(D, -1) && e.end && toMin(e.end) < toMin(e.time) && now < e.end);
  let h = '<div class="card papa"><h2>🛡️ Planning de ' + esc(pname('papa')) + ' <button class="btn sm sec" data-a="papaAll">Tout voir</button></h2>';
  if (!S.events.some(e => e.src)) return h + '<div class="empty">' + (navigator.onLine ? 'Chargement du planning…' : 'Connecte-toi à internet une fois pour recevoir le planning') + '</div></div>';
  if (yest) h += '<div class="banner info" style="margin-bottom:8px">🌙 En poste de nuit jusqu\'à ' + yest.end + '</div>';
  const lab = d => d === D ? 'Auj.' : d === addDays(D, 1) ? 'Demain' : J3[parseD(d).getDay()] + ' ' + parseD(d).getDate();
  h += evs.length ? evs.slice(0, 5).map(e => '<div class="item"><div class="t" style="min-width:86px;font-size:13px">' + lab(e.date) + '<div class="mute" style="font-weight:700">' + e.time + (e.end ? '–' + e.end : '') + '</div></div><div class="body">' + (CATS[e.cat] || CATS.autre)[0] + ' ' + esc(e.title) + (e.notes ? '<div class="who">' + esc(e.notes) + '</div>' : '') + '</div></div>').join('') : '<div class="empty">Plus rien de prévu ce mois-ci</div>';
  return h + '<div class="row" style="gap:8px;margin-top:10px"><button class="btn sm full" data-a="planPdf">📄 PDF</button><button class="btn sm sec full" data-a="planIcs">📲 Mon agenda</button></div></div>';
}
function mealsHTML(D) {
  let h = '';
  for (const [k, l] of SLOTS) {
    let txt = menuFor(D, k);
    if (k === 'collation' && hasSport(D)) txt += ' · 🏃 avant le sport : banane + eau ; après : lait + barre de céréales';
    h += '<div class="meal"><div class="lab">' + l + '</div><div class="txt" data-a="editMeal" data-d="' + D + '" data-s="' + k + '">' + esc(txt) + '</div></div>';
  }
  if (isFast(D) && !wifeInPeriod(D)) {
    const p = prayers(D);
    h += '<div class="meal"><div class="lab">🌙 Shour<br><small class="mute">avant ' + p.fajr + '</small></div><div class="txt" data-a="editMeal" data-d="' + D + '" data-s="shour">' + esc(menuFor(D, 'shour')) + '</div></div>';
    h += '<div class="meal"><div class="lab">🌇 Iftar<br><small class="mute">' + p.maghrib + '</small></div><div class="txt" data-a="editMeal" data-d="' + D + '" data-s="iftar">' + esc(menuFor(D, 'iftar')) + '</div></div>';
  }
  return h;
}
function nextBirthdays() {
  const D = today(), y = Number(D.slice(0, 4));
  return S.birthdays.map(b => {
    let when = y + '-' + b.date.slice(-5); if (when < D) when = (y + 1) + '-' + b.date.slice(-5);
    return { ...b, when, days: diffDays(D, when) };
  }).sort((a, b) => a.days - b.days);
}
function vPlanning() {
  if (!weekStart) { const d = parseD(selDay); const off = (d.getDay() + 6) % 7; weekStart = addDays(selDay, -off); }
  let h = '<div class="row sp" style="margin-bottom:8px"><button class="btn sm sec" data-a="wk" data-n="-7">◀</button><b>' + fmtShort(weekStart) + ' → ' + fmtShort(addDays(weekStart, 6)) + '</b><button class="btn sm sec" data-a="wk" data-n="7">▶</button></div>';
  h += '<div class="week">' + [0, 1, 2, 3, 4, 5, 6].map(i => { const D = addDays(weekStart, i), d = parseD(D); return '<button class="' + (D === selDay ? 'on ' : '') + (D === today() ? 'today' : '') + '" data-a="selDay" data-d="' + D + '">' + J3[d.getDay()] + '<b>' + d.getDate() + '</b></button>'; }).join('') + '</div>';
  h += '<div class="row wrap" style="margin-bottom:10px">' + [['all', 'Tous']].concat(S.people.map(p => [p.id, p.name])).map(([id, n]) => '<button class="chip' + (filter === id ? ' on' : '') + '" data-a="filter" data-id="' + id + '">' + (id !== 'all' ? avatar(id) : '') + esc(n) + '</button>').join('') + '</div>';
  if (filter === 'papa' && S.famKey) h += '<div class="row" style="gap:8px;margin-bottom:12px"><button class="btn sm full" data-a="planPdf">📄 PDF du planning</button><button class="btn sm sec full" data-a="planIcs">📲 Dans mon agenda</button></div>';
  const items = dayItems(selDay).filter(i => whoMatch(i.who, filter));
  h += '<div class="card"><h2>' + fmtLong(selDay) + (selDay === today() ? ' <span class="pill">Aujourd\'hui</span>' : '') + '</h2>';
  h += items.length ? '<ul class="list">' + items.map(i => itemRow(i, selDay)).join('') + '</ul>' : '<div class="empty">Rien de prévu</div>';
  h += '</div>';
  h += '<div class="mute" style="text-align:center;margin-bottom:70px">Touchez un événement pour le modifier. Le bouton + ajoute un RDV, une sortie, un sport, un voyage, un réveil ou un rappel.</div>';
  h += '<button class="fab" data-a="addEvent">+</button>';
  return h;
}
function vRepas() {
  const s = today();
  let h = '<div class="seg"><button class="' + (repasTab === 'courses' ? 'on' : '') + '" data-a="rtab" data-t="courses">🛒 Courses</button><button class="' + (repasTab === 'menus' ? 'on' : '') + '" data-a="rtab" data-t="menus">🍽️ Menus</button></div>';
  if (repasTab === 'courses') return h + vCourses();
  h += '<div class="banner info">Touchez un plat pour le modifier. « Changer » propose un autre menu pour la journée.</div>';
  h += '<div class="banner warn">👶 Pour les petites : pas de miel avant 1 an, pas de fruits à coque entiers (cacahuètes, amandes…) avant 5 ans, aliments mixés ou écrasés selon l\'âge. Demandez conseil au pédiatre pour la diversification.</div>';
  for (let i = 0; i < 7; i++) {
    const D = addDays(s, i);
    h += '<div class="card"><h2>' + (i === 0 ? 'Aujourd\'hui' : fmtLong(D)) + (isFast(D) ? ' <span class="pill">🌙 jeûne</span>' : '') + ' <button class="btn sm sec" data-a="regenMenu" data-d="' + D + '">🔄 Changer</button></h2>' + mealsHTML(D) + '</div>';
  }
  return h;
}

/* ---- Santé ---- */
function vSante() {
  const tabs = [['meds', '💊 Traitements'], ['vac', '💉 Vaccins']]; if (cycleVisible()) tabs.push(['cycle', '🌸 Cycle']);
  if (!tabs.find(t => t[0] === healthTab)) healthTab = 'meds';
  let h = '<div class="seg">' + tabs.map(([k, l]) => '<button class="' + (healthTab === k ? 'on' : '') + '" data-a="htab" data-h="' + k + '">' + l + '</button>').join('') + '</div>';
  if (healthTab === 'meds') h += vMeds(); else if (healthTab === 'vac') h += vVac(); else h += vCycle();
  return h;
}
function vMeds() {
  const D = today();
  let h = '<div class="card"><h2>Prises du jour</h2>';
  const it = dayItems(D).filter(i => i.cat === 'med');
  h += it.length ? '<ul class="list">' + it.map(i => itemRow(i, D)).join('') + '</ul>' : '<div class="empty">Aucun traitement aujourd\'hui</div>';
  h += '</div><div class="card"><h2>Traitements <button class="btn sm" data-a="addMed">+ Ajouter</button></h2>';
  if (!S.meds.length) h += '<div class="empty">Ajoutez les traitements de chacun : nom, dose, heures de prise, durée.</div>';
  for (const m of S.meds) {
    const active = (!m.end || m.end >= D);
    h += '<div class="item" data-a="editMed" data-id="' + m.id + '">' + avatar(m.person, 30) + '<div class="body"><b>' + esc(m.name) + '</b> ' + esc(m.dose || '') +
      '<div class="who">' + esc(pname(m.person)) + ' · ' + (m.times || []).join(', ') + (m.end ? ' · jusqu\'au ' + fmtShort(m.end) : '') + (active ? '' : ' · terminé') + '</div>' + (m.notes ? '<div class="mute">' + esc(m.notes) + '</div>' : '') + '</div></div>';
  }
  return h + '</div><div class="mute" style="text-align:center">Suivez toujours l\'ordonnance et l\'avis du médecin ou du pharmacien.</div>';
}
const VAC_REF = [
  ['2 mois', 'Diphtérie-tétanos-polio-coqueluche-Hib-hépatite B (hexavalent) + pneumocoque'],
  ['3 mois', 'Méningocoque B'], ['4 mois', 'Hexavalent + pneumocoque'], ['5 mois', 'Méningocoque B'], ['6 mois', 'Méningocoques ACWY'],
  ['11 mois', 'Hexavalent + pneumocoque'], ['12 mois', 'ROR (rougeole-oreillons-rubéole) + méningocoques ACWY + méningocoque B'],
  ['16-18 mois', 'ROR 2e dose'], ['6 ans', 'Rappel diphtérie-tétanos-coqueluche-polio'],
  ['11-13 ans', 'Rappel dTcaP-polio + HPV (papillomavirus, 2 doses) ; méningocoques ACWY recommandé 11-14 ans']
];
const VAC_GEN = [[2, 'Hexavalent (DTCaP-Hib-HepB) 1re dose'], [2, 'Pneumocoque 1re dose'], [3, 'Méningocoque B 1re dose'], [4, 'Hexavalent 2e dose'], [4, 'Pneumocoque 2e dose'],
  [5, 'Méningocoque B 2e dose'], [6, 'Méningocoques ACWY 1re dose'], [11, 'Hexavalent rappel'], [11, 'Pneumocoque rappel'], [12, 'ROR 1re dose'], [12, 'Méningocoques ACWY rappel'],
  [12, 'Méningocoque B rappel'], [16, 'ROR 2e dose'], [72, 'Rappel DTCaP-polio (6 ans)'], [132, 'Rappel dTcaP-polio (11 ans)'], [132, 'HPV (11 ans)']];
function vVac() {
  let h = '<div class="card"><h2>Carnet de vaccins <button class="btn sm" data-a="addVac">+ Ajouter</button></h2>';
  if (!S.vaccines.length) h += '<div class="empty">Notez chaque vaccin fait et la date du prochain rappel : un rappel s\'affichera 7 jours avant et le jour J.</div>';
  for (const p of S.people) {
    const vs = S.vaccines.filter(v => v.person === p.id).sort((a, b) => (b.done || '').localeCompare(a.done || ''));
    if (!vs.length) continue;
    h += '<h3 class="row">' + avatar(p.id, 26) + ' ' + esc(p.name) + '</h3>';
    for (const v of vs.sort((a, b) => (a.next || a.done || '').localeCompare(b.next || b.done || ''))) h += '<div class="item' + (v.done ? ' done' : '') + '"><div class="body" data-a="editVac" data-id="' + v.id + '"><b>' + esc(v.name) + '</b><div class="who">' + (v.done ? 'Fait le ' + fmtShort(v.done) : 'Prévu le <b>' + (v.next ? fmtShort(v.next) + ' ' + v.next.slice(0, 4) : '?') + '</b>') + (v.notes ? ' · ' + esc(v.notes) : '') + '</div></div><button class="chk' + (v.done ? ' on' : '') + '" data-a="vacDone" data-id="' + v.id + '">' + (v.done ? '✓' : '') + '</button></div>';
  }
  const kidsB = S.people.filter(p => S.kids.includes(p.id));
  h += '<h3>Calendrier automatique</h3><div class="mute" style="margin-bottom:6px">Avec la date de naissance (Réglages → Famille), l\'appli crée les dates des vaccins du calendrier 2026. Vérifiez avec le carnet de santé et cochez ceux déjà faits.</div><div class="row wrap" style="gap:8px">' +
    kidsB.map(p => '<button class="btn sm sec" data-a="vacGen" data-id="' + p.id + '">Générer pour ' + esc(p.name) + '</button>').join('') + '</div>';
  h += '</div><div class="card"><h2>Repères du calendrier vaccinal 2026</h2><div class="mute" style="margin-bottom:8px">Obligatoires pour les nourrissons ; ACWY et B pour les enfants nés depuis 2023. Le carnet de santé et le médecin font foi.</div>';
  h += VAC_REF.map(([a, b]) => '<div class="item"><div class="t" style="min-width:78px">' + a + '</div><div class="body">' + b + '</div></div>').join('');
  return h + '</div>';
}
function vCycle() {
  const D = today(), ci = cycleInfo();
  let h = '<div class="card"><div class="cyc">';
  if (ci.last) {
    const p = Math.min(100, Math.round(ci.day / ci.avg * 100));
    h += '<div class="ring" style="--p:' + p + '%"><b>' + ci.day + '</b><small class="mute">jour</small></div><div>';
    h += ci.inPeriod ? '<b>🌸 Règles en cours</b><div class="mute">Depuis le ' + fmtShort(ci.last.start) + '</div>' : '<b>Prochaines règles</b><div>' + fmtLong(ci.next) + '</div><div class="mute">dans ' + diffDays(D, ci.next) + ' jours</div>';
    h += '<div class="mute" style="margin-top:4px">Cycle moyen ' + ci.avg + ' j · règles ' + ci.plen + ' j</div>';
    if (!ci.inPeriod && D <= ci.fertEnd) h += '<div class="mute">Fenêtre fertile estimée : ' + fmtShort(ci.fertStart) + ' → ' + fmtShort(ci.fertEnd) + '</div>';
    h += '</div>';
  } else h += '<div><b>Bienvenue 🌸</b><div class="mute">Notez le premier jour de vos dernières règles pour lancer les prévisions.</div></div>';
  h += '</div><div class="row" style="gap:8px;margin-top:12px">';
  h += ci.openPeriod ? '<button class="btn full" data-a="perEnd">Fin des règles aujourd\'hui</button>' : '<button class="btn full" data-a="perStart">Règles aujourd\'hui</button>';
  h += '<button class="btn sec full" data-a="perPast">Autre date</button></div></div>';
  // Journal du jour
  const lg = S.cycle.logs[D] || {};
  const SYM = ['Crampes', 'Fatigue', 'Maux de tête', 'Ballonnements', 'Seins sensibles', 'Mal de dos', 'Nausées', 'Acné', 'Irritable', 'Triste', 'En forme', 'Fringales'];
  h += '<div class="card"><h2>Aujourd\'hui</h2><div class="mute">Flux</div><div class="row wrap" style="margin:6px 0 10px">' + ['Aucun', 'Léger', 'Moyen', 'Abondant'].map(f => '<button class="chip' + (lg.flow === f ? ' on' : '') + '" data-a="cycFlow" data-f="' + f + '">' + f + '</button>').join('') + '</div>';
  h += '<div class="mute">Symptômes & humeur</div><div class="row wrap" style="margin-top:6px">' + SYM.map(s => '<button class="chip' + ((lg.sym || []).includes(s) ? ' on' : '') + '" data-a="cycSym" data-s="' + s + '">' + s + '</button>').join('') + '</div>';
  h += '<div class="f" style="margin-top:10px"><label>Note</label><textarea id="cycNote" data-a-change="cycNote">' + esc(lg.note || '') + '</textarea></div></div>';
  // Calendrier
  if (!cycMonth) cycMonth = D.slice(0, 7) + '-01';
  const m0 = parseD(cycMonth), first = (m0.getDay() + 6) % 7, nd = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
  h += '<div class="card"><div class="row sp" style="margin-bottom:8px"><button class="btn sm sec" data-a="cycM" data-n="-1">◀</button><b>' + MOIS[m0.getMonth()] + ' ' + m0.getFullYear() + '</b><button class="btn sm sec" data-a="cycM" data-n="1">▶</button></div><div class="cal">';
  h += ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => '<div class="h">' + x + '</div>').join('') + '<div></div>'.repeat(first);
  for (let i = 1; i <= nd; i++) { const dd = cycMonth.slice(0, 8) + pad(i), st = dayCycleState(dd); h += '<div class="d ' + st + (dd === D ? ' tod' : '') + '">' + i + '</div>'; }
  h += '</div><div class="row wrap mute" style="margin-top:10px;gap:12px"><span><span class="dot" style="background:var(--bad)"></span> Règles</span><span><span class="dot" style="background:#f7c9d3"></span> Prévues</span><span><span class="dot" style="background:#d6e8ff"></span> Fenêtre fertile</span></div></div>';
  // Historique
  const ps = [...S.cycle.periods].sort((a, b) => b.start.localeCompare(a.start));
  h += '<div class="card"><h2>Historique</h2>' + (ps.length ? ps.slice(0, 12).map((p, i) => { const nx = ps[i - 1]; return '<div class="item" data-a="editPer" data-id="' + p.id + '"><div class="body"><b>' + fmtShort(p.start) + (p.end ? ' → ' + fmtShort(p.end) : ' → en cours') + '</b><div class="who">' + (p.end ? (diffDays(p.start, p.end) + 1) + ' jours de règles' : '') + (nx ? ' · cycle de ' + diffDays(p.start, nx.start) + ' j' : '') + '</div></div></div>'; }).join('') : '<div class="empty">Aucune donnée</div>') + '</div>';
  h += '<div class="mute" style="text-align:center">Prévisions indicatives — ce n\'est pas une méthode de contraception. Données privées, gardées uniquement sur ce téléphone.</div>';
  return h;
}

/* ---- Plus ---- */
function vPlus() {
  if (sub === 'prieres') return vPrieres();
  if (sub === 'photos') return vPhotos();
  if (sub === 'anniv') return vAnniv();
  if (sub === 'cr') return vCR();
  if (sub === 'meteo') return '<button class="btn sm sec" data-a="go" data-v="plus" style="margin-bottom:10px">← Retour</button>' + weatherCard(true);
  if (sub === 'reglages') return vReglages();
  const tiles = [['papa', '🛡️', 'Planning de ' + esc(pname('papa'))], ['prieres', '🕌', 'Prières & jeûne'], ['cr', '📝', 'Compte rendu'], ['photos', '📸', 'Photos'], ['anniv', '🎂', 'Anniversaires'], ['meteo', '🌦️', 'Météo Lattes'], ['reglages', '⚙️', 'Réglages'], ['ics', '📲', 'Ajouter à l\'agenda du téléphone'], ['backup', '💾', 'Sauvegarde']];
  return '<div class="grid2">' + tiles.map(([k, i, l]) => '<button class="tile" data-a="' + (k === 'ics' ? 'icsMenu' : k === 'backup' ? 'backupMenu' : k === 'papa' ? 'papaAll' : 'go') + '" data-v="plus" data-s="' + k + '"><span>' + i + '</span>' + l + '</button>').join('') + '</div><div class="credit">Rozane et Rochane Family · Créé par Rochdi MECHETI</div>';
}
function back() { return '<button class="btn sm sec" data-a="go" data-v="plus" style="margin-bottom:10px">← Retour</button>'; }
function vPrieres() {
  let h = back() + fastCard(today()) + prayerCard(today());
  h += '<div class="card"><h2>Jours de jeûne de ' + esc(pname(S.fast.person)) + '</h2><div class="mute" style="margin-bottom:8px">Jeûne du Sobh (Fajr) au Maghreb, horaires de Montpellier.</div>';
  h += '<div class="mute">Chaque semaine :</div><div class="row wrap" style="margin:6px 0 10px">' + [1, 2, 3, 4, 5, 6, 0].map(d => '<button class="chip' + (S.fast.weekdays.includes(d) ? ' on' : '') + '" data-a="fastWd" data-d="' + d + '">' + J3[d] + '</button>').join('') + '</div>';
  h += '<div class="row wrap" style="gap:8px"><button class="btn sm sec" data-a="fastPreset" data-p="lj">Lundi + jeudi</button><button class="btn sm sec" data-a="fastPreset" data-p="all">Tous les jours</button><button class="btn sm sec" data-a="fastPreset" data-p="none">Aucun</button><button class="btn sm" data-a="fastRange">+ Période (ex. Ramadan)</button></div>';
  const fut = S.fast.dates.filter(d => d >= today()).sort();
  if (fut.length) h += '<div class="mute" style="margin-top:10px">Dates ajoutées : ' + fut.length + ' jour(s), du ' + fmtShort(fut[0]) + ' au ' + fmtShort(fut[fut.length - 1]) + ' <button class="btn sm sec" data-a="fastClear">Effacer</button></div>';
  h += '</div>';
  const s = today();
  h += '<div class="card"><h2>Horaires des 30 prochains jours</h2><table class="pt"><tr><th>Jour</th><th>Sobh</th><th>Lever</th><th>Dhohr</th><th>Asr</th><th>Magh.</th><th>Icha</th></tr>';
  for (let i = 0; i < 30; i++) { const D = addDays(s, i), p = prayers(D), d = parseD(D); h += '<tr class="' + (i === 0 ? 'tod' : '') + '"><td>' + J3[d.getDay()] + ' ' + d.getDate() + (isFast(D) ? '🌙' : '') + '</td><td>' + p.fajr + '</td><td>' + p.sunrise + '</td><td>' + p.dhuhr + '</td><td>' + p.asr + '</td><td>' + p.maghrib + '</td><td>' + p.isha + '</td></tr>'; }
  h += '</table><div class="mute" style="margin-top:8px">Calcul astronomique pour Montpellier. Comparez une fois avec l\'horaire de votre mosquée et ajustez dans Réglages → Prières si besoin.</div></div>';
  return h;
}
function vAnniv() {
  let h = back() + '<div class="card"><h2>🎂 Anniversaires <button class="btn sm" data-a="addBd">+ Ajouter</button></h2>';
  const l = nextBirthdays();
  h += l.length ? l.map(b => '<div class="item" data-a="editBd" data-id="' + b.id + '"><div class="body"><b>' + esc(b.name) + '</b><div class="who">' + fmtLong(b.when) + (b.date.length === 10 ? ' · ' + (Number(b.when.slice(0, 4)) - Number(b.date.slice(0, 4))) + ' ans' : '') + '</div></div><span class="pill">' + (b.days === 0 ? 'Aujourd\'hui 🎉' : 'J-' + b.days) + '</span></div>').join('') : '<div class="empty">Aucun anniversaire</div>';
  return h + '</div><div class="mute" style="text-align:center">Rappel 7 jours avant et le jour J à 8 h.</div>';
}
function vCR() {
  const D = crDay, items = dayItems(D);
  let h = back() + '<div class="row sp" style="margin-bottom:8px"><button class="btn sm sec" data-a="crDay" data-n="-1">◀</button><b>' + fmtLong(D) + '</b><button class="btn sm sec" data-a="crDay" data-n="1">▶</button></div>';
  h += '<div class="card"><h2>📝 Compte rendu <button class="btn sm" data-a="crShare">Partager</button></h2><div id="crText" style="white-space:pre-wrap;font-size:14px">' + esc(crText(D)) + '</div></div>';
  h += '<div class="card"><h2>Notes de la journée</h2><div class="f"><textarea id="journal" data-a-change="journal" placeholder="Comment s\'est passée la journée ? Devoirs, humeur, ce qu\'il faut retenir…">' + esc(S.journal[D] || '') + '</textarea></div><div class="mute">Enregistré automatiquement.</div></div>';
  return h;
}
function crText(D) {
  const items = dayItems(D), L = [];
  L.push('Compte rendu — ' + fmtLong(D));
  const meds = items.filter(i => i.cat === 'med');
  if (meds.length) { L.push('', '💊 Traitements :'); for (const m of meds) L.push((medTaken(D, m.med.id, m.med.t) ? '  ✅ ' : '  ❌ ') + m.time + ' ' + m.title.replace('💊 ', '') + ' (' + pname(m.who) + ')'); }
  const evs = items.filter(i => ['event', 'wakeEv', 'bday', 'vaccin'].includes(i.cat));
  if (evs.length) { L.push('', '📅 Programme :'); for (const e of evs) L.push('  • ' + (e.time ? e.time + ' ' : '') + e.title + ' (' + pname(e.who) + ')'); }
  const sd = schoolDay(D); L.push('', sd ? '🎒 École : ' + sd.start + ' – ' + sd.end : '🎒 Pas d\'école');
  const wd = parseD(D).getDay(); L.push('😴 Coucher des filles : ' + ([0, 1, 2, 3, 4].includes(wd) ? S.sleep.week : S.sleep.weekend));
  if (isFast(D)) { const p = prayers(D); L.push(wifeInPeriod(D) ? '🌙 Jeûne suspendu (règles)' : '🌙 Jeûne de ' + pname(S.fast.person) + ' : ' + p.fajr + ' → ' + p.maghrib); }
  L.push('', '🍽️ Repas :'); for (const [k, l] of SLOTS) L.push('  ' + l.replace(/^\S+ /, '') + ' : ' + menuFor(D, k));
  if (cycleVisible() && isOwnerWife()) { const lg = S.cycle.logs[D]; if (lg && (lg.flow || (lg.sym || []).length)) L.push('', '🌸 ' + [lg.flow ? 'Flux ' + lg.flow.toLowerCase() : '', (lg.sym || []).join(', ')].filter(Boolean).join(' · ')); }
  if (WX && WX.daily) { const i = WX.daily.time.indexOf(D); if (i >= 0) L.push('', '🌦️ Lattes : ' + WMO(WX.daily.weather_code[i])[1] + ', ' + Math.round(WX.daily.temperature_2m_min[i]) + '°/' + Math.round(WX.daily.temperature_2m_max[i]) + '°C, pluie ' + WX.daily.precipitation_probability_max[i] + ' %'); }
  if (S.journal[D]) L.push('', '🗒️ Notes : ' + S.journal[D]);
  return L.join('\n');
}

/* ---- Photos (IndexedDB) ---- */
let dbp;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => { const r = indexedDB.open('kaelumPhotos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return dbp;
}
async function dbAll() { const d = await db(); return new Promise(res => { const r = d.transaction('p').objectStore('p').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); }); }
async function dbPut(o) { const d = await db(); return new Promise(res => { const t = d.transaction('p', 'readwrite'); t.objectStore('p').put(o); t.oncomplete = res; }); }
async function dbDel(id) { const d = await db(); return new Promise(res => { const t = d.transaction('p', 'readwrite'); t.objectStore('p').delete(id); t.oncomplete = res; }); }
function vPhotos() {
  setTimeout(loadPhotos, 0);
  return back() + '<div class="card"><h2>📸 Photos <label class="btn sm">+ Ajouter<input type="file" accept="image/*" multiple id="photoIn" hidden></label></h2><div class="mute" style="margin-bottom:8px">Gardées sur le téléphone, même sans connexion.</div><div id="ph" class="photos"></div></div>';
}
const urls = [];
async function loadPhotos() {
  const el = $('#ph'); if (!el) return;
  urls.splice(0).forEach(u => URL.revokeObjectURL(u));
  const all = (await dbAll()).sort((a, b) => b.date.localeCompare(a.date));
  el.innerHTML = all.length ? all.map(p => { const u = URL.createObjectURL(p.blob); urls.push(u); return '<img src="' + u + '" data-a="viewPhoto" data-id="' + p.id + '" alt="">'; }).join('') : '<div class="empty" style="grid-column:1/-1">Aucune photo pour l\'instant</div>';
}
function compress(file) {
  return new Promise(res => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const m = 1600, k = Math.min(1, m / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(b => res(b || file), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(u); res(file); };
    img.src = u;
  });
}
async function viewPhoto(id) {
  const p = (await dbAll()).find(x => x.id === id); if (!p) return;
  const u = URL.createObjectURL(p.blob); urls.push(u);
  openSheet('<img src="' + u + '" style="width:100%;border-radius:14px"><div class="f" style="margin-top:10px"><label>Légende</label><input id="phCap" value="' + esc(p.caption || '') + '"></div><div class="mute">' + fmtLong(p.date.slice(0, 10)) + '</div>' +
    '<div class="row" style="gap:8px;margin-top:10px"><button class="btn full" data-a="phSave" data-id="' + id + '">Enregistrer</button><button class="btn sec full" data-a="phShare" data-id="' + id + '">Partager</button></div><div class="row" style="gap:8px;margin-top:8px"><button class="btn bad full" data-a="phDel" data-id="' + id + '">Supprimer</button><button class="btn sec full" data-a="close">Fermer</button></div>');
}

/* ---- Réglages ---- */
function vReglages() {
  let h = back();
  h += '<div class="card"><h2>📱 Ce téléphone</h2><div class="row wrap">' + ['maman', 'papa'].map(id => '<button class="chip' + (S.owner === id ? ' on' : '') + '" data-a="setOwner" data-id="' + id + '">Téléphone de ' + esc(pname(id)) + '</button>').join('') + '</div></div>';
  h += '<div class="card"><h2>🔐 Confidentialité</h2><div class="mute" style="margin-bottom:10px">' + (S.pin ? 'Appli verrouillée par code (se reverrouille après 2 min hors de l\'appli).' : 'Aucun code : n\'importe qui avec le téléphone peut ouvrir l\'appli.') + '</div><div class="row wrap" style="gap:8px"><button class="btn sm" data-a="pinSet">' + (S.pin ? 'Changer le code' : 'Créer un code') + '</button>' + (S.pin ? '<button class="btn sm sec" data-a="pinOff">Retirer le code</button>' : '') + '<button class="btn sm sec" data-a="heroPick">📷 Photo de famille</button></div></div>';
  h += '<div class="card"><h2>👨‍👩‍👧‍👧 Famille</h2>' + S.people.map(p => '<div class="item"><button class="avbtn" data-a="avPick" data-id="' + p.id + '">' + avatar(p.id, 48) + '<i>📷</i></button><div class="body" data-a="editPerson" data-id="' + p.id + '"><b>' + esc(p.name) + '</b><div class="who">' + (p.birth ? 'Né(e) le ' + fmtShort(p.birth) + ' ' + p.birth.slice(0, 4) : 'Date de naissance non renseignée') + '</div></div></div>').join('') + '</div>';
  const sc = S.school;
  h += '<div class="card"><h2>🎒 Crèche / école (' + S.kids.map(k => esc(pname(k))).join(' & ') + ')</h2><div class="mute" style="margin-bottom:6px">Touchez un jour pour l\'activer, puis réglez les heures.</div>' + [1, 2, 3, 4, 5].map(d => { const x = sc.days[d]; return '<div class="row sp" style="padding:4px 0"><button class="chip' + (x.on ? ' on' : '') + '" data-a="schTog" data-d="' + d + '" style="min-width:76px">' + JOURS[d].slice(0, 3) + '.</button><span class="row" style="gap:4px"><input type="time" value="' + x.start + '" data-a-change="schT" data-d="' + d + '" data-k="start" style="width:88px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg)"> → <input type="time" value="' + x.end + '" data-a-change="schT" data-d="' + d + '" data-k="end" style="width:88px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg)"></span></div>'; }).join('');
  h += '<div class="row sp" style="margin-top:8px"><span class="mute">Rappel départ (min avant)</span><input type="number" value="' + sc.depart + '" data-a-change="schDep" style="width:70px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg)"></div>';
  h += '<h3>Vacances scolaires</h3>' + (sc.holidays.length ? sc.holidays.map((v, i) => '<div class="row sp" style="padding:4px 0"><span>' + fmtShort(v.start) + ' → ' + fmtShort(v.end) + '</span><button class="btn sm sec" data-a="holDel" data-i="' + i + '">✕</button></div>').join('') : '<div class="mute">Aucune période</div>') + '<button class="btn sm sec" data-a="holAdd" style="margin-top:6px">+ Ajouter des vacances</button></div>';
  h += '<div class="card"><h2>😴 Sommeil & ⏰ réveil</h2>' + rowIn('Coucher dim. → jeu. soir', 'sleep.week', S.sleep.week, 'time') + rowIn('Coucher ven. & sam. soir', 'sleep.weekend', S.sleep.weekend, 'time') + rowIn('Rappel coucher (min avant)', 'sleep.before', S.sleep.before, 'number') +
    rowIn('Réveil jours d\'école', 'wake.school', S.wake.school, 'time') + rowIn('Réveil autres jours', 'wake.off', S.wake.off, 'time') + rowChk('Réveil activé', 'wake.on', S.wake.on) + rowChk('Réveil aussi les jours sans école', 'wake.offOn', S.wake.offOn) + '</div>';
  h += '<div class="card"><h2>🕌 Prières</h2><div class="f"><label>Méthode de calcul</label><select data-a-change="set" data-k="prayer.method">' + Object.entries(PrayerCalc.METHODS).map(([k, m]) => '<option value="' + k + '"' + (S.prayer.method === k ? ' selected' : '') + '>' + m.name + '</option>').join('') + '</select></div>' +
    '<div class="f"><label>Asr</label><select data-a-change="set" data-k="prayer.asr"><option value="shafi"' + (S.prayer.asr === 'shafi' ? ' selected' : '') + '>Standard (Chafiite, Malékite)</option><option value="hanafi"' + (S.prayer.asr === 'hanafi' ? ' selected' : '') + '>Hanafite</option></select></div>' +
    '<div class="mute" style="margin-bottom:6px">Ajustement en minutes (pour coller à l\'horaire de la mosquée)</div><div class="grid2">' + ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(k => '<label class="row sp"><span>' + PNAMES[k] + '</span><input type="number" value="' + (S.prayer.adj[k] || 0) + '" data-a-change="adj" data-k="' + k + '" style="width:64px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg)"></label>').join('') + '</div>' +
    rowIn('Rappel avant la prière (min)', 'prayer.before', S.prayer.before, 'number') + rowChk('Afficher les prières', 'prayer.show', S.prayer.show) + '</div>';
  h += '<div class="card"><h2>🌸 Suivi féminin</h2>' + rowChk('Afficher le suivi du cycle', 'cycle.show', S.cycle.show) + rowChk('Pendant les règles : suspendre jeûne et rappels de prière', 'cycle.pause', S.cycle.pause) + rowIn('Durée de cycle par défaut (jours)', 'cycle.len', S.cycle.len, 'number') + rowIn('Durée des règles par défaut (jours)', 'cycle.plen', S.cycle.plen, 'number') + '</div>';
  const N = S.notif;
  h += '<div class="card"><h2>🔔 Rappels</h2><button class="btn sm" data-a="askNotif" style="margin-bottom:8px">Autoriser les notifications</button><button class="btn sm sec" data-a="testNotif" style="margin:0 0 8px 6px">Tester</button>' +
    [['events', 'Rendez-vous & activités'], ['meds', 'Traitements'], ['school', 'Crèche / école'], ['sleep', 'Coucher'], ['wake', 'Réveil'], ['prayer', 'Prières'], ['fast', 'Jeûne (shour / iftar)'], ['rain', 'Alerte pluie Lattes'], ['sound', 'Son']].map(([k, l]) => rowChk(l, 'notif.' + k, N[k])).join('') +
    '<div class="mute" style="margin-top:8px">Les rappels sonnent quand l\'appli est ouverte ou en arrière-plan récent. Pour des alarmes garanties même appli fermée : Plus → « Ajouter à l\'agenda du téléphone ».</div></div>';
  h += '<div class="card"><h2>📅 Planning de ' + esc(pname('papa')) + '</h2><div class="mute" style="margin-bottom:8px">' + (S.famKey ? 'Mis à jour automatiquement depuis internet' + (S.planAt ? ' — dernière vérif. : ' + new Date(S.planAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '') : 'Ouvre le fichier privé pour activer la mise à jour automatique') + '</div><div class="row wrap" style="gap:8px"><button class="btn sm" data-a="planPdf">📄 Télécharger le PDF</button><button class="btn sm sec" data-a="planIcs">📲 Ajouter à mon agenda</button><button class="btn sm sec" data-a="syncPl">🔄 Vérifier</button></div></div>';
  h += syncCard();
  h += '<div class="card"><h2>💾 Données</h2><div class="row wrap" style="gap:8px"><button class="btn sm" data-a="backupMenu">Sauvegarder / restaurer</button><button class="btn sm bad" data-a="reset">Tout effacer</button></div></div>';
  return h + '<div class="credit">Rozane et Rochane Family v1 · Créé par Rochdi MECHETI</div>';
}
const inSt = 'width:110px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--bg)';
function rowIn(l, k, v, t) { return '<div class="row sp" style="padding:5px 0"><span>' + l + '</span><input type="' + t + '" value="' + esc(v) + '" data-a-change="set" data-k="' + k + '" style="' + inSt + '"></div>'; }
function rowChk(l, k, v) { return '<label class="row sp" style="padding:6px 0"><span>' + l + '</span><input type="checkbox"' + (v ? ' checked' : '') + ' data-a-change="set" data-k="' + k + '" style="width:22px;height:22px"></label>'; }
function setPath(k, v) { const [a, b] = k.split('.'); S[a][b] = v; }

/* ---------- Agenda du téléphone (.ics) ---------- */
function icsMenu() {
  const opts = [['event', 'Rendez-vous, sorties, sport, réveils'], ['med', 'Traitements'], ['school', 'Crèche / école'], ['wake', 'Réveil quotidien'], ['sleep', 'Coucher des filles'], ['prayer', 'Prières'], ['fast', 'Jeûne (shour / iftar)'], ['bday', 'Anniversaires & vaccins']];
  openSheet('<h2>📲 Ajouter à l\'agenda du téléphone</h2><div class="mute" style="margin-bottom:10px">Crée un fichier agenda (30 jours) avec alarmes. Ouvrez-le et choisissez « Ajouter » : les rappels sonneront même appli fermée et sans internet.</div>' +
    opts.map(([k, l]) => '<label class="row sp" style="padding:6px 0"><span>' + l + '</span><input type="checkbox" class="icsC" value="' + k + '" ' + (['prayer'].includes(k) ? '' : 'checked') + ' style="width:22px;height:22px"></label>').join('') +
    '<div class="f"><label>Nombre de jours</label><select id="icsDays"><option>7</option><option selected>30</option><option>60</option></select></div><button class="btn full" data-a="icsGo">Créer le fichier agenda</button><button class="btn sec full" style="margin-top:8px" data-a="close">Annuler</button>');
}
function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
function icsUTC(D, hm) { const [y, m, d] = D.split('-').map(Number), [H, M] = hm.split(':').map(Number); const t = new Date(y, m - 1, d, H, M); return t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function buildICS(cats, days) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rozane et Rochane Family//Rochdi Mecheti//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Rozane et Rochane Family'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const map = { event: 'event', wakeEv: 'event', med: 'med', school: 'school', wake: 'wake', sleep: 'sleep', prayer: 'prayer', fast: 'fast', bday: 'bday', vaccin: 'bday', cycle: 'bday' };
  let n = 0;
  for (let i = 0; i < days; i++) {
    const D = addDays(today(), i);
    for (const it of dayItems(D)) {
      if (!cats.includes(map[it.cat]) || it.quiet) continue;
      if (it.key.startsWith('bd7:') || it.key.startsWith('vac7:')) continue;
      L.push('BEGIN:VEVENT', 'UID:' + icsEsc(it.key) + '-' + i + '@kaelum-family', 'DTSTAMP:' + stamp);
      if (it.time) {
        const dur = it.ev && it.ev.end ? (((toMin(it.ev.end) - toMin(it.time)) + 1440) % 1440 || 1440) : 10;
        const [y, mo, dd] = D.split('-').map(Number), [H, M] = it.time.split(':').map(Number);
        const st = new Date(y, mo - 1, dd, H, M), en = new Date(st.getTime() + dur * 60000), f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        L.push('DTSTART:' + f(st), 'DTEND:' + f(en));
      }
      else { L.push('DTSTART;VALUE=DATE:' + D.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addDays(D, 1).replace(/-/g, '')); }
      L.push('SUMMARY:' + icsEsc(it.title + (it.who && it.who !== 'all' ? ' — ' + pname(it.who) : '')));
      if (it.notes) L.push('DESCRIPTION:' + icsEsc(it.notes));
      const before = it.time ? Math.max(0, it.alarm > 0 ? it.alarm : 0) : -480; // journée : 8h
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(it.title), before >= 0 ? 'TRIGGER:-PT' + before + 'M' : 'TRIGGER:PT8H', 'END:VALARM', 'END:VEVENT');
      n++;
    }
  }
  L.push('END:VCALENDAR');
  return { text: L.join('\r\n'), n };
}
async function shareOrDownload(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

/* ---------- Sauvegarde ---------- */
function backupMenu() {
  openSheet('<h2>💾 Sauvegarde</h2><div class="mute" style="margin-bottom:12px">Les données sont uniquement sur ce téléphone. Faites une sauvegarde de temps en temps (et pour copier le planning sur l\'autre téléphone : sauvegarder ici, envoyer le fichier, puis « Restaurer » là-bas).</div>' +
    '<button class="btn full" data-a="bkExport">Sauvegarder (sans photos)</button><button class="btn sec full" style="margin-top:8px" data-a="bkExportP">Sauvegarder avec les photos</button>' +
    '<label class="btn sec full" style="display:block;text-align:center;margin-top:8px">Ouvrir un fichier (sauvegarde ou planning)<input type="file" accept=".json,application/json" id="bkIn" hidden></label><button class="btn sec full" style="margin-top:8px" data-a="close">Fermer</button>');
}
const blobToB64 = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });

/* ---------- Actions ---------- */
const A = {
  go(d) { view = d.v; sub = d.s || ''; if (d.h) healthTab = d.h; closeSheet(); render(); },
  close() { closeSheet(); },
  stopAlarm() { closeSheet(); },
  selDay(d) { selDay = d.d; render(); },
  wk(d) { weekStart = addDays(weekStart, Number(d.n)); selDay = addDays(selDay, Number(d.n)); render(); },
  filter(d) { filter = d.id; render(); },
  htab(d) { healthTab = d.h; render(); },
  togChip(d, el) { el.classList.toggle('on'); },
  formSave() { const v = formRead(); if (formCtx.onSave(v) !== false) { save(); closeSheet(); render(); } },
  formDel() { if (confirm('Supprimer ?')) { formCtx.onDel(); save(); closeSheet(); render(); } },
  medTake(d) { S.medLog[d.d] = S.medLog[d.d] || {}; const k = d.id + '@' + d.t; S.medLog[d.d][k] = !S.medLog[d.d][k]; save(); render(); },
  askNotif() {
    if (!('Notification' in window)) { toast('Notifications non disponibles : installez d\'abord l\'appli sur l\'écran d\'accueil.'); return; }
    Notification.requestPermission().then(p => { toast(p === 'granted' ? '✅ Notifications activées' : 'Notifications refusées (modifiable dans les réglages du téléphone)'); render(); });
    beep(1);
  },
  testNotif() { notify('🔔 Test Rozane et Rochane Family', 'Les rappels fonctionnent !'); },
  addEvent() { eventForm({ date: selDay, time: '', person: 'all', cat: 'rdv', rec: 'none', alarm: 15 }); },
  editEvent(d) { const ev = S.events.find(e => e.id === d.id); if (ev) eventForm(ev); },
  fastToday() { const D = today(); S.fast.skip = S.fast.skip.filter(x => x !== D); if (!isFast(D)) S.fast.dates.push(D); save(); render(); },
  fastCancel() { const D = today(); S.fast.dates = S.fast.dates.filter(x => x !== D); if (isFast(D)) S.fast.skip.push(D); save(); render(); },
  fastWd(d) { const n = Number(d.d), w = S.fast.weekdays; S.fast.weekdays = w.includes(n) ? w.filter(x => x !== n) : [...w, n]; save(); render(); },
  fastPreset(d) { S.fast.weekdays = d.p === 'lj' ? [1, 4] : d.p === 'all' ? [0, 1, 2, 3, 4, 5, 6] : []; save(); render(); },
  fastClear() { S.fast.dates = S.fast.dates.filter(x => x < today()); save(); render(); },
  fastRange() {
    form('Période de jeûne', [{ k: 'start', label: 'Du', type: 'date', def: today() }, { k: 'end', label: 'Au (inclus)', type: 'date', def: addDays(today(), 29) }], {}, v => {
      if (!v.start || !v.end || v.end < v.start) { toast('Dates invalides'); return false; }
      for (let D = v.start; D <= v.end; D = addDays(D, 1)) if (!S.fast.dates.includes(D)) S.fast.dates.push(D);
      S.fast.skip = S.fast.skip.filter(x => x < v.start || x > v.end);
    });
  },
  editMeal(d) {
    form('Modifier le ' + (SLOTS.find(s => s[0] === d.s)?.[1] || d.s) + ' — ' + fmtShort(d.d), [{ k: 'txt', label: 'Menu', type: 'textarea' }, { k: 'pick', label: 'Ou choisir une idée', type: 'select', options: [['', '—']].concat(MENU[d.s].map(x => [x, x])) }], { txt: menuFor(d.d, d.s) }, v => {
      S.menus[d.d] = S.menus[d.d] || {}; S.menus[d.d][d.s] = v.pick || v.txt;
    });
  },
  regenMenu(d) { S.menuSeed[d.d] = (S.menuSeed[d.d] || 0) + 1; delete S.menus[d.d]; save(); render(); },
  addMed() { medForm({ person: 'fille1', times: ['08:00'], start: today() }); },
  editMed(d) { const m = S.meds.find(x => x.id === d.id); if (m) medForm(m); },
  addVac() { vacForm({ person: 'fille1' }); },
  vacGen(d) {
    const p = person(d.id);
    if (!p.birth) { toast('Ajoutez d\'abord la date de naissance de ' + p.name + ' (Réglages → Famille)'); return; }
    if (S.vaccines.some(v => v.person === p.id && v.auto) && !confirm('Recréer le calendrier automatique de ' + p.name + ' ?')) return;
    S.vaccines = S.vaccines.filter(v => !(v.person === p.id && v.auto && !v.done));
    const addM = (m) => { const x = parseD(p.birth); x.setMonth(x.getMonth() + m); return ymd(x); };
    for (const [m, name] of VAC_GEN) if (!S.vaccines.some(v => v.person === p.id && v.name === name && v.done))
      S.vaccines.push({ id: uid(), person: p.id, name, done: '', next: addM(m), auto: true, notes: addM(m) < today() ? 'Date passée : vérifier dans le carnet de santé' : '' });
    save(); render(); toast('Calendrier vaccinal créé pour ' + p.name);
  },
  vacDone(d) { const v = S.vaccines.find(x => x.id === d.id); if (v) { v.done = v.done ? '' : (v.next && v.next <= today() ? v.next : today()); v.notes = ''; save(); render(); } },
  editVac(d) { const v = S.vaccines.find(x => x.id === d.id); if (v) vacForm(v); },
  perStart() { const D = today(); if (!S.cycle.periods.some(p => p.start === D)) S.cycle.periods.push({ id: uid(), start: D, end: '' }); save(); render(); toast('🌸 Début des règles noté'); },
  perEnd() { const ci = cycleInfo(); if (ci.last) { ci.last.end = today(); save(); render(); toast('Fin des règles notée'); } },
  perPast() { perForm({ start: addDays(today(), -1), end: '' }); },
  editPer(d) { const p = S.cycle.periods.find(x => x.id === d.id); if (p) perForm(p); },
  cycFlow(d) { const D = today(); const l = S.cycle.logs[D] = S.cycle.logs[D] || {}; l.flow = l.flow === d.f ? '' : d.f; save(); render(); },
  cycSym(d) { const D = today(); const l = S.cycle.logs[D] = S.cycle.logs[D] || {}; l.sym = l.sym || []; l.sym = l.sym.includes(d.s) ? l.sym.filter(x => x !== d.s) : [...l.sym, d.s]; save(); render(); },
  cycM(d) { const m = parseD(cycMonth); m.setMonth(m.getMonth() + Number(d.n)); cycMonth = ymd(m); render(); },
  addBd() { bdForm({}); },
  editBd(d) { const b = S.birthdays.find(x => x.id === d.id); if (b) bdForm(b); },
  crDay(d) { crDay = addDays(crDay, Number(d.n)); render(); },
  async crShare() { const t = crText(crDay); if (navigator.share) { try { await navigator.share({ title: 'Compte rendu', text: t }); } catch (e) { } } else { try { await navigator.clipboard.writeText(t); toast('Copié'); } catch (e) { } } },
  viewPhoto(d) { viewPhoto(d.id); },
  async phSave(d) { const p = (await dbAll()).find(x => x.id === d.id); if (p) { p.caption = $('#phCap').value; await dbPut(p); } closeSheet(); },
  async phShare(d) { const p = (await dbAll()).find(x => x.id === d.id); if (p) shareOrDownload(p.blob, 'photo-' + p.date.slice(0, 10) + '.jpg'); },
  async phDel(d) { if (confirm('Supprimer cette photo ?')) { await dbDel(d.id); closeSheet(); loadPhotos(); } },
  setOwner(d) { S.owner = d.id; save(); render(); },
  editPerson(d) {
    const p = person(d.id);
    form('Modifier ' + p.name, [{ k: 'name', label: 'Prénom' }, { k: 'birth', label: 'Date de naissance', type: 'date' }, { k: 'color', label: 'Couleur', type: 'color' }], p, v => {
      p.name = v.name || p.name; p.color = v.color || p.color;
      if (v.birth && v.birth !== p.birth) { const bd = S.birthdays.find(b => b.name === p.name || b.pid === p.id); if (bd) { bd.date = v.birth; bd.pid = p.id; } else S.birthdays.push({ id: uid(), name: p.name, date: v.birth, pid: p.id }); }
      p.birth = v.birth;
    });
  },
  schTog(d) { S.school.days[d.d].on = !S.school.days[d.d].on; S.school.set = true; save(); render(); },
  holAdd() { form('Vacances scolaires', [{ k: 'start', label: 'Du', type: 'date', def: today() }, { k: 'end', label: 'Au (inclus)', type: 'date', def: addDays(today(), 13) }], {}, v => { if (!v.start || !v.end || v.end < v.start) { toast('Dates invalides'); return false; } S.school.holidays.push(v); }); },
  holDel(d) { S.school.holidays.splice(Number(d.i), 1); save(); render(); },
  icsMenu() { icsMenu(); },
  icsGo() {
    const cats = [...document.querySelectorAll('.icsC:checked')].map(c => c.value), days = Number($('#icsDays').value);
    const r = buildICS(cats, days); closeSheet();
    if (!r.n) { toast('Rien à exporter'); return; }
    shareOrDownload(new Blob([r.text], { type: 'text/calendar' }), 'kaelum-family-agenda.ics'); toast(r.n + ' rappels créés');
  },
  backupMenu() { backupMenu(); },
  syncPl() { S.planSig = ''; syncPlanning(true); },
  papaAll() { filter = 'papa'; selDay = today(); weekStart = null; A.go({ v: 'planning' }); },
  planPdf() {
    let p = null; try { p = JSON.parse(localStorage.getItem('kaelumPlanPdf')); } catch (e) { }
    if (!p) { toast('PDF pas encore reçu : ouvre l\'appli avec internet'); syncPlanning(true); return; }
    shareOrDownload(new Blob([b64d(p.b64)], { type: 'application/pdf' }), p.name);
  },
  planIcs() {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rozane et Rochane Family//FR', 'X-WR-CALNAME:Planning ' + pname('papa')];
    const f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), st = f(new Date());
    const evs = S.events.filter(e => e.src && e.date >= today());
    for (const e of evs) {
      const [y, mo, d] = e.date.split('-').map(Number), [H, M] = e.time.split(':').map(Number), a = new Date(y, mo - 1, d, H, M);
      const dur = e.end ? (((toMin(e.end) - toMin(e.time)) + 1440) % 1440 || 1440) : 60;
      L.push('BEGIN:VEVENT', 'UID:' + e.id + '@kaelum-family', 'DTSTAMP:' + st, 'DTSTART:' + f(a), 'DTEND:' + f(new Date(a.getTime() + dur * 60000)),
        'SUMMARY:' + icsEsc((CATS[e.cat] || CATS.autre)[0] + ' ' + e.title + (e.person === 'papa' ? '' : ' — ' + pname(e.person))), e.notes ? 'LOCATION:' + icsEsc(e.notes) : '', 'END:VEVENT');
    }
    L.push('END:VCALENDAR');
    if (!evs.length) { toast('Aucun créneau à venir'); return; }
    shareOrDownload(new Blob([L.filter(Boolean).join('\r\n')], { type: 'text/calendar' }), 'planning-' + pname('papa').toLowerCase() + '.ics'); toast(evs.length + ' créneaux exportés');
  },
  bkExport() { const o = { ...S, owner: '', _hero: heroSrc() || undefined, _av: Object.fromEntries(S.people.map(p => [p.id, avSrc(p.id)]).filter(x => x[1])) }; shareOrDownload(new Blob([JSON.stringify(o)], { type: 'application/json' }), 'kaelum-family-' + today() + '.json'); },
  async bkExportP() {
    toast('Préparation…'); const ph = await dbAll(), photos = [];
    for (const p of ph) photos.push({ ...p, blob: await blobToB64(p.blob) });
    shareOrDownload(new Blob([JSON.stringify({ ...S, owner: '', _hero: heroSrc() || undefined, _photos: photos })], { type: 'application/json' }), 'kaelum-family-photos-' + today() + '.json');
  },
  reset() { if (confirm('Effacer toutes les données de l\'appli sur ce téléphone ?') && confirm('Vraiment tout effacer ?')) { localStorage.removeItem(KEY); indexedDB.deleteDatabase('kaelumPhotos'); location.reload(); } }
};
function eventForm(ev) {
  const isNew = !ev.id;
  form(isNew ? 'Nouvel événement' : 'Modifier', [
    { k: 'title', label: 'Titre', ph: 'Ex. Piscine, dentiste, sortie au parc…' },
    { k: 'cat', label: 'Type', type: 'select', options: Object.entries(CATS).map(([k, v]) => [k, v[0] + ' ' + v[1]]) },
    { k: 'person', label: 'Pour qui', type: 'select', options: personOpts() },
    { k: 'date', label: 'Date (début)', type: 'date' },
    { k: 'time', label: 'Heure', type: 'time' },
    { k: 'end', label: 'Heure de fin (optionnel)', type: 'time' },
    { k: 'rec', label: 'Répéter', type: 'select', options: [['none', 'Une seule fois'], ['daily', 'Tous les jours'], ['weekly', 'Chaque semaine'], ['monthly', 'Chaque mois'], ['yearly', 'Chaque année']] },
    { k: 'days', label: 'Jours (si chaque semaine)', type: 'days' },
    { k: 'until', label: 'Jusqu\'au (optionnel)', type: 'date' },
    { k: 'alarm', label: 'Rappel', type: 'select', options: [[0, 'À l\'heure'], [5, '5 min avant'], [15, '15 min avant'], [30, '30 min avant'], [60, '1 h avant'], [120, '2 h avant'], [1440, 'La veille']] },
    { k: 'notes', label: 'Notes', type: 'textarea' }
  ], ev, v => {
    if (!v.title) { toast('Donnez un titre'); return false; }
    if (!v.date) { toast('Choisissez une date'); return false; }
    v.alarm = Number(v.alarm);
    if (isNew) S.events.push({ id: uid(), ...v }); else Object.assign(ev, v);
  }, isNew ? null : () => { S.events = S.events.filter(e => e !== ev); });
}
function medForm(m) {
  const isNew = !m.id;
  form(isNew ? 'Nouveau traitement' : 'Modifier le traitement', [
    { k: 'person', label: 'Pour qui', type: 'select', options: personOpts(false, false) },
    { k: 'name', label: 'Médicament', ph: 'Nom du médicament' },
    { k: 'dose', label: 'Dose', ph: 'Ex. 1 comprimé, 5 ml…' },
    { k: 'times', label: 'Heures de prise (séparées par des virgules)', ph: '08:00, 20:00' },
    { k: 'start', label: 'Début', type: 'date' },
    { k: 'end', label: 'Fin (optionnel)', type: 'date' },
    { k: 'notes', label: 'Consignes', type: 'textarea', ph: 'Pendant le repas, etc.' }
  ], m, v => {
    if (!v.name) { toast('Nom du médicament manquant'); return false; }
    const times = v.times.split(/[,;\s]+/).map(t => t.replace('h', ':').replace(/^(\d):/, '0$1:')).filter(t => /^\d{2}:\d{2}$/.test(t)).map(t => t.length === 3 ? t + '00' : t);
    if (!times.length) { toast('Heure invalide (ex. 08:00)'); return false; }
    v.times = [...new Set(times)].sort();
    if (isNew) S.meds.push({ id: uid(), ...v }); else Object.assign(m, v);
  }, isNew ? null : () => { S.meds = S.meds.filter(x => x !== m); });
}
function vacForm(x) {
  const isNew = !x.id;
  form(isNew ? 'Ajouter un vaccin' : 'Modifier le vaccin', [
    { k: 'person', label: 'Pour qui', type: 'select', options: personOpts(false, false) },
    { k: 'name', label: 'Vaccin', ph: 'Ex. ROR, DTCaP, HPV…' },
    { k: 'done', label: 'Fait le', type: 'date' },
    { k: 'next', label: 'Prochain rappel / RDV', type: 'date' },
    { k: 'notes', label: 'Notes', type: 'textarea' }
  ], x, v => { if (!v.name) { toast('Nom du vaccin manquant'); return false; } if (isNew) S.vaccines.push({ id: uid(), ...v }); else Object.assign(x, v); },
    isNew ? null : () => { S.vaccines = S.vaccines.filter(y => y !== x); });
}
function perForm(p) {
  const isNew = !p.id;
  form(isNew ? 'Ajouter des règles' : 'Modifier', [{ k: 'start', label: 'Premier jour', type: 'date' }, { k: 'end', label: 'Dernier jour (vide si en cours)', type: 'date' }], p, v => {
    if (!v.start || (v.end && v.end < v.start)) { toast('Dates invalides'); return false; }
    if (isNew) S.cycle.periods.push({ id: uid(), ...v }); else Object.assign(p, v);
  }, isNew ? null : () => { S.cycle.periods = S.cycle.periods.filter(x => x !== p); });
}
function bdForm(b) {
  const isNew = !b.id;
  const val = { name: b.name || '', date: b.date && b.date.length === 10 ? b.date : '', day: b.date ? Number(b.date.slice(-2)) : '', month: b.date ? Number(b.date.slice(-5, -3)) : '' };
  form(isNew ? 'Ajouter un anniversaire' : 'Modifier', [
    { k: 'name', label: 'Prénom' },
    { k: 'day', label: 'Jour', type: 'number' },
    { k: 'month', label: 'Mois', type: 'select', options: [['', '—']].concat(MOIS.map((m, i) => [i + 1, m])) },
    { k: 'year', label: 'Année de naissance (optionnel, pour l\'âge)', type: 'number', def: b.date && b.date.length === 10 ? Number(b.date.slice(0, 4)) : '' }
  ], val, v => {
    const day = Number(v.day), month = Number(v.month);
    if (!v.name || !day || !month || day > 31) { toast('Prénom, jour et mois requis'); return false; }
    const md = pad(month) + '-' + pad(day), date = v.year ? v.year + '-' + md : md;
    if (isNew) S.birthdays.push({ id: uid(), name: v.name, date }); else Object.assign(b, { name: v.name, date });
  }, isNew ? null : () => { S.birthdays = S.birthdays.filter(x => x !== b); });
}
const CHG = {
  set(d, el) { setPath(d.k, el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value || 0) : el.value); save(); if (el.type !== 'number') render(); },
  adj(d, el) { S.prayer.adj[d.k] = Number(el.value || 0); save(); },
  schT(d, el) { if (el.value) { S.school.days[d.d][d.k] = el.value; S.school.set = true; save(); } },
  schDep(d, el) { S.school.depart = Number(el.value || 0); save(); },
  journal(d, el) { S.journal[crDay] = el.value; save(); },
  cycNote(d, el) { const D = today(); const l = S.cycle.logs[D] = S.cycle.logs[D] || {}; l.note = el.value; save(); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el.dataset, el); }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'photoIn') {
    for (const f of el.files) await dbPut({ id: uid(), date: new Date().toISOString(), caption: '', blob: await compress(f) });
    toast('📸 Photo(s) ajoutée(s)'); loadPhotos(); return;
  }
  if (el.id === 'bkIn') {
    const f = el.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data._type === 'planning') {
        let n = 0; for (const pl of data.plannings) n += importPlanning(pl);
        save(); closeSheet(); toast('✅ Planning importé : ' + n + ' créneaux'); render(); return;
      }
      if (!data.people || !data.v) throw new Error();
      if (S.owner && !confirm('Remplacer les données de ce téléphone par ce fichier ?')) return;
      const owner = S.owner; const photos = data._photos; delete data._photos;
      if (owner) data.owner = owner; if (S.pin && !data.pin) data.pin = S.pin; data.imported = true;
      if (data._hero) { try { localStorage.setItem('kaelumHero', data._hero); } catch (e2) { } delete data._hero; }
      if (data._av) { for (const k in data._av) try { localStorage.setItem('kaelumAv_' + k, data._av[k]); } catch (e2) { } delete data._av; }
      localStorage.setItem(KEY, JSON.stringify(data)); load();
      if (photos) for (const p of photos) { const b = await (await fetch(p.blob)).blob(); await dbPut({ ...p, blob: b }); }
      closeSheet(); toast('✅ Données ouvertes'); render(); if (!S.owner) onboarding(); syncPlanning();
    } catch (err) { toast('Fichier de sauvegarde invalide'); }
    return;
  }
  const c = el.closest('[data-a-change]'); if (c && CHG[c.dataset.aChange]) CHG[c.dataset.aChange](c.dataset, el);
});
document.addEventListener('input', e => { const el = e.target; if (el.id === 'journal' || el.id === 'cycNote') CHG[el.dataset.aChange]({}, el); });

/* ---------- Installation ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  const b = $('#install'); b.innerHTML = '<span>📲 Installer Rozane et Rochane Family sur le téléphone</span><button class="btn sm" id="instBtn">Installer</button>'; b.classList.remove('hidden');
  $('#instBtn').onclick = async () => { b.classList.add('hidden'); deferredPrompt.prompt(); deferredPrompt = null; };
});
function iosHint() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (ios && !standalone) { const b = $('#install'); b.innerHTML = '<span>📲 iPhone : touchez <b>Partager</b> ⬆️ puis <b>« Sur l\'écran d\'accueil »</b></span>'; b.classList.remove('hidden'); }
}

/* ---------- Premier lancement ---------- */
function onboarding() {
  const hero = heroSrc();
  openSheet('<div style="text-align:center">' + (hero ? '<img src="' + hero + '" style="width:100%;border-radius:999px 999px 22px 22px" alt="">' : '<div class="heroph" style="border-radius:999px 999px 22px 22px">🏡</div>') +
    '<h2 style="margin-top:12px">Bienvenue dans Rozane et Rochane Family</h2><p class="mute">Le planning de la famille, sans connexion. Vos données restent uniquement sur ce téléphone.</p></div>' +
    (S.imported ? '' : '<label class="btn full" style="display:block;text-align:center">🔐 Ouvrir notre fichier privé<input type="file" accept=".json,application/json" id="bkIn" hidden></label><p class="mute" style="text-align:center;margin:8px 0">ou</p>') +
    '<p style="text-align:center;font-weight:800;margin:6px 0 8px">C\'est le téléphone de :</p>' +
    ['maman', 'papa'].map((id, i) => '<button class="btn ' + (i ? 'sec ' : '') + 'full" style="margin-top:8px" data-a="onb" data-id="' + id + '">' + esc(pname(id)) + '</button>').join('') +
    '<div class="credit">Créé par Rochdi MECHETI</div>');
}
A.onb = d => { S.owner = d.id; save(); closeSheet(); render(); if (!S.pin) pinSetup(true); else A.askNotif(); };

/* ---------- Photo de famille & verrouillage ---------- */
function heroSrc() { try { return localStorage.getItem('kaelumHero') || ''; } catch (e) { return ''; } }
async function sha(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kaelum:' + t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
let pinBuf = '', pinMode = '', pinFirst = '', hiddenAt = 0, locked = false;
function pinScreen(title, sub) {
  let el = $('#lock'); if (!el) { el = document.createElement('div'); el.id = 'lock'; document.body.appendChild(el); }
  const dots = [0, 1, 2, 3].map(i => '<i class="' + (i < pinBuf.length ? 'on' : '') + '"></i>').join('');
  el.className = 'lock';
  el.innerHTML = '<div class="lockin"><img src="icons/icon-192.png" alt=""><h2>' + title + '</h2><p>' + sub + '</p><div class="pdots">' + dots + '</div><div class="pad">' +
    [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : '<button data-a="pinKey" data-k="' + k + '">' + k + '</button>').join('') + '</div>' +
    (pinMode === 'unlock' ? '<button class="lnk" data-a="pinForgot">Code oublié ?</button>' : '<button class="lnk" data-a="pinSkip">' + (pinMode === 'set1' && S.pin ? 'Annuler' : 'Plus tard') + '</button>') + '<div class="lcred">Rozane et Rochane Family · Créé par Rochdi MECHETI</div></div>';
}
function lockNow() { if (!S.pin) return; locked = true; pinMode = 'unlock'; pinBuf = ''; pinScreen('Rozane et Rochane Family', 'Entre ton code'); }
function pinSetup(first) { pinMode = 'set1'; pinBuf = ''; pinScreen('Code secret', first ? 'Choisis un code à 4 chiffres pour protéger l\'appli' : 'Nouveau code à 4 chiffres'); }
function unlockDone() { locked = false; const el = $('#lock'); if (el) el.remove(); }
A.pinKey = async d => {
  if (d.k === '⌫') pinBuf = pinBuf.slice(0, -1); else if (pinBuf.length < 4) pinBuf += d.k;
  if (navigator.vibrate) navigator.vibrate(15);
  if (pinBuf.length < 4) return pinScreen($('#lock h2').textContent, $('#lock p').textContent);
  const code = pinBuf; pinBuf = '';
  if (pinMode === 'unlock') {
    if (await sha(code) === S.pin) { unlockDone(); tick(); } else { pinScreen('Rozane et Rochane Family', '❌ Code incorrect, réessaie'); if (navigator.vibrate) navigator.vibrate([80, 60, 80]); }
  } else if (pinMode === 'set1') { pinFirst = code; pinMode = 'set2'; pinScreen('Code secret', 'Retape le code pour confirmer'); }
  else if (pinMode === 'set2') {
    if (code === pinFirst) { S.pin = await sha(code); save(); unlockDone(); toast('🔐 Code enregistré'); if (view === 'plus') render(); A.askNotif(); }
    else { pinMode = 'set1'; pinScreen('Code secret', '❌ Les codes ne correspondent pas, recommence'); }
  }
};
A.pinSkip = () => { unlockDone(); };
A.pinForgot = () => {
  if (confirm('Sans le code, la seule solution est d\'effacer les données de l\'appli sur ce téléphone (puis de rouvrir le fichier privé). Continuer ?') && confirm('Vraiment tout effacer ?')) { localStorage.clear(); indexedDB.deleteDatabase('kaelumPhotos'); location.reload(); }
};
A.pinSet = () => pinSetup(false);
A.pinOff = () => { if (confirm('Retirer le code de verrouillage ?')) { S.pin = ''; save(); render(); } };
A.avPick = d => {
  const p = person(d.id); if (!p) return;
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
  i.onchange = async () => {
    const f = i.files[0]; if (!f) return;
    const url = await squareThumb(f, 320); localStorage.setItem('kaelumAv_' + p.id, url);
    toast('📷 Photo de ' + p.name + ' enregistrée'); render();
  };
  i.click();
};
function squareThumb(file, size) {
  return new Promise(res => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const m = Math.min(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = size;
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
      URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', 0.85));
    };
    img.src = u;
  });
}
A.heroPick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async () => { const b = await compress(i.files[0]); localStorage.setItem('kaelumHero', await blobToB64(b)); toast('📷 Photo de famille enregistrée'); render(); }; i.click(); };

/* ======================================================================
   LISTE DE COURSES
   ====================================================================== */
let repasTab = 'courses';
const COURSE_CATS = [
  ['fruits', '🍎 Fruits & légumes', /pomme|banane|orange|clémentine|clementine|citron|fraise|raisin|poire|kiwi|mangue|ananas|melon|pastèque|tomate|salade|carotte|courgette|aubergine|poivron|oignon|ail|pomme de terre|patate|concombre|brocoli|chou|épinard|epinard|haricot vert|persil|coriandre|menthe|avocat|potiron|navet|légume|legume|fruit|dattes?/i],
  ['frais', '🥛 Frais & laitier', /lait(?! bébé| bebe| infantile| 1er| 2e| 2ème| croissance)|yaourt|yogourt|fromage|beurre|crème|creme|œuf|oeuf|petit-suisse|petits suisses|lben|raib|kiri|vache qui rit|camembert|mozzarella|emmental/i],
  ['viande', '🍗 Viande & poisson', /poulet|viande|bœuf|boeuf|agneau|mouton|dinde|steak|haché|hache|merguez|kefta|poisson|saumon|thon|sardine|crevette|cabillaud|escalope/i],
  ['bebe', '👶 Bébé', /couche|lingette|lait bébé|lait bebe|lait infantile|lait 1er|lait 2e|lait 2ème|lait croissance|petit pot|compote bébé|biberon|tétine|tetine|liniment|sérum phy|serum phy|blédine|bledine|céréales bébé/i],
  ['boulangerie', '🥖 Pain & petit-déj', /pain|baguette|brioche|croissant|biscotte|céréale|cereale|confiture|miel|nutella|pâte à tartiner|gâteau|gateau|biscuit|madeleine/i],
  ['epicerie', '🥫 Épicerie', /riz|pâtes|pates|semoule|couscous|farine|sucre|sel|poivre|huile|vinaigre|épice|epice|cumin|lentille|pois chiche|haricot|conserve|sauce|ketchup|mayonnaise|moutarde|thé|the |café|cafe|chocolat|levure|frik|vermicelle|olive/i],
  ['boissons', '🧃 Boissons', /eau|jus|soda|coca|sirop|lait de coco|boisson/i],
  ['hygiene', '🧴 Hygiène & maison', /savon|shampo|gel douche|dentifrice|brosse|déodorant|deodorant|papier toilette|pq|essuie|sopalin|lessive|adoucissant|liquide vaisselle|éponge|eponge|javel|sac poubelle|coton|serviette|mouchoir/i],
  ['autre', '📦 Autre', /.*/]
];
const COURSE_SUGG = ['Lait', 'Pain', 'Œufs', 'Couches', 'Lingettes', 'Lait bébé', 'Bananes', 'Pommes', 'Yaourts', 'Poulet', 'Riz', 'Pâtes', 'Tomates', 'Oignons', 'Fromage', 'Eau', 'Huile d\'olive', 'Semoule', 'Dattes', 'Papier toilette'];
const courseCat = t => (COURSE_CATS.find(c => c[2].test(t)) || COURSE_CATS[COURSE_CATS.length - 1])[0];
function vCourses() {
  const L = S.courses || [];
  const todo = L.filter(c => !c.done), done = L.filter(c => c.done);
  let h = '<div class="card"><h2>🛒 Liste de courses <span class="pill">' + todo.length + ' à acheter</span></h2>' +
    '<div class="row" style="gap:8px"><input id="cIn" placeholder="Ex. lait, 2 baguettes, couches…" style="flex:1;border:1.5px solid var(--line);border-radius:14px;padding:12px;background:var(--bg)"><button class="btn" data-a="cAdd">Ajouter</button></div>' +
    '<div class="row wrap" style="gap:6px;margin-top:10px">' + COURSE_SUGG.filter(s => !todo.some(c => c.txt.toLowerCase() === s.toLowerCase())).slice(0, 10).map(s => '<button class="chip" data-a="cSugg" data-t="' + esc(s) + '">+ ' + esc(s) + '</button>').join('') + '</div></div>';
  if (!L.length) return h + '<div class="empty">La liste est vide. Ajoute ce qu\'il faut acheter : ' + (S.sync && S.sync.base ? 'l\'autre téléphone le reçoit en direct.' : 'pense à lier vos téléphones dans Réglages.') + '</div>';
  for (const [k, lab] of COURSE_CATS) {
    const it = todo.filter(c => c.cat === k); if (!it.length) continue;
    h += '<div class="card"><h2 style="font-size:16px">' + lab + '</h2>' + it.map(courseRow).join('') + '</div>';
  }
  if (done.length) h += '<div class="card"><h2 style="font-size:16px">✅ Dans le panier <button class="btn sm sec" data-a="cClear">Vider</button></h2>' + done.map(courseRow).join('') + '</div>';
  return h;
}
function courseRow(c) {
  return '<div class="item' + (c.done ? ' done' : '') + '"><button class="chk' + (c.done ? ' on' : '') + '" data-a="cTog" data-id="' + c.id + '">' + (c.done ? '✓' : '') + '</button>' +
    '<div class="body" data-a="cEdit" data-id="' + c.id + '"><b>' + esc(c.txt) + '</b>' + (c.qty ? ' <span class="pill">' + esc(c.qty) + '</span>' : '') +
    '<div class="who">' + (c.by ? avatar(c.by) + ' ' + esc(pname(c.by)) : '') + '</div></div><button class="chk" style="border:0;opacity:.5" data-a="cDel" data-id="' + c.id + '">✕</button></div>';
}
function parseCourse(raw) {
  let t = raw.trim(); if (!t) return null;
  let qty = '';
  const m = t.match(/^(\d+[.,]?\d*\s*(?:kg|g|l|cl|ml|x|paquets?|boîtes?|boites?|bouteilles?|packs?)?)\s+(.+)$/i) || t.match(/^(.+?)\s+[x×]\s*(\d+)$/i);
  if (m) { if (/^\d/.test(m[1])) { qty = m[1].trim(); t = m[2]; } else { t = m[1]; qty = m[2]; } }
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return { id: uid(), txt: t, qty, cat: courseCat(t), done: false, by: S.owner, at: Date.now() };
}
function addCourses(text) {
  S.courses = S.courses || [];
  let n = 0;
  for (const part of text.split(/[,;\n]+/)) { const c = parseCourse(part); if (c) { S.courses.push(c); n++; } }
  if (n) { save(); render(); setTimeout(() => { const i = $('#cIn'); if (i) i.focus(); }, 50); }
}
Object.assign(A, {
  rtab(d) { repasTab = d.t; render(); },
  cAdd() { const i = $('#cIn'); if (i && i.value.trim()) addCourses(i.value); },
  cSugg(d) { addCourses(d.t); },
  cTog(d) { const c = (S.courses || []).find(x => x.id === d.id); if (c) { c.done = !c.done; save(); render(); } },
  cDel(d) { S.courses = (S.courses || []).filter(x => x.id !== d.id); save(); render(); },
  cClear() { S.courses = (S.courses || []).filter(x => !x.done); save(); render(); },
  cEdit(d) {
    const c = (S.courses || []).find(x => x.id === d.id); if (!c) return;
    form('Modifier', [{ k: 'txt', label: 'Article' }, { k: 'qty', label: 'Quantité', ph: 'Ex. 2, 1 kg, 3 paquets' },
      { k: 'cat', label: 'Rayon', type: 'select', options: COURSE_CATS.map(x => [x[0], x[1]]) }], c, v => {
      if (!v.txt) { toast('Nom manquant'); return false; } Object.assign(c, v);
    }, () => { S.courses = S.courses.filter(x => x !== c); });
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'cIn') A.cAdd(); });

/* ======================================================================
   SYNCHRO EN DIRECT ENTRE LES DEUX TÉLÉPHONES (ntfy.sh, données chiffrées)
   ====================================================================== */
const NTFY = 'https://ntfy.sh';
const APP_URL = location.origin + location.pathname.replace(/index\.html$/, '');
const SHARED = ['events', 'courses', 'meds', 'vaccines', 'birthdays'];
const other = () => S.owner === 'papa' ? 'maman' : 'papa';
const b64u = u8 => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => b64d(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
const jhash = o => { let h = 0; const s = JSON.stringify(o); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
const sharedItem = (col, x) => !(col === 'events' && x.src); // le planning chiffré n'est pas re-partagé
let syncTimer = null, pushTimer = null, lastPushHash = null, syncBusy = false;

async function sKey() { return crypto.subtle.importKey('raw', unb64u(S.sync.key), 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function gz(str) {
  if (typeof CompressionStream === 'undefined') return new TextEncoder().encode(str);
  const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(cs).arrayBuffer());
}
async function gunz(u8, zipped) {
  if (!zipped) return new TextDecoder().decode(u8);
  const ds = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(ds).text();
}
// Repère les éléments modifiés/supprimés depuis la dernière fois → horodatage (dernier qui écrit gagne)
function stamp() {
  S.hashes = S.hashes || {}; S.tomb = S.tomb || {};
  const now = Date.now(), seen = {}, changed = [];
  for (const col of SHARED) for (const x of (S[col] || [])) {
    if (!sharedItem(col, x)) continue;
    const { upd, by2, ...core } = x, hsh = jhash(core), k = col + ':' + x.id;
    seen[k] = 1;
    if (S.hashes[k] !== hsh) { x.upd = now; x.by2 = S.owner; S.hashes[k] = hsh; changed.push([col, x, S.hashes[k + '#n'] === undefined]); S.hashes[k + '#n'] = 1; }
  }
  for (const k in S.hashes) { if (k.includes('#')) continue; if (!seen[k]) { S.tomb[k] = now; delete S.hashes[k]; delete S.hashes[k + '#n']; changed.push(['del', { k }, false]); } }
  return changed;
}
function snapshot() {
  const o = { from: S.owner, t: Date.now(), tomb: S.tomb || {}, sched: S.sched || {} };
  for (const col of SHARED) o[col] = (S[col] || []).filter(x => sharedItem(col, x));
  return o;
}
function mergeSnap(o) {
  let n = 0; S.tomb = S.tomb || {}; S.hashes = S.hashes || {};
  for (const k in (o.tomb || {})) if (!S.tomb[k] || S.tomb[k] < o.tomb[k]) S.tomb[k] = o.tomb[k];
  Object.assign(S.sched = S.sched || {}, o.sched || {});
  for (const col of SHARED) {
    S[col] = S[col] || [];
    for (const x of (o[col] || [])) {
      const k = col + ':' + x.id, t = S.tomb[k];
      if (t && t >= (x.upd || 0)) continue;
      const i = S[col].findIndex(y => y.id === x.id);
      if (i < 0) { S[col].push(x); n++; }
      else if ((x.upd || 0) > (S[col][i].upd || 0)) { S[col][i] = x; n++; }
      else continue;
      const { upd, by2, ...core } = x; S.hashes[k] = jhash(core); S.hashes[k + '#n'] = 1;
    }
    // suppressions reçues
    const before = S[col].length;
    S[col] = S[col].filter(y => { const t = S.tomb[col + ':' + y.id]; return !(t && t >= (y.upd || 0)); });
    if (S[col].length !== before) n += before - S[col].length;
    for (const y of S[col]) if (!S.tomb[col + ':' + y.id]) { } // rien
  }
  for (const k in S.tomb) if (S.hashes[k] !== undefined) { const [col, id] = k.split(':'); if (!(S[col] || []).some(y => y.id === id)) { delete S.hashes[k]; delete S.hashes[k + '#n']; } }
  return n;
}
function describe(changed) {
  const lines = [];
  for (const [col, x, isNew] of changed) {
    if (col === 'del') continue;
    if (col === 'courses') { if (isNew) lines.push('🛒 ' + x.txt + (x.qty ? ' (' + x.qty + ')' : '')); continue; }
    if (col === 'events') lines.push((isNew ? '📅 ' : '✏️ ') + x.title + ' — ' + fmtShort(x.date) + (x.time ? ' ' + x.time : '') + (x.person && x.person !== 'all' ? ' (' + pname(x.person) + ')' : ''));
    else if (col === 'meds') lines.push('💊 ' + x.name + ' — ' + pname(x.person));
    else if (col === 'vaccines') lines.push('💉 ' + x.name + ' — ' + pname(x.person));
    else if (col === 'birthdays') lines.push('🎂 ' + x.name);
  }
  return lines;
}
async function ntfyPost(topic, body, headers) {
  return fetch(NTFY + '/' + topic, { method: 'POST', body, headers: headers || {} });
}
function schedulePush() { if (!S.sync || !S.sync.base || !S.owner) return; clearTimeout(pushTimer); pushTimer = setTimeout(syncPush, 1500); }
async function syncPush(force) {
  if (!S.sync || !S.sync.base || !navigator.onLine) return;
  const changed = stamp();
  const sn = snapshot(), hsh = jhash({ ...sn, t: 0 });
  if (!force && !changed.length && hsh === lastPushHash) { saveRaw(); return; }
  saveRaw();
  try {
    const key = await sKey(), iv = crypto.getRandomValues(new Uint8Array(12));
    const zipped = typeof CompressionStream !== 'undefined';
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await gz(JSON.stringify(sn))));
    const payload = b64u(iv) + '.' + b64u(ct), id = uid(), size = 3000, n = Math.ceil(payload.length / size);
    for (let i = 0; i < n; i++) await ntfyPost(S.sync.base + '-d', JSON.stringify({ s: id, i, n, z: zipped ? 1 : 0, f: S.owner, d: payload.slice(i * size, (i + 1) * size) }));
    lastPushHash = hsh; S.sync.pushedAt = Date.now(); saveRaw();
    const lines = describe(changed);
    if (lines.length && !force) {
      const isCourses = changed.every(c => c[0] === 'courses' || c[0] === 'del');
      await ntfyPost(S.sync.base + '-' + other(), lines.slice(0, 8).join('\n') + (lines.length > 8 ? '\n… +' + (lines.length - 8) : ''), {
        Title: pname(S.owner) + (isCourses ? ' a ajouté aux courses' : ' a mis à jour le planning'), Tags: isCourses ? 'shopping_cart' : 'calendar', Priority: '4', Click: APP_URL
      });
    }
    scheduleRdvAlarms();
  } catch (e) { }
}
async function syncPull() {
  if (!S.sync || !S.sync.base || !navigator.onLine || syncBusy) return;
  syncBusy = true;
  try {
    const since = S.sync.since || 'all';
    const r = await fetch(NTFY + '/' + S.sync.base + '-d/json?poll=1&since=' + encodeURIComponent(since), { cache: 'no-store' });
    if (!r.ok) return;
    const msgs = (await r.text()).split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(m => m && m.event === 'message');
    if (!msgs.length) return;
    S.sync.since = msgs[msgs.length - 1].id;
    const groups = {};
    for (const m of msgs) { let p; try { p = JSON.parse(m.message); } catch (e) { continue; } if (!p.s || p.f === S.owner) continue; (groups[p.s] = groups[p.s] || { n: p.n, z: p.z, parts: [], t: m.time }).parts[p.i] = p.d; }
    const key = await sKey(); let total = 0, newestFrom = null;
    for (const g of Object.values(groups).sort((a, b) => a.t - b.t)) {
      if (g.parts.filter(x => x !== undefined).length !== g.n) continue;
      const [iv, ct] = g.parts.join('').split('.');
      try {
        const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(iv) }, key, unb64u(ct)));
        const o = JSON.parse(await gunz(plain, g.z)); total += mergeSnap(o); newestFrom = o.from;
      } catch (e) { }
    }
    S.sync.pulledAt = Date.now(); saveRaw();
    if (total) { render(); toast('🔄 Mis à jour depuis le téléphone de ' + pname(newestFrom || other())); }
  } catch (e) { } finally { syncBusy = false; }
}
function saveRaw() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
function startSync() {
  if (!S.sync || !S.sync.base) return;
  clearInterval(syncTimer);
  syncPull().then(() => syncPush(true));
  syncTimer = setInterval(() => { if (!document.hidden) syncPull(); }, 15000);
}
// Liaison par lien (#lien-...)
function pairLink() { return APP_URL + '#lien-' + b64u(new TextEncoder().encode(JSON.stringify({ b: S.sync.base, k: S.sync.key }))); }
function readPairHash() {
  const m = location.hash.match(/^#lien-([A-Za-z0-9_-]+)/); if (!m) return;
  try {
    const o = JSON.parse(new TextDecoder().decode(unb64u(m[1])));
    if (o.b && o.k) { S.sync = Object.assign(S.sync || {}, { base: o.b, key: o.k, since: '' }); saveRaw(); setTimeout(() => toast('🔗 Téléphones liés ! La synchro en direct est active.'), 900); }
  } catch (e) { }
  history.replaceState(null, '', location.pathname);
}
Object.assign(A, {
  syncCreate() {
    const rnd = b64u(crypto.getRandomValues(new Uint8Array(15))).replace(/[-_]/g, 'x').toLowerCase();
    S.sync = { base: 'rr-' + rnd, key: b64u(crypto.getRandomValues(new Uint8Array(32))), since: '' };
    S.hashes = {}; save(); render(); startSync();
  },
  async syncShare() {
    const t = 'Rozane et Rochane Family — touche ce lien pour lier ton téléphone au mien :\n' + pairLink();
    if (navigator.share) { try { await navigator.share({ text: t }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(pairLink()); toast('Lien copié'); } catch (e) { }
  },
  syncCopy() { navigator.clipboard.writeText(pairLink()).then(() => toast('Lien copié'), () => { }); },
  syncNow() { S.sync.since = ''; syncPull().then(() => syncPush(true)).then(() => toast('🔄 Synchro faite')); },
  syncOff() { if (confirm('Délier ce téléphone ? Il ne recevra plus les mises à jour.')) { S.sync = null; save(); clearInterval(syncTimer); render(); } },
  ntfySub(d) { location.href = 'ntfy://ntfy.sh/' + S.sync.base + '-' + d.t; },
  ntfyTest() { ntfyPost(S.sync.base + '-' + S.owner, 'Si tu lis ceci, les notifications marchent ✅', { Title: 'Test Rozane et Rochane Family', Tags: 'white_check_mark' }).then(() => toast('Notification de test envoyée')); },
  alarmTest() { ntfyPost(S.sync.base + '-alarme', 'Test de l\'alarme de rendez-vous', { Title: '⏰ Test alarme', Priority: '5', Tags: 'rotating_light', Click: APP_URL }).then(() => toast('Alarme de test envoyée')); }
});
function syncCard() {
  const s = S.sync;
  let h = '<div class="card"><h2>🔗 Liaison des téléphones</h2>';
  if (!s || !s.base) return h + '<div class="mute" style="margin-bottom:10px">Lie ton téléphone à celui de ' + esc(pname(other())) + ' : tout ce que tu ajoutes (courses, RDV, traitements, vaccins, anniversaires) arrive en direct chez l\'autre, avec une notification.</div><button class="btn full" data-a="syncCreate">Créer la liaison</button><div class="mute" style="margin-top:8px">Sur l\'autre téléphone, il suffira de toucher le lien que tu lui envoies.</div></div>';
  const ago = t => !t ? 'jamais' : (Math.round((Date.now() - t) / 60000) < 1 ? 'à l\'instant' : 'il y a ' + Math.round((Date.now() - t) / 60000) + ' min');
  h += '<div class="mute">✅ Synchro active · reçu ' + ago(s.pulledAt) + ' · envoyé ' + ago(s.pushedAt) + '</div>';
  h += '<div class="row wrap" style="gap:8px;margin:10px 0"><button class="btn sm" data-a="syncShare">📤 Envoyer le lien à ' + esc(pname(other())) + '</button><button class="btn sm sec" data-a="syncNow">🔄 Synchroniser</button></div>';
  h += '<h3>🔔 Notifications et alarmes, même appli fermée</h3><div class="mute" style="margin-bottom:8px">1) Installe l\'appli gratuite <b>ntfy</b> (<a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank">Play Store</a> · <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank">iPhone</a>). 2) Touche les deux boutons ci-dessous. 3) Dans ntfy, sur l\'abonnement « alarme », active <b>« Notifications insistantes »</b> pour que l\'alarme sonne jusqu\'à ce que tu l\'arrêtes.</div>';
  h += '<div class="row wrap" style="gap:8px"><button class="btn sm" data-a="ntfySub" data-t="' + S.owner + '">🔔 Mes notifications</button><button class="btn sm" data-a="ntfySub" data-t="alarme">⏰ Alarmes RDV</button></div>';
  h += '<div class="row wrap" style="gap:8px;margin-top:8px"><button class="btn sm sec" data-a="ntfyTest">Tester une notif</button><button class="btn sm sec" data-a="alarmTest">Tester l\'alarme</button><button class="btn sm sec" data-a="syncOff">Délier</button></div>';
  return h + '<div class="mute" style="margin-top:8px">Les données passent chiffrées. Le texte des notifications (ex. « 🛒 Lait ») transite en clair par ntfy.sh, sur un canal secret connu de vos deux téléphones seulement.</div></div>';
}

/* ======================================================================
   ALARMES DE RENDEZ-VOUS : la veille à 21 h et 1 h 30 avant — plein écran
   ====================================================================== */
const RDV_CATS = ['rdv', 'medecin'];
const isRdv = e => e && RDV_CATS.includes(e.cat) && e.time;
function rdvAlarmsFor(D) { // alarmes qui sonnent le jour D
  const out = [];
  for (const ev of S.events) {
    if (!isRdv(ev)) continue;
    if (occurs(ev, addDays(D, 1))) out.push({ at: '21:00', key: 'rdvV:' + ev.id + ':' + addDays(D, 1), ev, date: addDays(D, 1), msg: 'Demain à ' + ev.time });
    if (occurs(ev, D)) { const t = toMin(ev.time) - 90; if (t >= 0) out.push({ at: addMin(ev.time, -90), key: 'rdv90:' + ev.id + ':' + D, ev, date: D, msg: 'Dans 1 h 30, à ' + ev.time }); }
  }
  const tm = addDays(D, 1); // rendez-vous tôt le lendemain (avant 1 h 30) : alarme la veille au soir
  for (const ev of S.events) if (isRdv(ev) && occurs(ev, tm) && toMin(ev.time) - 90 < 0) out.push({ at: addMin(ev.time, -90), key: 'rdv90:' + ev.id + ':' + tm, ev, date: tm, msg: 'Dans 1 h 30, à ' + ev.time });
  return out;
}
let alarmLoop = null;
function fullAlarm(title, sub, who) {
  let el = $('#alarmfs'); if (!el) { el = document.createElement('div'); el.id = 'alarmfs'; document.body.appendChild(el); }
  el.className = 'alarmfs';
  el.innerHTML = '<div class="afin"><div class="aring">⏰</div><div class="atime">' + nowHM() + '</div><h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p>' + (who ? '<p class="awho">' + whoMark(who) + ' ' + esc(pname(who)) + '</p>' : '') +
    '<button class="abtn" data-a="alarmStop">J\'ai vu ✓</button><button class="abtn2" data-a="alarmSnooze" data-t="' + esc(title) + '" data-s="' + esc(sub) + '" data-w="' + esc(who || '') + '">Rappeler dans 10 min</button></div>';
  try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
  const ring = () => { const keep = S.notif.sound; S.notif.sound = true; beep(5); S.notif.sound = keep; if (navigator.vibrate) navigator.vibrate([600, 250, 600, 250, 600]); };
  ring(); clearInterval(alarmLoop); alarmLoop = setInterval(ring, 2600);
  if (document.hidden) notify(title, sub);
  try { navigator.wakeLock && navigator.wakeLock.request('screen').then(l => { el._lock = l; }).catch(() => { }); } catch (e) { }
}
Object.assign(A, {
  alarmStop() { clearInterval(alarmLoop); if (navigator.vibrate) navigator.vibrate(0); const el = $('#alarmfs'); if (el) { try { el._lock && el._lock.release(); } catch (e) { } el.remove(); } try { document.fullscreenElement && document.exitFullscreen(); } catch (e) { } },
  alarmSnooze(d) { A.alarmStop(); setTimeout(() => fullAlarm(d.t, d.s, d.w), 10 * 60000); toast('⏰ Je te rappelle dans 10 min'); }
});
function checkRdvAlarms() {
  const D = today(), now = toMin(nowHM()), fired = firedGet();
  for (const a of rdvAlarmsFor(D)) {
    const at = toMin(a.at);
    if (now >= at && now <= at + 3 && !fired[a.key]) { firedSet(a.key); fullAlarm((CATS[a.ev.cat] || CATS.rdv)[0] + ' ' + a.ev.title, a.msg + (a.ev.notes ? ' — ' + a.ev.notes : ''), a.ev.person); }
  }
}
// Alarmes programmées sur ntfy (sonnent même appli fermée) — ntfy accepte jusqu'à 3 jours à l'avance
async function scheduleRdvAlarms() {
  if (!S.sync || !S.sync.base || !navigator.onLine) return;
  S.sched = S.sched || {};
  const nowMs = Date.now(), max = nowMs + 70 * 3600 * 1000;
  let changed = false;
  for (let i = 0; i < 3; i++) {
    for (const a of rdvAlarmsFor(addDays(today(), i))) {
      const [y, mo, d] = (a.key.startsWith('rdvV') ? addDays(a.date, -1) : (toMin(a.ev.time) - 90 < 0 ? addDays(a.date, -1) : a.date)).split('-').map(Number), [H, M] = a.at.split(':').map(Number);
      const when = new Date(y, mo - 1, d, H, M).getTime();
      const sk = a.key + '@' + a.ev.time;
      if (when < nowMs + 60000 || when > max || S.sched[sk]) continue;
      try {
        const r = await ntfyPost(S.sync.base + '-alarme', a.msg + (a.ev.notes ? ' — ' + a.ev.notes : '') + (a.ev.person && a.ev.person !== 'all' ? ' (' + pname(a.ev.person) + ')' : ''), {
          Title: '⏰ ' + a.ev.title, Priority: '5', Tags: 'rotating_light', At: String(Math.floor(when / 1000)), Click: APP_URL
        });
        if (r.ok) { S.sched[sk] = Math.floor(when / 1000); changed = true; }
      } catch (e) { }
    }
  }
  for (const k in S.sched) if (S.sched[k] * 1000 < nowMs - 86400000) { delete S.sched[k]; changed = true; }
  if (changed) { saveRaw(); }
}

/* ---------- Démarrage ---------- */
load();
readPairHash();
render();
if (!S.owner) onboarding(); else lockNow();
iosHint();
/* Mise à jour automatique de l'appli */
if ('serviceWorker' in navigator) {
  const hadCtrl = !!navigator.serviceWorker.controller;
  let reloading = false, pendingReload = false;
  const doReload = () => { if (reloading) return; reloading = true; try { sessionStorage.setItem('kUpd', '1'); } catch (e) { } location.reload(); };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadCtrl) return; // première installation : pas besoin de recharger
    if ($('#modal').classList.contains('hidden') && !$('#lock')) doReload(); else pendingReload = true;
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    const check = () => { if (navigator.onLine) reg.update().catch(() => { }); };
    check();
    setInterval(check, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (pendingReload && $('#modal').classList.contains('hidden') && !$('#lock')) doReload(); else check(); } });
    window.addEventListener('online', check);
  }).catch(() => { });
  try { if (sessionStorage.getItem('kUpd')) { sessionStorage.removeItem('kUpd'); setTimeout(() => toast('✨ Appli mise à jour'), 800); } } catch (e) { }
}
fetchWeather();
syncPlanning();
startSync();
scheduleRdvAlarms();
setInterval(scheduleRdvAlarms, 30 * 60 * 1000);
setInterval(fetchWeather, 30 * 60 * 1000);
setInterval(syncPlanning, 60 * 60 * 1000);
setInterval(tick, 20000); setTimeout(tick, 1500);
setInterval(() => { if (view === 'accueil' && $('#modal').classList.contains('hidden')) render(); }, 60000);
window.addEventListener('online', () => { fetchWeather(); syncPlanning(); syncPull().then(() => syncPush()); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { hiddenAt = Date.now(); return; } if (hiddenAt && Date.now() - hiddenAt > 120000 && !locked) lockNow(); if (!document.hidden) { tick(); fetchWeather(); syncPlanning(); syncPull(); if ($('#modal').classList.contains('hidden')) render(); } });
// Nettoyage des anciens journaux de rappels
for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('kaelumFired_') && k < 'kaelumFired_' + addDays(today(), -3)) localStorage.removeItem(k); }

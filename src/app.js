// Dance With Mary Jane — app logic.
// Wires the UI to economy.js (the source of truth) and persists to localStorage.

import {
  EARN, CURRENCY, DISPLAY, MUNCHIES_PENALTY,
  EXCEPTIONALS_PER_MONTH, CLEANING_PER_WEEK, CLEANING_PER_DAY,
  WORKOUT_PER_WEEK, WORKOUT_PER_DAY, MUNCHIES_PER_DAY,
  VACATION_LEAD_DAYS, multiplier, costOf, isGrindDay, canMarkDayOff, dayKey,
} from './economy.js';

const STORE_KEY = 'dwmj.state.v1';
const SMOKE_ORDER = ['oneHitter', 'pipe', 'bong', 'xmax', 'xq2small', 'xq2large'];
const LABELS = {
  daily: 'Daily', workout: 'Workout', cleaning: 'Cleaning', friday: 'Friday bonus',
  oneHitter: DISPLAY.oneHitter, pipe: DISPLAY.pipe, bong: DISPLAY.bong,
  xmax: DISPLAY.xmax, xq2small: DISPLAY.xq2small, xq2large: DISPLAY.xq2large,
  exceptional: 'Exceptional', munchies: 'Munchies',
};

// --- state ---
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && typeof s === 'object') {
      const st = { balance: 0, lastCreditDate: null, daysOff: [], log: [], ...s };
      // migrate daysOff from string[] to {date, reason}[]
      st.daysOff = (st.daysOff || []).map(o => typeof o === 'string' ? { date: o, reason: '' } : o);
      return st;
    }
  } catch { /* ignore corrupt store */ }
  return { balance: 0, lastCreditDate: null, daysOff: [], log: [] };
}
let state = loadState();
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
const daysOffSet = () => new Set(state.daysOff.map(o => o.date));

// --- date helpers ---
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function atNoon(d) { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; }
function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function isoWeekKey(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(x.getUTCFullYear(), 0, 4));
  const fd = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - fd + 3);
  const week = 1 + Math.round((x - firstThu) / (7 * 86400000));
  return `${x.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// --- derived counters ---
const countInWeek = action => {
  const wk = isoWeekKey(new Date());
  return state.log.filter(e => e.action === action && isoWeekKey(new Date(e.ts)) === wk).length;
};
const countToday = action => {
  const tk = dayKey(new Date());
  return state.log.filter(e => e.action === action && dayKey(new Date(e.ts)) === tk).length;
};
const cleaningThisWeek = () => countInWeek('cleaning');
const workoutThisWeek = () => countInWeek('workout');
const munchiesToday = () => countToday('munchies');
const exceptionalsThisMonth = () => {
  const mk = monthKey(new Date());
  return state.log.filter(e => e.action === 'exceptional' && monthKey(new Date(e.ts)) === mk).length;
};

// --- log + mutations ---
function log(type, action, delta, mult, note, ts) {
  state.log.push({ ts: (ts || new Date()).toISOString(), type, action, delta, mult: mult ?? null, balAfter: state.balance, note: note || '' });
}

function creditCatchUp() {
  const today = atNoon(new Date());
  let start;
  if (!state.lastCreditDate) { start = new Date(today); }
  else { start = atNoon(parseKey(state.lastCreditDate)); start.setDate(start.getDate() + 1); }
  let days = 0;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const ts = atNoon(d);
    state.balance += EARN.daily;
    log('earn', 'daily', EARN.daily, null, '', ts);
    if (d.getDay() === 5) { state.balance += EARN.friday; log('earn', 'friday', EARN.friday, null, '', ts); }
    days += 1;
  }
  state.lastCreditDate = dayKey(today);
  if (days > 0) save();
  return days;
}

function earn(action) {
  if (action === 'cleaning') {
    if (countToday('cleaning') >= CLEANING_PER_DAY) return toast(`Cleaning already logged today (max ${CLEANING_PER_DAY}/day).`);
    if (cleaningThisWeek() >= CLEANING_PER_WEEK) return toast(`Cleaning cap reached (${CLEANING_PER_WEEK} per week).`);
  }
  if (action === 'workout') {
    if (countToday('workout') >= WORKOUT_PER_DAY) return toast(`Workout already logged today (max ${WORKOUT_PER_DAY}/day).`);
    if (workoutThisWeek() >= WORKOUT_PER_WEEK) return toast(`Workout cap reached (${WORKOUT_PER_WEEK} per week).`);
  }
  state.balance += EARN[action];
  log('earn', action, EARN[action], null);
  save(); render();
}

function smoke(action) {
  const now = new Date();
  const cost = costOf(action, now, daysOffSet());
  if (state.balance < cost)
    return toast(`Can't afford ${DISPLAY[action]} — costs ${cost} ${CURRENCY}, you have ${state.balance}.`);
  state.balance -= cost;
  log('spend', action, -cost, multiplier(now, daysOffSet()));
  save(); render();
}

function useException(reason) {
  if (exceptionalsThisMonth() >= EXCEPTIONALS_PER_MONTH) { toast('No exceptionals left this month.'); return false; }
  if (!reason || !reason.trim()) { toast('A written reason is required.'); return false; }
  log('spend', 'exceptional', 0, null, reason.trim());
  save(); render();
  return true;
}

function munchies() {
  if (munchiesToday() >= MUNCHIES_PER_DAY) return toast(`Munchies already logged today (max ${MUNCHIES_PER_DAY}/day).`);
  const take = Math.min(MUNCHIES_PENALTY, state.balance);
  state.balance -= take;
  log('penalty', 'munchies', -take, null);
  save(); render();
}

function addDayOff(key, reason) {
  if (!key) return;
  if (!canMarkDayOff(parseKey(key), new Date()))
    return toast(`Days off must be at least ${VACATION_LEAD_DAYS} days ahead.`);
  if (state.daysOff.some(o => o.date === key)) return toast('That day is already marked off.');
  state.daysOff.push({ date: key, reason: (reason || '').trim() });
  state.daysOff.sort((a, b) => a.date.localeCompare(b.date));
  save(); renderVacation(); render();
}
function removeDayOff(key) {
  state.daysOff = state.daysOff.filter(o => o.date !== key);
  save(); renderVacation(); render();
}

// --- rendering ---
const $ = id => document.getElementById(id);
const fmtDate = d => d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const fmtTime = d => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function logItemHtml(e) {
  const d = new Date(e.ts);
  const cls = e.delta > 0 ? 'pos' : e.delta < 0 ? 'neg' : 'zero';
  const sign = e.delta > 0 ? `+${e.delta}` : e.delta < 0 ? `${e.delta}` : '±0';
  let name = LABELS[e.action] || e.action;
  if (e.type === 'spend' && e.mult && e.action !== 'exceptional') name += ` ×${e.mult}`;
  const note = e.note ? `<span class="li-note">${escapeHtml(e.note)}</span>` : '';
  return `<li class="log-item">
    <span class="li-main"><span class="li-name">${name}</span>${note}<span class="li-time">${fmtDate(d)} · ${fmtTime(d)}</span></span>
    <span class="li-right"><span class="li-delta ${cls}">${sign}</span><br><span class="li-bal">${e.balAfter}</span></span>
  </li>`;
}

function renderContext() {
  const now = new Date();
  $('mult').textContent = `×${multiplier(now, daysOffSet())}`;
  const grind = isGrindDay(now, daysOffSet());
  const am = now.getHours() < 18;
  $('ctx-pills').innerHTML =
    `<span class="pill ${grind ? 'on' : ''}">grind +1</span>` +
    `<span class="pill ${am ? 'on' : ''}">before 6pm +1</span>`;
}

function renderSmokeButtons() {
  const now = new Date();
  $('smoke-buttons').innerHTML = SMOKE_ORDER.map(a => {
    const cost = costOf(a, now, daysOffSet());
    const broke = state.balance < cost;
    return `<button class="action smoke ${broke ? 'broke' : ''}" data-smoke="${a}">
      <span class="a-name">${DISPLAY[a]}</span>
      <span class="a-meta">${cost} ${broke ? '· can’t afford' : 'coins'}</span>
    </button>`;
  }).join('');
}

function renderRecent() {
  const items = state.log.slice(-5).reverse();
  $('log').innerHTML = items.length ? items.map(logItemHtml).join('') : '<li class="log-empty">Nothing logged yet.</li>';
}

function renderHistory() {
  const mk = $('hist-month').value || monthKey(new Date());
  const items = state.log.filter(e => monthKey(new Date(e.ts)) === mk).reverse();
  let earned = 0, spent = 0;
  items.forEach(e => { if (e.delta > 0) earned += e.delta; else spent += e.delta; });
  $('hist-summary').textContent = items.length
    ? `Earned +${earned} · Spent ${spent} · Net ${earned + spent >= 0 ? '+' : ''}${earned + spent} · ${items.length} entries`
    : 'No entries this month.';
  $('history-log').innerHTML = items.length ? items.map(logItemHtml).join('') : '<li class="log-empty">No entries this month.</li>';
}

// --- vacation calendar ---
let vacMonth = null;
const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function renderCalendar() {
  if (!vacMonth) { vacMonth = new Date(); vacMonth.setDate(1); }
  const y = vacMonth.getFullYear(), m = vacMonth.getMonth();
  $('cal-label').textContent = vacMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const off = daysOffSet();
  const todayKey = dayKey(new Date());
  const now = new Date();
  let cells = '';
  for (let i = 0; i < offset; i++) cells += '<span class="cal-cell blank"></span>';
  for (let d = 1; d <= dim; d++) {
    const date = new Date(y, m, d);
    const key = dayKey(date);
    const dow = date.getDay();
    let cls = 'cal-cell';
    if (dow === 0 || dow === 6) cls += ' weekend';
    if (off.has(key)) cls += ' off';
    if (key === todayKey) cls += ' today';
    if (!off.has(key) && !canMarkDayOff(date, now)) cls += ' locked';
    cells += `<button class="${cls}" data-day="${key}">${d}</button>`;
  }
  $('calendar').innerHTML =
    `<div class="cal-head">${WD.map(x => `<span>${x}</span>`).join('')}</div>` +
    `<div class="cal-grid">${cells}</div>`;
}

function renderDaysOffList() {
  const upcoming = state.daysOff.filter(o => o.date >= dayKey(new Date())).sort((a, b) => a.date.localeCompare(b.date));
  $('daysoff').innerHTML = upcoming.length
    ? upcoming.map(o => `<li class="doff">
        <span><span class="doff-date">${fmtDate(parseKey(o.date))}</span>${o.reason ? `<span class="doff-reason">${escapeHtml(o.reason)}</span>` : ''}</span>
        <button data-off="${o.date}" aria-label="Remove">×</button></li>`).join('')
    : '<li class="hint">No upcoming days off.</li>';
}

function renderVacation() { renderCalendar(); renderDaysOffList(); }

function render() {
  $('today-label').textContent = fmtDate(new Date());
  $('balance').textContent = state.balance;
  renderContext();
  renderSmokeButtons();
  $('workout-meta').textContent = `+1 · ${workoutThisWeek()}/${WORKOUT_PER_WEEK} wk`;
  $('clean-meta').textContent = `+1 · ${cleaningThisWeek()}/${CLEANING_PER_WEEK} wk`;
  $('exc-meta').textContent = `free · ${exceptionalsThisMonth()}/${EXCEPTIONALS_PER_MONTH} mo`;
  $('munch-meta').textContent = `−1 · ${munchiesToday()}/${MUNCHIES_PER_DAY} day`;
  renderRecent();
}

// --- views ---
function showView(name) {
  $('view-main').hidden = name !== 'main';
  $('view-history').hidden = name !== 'history';
  $('view-vacation').hidden = name !== 'vacation';
  if (name === 'history') { if (!$('hist-month').value) $('hist-month').value = monthKey(new Date()); renderHistory(); }
  if (name === 'vacation') renderVacation();
  window.scrollTo(0, 0);
}

// --- toast ---
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// --- events ---
document.addEventListener('click', e => {
  const smokeBtn = e.target.closest('[data-smoke]');
  if (smokeBtn) return smoke(smokeBtn.dataset.smoke);
  const earnBtn = e.target.closest('[data-earn]');
  if (earnBtn) return earn(earnBtn.dataset.earn);
  if (e.target.closest('[data-munch]')) return munchies();
  const offBtn = e.target.closest('[data-off]');
  if (offBtn) return removeDayOff(offBtn.dataset.off);
  if (e.target.closest('[data-back]')) return showView('main');
});

$('see-all').addEventListener('click', () => showView('history'));
$('hist-month').addEventListener('change', renderHistory);

// menu
$('menu-btn').addEventListener('click', () => $('menu-dialog').showModal());
$('menu-dialog').addEventListener('click', e => {
  const item = e.target.closest('[data-view]');
  if (item) { $('menu-dialog').close(); showView(item.dataset.view); return; }
  if (e.target.closest('[data-close]') || e.target === $('menu-dialog')) $('menu-dialog').close();
});

// calendar
$('cal-prev').addEventListener('click', () => { vacMonth.setMonth(vacMonth.getMonth() - 1); renderCalendar(); });
$('cal-next').addEventListener('click', () => { vacMonth.setMonth(vacMonth.getMonth() + 1); renderCalendar(); });
let pendingDayOff = null;
$('calendar').addEventListener('click', e => {
  const cell = e.target.closest('[data-day]');
  if (!cell) return;
  const key = cell.dataset.day;
  if (state.daysOff.some(o => o.date === key)) return removeDayOff(key);
  if (!canMarkDayOff(parseKey(key), new Date())) return toast(`Days off must be at least ${VACATION_LEAD_DAYS} days ahead.`);
  pendingDayOff = key;
  $('dayoff-date').textContent = fmtDate(parseKey(key));
  $('dayoff-reason').value = '';
  $('dayoff-dialog').showModal();
  $('dayoff-reason').focus();
});
$('dayoff-form').addEventListener('submit', e => {
  if (e.submitter && e.submitter.value === 'ok' && pendingDayOff) addDayOff(pendingDayOff, $('dayoff-reason').value);
  pendingDayOff = null;
});

// exceptional reason
$('exc-btn').addEventListener('click', () => {
  if (exceptionalsThisMonth() >= EXCEPTIONALS_PER_MONTH) return toast('No exceptionals left this month.');
  $('reason-text').value = '';
  $('reason-dialog').showModal();
  $('reason-text').focus();
});
$('reason-form').addEventListener('submit', e => {
  if (e.submitter && e.submitter.value === 'ok' && !useException($('reason-text').value)) e.preventDefault();
});

// --- boot ---
const credited = creditCatchUp();
render();
if (credited > 0) {
  toast(credited === 1 ? 'Welcome back — +1 for showing up today.'
    : `Welcome back — credited ${credited} days of showing up.`);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

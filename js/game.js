'use strict';

/* =====================================================================
   GAME CONFIGURATION
   Tweak these values to change the balance or add content.
   ===================================================================== */

const SAVE_KEY = 'token-tycoon-save-v1';
const MILESTONES = [25, 50, 100, 200, 300, 400, 500]; // each milestone doubles speed (or demand)
const BASE_PRICE = 0.001;             // $ per token, i.e. $1 per 1,000 tokens
const INVESTOR_BONUS = 0.02;          // +2% token price per investor
const INVESTOR_DIVISOR = 1e8;         // higher = rarer investors
const OFFLINE_CAP_SECONDS = 8 * 3600; // offline earnings capped at 8 h
const STOCK_SECONDS = 600;            // stock holds at most 10 min of demand
const MIN_STOCK = 1e4;
const FAST_CYCLE = 0.15;              // below this (seconds) the bar becomes "striped"
const UPGRADES_SHOWN = 12;
const DEFAULT_LAB_NAME = 'My AI Lab';

// Infrastructure produces tokens.
// baseCost: price of the 1st machine · costMult: price increase per purchase
// tokens: tokens per machine per cycle · time: cycle duration (s)
const INFRA = [
  { id: 'laptop',     name: 'Dev laptop',            icon: '💻', baseCost: 4,       costMult: 1.07, tokens: 1e3,     time: 1,   managerCost: 1e3 },
  { id: 'gpu',        name: 'Gaming PC with GPU',    icon: '🎮', baseCost: 60,      costMult: 1.15, tokens: 6e4,     time: 3,   managerCost: 1.5e4 },
  { id: 'serveur',    name: 'GPU server',            icon: '🖥️', baseCost: 720,     costMult: 1.14, tokens: 5.4e5,   time: 6,   managerCost: 1e5 },
  { id: 'rack',       name: 'GPU rack',              icon: '🗄️', baseCost: 8640,    costMult: 1.13, tokens: 4.32e6,  time: 12,  managerCost: 5e5 },
  { id: 'salle',      name: 'Server room',           icon: '🏢', baseCost: 103680,  costMult: 1.12, tokens: 5.184e7, time: 24,  managerCost: 1.2e6 },
  { id: 'datacenter', name: 'Data center',           icon: '🏭', baseCost: 1.24e6,  costMult: 1.11, tokens: 6.22e8,  time: 48,  managerCost: 1e7 },
  { id: 'polaire',    name: 'Arctic data center',    icon: '❄️', baseCost: 1.49e7,  costMult: 1.10, tokens: 7.46e9,  time: 96,  managerCost: 1.11e8 },
  { id: 'nucleaire',  name: 'Nuclear data center',   icon: '☢️', baseCost: 1.79e8,  costMult: 1.09, tokens: 8.96e10, time: 192, managerCost: 5.55e8 },
  { id: 'sousmarin',  name: 'Underwater data center',icon: '🌊', baseCost: 2.15e9,  costMult: 1.08, tokens: 1.07e12, time: 384, managerCost: 1e10 },
  { id: 'orbital',    name: 'Orbital data center',   icon: '🛰️', baseCost: 2.58e10, costMult: 1.07, tokens: 2.97e13, time: 768, managerCost: 1e11 },
];

// Customers buy tokens. demand: tokens bought per second per customer.
const CLIENTS = [
  { id: 'devs',       name: 'Curious developers',  icon: '🧑‍💻', baseCost: 4,       costMult: 1.07, demand: 1e3 },
  { id: 'etudiants',  name: 'Students',            icon: '🎓', baseCost: 60,      costMult: 1.15, demand: 2e4 },
  { id: 'startups',   name: 'Startups',            icon: '🚀', baseCost: 720,     costMult: 1.14, demand: 9e4 },
  { id: 'createurs',  name: 'Content creators',    icon: '✍️', baseCost: 8640,    costMult: 1.13, demand: 3.6e5 },
  { id: 'pme',        name: 'Small businesses',    icon: '🏪', baseCost: 103680,  costMult: 1.12, demand: 2.16e6 },
  { id: 'hopitaux',   name: 'Hospitals & labs',    icon: '🏥', baseCost: 1.24e6,  costMult: 1.11, demand: 1.3e7 },
  { id: 'banques',    name: 'Banks',               icon: '🏦', baseCost: 1.49e7,  costMult: 1.10, demand: 7.8e7 },
  { id: 'multinat',   name: 'Multinationals',      icon: '🏙️', baseCost: 1.79e8,  costMult: 1.09, demand: 4.7e8 },
  { id: 'gouv',       name: 'Governments',         icon: '🏛️', baseCost: 2.15e9,  costMult: 1.08, demand: 2.8e9 },
  { id: 'aliens',     name: 'Aliens',              icon: '👽', baseCost: 2.58e10, costMult: 1.07, demand: 3.9e10 },
];

// AI models: cost = tokens needed to train this model
const MODELS = [
  { name: 'Nano',              mult: 1,   cost: 0 },
  { name: 'Mini',              mult: 2,   cost: 1e7 },
  { name: 'Base',              mult: 4,   cost: 1e10 },
  { name: 'Pro',               mult: 8,   cost: 1e13 },
  { name: 'Ultra',             mult: 16,  cost: 1e16 },
  { name: 'Max',               mult: 32,  cost: 1e19 },
  { name: 'Genius',            mult: 64,  cost: 1e22 },
  { name: 'AGI',               mult: 128, cost: 1e25 },
  { name: 'Superintelligence', mult: 256, cost: 1e28 },
];

const INFRA_TIERS = [
  { key: 'cuda',  label: 'CUDA optimization',  costFactor: 1e3, mult: 3 },
  { key: 'quant', label: '4-bit quantization', costFactor: 1e6, mult: 3 },
  { key: 'puces', label: 'Custom chips',       costFactor: 1e9, mult: 3 },
];

const CLIENT_TIERS = [
  { key: 'pub',     label: 'Targeted campaign', costFactor: 1e3, mult: 3 },
  { key: 'offre',   label: 'Enterprise plan',   costFactor: 1e6, mult: 3 },
  { key: 'contrat', label: 'Exclusive deal',    costFactor: 1e9, mult: 3 },
];

const UPGRADES = [
  ...INFRA.flatMap(b => INFRA_TIERS.map(t => ({
    id: `infra-${b.id}-${t.key}`, kind: 'infra', target: b.id, icon: b.icon,
    name: t.label, desc: `${b.name}: tokens x${t.mult}`, mult: t.mult, cost: b.baseCost * t.costFactor,
  }))),
  ...CLIENTS.flatMap(c => CLIENT_TIERS.map(t => ({
    id: `client-${c.id}-${t.key}`, kind: 'clients', target: c.id, icon: c.icon,
    name: t.label, desc: `${c.name}: demand x${t.mult}`, mult: t.mult, cost: c.baseCost * t.costFactor,
  }))),
  { id: 'g-flash',   kind: 'infra',   target: 'all', icon: '⚡', name: 'Flash Attention',       desc: 'All infrastructure: tokens x3', mult: 3, cost: 5e7 },
  { id: 'g-moe',     kind: 'infra',   target: 'all', icon: '🧩', name: 'Mixture of Experts',    desc: 'All infrastructure: tokens x3', mult: 3, cost: 5e10 },
  { id: 'g-liquide', kind: 'infra',   target: 'all', icon: '💧', name: 'Liquid cooling',        desc: 'All infrastructure: tokens x3', mult: 3, cost: 5e13 },
  { id: 'g-quantum', kind: 'infra',   target: 'all', icon: '⚛️', name: 'Quantum computing',     desc: 'All infrastructure: tokens x5', mult: 5, cost: 5e16 },
  { id: 'g-app',     kind: 'clients', target: 'all', icon: '📱', name: 'Mobile app',            desc: 'All customers: demand x3',      mult: 3, cost: 5e7 },
  { id: 'g-api',     kind: 'clients', target: 'all', icon: '🔌', name: 'Public API',            desc: 'All customers: demand x3',      mult: 3, cost: 5e10 },
  { id: 'g-pub',     kind: 'clients', target: 'all', icon: '📺', name: 'TV ads',                desc: 'All customers: demand x3',      mult: 3, cost: 5e13 },
  { id: 'g-foyer',   kind: 'clients', target: 'all', icon: '🏠', name: 'An assistant in every home', desc: 'All customers: demand x5',  mult: 5, cost: 5e16 },
].sort((a, b) => a.cost - b.cost);

const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

/* =====================================================================
   GAME STATE
   ===================================================================== */

function newState() {
  return {
    labName: DEFAULT_LAB_NAME,
    money: 0,
    stock: 0,
    training: 0,
    modelIndex: 0,
    trainShare: 0,
    earnedThisRun: 0,
    allTimeEarned: 0,
    tokensProduced: 0,
    tokensSold: 0,
    investors: 0,
    resets: 0,
    playTime: 0,
    buyMode: '1',
    upgrades: [],
    lastSeen: Date.now(),
    infra: Object.fromEntries(INFRA.map((b, i) => [
      b.id, { owned: i === 0 ? 1 : 0, progress: 0, running: false, manager: false },
    ])),
    clients: Object.fromEntries(CLIENTS.map((c, i) => [c.id, { owned: i === 0 ? 1 : 0 }])),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const base = newState();
    const merged = { ...base, ...data, infra: { ...base.infra }, clients: { ...base.clients } };
    // Stay compatible with saves made before new content was added
    for (const b of INFRA) {
      if (data.infra && data.infra[b.id]) merged.infra[b.id] = { ...base.infra[b.id], ...data.infra[b.id] };
    }
    for (const c of CLIENTS) {
      if (data.clients && data.clients[c.id]) merged.clients[c.id] = { ...base.clients[c.id], ...data.clients[c.id] };
    }
    merged.upgrades = (data.upgrades || []).filter(id => UPGRADE_BY_ID[id]);
    merged.modelIndex = Math.min(merged.modelIndex, MODELS.length - 1);
    if (merged.labName === 'Mon labo IA') merged.labName = DEFAULT_LAB_NAME; // old French default
    return merged;
  } catch (e) {
    return null;
  }
}

function save() {
  state.lastSeen = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    // storage unavailable (private browsing…): the game keeps running without saving
  }
}

let state = load() || newState();

/* =====================================================================
   CALCULATIONS
   ===================================================================== */

function speedMult(owned) {
  let m = 1;
  for (const t of MILESTONES) if (owned >= t) m *= 2;
  return m;
}

function upgradeMult(kind, id) {
  let m = 1;
  for (const uid of state.upgrades) {
    const u = UPGRADE_BY_ID[uid];
    if (u.kind === kind && (u.target === id || u.target === 'all')) m *= u.mult;
  }
  return m;
}

// --- Infrastructure ---
const infraOf = b => state.infra[b.id];
const cycleTime = b => b.time / speedMult(infraOf(b).owned);
const tokensPerCycle = b => b.tokens * infraOf(b).owned * upgradeMult('infra', b.id);
const infraRate = b => (infraOf(b).owned ? tokensPerCycle(b) / cycleTime(b) : 0);

function capacity(onlyAutomated = false) {
  let sum = 0;
  for (const b of INFRA) {
    if (!onlyAutomated || infraOf(b).manager) sum += infraRate(b);
  }
  return sum;
}

// --- Customers ---
const clientOf = c => state.clients[c.id];
const clientDemand = c => c.demand * clientOf(c).owned * speedMult(clientOf(c).owned) * upgradeMult('clients', c.id);
const totalDemand = () => CLIENTS.reduce((sum, c) => sum + clientDemand(c), 0);

// --- Market ---
const price = () => BASE_PRICE * MODELS[state.modelIndex].mult * (1 + state.investors * INVESTOR_BONUS);
const stockCap = () => Math.max(MIN_STOCK, totalDemand() * STOCK_SECONDS);
const nextModel = () => MODELS[state.modelIndex + 1] || null;

// --- Purchases (shared by infrastructure and customers) ---
function costFor(def, owned, n) {
  const r = def.costMult;
  return def.baseCost * Math.pow(r, owned) * (Math.pow(r, n) - 1) / (r - 1);
}

function maxAffordable(def, owned) {
  const r = def.costMult;
  const first = def.baseCost * Math.pow(r, owned);
  let n = Math.floor(Math.log(state.money * (r - 1) / first + 1) / Math.log(r));
  while (n > 0 && costFor(def, owned, n) > state.money) n--; // fix floating-point rounding
  return Math.max(n, 0);
}

function purchaseCount(def, owned) {
  if (owned === 0) return 1;
  if (state.buyMode === 'max') return Math.max(1, maxAffordable(def, owned));
  return Number(state.buyMode);
}

// --- Investors ---
// Cube root: each extra investor requires earning much more
const totalInvestorsFor = earned => Math.floor(Math.cbrt(earned / INVESTOR_DIVISOR));
const earningsForInvestors = n => Math.pow(n, 3) * INVESTOR_DIVISOR;
const claimableInvestors = () => Math.max(0, totalInvestorsFor(state.allTimeEarned) - state.investors);

/* =====================================================================
   TOKEN ECONOMY
   ===================================================================== */

let earnedThisFrame = 0;

function earn(amount) {
  state.money += amount;
  state.earnedThisRun += amount;
  state.allTimeEarned += amount;
  earnedThisFrame += amount;
}

// Tokens come out of the machines: a share goes to training, the rest to stock
function produce(tokens) {
  state.tokensProduced += tokens;
  const forTraining = tokens * state.trainShare;
  train(forTraining);
  state.stock += tokens - forTraining;
  const cap = stockCap();
  if (state.stock > cap) {
    train(state.stock - cap); // unsellable surplus goes to training
    state.stock = cap;
  }
}

function train(tokens) {
  if (!nextModel()) return;
  state.training += tokens;
  let next = nextModel();
  while (next && state.training >= next.cost) {
    state.training -= next.cost;
    state.modelIndex++;
    toast(`🧠 New model "${next.name}" released! Your token price doubles`);
    next = nextModel();
  }
  if (!next) state.training = 0;
}

// Customers buy continuously from the stock
function sell(dt) {
  const sold = Math.min(state.stock, totalDemand() * dt);
  if (sold <= 0) return;
  state.stock -= sold;
  state.tokensSold += sold;
  earn(sold * price());
}

/* =====================================================================
   PLAYER ACTIONS
   ===================================================================== */

function startCycle(b) {
  const s = infraOf(b);
  if (s.owned > 0 && !s.running) {
    s.running = true;
    s.progress = 0;
  }
}

function buy(def, s, label) {
  const n = purchaseCount(def, s.owned);
  const cost = costFor(def, s.owned, n);
  if (cost > state.money) return;

  const before = s.owned;
  state.money -= cost;
  s.owned += n;

  if (before === 0) toast(`${def.icon} ${def.name} unlocked!`);
  for (const m of MILESTONES) {
    if (before < m && s.owned >= m) toast(`${def.icon} ${def.name}: ${m}! ${label} x2 ⚡`);
  }
  refreshPanel();
}

const buyInfra = b => buy(b, infraOf(b), 'Speed');
const buyClient = c => buy(c, clientOf(c), 'Demand');

function hireManager(b) {
  const s = infraOf(b);
  if (s.manager || !s.owned || state.money < b.managerCost) return;
  state.money -= b.managerCost;
  s.manager = true;
  toast(`👷 SRE engineer hired: ${b.name} now runs on its own`);
  refreshPanel();
}

function buyUpgrade(u) {
  if (state.upgrades.includes(u.id) || state.money < u.cost) return;
  state.money -= u.cost;
  state.upgrades.push(u.id);
  toast(`${u.icon} ${u.name}: ${u.desc}`);
  refreshPanel();
}

function prestige() {
  const gain = claimableInvestors();
  if (gain < 1) return;
  showModal({
    title: 'Raise funds?',
    body: `<p>You sell your lab: cash, machines, customers, team, research and models all reset.</p>
           <p>In exchange, <strong>${fmt(gain)} investors</strong> join you
           (+${fmt(gain * INVESTOR_BONUS * 100)}% token price, forever).</p>`,
    confirmText: 'Raise funds',
    onConfirm: () => {
      const next = newState();
      for (const key of ['labName', 'allTimeEarned', 'tokensProduced', 'tokensSold', 'playTime', 'buyMode']) {
        next[key] = state[key];
      }
      next.investors = state.investors + gain;
      next.resets = state.resets + 1;
      state = next;
      save();
      syncControls();
      refreshPanel();
      toast(`💼 ${fmt(gain)} investors joined you!`);
    },
  });
}

function resetAll() {
  showModal({
    title: 'Wipe your save?',
    body: '<p>All your progress, investors included, will be permanently deleted.</p>',
    confirmText: 'Wipe everything',
    danger: true,
    onConfirm: () => {
      state = newState();
      save();
      syncControls();
      refreshPanel();
      toast('New game started');
    },
  });
}

/* =====================================================================
   GAME LOOP
   ===================================================================== */

function tick(dt) {
  state.playTime += dt;
  for (const b of INFRA) {
    const s = infraOf(b);
    if (!s.owned) continue;
    if (s.manager) s.running = true;
    if (!s.running) continue;

    s.progress += dt / cycleTime(b);
    if (s.progress >= 1) {
      // With an engineer, cash in every cycle completed during dt
      const cycles = s.manager ? Math.floor(s.progress) : 1;
      produce(tokensPerCycle(b) * cycles);
      if (s.manager) {
        s.progress -= cycles;
      } else {
        s.progress = 0;
        s.running = false;
      }
    }
  }
  sell(dt);
}

function applyOfflineEarnings() {
  const elapsed = Math.min((Date.now() - state.lastSeen) / 1000, OFFLINE_CAP_SECONDS);
  if (elapsed < 10) return;

  const produced = capacity(true);
  if (produced <= 0) return;
  const toStock = produced * (1 - state.trainShare);
  const sold = Math.min(toStock, totalDemand());
  const moneyBefore = state.money;
  const modelBefore = state.modelIndex;

  state.tokensProduced += produced * elapsed;
  state.tokensSold += sold * elapsed;
  earn(sold * price() * elapsed);
  train((produced - sold) * elapsed);

  const newModel = state.modelIndex > modelBefore
    ? `<p>🧠 Your team also trained the <strong>${MODELS[state.modelIndex].name}</strong> model!</p>`
    : '';
  showModal({
    title: 'Welcome back! 👋',
    body: `<p>While you were away (${fmtTime(elapsed)}), your data centers produced
           <strong>${fmt(produced * elapsed)} tokens</strong> and earned you
           <strong>${money(state.money - moneyBefore)}</strong>.</p>${newModel}`,
    confirmText: 'Awesome!',
    hideCancel: true,
  });
}

/* =====================================================================
   FORMATTING
   ===================================================================== */

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) {
    return n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 2 : n < 100 ? 1 : 0 });
  }
  let e = Math.floor(Math.log10(n) / 3);
  let v = n / Math.pow(10, 3 * e);
  if (v >= 999.995) { e++; v /= 1000; }
  if (e >= SUFFIXES.length) return n.toExponential(2);
  return v.toFixed(2) + SUFFIXES[e];
}

const money = n => `$${fmt(n)}`;

function fmtTime(sec) {
  if (sec < 0.1) return '< 0.1s';
  if (sec < 10) return `${sec.toFixed(1)}s`;
  sec = Math.ceil(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/* =====================================================================
   USER INTERFACE
   ===================================================================== */

const $ = sel => document.querySelector(sel);
const ui = { infra: {}, clients: {}, managers: {}, upgrades: {} };
let incomeRate = 0;

function row(icon, title, subtitle, onClick) {
  const el = document.createElement('div');
  el.className = 'row';
  el.innerHTML = `
    <span class="row-icon">${icon}</span>
    <div class="row-text"><strong>${title}</strong><small>${subtitle}</small></div>
    <button class="btn" type="button"></button>`;
  const btn = el.querySelector('button');
  btn.addEventListener('click', onClick);
  return { row: el, btn, sub: el.querySelector('small'), title: el.querySelector('strong') };
}

function buildInfra() {
  const list = $('#businessList');
  for (const b of INFRA) {
    const el = document.createElement('article');
    el.className = 'biz';
    el.innerHTML = `
      <button class="biz-icon" type="button" aria-label="Start production: ${b.name}">
        <span>${b.icon}</span><span class="owned">0</span>
      </button>
      <div class="biz-main">
        <div class="biz-top"><h3>${b.name}</h3><span class="biz-rev"></span></div>
        <div class="progress"><div class="bar"></div><span class="biz-time"></span></div>
        <div class="biz-meta"><span class="biz-milestone"></span><span class="biz-status"></span></div>
      </div>
      <button class="biz-buy" type="button"><span class="buy-label"></span><span class="buy-cost"></span></button>`;

    const r = {
      el,
      icon: el.querySelector('.biz-icon'),
      owned: el.querySelector('.owned'),
      rev: el.querySelector('.biz-rev'),
      progress: el.querySelector('.progress'),
      bar: el.querySelector('.bar'),
      time: el.querySelector('.biz-time'),
      milestone: el.querySelector('.biz-milestone'),
      status: el.querySelector('.biz-status'),
      buy: el.querySelector('.biz-buy'),
      buyLabel: el.querySelector('.buy-label'),
      buyCost: el.querySelector('.buy-cost'),
    };
    r.icon.addEventListener('click', () => startCycle(b));
    r.progress.addEventListener('click', () => startCycle(b));
    r.buy.addEventListener('click', () => buyInfra(b));
    ui.infra[b.id] = r;
    list.appendChild(el);
  }
}

function buildPanel() {
  const clients = $('#tab-clients');
  clients.innerHTML = '<p class="note">Your customers buy tokens every second. Without customers, your tokens just pile up in stock.</p>';
  for (const c of CLIENTS) {
    const r = row(c.icon, '', '', () => buyClient(c));
    ui.clients[c.id] = r;
    clients.appendChild(r.row);
  }
  const hint = document.createElement('p');
  hint.className = 'locked-hint';
  hint.id = 'clientsHint';
  clients.appendChild(hint);

  const team = $('#tab-team');
  team.innerHTML = '<p class="note">An SRE engineer restarts machines automatically, even while the game is closed.</p>';
  for (const b of INFRA) {
    const r = row(b.icon, `SRE engineer: ${b.name}`, 'Automates production', () => hireManager(b));
    ui.managers[b.id] = r;
    team.appendChild(r.row);
  }

  const research = $('#tab-research');
  research.innerHTML = '<p class="note" id="upgradeCount"></p>';
  for (const u of UPGRADES) {
    const r = row(u.icon, u.name, u.desc, () => buyUpgrade(u));
    r.btn.textContent = money(u.cost);
    ui.upgrades[u.id] = r;
    research.appendChild(r.row);
  }
}

function renderHeader() {
  $('#money').textContent = money(state.money);
  $('#mps').textContent = `${money(incomeRate)}/s`;
  $('#price').textContent = `${money(price() * 1000)} / 1K`;
  $('#investors').textContent = fmt(state.investors);
}

function renderControl() {
  const cap = capacity();
  const demand = totalDemand();
  const stockMax = stockCap();
  const fill = state.stock / stockMax;

  $('#capacity').textContent = fmt(cap);
  $('#demand').textContent = fmt(demand);
  $('#stock').textContent = fmt(state.stock);
  $('#stockBar').style.width = `${Math.min(100, fill * 100).toFixed(1)}%`;

  const effective = cap * (1 - state.trainShare);
  const box = $('#bottleneck');
  let msg;
  let warn = true;
  if (fill > 0.98) {
    msg = '📦 Stock full: your customers can\'t keep up. The surplus goes to training, but go find more customers!';
  } else if (effective < demand * 0.8) {
    msg = '⚡ Customers are waiting: demand exceeds your production. Build more infrastructure!';
  } else if (effective > demand * 1.5) {
    msg = '🛒 You produce more than you sell: find new customers (Customers tab).';
  } else {
    msg = '✅ Production and demand are well balanced.';
    warn = false;
  }
  if (box.textContent !== msg) box.textContent = msg;
  box.classList.toggle('warn', warn);

  const model = MODELS[state.modelIndex];
  const next = nextModel();
  $('#modelName').textContent = model.name;
  $('#modelMult').textContent = `price x${model.mult}`;
  if (next) {
    const pct = Math.min(1, state.training / next.cost);
    $('#nextModel').textContent = `Next: ${next.name}`;
    $('#trainBar').style.width = `${(pct * 100).toFixed(1)}%`;
    $('#trainText').textContent = `${fmt(state.training)} / ${fmt(next.cost)} tokens`;
  } else {
    $('#nextModel').textContent = 'Ultimate model reached 🏆';
    $('#trainBar').style.width = '100%';
    $('#trainText').textContent = 'Training complete';
  }
  $('#trainShareValue').textContent = `${Math.round(state.trainShare * 100)}%`;
}

function renderInfra() {
  let lockedShown = 0;
  let lockedHidden = 0;

  for (const b of INFRA) {
    const s = infraOf(b);
    const r = ui.infra[b.id];
    const locked = s.owned === 0;

    // Show owned machines + the next one to unlock
    const visible = !locked || lockedShown++ < 1;
    r.el.hidden = !visible;
    if (!visible) { lockedHidden++; continue; }

    r.el.classList.toggle('locked', locked);
    r.owned.textContent = s.owned;

    const t = cycleTime(b);
    const fast = s.running && t < FAST_CYCLE;
    r.progress.classList.toggle('fast', fast);
    r.bar.style.width = fast ? '100%' : `${(s.progress * 100).toFixed(1)}%`;
    r.time.textContent = s.running ? fmtTime(t * (1 - s.progress)) : fmtTime(t);

    r.rev.textContent = locked
      ? `${fmt(b.tokens * upgradeMult('infra', b.id))} tokens / cycle`
      : `${fmt(tokensPerCycle(b))} tokens`;

    const n = purchaseCount(b, s.owned);
    const cost = costFor(b, s.owned, n);
    r.buyLabel.textContent = locked ? 'Unlock' : `Buy x${n}`;
    r.buyCost.textContent = money(cost);
    r.buy.disabled = cost > state.money;

    const next = MILESTONES.find(m => m > s.owned);
    r.milestone.textContent = next ? `Milestone ${s.owned}/${next} → speed x2` : 'All milestones reached 🏆';

    const idle = !locked && !s.running;
    r.icon.classList.toggle('idle', idle);
    r.status.textContent = s.manager ? '👷 Automated' : idle ? '👆 Click to produce' : '';
  }

  $('#lockedHint').textContent = lockedHidden
    ? `🔒 ${lockedHidden} more machine${lockedHidden > 1 ? 's' : ''} to discover…`
    : '';
}

function refreshPanel() {
  // Customers
  let lockedShown = 0;
  let lockedHidden = 0;
  for (const c of CLIENTS) {
    const s = clientOf(c);
    const r = ui.clients[c.id];
    const locked = s.owned === 0;
    const visible = !locked || lockedShown++ < 1;
    r.row.hidden = !visible;
    if (!visible) { lockedHidden++; continue; }

    r.row.classList.toggle('locked', locked);
    const next = MILESTONES.find(m => m > s.owned);
    r.title.innerHTML = locked ? c.name : `${c.name} <span class="count">× ${fmt(s.owned)}</span>`;
    r.sub.textContent = locked
      ? `+${fmt(c.demand * upgradeMult('clients', c.id))} tokens/s per customer`
      : `Buying ${fmt(clientDemand(c))} tokens/s${next ? ` · milestone ${s.owned}/${next}` : ''}`;

    const n = purchaseCount(c, s.owned);
    const cost = costFor(c, s.owned, n);
    r.btn.textContent = locked ? `Unlock · ${money(cost)}` : `x${n} · ${money(cost)}`;
    r.btn.disabled = cost > state.money;
  }
  $('#clientsHint').textContent = lockedHidden
    ? `🔒 ${lockedHidden} more customer type${lockedHidden > 1 ? 's' : ''} to discover…`
    : '';

  // Team
  for (const b of INFRA) {
    const s = infraOf(b);
    const { row: el, btn } = ui.managers[b.id];
    el.classList.toggle('done', s.manager);
    if (s.manager) {
      btn.textContent = 'Hired ✓';
      btn.disabled = true;
    } else {
      btn.textContent = s.owned ? money(b.managerCost) : `🔒 ${money(b.managerCost)}`;
      btn.disabled = !s.owned || state.money < b.managerCost;
    }
  }

  // Research
  let shown = 0;
  for (const u of UPGRADES) {
    const { row: el, btn } = ui.upgrades[u.id];
    const bought = state.upgrades.includes(u.id);
    el.hidden = bought || shown >= UPGRADES_SHOWN;
    if (!el.hidden) shown++;
    btn.disabled = state.money < u.cost;
  }
  $('#upgradeCount').textContent =
    `${state.upgrades.length} / ${UPGRADES.length} research projects completed. They multiply your production or demand.`;

  // Funding
  const claim = claimableInvestors();
  const nextAt = earningsForInvestors(totalInvestorsFor(state.allTimeEarned) + 1);
  $('#invCurrent').textContent = fmt(state.investors);
  $('#invBonus').textContent = `+${fmt(state.investors * INVESTOR_BONUS * 100)}%`;
  $('#invClaimable').textContent = fmt(claim);
  $('#invNext').textContent = money(nextAt - state.allTimeEarned);
  $('#prestigeBtn').disabled = claim < 1;
  $('#prestigeBtn').textContent = claim >= 1 ? `Raise funds (+${fmt(claim)} investors)` : 'Raise funds';

  // Stats
  let owned = 0;
  for (const b of INFRA) owned += infraOf(b).owned;
  $('#stEarned').textContent = money(state.earnedThisRun);
  $('#stAllTime').textContent = money(state.allTimeEarned);
  $('#stProduced').textContent = fmt(state.tokensProduced);
  $('#stSold').textContent = fmt(state.tokensSold);
  $('#stOwned').textContent = fmt(owned);
  $('#stTime').textContent = fmtTime(state.playTime);
  $('#stResets').textContent = fmt(state.resets);

  document.title = `${money(state.money)} · Token Tycoon`;
}

// Sync controls (slider, lab name, buy mode) with the state
function syncControls() {
  $('#trainShare').value = Math.round(state.trainShare * 100);
  $('#labInput').value = state.labName;
  $('#labName').textContent = state.labName;
  for (const btn of document.querySelectorAll('#buyMode button')) {
    btn.classList.toggle('active', btn.dataset.mode === state.buyMode);
  }
}

/* ---------- Notifications ---------- */

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}

/* ---------- Modal ---------- */

let modalConfirm = null;

function showModal({ title, body, confirmText = 'OK', onConfirm = null, hideCancel = false, danger = false }) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body;
  const confirm = $('#modalConfirm');
  confirm.textContent = confirmText;
  confirm.classList.toggle('danger', danger);
  $('#modalCancel').hidden = hideCancel;
  modalConfirm = onConfirm;
  $('#modal').hidden = false;
  confirm.focus();
}

function closeModal() {
  $('#modal').hidden = true;
  modalConfirm = null;
}

/* ---------- Events ---------- */

function bindEvents() {
  $('#buyMode').addEventListener('click', e => {
    const mode = e.target.dataset.mode;
    if (!mode) return;
    state.buyMode = mode;
    syncControls();
    refreshPanel();
  });

  $('#tabs').addEventListener('click', e => {
    const tab = e.target.dataset.tab;
    if (!tab) return;
    for (const btn of document.querySelectorAll('#tabs button')) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    }
    for (const panel of document.querySelectorAll('.tab-content')) {
      panel.hidden = panel.id !== `tab-${tab}`;
    }
  });

  $('#trainShare').addEventListener('input', e => {
    state.trainShare = Number(e.target.value) / 100;
  });

  $('#labInput').addEventListener('input', e => {
    state.labName = e.target.value.trim() || DEFAULT_LAB_NAME;
    $('#labName').textContent = state.labName;
  });

  $('#prestigeBtn').addEventListener('click', prestige);
  $('#resetBtn').addEventListener('click', resetAll);
  $('#saveBtn').addEventListener('click', () => { save(); toast('💾 Game saved'); });

  $('#modalConfirm').addEventListener('click', () => {
    const fn = modalConfirm;
    closeModal();
    if (fn) fn();
  });
  $('#modalCancel').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('beforeunload', save);
}

/* =====================================================================
   STARTUP
   ===================================================================== */

let lastFrame = performance.now();
let panelTimer = 0;

function frame(now) {
  const dt = Math.max(0, (now - lastFrame) / 1000);
  lastFrame = now;

  earnedThisFrame = 0;
  tick(dt);
  if (dt > 0) incomeRate += (earnedThisFrame / dt - incomeRate) * Math.min(1, dt / 1.5);

  renderHeader();
  renderControl();
  renderInfra();

  panelTimer += dt;
  if (panelTimer >= 0.25) {
    panelTimer = 0;
    refreshPanel();
  }
  requestAnimationFrame(frame);
}

buildInfra();
buildPanel();
bindEvents();
syncControls();
applyOfflineEarnings();
refreshPanel();
setInterval(save, 5000);
requestAnimationFrame(frame);

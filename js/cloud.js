// Online features: Google sign-in, cloud save and leaderboard (Firebase).
// The game works fine without this module: everything here is optional.

import { firebaseConfig } from './firebase-config.js';

const SDK_URL = 'https://www.gstatic.com/firebasejs/10.12.2/';
const SYNC_INTERVAL_MS = 30_000;
const LEADERBOARD_SIZE = 50;
const LEADERBOARD_TTL_MS = 30_000;

const TT = window.TokenTycoon;
const $ = sel => document.querySelector(sel);

const isConfigured = Boolean(firebaseConfig.apiKey) && !firebaseConfig.apiKey.startsWith('YOUR_');

let fb = null;             // { auth, db, authApi, fsApi } once Firebase is loaded
let user = null;
let lastSync = 0;
let syncing = false;
let awaitingChoice = false; // blocks uploads until the player picks which save to keep
let leaderboardLoadedAt = 0;

/* ---------- DOM helpers (never inject player text as HTML) ---------- */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of [].concat(children)) {
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function button(text, className, onClick) {
  const b = el('button', { type: 'button', className, textContent: text });
  b.addEventListener('click', onClick);
  return b;
}

function googleIcon() {
  const span = el('span', { className: 'g-logo' });
  span.innerHTML = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`;
  return span;
}

/* ---------- Firebase ---------- */

async function init() {
  if (!isConfigured) {
    renderAccount();
    renderLeaderboardMessage('The leaderboard is not set up yet.');
    return;
  }
  try {
    const [appApi, authApi, fsApi] = await Promise.all([
      import(`${SDK_URL}firebase-app.js`),
      import(`${SDK_URL}firebase-auth.js`),
      import(`${SDK_URL}firebase-firestore.js`),
    ]);
    const app = appApi.initializeApp(firebaseConfig);
    fb = { auth: authApi.getAuth(app), db: fsApi.getFirestore(app), authApi, fsApi };
  } catch (e) {
    console.warn('Could not load Firebase', e);
    renderAccount('Online features could not be loaded. Check your connection.');
    renderLeaderboardMessage('The leaderboard could not be loaded.');
    return;
  }

  fb.authApi.onAuthStateChanged(fb.auth, async u => {
    user = u;
    renderAccount();
    if (u) await onSignedIn();
  });

  setInterval(() => { if (user) pushSave(); }, SYNC_INTERVAL_MS);
  setInterval(renderSyncStatus, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden && user) pushSave(); });
  document.addEventListener('tt:tab', e => { if (e.detail === 'leaderboard') loadLeaderboard(); });
  $('#leaderboardRefresh').addEventListener('click', () => loadLeaderboard(true));
}

async function signIn() {
  try {
    await fb.authApi.signInWithPopup(fb.auth, new fb.authApi.GoogleAuthProvider());
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      console.warn(e);
      TT.toast('⚠️ Sign-in failed. Please try again.');
    }
  }
}

async function signOutUser() {
  await pushSave();
  await fb.authApi.signOut(fb.auth);
  TT.toast('👋 Signed out. Your progress stays saved in the cloud.');
}

/* ---------- Cloud save ---------- */

const saveRef = () => fb.fsApi.doc(fb.db, 'saves', user.uid);
const leaderboardRef = () => fb.fsApi.doc(fb.db, 'leaderboard', user.uid);

async function onSignedIn() {
  let snap;
  try {
    snap = await fb.fsApi.getDoc(saveRef());
  } catch (e) {
    console.warn(e);
    TT.toast('⚠️ Could not reach your cloud save.');
    return;
  }

  const local = TT.exportState();
  if (!snap.exists()) {
    await pushSave();
    TT.toast('☁️ Cloud save enabled for this account');
    return;
  }

  const cloud = JSON.parse(snap.data().data);
  const localFresh = local.allTimeEarned < 100;
  const same = Math.abs(local.allTimeEarned - cloud.allTimeEarned) <= 1e-6 * Math.max(1, cloud.allTimeEarned);

  if (localFresh || same) {
    TT.importState(cloud);
    TT.toast('☁️ Cloud save loaded');
    lastSync = Date.now();
    renderSyncStatus();
    return;
  }

  // Both saves have progress: let the player choose
  awaitingChoice = true;
  TT.showModal({
    title: 'Which save do you want to keep?',
    body: `
      <div class="kv"><span>☁️ Cloud save</span><span>${TT.money(cloud.allTimeEarned)} earned</span></div>
      <div class="kv"><span>💻 This device</span><span>${TT.money(local.allTimeEarned)} earned</span></div>
      <p class="note small">The other save will be overwritten.</p>`,
    confirmText: 'Use cloud save',
    cancelText: 'Keep this device',
    locked: true,
    onConfirm: () => {
      awaitingChoice = false;
      TT.importState(cloud);
      TT.toast('☁️ Cloud save loaded');
      lastSync = Date.now();
      renderSyncStatus();
    },
    onCancel: () => {
      awaitingChoice = false;
      pushSave();
    },
  });
}

async function pushSave() {
  if (!user || syncing || awaitingChoice) return;
  syncing = true;
  try {
    const s = TT.exportState();
    const { writeBatch, serverTimestamp } = fb.fsApi;
    const batch = writeBatch(fb.db);
    batch.set(saveRef(), {
      data: JSON.stringify(s),
      allTimeEarned: s.allTimeEarned,
      updatedAt: serverTimestamp(),
    });
    batch.set(leaderboardRef(), {
      labName: String(s.labName).slice(0, 30),
      allTimeEarned: s.allTimeEarned,
      bestModel: Math.trunc(s.bestModel),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    lastSync = Date.now();
  } catch (e) {
    console.warn('Cloud save failed', e);
    lastSync = -1;
  } finally {
    syncing = false;
    renderSyncStatus();
  }
}

/* ---------- Account UI ---------- */

function renderAccount(errorMessage) {
  const box = $('#accountBox');
  const avatar = $('#accountAvatar');
  const label = $('#accountLabel');
  box.replaceChildren();

  if (!isConfigured || !fb) {
    box.append(el('p', { className: 'empty' },
      errorMessage || 'Google sign-in is not set up yet. Your progress is saved in this browser.'));
    label.textContent = 'Profile';
    avatar.replaceChildren('👤');
    return;
  }

  if (!user) {
    label.textContent = 'Sign in';
    avatar.replaceChildren('👤');
    const signInBtn = el('button', { type: 'button', className: 'google-btn' }, [googleIcon(), 'Sign in with Google']);
    signInBtn.addEventListener('click', signIn);
    box.append(
      el('div', { className: 'account-cta' }, [
        el('div', {}, [
          el('strong', { textContent: 'Never lose your lab' }),
          el('p', { className: 'note', textContent: 'Back up your progress in the cloud, play on any device and join the leaderboard.' }),
        ]),
        signInBtn,
      ]),
    );
    return;
  }

  const name = user.displayName || 'Player';
  label.textContent = name.split(' ')[0];
  avatar.replaceChildren(user.photoURL
    ? el('img', { src: user.photoURL, alt: '', referrerPolicy: 'no-referrer' })
    : '👤');

  box.append(
    el('div', { className: 'account-user' }, [
      user.photoURL ? el('img', { className: 'account-photo', src: user.photoURL, alt: '', referrerPolicy: 'no-referrer' }) : el('span', { className: 'account-photo', textContent: '👤' }),
      el('div', {}, [
        el('strong', { textContent: name }),
        el('small', { id: 'syncStatus', className: 'muted' }),
      ]),
    ]),
    el('div', { className: 'actions' }, [
      button('☁️ Sync now', 'btn', () => pushSave()),
      button('Sign out', 'btn ghost', signOutUser),
    ]),
  );
  renderSyncStatus();
}

function renderSyncStatus() {
  const status = $('#syncStatus');
  if (!status) return;
  if (syncing) status.textContent = '☁️ Syncing…';
  else if (lastSync === -1) status.textContent = '⚠️ Last sync failed, retrying soon';
  else if (!lastSync) status.textContent = '☁️ Connected';
  else status.textContent = `☁️ Synced ${TT.fmtTime((Date.now() - lastSync) / 1000)} ago`;
}

/* ---------- Leaderboard ---------- */

function renderLeaderboardMessage(message) {
  $('#leaderboardList').replaceChildren(el('p', { className: 'empty', textContent: message }));
}

async function loadLeaderboard(force = false) {
  if (!fb) return;
  if (!force && Date.now() - leaderboardLoadedAt < LEADERBOARD_TTL_MS) return;
  leaderboardLoadedAt = Date.now();
  if (user) await pushSave(); // make sure our own score is fresh

  const { collection, query, orderBy, limit, getDocs } = fb.fsApi;
  let snap;
  try {
    snap = await getDocs(query(collection(fb.db, 'leaderboard'), orderBy('allTimeEarned', 'desc'), limit(LEADERBOARD_SIZE)));
  } catch (e) {
    console.warn(e);
    renderLeaderboardMessage('The leaderboard could not be loaded.');
    return;
  }

  if (snap.empty) {
    renderLeaderboardMessage('No labs yet. Sign in and be the first!');
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const rows = snap.docs.map((d, i) => {
    const p = d.data();
    const model = TT.MODELS[p.bestModel] || TT.MODELS[0];
    const isMe = user && d.id === user.uid;
    return el('div', { className: `row lb-row${isMe ? ' me' : ''}` }, [
      el('span', { className: 'rank', textContent: medals[i] || `#${i + 1}` }),
      el('div', { className: 'row-text' }, [
        el('strong', { textContent: `${p.labName || 'Unnamed lab'}${isMe ? ' (you)' : ''}` }),
        el('small', { textContent: `Best model: ${model.name}` }),
      ]),
      el('span', { className: 'lb-score', textContent: TT.money(p.allTimeEarned || 0) }),
    ]);
  });
  $('#leaderboardList').replaceChildren(...rows);

  if (!user) {
    const cta = el('div', { className: 'lb-cta' }, [
      el('span', { textContent: 'Want your lab on this list?' }),
      button('Sign in', 'btn', () => TT.openTab('profile')),
    ]);
    $('#leaderboardList').append(cta);
  }
}

init();

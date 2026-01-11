// ---------- Config ----------
const DATA_URL = './data/prs.json';
const REFRESH_INTERVAL = 60 * 1000;
const PUBLIC_VAPID = 'BA7gjqBbAmKrqp2UKVLLxcZ55N41dQp5w2V2G86r2sIB10Z1jFdyPvlRIRbSGWYNsAclj4KXH7F5-8auB_OPl5U';
const WORKER_URL = 'https://worker.samuelbatista441.workers.dev';

// ---------- Boot ----------
loadDashboard();
setInterval(loadDashboard, REFRESH_INTERVAL);

// ---------- Helpers ----------
function canNotify() {
  return 'Notification' in window && Notification.permission === 'granted';
}

// ---------- Permissão ----------
document
  .getElementById('enableNotifications')
  ?.addEventListener('click', async () => {
    const result = await Notification.requestPermission();
    console.log('Permissão:', result);
  });

// ---------- Loader ----------
async function loadDashboard() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Erro carregando prs.json');
    const prs = await res.json();
    renderBoard(prs);
  } catch (err) {
    console.error('❌ Falha ao atualizar dashboard:', err);
  }
}

// ---------- Render ----------
function renderBoard(prs) {
  const stats = { red: 0, yellow: 0, green: 0 };

  document.querySelectorAll('.column .cards')
    .forEach(c => (c.innerHTML = ''));

  prs.forEach(pr => {
    const priority =
      pr.labels.includes('pr:red') ? 'red' :
      pr.labels.includes('pr:yellow') ? 'yellow' :
      'green';

    stats[priority]++;

    const column = document.querySelector(
      `.column[data-priority="${priority}"] .cards`
    );

    const card = document.createElement('div');
    card.className = `card ${priority}`;
    card.innerHTML = `
      <h3>${pr.repo} — #${pr.number}</h3>
      <p>${pr.title}</p>
      <p>👤 ${pr.user}</p>
      <a href="${pr.url}" target="_blank">Abrir PR</a>
    `;

    column.appendChild(card);
  });

  document.getElementById('stats').innerText =
    `🔴 ${stats.red} urgentes  |  🟡 ${stats.yellow} altas  |  🟢 ${stats.green} normais`;
}

// ---------- Push real ----------
async function enablePush() {
  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: PUBLIC_VAPID
  });

  await fetch(`${WORKER_URL}/subscribe`, {
    method: 'POST',
    body: JSON.stringify(sub)
  });

  alert('Notificações ativadas');
}

// ---------- Service Worker ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./scripts/sw.js');
}

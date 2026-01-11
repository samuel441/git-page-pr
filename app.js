// ---------- Config ----------
const DATA_URL = './data/prs.json';
const REFRESH_INTERVAL = 60 * 1000; // 1 min
const ALERT_INTERVAL = 2 * 60 * 1000; // 2 min
const PUBLIC_VAPID = process.env.VAPID_PUBLIC;
const WORKER_URL = process.env.WORKER_URL;

// guarda PRs já alertadas
const notifiedUrgent = new Set();

// ---------- Boot ----------
loadDashboard();
setInterval(loadDashboard, REFRESH_INTERVAL);
setInterval(checkUrgentPRs, ALERT_INTERVAL);

// ---------- Permissão ----------
document
  .getElementById('enableNotifications')
  ?.addEventListener('click', async () => {
    const result = await Notification.requestPermission();
    console.log('Permissão:', result);
  });

// ---------- Helpers ----------
function canNotify() {
  return 'Notification' in window && Notification.permission === 'granted';
}

// ---------- Loader ----------
async function loadDashboard() {
  try {
    const res = await fetch(DATA_URL, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

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

// ---------- Alertas iniciais ----------
fetch('./data/alerts.json', { cache: 'no-store' })
  .then(r => r.json())
  .then(alerts => alerts.forEach(showAlert))
  .catch(() => {});

// ---------- Notificação ----------
function showAlert(alert) {
  if (!canNotify()) return;

  let title = 'Nova Pull Request';
  let body = alert.title;

  if (alert.priority === 'red') {
    title = '🚨 PR URGENTE';
  }

  new Notification(title, { body });
}

// ---------- Monitor de urgentes ----------
async function checkUrgentPRs() {
  if (!canNotify()) return;

  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    const prs = await res.json();

    const urgent = prs.filter(p => p.labels.includes('pr:red'));

    urgent.forEach(pr => {
      const key = `${pr.repo}#${pr.number}`;

      if (notifiedUrgent.has(key)) return;

      notifiedUrgent.add(key);

      new Notification('🚨 PR ainda pendente', {
        body: `${pr.repo} — #${pr.number}: ${pr.title}`
      });
    });
  } catch {}
}

async function enablePush() {
  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: PUBLIC_VAPID
  });

  await fetch(`${WORKER_URL}subscribe`, {
    method: 'POST',
    body: JSON.stringify(sub)
  });

  alert('Notificações ativadas');
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./scripts/sw.js');
}
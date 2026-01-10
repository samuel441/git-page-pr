// ---------- Config ----------
const DATA_URL = './data/prs.json';
const REFRESH_INTERVAL = 60 * 1000; // 1 minuto

// ---------- Notificação ----------
if ('Notification' in window) {
  Notification.requestPermission();
}

// ---------- Boot ----------
loadDashboard();
setInterval(loadDashboard, REFRESH_INTERVAL);

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

  // limpa antes de renderizar de novo
  document.querySelectorAll('.column .cards').forEach(c => c.innerHTML = '');

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
      <h2>#${pr.number} — ${pr.repo}</h2>
      <h3>#${pr.number} — ${pr.title}</h3>
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
  if (Notification.permission !== 'granted') return;

  let title = 'Nova Pull Request';
  let body = alert.title;

  if (alert.priority === 'red') {
    title = '🚨 PR URGENTE';
  }

  new Notification(title, { body });
}

// ---------- Pressão contínua ----------
setInterval(async () => {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    const prs = await res.json();

    const urgent = prs.filter(p => p.labels.includes('pr:red'));

    urgent.forEach(pr => {
      new Notification('🚨 PR ainda pendente', {
        body: `#${pr.number} — ${pr.title}`
      });
    });
  } catch {}
}, 10 * 60 * 1000);
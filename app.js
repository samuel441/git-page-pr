// ---------- Notificação ----------
if ("Notification" in window) {
  Notification.requestPermission();
}

// ---------- Render dashboard ----------
fetch('./data/prs.json')
  .then(r => r.json())
  .then(prs => renderBoard(prs));

function renderBoard(prs) {
  const stats = { red: 0, yellow: 0, green: 0 };

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
      <h3>#${pr.id} — ${pr.title}</h3>
      <p>👤 ${pr.author}</p>
      <a href="${pr.url}" target="_blank">Abrir PR</a>
    `;

    column.appendChild(card);
  });

  document.getElementById('stats').innerText =
    `🔴 ${stats.red} urgentes  |  🟡 ${stats.yellow} altas  |  🟢 ${stats.green} normais`;
}

// ---------- Alertas ----------
fetch('./data/alerts.json')
  .then(r => r.json())
  .then(alerts => alerts.forEach(showAlert));

function showAlert(alert) {
  if (Notification.permission !== 'granted') return;

  let title = 'Nova Pull Request';
  let body = alert.title;

  if (alert.priority === 'red') {
    title = '🚨 PR URGENTE';
  }

  new Notification(title, { body });
}

// ---------- Pressão contínua para URGENTES ----------
setInterval(() => {
  fetch('./data/prs.json')
    .then(r => r.json())
    .then(prs => {
      const urgent = prs.filter(p => p.labels.includes('pr:red'));

      urgent.forEach(pr => {
        new Notification('🚨 PR ainda pendente', {
          body: `#${pr.id} — ${pr.title}`
        });
      });
    });
}, 1000 * 60 * 10); // a cada 10 minutos

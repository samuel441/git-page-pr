fetch('./data/prs.json')
  .then(r => r.json())
  .then(prs => {
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
  });

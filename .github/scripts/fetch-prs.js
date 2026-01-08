const fs = require('fs');

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const [owner, name] = repo.split('/');

async function run() {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/pulls?state=open&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    }
  );

  const prs = await res.json();

  const now = new Date();

  const mapped = prs.map(pr => {
    const labels = pr.labels.map(l => l.name);

    const priority =
      labels.includes('pr:red') ? 'red' :
      labels.includes('pr:yellow') ? 'yellow' :
      'green';

    const createdAt = new Date(pr.created_at);
    const hoursOpen = Math.floor((now - createdAt) / 36e5);

    return {
      id: pr.number,
      title: pr.title,
      author: pr.user.login,
      url: pr.html_url,
      priority,
      hoursOpen,
      reviewers: pr.requested_reviewers.map(r => r.login),
      createdAt: pr.created_at
    };
  });

  fs.writeFileSync('dashboard/data.json', JSON.stringify(mapped, null, 2));
}

run();

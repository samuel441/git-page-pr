import fs from 'fs';
import fetch from 'node-fetch';

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;

const [owner, name] = repo.split('/');

const res = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls?state=open`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json'
  }
});

const prs = await res.json();

const data = prs.map(pr => ({
  id: pr.number,
  title: pr.title,
  author: pr.user.login,
  url: pr.html_url,
  labels: pr.labels.map(l => l.name)
}));

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/prs.json', JSON.stringify(data, null, 2));

console.log(`Saved ${data.length} PRs`);

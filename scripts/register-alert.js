import fs from 'fs';

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));

const action = event.action;
const pr = event.pull_request;

const labels = pr.labels.map(l => l.name);

const priority =
  labels.includes('pr:red') ? 'red' :
  labels.includes('pr:yellow') ? 'yellow' :
  'green';

const alert = {
  id: pr.number,
  title: pr.title,
  priority,
  action,
  at: new Date().toISOString()
};

const file = 'data/alerts.json';

let alerts = [];

if (fs.existsSync(file)) {
  const raw = fs.readFileSync(file, 'utf-8').trim();

  if (raw.length > 0) {
    try {
      alerts = JSON.parse(raw);
    } catch (e) {
      console.error('❌ alerts.json corrompido. Resetando arquivo.');
      alerts = [];
    }
  }
}

alerts.push(alert);

// mantém só os últimos 50
alerts = alerts.slice(-50);

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(file, JSON.stringify(alerts, null, 2));

console.log('🔔 Alert registrado:', alert);

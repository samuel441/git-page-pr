import webpush from 'web-push';
import fetch from 'node-fetch';

const { VAPID_PUBLIC, VAPID_PRIVATE, WORKER_URL } = process.env;

webpush.setVapidDetails(
  'mailto:admin@dash.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const res = await fetch(`${WORKER_URL}/subscription`);
const sub = await res.json();

if (!sub.endpoint) {
  console.log('Nenhuma subscription registrada');
  process.exit(0);
}

await webpush.sendNotification(
  sub,
  JSON.stringify({
    title: '🚨 PR urgente',
    body: 'Tem PR pendente no dashboard'
  })
);

console.log('Push enviado');

import webpush from 'web-push';
import fetch from 'node-fetch';

const { VAPID_PUBLIC, VAPID_PRIVATE, WORKER_URL } = process.env;

if (!VAPID_PUBLIC || !VAPID_PRIVATE || !WORKER_URL) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:admin@dash.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const res = await fetch(`${WORKER_URL}/subscription`);
const subs = await res.json();

if (!Array.isArray(subs) || subs.length === 0) {
  console.log('⚠️ Nenhuma subscription registrada');
  process.exit(0);
}

let sent = 0;

for (const sub of subs) {
  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({
        title: '🚨 PR urgente',
        body: 'Tem PR pendente no dashboard'
      })
    );
    sent++;
  } catch (err) {
    console.error('❌ Falha ao enviar push:', err.statusCode || err);
  }
}

console.log(`✅ Push enviado para ${sent} device(s)`);

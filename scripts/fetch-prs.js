// .github/scripts/fetch-prs.js
import fs from "fs";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

// === Configs do App ===
const APP_ID = process.env.GITHUB_APP_ID;
const PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");

// === Função para criar JWT do App ===
function createJWT(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iat: now, exp: now + 60, iss: appId },
    privateKey,
    { algorithm: "RS256" }
  );
}

const JWT = createJWT(APP_ID, PRIVATE_KEY);
const headersJWT = {
  Authorization: `Bearer ${JWT}`,
  Accept: "application/vnd.github+json",
};

// === Listar instalações do App ===
async function listInstallations() {
  const res = await fetch("https://api.github.com/app/installations", { headers: headersJWT });
  if (!res.ok) throw new Error(`Erro listando instalações: ${res.status}`);
  return res.json();
}

// === Criar token de instalação ===
async function createInstallationToken(installationId) {
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    { method: "POST", headers: headersJWT }
  );
  if (!res.ok) throw new Error(`Erro criando token: ${res.status}`);
  const data = await res.json();
  return data.token;
}

// === Buscar PRs de um repo ===
async function fetchPRs(owner, repo, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`Erro buscando PRs: ${owner}/${repo} - ${res.status}`);
  return res.json();
}

// === Função principal ===
async function run() {
  const installations = await listInstallations();
  const allPRs = [];

  for (const inst of installations) {
    const token = await createInstallationToken(inst.id);

    const repos = inst.repositories || [];
    for (const repo of repos) {
      const prs = await fetchPRs(inst.account.login, repo.name, token);

      allPRs.push(
        ...prs.map(pr => {
          const labels = pr.labels.map(l => l.name);

          const priority =
            labels.includes("pr:red") ? "red" :
            labels.includes("pr:yellow") ? "yellow" :
            "green";

          return {
            repo: repo.name,
            owner: inst.account.login,
            number: pr.number,
            title: pr.title,
            url: pr.html_url,
            state: pr.state,
            labels,
            priority,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            user: pr.user.login,
          };
        })
      );
    }
  }

  // Salvar todos os PRs
  if (!fs.existsSync("data")) fs.mkdirSync("data");
  fs.writeFileSync("data/prs.json", JSON.stringify(allPRs, null, 2));
  console.log(`✅ PRs coletadas: ${allPRs.length}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

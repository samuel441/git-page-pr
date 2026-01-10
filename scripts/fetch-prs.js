// scripts/fetch-prs.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

// === Configs ===
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY = process.env.APP_PRIVATE_KEY.replace(/\\n/g, "\n");

// === Paths seguros ===
const DATA_DIR = path.resolve(process.cwd(), "data");
const OUTPUT_FILE = path.join(DATA_DIR, "prs.json");

// === JWT do App ===
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

// === GitHub API ===
async function listInstallations() {
  const res = await fetch("https://api.github.com/app/installations", { headers: headersJWT });
  if (!res.ok) throw new Error(`Erro listando instalações: ${res.status}`);
  return res.json();
}

async function createInstallationToken(installationId) {
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    { method: "POST", headers: headersJWT }
  );
  if (!res.ok) throw new Error(`Erro criando token: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function listRepos(token) {
  const res = await fetch(
    "https://api.github.com/installation/repositories",
    { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`Erro listando repos: ${res.status}`);
  const data = await res.json();
  return data.repositories;
}

async function fetchPRs(owner, repo, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`,
    { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`Erro buscando PRs: ${owner}/${repo} - ${res.status}`);
  return res.json();
}

// === Main ===
async function run() {
  const installations = await listInstallations();
  const allPRs = [];

  for (const inst of installations) {
    const token = await createInstallationToken(inst.id);
    const repos = await listRepos(token);

    for (const repo of repos) {
      const prs = await fetchPRs(repo.owner.login, repo.name, token);

      allPRs.push(
        ...prs.map(pr => {
          const labels = pr.labels.map(l => l.name);

          const priority =
            labels.includes("pr:red") ? "red" :
            labels.includes("pr:yellow") ? "yellow" :
            "green";

          return {
            repo: repo.name,
            owner: repo.owner.login,
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

  // === Persistência segura ===
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPRs, null, 2));

  console.log(`✅ PRs coletadas: ${allPRs.length}`);
}

run().catch(err => {
  console.error("❌ Erro no fetch-prs:", err);
  process.exit(1);
});

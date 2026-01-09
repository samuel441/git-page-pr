import fs from "fs";
import { githubRequest } from "./github-app-client.js";

async function run() {
  // lista só repos que o app vê
  const repos = await githubRequest(
    "https://api.github.com/installation/repositories"
  );

  const all = [];

  for (const repo of repos.repositories) {
    const prs = await githubRequest(
      `https://api.github.com/repos/${repo.full_name}/pulls?state=open`
    );

    for (const pr of prs) {
      const labels = pr.labels.map(l => l.name);

      const priority =
        labels.includes("pr:red") ? "red" :
        labels.includes("pr:yellow") ? "yellow" :
        "green";

      all.push({
        repo: repo.name,
        owner: repo.owner.login,
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        priority
      });
    }
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/prs.json", JSON.stringify(all, null, 2));
}

run();

import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const APP_ID = process.env.APP_ID;
const INSTALLATION_ID = process.env.APP_INSTALLATION_ID;
const PRIVATE_KEY = process.env.APP_PRIVATE_KEY.replace(/\\n/g, '\n');

function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 600,
      iss: APP_ID
    },
    PRIVATE_KEY,
    { algorithm: "RS256" }
  );
}

async function getInstallationToken() {
  const jwtToken = createJWT();

  const res = await fetch(
    `https://api.github.com/app/installations/${INSTALLATION_ID}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Token error: ${t}`);
  }

  const data = await res.json();
  return data.token;
}

export async function githubRequest(url) {
  const token = await getInstallationToken();

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} - ${t}`);
  }

  return res.json();
}

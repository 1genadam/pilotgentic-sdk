// cli/login.js — GitHub OAuth login for PilotGentic CLI

import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';

const AUTH_TOKEN_PATH = path.join(os.homedir(), '.pilotgentic', 'auth-token');

function getRegistryBase() {
  const envUrl = process.env.PILOTGENTIC_REGISTRY_URL;
  if (envUrl) {
    // Strip API path suffix to get the base URL for auth
    const parsed = new URL(envUrl);
    return `${parsed.protocol}//${parsed.host}`;
  }
  return 'https://registry.pilotgentic.com';
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`);
    } else if (platform === 'win32') {
      execSync(`start "" "${url}"`);
    } else {
      execSync(`xdg-open "${url}"`);
    }
  } catch {
    // Non-fatal: user can open the URL manually
    console.log(`Could not open browser automatically. Please visit:\n  ${url}\n`);
  }
}

function readLineFromStdin(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    process.stdout.write(prompt);

    rl.once('line', (line) => {
      rl.close();
      resolve(line.trim());
    });

    rl.once('close', () => {
      resolve('');
    });
  });
}

function saveToken(token) {
  const dir = path.dirname(AUTH_TOKEN_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(AUTH_TOKEN_PATH, token + '\n', { mode: 0o600 });
}

export async function login() {
  const base = getRegistryBase();
  const authUrl = `${base}/auth/github`;

  openBrowser(authUrl);

  console.log('Opening browser for GitHub login... After authorizing, paste the token shown:');

  const token = await readLineFromStdin('Token: ');

  if (!token) {
    console.error('\n❌ No token entered. Login aborted.\n');
    process.exit(1);
  }

  saveToken(token);

  console.log(`\n✅ Logged in. Token saved to ~/.pilotgentic/auth-token\n`);
}

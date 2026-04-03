// cli/publish.js — Publishes a validated package to the PilotGentic registry

import fs from 'fs';
import path from 'path';
import https from 'https';
import os from 'os';
import { validatePackage } from './validate.js';

const REGISTRY_URL = process.env.PILOTGENTIC_REGISTRY_URL || 'https://registry.pilotgentic.com/api/v1/packages';
const AUTH_TOKEN_PATH = path.join(os.homedir(), '.pilotgentic', 'auth-token');

function readAuthToken() {
  if (!fs.existsSync(AUTH_TOKEN_PATH)) return null;
  const token = fs.readFileSync(AUTH_TOKEN_PATH, 'utf8').trim();
  const stat = fs.statSync(AUTH_TOKEN_PATH);
  if ((stat.mode & 0o077) !== 0) {
    console.warn('⚠️  Warning: ~/.pilotgentic/auth-token is readable by group/other. Run: chmod 600 ~/.pilotgentic/auth-token');
  }
  return token;
}

function postJson(registryUrl, token, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(registryUrl);
    const payload = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: 'POST',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('timeout', () => { req.destroy(new Error('Request timed out after 30s')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export async function publishPackage(pkgPath) {
  const dir = path.resolve(pkgPath);

  console.log(`\nPublishing: ${dir}\n`);

  // Step 1: Validate first
  console.log('Running validation...\n');
  const valid = await validatePackage(pkgPath);
  if (!valid) {
    console.error('Publish aborted: fix validation errors first.');
    process.exit(1);
  }

  // Step 2: Read auth token
  const token = readAuthToken();
  if (!token) {
    console.error(`\n❌ No auth token found at: ${AUTH_TOKEN_PATH}`);
    console.error('Run: pilotgentic login\n');
    process.exit(1);
  }

  // Step 3: Read package files
  const pluginPath = path.join(dir, 'plugin.json');
  const manifest = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
  const mdPath = path.join(dir, manifest.agent.claude_agent_file);
  const agentMdContent = fs.readFileSync(mdPath, 'utf8');

  const payload = {
    id: manifest.id,
    version: manifest.version,
    description: manifest.description,
    agent_md_content: agentMdContent,
    manifest,
  };

  // Step 4: POST to registry
  console.log(`Publishing ${manifest.id}@${manifest.version} to registry...`);

  let result;
  try {
    result = await postJson(REGISTRY_URL, token, payload);
  } catch (err) {
    console.error(`\n❌ Network error: ${err.message}\n`);
    process.exit(1);
  }

  if (result.status === 200 || result.status === 201) {
    console.log(`\n✅ Published successfully: ${manifest.id}@${manifest.version}`);
    if (result.body?.url) console.log(`   Registry URL: ${result.body.url}`);
    console.log();
  } else if (result.status === 401 || result.status === 403) {
    console.error(`\n❌ Authentication failed (HTTP ${result.status}).`);
    console.error('Your token may have expired. Run: pilotgentic login\n');
    process.exit(1);
  } else if (result.status === 409) {
    console.error(`\n❌ Version conflict (HTTP 409): ${manifest.id}@${manifest.version} already exists.`);
    console.error('Bump the version in plugin.json and try again.\n');
    process.exit(1);
  } else {
    const detail = typeof result.body === 'object' ? JSON.stringify(result.body) : result.body;
    console.error(`\n❌ Registry returned HTTP ${result.status}: ${detail}\n`);
    process.exit(1);
  }
}

#!/usr/bin/env node
// cli/index.js — Entry point for pilotgentic-sdk CLI

import { createAgent } from './create.js';
import { validatePackage } from './validate.js';
import { publishPackage } from './publish.js';

const [,, command, ...args] = process.argv;

const USAGE = `
pilotgentic-sdk — PilotGentic Agent Skill SDK

Usage:
  pilotgentic-sdk create <agent-id>   Scaffold a new agent skill package
  pilotgentic-sdk validate <path>     Validate a package directory
  pilotgentic-sdk publish <path>      Publish a validated package to the registry
  pilotgentic-sdk --help              Show this help message

Examples:
  pilotgentic-sdk create my-slack-agent
  pilotgentic-sdk validate ./my-slack-agent/
  pilotgentic-sdk publish ./my-slack-agent/
`.trim();

async function main() {
  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE);
    process.exit(0);
  }

  switch (command) {
    case 'create':
      if (!args[0]) { console.error('Error: agent-id is required.\nUsage: pilotgentic-sdk create <agent-id>'); process.exit(1); }
      await createAgent(args[0]);
      break;
    case 'validate':
      if (!args[0]) { console.error('Error: path is required.\nUsage: pilotgentic-sdk validate <path>'); process.exit(1); }
      await validatePackage(args[0]);
      break;
    case 'publish':
      if (!args[0]) { console.error('Error: path is required.\nUsage: pilotgentic-sdk publish <path>'); process.exit(1); }
      await publishPackage(args[0]);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });

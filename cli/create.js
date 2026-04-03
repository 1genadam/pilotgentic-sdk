// cli/create.js — Scaffolds a new agent skill package

import fs from 'fs';
import path from 'path';

const AGENT_MD_TEMPLATE = (agentId) => `---
name: ${agentId}
description: >
  Use this agent when you need to automate tasks in the target application.
  Describe the specific use case and target app here (edit this before publishing).
tools:
  - mcp__pilotgentic__pilotgentic_screenshot
  - mcp__pilotgentic__pilotgentic_ax_tree
  - mcp__pilotgentic__pilotgentic_click
  - mcp__pilotgentic__pilotgentic_type
  - mcp__pilotgentic__pilotgentic_key
  - mcp__pilotgentic__pilotgentic_launch
---

## App Knowledge

<!-- Describe the target app here -->
<!-- Include: app name, URL or bundle ID, key views/routes, known quirks -->

Target app: TODO
URL / Bundle ID: TODO

Key views:
- Main view: TODO
- Settings: TODO

## Your Workflow

1. Take a screenshot to see the current state
2. Use the accessibility tree to identify interactive elements
3. Click or type to perform the required action
4. Take a follow-up screenshot to confirm the action succeeded
5. Report the result to the user

## Task-Specific Instructions

<!-- Add sections for specific tasks this agent handles -->
<!-- Example: "File Operations", "Navigation", "Form Filling" -->

### Navigation

TODO: Describe how to navigate the app

### Form Filling

TODO: Describe how to fill out forms if applicable
`;

const PLUGIN_JSON_TEMPLATE = (agentId) => ({
  name: agentId,
  id: agentId,
  version: '1.0.0',
  type: 'agent',
  description: 'TODO: describe what this agent does in one sentence',
  agent: {
    claude_agent_file: `${agentId}.md`,
  },
});

function validateAgentId(agentId) {
  if (!/^[a-z][a-z0-9-]*$/.test(agentId)) {
    throw new Error(
      `Invalid agent-id "${agentId}". Must match: ^[a-z][a-z0-9-]*$\n` +
      'Use lowercase letters, digits, and hyphens only. Must start with a letter.'
    );
  }
}

export async function createAgent(agentId) {
  validateAgentId(agentId);

  const dir = path.resolve(agentId);

  if (!dir.startsWith(process.cwd())) {
    console.error('❌ Agent ID resolves outside the current directory. Aborting.');
    process.exit(1);
  }

  if (fs.existsSync(dir)) {
    console.error(`Error: Directory "${agentId}/" already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(dir, { recursive: true });

  // Write agent .md file
  const mdPath = path.join(dir, `${agentId}.md`);
  fs.writeFileSync(mdPath, AGENT_MD_TEMPLATE(agentId), 'utf8');

  // Write plugin.json
  const jsonPath = path.join(dir, 'plugin.json');
  fs.writeFileSync(jsonPath, JSON.stringify(PLUGIN_JSON_TEMPLATE(agentId), null, 2) + '\n', 'utf8');

  console.log(`\n✅ Created agent skill package: ${agentId}/`);
  console.log(`\n  Files created:`);
  console.log(`    ${agentId}/${agentId}.md     — system prompt + frontmatter`);
  console.log(`    ${agentId}/plugin.json        — plugin manifest`);
  console.log(`\n  Next steps:`);
  console.log(`    1. Edit ${agentId}/${agentId}.md — update description, app knowledge, and workflow`);
  console.log(`    2. Edit ${agentId}/plugin.json   — update the description field`);
  console.log(`    3. Validate:  pilotgentic-sdk validate ./${agentId}/`);
  console.log(`    4. Publish:   pilotgentic-sdk publish ./${agentId}/\n`);
}

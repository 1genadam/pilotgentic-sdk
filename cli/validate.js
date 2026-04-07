// cli/validate.js — Validates a package directory against AGENT-SPEC.md criteria

import fs from 'fs';
import path from 'path';

function check(label, passed, detail = '') {
  const icon = passed ? '✅' : '❌';
  const msg = detail ? `${icon} ${label}: ${detail}` : `${icon} ${label}`;
  console.log(msg);
  return passed;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const parts = content.split('---');
  if (parts.length < 3) return null;
  return { frontmatter: parts[1], body: parts.slice(2).join('---') };
}

const ALLOWED_TOOL_PATTERNS = [
  /^mcp__pilotgentic__pilotgentic_\w+$/,
  /^Bash$/,
  /^Read$/,
  /^Write$/,
];

function parseToolsFromFrontmatter(fm) {
  const lines = fm.split('\n');
  const tools = [];
  let inTools = false;
  for (const line of lines) {
    if (/^tools\s*:/.test(line) || /^allowed-tools\s*:/.test(line)) { inTools = true; continue; }
    if (inTools) {
      const itemMatch = line.match(/^\s+-\s+(.+)$/);
      if (itemMatch) { tools.push(itemMatch[1].trim()); continue; }
      if (/^\S/.test(line.trim()) && line.trim().length > 0) break;
    }
  }
  return tools;
}

export async function validatePackage(pkgPath, silent = false) {
  const dir = path.resolve(pkgPath);
  const log = silent ? () => {} : console.log;
  const originalCheck = check;
  const doCheck = silent
    ? (label, passed, detail) => passed
    : originalCheck;

  if (!silent) console.log(`\nValidating: ${dir}\n`);

  let allPassed = true;
  const fail = (label, detail) => { allPassed = false; return doCheck(label, false, detail); };
  const pass = (label, detail) => doCheck(label, true, detail);

  // 1. plugin.json exists
  const pluginPath = path.join(dir, 'plugin.json');
  if (!fs.existsSync(pluginPath)) {
    fail('plugin.json exists', 'file not found');
    if (!silent) console.log('\n❌ Validation failed.\n');
    return false;
  }
  pass('plugin.json exists');

  // 2. plugin.json is valid JSON
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
    pass('plugin.json is valid JSON');
  } catch (e) {
    fail('plugin.json is valid JSON', e.message);
    if (!silent) console.log('\n❌ Validation failed.\n');
    return false;
  }

  // 3. Required fields (type-aware: agent requires 'agent' key, skill requires 'skill' key)
  const baseRequired = ['name', 'id', 'version', 'type', 'description'];
  const missingBase = baseRequired.filter(f => !(f in manifest));
  if (missingBase.length > 0) {
    fail('Required fields present', `missing: ${missingBase.join(', ')}`);
    allPassed = false;
  } else {
    pass('Required fields present');
  }

  // 4. type-specific file reference
  const isSkill = manifest.type === 'skill';
  const contentFile = isSkill
    ? manifest?.skill?.slash_command_file
    : manifest?.agent?.claude_agent_file;
  const contentLabel = isSkill ? 'skill.slash_command_file' : 'agent.claude_agent_file';
  if (!contentFile) {
    fail(`${contentLabel} present`, `missing from ${isSkill ? 'skill' : 'agent'} object`);
    allPassed = false;
  } else {
    pass(`${contentLabel} present`, contentFile);
  }
  // Keep backward-compat alias so checks below still work
  const agentFile = contentFile;

  // 5. id matches regex
  const idOk = /^[a-z][a-z0-9-]*$/.test(manifest.id || '');
  idOk ? pass('id matches ^[a-z][a-z0-9-]*$', manifest.id) : fail('id matches ^[a-z][a-z0-9-]*$', `got: "${manifest.id}"`);
  if (!idOk) allPassed = false;

  // 6. version matches semver
  const versionOk = /^\d+\.\d+\.\d+$/.test(manifest.version || '');
  versionOk ? pass('version is semver', manifest.version) : fail('version is semver', `got: "${manifest.version}"`);
  if (!versionOk) allPassed = false;

  // 7. type === 'agent' | 'skill'
  const typeOk = manifest.type === 'agent' || manifest.type === 'skill';
  typeOk ? pass('type is "agent" or "skill"') : fail('type is "agent" or "skill"', `got: "${manifest.type}"`);
  if (!typeOk) allPassed = false;

  // 8. description length
  const descLen = (manifest.description || '').length;
  const descLenOk = descLen >= 30;
  descLenOk ? pass('description >= 30 chars', `${descLen} chars`) : fail('description >= 30 chars', `only ${descLen} chars`);
  if (!descLenOk) allPassed = false;

  // 9. .md file exists
  if (!agentFile) {
    fail('.md file exists', `cannot check — ${contentLabel} missing`);
    allPassed = false;
    if (!silent) console.log('\n❌ Validation failed.\n');
    return false;
  }

  const mdPath = path.join(dir, agentFile);
  if (!fs.existsSync(mdPath)) {
    fail('.md file exists', `not found: ${agentFile}`);
    allPassed = false;
    if (!silent) console.log('\n❌ Validation failed.\n');
    return false;
  }
  pass('.md file exists', agentFile);

  // 10. Frontmatter checks
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const parsed = parseFrontmatter(mdContent);

  if (!parsed) {
    fail('.md has frontmatter', 'must start with --- block');
    allPassed = false;
  } else {
    pass('.md has frontmatter');
    const fm = parsed.frontmatter;
    const hasName = /name\s*:/.test(fm);
    const hasDesc = /description\s*:/.test(fm);
    const hasTools = /tools\s*:/.test(fm) || /allowed-tools\s*:/.test(fm);
    hasName ? pass('frontmatter has name:') : (fail('frontmatter has name:'), allPassed = false);
    hasDesc ? pass('frontmatter has description:') : (fail('frontmatter has description:'), allPassed = false);
    hasTools ? pass('frontmatter has tools: or allowed-tools:') : (fail('frontmatter has tools: or allowed-tools:'), allPassed = false);

    // 13. Tool names match allowed patterns
    if (hasTools) {
      const toolsList = parseToolsFromFrontmatter(fm);
      const badTools = toolsList.filter(t => !ALLOWED_TOOL_PATTERNS.some(p => p.test(t)));
      if (badTools.length > 0) {
        fail('tool names match allowed patterns', `invalid: ${badTools.join(', ')}`);
        allPassed = false;
      } else {
        pass('tool names match allowed patterns', `${toolsList.length} tool(s) verified`);
      }
    }

    // 11. .md description quality
    const descMatch = fm.match(/description\s*:([^\n]*(?:\n[ \t]+[^\n]*)*)/);
    const mdDesc = descMatch ? descMatch[0].replace(/description\s*:\s*>?\s*/, '').replace(/\n\s+/g, ' ').trim() : '';
    const mdDescLen = mdDesc.length;
    const mdDescLenOk = mdDescLen >= 30;
    mdDescLenOk ? pass('.md description >= 30 chars', `${mdDescLen} chars`) : fail('.md description >= 30 chars', `${mdDescLen} chars`);
    if (!mdDescLenOk) allPassed = false;

    // 12. .md body word count
    const bodyWords = countWords(parsed.body);
    const bodyOk = bodyWords >= 100;
    bodyOk ? pass('.md body >= 100 words', `${bodyWords} words`) : fail('.md body >= 100 words', `only ${bodyWords} words`);
    if (!bodyOk) allPassed = false;
  }

  if (!silent) {
    console.log(allPassed ? '\n✅ All checks passed.\n' : '\n❌ Validation failed — fix the issues above.\n');
  }

  if (!allPassed && !silent) process.exit(1);
  return allPassed;
}

# PilotGentic Agent Skills — Minimum Specification

This document defines what an agent skill **must** satisfy to be valid for local use,
community sharing, and (future) marketplace submission. Think of this as the review
criteria the automated scanner and human reviewers apply.

---

## 1. Required Files

Every agent skill package must contain exactly these two files:

| File | Location | Purpose |
|------|----------|---------|
| `<agent-id>.md` | `~/.pilotgentic/agents/` | System prompt + YAML frontmatter |
| `<agent-id>.json` | `~/.pilotgentic/docked/` | Plugin manifest |

Both filenames must use the same `<agent-id>` slug: lowercase, hyphens only, no spaces.

---

## 2. plugin.json — Required Fields

```json
{
  "name":        "string — display name shown in Agents panel (required)",
  "id":          "string — lowercase-hyphen slug matching filename (required)",
  "version":     "string — semver: \"1.0.0\" (required)",
  "type":        "\"agent\" (required — must be exactly this string)",
  "description": "string — one sentence, ≥ 20 chars, shown in Agents panel (required)",
  "agent": {
    "claude_agent_file": "string — filename of the .md file (required)"
  }
}
```

**Optional but recommended:**

```json
{
  "icon":    "SF Symbol name, e.g. \"person.crop.rectangle\"",
  "tier":    "\"free\" | \"pro\" | \"enterprise\" — defaults to \"free\"",
  "mcp_tools": ["array of pilotgentic_* tool names the agent uses"],
  "metadata": {
    "target_app": "human-readable app name",
    "target_url": "localhost:PORT or com.apple.BundleID",
    "tags":       ["keyword", "array"]
  }
}
```

**Validation rules:**

- `id` must match `^[a-z][a-z0-9-]*$`
- `version` must be valid semver (`MAJOR.MINOR.PATCH`)
- `type` must be exactly `"agent"` (not `"skill"`, not `"tool"`)
- `agent.claude_agent_file` must match the actual `.md` filename

---

## 3. Agent .md — Required Frontmatter

```yaml
---
name: agent-id          # matches plugin.json "id" (required)
description: >          # required — see quality bar below
  Use this agent when...
tools:                  # required — at least one tool
  - mcp__pilotgentic__pilotgentic_screenshot
---
```

**`description:` quality bar (intent matching depends on this):**

- Minimum 30 characters
- Must start with "Use this agent when" or equivalent triggering condition
- Must name the target application or domain
- Must not overlap with the description of another installed agent
- Include at least one `<example>` block with a realistic user request

**`tools:` rules:**

- Must list only tools the agent actually uses
- Format: `mcp__pilotgentic__pilotgentic_<toolname>` for PilotGentic tools
- `Bash` and `Read` are built-in Claude CLI tools — list by name only if needed
- Do not request `Bash` unless shell commands are essential to the agent's task
- Do not request `Write` unless the agent needs to create or modify files

**Minimum recommended tool set for any GUI agent:**

```yaml
tools:
  - mcp__pilotgentic__pilotgentic_screenshot
  - mcp__pilotgentic__pilotgentic_ax_tree
  - mcp__pilotgentic__pilotgentic_click
  - mcp__pilotgentic__pilotgentic_type
  - mcp__pilotgentic__pilotgentic_key
  - mcp__pilotgentic__pilotgentic_launch
```

---

## 4. System Prompt — Required Sections

The body of the `.md` file (after frontmatter) must include:

| Section | Purpose |
|---------|---------|
| **App Knowledge** | App name, URL/bundle ID, key routes or views, known quirks |
| **Your Workflow** | Numbered step-by-step workflow the agent follows |
| At least one task-specific section | e.g. "File Operations", "Navigation", "Form Filling" |

**Minimum body length:** 100 words.

**Prohibited content (security):**

- No external URLs outside `metadata.target_url`
- No shell commands containing: `rm`, `curl`, `wget`, `sudo`, `chmod`, `ssh`, `scp`, `nc`, `python -c`
- No file path references to: `~/.ssh`, `~/.aws`, `~/.gnupg`, `/etc/passwd`, `~/.env`
- No instructions to "send", "POST", "upload", or "base64 encode" user data
- No instructions that override or contradict the user's stated intent

---

## 5. Scope Rules

### One Agent = One App

- Controls exactly one application or closely related set of views
- `target_app` in metadata names exactly one app
- Agent description does not claim to handle multiple unrelated apps

### Size Limits

| File | Limit | Action if exceeded |
|------|-------|--------------------|
| `plugin.json` | 10 KB | Reduce metadata |
| `agent.md` | 50 KB | Split into multiple agents |
| Total package | 100 KB | Remove unnecessary training data |

### Tool Scope

| Risk level | Tool combination | Requirement |
|------------|-----------------|-------------|
| Low | screenshot + ax_tree + click + type + key + launch + scroll | Auto-approved |
| Medium | + Read | Must document which paths are read and why |
| Medium | + pilotgentic_click + Bash | Must document all shell commands used |
| High | Bash + any network tool | Manual review required |
| Critical | Bash + Read + network | Blocked — refactor to remove combination |

---

## 6. Versioning

- Initial release: `"version": "1.0.0"`
- Bug fixes / prompt improvements: increment PATCH (`1.0.1`)
- New capabilities added: increment MINOR (`1.1.0`)
- Breaking change (renamed tools, restructured workflow): increment MAJOR (`2.0.0`)
- Every version update to a published package re-triggers security review

---

## 7. Validation Checklist

Run these before sharing or submitting:

```bash
# 1. plugin.json is valid JSON
python3 -c "import json; json.load(open('your-agent.json')); print('✅ valid JSON')"

# 2. Required fields present
python3 -c "
import json
m = json.load(open('your-agent.json'))
required = ['name','id','version','type','description','agent']
missing = [f for f in required if f not in m]
print('Missing:', missing if missing else '✅ none')
assert m.get('type') == 'agent', '❌ type must be \"agent\"'
print('✅ type correct')
"

# 3. Symlink exists and resolves
ls -la ~/.claude/agents/your-agent-id.md

# 4. Frontmatter parses
python3 -c "
content = open('your-agent-id.md').read()
assert content.startswith('---'), '❌ no frontmatter'
parts = content.split('---', 2)
assert len(parts) >= 3, '❌ frontmatter not closed'
print('✅ frontmatter present')
import re
assert re.search(r'name:', parts[1]), '❌ missing name:'
assert re.search(r'description:', parts[1]), '❌ missing description:'
assert re.search(r'tools:', parts[1]), '❌ missing tools:'
print('✅ required frontmatter fields present')
"

# 5. Agent activates in Claude CLI
# Start a new Claude session and describe a task the agent handles.
# Verify Claude routes to the agent (not general assistant mode).
```

---

## 8. Community Submission (v3 — coming soon)

When the marketplace launches, submitted packages will additionally be checked by the
automated security scanner (`security-scanner.js`) against all criteria in section 5.
Packages that pass auto-review (risk level: low) are published immediately. Medium and
above enter the manual review queue.

Publisher requirements for first submission:
- GitHub account linked to PilotGentic account
- At least one locally-tested and working agent (passes checklist above)
- README.md in the package root describing the agent and its capabilities

See `agents/README.md` for the full build guide.

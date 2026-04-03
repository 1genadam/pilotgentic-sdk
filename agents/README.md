# PilotGentic Agent Skills SDK

How to build, test, and publish agent skills for the PilotGentic community.

---

## What is an Agent Skill?

An Agent Skill is an installable, trained agent that knows a specific app's UI, routes, and workflows. When a user asks Claude CLI for help with that app, the agent skill activates automatically -- bringing app-specific knowledge and PilotGentic MCP tool access to the conversation.

Agent skills are:
- **Portable**: Install on any Mac with PilotGentic
- **Auto-discovered**: Claude CLI finds them in `~/.claude/agents/`
- **App-specific**: One agent = one app = one responsibility
- **MCP-powered**: Full desktop control via PilotGentic's 46+ MCP tools

Unlike docked skills (which add individual MCP tools), agent skills add an entire AI persona with baked-in app knowledge that Claude CLI delegates to when the user's request matches the agent's description.

---

## Directory Structure

A well-formed agent skill package has two files:

```
~/.pilotgentic/docked/my-agent.json     # Plugin manifest (type: "agent")
~/.pilotgentic/agents/my-agent.md       # Agent markdown file (knowledge + tools)
~/.claude/agents/my-agent.md            # Auto-created symlink (by PilotGentic)
```

When you drop a `plugin.json` into `~/.pilotgentic/docked/`, PilotGentic's docked-tool-indexer:
1. Reads the `agent.claude_agent_file` field
2. Finds the `.md` source in `~/.pilotgentic/agents/`
3. Creates a symlink in `~/.claude/agents/`
4. Indexes the agent for semantic search

---

## plugin.json Reference

The plugin manifest tells PilotGentic about your agent.

```json
{
  "name": "My App Agent",
  "id": "my-app-agent",
  "version": "1.0.0",
  "type": "agent",
  "icon": "sf-desktopcomputer",
  "tier": "free",
  "description": "What this agent does -- shown in the Agents panel",
  "agent": {
    "claude_agent_file": "my-app-agent.md"
  },
  "mcp_tools": [
    "pilotgentic_screenshot",
    "pilotgentic_ax_tree",
    "pilotgentic_click"
  ],
  "metadata": {
    "target_app": "My Application",
    "target_url": "localhost:3000",
    "tags": ["web", "dashboard"]
  }
}
```

### Fields

| Field | Required | Type | Description |
|---|---|---|---|
| `name` | yes | string | Human-readable agent name |
| `id` | yes | string | Unique identifier, lowercase with hyphens |
| `version` | yes | string | Semver version string |
| `type` | yes | string | Must be `"agent"` |
| `icon` | no | string | SF Symbol name (prefix with `sf-` for PilotGentic UI) |
| `tier` | no | string | `"free"` (default), `"pro"`, or `"max"` |
| `description` | yes | string | What the agent does (shown in Agents panel) |
| `agent.claude_agent_file` | yes | string | Filename of the agent `.md` file |
| `mcp_tools` | no | string[] | PilotGentic MCP tools the agent uses (informational) |
| `metadata.target_app` | no | string | Name of the target application |
| `metadata.target_url` | no | string | URL or bundle ID of the target app |
| `metadata.tags` | no | string[] | Tags for search and categorization |
| `metadata.bundled` | no | boolean | `true` if shipped with PilotGentic |

---

## Agent .md File Reference

The agent markdown file is placed in `~/.pilotgentic/agents/` and symlinked to `~/.claude/agents/`. It uses YAML frontmatter to declare metadata, followed by the agent's system prompt.

### Frontmatter Fields

```yaml
---
name: my-app-agent
description: >
  Use this agent when the user needs to interact with My Application,
  manage data, or automate workflows through the desktop interface.

<example>
Context: User wants to check a dashboard
user: "Show me the sales numbers from last week"
assistant: "I'll navigate to the dashboard and pull up the sales data."
</example>

tools:
  - mcp__pilotgentic__pilotgentic_screenshot
  - mcp__pilotgentic__pilotgentic_ax_tree
  - mcp__pilotgentic__pilotgentic_click
  - mcp__pilotgentic__pilotgentic_type
  - mcp__pilotgentic__pilotgentic_key
  - mcp__pilotgentic__pilotgentic_launch
  - mcp__pilotgentic__pilotgentic_scroll
  - Read
  - Bash
---
```

| Field | Required | Description |
|---|---|---|
| `name` | yes | Agent identifier (matches plugin.json `id`) |
| `description` | yes | **Critical**: Claude CLI uses this for intent matching. Write it as a trigger description -- "Use this agent when..." |
| `<example>` | recommended | Example user/assistant exchanges that help Claude decide when to invoke this agent |
| `tools` | optional | Tool whitelist. MCP tools use `mcp__pilotgentic__toolname` format. If omitted, agent gets access to all tools. |

### How Description Triggers Intent Matching

Claude CLI reads the `description` field to decide which agent to delegate to. Write descriptions that:
- Start with "Use this agent when..."
- List specific trigger scenarios
- Include the app name and key use cases
- Mention relevant keywords users would naturally say

**Good**: `"Use this agent when the user needs to interact with the RAG database browser, verify product cards, check taxonomy data, or manage catalog entries."`

**Bad**: `"An agent for RAG stuff."`

### How to Write Effective App Context

The body of the `.md` file (after the frontmatter) becomes the agent's system prompt. Include:

1. **App knowledge**: URLs, routes, key UI elements, page layouts
2. **Known quirks**: Load times, UI behaviors, workarounds
3. **Standard workflow**: Step-by-step process the agent should follow
4. **Tool usage patterns**: Which PilotGentic tools to use for what

---

## The Training Path

### Using the Training Wizard (GUI)

PilotGentic includes a built-in Training Wizard accessible from the Agents panel:
1. Click "Agents >" in the side menu
2. Click "+ Train New Agent"
3. Follow the 4-step wizard: App Info -> Context -> Keywords -> Create
4. The wizard writes both files and creates the symlink automatically

### Using pilotgentic_ui_recorder (CLI)

For portable workflow recordings, use the UI recorder MCP tool:

```
pilotgentic_ui_recorder op:"start" name:"my-workflow"
pilotgentic_ui_recorder op:"add_action" action_type:"click_element" label:"Submit" x:450 y:320
pilotgentic_ui_recorder op:"add_action" action_type:"navigate_url" url:"http://localhost:3000/dashboard"
pilotgentic_ui_recorder op:"stop"
```

### How AX Paths Work

Accessibility (AX) paths identify UI elements by their role and label in the accessibility tree, rather than by screen coordinates. Format: `"AppName|AXRole:AXLabel|AXRole:AXLabel|..."`.

**Why they matter**: AX paths make recordings portable across different screen resolutions, window positions, and display scales. An AX path like `"Chrome|AXWebArea:|AXButton:Submit"` works on any Mac, regardless of where Chrome is positioned.

**Current state**: AX path resolution exists in the Swift layer (`WorkerSemanticReplay.swift`) via the `resolve_element` IPC command. MCP-level support for AX paths in recordings is planned for v2.

### Testing Your Agent

1. Restart PilotGentic (or wait for the file watcher to pick up changes)
2. Open a new Claude CLI session
3. Ask Claude something that matches your agent's description
4. Verify Claude delegates to your agent and it works correctly
5. Check `~/.claude/agents/` for the symlink

---

## Docking Your Agent (Local Install)

### Step 1: Write the agent .md file

Save to `~/.pilotgentic/agents/my-agent.md` with frontmatter and system prompt.

### Step 2: Write the plugin.json

Save to `~/.pilotgentic/docked/my-agent.json` with `"type": "agent"`.

### Step 3: Verify auto-discovery

PilotGentic's file watcher detects the new JSON and:
- Creates symlink at `~/.claude/agents/my-agent.md`
- Indexes the agent for semantic search
- Shows the agent in the Agents panel

```bash
# Verify symlink
ls -la ~/.claude/agents/my-agent.md

# Verify agent content
head -5 ~/.claude/agents/my-agent.md

# Verify plugin manifest
python3 -c "import json; print(json.load(open('$HOME/.pilotgentic/docked/my-agent.json'))['name'])"
```

---

## Publishing to Community (v3)

Community publishing is planned for a future release. The flow will be:

1. Package your agent skill (plugin.json + agent.md)
2. Publish as a GitHub repository
3. Submit to the PilotGentic Agent Registry via pull request
4. Users install via `pilotgentic install <agent-name>` or the Agents panel

For now, share your agent skills by publishing the two files as a GitHub repo and linking to it in [the SDK skills registry](../SKILLS.md).

---

## Example: Complete Working Agent Skill -- Finder Agent

This example creates an agent that automates Finder operations.

### `finder-agent.json` (drop in `~/.pilotgentic/docked/`)

```json
{
  "name": "Finder Agent",
  "id": "finder-agent",
  "version": "1.0.0",
  "type": "agent",
  "icon": "sf-folder.fill",
  "tier": "free",
  "description": "Automates Finder file management -- navigate folders, create directories, move files, and organize the desktop.",
  "agent": {
    "claude_agent_file": "finder-agent.md"
  },
  "mcp_tools": [
    "pilotgentic_screenshot",
    "pilotgentic_ax_tree",
    "pilotgentic_click",
    "pilotgentic_type",
    "pilotgentic_key",
    "pilotgentic_launch",
    "pilotgentic_scroll"
  ],
  "metadata": {
    "target_app": "Finder",
    "target_url": "com.apple.finder",
    "tags": ["finder", "files", "folders", "desktop", "file-management"]
  }
}
```

### `finder-agent.md` (drop in `~/.pilotgentic/agents/`)

```markdown
---
name: finder-agent
description: >
  Use this agent when the user needs to manage files in Finder, navigate
  folders, create directories, organize the desktop, move or rename files,
  or perform any file system task through the macOS Finder GUI.

<example>
Context: User wants to organize files
user: "Create a new folder called 'Projects' on the Desktop and move all .pdf files there"
assistant: "I'll open Finder, create the folder, and move the PDF files."
</example>

tools:
  - mcp__pilotgentic__pilotgentic_screenshot
  - mcp__pilotgentic__pilotgentic_ax_tree
  - mcp__pilotgentic__pilotgentic_click
  - mcp__pilotgentic__pilotgentic_type
  - mcp__pilotgentic__pilotgentic_key
  - mcp__pilotgentic__pilotgentic_launch
  - mcp__pilotgentic__pilotgentic_scroll
  - Read
  - Bash
---

You are a Finder specialist agent with physical Mac desktop control via PilotGentic.

## App Knowledge
- **Bundle ID**: com.apple.finder
- **Type**: Native macOS application
- **Key shortcuts**: Cmd+N (new window), Cmd+Shift+N (new folder), Cmd+Delete (trash), Cmd+I (get info)
- **Navigation**: Sidebar shows Favorites, iCloud, Locations. Use Cmd+Shift+G for "Go to Folder"
- **View modes**: Icons (Cmd+1), List (Cmd+2), Columns (Cmd+3), Gallery (Cmd+4)
- **Known quirk**: Column view can be slow with large directories -- prefer List view for navigation
- **Known quirk**: Drag-and-drop requires precise coordinate targeting -- use Cmd+C/Cmd+V as fallback

## Your Workflow
1. Take a screenshot to see current Finder state
2. Use pilotgentic_launch with "Finder" to ensure it's frontmost
3. Use pilotgentic_ax_tree to find sidebar items, file lists, and buttons
4. Navigate using clicks on sidebar items or Cmd+Shift+G for path entry
5. Perform file operations using keyboard shortcuts or context menus
6. Verify results with follow-up screenshots

## File Operations
- **New folder**: Cmd+Shift+N, then type name, then Enter
- **Rename**: Click file, press Enter, type new name, press Enter
- **Move**: Cmd+C on source, navigate to destination, Cmd+Option+V (move)
- **Copy**: Cmd+C on source, navigate to destination, Cmd+V
- **Delete**: Select file, Cmd+Delete
- **Select multiple**: Cmd+Click for individual, Shift+Click for range
```

See the complete example in [`examples/finder-agent/`](./examples/finder-agent/).

---

## Anti-Monolithic Design Rules

### One Agent = One App = One Responsibility

Each agent skill should:
- Control exactly one application (or closely related set of pages/views)
- Have a clear, specific description that doesn't overlap with other agents
- Be independently installable and testable

### When to Split into Multiple Agents

Split when:
- Your agent handles two completely different apps (e.g., Finder AND Chrome)
- Different parts of the same app have unrelated workflows (e.g., "Chrome Dev Tools Agent" vs "Chrome Browsing Agent")
- The agent .md file exceeds ~200 lines of app context

Keep together when:
- All functionality is within a single app
- Routes/views share common navigation patterns
- The agent naturally uses the same workflow for all tasks

---

## Testing Checklist

Before sharing your agent skill:

- [ ] **Symlink exists**: `ls -la ~/.claude/agents/<agent-id>.md` shows valid symlink
- [ ] **Plugin manifest parses**: `python3 -c "import json; json.load(open('...'))"` succeeds
- [ ] **Agent activates**: Claude CLI delegates to the agent when you describe a matching task
- [ ] **Screenshots work**: Agent successfully calls `pilotgentic_screenshot`
- [ ] **AX tree works**: Agent can discover UI elements via `pilotgentic_ax_tree`
- [ ] **Navigation works**: Agent can open the target app and navigate to key pages
- [ ] **Core workflow completes**: Agent can perform its primary task end-to-end
- [ ] **Error handling**: Agent recovers gracefully when UI elements aren't found
- [ ] **Description triggers correctly**: Agent activates for relevant requests and does NOT activate for unrelated requests

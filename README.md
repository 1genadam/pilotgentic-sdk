# PilotGentic Skills SDK

PilotGentic is an MCP (Model Context Protocol) server for macOS that gives AI agents physical control of the desktop — click, type, take screenshots, traverse the accessibility tree, manage files, run shell commands, and more — via 46+ tools. It runs as a native macOS app paired with a Node.js MCP server, and connects to any MCP-compatible AI client (Claude Desktop, Cursor, etc.).

---

## Build for PilotGentic

PilotGentic supports **docked skills**: community-built extensions that appear as first-class MCP tools inside every user session. A skill is a small JSON manifest file that tells PilotGentic either a shell command to run or an HTTP endpoint to call. No Swift, no Xcode, no app recompilation required.

### How docked skills work

1. A skill manifest (`manifest.json`) describes one or more tools.
2. The user drops the manifest into `~/.pilotgentic/docked/your-skill-name/manifest.json`.
3. PilotGentic picks up the manifest at launch and registers each tool with the MCP server.
4. The AI agent can now call your skill by its `tool` identifier, just like any built-in tool.

Each skill maps to either:
- A **shell command** (`command`) — PilotGentic runs the command, captures stdout as JSON, returns it.
- An **HTTP handler** (`handler_url`) — PilotGentic POSTs or GETs your local server, returns the JSON response.

---

## Skill Manifest Format

Drop a `manifest.json` in `~/.pilotgentic/docked/<your-skill>/` with this structure:

```json
{
  "name": "My Skill Pack",
  "version": "1.0.0",
  "author": "your-github-handle",
  "skills": [
    {
      "tool": "my_tool_id",
      "name": "My Tool",
      "description": "What this tool does — the AI reads this to decide when to use it.",
      "category": "productivity",
      "tier": "free",
      "command": "echo '{\"success\": true}'",
      "example_prompt": "run my tool"
    }
  ]
}
```

Full JSON Schema: see [`skill-schema.json`](./skill-schema.json).

### Fields

| Field | Required | Description |
|---|---|---|
| `name` | yes | Human-readable name for the skill pack |
| `version` | no | Semver version string |
| `author` | no | GitHub handle or name |
| `skills` | yes | Array of skill definitions |

### Skill fields

| Field | Required | Description |
|---|---|---|
| `tool` | yes | Unique identifier, lowercase `snake_case` |
| `name` | yes | Display name shown in Claude |
| `description` | yes | What the skill does — the AI agent reads this |
| `category` | no | Grouping label (e.g. `browser`, `productivity`, `dev`) |
| `tier` | no | `free` (default), `pro`, or `max` |
| `command` | one of | Shell command to run |
| `handler_url` | one of | HTTP endpoint to call |
| `handler_method` | no | `GET` or `POST` (default `GET`) |
| `example_prompt` | no | Example phrase that would trigger this skill |

Every skill must have exactly one of `command` or `handler_url`.

---

## Examples

### (a) Simple shell command skill

The simplest possible skill — runs a shell command and returns its output as JSON.

**`~/.pilotgentic/docked/hello-world/manifest.json`**

```json
{
  "name": "Hello World",
  "version": "1.0.0",
  "author": "your-github-handle",
  "skills": [{
    "tool": "hello_world",
    "name": "Hello World",
    "description": "Returns a hello message. Simple example of a command-based skill.",
    "category": "example",
    "tier": "free",
    "command": "echo '{\"success\": true, \"message\": \"Hello from PilotGentic!\"}'",
    "example_prompt": "say hello"
  }]
}
```

Full example: [`examples/hello-world/`](./examples/hello-world/)

### (b) HTTP handler skill

Calls a local HTTP server you run yourself. Useful for skills that need persistent state, external APIs, or complex logic.

**`~/.pilotgentic/docked/my-http-skill/manifest.json`**

```json
{
  "name": "My HTTP Skill",
  "version": "1.0.0",
  "author": "your-github-handle",
  "skills": [{
    "tool": "my_http_skill",
    "name": "My HTTP Skill",
    "description": "Calls a local HTTP server.",
    "category": "example",
    "tier": "free",
    "handler_url": "http://localhost:8080/my-skill",
    "handler_method": "POST",
    "example_prompt": "run my custom skill"
  }]
}
```

A minimal Python reference server is at [`examples/http-skill/server.py`](./examples/http-skill/server.py).

Full example: [`examples/http-skill/`](./examples/http-skill/)

---

## How to Install a Skill

1. Download or clone the skill repository.
2. Copy (or symlink) the skill folder into `~/.pilotgentic/docked/`:
   ```sh
   cp -r hello-world ~/.pilotgentic/docked/
   ```
3. Restart PilotGentic (quit and reopen from the menu bar).
4. The new tool appears automatically in your MCP session.

---

## How to Share Your Skill

1. Publish your skill as a public GitHub repository.
2. Open a pull request to this repo adding a row to [SKILLS.md](./SKILLS.md).
3. Use the [new-skill issue template](.github/ISSUE_TEMPLATE/new-skill.md) if you prefer to submit via issue first.

---

## Community — Open Claw Ecosystem

PilotGentic is part of the **Open Claw** ecosystem: open, composable AI agent extensions for macOS. Skills built here work with any Open Claw-compatible host. Share, remix, and extend.

- Registry: [SKILLS.md](./SKILLS.md)
- Issues & discussion: [GitHub Issues](https://github.com/1genadam/pilotgentic-sdk/issues)

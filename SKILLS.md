# PilotGentic Skills Registry

Community-built skills for PilotGentic. Each row is a dockable skill pack you can install in minutes.

## How to install a skill

1. Download the skill repository.
2. Copy the skill folder into `~/.pilotgentic/docked/`:
   ```sh
   cp -r <skill-folder> ~/.pilotgentic/docked/
   ```
3. Restart PilotGentic.

## How to add your skill

Open a pull request adding a row to the table below. Include:
- **Name** — skill pack name with a link to your repo
- **Author** — your GitHub handle linked to your profile
- **Description** — one sentence, what it does
- **Install** — copy-paste shell command to install
- **Stars** — leave as `—` when submitting; maintainers update periodically

Alternatively, [open a new-skill issue](.github/ISSUE_TEMPLATE/new-skill.md) and a maintainer will add the row for you.

---

## Registry

| Name | Author | Description | Install | Stars |
|------|--------|-------------|---------|-------|
| [Console Maven Extension](https://github.com/1genadam/pilotgentic-sdk/tree/main/examples/hello-world) | [@1genadam](https://github.com/1genadam) | Example hello-world command skill included in this repo. | `cp -r examples/hello-world ~/.pilotgentic/docked/` | — |

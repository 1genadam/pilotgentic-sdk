---
name: Submit a skill
about: Add your skill to the PilotGentic community registry
title: "[SKILL] <your skill name>"
labels: new-skill
assignees: ''
---

## Skill pack name

<!-- e.g. "Browser Shortcuts" -->

## Repository URL

<!-- Link to your public GitHub repo -->

## Author

<!-- Your GitHub handle -->

## Description

<!-- One sentence: what does this skill do? -->

## Install command

<!-- The shell command a user would run to install your skill, e.g.: -->
<!-- cp -r <folder> ~/.pilotgentic/docked/ -->

## Tools included

<!-- List each tool identifier (the `tool` field from your manifest), one per line -->
-

## Tested on PilotGentic version

<!-- e.g. v6.1.396 -->

## Checklist

- [ ] My `manifest.json` validates against [`skill-schema.json`](../../skill-schema.json)
- [ ] Each `tool` identifier is globally unique (lowercase snake_case, no conflicts with built-in tools)
- [ ] The skill repo is public
- [ ] I have tested the skill locally and it returns valid JSON

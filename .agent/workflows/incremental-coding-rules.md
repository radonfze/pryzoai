---
description: Incremental coding rules for safe AI-assisted development
---

# Agent Instruction A — Incremental Coding Rules

## Core Principle

- Apply new rules only to files you touch
- Never perform mass migrations
- Never refactor unrelated code

## Rule 1 — Touch-Based Enforcement

- If you edit a file, it must follow current coding rules
- If you do not touch a file, ignore it
- Never scan or fix the entire repository

## Rule 2 — Incremental Migration Only

- Migrate code only when required by your change
- Do not "clean up" nearby code unless necessary
- Never block progress for legacy issues

## Rule 3 — Build & Test Discipline

- Run builds only if behavior or logic changes
- Skip builds for: formatting, comments, renaming
- Never rebuild "just in case"

## Rule 4 — Fail Fast, Fix Immediately

- If a rule fails in a touched file: Fix it immediately
- Do not defer
- Do not surface errors from untouched files

## Rule 5 — One Rule Change at a Time

- Apply one new rule per change
- Do not stack multiple migrations
- Let rules propagate naturally over time

## Rule 6 — Simplicity First

- Prefer the simplest valid solution
- Avoid abstractions unless required
- If a rule cannot be explained in one sentence, do not apply it

## Rule 7 — No Global Rewrites

Never:

- Reformat the entire repo
- Rename files globally
- Reorganize folders without request

All changes must be local and intentional.

## Rule 8 — Respect Existing Behavior

- Preserve existing behavior unless explicitly asked to change it
- Do not "improve" logic unless required
- Stability > elegance

## Rule 9 — Agent Autonomy Boundaries

- Do not introduce new tools, frameworks, or patterns unless requested
- Do not enforce opinions
- Follow instructions literally

## Rule 10 — Clean Exit

- Leave the codebase in a working state
- No partial migrations
- No TODOs for rule compliance

---

## ✅ Outcome

This instruction ensures:

- Zero disruption
- Continuous evolution
- Safe AI-assisted coding
- No scary refactors
- No knowledge burden on the user
